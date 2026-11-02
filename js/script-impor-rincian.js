// ==========================================================================
// IMPOR EXCEL — RINCIAN BIAYA
// Muat SETELAH script-rincian.js:
//   <script src="../../js/script-rincian.js"></script>
//   <script src="../../js/script-impor-rincian.js"></script>
// Tombol:
//   "Unduh Template" -> membuat file .xlsx dari data aplikasi saat ini (penerima, objek pajak, kelompok biaya, jenis PPN)
//                        lengkap dengan dropdown, jadi referensinya selalu sama dengan aplikasi.
//   "Impor Excel"    -> membaca file itu, menampilkan pratinjau + baris yang salah, lalu memasukkan baris yang valid.
// Library: js/lib/exceljs.min.js (dimuat saat tombol pertama kali diklik).
// PPN, DPP otomatis, potongan PPh kuitansi, dan total TETAP dihitung aplikasi, tidak diambil dari Excel.
// ==========================================================================
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  // pesan berisi HTML (UI.alert hanya teks)
  const pesanHtml = (html, judul, icon) => Swal.fire({ icon: icon || "info", title: judul, html, confirmButtonText: "OK", confirmButtonColor: "#1f6fa8" });
  const rp = (n) => "Rp. " + new Intl.NumberFormat("id-ID").format(Math.round(n || 0));

  const BARIS = 300; // jumlah baris siap isi di template
  const SH = { petunjuk: "Petunjuk", kw: "Kuitansi", km: "Komponen", pn: "Penerima", ref: "Referensi" };
  const KOL_KW = ["Penerima", "No. Kuitansi / Invoice", "Tanggal", "Nominal Invoice + PPN", "Ada PPN", "Jenis PPN", "Objek Pajak", "DPP PPh"];
  // Sheet Komponen: 1 baris = 1 penerima. 6 kolom tetap + 1 kolom per komponen biaya (judul kolom = nama komponen,
  // isi = nominal; kosong / 0 = tidak dipakai). Potongan PPh diisi di aplikasi.
  // BANK & NO_REKENING wajib diisi untuk penerima yang punya komponen (rekening tujuan selalu dari tabel / Excel)
  // NAMA, NPWP, AFILIASI, NIK diisi bebas (boleh berbeda dengan data yang ada, tidak dicek).
  // Kode yang belum ada di data penerima = penerima baru (perorangan) dengan identitas dari baris itu.
  const KOL_KM_TETAP = ["No", "KODE_PEGAWAI_REKANAN", "NAMA", "NPWP", "AFILIASI", "NIK", "BANK", "NO_REKENING"];
  const KOL_KM_TEMPLATE = KOL_KM_TETAP.slice(1); // template Excel tanpa kolom No
  const BARIS_KM = 500; // baris siap isi di sheet Komponen

  // ---------- loading "pura-pura" (SweetAlert) supaya proses terasa jelas ----------
  const tunggu = (ms) => new Promise((ok) => setTimeout(ok, ms));
  async function loading(judul, teks, ms = 700) {
    Swal.fire({ title: judul, html: teks || "Mohon tunggu sebentar…", allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
    await tunggu(ms);
  }

  // ---------- komponen biaya (data-komponen.js) ----------
  const daftarKomp = () => window.KOMPONEN_BIAYA || [];
  const lengkapKomp = (k) => ({ ...k, tipe: window.KomponenModal.tipeDari(k), g: window.KomponenModal.kelompokAkhir(k) });
  // identitas penerima untuk kolom informasi (NPWP, NIK diambil dari detail penerima)
  function identitas(p) {
    const d = (re) => ((p.det || []).find((x) => re.test(x.label)) || {}).val || "";
    return { npwp: d(/npwp/i), nik: d(/^(nik|ktp)/i), afiliasi: p.sub || "" }; // afiliasi = teks di bawah nama (instansi / jabatan)
  }

  // ---------- library (dimuat sekali, saat dibutuhkan) ----------
  const SRC = (document.currentScript && document.currentScript.src.replace(/script-impor-rincian\.js.*$/, "lib/exceljs.min.js")) || "../../js/lib/exceljs.min.js";
  let muat = null;
  function pakaiExcelJS() {
    if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
    if (!muat)
      muat = new Promise((ok, gagal) => {
        const s = document.createElement("script");
        s.src = SRC;
        s.onload = () => ok(window.ExcelJS);
        s.onerror = () => { muat = null; gagal(new Error("Library Excel (js/lib/exceljs.min.js) tidak ditemukan.")); };
        document.head.appendChild(s);
      });
    return muat;
  }

  // ---------- referensi dari aplikasi ----------
  const TIPE_LABEL = { badan: "Badan Usaha", pegawai: "Pegawai", dewan: "Dewan Pengawas dan Komite", perorangan: "Perorangan" };
  const labelPenerima = (p) => `${p.kode} - ${p.nama}`;
  function referensi() {
    const R = window.RincianApp;
    const penerima = R.penerimaMaster().map((p) => ({ ...p }));
    // penerima yang sudah ada di pengajuan tapi tidak ada di daftar (mis. pengaju pertanggungjawaban)
    R.entries().forEach((e) => {
      if (!e.locked && !penerima.some((p) => p.kode === e.p.kode)) penerima.push({ ...e.p, tipe: e.auto ? e.tipePengaju || "pegawai" : e.p.tipe });
    });
    const objek = [];
    $$("#taxItemList .tax-row-item").forEach((el) => {
      const m = (el.getAttribute("onclick") || "").match(/selectTaxItem\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'/);
      if (m && !objek.some((o) => o.kode === m[1])) objek.push({ kode: m[1], nama: m[2], tarif: parseFloat(m[3].replace(",", ".")) || 0 });
    });
    const jenisPpn = $$("#ppnJenisPpn option").filter((o) => o.value).map((o) => ({ kode: o.value, label: o.textContent.trim() }));
    return { penerima, objek, jenisPpn, kelompok: R.KELOMPOK, tipeKomp: R.TIPE_KOMP };
  }
  const labelObjek = (o) => `${o.kode} - ${o.nama} (${o.tarif}%)`;

  // ==========================================================================
  // UNDUH TEMPLATE
  // ==========================================================================
  async function unduhTemplate() {
    const R = window.RincianApp;
    // 1. pilih komponen yang dijadikan kolom (supaya kolomnya tidak terlalu banyak)
    const awal = new Set();
    R.entries().forEach((e) => e.komponen.forEach((c) => c.kompId && awal.add(c.kompId))); // komponen yang sudah dipakai dicentang
    const komp = await window.KomponenModal.buka({
      kelompok: R.KELOMPOK,
      judul: "Pilih Komponen untuk Template",
      sub: "Komponen yang dipilih menjadi kolom di sheet Komponen.",
      tombol: "Unduh template",
      pilih: [...awal],
    });
    if (komp === null) return; // dibatalkan
    await loading("Menyiapkan template…", `Membuat file Excel dengan ${komp.length} kolom komponen`, 900);
    let ExcelJS;
    try { ExcelJS = await pakaiExcelJS(); } catch (err) { UI.alert(err.message, "Gagal", "error"); return; }
    const ref = referensi();

    const wb = new ExcelJS.Workbook();
    wb.creator = "Pencairan Anggaran";
    const BIRU = "FF1F6FA8", KUNING = "FFFFF7D6", ABU = "FFF1F5F9";
    const garis = { style: "thin", color: { argb: "FFCBD5E1" } };
    const kotak = { top: garis, left: garis, bottom: garis, right: garis };
    const judul = (ws, cols, lebar) => {
      ws.columns = cols.map((c, i) => ({ header: c, width: lebar[i] }));
      const r = ws.getRow(1);
      r.height = 30;
      r.eachCell((c) => {
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BIRU } };
        c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        c.border = kotak;
      });
      ws.views = [{ state: "frozen", ySplit: 1 }];
    };
    const isian = (ws, n, baris = BARIS) => {
      for (let r = 2; r <= baris + 1; r++)
        for (let c = 1; c <= n; c++) {
          const cell = ws.getCell(r, c);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: KUNING } };
          cell.border = kotak;
        }
    };
    const daftar = (ws, kol, rumus, pesan) => {
      for (let r = 2; r <= BARIS + 1; r++)
        ws.getCell(`${kol}${r}`).dataValidation = { type: "list", allowBlank: true, formulae: [rumus], showErrorMessage: true, errorTitle: "Pilihan tidak ada", error: pesan };
    };
    const angka = (ws, kol, min, baris = BARIS) => {
      for (let r = 2; r <= baris + 1; r++) {
        const c = ws.getCell(`${kol}${r}`);
        c.numFmt = "#,##0";
        c.dataValidation = { type: "decimal", operator: "greaterThanOrEqual", allowBlank: true, formulae: [min], showErrorMessage: true, error: "Isi dengan angka" };
      }
    };

    // --- Petunjuk ---
    const pt = wb.addWorksheet(SH.petunjuk);
    pt.getColumn(1).width = 3;
    pt.getColumn(2).width = 110;
    [
      ["TEMPLATE IMPOR RINCIAN BIAYA", "h"],
      [""],
      ["Cara pakai", "b"],
      ["1. Isi sheet 'Komponen' untuk penerima Pegawai, Dewan Pengawas & Komite, Perorangan. Satu baris = satu penerima."],
      ["2. Isi KODE_PEGAWAI_REKANAN, BANK, NO_REKENING, lalu nominal di kolom komponen yang dipakai. Kolom komponen yang tidak dipakai biarkan kosong atau 0."],
      ["3. Simpan file, lalu klik 'Impor' di step Rincian Biaya. Aplikasi menampilkan pratinjau dan menandai baris yang salah sebelum dimasukkan."],
      [""],
      ["Aturan isian", "b"],
      ["• NAMA, NPWP, AFILIASI (instansi / jabatan, mis. Kementrian Sosial), NIK diisi sesuai dokumen penerima (tidak dicek dengan data aplikasi)."],
      ["• KODE_PEGAWAI_REKANAN yang belum terdaftar di aplikasi ditambahkan sebagai penerima baru (perorangan)."],
      ["• BANK & NO_REKENING wajib diisi; rekening ini menjadi rekening tujuan penerima (nama rekening = nama penerima)."],
      ["• Nominal komponen: angka saja, tanpa 'Rp' dan tanpa titik."],
      ["• Potongan PPh dan formula TIDAK diisi di Excel; dilengkapi di layar Rincian Biaya setelah impor."],
      ["• Komponen tanpa PPh selalu masuk kelompok Honor dan Jasa Perorangan."],
      ["• Kuitansi badan usaha diisi di aplikasi (layar Rincian Biaya)."],
      ["• Jangan ubah nama sheet dan judul kolom; aplikasi membacanya berdasarkan nama itu."],
      [""],
      ["Penerima yang belum ada di daftar kiri akan ditambahkan otomatis. Rekening tetap bisa diganti di aplikasi (klik penerima → tombol rekening)."],
      [""],
      ["Kolom komponen di sheet Komponen", "b"],
      ...(komp.length ? komp.map((k) => [`• ${k.nama} — ${(ref.kelompok.find((g) => g.key === k.g) || {}).title || k.g} — ${k.pajak}${k.ket ? " (" + k.ket + ")" : ""}`]) : [["(tidak ada kolom komponen dipilih)"]]),
    ].forEach(([t, s], i) => {
      const c = pt.getCell(i + 2, 2);
      c.value = t;
      c.font = { bold: !!s, size: s === "h" ? 14 : 11, color: s === "h" ? { argb: BIRU } : undefined };
      c.alignment = { wrapText: true, vertical: "top" };
    });

    // --- Komponen: 1 baris per penerima, 1 kolom per komponen terpilih ---
    const km = wb.addWorksheet(SH.km);
    const kolKm = [...KOL_KM_TEMPLATE, ...komp.map((k) => k.nama)];
    judul(km, kolKm, [24, 32, 22, 28, 20, 24, 22, ...komp.map((k) => Math.min(34, Math.max(16, k.nama.length + 4)))]);
    km.getRow(1).height = 42;
    isian(km, kolKm.length, BARIS_KM);
    for (let r = 2; r <= BARIS_KM + 1; r++) {
      ["A", "C", "E", "G"].forEach((c) => (km.getCell(`${c}${r}`).numFmt = "@")); // kode, NPWP, NIK, no. rekening sebagai teks (0 di depan tidak hilang)
    }
    komp.forEach((k, i) => {
      const kol = km.getColumn(KOL_KM_TEMPLATE.length + 1 + i).letter;
      angka(km, kol, 0, BARIS_KM);
      km.getCell(`${kol}1`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.tipe === "n" ? "FF64748B" : "FF15803D" } }; // hijau = ber-PPh, abu = tanpa PPh
    });
    km.views = [{ state: "frozen", ySplit: 1, xSplit: 2 }];
    km.getCell("F1").fill = km.getCell("G1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F4C81" } }; // rekening: wajib

    // sheet: Petunjuk, Komponen (langsung terbuka di Komponen)
    wb.views = [{ activeTab: 1 }];

    const buf = await wb.xlsx.writeBuffer();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    a.download = "Template_Rincian_Biaya.xlsx";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    Swal.close();
    UI.toast("Template berhasil dibuat", "ok");
  }

  // ==========================================================================
  // BACA FILE
  // ==========================================================================
  // nilai sel ExcelJS bisa berupa objek (rumus, rich text, hyperlink)
  function nilai(v) {
    if (v == null) return "";
    if (v instanceof Date) return v;
    if (typeof v === "object") {
      if ("result" in v) return nilai(v.result);
      if (v.richText) return v.richText.map((t) => t.text).join("");
      if ("text" in v) return nilai(v.text);
      return "";
    }
    return v;
  }
  const teks = (v) => (v instanceof Date ? "" : String(v ?? "").trim());
  // angka: 1500000 | "1.500.000" | "1.500.000,50" | "1,500,000.50" | "1500000,5" | "Rp 1.500.000"
  // Penulisan yang meragukan (mis. "50.000250000") dianggap salah, bukan ditebak.
  function angka(v) {
    if (v === "" || v == null) return null;
    if (typeof v === "number") return v;
    const s = String(v).replace(/rp\.?/i, "").replace(/\s/g, "");
    if (!s) return null;
    const neg = s.startsWith("-") ? -1 : 1;
    const t = s.replace(/^-/, "");
    let n = NaN;
    if (/^\d+$/.test(t)) n = Number(t); // 1500000
    else if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) n = Number(t.replace(/\./g, "").replace(",", ".")); // 1.500.000,50
    else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(t)) n = Number(t.replace(/,/g, "")); // 1,500,000.50
    else if (/^\d+[.,]\d{1,2}$/.test(t)) n = Number(t.replace(",", ".")); // 1500000,5
    return Number.isFinite(n) ? neg * n : NaN;
  }
  const pad = (n) => String(n).padStart(2, "0");
  // tanggal -> "yyyy-mm-dd" (input type=date)
  function tanggal(v) {
    if (v === "" || v == null) return null;
    if (v instanceof Date) return isNaN(v) ? NaN : `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
    if (typeof v === "number") { const d = new Date(Math.round((v - 25569) * 864e5)); return tanggal(d); } // nomor seri Excel
    const s = String(v).trim();
    let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) return cekTgl(+m[3], +m[2], +m[1]);
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return cekTgl(+m[1], +m[2], +m[3]);
    return NaN;
  }
  function cekTgl(y, mo, d) {
    const t = new Date(Date.UTC(y, mo - 1, d));
    return t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? `${y}-${pad(mo)}-${pad(d)}` : NaN;
  }
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // baca sheet berdasarkan judul kolom (urutan kolom boleh berubah)
  function bacaSheet(wb, nama, kolom) {
    const ws = wb.worksheets.find((w) => norm(w.name) === norm(nama));
    if (!ws) return null;
    const pos = {};
    ws.getRow(1).eachCell((c, i) => {
      const j = kolom.findIndex((k) => norm(k) === norm(teks(nilai(c.value))));
      if (j >= 0) pos[kolom[j]] = i;
    });
    const hilang = kolom.filter((k) => !pos[k]);
    const rows = [];
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const o = { _baris: r };
      let isi = false;
      kolom.forEach((k) => {
        const v = pos[k] ? nilai(row.getCell(pos[k]).value) : "";
        o[k] = typeof v === "string" ? v.trim() : v;
        if (o[k] !== "" && o[k] != null) isi = true;
      });
      if (isi) rows.push(o);
    }
    return { rows, hilang };
  }

  // sheet Komponen (format lebar): kolom tetap + kolom komponen (dicocokkan dari judul = nama / kode komponen)
  function bacaKomponen(wb) {
    const ws = wb.worksheets.find((w) => norm(w.name) === norm(SH.km));
    if (!ws) return null;
    const pos = {}, kolom = [], asing = [];
    ws.getRow(1).eachCell((c, i) => {
      const h = teks(nilai(c.value));
      if (!h) return;
      const tetap = KOL_KM_TETAP.find((k) => norm(k) === norm(h)) || (norm(h) === norm("NAMA_PEMILIK_NIK") ? "NAMA_PEMILIK_NIK" : null); // template lama
      if (tetap) { pos[tetap] = i; return; }
      const k = daftarKomp().find((x) => norm(x.nama) === norm(h) || norm(x.id) === norm(h));
      if (k) kolom.push({ i, header: h, komp: lengkapKomp(k) });
      else asing.push(h);
    });
    if (pos.KODE_PEGAWAI_REKANAN == null) {
      const lama = asing.some((h) => norm(h) === norm("Kelompok Biaya"));
      return { masalah: [lama ? `Sheet "${SH.km}" masih format lama. Unduh template baru (tombol Template).` : `Sheet "${SH.km}": kolom "KODE_PEGAWAI_REKANAN" tidak ditemukan.`] };
    }
    const rows = [];
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const kode = nilai(row.getCell(pos.KODE_PEGAWAI_REKANAN).value);
      const ambil = (k) => (pos[k] ? String(nilai(row.getCell(pos[k]).value) ?? "").trim() : "");
      const isi = kolom.map((k) => nilai(row.getCell(k.i).value));
      if (teks(kode) === "" && isi.every((v) => v === "" || v == null)) continue;
      rows.push({ _baris: r, kode: teks(kode) || String(kode ?? "").trim(), nama: ambil("NAMA"), npwp: ambil("NPWP"), afiliasi: ambil("AFILIASI") || ambil("NAMA_PEMILIK_NIK"), nik: ambil("NIK"), bank: ambil("BANK"), norek: ambil("NO_REKENING"), nilai: isi });
    }
    return { kolom: kolom.map(({ header, komp }) => ({ header, komp })), rows, masalah: asing.length ? [`Sheet "${SH.km}": kolom ${asing.map((h) => `"${h}"`).join(", ")} bukan komponen yang dikenal.`] : [] };
  }

  // ==========================================================================
  // VALIDASI
  // ==========================================================================
  function cariPenerima(ref, v) {
    const s = teks(v);
    if (!s) return null;
    const kode = s.split(" - ")[0].trim().toLowerCase();
    return ref.penerima.find((p) => String(p.kode).toLowerCase() === kode) || ref.penerima.find((p) => p.nama.toLowerCase() === s.toLowerCase()) || null;
  }
  const cariList = (list, v, ...kunci) => {
    const s = norm(teks(v));
    if (!s) return null;
    return list.find((x) => kunci.some((k) => norm(typeof k === "function" ? k(x) : x[k]) === s)) || null;
  };

  function periksa(wb) {
    const ref = referensi();
    const kw = bacaSheet(wb, SH.kw, KOL_KW);
    const km = bacaKomponen(wb);
    const out = { baris: [], data: new Map(), masalahFile: [], ref };
    if (!kw && !km) out.masalahFile.push(`Sheet "${SH.kw}" dan "${SH.km}" tidak ditemukan. Gunakan file dari tombol "Unduh Template".`);
    if (kw && kw.hilang.length) out.masalahFile.push(`Sheet "${SH.kw}": kolom ${kw.hilang.map((k) => `"${k}"`).join(", ")} tidak ditemukan.`);
    if (km && km.masalah.length) out.masalahFile.push(...km.masalah);
    if (out.masalahFile.length) return out;
    return periksaBaris(kw ? kw.rows : [], km, { ref, cekAda: true });
  }

  // Validasi baris (dipakai Impor Excel & Mode Tabel).
  //   kwRows : baris Kuitansi = objek { "<judul kolom>": nilai, _baris: nomor }
  //   km     : { kolom: [{ header, komp: {id, nama, g, tipe} }], rows: [{ _baris, kode, nilai: [..per kolom..] }] }
  //   opsi.cekAda    : tandai baris yang sudah ada di rincian (impor "Tambahkan")
  //   opsi.tabel     : dari Mode Tabel (Jenis PPN boleh kosong, sama seperti isian manual)
  function penerimaBaru(r, kode) {
    const s = (v) => String(v ?? "").trim();
    const nama = s(r.nama) || kode;
    const det = [{ label: "Kode", val: kode, ok: null }];
    if (s(r.npwp)) det.push({ label: "NPWP", val: s(r.npwp), ok: null });
    if (s(r.nik)) det.push({ label: "NIK", val: s(r.nik), ok: null });
    return { kode, nama, sub: s(r.afiliasi) || "Penerima baru (dari tabel massal / Excel)", badge: "Perorangan", tipe: "perorangan", det, baru: true };
  }

  function periksaBaris(kwRows, km, opsi = {}) {
    const ref = opsi.ref || referensi();
    const out = { baris: [], data: new Map(), masalahFile: [], ref };
    // rincian yang sudah ada di aplikasi: dipakai untuk menandai baris yang sama (supaya impor 2x tidak menumpuk)
    const sudah = (kode) => (opsi.cekAda ? window.RincianApp.entries().find((x) => x.p.kode === kode && !x.locked) : null);
    const kunciKomp = (kode, c) => [kode, c.g, String(c.nama).trim().toLowerCase(), Math.round(c.nominal)].join("|");
    const dataPen = (p) => {
      if (!out.data.has(p.kode)) out.data.set(p.kode, { kode: p.kode, nama: p.nama, kuitansi: [], komponen: [], ...(p.baru ? { p } : {}) });
      return out.data.get(p.kode);
    };

    // ---- Kuitansi (badan usaha) ----
    const kwMap = new Map(); // kode|no -> kuitansi
    kwRows.forEach((r) => {
      const err = [];
      const p = cariPenerima(ref, r["Penerima"]);
      if (!teks(r["Penerima"])) err.push("Penerima kosong");
      else if (!p) err.push("Penerima tidak ditemukan");
      else if (p.tipe !== "badan") err.push(`${p.nama} bukan Badan Usaha (isi di sheet Komponen)`);
      const no = teks(r["No. Kuitansi / Invoice"]) || String(r["No. Kuitansi / Invoice"] ?? "").trim();
      if (!no) err.push("No. kuitansi kosong");
      const kunci = p && no ? p.kode + "|" + no.toLowerCase() : null;
      const lanjutan = kunci && kwMap.has(kunci); // baris objek pajak ke-2 dst. dari kuitansi yang sama
      const tgl = tanggal(r["Tanggal"]);
      const nom = angka(r["Nominal Invoice + PPN"]);
      if (!lanjutan) {
        if (tgl == null) err.push("Tanggal kosong");
        else if (Number.isNaN(tgl)) err.push("Tanggal tidak valid");
        if (nom == null) err.push("Nominal kosong");
        else if (!(nom > 0)) err.push("Nominal harus angka > 0");
      } else {
        const k0 = kwMap.get(kunci);
        if (tgl != null && tgl !== k0.tgl) err.push("Tanggal berbeda dengan baris pertama kuitansi ini");
        if (nom != null && nom !== k0.nominal) err.push("Nominal berbeda dengan baris pertama kuitansi ini");
      }
      const adaTeks = teks(r["Ada PPN"]).toLowerCase();
      const ada = adaTeks === "ya" ? true : adaTeks === "tidak" || adaTeks === "" ? false : null;
      if (ada === null) err.push('Ada PPN harus "Ya" atau "Tidak"');
      const jp = cariList(ref.jenisPpn, r["Jenis PPN"], "kode", "label");
      if (teks(r["Jenis PPN"]) && !jp) err.push("Jenis PPN tidak dikenal");
      if (!lanjutan && ada && !jp && !opsi.tabel) err.push("Ada PPN = Ya: pilih Jenis PPN");
      const obTeks = teks(r["Objek Pajak"]); // "21-100-07 - Tenaga Ahli (15%)" atau cukup kodenya
      const obj = obTeks ? ref.objek.find((o) => o.kode === obTeks.split(" - ")[0].trim()) || cariList(ref.objek, obTeks, labelObjek) : null;
      if (teks(r["Objek Pajak"]) && !obj) err.push("Objek pajak tidak dikenal");
      const dpp = angka(r["DPP PPh"]);
      if (Number.isNaN(dpp) || (dpp != null && dpp < 0)) err.push("DPP harus angka");
      if (lanjutan && !obj) err.push("Baris lanjutan kuitansi harus berisi Objek Pajak");
      if (lanjutan && obj && dpp == null) err.push("Objek pajak kedua dst.: DPP wajib diisi");
      if (lanjutan && obj && kwMap.get(kunci).subs.some((s) => s.kode === obj.kode)) err.push("Objek pajak ganda pada kuitansi yang sama");

      let ket = "", sudahAda = false;
      if (!err.length) {
        if (!lanjutan) {
          const ppn = ada ? Math.round((nom * 11) / 111) : 0;
          const e = sudah(p.kode);
          const k = { no, tgl, nominal: nom, ppn, jenisPpn: ada && jp ? jp.kode : "", subs: [], ada: !!(e && e.kuitansi.some((x) => x.no.trim().toLowerCase() === no.toLowerCase())) };
          kwMap.set(kunci, k);
          dataPen(p).kuitansi.push(k);
          ket = `${no} • ${rp(nom)}${ada ? " • PPN " + rp(ppn) : ""}`;
        } else ket = `${no} • objek pajak tambahan`;
        sudahAda = kwMap.get(kunci).ada;
        if (obj) {
          kwMap.get(kunci).subs.push({ kode: obj.kode, nama: obj.nama, tarif: obj.tarif, dpp: dpp == null ? null : dpp });
          ket += ` • ${obj.kode} (${obj.tarif}%)`;
        }
      }
      out.baris.push({ sheet: SH.kw, baris: r._baris, penerima: p ? p.nama : teks(r["Penerima"]), ket, err, ada: sudahAda });
    });

    // ---- Komponen (pegawai, dewan, perorangan): 1 baris = 1 penerima, nominal per kolom komponen ----
    const kodeBaris = new Map(); // kode -> nomor baris pertama
    const kolom = (km && km.kolom) || [];
    ((km && km.rows) || []).forEach((r) => {
      const err = [];
      const kodeT = teks(r.kode);
      const nil = r.nilai.map(angka);
      nil.forEach((n, i) => { if (Number.isNaN(n) || (n != null && n < 0)) err.push(`"${kolom[i].header}" harus angka ≥ 0`); });
      const terisi = nil.map((n, i) => ({ n, i })).filter((x) => x.n != null && !Number.isNaN(x.n) && x.n > 0);
      if (!kodeT && !terisi.length && !err.length) return; // baris kosong
      const kodeAda = kodeT ? ref.penerima.find((x) => String(x.kode).toLowerCase() === kodeT.toLowerCase()) : null;
      // kode belum terdaftar -> penerima baru (perorangan) dari isi baris; identitas tidak dicek
      const p = !kodeT ? null : kodeAda || penerimaBaru(r, kodeT);
      if (!kodeT) err.push("KODE_PEGAWAI_REKANAN kosong");
      else if (p.tipe === "badan") err.push(`${p.nama} adalah Badan Usaha (isi di sheet Kuitansi)`);
      if (p && kodeBaris.has(p.kode)) err.push(`Kode sama dengan baris #${kodeBaris.get(p.kode)}`);
      else if (p) kodeBaris.set(p.kode, r._baris);
      if (!err.length && !terisi.length) return; // penerima tanpa komponen terisi: diabaikan
      const bank = String(r.bank ?? "").trim(), norek = String(r.norek ?? "").trim();
      if (!bank) err.push("BANK kosong");
      if (!norek) err.push("NO_REKENING kosong");
      else if (!/^[0-9][0-9 .\-]*$/.test(norek)) err.push("NO_REKENING hanya boleh angka (boleh dengan - atau spasi)");
      let ket = "", semuaAda = false;
      if (!err.length) {
        const e = sudah(p.kode);
        const list = terisi.map((x) => {
          const k = kolom[x.i].komp;
          const c = { g: k.g, tipe: k.tipe, nama: k.nama, formula: "", nominal: x.n, pph: 0, kompId: k.id || "" };
          c.ada = !!(e && e.komponen.some((y) => kunciKomp(p.kode, y) === kunciKomp(p.kode, c)));
          return c;
        });
        list.forEach((c) => dataPen(p).komponen.push(c));
        dataPen(p).rek = { bank, noRek: norek };
        semuaAda = list.every((c) => c.ada);
        ket = `${bank} ${norek} • ` + list.map((c) => `${c.nama} ${rp(c.nominal)}${c.ada && !semuaAda ? " (sudah ada)" : ""}`).join(" • ");
      }
      out.baris.push({ sheet: SH.km, baris: r._baris, penerima: p ? p.nama : kodeT, ket, err, ada: semuaAda });
    });

    out.data.forEach((d) => (d.sudahAda = !!window.RincianApp.entries().find((x) => x.p.kode === d.kode && !x.locked)));
    return out;
  }

  // ==========================================================================
  // PRATINJAU
  // ==========================================================================
  const hitung = (h) => {
    const salah = h.baris.filter((b) => b.err.length).length;
    const ada = h.baris.filter((b) => !b.err.length && b.ada).length;
    return { salah, ada, baru: h.baris.length - salah - ada, valid: h.baris.length - salah };
  };
  function htmlPratinjau(h) {
    const n = hitung(h);
    const data = [...h.data.values()];
    const baru = data.filter((d) => !d.sudahAda && (d.kuitansi.some((k) => !k.ada) || d.komponen.some((c) => !c.ada))).length;
    const st = (b) => (b.err.length ? 0 : b.ada ? 1 : 2); // 0 salah, 1 sudah ada, 2 baru
    const baris = (b) => `
      <tr class="${["ix-salah", "ix-ada", ""][st(b)]}">
        <td class="ix-st">${['<i class="fas fa-times-circle"></i>', '<i class="fas fa-equals"></i>', '<i class="fas fa-check-circle"></i>'][st(b)]}</td>
        <td>${esc(b.sheet)} <span class="ix-no">#${b.baris}</span></td>
        <td>${esc(b.penerima || "-")}</td>
        <td>${b.err.length ? `<span class="ix-err">${b.err.map(esc).join("; ")}</span>` : esc(b.ket) + (b.ada ? ' <span class="ix-tag">Sudah ada</span>' : "")}</td>
      </tr>`;
    const urut = [...h.baris].sort((a, b) => st(a) - st(b)); // salah, lalu sudah ada, lalu baru
    return `
      <div class="ix-pop">
        <div class="ix-ringkas">
          <div><strong>${h.baris.length}</strong><span>Baris dibaca</span></div>
          <div class="ix-ok"><strong>${n.baru}</strong><span>Baru (ditambahkan)</span></div>
          <div class="ix-sama"><strong>${n.ada}</strong><span>Sudah ada (dilewati)</span></div>
          <div class="ix-bad"><strong>${n.salah}</strong><span>Salah (dilewati)</span></div>
          <div><strong>${data.length}</strong><span>Penerima${baru ? ` (${baru} baru)` : ""}</span></div>
        </div>
        ${n.ada ? `<div class="ix-info"><i class="fas fa-info-circle"></i> ${n.ada} baris sudah ada di rincian sehingga tidak ditambahkan lagi. Kuitansi dicek dari No. kuitansi; komponen dari nama &amp; nominal. Pilih <b>Ganti semua</b> bila ingin rincian lama diganti isi file.</div>` : ""}
        ${baru ? `<div class="ix-info"><i class="fas fa-info-circle"></i> ${baru} penerima baru akan ditambahkan ke daftar kiri dengan rekening terdaftarnya.</div>` : ""}
        <div class="ix-tabel-wrap">
          <table class="ix-tabel">
            <thead><tr><th></th><th>Sheet / Baris</th><th>Penerima</th><th>Isi / Keterangan</th></tr></thead>
            <tbody>${urut.map(baris).join("") || '<tr><td colspan="4" class="ix-kosong">Tidak ada baris yang terisi.</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  }

  // ==========================================================================
  // IMPOR
  // ==========================================================================
  function pilihFile() {
    return new Promise((ok) => {
      const i = document.createElement("input");
      i.type = "file";
      i.accept = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      i.id = "ix-input";
      i.style.display = "none";
      i.addEventListener("change", () => { ok(i.files[0] || null); i.remove(); });
      document.body.appendChild(i);
      i.click();
    });
  }

  async function imporExcel(fileLangsung) {
    const file = fileLangsung instanceof File ? fileLangsung : await pilihFile();
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) { UI.alert("Gunakan file .xlsx dari tombol \"Unduh Template\".", "Format tidak didukung", "warning"); return; }
    await loading("Membaca file…", esc(file.name), 800);
    let ExcelJS, wb;
    try {
      ExcelJS = await pakaiExcelJS();
      wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
    } catch (err) {
      console.error("[Impor Excel]", err);
      UI.alert("File tidak bisa dibaca. Pastikan file .xlsx tidak rusak atau terkunci password.", "Gagal membaca", "error");
      return;
    }
    const h = periksa(wb);
    if (h.masalahFile.length) { pesanHtml(h.masalahFile.map(esc).join("<br>"), "Format file tidak sesuai", "warning"); return; }
    const n = hitung(h);
    const kosongSemua = !n.valid;
    const r = await Swal.fire({
      title: "Pratinjau Impor Excel",
      html: htmlPratinjau(h),
      width: "min(1210px, 94vw)",
      customClass: { popup: "ix-swal" },
      showCancelButton: true,
      showDenyButton: !kosongSemua,
      showConfirmButton: n.baru > 0, // semua sudah ada -> tidak ada yang bisa ditambahkan
      confirmButtonText: `Tambahkan (${n.baru} baru)`,
      denyButtonText: `Ganti semua (${n.valid} baris)`,
      cancelButtonText: kosongSemua ? "Tutup" : "Batal",
      reverseButtons: true,
      confirmButtonColor: "#1f6fa8",
      denyButtonColor: "#d93025",
      focusConfirm: false,
    });
    if (!r.isConfirmed && !r.isDenied) return;
    let mode = "tambah";
    if (r.isDenied) {
      if (!(await UI.confirm("Semua rincian yang sudah diisi akan dihapus dan diganti isi file. Lanjutkan?", { danger: true, ya: "Ganti semua", judul: "Ganti semua rincian" }))) return;
      mode = "ganti";
    }
    // Tambahkan: hanya yang baru (yang sudah ada dilewati). Ganti semua: seluruh baris valid.
    const data = [...h.data.values()].map((d) => (mode === "ganti" ? d : { ...d, kuitansi: d.kuitansi.filter((k) => !k.ada), komponen: d.komponen.filter((c) => !c.ada) }));
    await loading("Memasukkan rincian…", "", 700);
    const hasil = window.RincianApp.terapkanImpor(data.filter((d) => d.kuitansi.length || d.komponen.length), mode);
    if (mode === "tambah" && n.ada) hasil.lewati.unshift(`${n.ada} baris sudah ada`);
    const tanpaRek = window.RincianApp.entries().filter((e) => !e.rek).map((e) => e.p.nama);
    const pesan = [`${hasil.kuitansi} kuitansi dan ${hasil.komponen} komponen dimasukkan.`];
    if (hasil.penerimaBaru.length) pesan.push(`${hasil.penerimaBaru.length} penerima baru ditambahkan.`);
    if (hasil.lewati.length) pesan.push(`Dilewati: ${hasil.lewati.map(esc).join(", ")}.`);
    if (tanpaRek.length) pesan.push(`<b>Pilih rekening</b> untuk: ${tanpaRek.map(esc).join(", ")}.`);
    pesanHtml(pesan.join("<br>"), "Impor selesai", tanpaRek.length ? "info" : "success");
  }

  // dipakai Mode Tabel (tombol "Upload file"): pilih file -> baca sheet Komponen -> { kolom, rows } atau null
  async function bacaFileKomponen() {
    const file = await pilihFile();
    if (!file) return null;
    if (!/\.xlsx$/i.test(file.name)) { UI.alert("Gunakan file .xlsx dari tombol \"Download template\".", "Format tidak didukung", "warning"); return null; }
    await loading("Membaca file…", esc(file.name), 800);
    let wb;
    try {
      const ExcelJS = await pakaiExcelJS();
      wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
    } catch (err) {
      console.error("[Upload Excel]", err);
      UI.alert("File tidak bisa dibaca. Pastikan file .xlsx tidak rusak atau terkunci password.", "Gagal membaca", "error");
      return null;
    }
    const km = bacaKomponen(wb);
    if (!km) { UI.alert(`Sheet "${SH.km}" tidak ditemukan. Gunakan file dari tombol "Download template".`, "Format file tidak sesuai", "warning"); return null; }
    if (km.masalah.length && !km.kolom) { pesanHtml(km.masalah.map(esc).join("<br>"), "Format file tidak sesuai", "warning"); return null; }
    Swal.close();
    return { ...km, namaFile: file.name };
  }

  window.unduhTemplateRincian = unduhTemplate;
  window.imporExcelRincian = imporExcel;
  // dipakai juga oleh script-tabel-rincian.js (Mode Tabel)
  window.ImporRincian = { periksa, periksaBaris, referensi, tanggal, angka, labelPenerima, labelObjek, KOL_KW, KOL_KM_TETAP, pesanHtml, esc, loading, identitas, lengkapKomp, unduhTemplate, bacaFileKomponen };

  // ---------- tombol ----------
  function pasang() {
    const tambah = $("#btnTambahRincian");
    if (!tambah || $("#btnModeTabel")) return;
    // satu baris: Tambah Penerima (2/3) + Tabel (1/3). Download template & upload file ada di dalam Mode Tabel.
    const bar = document.createElement("div");
    bar.className = "ix-bar";
    tambah.before(bar);
    bar.appendChild(tambah);
    bar.insertAdjacentHTML("beforeend", '<button type="button" class="ix-btn" id="btnModeTabel" title="Tabel Massal: isi banyak penerima & komponen sekaligus, download template & upload file Excel"><i class="fas fa-table"></i> Massal</button>');
    const jalan = (fn, btn) => async () => {
      if (btn.disabled) return;
      btn.classList.add("loading");
      try { await fn(); } finally { btn.classList.remove("loading"); }
    };
    const bT = $("#btnModeTabel"); // isinya di script-tabel-rincian.js
    bT.addEventListener("click", jalan(() => (window.bukaModeTabel ? window.bukaModeTabel() : UI.alert("script-tabel-rincian.js belum dimuat.", "Tabel Massal", "warning")), bT));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pasang);
  else pasang();
})();
