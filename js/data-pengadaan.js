// ==========================================================================
// DATA KIRIMAN DARI APLIKASI PENGADAAN  (file ini boleh Anda ubah)
// Form Pengadaan (?type=pengadaan) membaca objek di bawah dan mengisi bidang
// "Detail Pengadaan" secara otomatis, seolah data dikirim aplikasi lain.
//
//   tampil  : false -> kotak "Detail Pengadaan" disembunyikan di form (data tetap terkirim & tersimpan)
//   aktif   : true  -> form terisi otomatis | false -> diisi manual
//   terkunci: true  -> bidang tidak bisa diubah (data resmi dari aplikasi lain)
//   data    : isi bidang (nilai uang = angka tanpa titik)
//   ambil() : (opsional) kembalikan data berbeda untuk tiap anggaran / parameter.
//             konteks = { idAnggaran, query }   query = parameter URL yang cocok nama bidang
//
// Data juga bisa dikirim lewat alamat halaman, contoh:
//   form-operasional.html?type=pengadaan&noPengadaan=PGD-9&namaPengadaan=Laptop&nilaiTagihan=5000000
// (parameter URL menimpa nilai di bawah)
// ==========================================================================
window.PENGADAAN_KIRIMAN = {
  tampil: false,
  aktif: true,
  terkunci: true,
  data: {
    noPengadaan: "PGD/2026/10/0042",
    namaPengadaan: "Pengadaan Laptop Kerja Unit Keuangan",
    noKontrak: "KTR/KEU/2026/118",
    namaPenyedia: "PT Sinar Teknologi Nusantara",
    nilaiKontrak: 250000000,
    noRekening: "131-00-445-6677-1",
    bank: "Bank Mandiri",
    termin: "Termin", // "Termin" atau "Sekaligus"
    nilaiTagihan: 75000000,
    denda: 0, // kosongkan / 0 bila tidak ada
  },
  // contoh data berbeda per anggaran (hapus tanda komentar bila perlu):
  // ambil({ idAnggaran }) { return idAnggaran === "202571PB620" ? { ...this.data, namaPengadaan: "Lainnya" } : this.data; },
};
