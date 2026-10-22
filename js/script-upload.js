// ==========================================================================
// STEP 2 - DOKUMEN PENDUKUNG (upload, jenis dokumen, preview, dokumen wajib)
// Muat SETELAH script-form.js dan store.js. Menimpa handleFiles / openDocModal / closeDocModal.
// File disimpan di IndexedDB (Store.File) saat Simpan Draf / Submit.
// ==========================================================================
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const PAGE = 10; // 10 baris (1 kolom) per halaman
  const MAX_BYTES = 10 * 1024 * 1024;
  const EXT_OK = ["pdf", "jpg", "jpeg", "png"];

  const U = {
    files: [], // { id, name, size, type, tags:[key], blob?, stored }
    removed: [], // id file yang sudah tersimpan lalu dihapus
    activeId: null,
    modalFileId: null,
    urls: {},
  };
  window.UploadApp = U;

  const skema = () => (window.FormApp && window.FormApp.skema && window.FormApp.skema()) || "pembayaran";
  const docId = () => (window.FormApp && window.FormApp.id && window.FormApp.id()) || "";
  const jenisNama = (key) => (Store.JENIS_DOKUMEN.find((j) => j.key === key) || { nama: key }).nama;
  const wajibKeys = () => Store.WAJIB[skema()] || [];

  const fmtSize = (b) => {
    if (b >= 1024 * 1024) return (b / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
    return Math.max(1, Math.round(b / 1024)) + " KB";
  };
  const isPdf = (f) => /pdf/i.test(f.type) || /\.pdf$/i.test(f.name);
  const iconOf = (f) => (isPdf(f) ? '<i class="fas fa-file-pdf text-red"></i>' : '<i class="fas fa-file-image text-green"></i>');

  // ---------- status dokumen wajib ----------
  U.wajibStatus = function () {
    const wajib = wajibKeys();
    const ada = new Set();
    U.files.forEach((f) => f.tags.forEach((t) => ada.add(t)));
    const lengkap = wajib.filter((k) => ada.has(k));
    return {
      wajib,
      lengkap,
      kurang: wajib.filter((k) => !ada.has(k)),
      uploaded: U.files.length,
      persen: wajib.length ? Math.round((lengkap.length / wajib.length) * 100) : 100,
    };
  };

  // ---------- blob & preview ----------
  async function blobOf(f) {
    if (f.blob) return f.blob;
    const b = await Store.File.get(docId() + ":" + f.id);
    if (b) f.blob = b;
    return b;
  }
  async function urlOf(f) {
    if (U.urls[f.id]) return U.urls[f.id];
    const b = await blobOf(f);
    if (!b) return null;
    U.urls[f.id] = URL.createObjectURL(b);
    return U.urls[f.id];
  }
  // ---------- pdf.js (tanpa toolbar bawaan viewer: tidak ada print/unduh) ----------
  let pdfLib = null;
  function muatScript(src) {
    return new Promise((ok, err) => {
      const sc = document.createElement("script");
      sc.src = src;
      sc.onload = ok;
      sc.onerror = () => err(new Error("Gagal memuat " + src));
      document.head.appendChild(sc);
    });
  }
  function pdfJs() {
    if (pdfLib) return pdfLib;
    const base = (Array.from(document.scripts).find((x) => /script-upload\.js/.test(x.src)) || {}).src || "";
    const dir = base.replace(/script-upload\.js.*$/, "lib/");
    // worker dimuat sebagai script biasa -> berjalan di halaman (tetap jalan walau dibuka lewat file://)
    pdfLib = muatScript(dir + "pdf.min.js")
      .then(() => muatScript(dir + "pdf.worker.min.js"))
      .then(() => window.pdfjsLib);
    return pdfLib;
  }
  async function renderPdf(blob, into, token) {
    const lib = await pdfJs();
    const pdf = await lib.getDocument({ data: await blob.arrayBuffer() }).promise;
    const wrap = document.createElement("div");
    wrap.className = "pdf-pages";
    into.appendChild(wrap);
    const lebar = Math.max(240, (into.clientWidth || 480) - 24);
    for (let i = 1; i <= pdf.numPages; i++) {
      if (token && token.batal) return;
      const page = await pdf.getPage(i);
      const v1 = page.getViewport({ scale: 1 });
      const dpr = window.devicePixelRatio || 1;
      const vp = page.getViewport({ scale: (lebar / v1.width) * dpr });
      const c = document.createElement("canvas");
      c.width = vp.width;
      c.height = vp.height;
      c.style.width = lebar + "px";
      c.style.height = (vp.height / dpr) + "px";
      c.className = "pdf-page";
      wrap.appendChild(c);
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    }
  }
  // isi satu file (gambar / pdf) ke container
  async function isiFile(f, into, token) {
    const b = await blobOf(f);
    if (!b) {
      into.innerHTML = '<div class="preview-empty">Pratinjau tidak tersedia untuk file ini.</div>';
      return;
    }
    if (isPdf(f)) {
      into.innerHTML = '<div class="preview-empty">Memuat PDF…</div>';
      const tmp = document.createElement("div");
      try {
        await renderPdf(b, tmp, token);
        if (token && token.batal) return;
        into.innerHTML = "";
        while (tmp.firstChild) into.appendChild(tmp.firstChild);
      } catch (e) {
        into.innerHTML = '<div class="preview-empty">PDF tidak dapat ditampilkan.</div>';
      }
    } else {
      const url = await urlOf(f);
      into.innerHTML = `<img src="${url}" alt="${esc(f.name)}" class="preview-receipt-img pv-img">`;
    }
  }
  let tokenSingle = null;
  async function tampilPreview(f, scope) {
    const root = scope || document.querySelector("#step-2-wrapper");
    const name = $(".pt-left span", root);
    const ico = $(".pt-left i", root);
    const box = $(".preview-image-container", root);
    if (!box) return;
    if (!f) {
      if (name) name.textContent = "Belum ada file";
      box.innerHTML = '<div class="preview-empty">Unggah file untuk melihat pratinjau.</div>';
      return;
    }
    if (name) name.textContent = f.name;
    if (ico) ico.className = isPdf(f) ? "fas fa-file-pdf text-red" : "fas fa-file-image text-green";
    if (tokenSingle) tokenSingle.batal = true;
    const tk = (tokenSingle = { batal: false });
    box.classList.toggle("is-pdf", isPdf(f));
    await isiFile(f, box, tk);
    const z = $(".pt-zoom", root);
    if (z) z.onclick = () => perbesar(f);
  }

  // tampilan besar satu file (tanpa toolbar PDF)
  async function perbesar(f) {
    if (typeof Swal === "undefined") return;
    let tk = { batal: false };
    await Swal.fire({
      title: f.name,
      html: '<div id="swal-pv" class="swal-pv"></div>',
      width: "min(900px, 92vw)",
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => isiFile(f, document.getElementById("swal-pv"), tk),
      willClose: () => (tk.batal = true),
    });
  }

  // pratinjau gabungan: semua file jadi satu tampilan, tiap file diberi label di atasnya
  let tokenGab = null;
  async function tampilGabungan(scope) {
    const box = $(".preview-image-container", scope);
    const name = $(".pt-left span", scope);
    const ico = $(".pt-left i", scope);
    if (!box) return;
    if (tokenGab) tokenGab.batal = true;
    const tk = (tokenGab = { batal: false });
    if (name) name.textContent = `Pratinjau Gabungan (${U.files.length} dokumen)`;
    if (ico) ico.className = "fas fa-layer-group";
    box.classList.add("is-merged");
    box.classList.remove("is-pdf");
    if (!U.files.length) {
      box.innerHTML = '<div class="preview-empty">Belum ada dokumen pendukung.</div>';
      return;
    }
    box.innerHTML = "";
    box.scrollTop = 0;
    const slots = U.files.map((f, i) => {
      const sec = document.createElement("section");
      sec.className = "mp-sec";
      sec.dataset.fid = f.id;
      sec.innerHTML = `<div class="mp-label">${iconOf(f)} <strong>${i + 1}. ${esc(f.name)}</strong><span class="mp-tags">${f.tags.map((t) => `<span class="doc-tag">${esc(jenisNama(t))}</span>`).join("") || '<span class="doc-tag">Belum ada jenis</span>'}</span></div><div class="mp-body"><div class="preview-empty">Memuat…</div></div>`;
      box.appendChild(sec);
      return { f, body: sec.querySelector(".mp-body") };
    });
    for (const s of slots) {
      if (tk.batal) return;
      await isiFile(s.f, s.body, tk);
    }
    if (!tk.batal) box.scrollTop = 0;
  }
  U.tampilGabungan = tampilGabungan;
  U.fokusGabungan = (scope, id) => {
    const sec = scope.querySelector(`.mp-sec[data-fid="${id}"]`);
    if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---------- render kartu ----------
  // nama baris = jenis dokumen yang dipilih (bila ada yang sama diberi nomor); nama file asli tampil di pratinjau
  function labelBaris(f) {
    if (!f.tags.length) return "";
    const nama = f.tags.map(jenisNama).join(", ");
    const sama = U.files.filter((x) => x.tags.map(jenisNama).join(", ") === nama);
    return sama.length > 1 ? `${nama} (${sama.indexOf(f) + 1})` : nama;
  }
  function catatanFile(id) {
    try {
      const d = window.Store && window.FormApp ? Store.get(FormApp.id()) : null;
      return (d && d.fileNotes && d.fileNotes[id]) || "";
    } catch (e) {
      return "";
    }
  }
  function kartu(f, readOnly) {
    const lbl = labelBaris(f);
    const note = catatanFile(f.id);
    return `
      <div class="step3-file-card f-row${f.tags.length ? "" : " card-warning"}${f.id === U.activeId ? " is-active" : ""}" data-fid="${f.id}">
        <div class="fr-name" title="${esc(f.name)}">${iconOf(f)}${
          lbl
            ? `<span class="fr-text">${esc(lbl)}</span>`
            : `<span class="fr-text">${esc(f.name)}</span><span class="fr-warn" data-act="jenis"><i class="fas fa-exclamation-circle"></i> Belum pilih jenis dokumen</span>`
        }</div>
        <span class="fr-size">${fmtSize(f.size)}</span>
        <span class="fr-fb">${note ? `<span class="badge-perbaikan" title="${esc(note)}"><i class="fas fa-triangle-exclamation"></i> Perlu perbaikan</span>` : ""}</span>
        <span class="fr-act">${readOnly ? "" : '<button type="button" class="fc-del-btn fr-del" data-act="del" title="Hapus file"><i class="fas fa-trash-alt"></i></button>'}</span>
      </div>`;
  }

  U.render = function (keepOpen) {
    const root = $("#step-2-wrapper");
    if (!root) return;
    const grid = $(".file-grid-2col", root);
    const pages = Math.max(1, Math.ceil(U.files.length / PAGE));
    U.page = Math.min(Math.max(U.page || 1, 1), pages);
    if (grid) grid.innerHTML = U.files.length ? '<div class="fr-head"><span>Jenis Dokumen</span><span>Ukuran</span><span>Feedback</span><span>Aksi</span></div>' + U.files.slice((U.page - 1) * PAGE, U.page * PAGE).map((f) => kartu(f, false)).join("") : '<div class="fc-empty">Belum ada dokumen. Unggah dokumen pendukung di bawah.</div>';
    const info = $(".list-pagination .pagination-info strong", root);
    if (info) info.textContent = `${U.files.length} Dokumen`;
    const pc = $(".list-pagination .pagination-controls", root);
    if (pc) {
      pc.style.display = U.files.length > PAGE ? "" : "none";
      pc.innerHTML = `<button type="button" class="page-btn" data-pg="first"${U.page === 1 ? " disabled" : ""}><i class="fas fa-step-backward"></i></button>
        <button type="button" class="page-btn" data-pg="prev"${U.page === 1 ? " disabled" : ""}><i class="fas fa-chevron-left"></i></button>
        <button type="button" class="page-btn active-page">${U.page}</button><span class="page-text">of ${pages}</span>
        <button type="button" class="page-btn" data-pg="next"${U.page === pages ? " disabled" : ""}><i class="fas fa-chevron-right"></i></button>
        <button type="button" class="page-btn" data-pg="last"${U.page === pages ? " disabled" : ""}><i class="fas fa-step-forward"></i></button>`;
      pc.onclick = (ev) => {
        const b = ev.target.closest("[data-pg]");
        if (!b || b.disabled) return;
        U.page = { first: 1, prev: U.page - 1, next: U.page + 1, last: pages }[b.dataset.pg];
        U.render();
      };
    }

    const st = U.wajibStatus();
    const box = $(".mandatory-box", root);
    if (box) {
      box.innerHTML =
        "<strong>Dokumen Wajib</strong><ul>" +
        (st.wajib.length
          ? st.wajib.map((k) => `<li class="${st.lengkap.includes(k) ? "ok" : "miss"}">${esc(jenisNama(k))}</li>`).join("")
          : "<li>Tidak ada dokumen wajib</li>") +
        "</ul>";
    }
    const active = U.files.find((f) => f.id === U.activeId) || U.files[0] || null;
    U.activeId = active ? active.id : null;
    if (!keepOpen) tampilPreview(active);
    refreshJenisBox(keepOpen === true);
    refreshSummaryKiri();
    if (window.Review && Review.refreshDocs) Review.refreshDocs();
  };

  // ---------- panel kiri: ringkasan anggaran & skema ----------
  function refreshSummaryKiri() {
    const root = $("#step-2-wrapper");
    if (!root || !window.FormApp) return;
    const sk = skema();
    const card = $(".step3-summary-card .radio-card", $$(".step3-summary-card", root)[1] || root);
    if (card) {
      const nama = { pembayaran: "Klaim Langsung", persekot: "Persekot Kerja", pertanggungjawaban: "Pertanggungjawaban Persekot Kerja" }[sk];
      const sub = { pembayaran: "Pembayaran reimburse, tagihan, dan biaya kegiatan", persekot: "Dana muka sebelum kegiatan", pertanggungjawaban: "Pertanggungjawaban dana muka persekot kerja" }[sk];
      $("strong", card).textContent = nama;
      $("span", card).textContent = sub;
    }
    const f = $("#step3-persekot-fields", root);
    if (f) {
      f.style.display = sk === "pembayaran" ? "none" : "block";
      const d = FormApp.snapshot();
      const t = $("#step3-summary-tgl-kegiatan");
      const n = $("#step3-summary-nilai-persekot");
      if (t) t.textContent = d.tanggalKegiatanRaw ? Store.util.fmtTglPanjang(d.tanggalKegiatanRaw) : d.tanggalKegiatan || "-";
      if (n) n.textContent = "Rp. " + new Intl.NumberFormat("id-ID").format(d.nilaiPersekot || 0) + ",00";
    }
    const kep = $(".keperluan-text-box", root);
    if (kep) kep.textContent = $("#input-keperluan")?.value || "";
  }
  U.refreshSummaryKiri = refreshSummaryKiri;

  // ---------- tambah / hapus file ----------
  window.handleFiles = function (files) {
    let n = 0;
    Array.from(files || []).forEach((file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!EXT_OK.includes(ext)) return UI.toast(`Format file "${file.name}" tidak didukung.`, "err");
      if (file.size > MAX_BYTES) return UI.toast(`Ukuran file "${file.name}" melebihi batas 10MB.`, "err");
      const f = { id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: file.name, size: file.size, type: file.type || ext, tags: [], blob: file, stored: false };
      U.files.push(f);
      U.activeId = f.id;
      n++;
    });
    const fi = document.getElementById("fileInput");
    if (fi) fi.value = "";
    if (n) U.page = Math.ceil(U.files.length / PAGE);
    U.render();
    if (n) {
      UI.toast(`${n} file ditambahkan. Pilih jenis dokumen pada setiap file.`, "ok");
      if (n === 1) U.bukaDropdown();
    }
  };

  async function hapusFile(id) {
    const f = U.files.find((x) => x.id === id);
    if (!f) return;
    if (!(await UI.confirm(`Hapus file "${f.name}"?`, { danger: true, ya: "Hapus", judul: "Hapus file" }))) return;
    U.files = U.files.filter((x) => x.id !== id);
    if (f.stored) U.removed.push(id);
    if (U.urls[id]) {
      URL.revokeObjectURL(U.urls[id]);
      delete U.urls[id];
    }
    if (U.activeId === id) U.activeId = null;
    U.render();
  }

  // ---------- dropdown jenis dokumen (di bawah pratinjau) ----------
  function ensureJenisBox() {
    const panel = $("#step-2-wrapper .step3-right-panel");
    if (!panel) return null;
    let box = $(".jenis-box", panel);
    if (box) return box;
    box = document.createElement("div");
    box.className = "jenis-box";
    box.innerHTML = `
      <label class="jb-label">Jenis Dokumen <span class="jb-req">*</span></label>
      <div class="jd-dd">
        <button type="button" class="jd-btn" id="jd-btn"><span class="jd-text">Label</span><i class="fas fa-chevron-down"></i></button>
        <div class="jd-menu" id="jd-menu" hidden></div>
      </div>
      <button type="button" class="jb-hapus" id="jb-hapus">Hapus</button>`;
    const pv = $(".preview-image-container", panel);
    if (pv) panel.insertBefore(box, pv); // urutan: nama file, pilihan jenis + hapus, pratinjau
    else panel.appendChild(box);
    $("#jd-btn", box).addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!U.activeId) return;
      const m = $("#jd-menu", box);
      m.hidden = !m.hidden;
    });
    $("#jd-menu", box).addEventListener("click", (ev) => ev.stopPropagation());
    $("#jd-menu", box).addEventListener("change", (ev) => {
      const f = U.files.find((x) => x.id === U.activeId);
      if (!f) return;
      const v = ev.target.value; // satu file = satu jenis dokumen
      f.tags = v ? [v] : [];
      U.render(true);
      $("#jd-menu", box).hidden = true;
    });
    $("#jb-hapus", box).addEventListener("click", () => U.activeId && hapusFile(U.activeId));
    document.addEventListener("click", () => {
      const m = $("#jd-menu", box);
      if (m) m.hidden = true;
    });
    return box;
  }
  function refreshJenisBox(keepOpen) {
    const box = ensureJenisBox();
    if (!box) return;
    const f = U.files.find((x) => x.id === U.activeId);
    const wajib = wajibKeys();
    const menu = $("#jd-menu", box);
    const btn = $("#jd-btn", box);
    btn.disabled = !f;
    $("#jb-hapus", box).disabled = !f;
    $(".jd-text", btn).textContent = f && f.tags.length ? f.tags.map(jenisNama).join(", ") : f ? "Pilih jenis dokumen" : "Label";
    btn.classList.toggle("jd-kosong", !!f && !f.tags.length);
    menu.innerHTML = Store.JENIS_DOKUMEN.map(
      (j) => `<label class="jd-opt"><input type="radio" name="jd-jenis" value="${j.key}" ${f && f.tags.includes(j.key) ? "checked" : ""}><span class="jd-box"><i class="fas fa-check"></i></span><span>${esc(j.nama)}${wajib.includes(j.key) ? '<em class="doc-wajib">Wajib</em>' : ""}</span></label>`,
    ).join("");
    if (!keepOpen) menu.hidden = true;
  }
  U.bukaDropdown = () => {
    const box = ensureJenisBox();
    if (box && U.activeId) $("#jd-menu", box).hidden = false;
  };
  function bukaModalJenis(id) {
    U.activeId = id;
    U.render();
    U.bukaDropdown();
  }
  window.openDocModal = function () {
    if (U.activeId) bukaModalJenis(U.activeId);
  };
  window.closeDocModal = function () {
    $("#modalJenisDokumen")?.classList.add("hidden");
  };

  // ---------- klik pada kartu ----------
  document.addEventListener("click", (ev) => {
    const card = ev.target.closest("#step-2-wrapper .step3-file-card[data-fid]");
    if (!card) return;
    const id = card.dataset.fid;
    const act = ev.target.closest("[data-act]");
    if (act && act.dataset.act === "del") return hapusFile(id);
    U.activeId = id;
    if (act && act.dataset.act === "jenis") return bukaModalJenis(id);
    $$("#step-2-wrapper .step3-file-card").forEach((c) => c.classList.toggle("is-active", c.dataset.fid === id));
    tampilPreview(U.files.find((f) => f.id === id));
    refreshJenisBox();
  });

  // ---------- serialisasi ----------
  U.dump = () => U.files.map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, tags: f.tags.slice() }));
  U.load = function (meta) {
    U.files = (meta || []).map((m) => ({ id: m.id, name: m.name, size: m.size, type: m.type, tags: (m.tags || []).slice(), blob: null, stored: true }));
    U.removed = [];
    U.activeId = U.files[0] ? U.files[0].id : null;
    U.render();
  };
  // simpan blob baru ke IndexedDB, hapus yang dibuang
  U.persist = async function (id) {
    for (const f of U.files) {
      if (f.blob && !f.stored) {
        await Store.File.put(id + ":" + f.id, f.blob);
        f.stored = true;
      }
    }
    for (const rid of U.removed) await Store.File.remove(id + ":" + rid);
    U.removed = [];
  };
  U.blobOf = blobOf;
  U.urlOf = urlOf;
  U.tampilPreview = tampilPreview;
  U.fmtSize = fmtSize;
  U.iconOf = iconOf;
  U.jenisNama = jenisNama;
  U.isPdf = isPdf;
})();
