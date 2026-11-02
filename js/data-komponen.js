// ==========================================================================
// DATA CONTOH — DAFTAR KOMPONEN BIAYA (penerima perorangan, pegawai, dewan, dll.)
// Dipakai popup "Tambah Komponen Biaya" (script-komponen.js).
// GANTI dengan data master dari backend. Kolom:
//   id     : kode unik komponen
//   nama   : nama komponen (bisa diubah lagi di rincian)
//   g      : kunci kelompok biaya (lihat KELOMPOK di script-rincian.js)
//   pajak  : "PPh 21" | "PPh 23" | "Perlu dilengkapi" | "Tanpa PPh"
//   ket    : keterangan kecil di bawah jenis pajak (opsional)
// Aturan saat ditambahkan ke rincian:
//   - PPh 21 / PPh 23 / Perlu dilengkapi -> tipe "Dengan formula & PPh"
//   - Tanpa PPh -> tipe "Tanpa formula & tanpa PPh", selalu masuk kelompok Honor dan Jasa Perorangan
// ==========================================================================
window.KOMPONEN_BIAYA = [
  // Honor dan Jasa Perorangan
  { id: "HJP-001", nama: "Honorarium Narasumber", g: "honor", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "HJP-002", nama: "Honorarium Panitia", g: "honor", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "HJP-003", nama: "Honorarium Moderator", g: "honor", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "HJP-004", nama: "Honorarium Pembawa Acara", g: "honor", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "HJP-005", nama: "Honorarium Tim Pelaksana", g: "honor", pajak: "PPh 21", ket: "Pegawai" },
  { id: "HJP-006", nama: "Honorarium Pengajar / Instruktur", g: "honor", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "HJP-007", nama: "Honorarium Penulis / Penyusun Naskah", g: "honor", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "HJP-008", nama: "Honorarium Dewan Pengawas", g: "honor", pajak: "PPh 21", ket: "Anggota dewan" },
  { id: "HJP-009", nama: "Honorarium Komite", g: "honor", pajak: "PPh 21", ket: "Anggota komite" },
  { id: "HJP-010", nama: "Uang Lembur", g: "honor", pajak: "PPh 21", ket: "Pegawai" },
  // Komponen biaya lain tanpa PPh (masuk kelompok Honor dan Jasa Perorangan)
  { id: "BLT-001", nama: "Uang Transport", g: "honor", pajak: "Tanpa PPh", ket: "Biaya lain" },
  { id: "BLT-002", nama: "Uang Harian Perjalanan Dinas", g: "honor", pajak: "Tanpa PPh", ket: "Biaya lain" },
  { id: "BLT-003", nama: "Biaya Penginapan", g: "honor", pajak: "Tanpa PPh", ket: "Biaya lain" },
  { id: "BLT-004", nama: "Uang Saku Rapat", g: "honor", pajak: "Tanpa PPh", ket: "Biaya lain" },
  { id: "BLT-005", nama: "Penggantian Biaya Konsumsi", g: "honor", pajak: "Tanpa PPh", ket: "Biaya lain" },
  { id: "BLT-006", nama: "Biaya Tiket Pesawat / Kereta", g: "honor", pajak: "Tanpa PPh", ket: "Biaya lain" },
  // Penghasilan dari Jasa Profesional
  { id: "JPR-001", nama: "Jasa Tenaga Ahli", g: "profesional", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "JPR-002", nama: "Jasa Konsultan Perorangan", g: "profesional", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "JPR-003", nama: "Jasa Penerjemah", g: "profesional", pajak: "PPh 21", ket: "Bukan pegawai" },
  { id: "JPR-004", nama: "Jasa Notaris", g: "profesional", pajak: "Perlu dilengkapi" },
  // Hadiah Royalti dan Sewa
  { id: "HRS-001", nama: "Hadiah", g: "royalti", pajak: "Perlu dilengkapi" },
  { id: "HRS-002", nama: "Royalti", g: "royalti", pajak: "PPh 23" },
  { id: "HRS-003", nama: "Hadiah Lomba / Penghargaan", g: "royalti", pajak: "PPh 21", ket: "Bukan pegawai" },
  // Pendapatan Bunga Deposito
  { id: "PBD-001", nama: "Bunga Deposito", g: "deposito", pajak: "Perlu dilengkapi" },
  // Penghasilan Usaha Perseorangan
  { id: "PUP-001", nama: "Jasa Usaha Perseorangan", g: "usaha", pajak: "Perlu dilengkapi" },
  { id: "PUP-002", nama: "Penjualan Barang oleh Perseorangan", g: "usaha", pajak: "Perlu dilengkapi" },
  // Pendapatan Sewa Properti
  { id: "PSP-001", nama: "Sewa Rumah / Bangunan", g: "sewa", pajak: "Perlu dilengkapi" },
  { id: "PSP-002", nama: "Sewa Kendaraan", g: "sewa", pajak: "PPh 23" },
];
