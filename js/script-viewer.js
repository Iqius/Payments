// ==========================================================================
// VIEWER VERIFIKASI & APPROVAL  (form-verifikasi.html / form-approval.html ?id=...)
// Mengisi seluruh halaman dari dokumen di Store (bukan data contoh) dan menghidupkan:
//   - header, informasi pengajuan, detail verifikasi, 5 tab (Ringkasan, Pajak, Pembayaran, Jurnal, Aktivitas)
//   - klik kartu penerima -> popup rincian (komponen / kuitansi) + tombol Setuju / Tolak per baris (verifikasi)
//   - tombol status per baris (? -> centang -> tolak), disimpan di dokumen
//   - popup Dokumen Pendukung: daftar file, pratinjau, pratinjau gabungan, tandai "Perlu perbaikan" + catatan
//   - Metode Pembayaran (Bank/Cek) dan Kode Buku (verifikasi)
//   - Approve / Kembalikan memeriksa kelengkapan dulu (lihat Viewer.cekSebelum)
// Dimuat SETELAH store, ui, script-detail, script-upload, script-review (halaman menyediakan urutannya).
// ==========================================================================
(function () {
  "use strict";
  const MODE = location.pathname.includes("form-verifikasi") ? "verifikasi" : "approval";
  const P = new URLSearchParams(location.search);
  const id = P.get("id");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const nf = new Intl.NumberFormat("id-ID");
  const rp = (n) => "Rp. " + nf.format(Math.round(n || 0)) + ",00";
  const V = (window.Viewer = {});

  let doc = id ? Store.get(id) : null;
  if (!doc) {
    const pulang = () => (location.href = "../../index.html");
    document.addEventListener("DOMContentLoaded", () => UI.alert("Dokumen tidak ditemukan. Buka dokumen dari daftar pengajuan.", "Perhatian").then(pulang));
    return;
  }
  const aktif = () => MODE === "verifikasi" && doc.status === "submitted" && !doc.verified && P.get("mode") !== "view";

  // ---------- model rincian ----------
  function modelDari(d) {
    if (Array.isArray(d.rincianModel) && d.rincianModel.length) return d.rincianModel;
    // dokumen contoh (seed) belum punya rincian: buat satu baris ringkas dari nominalnya
    const p = { idx: 0, tipe: "pegawai", nama: d.pengaju || "Satria Arindra", sub: "Pegawai", badge: "Pegawai", kode: "131230080", det: [{ label: "Kode Pegawai", val: "131230080", ok: null }, { label: "NPWP", val: "12-34.39843.883022", ok: true }, { label: "KTP", val: "1234567890123450", ok: true }, { label: "Grade", val: "16", ok: null }] };
    return [{ uid: "r1", p, rek: { bank: "Bank Mandiri", noRek: "131-00-230-081-1", nama: p.nama }, kuitansi: [], komponen: [{ id: "c1", g: "honor", nama: "Biaya kegiatan", formula: "", nominal: d.nominal || 0, pph: 0 }], openG: {} }];
  }
  const model = modelDari(doc);
  const KELOMPOK = [
    { key: "honor", title: "Honor dan Jasa Perorangan" },
    { key: "royalti", title: "Hadiah Royalti dan Sewa" },
    { key: "deposito", title: "Pendapatan Bunga Deposito" },
    { key: "usaha", title: "Penghasilan Usaha Perseorangan" },
    { key: "profesional", title: "Penghasilan dari Jasa Profesional" },
    { key: "sewa", title: "Pendapatan Sewa Properti" },
  ];
  const isBadan = (e) => e.p.tipe === "badan";
  const kwPph = (k) => k.subs.reduce((t, s) => t + s.pph, 0);
  const total = (e) => (isBadan(e) ? e.kuitansi.reduce((t, k) => t + k.nominal, 0) : e.komponen.reduce((t, c) => t + c.nominal, 0));
  const totalPph = (e) => (isBadan(e) ? e.kuitansi.reduce((t, k) => t + kwPph(k), 0) : e.komponen.reduce((t, c) => t + c.pph, 0));
  window.RincianApp = { entries: () => model, total, totalPph, isBadan, grandTotal: () => model.reduce((t, e) => t + total(e), 0), KELOMPOK };
  window.FormApp = {
    id: () => doc.id,
    base: () => Store.get(doc.id),
    skema: () => doc.skema,
    snapshot: () => Object.assign({}, Store.get(doc.id), { flow: doc.flow || "operasional" }),
  };
  const kelompokNama = (k) => (KELOMPOK.find((g) => g.key === k) || { title: k }).title;

  // ---------- status baris (verifikasi) ----------
  const STATUS = {
    warning: { cls: "status-warning", ico: "fa-solid fa-question", t: "Belum diperiksa" },
    success: { cls: "status-success", ico: "fa-solid fa-check", t: "Sesuai" },
    error: { cls: "status-error", ico: "fa-solid fa-ban", t: "Ditolak" },
  };
  const CYCLE = ["warning", "success", "error"];
  const cekOf = (uid) => (doc.rowCheck && doc.rowCheck[uid]) || "warning";
  function simpanCek(uid, st) {
    const rc = Object.assign({}, doc.rowCheck || {}, { [uid]: st });
    doc = Store.patch(doc.id, { rowCheck: rc });
  }
  function gambarStatus(btn, st) {
    const s = STATUS[st] || STATUS.warning;
    Object.values(STATUS).forEach((x) => btn.classList.remove(x.cls));
    btn.classList.add(s.cls);
    btn.innerHTML = `<i class="${s.ico}"></i>`;
    btn.dataset.status = st;
    btn.title = s.t;
  }
  function hiasBaris() {
    $$("#s5-content-ringkasan .s5-list-row[data-uid]").forEach((row) => {
      const uid = row.dataset.uid;
      const card = $(".person-card", row);
      if (card) card.style.cursor = "pointer";
      if (!$(".status-btn", row) && (MODE === "verifikasi" || (doc.rowCheck && doc.rowCheck[uid]))) {
        const b = document.createElement("div");
        b.className = "status-btn";
        b.dataset.uid = uid;
        b.style.cursor = aktif() ? "pointer" : "default";
        gambarStatus(b, cekOf(uid));
        row.appendChild(b);
      }
    });
  }

  // ---------- popup rincian penerima ----------
  let modalAktif = null;
  let uidAktif = null;
  const detailHtml = (det) =>
    (det || [])
      .map((d) => {
        const ic = d.ok === true ? ' <i class="fas fa-check-circle text-green"></i>' : d.ok === false ? ' <i class="fas fa-times-circle text-red"></i>' : "";
        return `<div class="sdh-item"><span>${esc(d.label)}${ic}</span><strong>${esc(d.val)}</strong></div>`;
      })
      .join("");

  function htmlKomponen(e, filter) {
    const grup = {};
    e.komponen.forEach((c) => {
      if (filter && c.g !== filter) return;
      (grup[c.g] = grup[c.g] || []).push(c);
    });
    const keys = Object.keys(grup);
    if (!keys.length) return '<div class="vw-kosong">Belum ada komponen biaya.</div>';
    return keys
      .map((g) => {
        const sub = grup[g].reduce((t, c) => t + c.nominal, 0);
        return `<div class="vw-group">
          <div class="vw-ghead"><span>${esc(kelompokNama(g))}</span><b>${rp(sub)}</b></div>
          <div class="vw-row vw-th"><span>Komponen Biaya</span><span class="r">Nominal</span><span class="r">Potongan PPh</span><span class="r">Nominal Transfer</span></div>
          ${grup[g].map((c) => `<div class="vw-row"><span>${esc(c.nama || kelompokNama(c.g))}${c.formula ? `<em>${esc(c.formula)}</em>` : ""}</span><span class="r">${rp(c.nominal)}</span><span class="r pph">${rp(c.pph)}</span><span class="r">${rp(c.nominal - c.pph)}</span></div>`).join("")}
        </div>`;
      })
      .join("");
  }
  function htmlKuitansi(e) {
    if (!e.kuitansi.length) return '<div class="vw-kosong">Belum ada kuitansi / invoice.</div>';
    return e.kuitansi
      .map(
        (k, i) => `<details class="vw-kw"${i === 0 ? " open" : ""}>
        <summary><span class="vw-no">${esc(k.no || "(belum ada nomor)")}</span><span>${esc(Store.util.fmtTgl(k.tgl || ""))}</span><span class="r">${rp(k.nominal)}</span><span class="r">PPN ${rp(k.ppn)}</span><span class="r pph">PPh ${rp(kwPph(k))}</span></summary>
        <div class="vw-subs">
          <div class="vw-row vw-th vw-sub"><span>Objek Pajak</span><span class="r">DPP PPh</span><span class="r">Tarif</span><span class="r">Potongan PPh</span></div>
          ${k.subs.length ? k.subs.map((s) => `<div class="vw-row vw-sub"><span>${esc(s.nama || "(Objek pajak belum dipilih)")} <em>${esc(s.kode || "")}</em></span><span class="r">${rp(s.dpp)}</span><span class="r">${esc(s.tarif)} %</span><span class="r pph">${rp(s.pph)}</span></div>`).join("") : '<div class="vw-kosong">Tidak ada objek pajak.</div>'}
        </div></details>`,
      )
      .join("");
  }

  function isiModal(m, e) {
    const badan = isBadan(e);
    const tipe = e.auto ? e.tipePengaju : e.p.tipe;
    const tema = tipe === "badan" ? "bad" : tipe === "dewan" ? "dew" : tipe === "perorangan" ? "per" : "peg";
    $(".s4-dynamic-header-row .sdh-title-group h3", m).textContent = e.p.nama;
    $(".s4-dynamic-header-row .sdh-title-group p", m).textContent = e.p.sub || "";
    $(".sdh-banner-card", m).className = "sdh-banner-card theme-" + (badan ? "badan-usaha" : "perorangan") + " tema-" + tema;
    $(".dyn-badge", m).textContent = e.p.badge || "";
    $(".sdh-details", m).innerHTML = detailHtml(e.p.det);
    const bank = $(".col-bank .bank-top-box", m);
    $(".box-title", bank).textContent = e.rek ? e.rek.nama : "Rekening belum dipilih";
    $(".acc-num-line strong", bank).textContent = e.rek ? e.rek.noRek : "-";
    $(".acc-owner", bank).textContent = e.rek ? e.rek.bank : "";
    const pph = totalPph(e);
    $(".col-bank .sub-info-line strong", m).textContent = rp(pph);
    $(".col-total .total-amount", m).textContent = rp(total(e));
    $(".col-total .sub-info-line strong", m).textContent = rp(total(e) - pph);
    const detil = $("#cardDetilPerjalananDinas", m);
    if (detil) detil.style.display = "none";
    const list = $(".kw-list", m);
    list.classList.add("vw-list");
    if (badan) {
      list.innerHTML = htmlKuitansi(e);
      const c = $(".kw-section-title-row span", m);
      if (c) c.textContent = `${e.kuitansi.length} Kuitansi`;
    } else {
      const sel = $(".kw-select-kategori", m);
      const ada = Array.from(new Set(e.komponen.map((c) => c.g)));
      sel.innerHTML = '<option value="">Semua Kelompok Biaya</option>' + ada.map((g) => `<option value="${g}">${esc(kelompokNama(g))}</option>`).join("");
      sel.onchange = () => (list.innerHTML = htmlKomponen(e, sel.value));
      list.innerHTML = htmlKomponen(e, "");
    }
    const foot = $(".app-modal-footer", m);
    if (foot) foot.style.display = aktif() ? "" : "none";
  }

  window.openModal = function (ev, modalId) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const row = ev && ev.currentTarget ? ev.currentTarget.closest(".s5-list-row") : null;
    const uid = typeof ev === "string" ? ev : row && row.dataset.uid;
    const e = model.find((x) => x.uid === uid);
    if (!e) return;
    uidAktif = uid;
    const m = document.getElementById(isBadan(e) ? "modalBadanUsaha" : "modalPerorangan");
    modalAktif = m;
    isiModal(m, e);
    m.style.display = "flex";
  };
  window.closeModal = function () {
    $$(".app-modal-overlay").forEach((m) => (m.style.display = "none"));
    modalAktif = null;
    uidAktif = null;
  };
  function tandai(st) {
    if (!uidAktif || !aktif()) return window.closeModal();
    simpanCek(uidAktif, st);
    const b = $(`#s5-content-ringkasan .status-btn[data-uid="${uidAktif}"]`);
    if (b) gambarStatus(b, st);
    UI.toast(st === "success" ? "Baris ditandai sesuai" : "Baris ditolak", st === "success" ? "ok" : "err");
    window.closeModal();
  }
  window.handleSetuju = () => tandai("success");
  window.handleTolak = () => tandai("error");
  window.addEventListener("click", (ev) => {
    if (ev.target.classList && ev.target.classList.contains("app-modal-overlay")) window.closeModal();
  });
  // klik pada daftar ringkasan: kartu penerima -> popup, tombol status -> ganti status
  document.addEventListener(
    "click",
    (ev) => {
      const sb = ev.target.closest("#s5-content-ringkasan .status-btn");
      if (sb) {
        ev.stopPropagation();
        if (!aktif()) return;
        const next = CYCLE[(CYCLE.indexOf(cekOf(sb.dataset.uid)) + 1) % CYCLE.length];
        simpanCek(sb.dataset.uid, next);
        gambarStatus(sb, next);
        return;
      }
      const pc = ev.target.closest("#s5-content-ringkasan .person-card");
      if (pc) {
        ev.stopPropagation();
        window.openModal(pc.closest(".s5-list-row").dataset.uid);
      }
    },
    true,
  );

  // ---------- popup dokumen pendukung ----------
  const PAGE_DOK = 12;
  const F = { page: 1, aktifId: null, gabung: false };
  const catatanOf = (fid) => (doc.fileNotes && doc.fileNotes[fid]) || "";
  const modalDok = () => document.getElementById("filePreviewModal");

  function kartuDok(f) {
    const ico = UploadApp.isPdf(f) ? '<i class="fas fa-file-pdf icon-red"></i>' : '<i class="fas fa-file-image icon-teal"></i>';
    return `<div class="file-item-card${f.id === F.aktifId && !F.gabung ? " active-card" : ""}" data-fid="${esc(f.id)}">
      <div class="fic-top">${ico}<div class="fic-details"><span class="fic-name">${esc(f.name)}</span><span class="fic-category">${f.tags.length ? esc(UploadApp.jenisNama(f.tags[0])) : "Belum ada jenis"}</span></div><span class="fic-size">${UploadApp.fmtSize(f.size)}</span></div>
      ${catatanOf(f.id) ? '<div class="badge-perbaikan"><i class="fas fa-triangle-exclamation"></i> Perlu perbaikan</div>' : ""}
    </div>`;
  }
  function renderDok() {
    const m = modalDok();
    const files = UploadApp.files;
    const pages = Math.max(1, Math.ceil(files.length / PAGE_DOK));
    F.page = Math.min(Math.max(F.page, 1), pages);
    const grid = $(".file-grid-2col", m);
    grid.innerHTML = files.length ? files.slice((F.page - 1) * PAGE_DOK, F.page * PAGE_DOK).map(kartuDok).join("") : '<div class="fc-empty">Belum ada dokumen pendukung.</div>';
    const from = files.length ? (F.page - 1) * PAGE_DOK + 1 : 0;
    const to = Math.min(F.page * PAGE_DOK, files.length);
    const info = $(".table-footer-pagination .pagination-info", m);
    if (info) info.textContent = `Menampilkan ${from} - ${to} dari ${files.length}`;
    const pc = $(".table-footer-pagination .pagination-controls", m);
    if (pc) {
      pc.innerHTML = `<button type="button" class="page-btn" data-pg="first"${F.page === 1 ? " disabled" : ""}><i class="fas fa-angle-double-left"></i></button>
        <button type="button" class="page-btn" data-pg="prev"${F.page === 1 ? " disabled" : ""}><i class="fas fa-angle-left"></i></button>
        <button type="button" class="page-btn active-page">${F.page}</button><span class="page-text">of ${pages}</span>
        <button type="button" class="page-btn" data-pg="next"${F.page === pages ? " disabled" : ""}><i class="fas fa-angle-right"></i></button>
        <button type="button" class="page-btn" data-pg="last"${F.page === pages ? " disabled" : ""}><i class="fas fa-angle-double-right"></i></button>`;
      pc.onclick = (ev) => {
        const b = ev.target.closest("[data-pg]");
        if (!b || b.disabled) return;
        F.page = { first: 1, prev: F.page - 1, next: F.page + 1, last: pages }[b.dataset.pg];
        renderDok();
      };
    }
    const fb = $(".feedback-card", m);
    if (fb) fb.style.display = aktif() && !F.gabung && F.aktifId ? "" : "none";
    const gb = $("#vw-gabung", m);
    if (gb) gb.classList.toggle("on", F.gabung);
  }
  function pilihDok(fid) {
    F.aktifId = fid;
    F.gabung = false;
    const f = UploadApp.files.find((x) => x.id === fid);
    const m = modalDok();
    renderDok();
    if (!f) return;
    UploadApp.tampilPreview(f, m);
    const ta = $("#revisionNote", m);
    if (ta) {
      ta.value = catatanOf(fid);
      const cc = $("#currentChar", m);
      if (cc) cc.textContent = ta.value.length;
    }
    const nt = $(".info-notice span", m);
    if (nt) nt.textContent = `Catatan dan status hanya berlaku untuk ${f.name}.`;
    const hp = $("#btnHapus", m);
    if (hp) hp.disabled = !catatanOf(fid);
  }
  function bukaGabungan() {
    F.gabung = true;
    renderDok();
    UploadApp.tampilGabungan(modalDok());
  }
  window.openFilePreviewModal = function () {
    const m = modalDok();
    m.classList.add("show");
    m.style.display = "flex";
    if (UploadApp.files.length) pilihDok(F.aktifId || UploadApp.files[0].id);
    else {
      renderDok();
      UploadApp.tampilPreview(null, m);
    }
  };
  window.openMergedPreview = function () {
    const m = modalDok();
    m.classList.add("show");
    m.style.display = "flex";
    bukaGabungan();
  };
  window.closeFilePreviewModal = function () {
    const m = modalDok();
    m.classList.remove("show");
    m.style.display = "none";
  };

  function pasangFeedback() {
    const m = modalDok();
    // lepas handler lama (script-verifikasi.js) dengan mengganti elemennya
    ["#btnMinta", "#btnHapus", "#revisionNote"].forEach((s) => {
      const el = $(s, m);
      if (el) el.replaceWith(el.cloneNode(true));
    });
    const ta = $("#revisionNote", m);
    const cc = $("#currentChar", m);
    if (ta) ta.addEventListener("input", () => cc && (cc.textContent = ta.value.length));
    const simpanNotes = (fn) => {
      const n = Object.assign({}, doc.fileNotes || {});
      fn(n);
      doc = Store.patch(doc.id, { fileNotes: n });
      renderDok();
      const hp = $("#btnHapus", m);
      if (hp) hp.disabled = !F.aktifId || !catatanOf(F.aktifId);
    };
    $("#btnMinta", m)?.addEventListener("click", () => {
      if (!aktif()) return;
      if (!F.aktifId) return UI.alert("Pilih salah satu dokumen terlebih dahulu.");
      const note = ta.value.trim();
      if (!note) {
        UI.toast("Catatan perbaikan wajib diisi.", "err");
        return ta.focus();
      }
      simpanNotes((n) => (n[F.aktifId] = note));
      UI.toast("Dokumen ditandai perlu perbaikan", "ok");
    });
    $("#btnHapus", m)?.addEventListener("click", async () => {
      if (!aktif() || !F.aktifId) return;
      if (!(await UI.confirm("Hapus tanda perbaikan pada dokumen ini?", { danger: true, ya: "Hapus", judul: "Hapus tanda perbaikan" }))) return;
      simpanNotes((n) => delete n[F.aktifId]);
      ta.value = "";
      if (cc) cc.textContent = "0";
    });
    $(".file-grid-2col", m).addEventListener("click", (ev) => {
      const c = ev.target.closest(".file-item-card[data-fid]");
      if (c) pilihDok(c.dataset.fid);
    });
    // tombol pratinjau gabungan di header popup
    const head = $(".custom-modal-header", m);
    if (head && !$("#vw-gabung", head)) {
      const b = document.createElement("button");
      b.type = "button";
      b.id = "vw-gabung";
      b.className = "vw-gabung-btn";
      b.innerHTML = '<i class="fas fa-layer-group"></i> Pratinjau gabungan';
      b.onclick = bukaGabungan;
      $(".modal-close-btn", head).insertAdjacentElement("beforebegin", b);
    }
  }

  // ---------- header, info, pembayaran ----------
  function isiHeader() {
    const bc = $(".header-left .breadcrumb");
    if (bc) bc.textContent = { pembayaran: "Klaim Langsung", persekot: "Persekot Kerja", pertanggungjawaban: "Pertanggungjawaban Persekot Kerja" }[doc.skema] || "Pengajuan";
    const t = $("#header-title");
    if (t) t.textContent = doc.jenis || "Operasional Umum";
    const pill = $$(".info-pill .value");
    if (pill[0]) pill[0].textContent = doc.id;
    const tg = $("#doc-date");
    if (tg) {
      tg.textContent = doc.tanggalRaw ? Store.util.fmtTglPanjang(doc.tanggalRaw) : doc.tanggal;
      tg.dataset.status = doc.status;
    }
    const ag = $("#info-kegiatan-terpilih-3");
    if (ag) ag.textContent = doc.anggaran || "-";
    document.title = (MODE === "verifikasi" ? "Verifikasi " : "Approval ") + doc.id;
  }
  function pasangPembayaran() {
    const btn = $("#btnPayment");
    const tx = btn && $(".btn-text", btn);
    const cek = (doc.metodeBayar || "Bank") === "Cek";
    if (btn && tx) {
      tx.textContent = cek ? "Cek" : "Bank";
      btn.classList.toggle("is-cek", cek);
      btn.disabled = !aktif();
      btn.onclick = (ev) => {
        ev.preventDefault();
        if (!aktif()) return;
        const now = btn.classList.toggle("is-cek");
        tx.textContent = now ? "Cek" : "Bank";
        doc = Store.patch(doc.id, { metodeBayar: now ? "Cek" : "Bank" });
      };
    }
    const kode = $(".btn-static");
    if (kode) {
      $(".code-text", kode).textContent = doc.kodeBuku || "S0118";
      kode.onclick = async () => {
        if (!aktif()) return;
        const r = await Swal.fire({ title: "Kode Buku", input: "text", inputValue: doc.kodeBuku || "S0118", inputAttributes: { maxlength: 12 }, showCancelButton: true, confirmButtonText: "Simpan", cancelButtonText: "Batal", reverseButtons: true, confirmButtonColor: "#1f6fa8", inputValidator: (v) => (!/^[A-Za-z0-9]{3,12}$/.test(String(v || "").trim()) ? "Kode 3-12 huruf/angka." : undefined) });
        if (!r.isConfirmed) return;
        doc = Store.patch(doc.id, { kodeBuku: r.value.trim().toUpperCase() });
        $(".code-text", kode).textContent = doc.kodeBuku;
        UI.toast("Kode buku disimpan", "ok");
      };
    }
  }

  // ---------- pemeriksaan sebelum Approve (dipanggil script-aksi.js) ----------
  V.catatanOtomatis = function () {
    const out = [];
    model.forEach((e) => {
      if (cekOf(e.uid) === "error") out.push(`- Baris "${e.p.nama}" ditolak.`);
    });
    UploadApp.files.forEach((f) => {
      if (catatanOf(f.id)) out.push(`- Dokumen ${f.name}: ${catatanOf(f.id)}`);
    });
    return out.join("\n").slice(0, 500);
  };
  V.cekSebelum = async function () {
    if (MODE === "approval") return UI.confirm("Setujui pengajuan ini?", { ya: "Setujui", judul: "Approve pengajuan" });
    const tolak = model.filter((e) => cekOf(e.uid) === "error");
    if (tolak.length) {
      await UI.alert(`${tolak.length} baris rincian ditolak. Gunakan "Kembalikan" untuk meminta perbaikan, atau ubah statusnya menjadi sesuai.`, "Belum bisa diverifikasi");
      return false;
    }
    const perbaikan = UploadApp.files.filter((f) => catatanOf(f.id));
    if (perbaikan.length) {
      await UI.alert(`${perbaikan.length} dokumen ditandai perlu perbaikan. Gunakan "Kembalikan" atau hapus tandanya.`, "Belum bisa diverifikasi");
      return false;
    }
    const belum = model.filter((e) => cekOf(e.uid) === "warning").length;
    const st = UploadApp.wajibStatus();
    const catatan = [];
    if (belum) catatan.push(`${belum} baris rincian belum diperiksa`);
    if (APP_CONFIG.validasiDokumenWajib && st.kurang.length) catatan.push("dokumen wajib belum lengkap (" + st.kurang.map(UploadApp.jenisNama).join(", ") + ")");
    if (catatan.length) return UI.confirm(catatan.join("; ") + ". Tetap verifikasi?", { ya: "Tetap verifikasi", judul: "Periksa kembali" });
    return true;
  };

  // ---------- mulai ----------
  function mulai() {
    isiHeader();
    UploadApp.load(doc.dokumen);
    Review.render();
    hiasBaris();
    // render ulang daftar (ganti halaman) -> hiasi lagi
    const cont = $("#s5-content-ringkasan");
    if (cont) new MutationObserver(() => hiasBaris()).observe(cont, { childList: true, subtree: true });
    if (window.DetailInfo) DetailInfo.clamp($(".s5-info-card .info-desc"));
    pasangPembayaran();
    pasangFeedback();
    renderDok();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(mulai, 0));
  else setTimeout(mulai, 0);
})();
