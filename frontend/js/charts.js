// Chart instances
let statusChartObj = null;
let picChartObj = null;

// Render Chart.js visual graphics
function renderCharts() {
    // Gather all temuan under filtered LHAs, then their recommendations
    let allFilteredTemuan = [];
    filteredLHA.forEach(lha => {
        allFilteredTemuan = allFilteredTemuan.concat(tabelTemuan.filter(t => t["Kode LHP"] === lha["Kode LHP"]));
    });
    let assocRecs = [];
    allFilteredTemuan.forEach(t => {
        assocRecs = assocRecs.concat(getRecommendationsForFinding(t["Kode Temuan"]));
    });
    const uniqueRecs = Array.from(new Set(assocRecs.map(r => r["Kode Rekomendasi"])))
        .map(id => assocRecs.find(r => r["Kode Rekomendasi"] === id));

    // Donut Chart - Status
    const statuses = { "TUNTAS": 0, "PROSES": 0, "PENDING": 0 };
    uniqueRecs.forEach(r => {
        const status = r.Status;
        if (statuses[status] !== undefined) {
            statuses[status]++;
        }
    });

    const statusCtx = document.getElementById('statusChart').getContext('2d');
    if (statusChartObj) statusChartObj.destroy();
    
    statusChartObj = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['TUNTAS (Selesai)', 'PROSES (Dalam Proses)', 'PENDING (Belum TL)'],
            datasets: [{
                data: [statuses["TUNTAS"], statuses["PROSES"], statuses["PENDING"]],
                backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                borderWidth: 3,
                borderColor: '#FFFBFE',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        padding: 15,
                        font: { family: 'Roboto', size: 11, weight: '500' }
                    }
                }
            }
        }
    });

    // Bar Chart - Recommendations per PIC
    const picCounts = {};
    uniqueRecs.forEach(r => {
        if (r.PIC) {
            r.PIC.split(',').forEach(p => {
                const cleanPic = p.trim();
                picCounts[cleanPic] = (picCounts[cleanPic] || 0) + 1;
            });
        }
    });

    const sortedPics = Object.entries(picCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);

    const picLabels = sortedPics.map(x => x[0]);
    const picData = sortedPics.map(x => x[1]);

    const picCtx = document.getElementById('picChart').getContext('2d');
    if (picChartObj) picChartObj.destroy();

    picChartObj = new Chart(picCtx, {
        type: 'bar',
        data: {
            labels: picLabels,
            datasets: [{
                label: 'Jumlah Rekomendasi',
                data: picData,
                backgroundColor: '#6750A4',
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Roboto', size: 10 } }
                },
                y: {
                    border: { display: false },
                    ticks: { stepSize: 1, font: { family: 'Roboto', size: 10 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
