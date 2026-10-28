// ==========================================================================
// RINCIAN BIAYA (STEP 4) - DINAMIS
// Muat SETELAH script-form.js dan script-dataGridPengajuan.js:
//   <script src="../../js/script-form.js"></script>
//   <script src="../../js/script-dataForm.js"></script>
//   <script src="../../js/script-dataGridPengajuan.js"></script>
//   <script src="../../js/script-rincian.js"></script>   <-- BARU
// File ini menimpa fungsi global lama (switchStep3Tab, handleTambah,
// openRekeningModal, simpanRekening, applyRincianBiayaRules, dst.) dengan
// versi yang bekerja di atas state, bukan HTML hardcode.
// ==========================================================================
(function () {
  "use strict";

  // ---------- Helper ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const nf = new Intl.NumberFormat("id-ID");
  const rp = (n) => "Rp. " + nf.format(Math.round(n || 0));
  const fmt = (n) => new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const num = (s) => {
    const [a, b] = String(s ?? "").replace(/[^0-9,]/g, "").split(",");
    return parseFloat((a || "0") + "." + (b || "0")) || 0;
  };
  const today = () => new Date().toISOString().slice(0, 10);

  const KELOMPOK = [
    { key: "honor", title: "Honor dan Jasa Perorangan" },
    { key: "royalti", title: "Hadiah Royalti dan Sewa" },
    { key: "deposito", title: "Pendapatan Bunga Deposito" },
    { key: "usaha", title: "Penghasilan Usaha Perseorangan" },
    { key: "profesional", title: "Penghasilan dari Jasa Profesional" },
    { key: "sewa", title: "Pendapatan Sewa Properti" },
  ];

  // Akun yang sedang login = pengaju persekot (contoh data)
  const PENGAJU = {
    nama: "Satria Arindra",
    sub: "Deputi Bidang Keuangan",
    kode: "131230080",
    det: [
      { label: "Kode Pegawai", val: "131230080", ok: null },
      { label: "NPWP", val: "12-34.39843.883022", ok: true },
      { label: "KTP", val: "1234567890123450", ok: true },
      { label: "PTKP", val: "K/2", ok: null },
    ],
  };
  const TIPE_PENGAJU = { pegawai: "Pegawai", direksi: "Direksi", perorangan: "Perorangan" };

  // Rekening terdaftar (CONTOH: ganti dengan data master penerima dari backend)
  const BANKS = [
    { nama: "Bank Tabungan Negara", kode: "200", swift: "BTANIDJA" },
    { nama: "Bank Mandiri", kode: "008", swift: "BMRIDJA" },
    { nama: "Bank Negara Indonesia", kode: "009", swift: "BNINIDJA" },
  ];
  const REF_CONTOH = { bank: "Bank Tabungan Negara", kodeBank: "200", swift: "BTANIDJA", noRek: "0011-00-123456-7", nama: "PT Solusi Teknologi Nusantara" };

  // ---------- State ----------
  const S = { list: [], aktif: null, seq: 0, rekUid: null, q: "", taxKid: null, page: 1, lastAktif: null };
  const PAGE_SIZE = 5;
  window.RINCIAN = S; // untuk debugging / dibaca modul lain
  let PEN = []; // daftar penerima dari modal "Tambah Penerima"

  const isBadan = (e) => e.p.tipe === "badan";
  const cls = (e) => (isBadan(e) ? "badan-usaha" : "perorangan");
  // warna kartu mengikuti tipe penerima (sama dengan daftar penerima): hijau pegawai, biru dewan, oranye perorangan, abu badan
  const tema = (e) => {
    const t = e.auto ? e.tipePengaju : e.p.tipe;
    return t === "badan" ? "bad" : t === "dewan" ? "dew" : t === "perorangan" ? "per" : "peg";
  };
  const getE = (uid) => S.list.find((e) => e.uid === uid);
  const aktifE = () => getE(S.aktif);

  const mkSub = () => ({ id: "s" + ++S.seq, kode: "-", nama: "", kode2: "-", dpp: 0, tarif: 0, pph: 0, dppAuto: true });
  const mkKw = () => ({ id: "k" + ++S.seq, no: "", tgl: today(), nominal: 0, ppn: 0, open: false, subs: [mkSub()] });
  const mkKomp = (g, extra = {}) => ({ id: "c" + ++S.seq, g, tipe: "fp", nama: "", formula: "", nominal: 0, pph: 0, ...extra });
  // Tipe komponen biaya perorangan:
  //   fp = pakai formula + potongan PPh | p = tanpa formula, dengan PPh | n = tanpa formula, tanpa PPh
  const TIPE_KOMP = [
    { key: "fp", title: "Dengan formula & PPh", desc: "Isi formula perhitungan, nominal, dan potongan PPh." },
    { key: "p", title: "Tanpa formula, dengan PPh", desc: "Cukup nominal dan potongan PPh." },
    { key: "n", title: "Tanpa formula & tanpa PPh", desc: "Hanya nominal, tidak dipotong PPh." },
  ];
  const tipeKomp = (c) => (c && TIPE_KOMP.some((t) => t.key === c.tipe) ? c.tipe : "fp"); // data lama = fp
  const mkEntry = (p, extra = {}) => ({ uid: "r" + ++S.seq, p, rek: null, kuitansi: [], komponen: [], openG: {}, ...extra });

  const subPph = (s) => Math.round((s.dpp * s.tarif) / 100);
  const kwPph = (k) => k.subs.reduce((t, s) => t + s.pph, 0);
  const total = (e) => (isBadan(e) ? e.kuitansi.reduce((t, k) => t + k.nominal, 0) : e.komponen.reduce((t, c) => t + c.nominal, 0));
  const totalPph = (e) => (isBadan(e) ? e.kuitansi.reduce((t, k) => t + kwPph(k), 0) : e.komponen.reduce((t, c) => t + c.pph, 0));
  const grandTotal = () => S.list.reduce((t, e) => t + total(e), 0);

  // ---------- Mode skema ----------
  const modeSkema = () =>
    typeof modePertanggungjawaban !== "undefined" && modePertanggungjawaban
      ? "pj"
      : typeof selectedSkemaType !== "undefined" && selectedSkemaType === "persekot"
        ? "persekot"
        : null;

  function nilaiPersekot() {
    if (modeSkema() === "pj") {
      try {
        const rid = window.FormApp && FormApp.snapshot().refId;
        const ref = rid && window.Store ? Store.get(rid) : null;
        const n = ref ? Number(ref.nilaiPersekot || ref.nominal) || 0 : 0;
        if (n) return n;
      } catch (e) {}
      return num($("#input-nilai-persekot")?.value);
    }
    return num($("#input-nilai-persekot")?.value);
  }

  // Persekot: 1 baris terkunci (honor = nilai persekot). Pertanggungjawaban: terisi dari persekot, nominal boleh diubah,
  // komponen & penerima lain boleh ditambah.
  // Rekening penerima otomatis (pengaju): persekot = rekening terdaftar; pertanggungjawaban = rekening dari persekot asal
  function rekOtomatis(e) {
    try {
      if (e.auto === "pj" && window.FormApp && window.Store) {
        const ref = Store.get(FormApp.snapshot().refId);
        const m = ref && ref.rincianModel;
        const src = m && (m.find((x) => x.auto === "persekot") || m[0]);
        if (src && src.rek) return { ...src.rek };
      }
    } catch (err) {
      /* pakai rekening terdaftar */
    }
    return { sumber: "terdaftar", ...rekTerdaftar(e.p) };
  }
  function syncAuto() {
    const mode = modeSkema();
    S.list = S.list.filter((e) => !e.auto || e.auto === mode);
    if (mode) {
      let e = S.list.find((x) => x.auto === mode);
      if (!e) {
        e = mkEntry({ ...PENGAJU, tipe: "pegawai", badge: "Pegawai" }, { auto: mode, locked: mode === "persekot", tipePengaju: "pegawai", openG: { honor: true } });
        e.komponen = [mkKomp("honor", { nama: "Honor / Jasa persekot kerja", base: true })];
        S.list.unshift(e);
        S.aktif = e.uid;
      }
      if (!e.rek) e.rek = rekOtomatis(e); // langsung terisi, tidak perlu memilih
      if (mode === "persekot") e.komponen[0].nominal = nilaiPersekot(); // selalu ikut nilai persekot terbaru
      if (mode === "pj" && !e.pjInit) {
        e.komponen[0].nominal = nilaiPersekot();
        e.pjInit = true;
      }
    }
    if (!getE(S.aktif)) S.aktif = S.list[0]?.uid || null;
  }

  // ---------- Baca daftar penerima dari modal ----------
  function bacaPenerima() {
    PEN = $$("#modalTambahRincian .person-card").map((c, i) => {
      const tipe = /card-badan/.test(c.className) ? "badan" : /card-pegawai/.test(c.className) ? "pegawai" : /card-dewan/.test(c.className) ? "dewan" : "perorangan";
      const det = $$(".detail-item", c).map((d) => ({
        label: (d.querySelector("span").childNodes[0]?.textContent || "").trim(),
        ok: d.querySelector("i.text-green") ? true : d.querySelector("i.text-red") ? false : null,
        val: d.querySelector("strong").textContent.trim(),
      }));
      c.removeAttribute("onclick");
      c.style.cursor = "pointer";
      c.dataset.idx = i;
      c.addEventListener("click", () => pilihPenerima(i));
      return {
        idx: i,
        tipe,
        nama: $("h4", c).textContent.trim(),
        sub: $(".pc-title-area span", c).textContent.trim(),
        badge: $(".pc-badge", c).textContent.trim(),
        kode: det[0]?.val || "",
        det,
      };
    });
  }

  function filterModalPenerima() {
    const q = ($("#modalTambahRincian .modal-filter-bar input")?.value || "").toLowerCase().trim();
    const t = ($("#modalTambahRincian .filter-select")?.value || "Semua").trim();
    $$("#modalTambahRincian .person-card").forEach((c) => {
      const okQ = !q || c.innerText.toLowerCase().includes(q);
      const okT = t === "Semua" || $(".pc-badge", c).textContent.trim() === t;
      c.style.display = okQ && okT ? "" : "none";
    });
  }

  // ---------- Tambah penerima ----------
  function pilihPenerima(idx) {
    const p = PEN[idx];
    if (!p) return;
    const ada = S.list.find((e) => e.p.kode === p.kode && !e.auto);
    $("#modalTambahRincian").classList.add("hidden");
    if (ada) {
      aktifkan(ada.uid);
      return;
    }
    const e = mkEntry(p);
    if (isBadan(e)) e.kuitansi.push(mkKw());
    S.list.push(e);
    S.aktif = e.uid;
    renderAll();
    openRekeningModal(e.uid); // rekening dipilih dari 3 sumber, tidak otomatis terisi
  }

  function aktifkan(uid) {
    if (!getE(uid)) return;
    S.aktif = uid;
    renderAll();
  }

  async function hapusPenerima() {
    const e = aktifE();
    if (!e || e.locked || e.auto) return;
    if (!(await UI.confirm(`Hapus penerima "${e.p.nama}" beserta seluruh rincian biayanya?`, { danger: true, ya: "Hapus", judul: "Hapus penerima" }))) return;
    S.list = S.list.filter((x) => x.uid !== e.uid);
    S.aktif = S.list[0]?.uid || null;
    renderAll();
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  function renderAll() {
    renderLeft();
    renderRight();
    refreshTotals();
    applyLocks();
  }

  function renderLeft() {
    const empty = $("#s4-left-empty");
    const pop = $("#s4-left-populated");
    const q = S.q.toLowerCase();
    const rows = S.list.filter((e) => !q || (e.p.nama + " " + e.p.kode).toLowerCase().includes(q));
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    // pindah ke halaman item aktif hanya saat item aktif berganti
    if (S.aktif !== S.lastAktif) {
      const ix = rows.findIndex((e) => e.uid === S.aktif);
      if (ix >= 0) S.page = Math.floor(ix / PAGE_SIZE) + 1;
      S.lastAktif = S.aktif;
    }
    S.page = Math.min(Math.max(1, S.page), pages);
    const view = rows.slice((S.page - 1) * PAGE_SIZE, S.page * PAGE_SIZE);
    if (empty) empty.style.display = S.list.length ? "none" : "";
    if (pop) {
      pop.style.display = S.list.length ? "flex" : "none";
      pop.innerHTML = view
        .map(
          (e) => `
        <div class="s4-pop-item tema-${tema(e)}${e.uid === S.aktif ? " active" : ""}" data-uid="${e.uid}">
          <div class="s4-pop-title">${esc(e.p.nama)}</div>
          <div class="s4-pop-meta"><span>Total Biaya</span><strong>${rp(total(e))}</strong></div>
        </div>`,
        )
        .join("");
    }
    const cnt = $(".panel-pagination .total-rincian");
    if (cnt) cnt.textContent = rows.length + " rincian";
    const pc = $(".panel-pagination .pagination-controls");
    if (pc) {
      pc.style.display = rows.length > PAGE_SIZE ? "" : "none";
      const b = pc.querySelectorAll(".page-btn");
      if (b.length >= 5) {
        b[2].textContent = S.page;
        const tx = pc.querySelector(".page-text");
        if (tx) tx.textContent = "of " + pages;
        const dis = [S.page <= 1, S.page <= 1, false, S.page >= pages, S.page >= pages];
        [b[0], b[1], b[3], b[4]].forEach((x, i) => (x.disabled = [dis[0], dis[1], dis[3], dis[4]][i]));
        if (!pc.dataset.bound) {
          pc.dataset.bound = "1";
          b[0].addEventListener("click", () => { S.page = 1; renderLeft(); });
          b[1].addEventListener("click", () => { S.page--; renderLeft(); });
          b[3].addEventListener("click", () => { S.page++; renderLeft(); });
          b[4].addEventListener("click", () => { S.page = 1e9; renderLeft(); });
        }
      }
    }
  }

  function detailHtml(det) {
    return det
      .map((d) => {
        const ic = d.ok === true ? ' <i class="fas fa-check-circle text-green"></i>' : d.ok === false ? ' <i class="fas fa-times-circle text-red"></i>' : "";
        return `<div class="sdh-item"><span>${esc(d.label)}${ic}</span><strong>${esc(d.val)}</strong></div>`;
      })
      .join("");
  }

  function renderRight() {
    const e = aktifE();
    const empty = $("#s4-right-empty");
    const pop = $("#s4-right-populated");
    if (!e) {
      if (empty) empty.style.display = "";
      if (pop) pop.style.display = "none";
      return;
    }
    if (empty) empty.style.display = "none";
    if (pop) pop.style.display = "flex";

    // --- profil ---
    $("#dyn-title").textContent = e.p.nama;
    $("#dyn-subtitle").textContent = e.p.sub;
    const badge = $("#dyn-badge");
    badge.textContent = e.locked || e.auto ? TIPE_PENGAJU[e.tipePengaju] || e.p.badge : e.p.badge;
    badge.className = "dyn-badge badge-" + cls(e);
    $(".sdh-banner-card").className = "sdh-banner-card theme-" + cls(e) + " tema-" + tema(e);
    $(".sdh-details").innerHTML = detailHtml(e.p.det); // dropdown "Tipe Pengaju" dihilangkan (tipe tetap pegawai)

    // --- rekening ---
    const bankBox = $(".col-bank .bank-top-box");
    const btn = $(".btn-copy-card", bankBox);
    if (e.rek) {
      $(".box-title", bankBox).textContent = e.rek.nama;
      $(".acc-num-line strong", bankBox).textContent = e.rek.noRek;
      $(".acc-owner", bankBox).textContent = e.rek.bank;
      $(".acc-num-line i", bankBox).style.display = "";
    } else {
      $(".box-title", bankBox).textContent = "Rekening belum dipilih";
      $(".acc-num-line strong", bankBox).textContent = "-";
      $(".acc-owner", bankBox).textContent = "Klik tombol di kanan untuk memilih rekening";
      $(".acc-num-line i", bankBox).style.display = "none";
    }
    btn.title = e.rek ? "Ganti Rekening" : "Pilih Rekening";
    btn.innerHTML = '<i class="fas fa-exchange-alt"></i>';
    // PERSEKOT & PERTANGGUNGJAWABAN: rekening pengaju terisi otomatis dan tidak boleh diganti (ubah kondisi ini bila aturan berubah)
    const rekTerkunci = !!e.auto && !!e.rek;
    btn.disabled = rekTerkunci;
    btn.style.pointerEvents = rekTerkunci ? "none" : "";
    btn.style.opacity = rekTerkunci ? "0.4" : "";
    if (rekTerkunci) btn.title = "Rekening tidak dapat diganti";

    // --- area kuitansi / komponen ---
    setTipePenerima(isBadan(e) ? "toyota" : "siti");
    const detil = $("#cardDetilPerjalananDinas");
    if (detil) detil.style.display = !isBadan(e) && new URLSearchParams(location.search).get("type") === "perjalanan_dinas" ? "block" : "none";
    const kw = $("#kuitansi-list-container");
    if (isBadan(e)) {
      kw.style.overflow = "";
      kw.style.display = "";
      kw.style.flexDirection = "";
      kw.innerHTML = htmlBadan(e);
    } else {
      kw.style.overflow = "hidden";
      kw.style.display = "flex";
      kw.style.flexDirection = "column";
      kw.innerHTML = htmlPerorangan(e);
      const fs = $(".kw-select-kategori");
      if (fs) fs.value = e.filterG || "";
    }
  }

  // ----- Badan usaha: daftar kuitansi -----
  function htmlSub(s, first, locked) {
    const ro = locked ? "readonly" : "";
    return `
    <div class="kw-sub-row" data-sid="${s.id}">
      <div class="sub-col sub-col-code"><input type="text" data-f="kode" value="${esc(s.kode)}" class="input-sub text-center" ${ro} /></div>
      <div class="sub-col sub-col-name"><input type="text" data-f="nama" value="${esc(s.nama)}" placeholder="Nama objek pajak..." class="input-sub" ${ro} /></div>
      <div class="sub-col sub-col-code"><input type="text" data-f="kode2" value="${esc(s.kode2)}" class="input-sub text-center" ${ro} /></div>
      <div class="sub-col sub-col-dpp">${first ? '<span class="sub-label-head">DPP PPh</span>' : ""}
        <div class="input-sub-wrapper"><span>Rp.</span><input type="text" data-f="dpp" value="${fmt(s.dpp)}" class="input-sub text-right" ${ro} /></div></div>
      <div class="sub-col sub-col-tarif">${first ? '<span class="sub-label-head">Tarif</span>' : ""}
        <input type="text" data-f="tarif" value="${s.tarif} %" class="input-sub text-center font-bold" ${ro} /></div>
      <div class="sub-col sub-col-potongan">${first ? '<span class="sub-label-head">Potongan PPh</span>' : ""}
        <div class="input-sub-wrapper danger"><span class="text-danger">Rp.</span><input type="text" data-f="pph" value="${fmt(s.pph)}" class="input-sub text-right text-danger" readonly /></div></div>
      <div class="sub-col sub-col-action"><button type="button" class="btn-sub-remove" data-act="del-sub" title="Hapus objek pajak"><i class="fas fa-minus-circle"></i></button></div>
    </div>`;
  }

  function htmlKw(k) {
    return `
    <div class="kuitansi-wrapper" data-kid="${k.id}">
      <div class="kuitansi-row-container" style="align-items:${k.open ? "flex-start" : "center"}">
        <div class="kuitansi-item${k.open ? " expanded" : ""}" data-kid="${k.id}">
          <div class="kw-header" onclick="togglekuitansi(event, this)">
            <button type="button" class="btn-toggle-arrow"><i class="fas fa-chevron-right kw-arrow" style="${k.open ? "transform:rotate(180deg)" : ""}"></i></button>
            <div class="kw-field kw-field-no"><div class="input-container"><input type="text" data-f="no" value="${esc(k.no)}" placeholder="Masukkan nomor kuitansi..." /></div></div>
            <div class="kw-field kw-field-date"><div class="input-container"><input type="date" data-f="tgl" value="${esc(k.tgl)}" class="input-date-custom" /></div></div>
            <div class="kw-field kw-field-nominal"><div class="input-container prefix-rp"><span class="prefix">Rp.</span><input type="text" data-f="nominal" value="${fmt(k.nominal)}" class="text-right" /></div></div>
            <div class="kw-icon-doc" onclick="openFakturPPNModal(this)"><i class="fas fa-file-alt"></i></div>
            <div class="kw-field kw-field-ppn"><div class="input-container prefix-rp readonly"><span class="prefix">Rp.</span><input type="text" data-b="ppn" value="${fmt(k.ppn)}" class="text-right" readonly /></div></div>
            <div class="kw-field kw-field-pph"><div class="input-container prefix-rp danger readonly"><span class="prefix">Rp.</span><input type="text" data-b="kwpph" value="${fmt(kwPph(k))}" class="text-right text-danger" readonly /></div></div>
          </div>
          <div class="kw-detail" style="display:${k.open ? "block" : "none"}">
            <div class="kw-detail-inner">
              <div class="branch-icon"><i class="branch-connector"></i></div>
              <div class="biaya-detail-table">
                ${k.subs.map((s, i) => htmlSub(s, i === 0, false)).join("")}
                <div class="kw-add-action"><button type="button" class="btn-add-sub" data-act="add-sub"><i class="far fa-plus-square"></i> Objek pajak</button></div>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="btn-remove-row" data-act="del-kw" title="Hapus kuitansi"><i class="fas fa-times"></i></button>
      </div>
    </div>`;
  }

  function htmlBadan(e) {
    return `
    <div class="kw-table-columns-header">
      <div style="width: 24px;"></div>
      <div style="flex: 1.5;">No kuitansi / Invoice</div>
      <div style="width: 130px;">Tanggal</div>
      <div style="width: 150px;">Nominal Invoice + PPN</div>
      <div style="width: 20px;"></div>
      <div style="width: 130px;">PPN</div>
      <div style="width: 130px;">Potongan PPh</div>
    </div>
    <div class="kw-scroll-list-area" style="max-height: 420px; overflow-y: auto; overflow-x: hidden; padding-right: 6px; display: flex; flex-direction: column; gap: 8px;">
      ${e.kuitansi.length ? e.kuitansi.map(htmlKw).join("") : '<p style="text-align:center;color:#94a3b8;padding:24px">Belum ada kuitansi. Klik "Tambah kuitansi / Invoice".</p>'}
    </div>`;
  }

  // ----- Perorangan: kelompok biaya + komponen -----
  function htmlKomp(c, first, locked) {
    const ro = locked ? "readonly" : "";
    const tp = tipeKomp(c);
    const formula = tp === "fp" ? `<input type="text" data-f="formula" value="${esc(c.formula)}" placeholder="Formula" class="sub-input" ${ro} />` : ""; // tanpa formula: kolom dibiarkan kosong (tanpa kotak)
    const pph =
      tp === "n"
        ? "" // tanpa PPh: kolom kosong (tanpa kotak)
        : `<div class="sub-input-box danger"><span class="prefix text-danger">Rp.</span><input type="text" data-f="pph" value="${fmt(c.pph)}" class="sub-input-field text-right text-danger" ${ro} /></div>`;
    return `
    <div class="biaya-sub-row tipe-${tp}" data-cid="${c.id}">
      <div class="sub-col sub-col-nama">${first ? '<span class="sub-label-head">Nama Komponen</span>' : ""}<input type="text" data-f="nama" value="${esc(c.nama)}" placeholder="Nama Komponen" class="sub-input" ${ro} /></div>
      <div class="sub-col sub-col-formula">${first ? '<span class="sub-label-head">Formula</span>' : ""}${formula}</div>
      <div class="sub-col sub-col-nominal">${first ? '<span class="sub-label-head">Nominal</span>' : ""}
        <div class="sub-input-box"><span class="prefix">Rp.</span><input type="text" data-f="nominal" value="${fmt(c.nominal)}" class="sub-input-field text-right" ${locked && !c.nominalEditable ? "readonly" : ""} /></div></div>
      <div class="sub-col sub-col-pph">${first ? '<span class="sub-label-head">Potongan PPh</span>' : ""}
        ${pph}</div>
      <div class="sub-col sub-col-btn">${c.base || locked ? "" : '<button type="button" class="btn-sub-del" data-act="del-komp" title="Hapus komponen"><i class="fas fa-minus-circle"></i></button>'}</div>
    </div>`;
  }

  function htmlPerorangan(e) {
    const groups = KELOMPOK.filter((g) => ((e.locked && g.key === "honor") || e.komponen.some((c) => c.g === g.key)) && (!e.filterG || g.key === e.filterG)); // kelompok muncul setelah komponen pertamanya ditambahkan; dropdown = filter
    const base = e.auto === "pj"; // nominal baris dasar pertanggungjawaban boleh diubah
    return `
    <div class="biaya-wrapper" style="display:flex;flex-direction:column;height:100%;max-height:100%;overflow:hidden;gap:8px;">
      <div class="biaya-global-header">
        <div style="flex:1;"></div>
        <div style="display:flex;gap:12px;">
          <div style="width:100px;text-align:left;padding-left:2px;">Nominal</div>
          <div style="width:100px;text-align:left;padding-left:2px;">Potongan PPh</div>
        </div>
      </div>
      <div class="kw-scroll-list-area" style="flex:1;overflow-y:auto;overflow-x:hidden;padding-right:4px;display:flex;flex-direction:column;gap:8px;">
        ${groups.length ? "" : `<div class="s5-empty" style="padding:28px 0">${e.filterG ? "Belum ada komponen pada kelompok ini." : "Belum ada komponen biaya."}<br>Klik "Tambah Komponen Biaya" untuk memilih kelompok dan menambah komponen.</div>`}
        ${groups
          .map((g) => {
            const rows = e.komponen.filter((c) => c.g === g.key);
            const open = e.openG[g.key];
            const sN = rows.reduce((t, c) => t + c.nominal, 0);
            const sP = rows.reduce((t, c) => t + c.pph, 0);
            return `
          <div class="biaya-item${open ? " expanded" : ""}" data-g="${g.key}">
            <div class="biaya-header" onclick="toggleBiaya(this)">
              <div class="biaya-header-left"><i class="fas fa-chevron-right biaya-arrow"></i><span class="biaya-title">${g.title}</span>${rows.length ? `<span class="kw-badge-count" style="margin-left:8px">${rows.length}</span>` : ""}</div>
              <div class="biaya-header-right">
                <div class="biaya-field"><div class="biaya-input-box readonly"><span class="prefix">Rp.</span><input type="text" data-b="gnom" value="${fmt(sN)}" readonly class="text-right" /></div></div>
                <div class="biaya-field"><div class="biaya-input-box danger readonly"><span class="prefix text-danger">Rp.</span><input type="text" data-b="gpph" value="${fmt(sP)}" readonly class="text-right text-danger" /></div></div>
              </div>
            </div>
            <div class="biaya-detail">
              <div class="biaya-detail-inner">
                <div class="branch-icon"><i class="branch-connector"></i></div>
                <div class="biaya-detail-table">
                  ${rows.length ? rows.map((c, i) => htmlKomp(base && c.base ? { ...c, nominalEditable: true } : c, i === 0, !!e.locked)).join("") : '<p style="color:#94a3b8;padding:8px 0">Belum ada komponen. Pilih kelompok di atas lalu klik "Tambah Komponen Biaya".</p>'}
                </div>
              </div>
            </div>
          </div>`;
          })
          .join("")}
      </div>
    </div>`;
  }

  // Status buka/tutup accordion disimpan ke model saat di-toggle, supaya bertahan setelah render ulang
  const _tk = window.togglekuitansi;
  window.togglekuitansi = function (ev, headerEl) {
    _tk(ev, headerEl);
    const it = headerEl.closest(".kuitansi-item");
    const k = aktifE()?.kuitansi.find((x) => x.id === it.dataset.kid);
    if (k) k.open = it.classList.contains("expanded");
  };
  const _tb = window.toggleBiaya;
  window.toggleBiaya = function (headerEl) {
    _tb(headerEl);
    const it = headerEl.closest(".biaya-item");
    const e = aktifE();
    if (e) e.openG[it.dataset.g] = it.classList.contains("expanded");
  };

  // ---------- Total & ringkasan (tanpa render ulang, agar fokus input tidak hilang) ----------
  function refreshTotals() {
    const e = aktifE();
    // daftar kiri
    $$("#s4-left-populated .s4-pop-item").forEach((el) => {
      const x = getE(el.dataset.uid);
      if (x) $("strong", el).textContent = rp(total(x));
    });
    // total pengajuan di info bar
    const tp = $("#step-4-wrapper .badge-total strong");
    if (tp) tp.textContent = rp(grandTotal());
    if (e) {
      $(".col-total .total-amount").textContent = rp(total(e));
      $(".col-bank .sub-info-line strong").textContent = rp(totalPph(e));
      $(".col-total .sub-info-line strong").textContent = rp(total(e) - totalPph(e));
      const badgeCount = $("#container-extra-badge");
      if (badgeCount) badgeCount.innerHTML = isBadan(e) ? `<span class="kw-badge-count">${e.kuitansi.length} Kuitansi</span>` : "";
      e.kuitansi.forEach((k) => {
        const it = $(`.kuitansi-item[data-kid="${k.id}"]`);
        if (!it) return;
        $('[data-b="ppn"]', it).value = fmt(k.ppn);
        $('[data-b="kwpph"]', it).value = fmt(kwPph(k));
      });
      KELOMPOK.forEach((g) => {
        const it = $(`.biaya-item[data-g="${g.key}"]`);
        if (!it) return;
        const rows = e.komponen.filter((c) => c.g === g.key);
        $('[data-b="gnom"]', it).value = fmt(rows.reduce((t, c) => t + c.nominal, 0));
        $('[data-b="gpph"]', it).value = fmt(rows.reduce((t, c) => t + c.pph, 0));
      });
    }
    renderSelisih();
  }

  // Pertanggungjawaban persekot: info bar atas = Anggaran Tersedia | Nilai Persekot | Nilai Realisasi
  function renderSelisih() {
    $("#selisih-persekot")?.remove(); // banner lama dihilangkan
    const bar = $("#step-4-wrapper .step2-info-bar");
    if (!bar) return;
    const pj = modeSkema() === "pj";
    const tot = $(".badge-total", bar);
    const lb = tot && tot.querySelector("span");
    if (lb) lb.textContent = pj ? "Nilai Realisasi" : "Total Pengajuan";
    let nb = $("#badge-nilai-persekot", bar);
    if (!pj) {
      if (nb) nb.remove();
      return;
    }
    if (!nb) {
      nb = document.createElement("div");
      nb.id = "badge-nilai-persekot";
      nb.className = "badge-tersedia";
      nb.innerHTML = "<span>Nilai Persekot</span><strong></strong>";
      const tersedia = $(".badge-tersedia", bar);
      if (tersedia) tersedia.after(nb);
      else bar.appendChild(nb);
    }
    nb.querySelector("strong").textContent = rp(nilaiPersekot());
  }

  // ---------- Kunci tombol (persekot) ----------
  function setBtn(el, off) {
    if (!el) return;
    el.disabled = off;
    el.style.pointerEvents = off ? "none" : "";
    el.style.opacity = off ? "0.5" : "";
  }
  function applyLocks() {
    const e = aktifE();
    const mode = modeSkema();
    setBtn($("#btnTambahRincian"), mode === "persekot");
    setBtn($("#btnAddHeader"), !!(e && e.locked));
    setBtn($(".btn-trash"), !e || !!e.auto);
    // persekot: dropdown kelompok biaya tetap tampil, berisi 1 pilihan (Honor) dan terkunci
    const dd = $("#dropdownPerorangan");
    if (dd) dd.style.visibility = "";
    const ks = $(".kw-select-kategori");
    if (ks) {
      const kunci = !!(e && e.locked);
      [...ks.options].forEach((o) => (o.hidden = kunci && o.value !== "honor"));
      if (kunci) ks.value = "honor";
      ks.disabled = kunci;
    }
  }
  window.applyKuitansiItemState = applyLocks;

  // ==========================================================================
  // AKSI: tambah kuitansi / komponen, hapus
  // ==========================================================================
  window.handleTambah = async function () {
    const e = aktifE();
    if (!e || e.locked) return;
    if (isBadan(e)) {
      const k = mkKw();
      k.open = true;
      e.kuitansi.push(k);
      renderRight();
      refreshTotals();
      $(`.kuitansi-item[data-kid="${k.id}"]`)?.scrollIntoView({ block: "nearest" });
    } else {
      // dropdown di atas hanya filter; kelompok + tipe komponen dipilih lewat pop up setelah tombol ini diklik
      const r = await Swal.fire({
        title: "Tambah Komponen Biaya",
        html: `<div class="tk-pop">
            <label class="tk-label" for="tk-kelompok">Kelompok biaya</label>
            <select id="tk-kelompok" class="tk-select">
              <option value="">Pilih kelompok biaya...</option>
              ${KELOMPOK.map((g) => `<option value="${g.key}"${g.key === e.filterG ? " selected" : ""}>${esc(g.title)}</option>`).join("")}
            </select>
            <div class="tk-label">Jenis komponen</div>
            <div class="tk-opts">
              ${TIPE_KOMP.map(
                (t, i) => `<label class="tk-opt"><input type="radio" name="tk-tipe" value="${t.key}"${i === 0 ? " checked" : ""}><span><strong>${esc(t.title)}</strong><em>${esc(t.desc)}</em></span></label>`,
              ).join("")}
            </div>
          </div>`,
        showCancelButton: true,
        confirmButtonText: "Tambah",
        cancelButtonText: "Batal",
        reverseButtons: true,
        confirmButtonColor: "#1f6fa8",
        focusConfirm: false,
        preConfirm: () => {
          const g = document.getElementById("tk-kelompok").value;
          const tp = (document.querySelector('input[name="tk-tipe"]:checked') || {}).value || "fp";
          if (!g) {
            Swal.showValidationMessage("Pilih kelompok biaya terlebih dahulu.");
            return false;
          }
          return { g, tp };
        },
      });
      if (!r.isConfirmed) return;
      const key = r.value.g;
      if (e.filterG && e.filterG !== key) e.filterG = key; // tampilkan kelompok yang baru ditambah
      e.komponen.push(mkKomp(key, { tipe: r.value.tp }));
      e.openG[key] = true;
      renderRight();
      refreshTotals();
    }
    applyLocks();
  };

  async function onClick(ev) {
    const act = ev.target.closest("[data-act]");
    const e = aktifE();
    if (!act || !e) return;
    const kwEl = act.closest("[data-kid]");
    const k = kwEl && e.kuitansi.find((x) => x.id === kwEl.dataset.kid);
    if (act.dataset.act === "del-kw" && k) {
      if (!(await UI.confirm("Hapus kuitansi ini?", { danger: true, ya: "Hapus", judul: "Hapus kuitansi" }))) return;
      e.kuitansi = e.kuitansi.filter((x) => x !== k);
    } else if (act.dataset.act === "del-sub" && k) {
      const sid = act.closest("[data-sid]").dataset.sid;
      if (k.subs.length > 1) k.subs = k.subs.filter((s) => s.id !== sid);
      else k.subs = [mkSub()];
    } else if (act.dataset.act === "add-sub" && k) {
      S.taxKid = k.id;
      k.open = true;
      document.getElementById("modalObjekPajak").style.display = "flex";
      return;
    } else if (act.dataset.act === "del-komp") {
      const cid = act.closest("[data-cid]").dataset.cid;
      e.komponen = e.komponen.filter((c) => c.id !== cid);
    } else return;
    renderRight();
    refreshTotals();
    applyLocks();
  }

  function onInput(ev) {
    const t = ev.target;
    const f = t.dataset.f;
    const e = aktifE();
    if (!f || !e) return;
    const kwEl = t.closest("[data-kid]");
    const k = kwEl && e.kuitansi.find((x) => x.id === kwEl.dataset.kid);
    const sEl = t.closest("[data-sid]");
    const sub = k && sEl && k.subs.find((x) => x.id === sEl.dataset.sid);
    const cEl = t.closest("[data-cid]");
    const c = cEl && e.komponen.find((x) => x.id === cEl.dataset.cid);

    if (sub) {
      if (f === "dpp") { sub.dpp = num(t.value); sub.dppAuto = false; }
      else if (f === "tarif") sub.tarif = parseFloat(String(t.value).replace(",", ".")) || 0;
      else sub[f] = t.value;
      sub.pph = subPph(sub);
      const p = $('[data-f="pph"]', sEl);
      if (p) p.value = fmt(sub.pph);
    } else if (k) {
      if (f === "nominal") {
        k.nominal = num(t.value);
        const s0 = k.subs[0];
        if (s0 && s0.dppAuto) {
          s0.dpp = Math.max(k.nominal - k.ppn, 0);
          s0.pph = subPph(s0);
          const row = $(`[data-sid="${s0.id}"]`, kwEl);
          if (row) {
            $('[data-f="dpp"]', row).value = fmt(s0.dpp);
            $('[data-f="pph"]', row).value = fmt(s0.pph);
          }
        }
      } else k[f] = t.value;
    } else if (c) {
      if (f === "nominal" || f === "pph") c[f] = num(t.value);
      else c[f] = t.value;
      const tp = tipeKomp(c);
      if (tp === "n") c.pph = 0; // tanpa PPh
      if (tp !== "fp") c.formula = ""; // tanpa formula
    }
    refreshTotals();
  }

  // format rapi saat selesai mengetik
  function onBlur(ev) {
    const t = ev.target;
    if (!t.dataset.f) return;
    if (["nominal", "dpp", "pph"].includes(t.dataset.f)) t.value = fmt(num(t.value));
    if (t.dataset.f === "tarif") t.value = (parseFloat(String(t.value).replace(",", ".")) || 0) + " %";
  }

  // ---------- Objek pajak (modal pilih) ----------
  window.openObjekPajakModal = function (btn) {
    const kwEl = btn && btn.closest("[data-kid]");
    S.taxKid = kwEl ? kwEl.dataset.kid : S.taxKid;
    document.getElementById("modalObjekPajak").style.display = "flex";
  };
  window.selectTaxItem = function (code, name, rate) {
    const e = aktifE();
    const k = e && e.kuitansi.find((x) => x.id === S.taxKid);
    if (k) {
      const kosong = k.subs.find((s) => !s.nama);
      const s = kosong || mkSub();
      if (!kosong) k.subs.push(s);
      s.kode = code;
      s.nama = name;
      s.tarif = parseFloat(String(rate).replace(",", ".")) || 0;
      if (!s.dpp && !kosong && k.subs.length > 1) s.dppAuto = false;
      s.pph = subPph(s);
      renderRight();
      refreshTotals();
      applyLocks();
    }
    closeObjekPajakModal();
  };

  // ---------- Faktur PPN ----------
  let kwFaktur = null;
  const _openFaktur = window.openFakturPPNModal;
  window.openFakturPPNModal = function (el) {
    const kwEl = el && el.closest(".kuitansi-item");
    kwFaktur = kwEl ? kwEl.dataset.kid : null;
    const e = aktifE();
    if (e) {
      if ($("#ppnNamaRekanan")) $("#ppnNamaRekanan").value = e.p.nama;
      if ($("#ppnKodeRekanan")) $("#ppnKodeRekanan").value = e.p.kode;
    }
    _openFaktur(el);
  };
  window.saveFakturPPN = function () {
    const e = aktifE();
    const k = e && e.kuitansi.find((x) => x.id === kwFaktur);
    if (k) {
      const dipungut = $("#togglePpnPungut")?.checked;
      k.ppn = dipungut ? Math.round((k.nominal * 11) / 111) : 0; // PPN 11% termasuk dalam nominal
      const s0 = k.subs[0];
      if (s0 && s0.dppAuto) { s0.dpp = Math.max(k.nominal - k.ppn, 0); s0.pph = subPph(s0); }
      renderRight();
      refreshTotals();
    }
    document.getElementById("modalFakturPPN").style.display = "none";
  };

  // ==========================================================================
  // REKENING (3 sumber: terdaftar, referensi, baru)
  // ==========================================================================
  function rekTerdaftar(p) {
    const d = parseInt(String(p.kode).replace(/\D/g, "").slice(-1) || "0", 10);
    const b = BANKS[d % BANKS.length];
    const digits = String(p.kode).replace(/\D/g, "").padEnd(9, "0");
    return { bank: b.nama, kodeBank: b.kode, swift: b.swift, noRek: `${digits.slice(0, 3)}-00-${digits.slice(3, 6)}-${digits.slice(6, 9)}-1`, nama: p.nama };
  }
  function daftarReferensi(uid) {
    const out = [{ ...REF_CONTOH }];
    S.list.forEach((e) => {
      if (e.uid !== uid && e.rek && !out.some((o) => o.noRek === e.rek.noRek)) out.push({ ...e.rek });
    });
    return out;
  }
  const setVals = (inputs, vals, ro) => inputs.forEach((i, n) => { i.value = vals[n] ?? ""; i.readOnly = !!ro; });
  const panelInputs = (src) => $$(`#rek-view-${src} .form-row input.base-textbox`);

  window.openRekeningModal = function (uid) {
    const e = getE(typeof uid === "string" ? uid : S.aktif);
    if (!e) return;
    S.rekUid = e.uid;
    $("#modalTambahRincian").classList.add("hidden");

    // ringkasan penerima
    const sum = $(".rek-top-summary");
    $("h4", sum).textContent = e.p.nama;
    $(".pc-title-area span", sum).textContent = e.p.sub;
    $(".pc-badge", sum).textContent = e.p.badge;
    $(".pc-body", sum).innerHTML = e.p.det
      .map((d) => `<div class="detail-item"><span>${esc(d.label)}${d.ok === true ? ' <i class="fas fa-check-circle text-green"></i>' : d.ok === false ? ' <i class="fas fa-times-circle text-red"></i>' : ""}</span><strong>${esc(d.val)}</strong></div>`)
      .join("");

    // 1. terdaftar (read-only, dari master)
    const t = rekTerdaftar(e.p);
    setVals(panelInputs("terdaftar"), [t.bank, t.kodeBank, t.swift, t.noRek, t.nama], true);

    // 2. referensi (pilih dari rekening yang sudah ada di pengajuan ini)
    const refs = daftarReferensi(e.uid);
    const host = $("#rek-view-referensi .input-with-icon.full");
    host.innerHTML = `<select id="rek-ref-select" class="base-textbox" style="width:100%">${refs
      .map((r, i) => `<option value="${i}">${esc(r.nama)} • ${esc(r.bank)} • ${esc(r.noRek)}</option>`)
      .join("")}</select>`;
    const fillRef = () => {
      const r = refs[+$("#rek-ref-select").value] || refs[0];
      setVals(panelInputs("referensi"), [r.bank, r.kodeBank, r.swift, r.noRek, r.nama], true);
    };
    $("#rek-ref-select").onchange = fillRef;
    fillRef();

    // 3. baru (kosong; isi lama jika sebelumnya memilih "baru")
    const b = e.rek && e.rek.sumber === "baru" ? e.rek : {};
    setVals(panelInputs("baru"), [b.bank, b.noRek, b.nama], false);

    switchRekeningSource(e.rek ? e.rek.sumber : "terdaftar");
    $("#modalRekening").classList.remove("hidden");
  };

  window.simpanRekening = function () {
    const e = getE(S.rekUid);
    if (!e) return;
    const src = ($(".rek-radio-card.active")?.id || "rek-radio-terdaftar").replace("rek-radio-", "");
    const v = panelInputs(src).map((i) => i.value.trim());
    const r = src === "baru" ? { bank: v[0], noRek: v[1], nama: v[2] } : { bank: v[0], kodeBank: v[1], swift: v[2], noRek: v[3], nama: v[4] };
    if (!r.bank || !r.noRek || !r.nama) {
      UI.alert("Lengkapi Bank, No Rekening, dan Nama Rekening.", "Data belum lengkap", "warning");
      return;
    }
    e.rek = { sumber: src, ...r };
    $("#modalRekening").classList.add("hidden");
    S.rekUid = null;
    renderAll();
  };

  // ==========================================================================
  // TAB / DAFTAR KIRI
  // ==========================================================================
  window.switchStep3Tab = function (uid) {
    if (typeof uid === "string" && getE(uid)) aktifkan(uid);
  };
  window.pilihPenerima = pilihPenerima;
  window.hapusPenerima = hapusPenerima;

  // Dipanggil setiap masuk step Rincian Biaya
  window.applyRincianBiayaRules = function () {
    syncAuto();
    renderAll();
  };

  // ==========================================================================
  // VALIDASI & PAYLOAD
  // ==========================================================================
  window.validasiRincian = function () {
    if (!S.list.length) return "Tambahkan minimal satu penerima.";
    for (const e of S.list) {
      if (!e.rek) return `Pilih rekening tujuan untuk ${e.p.nama}.`;
      if (isBadan(e)) {
        if (!e.kuitansi.length) return `${e.p.nama}: belum ada kuitansi.`;
        for (const k of e.kuitansi) {
          if (!k.no.trim()) return `${e.p.nama}: nomor kuitansi belum diisi.`;
          if (k.nominal <= 0) return `${e.p.nama}: nominal kuitansi ${k.no} harus lebih dari 0.`;
        }
      } else {
        if (!e.komponen.length) return `${e.p.nama}: belum ada komponen biaya.`;
        for (const c of e.komponen) {
          if (!c.nama.trim()) return `${e.p.nama}: nama komponen belum diisi.`;
          if (c.nominal <= 0) return `${e.p.nama}: nominal komponen "${c.nama}" harus lebih dari 0.`;
        }
      }
    }
    if (modeSkema() === "persekot" && Math.round(grandTotal()) !== Math.round(nilaiPersekot()))
      return "Jumlah rincian harus sama dengan nilai persekot kerja.";
    return null;
  };
  window.getPayloadRincian = () =>
    S.list.map((e) => ({
      kode: e.p.kode,
      nama: e.p.nama,
      tipe: e.auto ? e.tipePengaju : e.p.tipe,
      rekTujuan: e.rek,
      total: total(e),
      pph: totalPph(e),
      kuitansi: e.kuitansi.map((k) => ({ no: k.no, tgl: k.tgl, nominal: k.nominal, ppn: k.ppn, objekPajak: k.subs.map(({ id, dppAuto, ...s }) => s) })),
      komponen: e.komponen.map(({ id, base, ...c }) => c),
    }));

  // Blok "Berikutnya" di step Rincian Biaya jika belum valid
  const _next = window.nextStep;
  window.nextStep = function () {
    const flow = typeof getActiveFlow === "function" ? getActiveFlow() : [];
    if (flow[currentIndex] && flow[currentIndex].targetWrapper === 4) {
      const err = window.validasiRincian();
      if (err) {
        UI.alert(err, "Rincian belum valid", "warning");
        return;
      }
    }
    _next();
  };

  // ==========================================================================
  // API untuk form-app & review
  // ==========================================================================
  window.RincianApp = {
    entries: () => S.list,
    total,
    totalPph,
    isBadan,
    grandTotal,
    KELOMPOK,
    dump: () => JSON.parse(JSON.stringify(S.list)),
    load(model) {
      S.list = JSON.parse(JSON.stringify(model || []));
      S.aktif = S.list[0] ? S.list[0].uid : null;
      let max = 0;
      JSON.stringify(S.list).replace(/"(?:uid|id)":"[a-z](\d+)"/g, (m, n) => { max = Math.max(max, +n); return m; });
      S.seq = Math.max(S.seq, max);
    },
    payload: () =>
      S.list.map((e) => ({
        kode: e.p.kode,
        nama: e.p.nama,
        tipe: e.auto ? e.tipePengaju : e.p.tipe,
        badge: e.p.badge,
        total: total(e),
        pph: totalPph(e),
        transfer: total(e) - totalPph(e),
        rek: e.rek,
        auto: e.auto || null,
        jumlah: isBadan(e) ? e.kuitansi.length : e.komponen.length,
      })),
    refresh: () => { syncAuto(); renderAll(); },
  };

  // ==========================================================================
  // INIT
  // ==========================================================================
  function init() {
    bacaPenerima();
    $("#modalTambahRincian .modal-filter-bar input")?.addEventListener("input", filterModalPenerima);
    $("#modalTambahRincian .filter-select")?.addEventListener("change", filterModalPenerima);
    const fsel = $(".kw-select-kategori");
    if (fsel) {
      if (fsel.options[0]) fsel.options[0].textContent = "Semua Kelompok Biaya";
      fsel.addEventListener("change", () => {
        const e = aktifE();
        if (!e) return;
        e.filterG = fsel.value;
        renderRight();
        applyLocks();
      });
    }
    $(".search-rincian")?.addEventListener("input", (ev) => { S.q = ev.target.value; S.page = 1; renderLeft(); });
    $("#s4-left-populated")?.addEventListener("click", (ev) => {
      const it = ev.target.closest(".s4-pop-item");
      if (it) aktifkan(it.dataset.uid);
    });
    $(".btn-trash")?.addEventListener("click", hapusPenerima);
    const area = $("#kuitansi-list-container");
    area?.addEventListener("click", onClick);
    area?.addEventListener("input", onInput);
    area?.addEventListener("focusout", onBlur);
    // tipe pengaju (persekot / pertanggungjawaban)
    $(".sdh-details")?.addEventListener("change", (ev) => {
      if (ev.target.id !== "select-tipe-pengaju") return;
      const e = aktifE();
      if (!e) return;
      e.tipePengaju = ev.target.value;
      renderLeft();
      renderRight();
      refreshTotals();
      applyLocks();
    });
    $(".search-box-wrapper") && ($(".search-box-wrapper").style.display = "");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
