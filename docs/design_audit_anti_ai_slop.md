# DESIGN AUDIT & REDESIGN PLAYBOOK

## Menghilangkan Kesan "AI Slop" pada Aplikasi Web

> **Tujuan:** mengaudit dan memperbaiki desain aplikasi secara
> menyeluruh agar terasa dirancang oleh tim produk yang matang---jelas,
> konsisten, khas, fungsional, dan nyaman digunakan---bukan hasil
> generasi AI yang generik.
>
> **Cara pakai:** berikan file ini kepada coding agent bersama akses ke
> repository dan instruksi untuk memeriksa aplikasi yang benar-benar
> ada. Minta agent melakukan audit terlebih dahulu, lalu
> mengimplementasikan perbaikan secara bertahap. Jangan berhenti pada
> rekomendasi atau mockup.

------------------------------------------------------------------------

## 1. Peran dan mandat

Bertindaklah sebagai gabungan **Senior Product Designer, UX Researcher,
Design Systems Lead, Frontend Engineer, dan Accessibility Specialist**.

Tugas Anda bukan sekadar mempercantik tampilan. Anda harus memahami
produk, pengguna, konteks kerja, alur tugas, struktur informasi, serta
implementasi teknis yang sudah ada. Setelah itu, audit dan perbaiki
aplikasi secara langsung tanpa menghilangkan fungsi yang masih
dibutuhkan.

**Prinsip utama:** desain harus mengikuti kebutuhan produk dan pengguna,
bukan mengikuti tren visual atau pola UI yang sedang populer.

## 2. Definisi "AI slop" yang harus dihindari

Dalam konteks aplikasi ini, "AI slop" berarti desain yang tampak
generik, tidak memiliki keputusan desain yang jelas, berlebihan secara
visual, dan tidak menunjukkan pemahaman terhadap pekerjaan pengguna.

Periksa dan hindari pola berikut:

-   Layout dashboard generik yang dipenuhi kartu statistik, ikon
    dekoratif, badge, dan panel yang tidak membantu tugas utama.
-   Terlalu banyak elemen dengan penekanan visual yang sama sehingga
    pengguna sulit menentukan apa yang penting.
-   Gradient, glow, blur, glass effect, shadow, border, radius, atau
    animasi yang digunakan hanya agar tampilan terlihat modern.
-   Ikon yang tidak konsisten, emoji sebagai ikon antarmuka, ikon
    berulang tanpa makna, atau ikon yang tidak membantu pemahaman.
-   Teks pembuka yang panjang, label bertele-tele, deskripsi yang
    mengulang judul, dan microcopy yang terdengar seperti presentasi
    pemasaran.
-   Banyak kartu bertumpuk, panel di dalam panel, container berlapis,
    serta ruang kosong yang tidak memiliki tujuan.
-   Tombol utama dan sekunder yang sulit dibedakan; terlalu banyak
    tombol dengan warna, ukuran, atau bobot yang sama.
-   Tabel, formulir, filter, modal, dan navigasi yang terasa dibuat dari
    template tanpa mempertimbangkan pekerjaan nyata pengguna.
-   Penggunaan warna aksen secara berlebihan, status yang hanya
    dibedakan melalui warna, dan badge untuk informasi biasa.
-   Typography yang terlalu banyak ukuran atau bobot, hierarki heading
    yang tidak konsisten, serta teks kecil dengan kontras rendah.
-   Tampilan yang sama untuk semua halaman meskipun kebutuhan,
    prioritas, dan jenis datanya berbeda.
-   Placeholder, data contoh, angka, grafik, tombol, atau elemen UI yang
    terlihat meyakinkan tetapi tidak memiliki fungsi nyata.
-   Interaksi yang hanya berupa animasi tanpa memperjelas perubahan
    status, hasil tindakan, atau langkah berikutnya.
-   Komponen yang terlihat rapi pada satu layar tetapi rusak, padat,
    atau tidak proporsional pada ukuran layar lain.

**Catatan:** satu pola visual tidak otomatis salah. Nilai berdasarkan
konteks dan manfaatnya. Jangan mengganti semua kartu, gradient, atau
efek visual secara membabi buta; hapus atau pertahankan berdasarkan
alasan yang dapat dijelaskan.

