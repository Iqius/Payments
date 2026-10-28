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
    let b = await Store.File.get(docId() + ":" + f.id);
    if (!b && f.url) {
      // file contoh dari project (bukan unggahan): ambil dari url
      try {
        b = await (await fetch(f.url)).blob();
        f.size = f.size || b.size;
      } catch (e) {
        b = null;
      }
    }
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

  // ---------- daftar per jenis dokumen ----------
  // Tengah: semua jenis dokumen, masing-masing dengan tombol unggah. File yang sudah diunggah
  // tampil bersarang di bawah jenisnya (ikon branch). Satu file = satu jenis (tags[0]).
  const BRANCH = '<div class="branch-icon"><i class="branch-connector"></i></div>';
    function catatanFile(id) {
    try {
      const d = window.Store && window.FormApp ? Store.get(FormApp.id()) : null;
      return (d && d.fileNotes && d.fileNotes[id]) || "";
    } catch (e) {
      return "";
    }
  }
  function barisFile(f) {
    const note = catatanFile(f.id);
    return `
      <div class="step3-file-card f-row f-child${f.id === U.activeId ? " is-active" : ""}" data-fid="${f.id}">
        <div class="fr-name" title="${esc(f.name)}">${BRANCH}${iconOf(f)}<span class="fr-text">${esc(f.name)}</span></div>
        <span class="fr-size">${fmtSize(f.size)}</span>
        <span class="fr-fb">${note ? `<span class="badge-perbaikan" title="${esc(note)}"><i class="fas fa-triangle-exclamation"></i> Perlu perbaikan</span>` : ""}</span>
        <span class="fr-act"><button type="button" class="fc-del-btn fr-del" data-act="del" title="Hapus file"><i class="fas fa-trash-alt"></i></button></span>
      </div>`;
  }
  function barisJenis(j, files, wajib, tanpaUnggah) {
    const ada = files.length;
    return `
      <div class="jenis-grp${ada ? " ada" : ""}" data-jenis="${j.key}">
        <div class="f-row j-row" data-jenis="${j.key}">
          <div class="fr-name"><i class="fas ${ada ? "fa-folder-open" : "fa-folder"} j-ico"></i><span class="fr-text">${esc(j.nama)}</span>${
            wajib ? `<em class="j-wajib${ada ? " ok" : ""}">Wajib</em>` : ""
          }${ada ? `<span class="j-count">${ada} file</span>` : ""}</div>
          <span class="fr-act">${tanpaUnggah ? "" : `<button type="button" class="j-up-btn" data-act="upload" data-jenis="${j.key}" title="Unggah ${esc(j.nama)}"><i class="fas fa-upload"></i></button>`}</span>
        </div>
        ${files.map(barisFile).join("")}
      </div>`;
  }

  U.render = function (keepOpen) {
    const root = $("#step-2-wrapper");
    if (!root) return;
    const grid = $(".file-grid-2col", root);
    const wajib = wajibKeys();
    if (grid) {
      const keyAda = new Set(Store.JENIS_DOKUMEN.map((j) => j.key));
      const tanpa = U.files.filter((f) => !f.tags.length || !keyAda.has(f.tags[0]));
      grid.innerHTML =
        '<div class="fr-head"><span>Jenis Dokumen</span><span>Ukuran</span><span>Feedback</span><span>Aksi</span></div>' +
        Store.JENIS_DOKUMEN.map((j) => barisJenis(j, U.files.filter((f) => f.tags[0] === j.key), wajib.includes(j.key))).join("") +
        (tanpa.length ? barisJenis({ key: "", nama: "Belum ada jenis" }, tanpa, false, true) : "");
    }
    const info = $(".list-pagination .pagination-info strong", root);
    if (info) info.textContent = `${U.files.length} Dokumen`;
    const pc = $(".list-pagination .pagination-controls", root);
    if (pc) pc.style.display = "none"; // semua jenis tampil dalam satu daftar (bisa di-scroll)

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
  // jenis = key jenis dokumen tujuan (dari modal unggah); tanpa jenis -> "Belum ada jenis"
  window.handleFiles = function (files, jenis) {
    let n = 0;
    Array.from(files || []).forEach((file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!EXT_OK.includes(ext)) return UI.toast(`Format file "${file.name}" tidak didukung.`, "err");
      if (file.size > MAX_BYTES) return UI.toast(`Ukuran file "${file.name}" melebihi batas 10MB.`, "err");
      const f = { id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: file.name, size: file.size, type: file.type || ext, tags: jenis ? [jenis] : [], blob: file, stored: false };
      U.files.push(f);
      U.activeId = f.id;
      n++;
    });
    const fi = document.getElementById("fileInput");
    if (fi) fi.value = "";
    U.render();
    if (n) UI.toast(`${n} file ditambahkan${jenis ? " ke " + jenisNama(jenis) : ""}.`, "ok");
    return n;
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

  // ---------- modal unggah per jenis dokumen ----------
  // Klik ikon unggah pada baris jenis -> modal: tarik & lepas atau klik untuk memilih file.
  // File langsung masuk ke jenis itu saat dilepas / dipilih, lalu modal tertutup.
  let ujJenis = null;
  function modalUnggah() {
    let m = document.getElementById("modal-unggah-jenis");
    if (m) return m;
    m = document.createElement("div");
    m.id = "modal-unggah-jenis";
    m.className = "uj-overlay";
    m.hidden = true;
    m.innerHTML = `
      <div class="uj-box" role="dialog" aria-modal="true" aria-labelledby="uj-title">
        <div class="uj-head">
          <div><h3 id="uj-title">Unggah Dokumen</h3><p class="uj-sub">Pilih atau tarik file ke area di bawah.</p></div>
          <button type="button" class="uj-close" aria-label="Tutup"><i class="fas fa-times"></i></button>
        </div>
        <label class="uj-drop" id="uj-drop">
          <input type="file" id="uj-input" multiple accept=".pdf,.jpg,.jpeg,.png" hidden />
          <i class="fas fa-cloud-upload-alt uj-ico"></i>
          <strong>Tarik file & lepaskan di sini</strong>
          <span>atau klik untuk memilih file</span>
          <em>Format: PDF, JPG, JPEG, PNG | Maks. 10MB per file</em>
        </label>
      </div>`;
    document.body.appendChild(m);
    const drop = $("#uj-drop", m);
    const inp = $("#uj-input", m);
    const tutup = () => {
      m.hidden = true;
      ujJenis = null;
    };
    const masuk = (files) => {
      const key = ujJenis;
      if (!files || !files.length) return;
      if (handleFiles(files, key)) tutup();
      inp.value = "";
    };
    $(".uj-close", m).addEventListener("click", tutup);
    m.addEventListener("click", (ev) => ev.target === m && tutup());
    document.addEventListener("keydown", (ev) => ev.key === "Escape" && !m.hidden && tutup());
    inp.addEventListener("change", () => masuk(inp.files));
    ["dragenter", "dragover"].forEach((t) =>
      drop.addEventListener(t, (ev) => {
        ev.preventDefault();
        drop.classList.add("drag-active");
      }),
    );
    ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("drag-active")));
    drop.addEventListener("drop", (ev) => {
      ev.preventDefault();
      masuk(ev.dataTransfer && ev.dataTransfer.files);
    });
    return m;
  }
  U.bukaUnggah = function (key) {
    const m = modalUnggah();
    ujJenis = key;
    $("#uj-title", m).textContent = "Unggah " + jenisNama(key);
    m.hidden = false;
  };
  // kompatibilitas pemanggil lama
  U.bukaDropdown = () => {};
  window.openDocModal = () => {};
  window.closeDocModal = () => {};

  // ---------- klik pada daftar ----------
  document.addEventListener("click", (ev) => {
    const up = ev.target.closest('#step-2-wrapper [data-act="upload"]');
    if (up) return U.bukaUnggah(up.dataset.jenis);
    const card = ev.target.closest("#step-2-wrapper .step3-file-card[data-fid]");
    if (!card) return;
    const id = card.dataset.fid;
    const act = ev.target.closest("[data-act]");
    if (act && act.dataset.act === "del") return hapusFile(id);
    U.activeId = id;
    $$("#step-2-wrapper .step3-file-card[data-fid]").forEach((c) => c.classList.toggle("is-active", c.dataset.fid === id));
    tampilPreview(U.files.find((f) => f.id === id));
  });
  // ---------- serialisasi ----------
  U.dump = () => U.files.map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, tags: f.tags.slice(), ...(f.url ? { url: f.url } : {}) }));
  U.load = function (meta) {
    U.files = (meta || []).map((m) => ({ id: m.id, name: m.name, size: m.size, type: m.type, tags: (m.tags || []).slice(), url: m.url, blob: null, stored: true }));
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
