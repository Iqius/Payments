// ==========================================================================
// FORM APP - menyatukan step 1..5: buat / edit draf / revisi / pertanggungjawaban,
// Simpan Draf dan Submit ke Store (localStorage + IndexedDB).
// Muat PALING AKHIR (setelah store, ui, rincian, upload, review).
// URL:  ?type=operasional|perjalanan_dinas            -> dokumen baru
//       ?type=..&edit=<id>                            -> ubah Draft / Revise
//       ?type=..&id=<persekotId>&idAnggaran=<id>      -> pertanggungjawaban persekot
// ==========================================================================
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const P = new URLSearchParams(location.search);
  const F = { _kep: "unit", _unitSentral: "", _id: null, _refId: null, _mode: "new", _saving: false };
  window.FormApp = F;

  const hariIni = () => Store.util.todayIso();
  const parseNominal = (v) => {
    const s = String(v || "").replace(/[^\d,]/g, "").replace(",", ".");
    return Number(s) || 0;
  };

  // ---------- accessor yang dipakai modul lain ----------
  F.id = () => F._id || "";
  F.base = () => (F._id ? Store.get(F._id) : null);
  F.skema = () => (typeof modePertanggungjawaban !== "undefined" && modePertanggungjawaban ? "pertanggungjawaban" : typeof selectedSkemaType !== "undefined" ? selectedSkemaType : "pembayaran");

  function anggaranTerpilih() {
    return typeof anggaranData !== "undefined" ? anggaranData.find((a) => a.terpilih) || null : null;
  }

  F.snapshot = function () {
    const sk = F.skema();
    const ag = anggaranTerpilih();
    const tglEl = $("#input-tanggal-kegiatan");
    let tgl = "";
    let tglRaw = "";
    if (tglEl && tglEl.value) {
      if (tglEl.type === "date") {
        tglRaw = tglEl.value;
        tgl = Store.util.fmtTgl(tglEl.value);
      } else {
        tgl = tglEl.value;
        tglRaw = F._tglRaw || "";
      }
    }
    const b = F.base();
    return {
      id: F._id,
      flow: typeof currentType !== "undefined" ? currentType : "operasional",
      skema: sk,
      idAnggaran: ag ? ag.idAnggaran : (b && b.idAnggaran) || P.get("idAnggaran") || "",
      anggaran: ag ? ag.judul : (b && b.anggaran) || "",
      keperluan: ($("#input-keperluan") || {}).value || "",
      tanggalKegiatan: sk === "pembayaran" ? "" : tgl,
      tanggalKegiatanRaw: sk === "pembayaran" ? "" : tglRaw,
      nilaiPersekot: sk === "pembayaran" ? 0 : parseNominal(($("#input-nilai-persekot") || {}).value),
      refId: sk === "pertanggungjawaban" ? F._refId : null,
      detail: F.detail(),
      kepemilikan: F._kep,
      unitSentral: F._kep === "sentral" ? F._unitSentral : null,
      rincian: RincianApp.payload(),
      rincianModel: RincianApp.dump(),
      dokumen: UploadApp.dump(),
    };
  };

  // detail untuk card "Detail Verifikasi"
  const inp = (id) => (($("#" + id) || {}).value || "").trim();
  F.detail = function () {
    if (currentType === "perjalanan_dinas") return DetailInfo.bacaPerjalanan();
    if (currentType === "pengadaan") {
      const o = {};
      DetailInfo.PENGADAAN.forEach((f) => (o[f.k] = f.uang ? parseNominal(inp("input-" + f.k)) : inp("input-" + f.k)));
      return o;
    }
    return null;
  };
  function sisipPengadaan() {
    if (currentType !== "pengadaan" || $("#input-noPengadaan")) return;
    const wrap = $("#step-1-wrapper");
    if (!wrap) return;
    wrap.classList.add("has-pengadaan");
    wrap.style.overflowY = "auto"; // form pengadaan lebih panjang: step 1 bisa di-scroll (menimpa overflow:hidden bawaan HTML)
    const div = document.createElement("div");
    div.className = "pengadaan-section";
    if ((window.PENGADAAN_KIRIMAN || {}).tampil === false) div.style.display = "none";
    const fld = (f) =>
      f.k === "termin"
        ? `<div class="input-group"><label>${f.l} <b style="color:#d93025">*</b></label><select id="input-termin" class="base-textbox"><option value="">Pilih...</option><option>Termin</option><option>Sekaligus</option></select></div>`
        : `<div class="input-group"><label>${f.l}${f.opsional ? "" : ' <b style="color:#d93025">*</b>'}</label>${f.uang ? '<div class="input-with-prefix"><span class="prefix">Rp.</span>' : ""}<input type="text" id="input-${f.k}" data-uang="${f.uang ? 1 : 0}" class="base-textbox" placeholder="${f.uang ? "0,00" : f.l}">${f.uang ? "</div>" : ""}</div>`;
    div.innerHTML = `<h3>Detail Pengadaan</h3><div class="pengadaan-grid">${DetailInfo.PENGADAAN.map(fld).join("")}</div>`;
    wrap.appendChild(div);
    div.querySelectorAll('input[data-uang="1"]').forEach((el) =>
      el.addEventListener("blur", () => {
        const n = parseNominal(el.value);
        el.value = n ? formatNominalInput(n) : "";
      }),
    );
  }
  function isiDetailPengadaan(d) {
    if (!d) return;
    DetailInfo.PENGADAAN.forEach((f) => {
      const e = $("#input-" + f.k);
      if (e) e.value = f.uang ? (d[f.k] ? formatNominalInput(d[f.k]) : "") : d[f.k] || "";
    });
  }

  // data kiriman aplikasi pengadaan (js/data-pengadaan.js + parameter URL)
  function kirimanPengadaan() {
    const K = window.PENGADAAN_KIRIMAN;
    if (!K || K.aktif === false) return null;
    const q = {};
    DetailInfo.PENGADAAN.forEach((f) => {
      if (P.has(f.k)) q[f.k] = f.uang ? parseNominal(P.get(f.k)) : P.get(f.k);
    });
    const ag = anggaranTerpilih();
    const data = typeof K.ambil === "function" ? K.ambil({ idAnggaran: ag ? ag.idAnggaran : "", query: q }) : K.data;
    return Object.assign({}, data || {}, q);
  }
  function kunciPengadaan() {
    const K = window.PENGADAAN_KIRIMAN;
    const sec = $(".pengadaan-section");
    if (!sec || !K || K.aktif === false || !K.terkunci) return;
    sec.classList.add("terkunci");
    DetailInfo.PENGADAAN.forEach((f) => {
      const e = $("#input-" + f.k);
      if (!e) return;
      if (e.tagName === "SELECT") e.disabled = true;
      else e.readOnly = true;
    });
    if (!sec.querySelector(".pg-note")) sec.querySelector("h3").insertAdjacentHTML("afterend", '<p class="pg-note"><i class="fas fa-link"></i> Data dikirim otomatis dari aplikasi pengadaan.</p>');
  }

  // ---------- validasi per langkah ----------
  function cekLangkah1() {
    const s = F.snapshot();
    if (!s.idAnggaran) return "Pilih kegiatan anggaran terlebih dahulu.";
    if (s.skema === "persekot") {
      if (!s.tanggalKegiatan) return "Tanggal kegiatan persekot belum diisi.";
      if (s.nilaiPersekot <= 0) return "Nilai pengajuan persekot harus lebih dari 0.";
      if (s.nilaiPersekot > Store.saldo(s.idAnggaran)) return "Nilai persekot melebihi saldo anggaran.";
    }
    if (currentType === "pengadaan" && (window.PENGADAAN_KIRIMAN || {}).tampil !== false) {
      for (const f of DetailInfo.PENGADAAN) {
        if (f.opsional) continue;
        const v = s.detail[f.k];
        if (f.uang ? !(v > 0) : !String(v || "").trim()) return `${f.l} belum diisi.`;
      }
    }
    if (!s.keperluan.trim()) return "Keperluan pencairan belum diisi.";
    return null;
  }
  function langkahAktif() {
    const flow = getActiveFlow();
    return flow[currentIndex] ? flow[currentIndex].targetWrapper : 0;
  }

  // ---------- loading di tengah (SweetAlert) ----------
  // Pura-pura memuat supaya perpindahan terasa jelas; nanti diganti menunggu respons backend.
  const tunggu = (ms) => new Promise((ok) => setTimeout(ok, ms));
  async function loadingTengah(judul, ms = 500, teks = "Mohon tunggu sebentar…") {
    Swal.fire({ title: judul, html: teks, allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
    await tunggu(ms);
  }
  let pindah = false; // cegah klik ganda selama loading

  // ---------- navigasi ----------
  const nextOrig = window.nextStep;
  window.nextStep = async function () {
    if (pindah) return;
    if (langkahAktif() === 1) {
      const err = cekLangkah1();
      if (err) return UI.toast(err, "err");
    }
    if (langkahAktif() === 4 && !RincianApp.entries().length) return UI.toast("Tambahkan minimal satu penerima pada rincian biaya.", "err");
    // rincian belum valid -> langsung tampilkan pesannya (tanpa loading)
    if (langkahAktif() === 4 && typeof window.validasiRincian === "function" && window.validasiRincian()) return nextOrig();
    pindah = true;
    try {
      await loadingTengah("Memuat halaman…", 500);
      Swal.close();
      nextOrig();
    } finally {
      pindah = false;
    }
  };
  const prevOrig = window.prevStep;
  window.prevStep = async function () {
    if (pindah) return;
    pindah = true;
    try {
      await loadingTengah(currentIndex === 0 ? "Kembali ke daftar…" : "Memuat halaman…", 400);
      if (currentIndex === 0) return (location.href = "../../index.html");
      Swal.close();
      prevOrig();
    } finally {
      pindah = false;
    }
  };
  const renderOrig = window.render;
  window.render = function () {
    renderOrig();
    try {
      const w = langkahAktif();
      if (w === 2) UploadApp.render();
      if (w === 4) RincianApp.refresh();
      if (w === 5) Review.render();
    } catch (e) {
      console.error("[form-app] render", e);
    }
  };

  // ---------- header ----------
  function isiHeader() {
    const t = $("#doc-id");
    if (t) t.textContent = F._id;
    const d = $("#doc-date");
    if (d) {
      const b = F.base();
      d.textContent = Store.util.fmtTglPanjang(b ? b.tanggalRaw : hariIni());
    }
    const h = $("#header-title");
    if (h) h.textContent = { perjalanan_dinas: "Perjalanan Dinas", pengadaan: "Pengadaan" }[currentType] || "Operasional Umum";
  }

  // ---------- simpan ----------
  async function simpanKeStore(submit) {
    if (F._saving) return null;
    F._saving = true;
    try {
      const s = F.snapshot();
      const b = F.base();
      if (b && !["draft", "revise"].includes(b.status)) throw new Error("Dokumen ini sudah diajukan dan tidak bisa diubah.");
      if (!submit && !s.idAnggaran) throw new Error("Pilih kegiatan anggaran sebelum menyimpan draf.");
      if (submit) {
        const err = cekLangkah1();
        if (err) throw new Error(err);
        if (APP_CONFIG.validasiDokumenWajib) {
          const st = UploadApp.wajibStatus();
          if (st.kurang.length) throw new Error("Dokumen wajib belum lengkap: " + st.kurang.map(UploadApp.jenisNama).join(", ") + ".");
        }
      }
      await UploadApp.persist(s.id);
      const doc = submit ? Store.submit(s) : Store.save(s);
      return doc;
    } finally {
      F._saving = false;
    }
  }
  F.simpan = () => simpanKeStore(false);
  F.submit = () => simpanKeStore(true);

  // ---------- simpan draf & submit: konfirmasi -> loading -> notifikasi di tengah ----------
  const WARNA = { confirmButtonColor: "#1f6fa8", cancelButtonColor: "#94a3b8" };
  const gagal = (e) => Swal.fire({ icon: "error", title: "Gagal", text: e.message, confirmButtonText: "OK", ...WARNA });

  window.simpanDraft = async function () {
    const r = await Swal.fire({
      icon: "question",
      title: "Simpan sebagai draf?",
      text: "Pengajuan disimpan dan bisa dilanjutkan nanti dari daftar pengajuan.",
      showCancelButton: true,
      confirmButtonText: "Simpan Draf",
      cancelButtonText: "Batal",
      reverseButtons: true,
      ...WARNA,
    });
    if (!r.isConfirmed) return;
    try {
      await loadingTengah("Menyimpan draf…", 700);
      await F.simpan();
      isiHeader();
      await Swal.fire({ icon: "success", title: "Draf berhasil disimpan", text: "ID Dokumen " + F._id, timer: 2000, timerProgressBar: true, confirmButtonText: "OK", ...WARNA });
    } catch (e) {
      gagal(e);
    }
  };
  window.submitPengajuan = async function () {
    const persekot = typeof selectedSkemaType !== "undefined" && selectedSkemaType === "persekot";
    const r = await Swal.fire({
      icon: "warning",
      title: "Submit pengajuan?",
      html: "Pastikan data sudah benar. Setelah disubmit, pengajuan <b>tidak bisa diubah</b> dan diteruskan ke verifikator.",
      showCancelButton: true,
      confirmButtonText: "Ya, Submit",
      cancelButtonText: "Periksa lagi",
      reverseButtons: true,
      focusCancel: true,
      ...WARNA,
    });
    if (!r.isConfirmed) return;
    try {
      await loadingTengah("Mengirim pengajuan…", 900);
      const doc = await F.submit();
      await Swal.fire({
        icon: "success",
        title: doc.skema === "persekot" || persekot ? "Persekot berhasil diajukan" : "Pengajuan berhasil dikirim",
        text: doc.skema === "persekot" ? "Status: Unrealized. Kembali ke daftar pengajuan…" : "Kembali ke daftar pengajuan…",
        timer: 1800,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      location.href = "../../index.html";
    } catch (e) {
      gagal(e);
    }
  };

  // ---------- mengisi form dari dokumen ----------
  function isiFormDariDoc(doc) {
    if (doc.skema === "persekot") selectSkema("persekot");
    const tgl = $("#input-tanggal-kegiatan");
    const nil = $("#input-nilai-persekot");
    if (tgl && doc.tanggalKegiatanRaw && tgl.type === "date") tgl.value = doc.tanggalKegiatanRaw;
    if (nil && doc.nilaiPersekot) nil.value = formatNominalInput(doc.nilaiPersekot);
    const kep = $("#input-keperluan");
    if (kep) {
      kep.value = doc.keperluan || "";
      kep.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (doc.idAnggaran) selectAnggaranById(doc.idAnggaran);
    isiDetailPengadaan(doc.detail);
    if (doc.kepemilikan === "sentral" && doc.unitSentral) {
      const sp = $("#trigger-sentralisasi span");
      if (sp) sp.textContent = doc.unitSentral;
    }
    UploadApp.load(doc.dokumen);
    RincianApp.load(doc.rincianModel);
  }

  // ---------- kepemilikan anggaran: yang terpilih border hijau, lainnya digelapkan ----------
  const SENTRAL_DEF = "Unit Kerja Kantor Pusat";
  function setKepemilikan(k, unitText) {
    F._kep = k;
    const cards = document.querySelectorAll("#step-1-wrapper .select-card.plain-card");
    const unit = cards[0], sentral = $("#trigger-sentralisasi");
    unit && unit.classList.toggle("selected", k === "unit");
    sentral && sentral.classList.toggle("selected", k === "sentral");
    const sp = sentral && sentral.querySelector("span");
    if (k === "sentral") {
      if (unitText) F._unitSentral = unitText;
    } else {
      F._unitSentral = "";
      if (sp) sp.textContent = SENTRAL_DEF;
    }
  }
  function initKepemilikan() {
    const cards = document.querySelectorAll("#step-1-wrapper .select-card.plain-card");
    const unit = cards[0], sentral = $("#trigger-sentralisasi");
    if (!unit || !sentral) return;
    unit.addEventListener("click", () => setKepemilikan("unit"));
    const sp = sentral.querySelector("span");
    new MutationObserver(() => {
      if (sp.textContent.trim() !== SENTRAL_DEF) setKepemilikan("sentral", sp.textContent.trim());
    }).observe(sp, { childList: true, characterData: true, subtree: true });
    setKepemilikan("unit");
  }

  // ---------- init (setelah prefill bawaan script-form.js) ----------
  // ---------- Sumber Dana: lazy loading (menggantikan tombol halaman) ----------
  // Daftar kegiatan anggaran tampil 10 dulu (itemsPerPage), saat di-scroll ke bawah 10 berikutnya dimuat.
  // currentPage dipakai sebagai "jumlah halaman yang sudah dimuat", jadi prefill yang melompat ke halaman
  // item tertentu (pilihAnggaranById) tetap bekerja: semua item sampai halaman itu ikut tampil.
  function lazySumberDana() {
    const wadah = $("#list-anggaran-container"); // elemen yang di-scroll (overflow-y: auto)
    if (!wadah || typeof sliceAndRender !== "function") return;
    let sibuk = false;
    const sisa = () => currentFilteredData.length - currentPage * itemsPerPage;
    window.sliceAndRender = function () {
      const n = Math.min(currentFilteredData.length, currentPage * itemsPerPage);
      renderAnggaranList(currentFilteredData.slice(0, n), currentFilteredData.length);
      if (sisa() > 0)
        $("#list-anggaran-container").insertAdjacentHTML("beforeend", `<div class="lz-muat"><i class="fas fa-spinner fa-spin"></i> Memuat ${Math.min(itemsPerPage, sisa())} kegiatan berikutnya…</div>`);
      // area belum bisa di-scroll tapi masih ada sisa -> muat lagi
      requestAnimationFrame(() => {
        if (sisa() > 0 && wadah.clientHeight > 0 && wadah.scrollHeight <= wadah.clientHeight + 4) { currentPage++; window.sliceAndRender(); }
      });
    };
    const asliFilter = window.filterAndRenderAnggaran;
    window.filterAndRenderAnggaran = function (resetPage = true) {
      if (resetPage) wadah.scrollTop = 0;
      const r = asliFilter(resetPage);
      window.LazyList && LazyList.loading(wadah, 450); // tampilan "memuat" (cari / ganti sumber anggaran)
      return r;
    };
    wadah.addEventListener("scroll", () => {
      if (sibuk || sisa() <= 0 || wadah.scrollTop + wadah.clientHeight < wadah.scrollHeight - 80) return;
      sibuk = true;
      setTimeout(() => { currentPage++; window.sliceAndRender(); sibuk = false; }, 120);
    });
    window.sliceAndRender();
    window.LazyList && LazyList.loading(wadah, 600); // pertama kali halaman dibuka
  }

  function init() {
    lazySumberDana();
    const type = P.get("type");
    if (type === "pengadaan" && !FLOWS_CONFIG.pengadaan) FLOWS_CONFIG.pengadaan = FLOWS_CONFIG.operasional;
    if (type && FLOWS_CONFIG[type]) currentType = type;
    sisipPengadaan();
    initKepemilikan();

    // bersihkan nilai contoh bawaan HTML
    const tgl = $("#input-tanggal-kegiatan");
    const nil = $("#input-nilai-persekot");
    const kep = $("#input-keperluan");
    const setTgl = (iso) => {
      F._tglRaw = iso;
    };
    if (tgl) {
      tgl.readOnly = false;
      tgl.type = "date";
      tgl.value = "";
      tgl.min = hariIni();
      tgl.addEventListener("change", () => setTgl(tgl.value));
    }
    if (nil) {
      nil.value = "";
      nil.placeholder = "0,00";
      nil.addEventListener("blur", () => {
        const n = parseNominal(nil.value);
        nil.value = n ? formatNominalInput(n) : "";
      });
    }
    if (kep) kep.value = "";

    const editId = P.get("edit");
    const pjRef = P.get("id");
    if (editId) {
      const doc = Store.get(editId);
      if (!doc || !["draft", "revise"].includes(doc.status)) {
        UI.toast("Dokumen tidak ditemukan atau tidak bisa diubah.", "err");
        return setTimeout(() => (location.href = "../../index.html"), 1200);
      }
      F._id = doc.id;
      F._mode = "edit";
      currentType = FLOWS_CONFIG[doc.flow] ? doc.flow : currentType;
      if (doc.skema === "pertanggungjawaban") {
        F._refId = doc.refId;
        applyModePertanggungjawaban();
        lockStep1();
      }
      isiFormDariDoc(doc);
      if (doc.skema === "pertanggungjawaban") {
        lockStep1();
        const tg = $("#input-tanggal-kegiatan");
        if (tg && doc.tanggalKegiatan) {
          tg.type = "text";
          tg.value = doc.tanggalKegiatan;
          tg.readOnly = true;
        }
      }
      if (doc.status === "revise" && doc.catatanRevisi) UI.toast("Catatan revisi: " + doc.catatanRevisi, "err");
    } else if (pjRef) {
      const ref = Store.get(pjRef);
      if (!ref || ref.status !== "unrealized") {
        UI.toast("Persekot tidak dalam status Unrealized.", "err");
        return setTimeout(() => (location.href = "../../index.html"), 1200);
      }
      // jika persekot ini sudah punya draf pertanggungjawaban, lanjutkan drafnya
      const draf = Store.list().find((d) => d.refId === pjRef && ["draft", "revise"].includes(d.status));
      F._refId = pjRef;
      currentType = FLOWS_CONFIG[ref.flow] ? ref.flow : currentType;
      if (draf) {
        location.replace(`form-operasional.html?type=${draf.flow}&edit=${draf.id}`);
        return;
      }
      F._id = Store.newId();
      F._mode = "pj";
      // prefill bawaan (script-form.js) sudah mengisi bidang dari persekot; timpa id & tanggal
      F._tglRaw = "";
      const tg = $("#input-tanggal-kegiatan");
      if (tg) {
        tg.type = "text";
        tg.value = ref.tanggalKegiatan || ref.statusDate || "";
        tg.readOnly = true;
      }
      if (nil && !nil.value) nil.value = formatNominalInput(ref.nilaiPersekot || ref.nominal);
      if (kep && !kep.value) kep.value = ref.keperluan || "";
    } else {
      F._id = Store.newId();
      F._mode = "new";
      selectSkema("pembayaran");
      if (currentType === "pengadaan") isiDetailPengadaan(kirimanPengadaan());
    }
    if (currentType === "pengadaan") kunciPengadaan();

    isiHeader();
    if (typeof updateBreadcrumb === "function") updateBreadcrumb();
    render();
    updateFooter();

    // ringkasan keperluan di step 2/5 mengikuti ketikan
    kep?.addEventListener("input", () => {
      UploadApp.refreshSummaryKiri();
    });
    $("#s5-lihat-btn")?.addEventListener("click", () => toggleKeperluan());
    window.addEventListener("beforeunload", () => {});
  }

  // dijalankan setelah handler DOMContentLoaded bawaan (prefillFormOperasional)
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