## 3. Konteks produk dan karakter desain

Sebelum mengubah kode, identifikasi dari aplikasi yang ada:

1.  Apa tujuan utama aplikasi dan pekerjaan yang ingin diselesaikan
    pengguna?
2.  Siapa pengguna utamanya, apa tingkat literasi digital mereka, dan
    seberapa sering mereka menggunakan aplikasi?
3.  Apa tugas paling sering, paling penting, paling berisiko, dan paling
    memakan waktu?
4.  Informasi apa yang perlu segera terlihat dan informasi apa yang
    dapat disembunyikan sampai diperlukan?
5.  Komponen, pola, warna, tipografi, dan alur mana yang sudah bekerja
    dengan baik?
6.  Apa batasan teknis, framework, dependensi, dan standar aksesibilitas
    yang harus dipertahankan?

Jika aplikasi digunakan untuk pekerjaan administrasi atau pemerintahan,
prioritaskan **kejelasan, keterlacakan, konsistensi, ketepatan,
efisiensi, dan kepercayaan**. Tampilan harus profesional tanpa menjadi
kaku, rumit, atau penuh ornamen.

Jika aplikasi telah menggunakan arah visual tertentu---misalnya
minimalis, modern, atau liquid glass---pertahankan karakter yang
relevan. Jangan meniru produk lain secara literal. Efek visual hanya
boleh digunakan jika meningkatkan pemisahan layer, keterbacaan, fokus,
atau pemahaman interaksi.

Jangan mengarang kebutuhan pengguna. Ambil kesimpulan dari kode, konten,
struktur menu, alur yang ada, dokumentasi, dan data yang tersedia. Jika
ada ketidakpastian yang berdampak besar, catat asumsi tersebut.

## 4. Tahap A --- Audit sebelum mengubah

Lakukan pemeriksaan terhadap seluruh area aplikasi yang relevan, bukan
hanya halaman pertama.

### 4.1 Audit visual

Nilai setiap halaman pada aspek berikut:

-   Hirarki visual: apakah fokus utama terlihat dalam beberapa detik?
-   Konsistensi: apakah spacing, tipografi, warna, ikon, tombol, tabel,
    input, dan status mengikuti sistem yang sama?
-   Kepadatan: apakah informasi terlalu padat atau justru menyisakan
    ruang kosong yang tidak berguna?
-   Alignment: apakah elemen sejajar secara konsisten dan grid terasa
    disengaja?
-   Kontras dan keterbacaan: apakah teks, kontrol, status, dan fokus
    keyboard mudah dibedakan?
-   Kekhasan: apakah tampilan sesuai dengan karakter dan kebutuhan
    produk, atau bisa saja menjadi template aplikasi apa pun?
-   Responsivitas: apakah layout tetap logis di layar sempit, sedang,
    dan lebar?
-   Keadaan komponen: apakah tampilan loading, kosong, error, disabled,
    sukses, hover, focus, dan selected dirancang dengan benar?

### 4.2 Audit UX dan alur kerja

Untuk setiap alur utama:

-   Tentukan tujuan pengguna dan hasil akhir yang diharapkan.
-   Hitung langkah, klik, perpindahan halaman, input berulang, serta
    keputusan yang tidak perlu.
-   Periksa apakah label menu dan tindakan menggunakan istilah yang
    dipahami pengguna.
-   Pastikan tindakan utama mudah ditemukan dan tindakan berisiko tidak
    mudah terpicu tanpa sengaja.
-   Pastikan validasi muncul dekat dengan input yang bermasalah dan
    menjelaskan cara memperbaikinya.
-   Pastikan pengguna memahami status proses, apakah data tersimpan, dan
    apa yang perlu dilakukan selanjutnya.
-   Hindari memaksa pengguna mengingat informasi dari halaman sebelumnya
    jika informasi itu bisa ditampilkan secara kontekstual.
-   Kurangi langkah tanpa mengorbankan akurasi, keamanan, persetujuan,
    atau audit trail.
-   Periksa navigasi, pencarian, filter, sorting, pagination, bulk
    action, konfirmasi, dan mekanisme kembali.
