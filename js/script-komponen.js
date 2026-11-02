// ==========================================================================
// POPUP "TAMBAH KOMPONEN BIAYA" (penerima perorangan, pegawai, dewan, dll.)
// Muat SETELAH lazy-list.js dan data-komponen.js, SEBELUM dipakai script-rincian.js (handleTambah):
//   <script src="../../js/lazy-list.js"></script>
//   <script src="../../js/data-komponen.js"></script>
//   <script src="../../js/script-komponen.js"></script>
//
//   const dipilih = await KomponenModal.buka({ kelompok, filterG, sudah });
//     kelompok : daftar kelompok biaya [{key, title}]
//     filterG  : kelompok yang langsung dipilih saat popup dibuka (opsional)
//     sudah    : id komponen yang sudah ada di penerima ini (ditandai "Sudah ditambahkan")
//     judul, sub, tombol, labelSudah : teks popup (opsional; dipakai juga untuk memilih kolom template / Mode Tabel)
//     bolehKosong : true = tombol utama tetap aktif walau belum ada yang dipilih
//   -> array komponen terpilih [{id, nama, g, pajak, ket, tipe}] atau null bila dibatalkan
//
// Pilihan tetap tersimpan saat berpindah kelompok / mencari. Daftar dimuat bertahap (lazy loading).
// ==========================================================================
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const norm = (s) => String(s || "").toLowerCase();

  // jenis pajak -> tipe komponen di rincian: tanpa PPh = "n" (tanpa formula & tanpa PPh), lainnya = "fp"
  const tipeDari = (k) => (k.pajak === "Tanpa PPh" ? "n" : "fp");
  const kelompokAkhir = (k) => (tipeDari(k) === "n" ? "honor" : k.g); // tanpa PPh selalu masuk Honor dan Jasa Perorangan
  const KELAS_PAJAK = { "PPh 21": "pj-pph", "PPh 23": "pj-pph", "Perlu dilengkapi": "pj-lengkapi", "Tanpa PPh": "pj-tanpa" };

  let M = null; // state popup yang sedang terbuka

  function htmlModal(o) {
    return `
    <div class="km-box" role="dialog" aria-modal="true" aria-labelledby="km-judul">
      <div class="km-head">
        <div>
          <h3 id="km-judul">${esc(o.judul || "Tambah Komponen Biaya")}</h3>
          <p>${esc(o.sub || "Pilih satu atau beberapa komponen. Pilihan tetap tersimpan saat berpindah kelompok.")}</p>
        </div>
        <button type="button" class="km-x" data-km="batal" title="Tutup"><i class="fas fa-times"></i></button>
      </div>
      <div class="km-body">
        <aside class="km-side">
          <div class="km-side-head">
            <strong>Kelompok biaya</strong>
            <span>Saring komponen berdasarkan kelompok.</span>
          </div>
          <div class="km-grup"></div>
        </aside>
        <section class="km-main">
          <div class="km-main-head">
            <div>
              <h4 class="km-judul-grup"></h4>
              <span class="km-tersedia"></span>
            </div>
            <button type="button" class="km-dipilih" data-km="dipilih" title="Tampilkan hanya yang dipilih"><i class="fas fa-check"></i> Dipilih <b>0</b></button>
          </div>
          <div class="km-cari">
            <input type="text" placeholder="Cari komponen atau kelompok biaya..." aria-label="Cari komponen" />
            <i class="fas fa-search"></i>
          </div>
          <div class="km-tabel">
            <div class="km-thead"><span>Komponen biaya</span><span>Jenis pajak</span><span></span></div>
            <div class="km-list"></div>
          </div>
        </section>
      </div>
      <div class="km-foot">
        <button type="button" class="km-hapus" data-km="hapus">Hapus pilihan</button>
        <div class="km-tombol">
          <button type="button" class="km-btn batal" data-km="batal">Batal</button>
          <button type="button" class="km-btn tambah" data-km="tambah">Tambahkan</button>
        </div>
      </div>
    </div>`;
  }

  // ---------- data tersaring ----------
  function saring() {
    const q = norm($(".km-cari input", M.el).value).trim();
    const judulG = (k) => (M.kelompok.find((g) => g.key === k.g) || {}).title || "";
    return M.data.filter((k) => {
      if (M.hanyaDipilih) return M.pilih.has(k.id);
      if (M.g && k.g !== M.g) return false;
      return !q || norm(k.nama).includes(q) || norm(judulG(k)).includes(q) || norm(k.pajak).includes(q) || norm(k.id).includes(q);
    });
  }

  function barisKomponen(k) {
    const g = M.kelompok.find((x) => x.key === k.g);
    const sudah = M.sudah.has(k.id);
    const on = M.pilih.has(k.id);
    return `
      <label class="km-row${on ? " on" : ""}${sudah ? " sudah" : ""}" data-id="${esc(k.id)}">
        <span class="km-nama"><strong>${esc(k.nama)}</strong><small>${esc(g ? g.title : k.g)}</small></span>
        <span class="km-pajak"><em class="${KELAS_PAJAK[k.pajak] || "pj-pph"}">${esc(k.pajak)}</em>${k.ket ? `<small>${esc(k.ket)}</small>` : ""}</span>
        <span class="km-cek">${sudah ? `<small class="km-sudah">${esc(M.labelSudah)}</small>` : `<input type="checkbox"${on ? " checked" : ""} aria-label="Pilih ${esc(k.nama)}" />`}</span>
      </label>`;
  }

  function gambarGrup() {
    const n = (key) => (key ? M.data.filter((k) => k.g === key).length : M.data.length);
    const item = (key, title) =>
      `<button type="button" class="km-g${(M.g || "") === key ? " aktif" : ""}" data-g="${key}"><span>${esc(title)}</span><b>${n(key)}</b></button>`;
    $(".km-grup", M.el).innerHTML = item("", "Semua kelompok") + M.kelompok.map((g) => item(g.key, g.title)).join("");
  }

  function gambarJudul(tampil, total) {
    const g = M.kelompok.find((x) => x.key === M.g);
    $(".km-judul-grup", M.el).textContent = M.hanyaDipilih ? "Komponen dipilih" : g ? g.title : "Semua kelompok";
    $(".km-tersedia", M.el).textContent = total ? `${total} komponen ${M.hanyaDipilih ? "dipilih" : "tersedia"}` : "Tidak ada komponen";
  }

  function gambarPilih() {
    const n = M.pilih.size;
    $(".km-dipilih b", M.el).textContent = n;
    $(".km-dipilih", M.el).classList.toggle("aktif", M.hanyaDipilih);
    $('[data-km="tambah"]', M.el).disabled = n === 0 && !M.bolehKosong;
    $('[data-km="tambah"]', M.el).textContent = n ? `${M.tombol} (${n})` : M.tombol;
    $('[data-km="hapus"]', M.el).disabled = n === 0;
  }

  function muatUlang() {
    gambarGrup();
    M.lazy.muatUlang();
    gambarPilih();
  }

  // ---------- buka ----------
  function buka(opsi = {}) {
    if (M) tutup(null);
    return new Promise((selesai) => {
      const el = document.createElement("div");
      el.className = "km-overlay";
      el.id = "modalKomponenBiaya";
      el.innerHTML = htmlModal(opsi);
      document.body.appendChild(el);
      M = {
        el,
        selesai,
        data: (window.KOMPONEN_BIAYA || []).slice(),
        kelompok: opsi.kelompok || [],
        g: opsi.filterG || "",
        sudah: new Set(opsi.sudah || []),
        pilih: new Set(),
        hanyaDipilih: false,
        tombol: opsi.tombol || "Tambahkan",
        labelSudah: opsi.labelSudah || "Sudah ditambahkan",
        bolehKosong: !!opsi.bolehKosong,
      };
      (opsi.pilih || []).forEach((id) => M.pilih.add(id)); // pilihan awal (opsional)
      M.lazy = LazyList({
        wadah: $(".km-list", el),
        langkah: 20,
        ambil: saring,
        html: barisKomponen,
        kosong: () => `<div class="km-kosong">${M.hanyaDipilih ? "Belum ada komponen dipilih." : "Komponen tidak ditemukan."}</div>`,
        sesudah: gambarJudul,
      });

      el.addEventListener("click", (ev) => {
        const g = ev.target.closest("[data-g]");
        if (g) { M.g = g.dataset.g; M.hanyaDipilih = false; return muatUlang(); }
        const b = ev.target.closest("[data-km]");
        if (b) {
          if (b.dataset.km === "batal") return tutup(null);
          if (b.dataset.km === "tambah") return tutup(M.data.filter((k) => M.pilih.has(k.id)).map((k) => ({ ...k, tipe: tipeDari(k), g: kelompokAkhir(k) })));
          if (b.dataset.km === "hapus") { M.pilih.clear(); M.hanyaDipilih = false; return muatUlang(); }
          if (b.dataset.km === "dipilih") { if (!M.pilih.size && !M.hanyaDipilih) return; M.hanyaDipilih = !M.hanyaDipilih; return muatUlang(); }
        }
        if (ev.target === el) return tutup(null); // klik di luar kotak
      });
      // centang / batal centang (klik di mana saja pada baris)
      $(".km-list", el).addEventListener("change", (ev) => {
        const row = ev.target.closest(".km-row");
        if (!row || ev.target.type !== "checkbox") return;
        const id = row.dataset.id;
        if (ev.target.checked) M.pilih.add(id); else M.pilih.delete(id);
        row.classList.toggle("on", ev.target.checked);
        gambarPilih();
      });
      let tunda = null;
      $(".km-cari input", el).addEventListener("input", () => {
        clearTimeout(tunda);
        tunda = setTimeout(() => { M.hanyaDipilih = false; muatUlang(); }, 150);
      });
      document.addEventListener("keydown", escTutup);
      muatUlang();
      setTimeout(() => $(".km-cari input", el)?.focus(), 50);
    });
  }

  function escTutup(ev) {
    if (ev.key === "Escape" && M) tutup(null);
  }

  function tutup(hasil) {
    if (!M) return;
    const { el, selesai } = M;
    M = null;
    el.remove();
    document.removeEventListener("keydown", escTutup);
    selesai(hasil);
  }

  window.KomponenModal = { buka, tipeDari, kelompokAkhir };
})();
