// ==========================================================================
// MODE TABEL — RINCIAN BIAYA
// Muat SETELAH script-impor-rincian.js:
//   <script src="../../js/script-impor-rincian.js"></script>
//   <script src="../../js/script-tabel-rincian.js"></script>
// Tombol "Tabel" membuka popup berisi grid seperti Excel (komponen biaya penerima perorangan) yang sudah terisi rincian saat ini.
//   Kuitansi badan usaha TIDAK ada di tabel dan tidak disentuh saat simpan (diisi di layar Rincian Biaya).
//   Tab Komponen: 1 baris = 1 penerima (KODE_PEGAWAI_REKANAN, NAMA, NPWP, NAMA_PEMILIK_NIK, NIK, BANK, NO_REKENING) + 1 kolom per komponen
//   (isi = nominal; kosong / 0 = tidak dipakai). Kolom komponen ditambah lewat tombol "Kolom komponen" (popup pilih komponen),
//   dihapus lewat klik kanan pada judul kolom. Potongan PPh & formula komponen yang sudah ada tetap dipertahankan saat simpan.
//   BANK & NO_REKENING = rekening tujuan penerima (wajib bila ada komponen).
//   Tombol "Download template" & "Upload file": template Excel format yang sama; isi file masuk ke tab Komponen dulu
//   (kode yang sudah ada diperbarui, kode baru ditambahkan), dicek, lalu disimpan lewat "Simpan ke Rincian".
//   - bisa diketik langsung, pilih dari dropdown, atau blok sel di Excel → Ctrl+C → klik sel di grid → Ctrl+V
//   - baris salah ditandai merah langsung; tombol Simpan aktif setelah semua baris benar
//   - Simpan = isi tabel menjadi seluruh rincian (penerima & rekeningnya tetap)
// Aturan cek sama dengan Impor Excel (ImporRincian.periksaBaris).
// Library: js/lib/jspreadsheet/ (Jspreadsheet CE + jSuites, lisensi MIT), dimuat saat tombol pertama kali diklik.
// ==========================================================================
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const IR = () => window.ImporRincian;
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const BARIS_KOSONG = 15; // baris kosong tambahan di bawah data (tempat menempel dari Excel)

  // ---------- library (dimuat sekali) ----------
  const DIR = (document.currentScript && document.currentScript.src.replace(/script-tabel-rincian\.js.*$/, "lib/jspreadsheet/")) || "../../js/lib/jspreadsheet/";
  let muat = null;
  const pakaiScript = (src) => new Promise((ok, gagal) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => gagal(new Error(src)); document.head.appendChild(s); });
  const pakaiCss = (href) => { if (!$(`link[href="${href}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); } };
  function pakaiGrid() {
    if (window.jspreadsheet) return Promise.resolve();
    if (!muat) {
      pakaiCss(DIR + "jsuites.css");
      pakaiCss(DIR + "jspreadsheet.css");
      muat = (window.jSuites ? Promise.resolve() : pakaiScript(DIR + "jsuites.js")).then(() => pakaiScript(DIR + "jspreadsheet.js")).catch((e) => { muat = null; throw new Error("Library tabel (js/lib/jspreadsheet/) tidak ditemukan."); });
    }
    return muat;
  }

  // ---------- data aplikasi -> baris tabel ----------
  const kunciKolom = (c) => c.kompId || c.id || "nama:" + String(c.nama).trim().toLowerCase();
  function metaKolom(c) {
    const k = (window.KOMPONEN_BIAYA || []).find((x) => x.id === (c.kompId || c.id));
    const m = k ? IR().lengkapKomp(k) : { id: "", nama: c.nama, g: c.g, tipe: c.tipe, pajak: c.tipe === "n" ? "Tanpa PPh" : "Ber-PPh" };
    return { ...m, key: kunciKolom(c) };
  }
  // 7 kolom tetap tab Komponen: KODE_PEGAWAI_REKANAN, NAMA, NPWP, AFILIASI, NIK, BANK, NO_REKENING
  // posisi kolom tetap tab Komponen (urutan = urutan kolom di tabel); kolom komponen mulai setelah TETAP
  const K = { kode: 0, nama: 1, npwp: 2, afiliasi: 3, nik: 4, bank: 5, norek: 6 };
  const TETAP = 7;
  function identitasBaris(p) {
    if (!p) return ["", "", "", ""];
    const d = IR().identitas(p);
    return [p.nama, d.npwp, d.afiliasi, d.nik];
  }

  function keBaris(ref) {
    const R = window.RincianApp;
    const km = [], kolom = [];
    R.entries().forEach((e) => {
      if (e.locked || R.isBadan(e)) return; // badan usaha (kuitansi) tidak ada di tabel
      {
        // 1 baris per penerima; nominal komponen di kolomnya (komponen sama pada 1 penerima dijumlahkan)
        const nilai = {};
        e.komponen.forEach((c) => {
          if (c.base) return; // baris dasar persekot / pertanggungjawaban diubah di layar biasa
          const key = kunciKolom(c);
          if (!kolom.some((k) => k.key === key)) kolom.push(metaKolom(c));
          nilai[key] = (nilai[key] || 0) + (Number(c.nominal) || 0);
        });
        km.push({ kode: e.p.kode, p: e.p, nilai, rek: e.rek });
      }
    });
    const nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
    const kmRows = km.map((r) => [r.kode, ...identitasBaris(r.p), (r.rek && r.rek.bank) || "", (r.rek && r.rek.noRek) || "", ...kolom.map((k) => (r.nilai[k.key] ? nf.format(r.nilai[k.key]) : ""))]);
    return { km: kmRows, kolom };
  }

  // ---------- baris tabel -> objek untuk validasi ----------
  const kosong = (r) => r.every((v) => v === "" || v == null);
  // teks tempelan bisa membawa karakter kontrol (mis. sel kosong terakhir) -> dibersihkan
  const bersih = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, "").trim() : v);

  // ==========================================================================
  // POPUP
  // ==========================================================================
  let T = null; // { modal, grid: {km}, tab, hasil, ubah }

  function kolomGrid(ref, kolomKm) {
    // kolom angka = teks biasa rata kanan; titik ribuan dipasang setelah selesai mengetik (lihat lengkapi()).
    // Sengaja tanpa "mask" library: mask jSuites di beberapa browser/keyboard hanya menerima 1 digit.
    const angka = (title, width) => ({ type: "text", title, width, align: "right" });
    return {
      // kode diketik / ditempel (data penerima bisa jutaan, jadi bukan dropdown). NAMA, NPWP, NAMA_PEMILIK_NIK, NIK diisi bebas
      // (tidak dicek); bila kode sudah terdaftar dan selnya kosong, terisi otomatis dari data penerima.
      km: [
        { type: "text", title: "KODE_PEGAWAI_REKANAN", width: 205, align: "left" },
        { type: "text", title: "NAMA", width: 200, align: "left" },
        { type: "text", title: "NPWP", width: 150, align: "left" },
        { type: "text", title: "AFILIASI", width: 220, align: "left" },
        { type: "text", title: "NIK", width: 150, align: "left" },
        { type: "text", title: "BANK", width: 170, align: "left" },
        { type: "text", title: "NO_REKENING", width: 170, align: "left" },
        ...kolomKm.map((k) => angka(k.nama, Math.min(220, Math.max(120, k.nama.length * 8)))),
      ],
    };
  }

  function htmlModal() {
    return `
    <div class="tb-box" role="dialog" aria-modal="true" aria-labelledby="tb-judul">
      <div class="tb-head">
        <div>
          <h3 id="tb-judul">Tabel Massal — Rincian Biaya</h3>
          <p>Ketik langsung, pilih dari dropdown, atau salin dari Excel (Ctrl+C) lalu klik sel di sini dan tempel (Ctrl+V). Klik kanan untuk menambah / menghapus baris, atau pada judul kolom komponen untuk menghapus kolom.</p>
        </div>
        <button type="button" class="tb-x" data-tb="batal" title="Tutup"><i class="fas fa-times"></i></button>
      </div>
      <div class="tb-tabs">
        <button type="button" class="tb-tab aktif" data-tab="km"><i class="fas fa-user"></i> Komponen <small>Pegawai, Dewan, Perorangan</small> <span class="tb-n" data-n="km"></span></button>
        <div class="tb-aksi">
          <button type="button" class="tb-btn" data-tb="template" title="Download template Excel (pilih komponen yang dijadikan kolom)"><i class="fas fa-file-download"></i> Download template</button>
          <button type="button" class="tb-btn" data-tb="upload" title="Upload file Excel hasil isian template ke tab Komponen"><i class="fas fa-file-upload"></i> Upload file</button>
          <button type="button" class="tb-btn" data-tb="kolom"><i class="fas fa-columns"></i> Kolom komponen</button>
          <button type="button" class="tb-btn" data-tb="tambah"><i class="fas fa-plus"></i> 10 baris</button>
          <button type="button" class="tb-btn" data-tb="hapus"><i class="fas fa-trash-alt"></i> Hapus baris terpilih</button>
        </div>
      </div>
      <div class="tb-body">
        <div class="tb-grid" data-grid="km"></div>
      </div>
      <div class="tb-foot">
        <div class="tb-status"></div>
        <div class="tb-tombol">
          <button type="button" class="tb-btn" data-tb="batal">Batal</button>
          <button type="button" class="tb-btn primer" data-tb="simpan">Simpan ke Rincian</button>
        </div>
      </div>
    </div>`;
  }

  // ---------- jangan tutup kotak ketik / dropdown saat tabel bergeser sedikit ----------
  // Bawaan Jspreadsheet: setiap kali area tabel di-scroll, sel yang sedang diedit langsung ditutup.
  // Di layar yang tabelnya tidak muat (ada scroll ke samping), browser menggeser tabel beberapa piksel
  // saat sel mulai diedit / saat mengetik -> kotak ketik tertutup setelah 1 karakter, dropdown langsung menutup lagi.
  //  - kotak ketik teks/angka: tidak pernah ditutup karena scroll (ikut bergeser bersama selnya)
  //  - dropdown: hanya ditutup bila tabel benar-benar di-scroll pengguna (> 40px), karena daftarnya melayang
  function jagaScroll(g) {
    const buka = g.openEditor;
    g.openEditor = function () {
      g._awal = [g.content.scrollLeft, g.content.scrollTop];
      return buka.apply(this, arguments);
    };
    g.scrollControls = function () {
      g.wheelControls();
      const ed = g.edition;
      if (!ed || !g.options.columns[ed[2]] || g.options.columns[ed[2]].type !== "dropdown") return;
      const [x0, y0] = g._awal || [0, 0];
      if (Math.abs(g.content.scrollLeft - x0) + Math.abs(g.content.scrollTop - y0) > 40) g.closeEditor(ed[0], true);
    };
  }

  // tinggi grid = tinggi area isi dikurangi padding atas-bawah (scroll ada di dalam grid)
  const tinggiGrid = () => { const el = $(".tb-body", T.modal), cs = getComputedStyle(el); return Math.max(220, el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 2) + "px"; };

  function buatGrid(jenis, isi) {
    const el = $(`[data-grid="${jenis}"]`, T.modal);
    if (T.grid[jenis]) { try { jspreadsheet.destroy(el); } catch (e) { /* abaikan */ } el.innerHTML = ""; }
    const kolom = kolomGrid(T.ref, T.kolomKm)[jenis];
    const sembunyi = el.hidden;
    el.hidden = false; // ukur saat terlihat
    const g = jspreadsheet(el, {
      data: isi.length ? isi : [[]],
      columns: kolom,
      minDimensions: [kolom.length, Math.max(isi.length + BARIS_KOSONG, 30)],
      tableOverflow: true,
      tableHeight: tinggiGrid(),
      tableWidth: "100%",
      allowInsertColumn: false,
      allowDeleteColumn: false,
      allowRenameColumn: false,
      allowManualInsertColumn: false,
      columnSorting: false,
      wordWrap: false,
      text: { noRecordsFound: "Tidak ada data" },
      contextMenu: (obj, x, y) => (y == null ? menuKolom(jenis, x) : menuBaris(obj, y)),
      onafterchanges: () => { if (T.melengkapi) return; T.ubah = true; cekNanti(); },
      // ingat baris terpilih: saat tombol "Hapus baris terpilih" diklik, pilihan di grid sudah hilang lebih dulu
      onselection: (el, x1, y1, x2, y2) => (T.pilih = [Math.min(y1, y2), Math.max(y1, y2)]),
      oninsertrow: () => cekNanti(),
      ondeleterow: () => { T.ubah = true; cekNanti(); },
    });
    el.hidden = sembunyi;
    jagaScroll(g);
    if (jenis === "km") {
      // keterangan kolom komponen saat kursor diarahkan ke judulnya
      T.kolomKm.forEach((k, i) => {
        const h = g.headers && g.headers[TETAP + i];
        if (h) { h.title = `${(T.ref.kelompok.find((x) => x.key === k.g) || {}).title || k.g} • ${k.pajak || ""}`; h.classList.add(k.tipe === "n" ? "tb-h-tanpa" : "tb-h-pph"); }
      });
    }
    T.grid[jenis] = g;
    return g;
  }

  // susun ulang tab Komponen dengan kolom baru, isi yang sudah diketik dipertahankan
  function susunUlangKm(kolomBaru) {
    const lama = T.kolomKm;
    const data = T.grid.km.getData().filter((r) => !r.every((v) => v === "" || v == null));
    const isi = data.map((r) => [...r.slice(0, TETAP), ...kolomBaru.map((k) => { const i = lama.findIndex((x) => x.key === k.key); return i >= 0 ? r[TETAP + i] : ""; })]);
    T.kolomKm = kolomBaru;
    buatGrid("km", isi);
    T.ubah = true;
    cek();
  }

  async function tambahKolom() {
    const R = window.RincianApp;
    const pilih = await window.KomponenModal.buka({
      kelompok: R.KELOMPOK,
      judul: "Tambah Kolom Komponen",
      sub: "Komponen yang dipilih ditambahkan sebagai kolom di tab Komponen.",
      tombol: "Tambah kolom",
      labelSudah: "Sudah jadi kolom",
      sudah: T.kolomKm.map((k) => k.id).filter(Boolean),
    });
    if (!pilih || !pilih.length) return;
    susunUlangKm([...T.kolomKm, ...pilih.map((k) => ({ ...k, key: k.id }))]);
  }

  // ---------- upload file Excel -> tab Komponen ----------
  // kolom komponen dari file yang belum ada ditambahkan; kode yang sudah ada di tabel diperbarui (sel yang terisi di file),
  // kode baru ditambahkan di bawah. Belum masuk ke rincian sampai "Simpan ke Rincian".
  async function uploadFile() {
    const f = await IR().bacaFileKomponen();
    if (!f) return;
    pilihTab("km");
    const kolomBaru = [...T.kolomKm];
    f.kolom.forEach((k) => { if (!kolomBaru.some((x) => x.key === k.komp.id)) kolomBaru.push({ ...k.komp, key: k.komp.id }); });
    const lama = T.kolomKm;
    const nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
    const isi = T.grid.km
      .getData()
      .filter((r) => !r.every((v) => v === "" || v == null))
      .map((r) => [...r.slice(0, TETAP), ...kolomBaru.map((k) => { const i = lama.findIndex((x) => x.key === k.key); return i >= 0 ? r[TETAP + i] : ""; })]);
    let diperbarui = 0, ditambah = 0;
    f.rows.forEach((r) => {
      const kode = String(r.kode || "").trim();
      let row = kode ? isi.find((x) => String(x[K.kode] ?? "").trim().toLowerCase() === kode.toLowerCase()) : null;
      if (row) diperbarui++;
      else { row = Array(TETAP + kolomBaru.length).fill(""); row[K.kode] = kode; isi.push(row); ditambah++; }
      ["nama", "npwp", "afiliasi", "nik", "bank", "norek"].forEach((k) => { if (r[k]) row[K[k]] = r[k]; });
      f.kolom.forEach((k, i) => {
        const v = r.nilai[i];
        if (v === "" || v == null) return;
        const n = IR().angka(v);
        row[TETAP + kolomBaru.findIndex((x) => x.key === k.komp.id)] = n === 0 ? "" : Number.isFinite(n) ? nf.format(n) : String(v);
      });
    });
    T.kolomKm = kolomBaru;
    buatGrid("km", isi);
    T.ubah = true;
    cek();
    const pesan = [`${ditambah} baris ditambahkan, ${diperbarui} baris diperbarui dari ${esc(f.namaFile)}.`];
    if (f.masalah.length) pesan.push(...f.masalah.map((m) => esc(m) + " Kolom itu diabaikan."));
    pesan.push("Periksa tabel, lalu klik <b>Simpan ke Rincian</b>.");
    IR().pesanHtml(pesan.join("<br>"), "File dimuat ke tabel", f.masalah.length ? "warning" : "success");
  }

  function menuKolom(jenis, x) {
    x = +x;
    if (jenis !== "km" || x < TETAP) return [];
    const k = T.kolomKm[x - TETAP];
    if (!k) return [];
    return [
      {
        title: `Hapus kolom "${k.nama}"`,
        onclick: async () => {
          const terisi = T.grid.km.getData().some((r) => String(r[x] ?? "").trim() !== "" && String(r[x]).trim() !== "0");
          if (terisi && !(await UI.confirm(`Kolom "${k.nama}" berisi nominal. Hapus kolom beserta isinya?`, { danger: true, ya: "Hapus", judul: "Hapus kolom" }))) return;
          susunUlangKm(T.kolomKm.filter((_, i) => i !== x - TETAP));
        },
      },
    ];
  }

  async function buka() {
    if (!window.RincianApp || !IR()) return;
    if (window.RincianApp.modeSkema() === "persekot") return;
    await IR().loading("Memuat tabel…", "Menyiapkan rincian dalam bentuk tabel", 700);
    try { await pakaiGrid(); } catch (err) { UI.alert(err.message, "Gagal", "error"); return; }
    tutup(true);
    const ref = IR().referensi();
    const data = keBaris(ref);
    const modal = document.createElement("div");
    modal.id = "ixTabelModal";
    modal.className = "tb-overlay";
    modal.innerHTML = htmlModal();
    document.body.appendChild(modal);
    document.body.classList.add("tb-buka");
    T = { modal, ref, grid: {}, tab: "km", hasil: null, ubah: false, kolomKm: data.kolom };
    buatGrid("km", data.km);
    Swal.close();

    modal.addEventListener("click", async (ev) => {
      const tab = ev.target.closest("[data-tab]");
      if (tab) return pilihTab(tab.dataset.tab);
      const lompat = ev.target.closest("[data-lompat]");
      if (lompat) { const [j, y] = lompat.dataset.lompat.split(":"); pilihTab(j); T.grid[j].updateSelectionFromCoords(0, +y, 0, +y); return; }
      const b = ev.target.closest("[data-tb]");
      if (!b) return;
      const g = T.grid[T.tab];
      if (b.dataset.tb === "kolom") return tambahKolom();
      if (b.dataset.tb === "template") return IR().unduhTemplate();
      if (b.dataset.tb === "upload") return uploadFile();
      if (b.dataset.tb === "tambah") { g.insertRow(10); return; }
      if (b.dataset.tb === "hapus") {
        if (!T.pilih) { UI.toast("Pilih baris dulu (klik sel atau nomor baris di kiri).", "info"); return; }
        const [y1, y2] = T.pilih;
        g.deleteRow(y1, y2 - y1 + 1);
        T.pilih = null;
        return;
      }
      if (b.dataset.tb === "batal") return tutup();
      if (b.dataset.tb === "simpan") return simpan();
    });
    cek();
  }

  function menuBaris(obj, y) {
    const items = [];
    if (y == null) return items;
    y = +y;
    items.push({ title: "Sisipkan baris di atas", onclick: () => obj.insertRow(1, y, true) });
    items.push({ title: "Sisipkan baris di bawah", onclick: () => obj.insertRow(1, y) });
    items.push({ type: "line" });
    items.push({
      title: "Hapus baris",
      onclick: () => {
        const rows = obj.getSelectedRows(true);
        if (rows && rows.length > 1) obj.deleteRow(Math.min(...rows), rows.length);
        else obj.deleteRow(y);
      },
    });
    return items;
  }

  // Esc sengaja tidak menutup popup: di grid, Esc dipakai untuk membatalkan ketikan / menutup dropdown sel.

  function pilihTab(j) {
    T.tab = j;
    T.modal.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("aktif", b.dataset.tab === j));
    T.modal.querySelectorAll("[data-grid]").forEach((g) => (g.hidden = g.dataset.grid !== j));
  }

  async function tutup(paksa) {
    if (!T) return;
    if (!paksa && T.ubah && !(await UI.confirm("Perubahan di tabel belum disimpan. Tutup tanpa menyimpan?", { danger: true, ya: "Tutup", judul: "Tutup Tabel Massal" }))) return;
    Object.keys(T.grid).forEach((j) => { try { jspreadsheet.destroy($(`[data-grid="${j}"]`, T.modal)); } catch (e) { /* abaikan */ } });
    T.modal.remove();
    document.body.classList.remove("tb-buka");
    T = null;
  }

  // ---------- cek langsung ----------
  let tunda = null;
  function cekNanti() { clearTimeout(tunda); tunda = setTimeout(cek, 150); }

  // Nilai tempelan yang hanya berisi kode (mis. "RC100000481", "PPN10", "21-100-07", "honor") diubah ke teks pilihan
  // dropdown yang lengkap, supaya terlihat di sel (dropdown tidak menampilkan nilai di luar daftarnya).
  function lengkapi() {
    const I = IR(), ref = T.ref;
    // angka: "50000" / "50.000" / "Rp 50.000" -> "50.000" (yang bukan angka dibiarkan, nanti ditandai salah)
    const nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
    const angka = (v) => { const n = I.angka(v); return n == null || Number.isNaN(n) ? null : nf.format(n); };
    const aturan = { [K.kode]: (v) => (String(v).includes(" - ") ? String(v).split(" - ")[0].trim() : null) }; // "kode - nama" -> kode
    T.kolomKm.forEach((_, i) => (aturan[TETAP + i] = angka));
    let ada = false;
    const g = T.grid.km;
    g.getData().forEach((r, y) =>
      Object.entries(aturan).forEach(([x, f]) => {
        const v = typeof r[x] === "string" ? r[x].replace(/[\u0000-\u001f]/g, "").trim() : r[x];
        if (v === "" || v == null) return;
        const lengkap = f(v);
        if (lengkap && lengkap !== String(r[x])) { g.setValueFromCoords(+x, y, lengkap, true); ada = true; }
      }),
    );
    // identitas (NAMA, NPWP, AFILIASI, NIK) hanya diisi otomatis bila kode terdaftar dan selnya kosong
    // (atau masih berisi data penerima lain karena kodenya diganti). Isian pengguna tidak ditimpa.
    const gk = T.grid.km;
    gk.getData().forEach((r, y) => {
      const kode = String(r[K.kode] ?? "").replace(/[\u0000-\u001f]/g, "").trim();
      const p = kode ? ref.penerima.find((x) => String(x.kode).toLowerCase() === kode.toLowerCase()) : null;
      if (!p) return;
      const isi = identitasBaris(p);
      const nama = String(r[K.nama] ?? "").trim();
      const sisaLain = nama && nama !== p.nama && ref.penerima.some((x) => x !== p && x.nama === nama); // isian otomatis dari kode sebelumnya
      [K.nama, K.npwp, K.afiliasi, K.nik].forEach((x, i) => {
        const v = String(r[x] ?? "").trim();
        if ((v === "" || sisaLain) && isi[i] && v !== isi[i]) { gk.setValueFromCoords(x, y, isi[i], true); ada = true; }
      });
    });
    return ada;
  }

  function cek() {
    if (!T) return;
    if (!T.melengkapi) {
      T.melengkapi = true;
      try { lengkapi(); } finally { T.melengkapi = false; }
    }
    const I = IR();
    const km = {
      kolom: T.kolomKm.map((k) => ({ header: k.nama, komp: k })),
      rows: T.grid.km
        .getData()
        .map((r, y) => ({ _baris: y + 1, ...Object.fromEntries(Object.entries(K).map(([k, x]) => [k, bersih(r[x]) ?? ""])), nilai: r.slice(TETAP).map(bersih) }))
        .filter((r) => String(r.kode).trim() !== "" || String(r.bank).trim() !== "" || String(r.norek).trim() !== "" || r.nilai.some((v) => v !== "" && v != null)),
    };
    const h = I.periksaBaris([], km, { ref: T.ref, tabel: true }); // kuitansi tidak dibaca
    T.hasil = h;
    const salah = new Map();
    h.baris.forEach((b) => { if (b.err.length) salah.set(b.baris, b.err); });
    (T.grid.km.rows || []).forEach((tr, y) => {
      const e = salah.get(y + 1);
      tr.classList.toggle("tb-salah", !!e);
      if (e) tr.title = e.join("\n"); else tr.removeAttribute("title");
    });
    const el = $('[data-n="km"]', T.modal);
    el.textContent = salah.size ? `${km.rows.length} baris • ${salah.size} salah` : `${km.rows.length} baris`;
    el.classList.toggle("ada-salah", salah.size > 0);
    const total = salah.size;
    const daftar = [];
    salah.forEach((err, baris) => daftar.push(`<li><button type="button" data-lompat="km:${baris - 1}">Baris ${baris}</button> ${err.map(esc).join("; ")}</li>`));
    $(".tb-status", T.modal).innerHTML = total
      ? `<div class="tb-st-salah"><i class="fas fa-exclamation-circle"></i> ${total} baris perlu diperbaiki sebelum disimpan</div><ul>${daftar.slice(0, 50).join("")}</ul>`
      : `<div class="tb-st-ok"><i class="fas fa-check-circle"></i> Semua baris benar • ${km.rows.length} penerima</div>`;
    $('[data-tb="simpan"]', T.modal).disabled = total > 0;
  }

  // ---------- simpan ----------
  async function simpan() {
    cek();
    const h = T.hasil;
    if (!h || h.baris.some((b) => b.err.length)) return;
    const R = window.RincianApp;
    const data = [...h.data.values()];
    const sebelum = new Set(R.entries().filter((e) => !e.locked).map((e) => e.p.kode));
    const hilang = R.entries().filter((e) => !e.locked && !R.isBadan(e) && !data.some((d) => d.kode === e.p.kode) && e.komponen.some((c) => !c.base));
    if (hilang.length && !(await UI.confirm(`Komponen ${hilang.map((e) => e.p.nama).join(", ")} tidak ada lagi di tabel sehingga akan dikosongkan (penerimanya tetap di daftar). Lanjutkan?`, { ya: "Simpan", judul: "Simpan ke Rincian" }))) return;
    await IR().loading("Menyimpan rincian…", "", 700);
    const hasil = R.terapkanImpor(data, "tabel");
    T.ubah = false;
    await tutup(true);
    Swal.close();
    const baru = data.filter((d) => !sebelum.has(d.kode)).map((d) => d.nama);
    const tanpaRek = R.entries().filter((e) => !e.rek).map((e) => e.p.nama);
    if (baru.length || tanpaRek.length) {
      const p = [`${hasil.komponen} komponen tersimpan.`];
      if (baru.length) p.push(`Penerima baru: ${baru.map(esc).join(", ")}.`);
      if (tanpaRek.length) p.push(`<b>Pilih rekening</b> untuk: ${tanpaRek.map(esc).join(", ")}.`);
      IR().pesanHtml(p.join("<br>"), "Rincian diperbarui", "info");
    } else UI.toast("Rincian diperbarui dari tabel", "ok");
  }

  window.bukaModeTabel = buka;
})();