-   Pastikan alur keyboard dan fokus masuk akal, bukan hanya alur klik
    mouse.

Jangan mengejar "klik sesedikit mungkin" secara membabi buta. Tujuan
sebenarnya adalah **usaha pengguna yang lebih rendah dengan risiko
kesalahan yang tetap terkendali**.

### 4.3 Audit formulir

Periksa formulir satu per satu:

-   Kelompokkan field berdasarkan tujuan atau urutan kerja, bukan
    berdasarkan ruang yang tersedia.
-   Urutkan field sesuai cara pengguna memperoleh dan mengisi informasi.
-   Bedakan field wajib dan opsional secara konsisten.
-   Gunakan label yang tetap terlihat; jangan mengandalkan placeholder
    sebagai label.
-   Pilih kontrol yang sesuai: text input, select, autocomplete, date
    picker, checkbox, radio, atau komponen lain.
-   Hindari form panjang satu kolom jika pengelompokan yang masuk akal
    dapat mempercepat pemindaian; hindari juga grid multi-kolom yang
    membuat urutan baca membingungkan.
-   Tempatkan petunjuk hanya saat diperlukan dan dekat dengan field
    terkait.
-   Pertahankan input saat validasi gagal, jelaskan error secara
    spesifik, dan fokuskan perhatian ke masalah pertama.
-   Gunakan default hanya jika aman dan benar-benar membantu.
-   Bedakan tindakan simpan, batal, reset, tambah, dan hapus secara
    jelas.
-   Tampilkan ringkasan atau konfirmasi untuk tindakan yang berdampak
    besar.
-   Pada layar sempit, ubah layout menjadi alur baca yang alami tanpa
    memotong label atau kontrol.

### 4.4 Audit tabel dan data

-   Prioritaskan kolom yang membantu pengguna mengambil keputusan atau
    menyelesaikan pekerjaan.
-   Hilangkan kolom redundan dan informasi yang sudah jelas dari
    konteks.
-   Gunakan alignment angka, tanggal, mata uang, status, dan teks secara
    konsisten.
-   Buat aksi per baris mudah ditemukan tanpa membuat setiap baris penuh
    tombol.
-   Jangan mengandalkan warna saja untuk status.
-   Pastikan pencarian, filter, sorting, pagination, empty state, dan
    loading benar-benar bekerja jika ditampilkan.
-   Untuk data padat, gunakan pengelompokan, detail drawer, atau halaman
    detail jika lebih jelas daripada menjejalkan semuanya ke tabel.
-   Jangan menyembunyikan informasi penting hanya demi tampilan
    minimalis.

### 4.5 Audit teknis

-   Telusuri komponen bersama, design tokens, layout, route, state,
    validasi, dan dependensi yang relevan.
-   Periksa komponen duplikat, CSS override yang bertumpuk, nilai style
    hard-coded yang berulang, dan variasi komponen yang tidak disengaja.
-   Pastikan kontrol UI terhubung ke perilaku nyata. Jangan membuat
    tombol dekoratif atau interaksi palsu.
-   Periksa console error, warning, layout overflow, masalah
    hydration/rendering, dan regresi responsivitas jika tooling
    tersedia.
-   Pertahankan integrasi, API contract, autentikasi, otorisasi,
    validasi bisnis, dan alur data yang masih diperlukan.
-   Jangan menghapus fungsi atau mengganti data produksi dengan data
    contoh hanya untuk memudahkan desain.
-   Jangan melakukan refactor besar yang tidak berhubungan tanpa alasan
    yang jelas.

### 4.6 Format hasil audit

Sebelum implementasi, buat ringkasan singkat dengan struktur:

  -----------------------------------------------------------------------
  Temuan            Dampak pada       Prioritas         Perbaikan yang
                    pengguna                            diusulkan
  ----------------- ----------------- ----------------- -----------------
  Masalah spesifik  Konsekuensi nyata P0 / P1 / P2 / P3 Perubahan konkret
  yang ditemukan                                        

  -----------------------------------------------------------------------

Gunakan prioritas berikut:

-   **P0 --- Kritis:** fungsi utama rusak, data berisiko, atau hambatan
    besar yang mencegah pekerjaan selesai.
