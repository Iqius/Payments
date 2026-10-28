// ==========================================================================
// DEV TESTING - data contoh otomatis untuk mencoba alur dengan cepat
// Pengajuan BARU skema Klaim Langsung (bukan edit draf / revisi / persekot / pertanggungjawaban)
// otomatis berisi 1 penerima contoh saat masuk step Rincian Biaya. Tanpa tombol.
// Muat PALING AKHIR di form-operasional.html. Hapus <script> ini bila tidak dipakai.
// ==========================================================================
(function () {
  "use strict";

  const CONTOH = {
    nama: "Dewi Lestari",
    badge: "Pegawai",
    tipe: "pegawai",
    kode: "131230099",
    nik: "3171012345678901",
    nominal: 1500000,
    pph: 75000, // 5%
    rek: { bank: "Bank Mandiri", kodeBank: "008", swift: "BMRIIDJA", noRek: "131-00-099-001-1" },
  };

  let sudah = false; // cukup sekali per buka halaman (kalau dihapus, tidak muncul lagi)
  function isiPenerimaContoh() {
    if (sudah || !window.RincianApp || !window.FormApp) return;
    if (FormApp._mode !== "new") return; // jangan sentuh draf / revisi / pertanggungjawaban
    if (typeof selectedSkemaType !== "undefined" && selectedSkemaType !== "pembayaran") return; // persekot punya baris otomatis sendiri
    const w = document.getElementById("step-4-wrapper");
    if (!w || w.offsetParent === null) return; // hanya saat step Rincian Biaya tampil
    if (RincianApp.entries().length) return; // sudah ada penerima (mis. persekot otomatis)
    sudah = true;
    const c = CONTOH;
    RincianApp.load([
      {
        uid: "r900001",
        p: {
          nama: c.nama,
          sub: c.badge,
          badge: c.badge,
          tipe: c.tipe,
          kode: c.kode,
          det: [
            { label: "Kode Pegawai", ok: null, val: c.kode },
            { label: "NIK", ok: true, val: c.nik },
          ],
        },
        rek: { ...c.rek, nama: c.nama },
        kuitansi: [],
        komponen: [{ id: "c900002", g: "honor", tipe: "fp", nama: "Honor kegiatan", formula: "", nominal: c.nominal, pph: c.pph, base: false }],
        openG: { honor: true },
      },
    ]);
    RincianApp.refresh();
  }

  // dicek setiap kali halaman/step digambar ulang (render dari script-form-app.js)
  function pasang() {
    const asli = window.render;
    if (typeof asli !== "function" || asli._devTesting) return;
    const baru = function () {
      const r = asli.apply(this, arguments);
      setTimeout(isiPenerimaContoh, 0);
      return r;
    };
    baru._devTesting = true;
    window.render = baru;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(pasang, 0));
  else pasang();
})();