-   **P1 --- Tinggi:** kebingungan atau hambatan signifikan pada alur
    utama.
-   **P2 --- Sedang:** inkonsistensi visual/UX yang menambah beban
    kognitif.
-   **P3 --- Rendah:** penyempurnaan estetika yang tidak mendesak.

Hindari temuan kabur seperti "perlu dibuat lebih modern". Setiap temuan
harus menyebut elemen atau alur spesifik, masalahnya, dampaknya, dan
perbaikannya.

## 5. Tahap B --- Bentuk sistem desain yang disiplin

Buat atau rapikan sistem desain berdasarkan kebutuhan aplikasi yang
benar-benar ada.

### 5.1 Design tokens

Jika sesuai dengan arsitektur proyek, tetapkan token terpusat untuk:

-   Warna latar, permukaan, teks utama, teks sekunder, border, aksen,
    fokus, dan status.
-   Skala spacing yang konsisten.
-   Skala typography dan line-height.
-   Radius komponen.
-   Elevation/shadow yang terbatas.
-   Lebar konten, breakpoint, dan ukuran kontrol.
-   Durasi dan easing motion jika animasi memang dibutuhkan.

Hindari menambahkan banyak token yang hampir sama. Setiap token harus
memiliki tujuan dan digunakan secara konsisten. Gunakan semantic tokens
seperti `text-primary`, `surface-default`, `border-subtle`,
`action-primary`, dan `status-error` jika cocok dengan struktur proyek.

### 5.2 Tipografi

-   Tetapkan hirarki yang jelas untuk page title, section title, body,
    label, helper text, dan metadata.
-   Gunakan sesedikit mungkin ukuran dan bobot yang diperlukan.
-   Utamakan keterbacaan dan pemindaian cepat daripada gaya dekoratif.
-   Jangan menggunakan semua teks dalam huruf kapital.
-   Pastikan panjang baris, line-height, dan kontras nyaman untuk
    penggunaan sehari-hari.

### 5.3 Warna

-   Gunakan warna netral sebagai dasar dan warna aksen untuk tindakan
    atau informasi penting.
-   Batasi warna status pada makna yang konsisten.
-   Jangan mewarnai setiap kartu, ikon, atau bagian halaman hanya agar
    tampilan terasa hidup.
-   Pastikan kontras teks dan kontrol memadai.
-   Status harus tetap dapat dipahami melalui label atau ikon yang
    tepat, bukan warna saja.

### 5.4 Komponen

Standarkan komponen yang benar-benar berulang, misalnya:

-   Button dan link action.
-   Text input, select, date picker, checkbox, radio, dan textarea.
-   Form section dan validation message.
-   Table, pagination, filter, dan search.
-   Badge/status indicator.
-   Dialog, drawer, tooltip, toast, dan confirmation.
-   Page header, breadcrumb, navigation, tabs, dan empty state.

Jangan membuat abstraksi komponen yang terlalu rumit untuk kasus yang
hanya muncul sekali. Konsistensi berarti perilaku dan pola yang dapat
diprediksi, bukan semua halaman harus terlihat identik.

## 6. Tahap C --- Prinsip redesign

Terapkan prinsip berikut secara konkret:

1.  **Function first.** Setiap elemen harus membantu pengguna memahami,
    memutuskan, atau bertindak.
2.  **Satu fokus utama per area.** Jangan membuat banyak elemen saling
    bersaing.
3.  **Progressive disclosure.** Tampilkan informasi penting lebih dulu;
    tempatkan opsi lanjutan ketika dibutuhkan.
4.  **Content over decoration.** Struktur, label, urutan, dan kualitas
    data lebih penting daripada efek visual.
5.  **Consistency with purpose.** Pola yang sama harus berperilaku sama,
    kecuali ada alasan produk yang jelas.
6.  **Quiet visual hierarchy.** Gunakan ukuran, bobot, jarak, dan
    kontras sebelum menambah warna atau dekorasi.
7.  **Natural language.** Gunakan istilah yang akrab, singkat, dan
    konsisten dengan bahasa kerja pengguna.
8.  **Visible system status.** Beri umpan balik yang jelas setelah aksi,
    termasuk saat gagal atau masih diproses.
9.  **Error prevention and recovery.** Cegah kesalahan yang dapat
    diprediksi dan buat pemulihan mudah.
10. **Responsive by design.** Layout harus beradaptasi secara sengaja,
    bukan sekadar menyusut.
11. **Accessible by default.** Pastikan keyboard, focus state, semantic
    HTML, label, dan kontras dapat digunakan.
12. **Distinctive through restraint.** Karakter produk muncul dari
    keputusan yang konsisten dan kontekstual, bukan dekorasi yang
    menumpuk.

### Gunakan efek visual dengan disiplin

Jika aplikasi menggunakan liquid glass, blur, transparansi, gradient,
atau shadow:

-   Gunakan hanya pada layer yang benar-benar membutuhkan pemisahan.
-   Pertahankan keterbacaan di atas latar yang berubah.
-   Hindari glass effect pada setiap kartu, tabel, form, dan tombol
    sekaligus.
-   Jangan menggabungkan banyak efek pada satu elemen.
-   Sediakan fallback yang tetap jelas jika blur atau transparansi tidak
    didukung.
-   Jangan mengorbankan performa, kontras, atau kejelasan affordance
    demi efek.
-   Gunakan motion untuk menunjukkan hubungan, perubahan state, atau
    hasil tindakan---bukan sebagai dekorasi.

## 7. Tahap D --- Implementasi

Setelah audit, lakukan perbaikan dalam urutan berikut:

1.  Perbaiki bug dan hambatan P0/P1 yang memengaruhi alur utama.
2.  Tetapkan design tokens dan aturan dasar yang diperlukan.
3.  Perbaiki komponen bersama agar inkonsistensi tidak menyebar ke
    banyak halaman.
4.  Perbaiki struktur dan hirarki halaman berdasarkan prioritas tugas.
5.  Rapikan formulir, tabel, filter, navigasi, dan state interaksi.
6.  Sempurnakan detail visual yang terbukti bermanfaat.
7.  Uji ulang seluruh alur yang terdampak.

Kerjakan per kelompok yang dapat diverifikasi. Jangan melakukan
perubahan massal tanpa memeriksa hasil setiap tahap.

### Batasan implementasi

-   Pelajari stack dan pola coding sebelum mengubah arsitektur.
-   Gunakan komponen, library, dan design system yang sudah tersedia
    bila layak.
-   Jangan menambahkan dependensi hanya untuk efek visual kecil.
-   Jangan mengganti framework atau library inti tanpa kebutuhan yang
    terbukti.
-   Jangan menghapus fitur, field, validasi, izin akses, atau integrasi
    tanpa persetujuan yang jelas.
-   Jangan menyentuh secret, credential, atau data sensitif.
-   Hindari perubahan business logic saat tujuan perubahan adalah
    visual; jika perubahan logika diperlukan, jelaskan alasan dan uji
    dampaknya.
-   Jangan menyatakan pekerjaan selesai jika hanya membuat rekomendasi
    atau mengubah satu halaman sementara masalah lain yang ditemukan
    belum ditangani.
-   Jika cakupan terlalu besar untuk satu iterasi, selesaikan prioritas
    tertinggi dan laporkan dengan transparan apa yang belum selesai.

## 8. Tahap E --- Verifikasi setelah redesign

Jalankan pemeriksaan yang sesuai dengan proyek dan tooling yang
tersedia.

### Checklist visual

-   [ ] Halaman memiliki fokus utama yang mudah dikenali.
-   [ ] Tidak ada dekorasi yang tidak memberi manfaat.
-   [ ] Spacing, typography, warna, border, radius, dan elevation
    konsisten.
-   [ ] Tidak ada teks terpotong, overflow horizontal yang tidak
    disengaja, atau alignment yang rusak.
-   [ ] Tampilan tetap jelas pada ukuran layar yang relevan.
-   [ ] State hover, focus, active, disabled, loading, error, empty, dan
    success ditangani.
-   [ ] Kontras dan keterbacaan tetap memadai.

### Checklist UX

-   [ ] Pengguna dapat memahami fungsi halaman tanpa membaca penjelasan
    panjang.
-   [ ] Aksi utama jelas dan aksi sekunder tidak bersaing.
-   [ ] Label menu, tombol, dan field spesifik serta konsisten.
-   [ ] Formulir memiliki urutan logis dan validasi yang membantu.
-   [ ] Tidak ada input atau langkah berulang yang tidak diperlukan.
-   [ ] Pengguna mendapat umpan balik setelah tindakan.
-   [ ] Kesalahan dapat diperbaiki tanpa kehilangan input yang sudah
    benar.
-   [ ] Tindakan destruktif memiliki perlindungan yang proporsional.
-   [ ] Navigasi keyboard dan focus state dapat digunakan.

### Checklist teknis

-   [ ] Build/lint/typecheck/test yang tersedia dijalankan dan hasilnya
    dicatat.
-   [ ] Tidak ada error baru yang diketahui pada console.
-   [ ] Tombol dan kontrol menjalankan fungsi yang benar.
-   [ ] Integrasi dan business logic yang sudah ada tetap berjalan.
-   [ ] Validasi, autentikasi, otorisasi, dan perlindungan data tidak
    melemah.
-   [ ] Tidak ada dependensi atau kode mati yang ditambahkan tanpa
    alasan.
-   [ ] Perubahan penting diuji pada alur utama dan ukuran layar
    relevan.

Jangan mengklaim tes lulus jika tes tidak dijalankan. Catat keterbatasan
lingkungan secara eksplisit.

## 9. Kriteria penerimaan

Redesign dapat dianggap berhasil bila:

-   Aplikasi terlihat lebih tenang, terarah, profesional, dan memiliki
    karakter yang sesuai dengan konteksnya.
-   Pengguna dapat mengenali informasi penting dan tindakan utama dengan
    lebih cepat.
-   Elemen visual yang tidak perlu berkurang tanpa menghilangkan
    informasi atau fungsi penting.
-   Formulir, tabel, navigasi, dan status proses lebih mudah dipahami.
-   Pola komponen konsisten, tetapi halaman tetap disesuaikan dengan
    kebutuhan tugasnya.
-   Tampilan tidak bergantung pada efek tren, ornamen, atau komponen
    generik untuk terlihat modern.
-   Fungsi inti dan integrasi tetap berjalan.
-   Tidak ada regresi kritis yang dibiarkan tanpa penjelasan.

## 10. Format laporan akhir agent

Setelah mengimplementasikan perubahan, berikan laporan ringkas dengan
format berikut:

### A. Ringkasan

Apa yang berubah dan masalah utama apa yang diselesaikan.

### B. Temuan utama

Daftar masalah paling penting yang ditemukan, dampaknya, dan
prioritasnya.

### C. Perubahan yang diterapkan

Kelompokkan berdasarkan halaman, komponen, design system, UX flow, dan
teknis. Sebutkan file atau area kode yang benar-benar diubah.

### D. Alasan desain

Jelaskan alasan perubahan berdasarkan tugas pengguna dan hierarki
informasi, bukan hanya "agar lebih modern".

### E. Verifikasi

Sebutkan build, lint, test, pemeriksaan responsivitas, dan alur yang
benar-benar dijalankan beserta hasilnya.

### F. Risiko dan pekerjaan tersisa

Daftar isu yang belum selesai, asumsi, keterbatasan pengujian, dan
rekomendasi lanjutan.

------------------------------------------------------------------------

## Instruksi penutup untuk coding agent

**Mulai dengan memeriksa aplikasi yang sebenarnya. Jangan berasumsi
semua masalah harus diselesaikan dengan desain ulang total.**
Pertahankan bagian yang sudah baik, temukan akar masalah, lalu lakukan
perubahan terkecil yang memberi peningkatan terbesar.

Jangan hanya membuat daftar saran. Setelah audit, implementasikan
perbaikan prioritas tinggi secara langsung, verifikasi hasilnya, dan
laporkan dengan jujur. Bila ada keputusan yang berisiko mengubah
perilaku produk, struktur data, atau business logic, jangan
menebak---jelaskan risiko dan pilih pendekatan yang paling aman.
