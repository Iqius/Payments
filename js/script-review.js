// ==========================================================================
// STEP 5 - REVIEW & SUBMIT (dinamis)
// Isi tab: Ringkasan, Pajak, Pembayaran, Jurnal Voucher, Aktivitas & Catatan
// Sumber data: RincianApp (step 4), UploadApp (step 2), FormApp (step 1), Store (aktivitas)
// ==========================================================================
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const nf = new Intl.NumberFormat("id-ID");
  const rp = (n) => "Rp. " + nf.format(Math.round(n || 0)) + ",00";
  // "Rp." di kiri, angka di kanan (dipakai badge PPh & transfer)
  const rpSplit = (n) => `<span>Rp.</span><span>${nf.format(Math.round(n || 0))},00</span>`;
  const rpK = (n) => "Rp " + nf.format(Math.round(n || 0)); // gaya tabel jurnal

  const PAGE = 10;
  const R = { page: { ringkasan: 1, pembayaran: 1 }, q: { ringkasan: "", pembayaran: "", grup: "" }, terbaru: true, expandKeperluan: false };
  window.Review = R;
  R.PAGE = PAGE;

  const ALUR = [
    "Pembuat",
    "Asisten Deputi Unit Kerja",
    "Deputi Unit Kerja",
    "Direktur Teknis",
    "Verifikator Keuangan",
    "Asisten Deputi Perpajakan",
    "Asisten Deputi Treasury",
    "Deputi Keuangan",
    "Direktur Keuangan",
    "Direktur Utama",
  ];
  const PAJAK_NAMA = { "21": "Pajak Penghasilan Pasal 21", "22": "Pajak Penghasilan Pasal 22", "23": "Pajak Penghasilan Pasal 23", "26": "Pajak Penghasilan Pasal 26", "4": "Pajak Penghasilan Pasal 4 Ayat 2" };
  const BANK_LOGO = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M4 11C10 7, 22 7, 28 11" stroke="#004680" stroke-width="4" stroke-linecap="round"/><path d="M4 16C10 12, 22 12, 28 16" stroke="#cfa028" stroke-width="4" stroke-linecap="round"/><path d="M4 21C10 17, 22 17, 28 21" stroke="#004680" stroke-width="4" stroke-linecap="round"/></svg>`;

  // ---------- data ----------
  const tipeOf = (e) => (e.auto ? e.tipePengaju : e.p.tipe);
  const ent = () => RincianApp.entries();
  const tot = (e) => RincianApp.total(e);
  const pphOf = (e) => RincianApp.totalPph(e);
  const isB = (e) => RincianApp.isBadan(e);
  const grand = () => RincianApp.grandTotal();
  const kelompokNama = (key) => (RincianApp.KELOMPOK.find((g) => g.key === key) || { title: key }).title;

  function bgClass(e) {
    const t = tipeOf(e);
    return ["pegawai", "direksi", "penasihat"].includes(t) ? "bg-green-light" : t === "badan" ? "bg-gray" : t === "dewan" ? "bg-blue-light" : "bg-orange";
  }
  function metaPerson(e) {
    const get = (l) => e.p.det.find((d) => d.label === l);
    const pref = ["badan", "pegawai"].includes(tipeOf(e)) ? ["NPWP", "KTP"] : ["KTP", "NPWP"];
    const id = get(pref[0]) || get(pref[1]);
    const kanan = get("Grade") ? "Grade " + get("Grade").val : get("PTKP") ? "PTKP " + get("PTKP").val : "";
    if (!id) return "";
    return `<span class="tag">${esc(id.label)}</span>${id.ok === false ? '<i class="fa-solid fa-circle-xmark" style="color:#d93025"></i>' : '<i class="fa-solid fa-circle-check icon-verified"></i>'}<span class="id-number">${esc(id.val)}</span>${kanan ? `<span class="grade">${esc(kanan)}</span>` : ""}`;
  }
  const bankCard = (e) =>
    e.rek
      ? `<div class="bank-name">${esc(e.rek.nama)}</div><div class="bank-acc">${esc(e.rek.noRek)} <span class="acc-name">${esc(e.rek.bank)}</span></div>`
      : `<div class="bank-name" style="color:#d93025">Rekening belum dipilih</div>`;

  // ---------- pencarian di dalam card (Ringkasan & Pembayaran) ----------
  const hayEntry = (e) => [e.p.nama, e.p.kode, ...(e.p.det || []).map((d) => d.val), e.rek ? e.rek.nama + " " + e.rek.noRek + " " + e.rek.bank : ""].join(" ").toLowerCase();
  const cocok = (q, e) => !q || hayEntry(e).includes(q);
  function pasangCari(key, cont, rerender) {
    const wrap = document.createElement("div");
    wrap.className = "s5-search";
    wrap.innerHTML = `<i class="fas fa-search"></i><input type="text" placeholder="Cari nama, NPWP / KTP, atau rekening..." value="${esc(R.q[key])}">`;
    const inp = wrap.querySelector("input");
    inp.addEventListener("input", () => {
      const pos = inp.selectionStart;
      R.q[key] = inp.value;
      R.page[key] = 1;
      rerender();
      const n = cont.querySelector(".s5-search input");
      if (n) {
        n.focus();
        n.setSelectionRange(pos, pos);
      }
    });
    cont.prepend(wrap);
  }

  // ---------- pager ----------
  function pager(key, total, rerender) {
    const pages = Math.max(1, Math.ceil(total / PAGE));
    const cur = Math.min(Math.max(R.page[key], 1), pages);
    R.page[key] = cur;
    const from = total ? (cur - 1) * PAGE + 1 : 0;
    const to = Math.min(cur * PAGE, total);
    const div = document.createElement("div");
    div.className = "s5-pager";
    div.innerHTML = `<span>Menampilkan ${from} - ${to} dari ${total}</span>
      <span class="pg"><button data-p="first" ${cur === 1 ? "disabled" : ""}><i class="fas fa-step-backward"></i></button>
      <button data-p="prev" ${cur === 1 ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>
      <button class="active-page">${cur}</button><span>of ${pages}</span>
      <button data-p="next" ${cur === pages ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button>
      <button data-p="last" ${cur === pages ? "disabled" : ""}><i class="fas fa-step-forward"></i></button></span>`;
    div.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-p]");
      if (!b) return;
      const to = { first: 1, prev: cur - 1, next: cur + 1, last: pages }[b.dataset.p];
      R.page[key] = to;
      rerender();
    });
    return { el: div, from: (cur - 1) * PAGE, to: cur * PAGE };
  }

  // ==========================================================================
  // TAB RINGKASAN
  // ==========================================================================
  function detailRowsHtml(e) {
    const head = `<div class="detail-header"><div class="col-name">Komponen Biaya</div><div class="col-nominalHome">Nominal Biaya</div><div class="col-pph">Potongan PPh</div><div class="col-transfer text-right">Nominal Transfer</div></div>`;
    const rows = isB(e)
      ? e.kuitansi.map((k) => ({ n: `Kuitansi ${k.no || "(belum ada nomor)"}`, nom: k.nominal, pph: k.subs.reduce((t, s) => t + s.pph, 0) }))
      : e.komponen.map((c) => ({ n: c.nama || kelompokNama(c.g), nom: c.nominal, pph: c.pph }));
    return (
      head +
      (rows.length
        ? rows.map((r) => `<div class="detail-row"><div class="col-name sub-card">${esc(r.n)}</div><div class="col-nominalHome">${rp(r.nom)}</div><div class="col-pph"><span class="badge-pph">${rpSplit(r.pph)}</span></div><div class="col-transfer"><span class="badge-transfer">${rpSplit(r.nom - r.pph)}</span></div></div>`).join("")
        : '<div class="s5-empty">Belum ada komponen biaya.</div>')
    );
  }

  // satu baris penerima (dipakai tab Informasi Umum & Informasi Grup Pengajuan)
  const barisRingkasan = (e) => `
      <div class="s5-accordion-item">
        <div class="s5-list-row" data-uid="${esc(e.uid)}" onclick="toggleRow(this)">
          <i class="fa-solid fa-chevron-right chevron-icon"></i>
          <div class="card person-card ${bgClass(e)}"><div class="person-name">${esc(e.p.nama)}</div><div class="person-meta">${metaPerson(e)}</div></div>
          <div class="card component-card">${isB(e) ? `${e.kuitansi.length} Kwitansi / Invoice` : `${e.komponen.length} Komponen biaya`}</div>
          <div class="card bank-card"><div class="bank-icon-placeholder"><i class="fa-solid fa-building-columns"></i></div><div class="bank-info">${bankCard(e)}</div></div>
          <div class="card amount-card"><div class="amount-label">Total Biaya</div><div class="amount-value"><span>Rp.</span><span class="value-number">${nf.format(Math.round(tot(e)))},00</span></div></div>
        </div>
        <div class="accordion-content"><div class="detail-container"><div class="branch-icon"><i class="branch-connector"></i></div><div class="detail-table">${detailRowsHtml(e)}</div></div></div>
      </div>`;

  function renderRingkasan() {
    const root = $("#s5-content-ringkasan");
    const cont = $(".s5-list-container", root);
    const semua = ent();
    const qr = R.q.ringkasan.trim().toLowerCase();
    const list = semua.filter((e) => cocok(qr, e));
    root.querySelectorAll(".panel-pagination").forEach((x) => x.remove());
    root.querySelectorAll(".s5-pager").forEach((x) => x.remove());
    if (!semua.length) {
      cont.innerHTML = '<div class="s5-empty">Belum ada rincian biaya. Kembali ke langkah Rincian Biaya.</div>';
      return;
    }
    if (!list.length) {
      cont.innerHTML = '<div class="s5-empty">Tidak ada hasil untuk pencarian ini.</div>';
      pasangCari("ringkasan", cont, renderRingkasan);
      return;
    }
    const pg = pager("ringkasan", list.length, renderRingkasan);
    cont.innerHTML = list.slice(pg.from, pg.to).map(barisRingkasan).join("");
    pasangCari("ringkasan", cont, renderRingkasan);
    root.appendChild(pg.el);
  }

  // ==========================================================================
  // TAB PAJAK
  // ==========================================================================
  function pajakAgg() {
    const jenis = {};
    const add = (code, objek, penerima, dpp, pph) => {
      const pre = String(code || "21").split("-")[0] || "21";
      const j = (jenis[pre] = jenis[pre] || { pre, objek: {}, total: 0 });
      const o = (j.objek[objek] = j.objek[objek] || { nama: objek, dpp: 0, pph: 0, peg: [] });
      o.dpp += dpp;
      o.pph += pph;
      o.peg.push({ nama: penerima, dpp, pph });
      j.total += pph;
    };
    ent().forEach((e) => {
      if (isB(e)) {
        e.kuitansi.forEach((k) =>
          k.subs.forEach((s) => {
            if (s.nama || s.pph) add(s.kode, s.nama || "(Objek pajak belum dipilih)", e.p.nama, s.dpp, s.pph);
          }),
        );
      } else {
        e.komponen.forEach((c) => {
          if (c.pph) add("21", c.nama || kelompokNama(c.g), e.p.nama, c.nominal, c.pph);
        });
      }
    });
    return Object.values(jenis);
  }

  function renderPajak() {
    const cont = $("#s5-content-pajak .s5-list-container");
    const data = pajakAgg();
    if (!data.length) {
      cont.innerHTML = '<div class="s5-empty">Belum ada potongan pajak. Isi objek pajak (badan usaha) atau potongan PPh komponen (perorangan).</div>';
      return;
    }
    cont.innerHTML =
      '<div class="s5-list">' +
      data
        .map(
          (j) => `
      <div class="tax-accordion-wrapper"><div class="tax-item">
        <div class="tax-header-row" onclick="toggleAccordion(this)">
          <i class="fa-solid fa-chevron-right chevron-icon"></i>
          <div class="tax-main-card"><span class="tax-title">${esc(PAJAK_NAMA[j.pre] || "Pajak Penghasilan Pasal " + j.pre)}</span><span class="tax-badge">${Object.keys(j.objek).length} Objek Pajak</span></div>
          <div class="tax-total-card"><span class="total-title">Total Potongan</span><span class="total-value">${rp(j.total)}</span></div>
        </div>
        <div class="tax-content-panel"><div class="tree-container"><div class="branch-icon"><i class="branch-connector"></i></div>
          <div class="objek-table">
            <div class="grid-header"><div class="col-name-head">Nama Objek Pajak</div><div class="col-dpp-head">Total DPP PPh</div><div class="col-potongan-head">Total Potongan PPh</div></div>
            ${Object.values(j.objek)
              .map(
                (o) => `
            <div class="objek-item">
              <div class="objek-row" onclick="toggleAccordion(this)"><i class="fa-solid fa-chevron-right chevron-icon"></i>
                <div class="objek-card">${esc(o.nama)}</div>
                <div class="badge-dpp"><span>Rp.</span><span>${nf.format(Math.round(o.dpp))},00</span></div>
                <div class="badge-potongan"><span>Rp.</span><span>${nf.format(Math.round(o.pph))},00</span></div>
              </div>
              <div class="pegawai-content-panel">
                <div class="grid-header-pegawai"><div class="col-name-head">Nama Pegawai / Pegawai Eksternal / Rekanan</div><div class="col-dpp-head">DPP PPh</div><div class="col-potongan-head">Potongan PPh</div></div>
                ${o.peg.map((g) => `<div class="pegawai-row"><div class="branch-icon"></div><div class="pegawai-card">${esc(g.nama)}</div><div class="badge-dpp"><span>Rp.</span><span>${nf.format(Math.round(g.dpp))},00</span></div><div class="badge-potongan"><span>Rp.</span><span>${nf.format(Math.round(g.pph))},00</span></div></div>`).join("")}
              </div>
            </div>`,
              )
              .join("")}
          </div></div></div>
      </div></div>`,
        )
        .join("") +
      "</div>";
  }

  // ==========================================================================
  // TAB PEMBAYARAN
  // ==========================================================================
  const GRUP_TIPE = { pegawai: "Pegawai Internal", direksi: "Pegawai Internal", penasihat: "Pegawai Internal", dewan: "Pegawai Eksternal", perorangan: "Pegawai Eksternal", badan: "Rekanan" };
  function pembayaranAgg() {
    const m = {};
    ent().forEach((e) => {
      const key = e.rek ? e.rek.bank + "|" + e.rek.noRek : "-";
      const g = (m[key] = m[key] || { rek: e.rek, items: [], transfer: 0 });
      g.items.push(e);
      g.transfer += tot(e) - pphOf(e);
    });
    return Object.values(m);
  }
  function statusTransfer() {
    const b = FormApp.base();
    const s = b ? b.status : "draft";
    return s === "done" ? { c: "status-success", t: "Sukses" } : s === "approved" ? { c: "status-processing", t: "Dalam Proses" } : { c: "status-pending", t: "Belum Proses" };
  }
  function renderPembayaran() {
    const root = $("#s5-content-pembayaran");
    const cont = $(".s5-list", root);
    root.querySelectorAll(".s5-pager").forEach((x) => x.remove());
    const semuaGrup = pembayaranAgg();
    const qp = R.q.pembayaran.trim().toLowerCase();
    const grup = semuaGrup.filter((g) => g.items.some((e) => cocok(qp, e)) || (g.rek && (g.rek.nama + " " + g.rek.noRek + " " + g.rek.bank).toLowerCase().includes(qp)));
    if (!semuaGrup.length) {
      cont.innerHTML = '<div class="s5-empty">Belum ada tujuan pembayaran.</div>';
      return;
    }
    if (!grup.length) {
      cont.innerHTML = '<div class="s5-empty">Tidak ada hasil untuk pencarian ini.</div>';
      pasangCari("pembayaran", cont, renderPembayaran);
      return;
    }
    const pg = pager("pembayaran", grup.length, renderPembayaran);
    const stt = statusTransfer();
    const id = FormApp.id();
    const kode = FormApp.base() && ["approved", "done"].includes(FormApp.base().status) ? "TRF" + id.slice(-3) : "xxxxxx";
    cont.innerHTML = grup
      .slice(pg.from, pg.to)
      .map((g) => {
        const cnt = {};
        g.items.forEach((e) => (cnt[GRUP_TIPE[tipeOf(e)] || "Pegawai Internal"] = (cnt[GRUP_TIPE[tipeOf(e)] || "Pegawai Internal"] || 0) + 1));
        const tag = Object.entries(cnt).map(([k, v]) => `${v} ${k}`).join(", ");
        const rek = g.rek;
        return `
      <div class="s5-accordion-item">
        <div class="s5-list-row" onclick="toggleRow(this)">
          <i class="fa-solid fa-chevron-right chevron-icon"></i>
          <div class="main-card">
            <div class="bank-info-2"><div class="bank-logo">${BANK_LOGO}</div>
              <div class="bank-details"><span class="bank-name">${esc(rek ? rek.nama : "Rekening belum dipilih")}</span>
                <div class="account-row"><span class="account-number">${esc(rek ? rek.noRek : "-")}</span>${rek ? '<i class="fa-solid fa-circle-check icon-verified"></i>' : ""}</div>
                <span class="account-holder">${esc(rek ? rek.bank : "")}</span></div></div>
            <div class="recipient-tag">${esc(tag)}</div>
            <div class="nominal-box"><span>Rp.</span><span>${nf.format(Math.round(g.transfer))},00</span></div>
          </div>
          <div class="status-card"><div class="status-badge ${stt.c}">${stt.t}</div><div class="code-box">${esc(kode)}</div></div>
        </div>
        <div class="accordion-content"><div class="detail-container"><div class="branch-icon"><i class="branch-connector"></i></div>
          <div class="detail-tableTujuan">
            <div class="detail-header"><div class="col-name">Nama Pegawai/Pegawai Eksternal/Rekanan</div><div class="col-nominalHome">Total Biaya</div><div class="col-pph">Total Potongan</div><div class="col-transfer text-right">Total Transfer</div></div>
            ${g.items.map((e) => `<div class="detail-row ${isB(e) ? "row-rekanan" : "row-pegawai"}"><div class="col-name sub-card">${esc(e.p.nama)}</div><div class="col-nominalHome">${rp(tot(e))}</div><div class="col-pph"><span class="badge-pph">${rp(pphOf(e))}</span></div><div class="col-transfer"><span class="badge-transfer">${rp(tot(e) - pphOf(e))}</span></div></div>`).join("")}
          </div></div></div>
      </div>`;
      })
      .join("");
    pasangCari("pembayaran", cont, renderPembayaran);
    $(".s5-list-container", root).appendChild(pg.el);
  }

  // ==========================================================================
  // TAB JURNAL VOUCHER
  // ==========================================================================
  const AKUN_BEBAN = { honor: ["5-2101", "Beban Honor dan Jasa Perorangan"], royalti: ["5-2102", "Beban Royalti dan Sewa"], deposito: ["5-2103", "Beban Bunga Deposito"], usaha: ["5-2104", "Beban Usaha Perseorangan"], profesional: ["5-2105", "Beban Jasa Profesional"], sewa: ["5-2106", "Beban Sewa Properti"], badan: ["5-2200", "Beban Barang dan Jasa Rekanan"] };

  function jurnalLines(sk, F) {
    const lines = [];
    const D = (kode, nama, v) => v > 0 && lines.push({ kode, nama, d: v, k: 0 });
    const K = (kode, nama, v) => v > 0 && lines.push({ kode, nama, d: 0, k: v });
    const total = grand();
    const pph = ent().reduce((t, e) => t + pphOf(e), 0);
    const pajak = pajakAgg();
    const kreditPajak = () => pajak.forEach((j) => K("2-13" + String(j.pre).padStart(2, "0"), "Hutang PPh " + j.pre, j.total));
    if (sk === "persekot") {
      D("1-1500", "Uang Muka Persekot Kerja", total);
      kreditPajak();
      K("1-1100", "Kas & Setara Kas", total - pph);
    } else {
      const bk = {};
      ent().forEach((e) => {
        if (isB(e)) bk.badan = (bk.badan || 0) + tot(e);
        else e.komponen.forEach((c) => (bk[c.g] = (bk[c.g] || 0) + c.nominal));
      });
      Object.entries(bk).forEach(([k, v]) => D(AKUN_BEBAN[k][0], AKUN_BEBAN[k][1], v));
      if (sk === "pertanggungjawaban") {
        const nilai = F.nilaiPersekot || 0;
        K("1-1500", "Uang Muka Persekot Kerja", nilai);
        kreditPajak();
        const delta = total - nilai - pph; // >0 kas keluar, <0 kas kembali
        if (delta > 0) K("1-1100", "Kas & Setara Kas", delta);
        else D("1-1100", "Kas & Setara Kas", -delta);
      } else {
        kreditPajak();
        K("1-1100", "Kas & Setara Kas", total - pph);
      }
    }
    return lines;
  }

  function renderJurnal() {
    const cont = $("#s5-content-jurnal .s5-list-container");
    const F = FormApp.snapshot();
    const b = FormApp.base();
    const status = b ? b.status : "draft";
    const posted = ["approved", "done", "unrealized", "realized"].includes(status);
    const dikembalikan = b ? (b.activity || []).filter((a) => /dikembalikan/i.test(a.text)).length : 0;
    const namaSkema = { pembayaran: "Pembayaran", persekot: "Persekot Kerja", pertanggungjawaban: "Pertanggungjawaban" }[F.skema];
    const nodes = [];
    for (let i = 0; i < dikembalikan; i++) nodes.push({ n: "node-pink", t: namaSkema, s: "Normal · Dibatalkan", c: "status-pink" });
    nodes.push({ n: "node-blue", t: dikembalikan ? namaSkema + " Ulang" : namaSkema, s: posted ? "Normal · Terposting" : "Normal · Belum terposting", c: "status-blue", active: true });
    const tgl = Store.util.fmtTgl(Store.util.todayIso()).replace(/^0/, "");
    const lines = jurnalLines(F.skema, F);
    const sumD = lines.reduce((t, l) => t + l.d, 0);
    const sumK = lines.reduce((t, l) => t + l.k, 0);
    const id = FormApp.id();
    cont.innerHTML = `
      <div class="stepper-container">
        <div class="step-line-container">${nodes.slice(1).map((_, i, a) => `<div class="step-line${i === a.length - 1 ? " active-blue" : ""}"></div>`).join("")}</div>
        ${nodes.map((n) => `<div class="step-item"><div class="step-node ${n.n}"></div><div class="step-info"><span class="step-date${n.active ? " active" : ""}">${tgl}</span><span class="step-title${n.active ? " active" : ""}">${esc(n.t)}</span><span class="step-status ${n.c}">${n.s}</span></div></div>`).join("")}
      </div>
      <div class="detail-card">
        <div class="card-header"><h2 class="card-title">Detail Jurnal — ${esc(nodes[nodes.length - 1].t)}</h2>
          <p class="card-subtitle">VJ-${esc(id.slice(0, 6))}-${esc(id.slice(-3))} · ${esc(Store.util.fmtTglPanjang(Store.util.todayIso()))} · Normal · ${posted ? "Terposting" : "Belum terposting"} · ${lines.length} baris</p></div>
        <table class="journal-table">
          <thead><tr><th style="width: 50px; text-align: center;">No.</th><th>Kode Akun</th><th>Nama Akun</th><th class="text-right" style="width: 150px;">Debit</th><th class="text-right" style="width: 150px;">Kredit</th></tr></thead>
          <tbody>${lines.length ? lines.map((l, i) => `<tr><td style="text-align: center;">${i + 1}</td><td>${esc(l.kode)}</td><td>${esc(l.nama)}</td><td class="text-right${l.d ? "" : " dash-symbol"}">${l.d ? rpK(l.d) : "—"}</td><td class="text-right${l.k ? "" : " dash-symbol"}">${l.k ? rpK(l.k) : "—"}</td></tr>`).join("") : '<tr><td colspan="5" class="s5-empty">Belum ada data jurnal.</td></tr>'}</tbody>
        </table>
        <div class="table-footer"><span class="total-title">Total</span><div class="total-amounts"><span class="total-val" style="margin-right: 50px;">${rpK(sumD)}</span><span class="total-val">${rpK(sumK)}</span></div></div>
      </div>`;
  }

  // ==========================================================================
  // TAB AKTIVITAS & CATATAN
  // ==========================================================================
  function alurStatus(b) {
    const s = ALUR.map(() => ({ k: "grey", t: "Belum dapat diproses" }));
    const hijau = (from, to, t) => {
      for (let i = from; i < to; i++) s[i] = { k: "green", t: t || "Disetujui" };
    };
    const st = b ? b.status : "new";
    if (st === "new" || st === "draft") s[0] = { k: "blue", t: "Draft - Aktif" };
    else if (st === "revise") {
      s[0] = { k: "blue", t: "Sedang diperbaiki - Aktif" };
      const at = b.returnedAt === "approval" ? 5 : 4;
      hijau(1, at);
      s[at] = { k: "orange", t: "Dikembalikan ke pembuat" };
    } else if (st === "submitted") {
      s[0] = { k: "green", t: "Diajukan" };
      if (!b.verified) {
        hijau(1, 4);
        s[4] = { k: "blue", t: "Menunggu verifikasi - Aktif" };
      } else {
        hijau(1, 5);
        s[5] = { k: "blue", t: "Menunggu persetujuan - Aktif" };
      }
    } else if (st === "unrealized" || st === "realized") {
      s[0] = { k: "green", t: "Diajukan" };
      for (let i = 1; i < s.length; i++) s[i] = { k: "grey", t: "Tidak diperlukan (persekot)" };
    } else {
      s[0] = { k: "green", t: "Diajukan" };
      hijau(1, s.length);
    }
    return s;
  }
  const SUB = { blue: "sub-blue", green: "sub-green", orange: "sub-orange", grey: "sub-grey" };

  function renderCatatan() {
    const b = FormApp.base();
    const alur = alurStatus(b);
    $("#s5-content-catatan .flow-list").innerHTML = ALUR.map(
      (n, i) => `<div class="flow-item${alur[i].k === "blue" ? " active" : ""}"><div class="flow-item-left"><span class="dot dot-${alur[i].k}"></span><div class="flow-text"><span class="flow-title">${esc(n)}</span><span class="flow-subtitle ${SUB[alur[i].k]}">${esc(alur[i].t)}</span></div></div><span class="flow-number">${i + 1}</span></div>`,
    ).join("");

    let acts = b ? b.activity.slice() : [{ stamp: Store.util.stampNow(), text: "Pengajuan akan dibuat", by: "Sistem", role: "", kind: "grey" }];
    if (b && b.status === "revise") acts.push({ stamp: Store.util.stampNow(), text: "Pembuat mulai memperbaiki pengajuan", by: Store.config.pengaju.nama, role: "Pembuat", kind: "blue" });
    if (R.terbaru) acts = acts.slice().reverse();
    const sub = $("#s5-content-catatan .panel-subtitle");
    if (sub) sub.textContent = `Semua tahap · ${acts.length} aktivitas`;
    const sort = $("#s5-content-catatan .sort-btn");
    if (sort) {
      sort.innerHTML = R.terbaru ? "Terbaru &darr;" : "Terlama &uarr;";
      sort.onclick = () => {
        R.terbaru = !R.terbaru;
        renderCatatan();
      };
    }
    const card = { blue: "blue-card", orange: "amber-card" };
    $("#s5-content-catatan .activity-list").innerHTML = acts
      .map(
        (a) => `<div class="activity-card ${card[a.kind] || ""}"><span class="dot dot-${a.kind || "grey"}"></span><div class="activity-content"><span class="activity-main-text">${esc(a.text)}</span><span class="activity-meta">${esc([a.by, a.role, a.stamp].filter(Boolean).join(" · "))}</span>${a.note ? `<p class="activity-note">${esc(a.note)}</p>` : ""}</div></div>`,
      )
      .join("");
  }

  // ==========================================================================
  // PANEL KIRI, INFO BAR, FOOTER
  // ==========================================================================
  R.refreshDocs = function () {
    const root = $("#step-5-wrapper");
    if (!root || !window.UploadApp) return;
    const st = UploadApp.wajibStatus();
    const vals = $$(".summary-stats .stat-value", root);
    if (vals[0]) vals[0].textContent = st.uploaded;
    if (vals[1]) vals[1].textContent = `${st.lengkap.length}/${st.wajib.length}`;
    const bar = $(".progress-bar-fill", root);
    if (bar) {
      // bar diberi "track" (latar) supaya isinya mengikuti persentase, bukan selalu penuh
      if (!bar.parentElement.classList.contains("progress-track")) {
        const tr = document.createElement("div");
        tr.className = "progress-track";
        bar.parentElement.insertBefore(tr, bar);
        tr.appendChild(bar);
      }
      bar.style.width = st.persen + "%";
    }
    const pct = $(".progress-percent", root);
    if (pct) pct.textContent = st.persen + "%";
  };

  function renderKiri() {
    const root = $("#step-5-wrapper");
    const F = FormApp.snapshot();
    const b = FormApp.base();
    const rows = $$(".s5-info-card .info-row-inline .s5-info-value", root);
    if (rows[0]) rows[0].textContent = (b && b.pengaju) || Store.config.pengaju.nama;
    if (rows[1]) rows[1].textContent = Store.config.pengaju.subUnit;
    const desc = $(".s5-info-card .info-desc", root);
    if (desc) {
      desc.textContent = F.keperluan || "-";
      desc.classList.toggle("clamp", !R.expandKeperluan);
    }
    const btn = $("#s5-lihat-btn", root);
    if (btn) {
      btn.style.display = (F.keperluan || "").length > 110 ? "" : "none";
      btn.innerHTML = R.expandKeperluan ? 'Sembunyikan <i class="fas fa-chevron-up"></i>' : 'Lihat selengkapnya <i class="fas fa-chevron-down"></i>';
    }
    const dc = $("#s5-detail-card", root);
    if (dc) DetailInfo.fill(dc, F.flow, F.detail);
    const iv = $$(".s5-verifikasi-card .info-card .s5-info-value", root);
    if (iv[0]) iv[0].textContent = (b && b.verifikator) || Store.config.verifikator;
    if (iv[1]) iv[1].textContent = b && b.verified ? b.statusDate || "-" : "Belum diverifikasi";
    const tp = $(".badge-total strong", root);
    if (tp) tp.textContent = rp(grand());
    // pertanggungjawaban: Anggaran Tersedia | Nilai Persekot | Nilai Realisasi
    const pj = F.skema === "pertanggungjawaban";
    const lbl = $(".badge-total span", root);
    if (lbl) lbl.textContent = pj ? "Nilai Realisasi" : "Total Pengajuan";
    const barInfo = $(".step2-info-bar", root) || $(".badge-total", root)?.parentElement;
    let nb = $("#badge-nilai-persekot-review", root);
    if (!pj) {
      if (nb) nb.remove();
    } else if (barInfo) {
      if (!nb) {
        nb = document.createElement("div");
        nb.id = "badge-nilai-persekot-review";
        nb.className = "badge-tersedia";
        nb.innerHTML = "<span>Nilai Persekot</span><strong></strong>";
        const tersedia = $(".badge-tersedia", barInfo);
        if (tersedia) tersedia.after(nb);
        else barInfo.appendChild(nb);
      }
      nb.querySelector("strong").textContent = rp(F.nilaiPersekot || 0);
    }
    const sums = $$("footer.s5-header .summary-amount", root);
    const pph = ent().reduce((t, e) => t + pphOf(e), 0);
    if (sums[0]) sums[0].textContent = rp(grand());
    if (sums[1]) sums[1].textContent = rp(pph);
    if (sums[2]) sums[2].textContent = rp(grand() - pph);
    R.refreshDocs();
  }


  // ---------- Informasi Grup Pengajuan (verifikasi & approval) ----------
  // Penerima dikelompokkan per role (badge), urut seperti filter "Tambah Penerima".
  // Tiap grup: nama grup | total pengajuan | total PPh, lalu baris penerima seperti Informasi Umum.
  const GRUP_URUT = ["Direksi", "Penasihat", "Dewan Pengawas dan Komite", "Pegawai", "Perorangan", "Badan Usaha"];
  const grupOf = (e) => (e.p && e.p.badge) || (isB(e) ? "Badan Usaha" : "Pegawai");
  function wadahGrup() {
    if (!document.querySelector("[onclick*=\"switchs5Tab('grup'\"]")) return null; // hanya halaman yang punya menunya
    let root = $("#s5-content-grup");
    if (root) return root;
    const ref = $("#s5-content-ringkasan");
    if (!ref) return null;
    root = document.createElement("div");
    root.className = "s5-right-content";
    root.id = "s5-content-grup";
    root.style.display = "none";
    root.innerHTML = '<h2 class="s5-section-title">Informasi Grup Pengajuan</h2><div class="s5-list-container"></div>';
    ref.after(root);
    return root;
  }
  R.grupBuka = new Set(); // grup yang sedang dibuka (default semua tertutup)
  R.toggleGrup = function (head) {
    const sec = head.closest(".grup-sec");
    const g = sec.dataset.grup;
    const buka = !sec.classList.contains("buka");
    sec.classList.toggle("buka", buka);
    head.title = (buka ? "Tutup" : "Buka") + " grup";
    if (buka) R.grupBuka.add(g);
    else R.grupBuka.delete(g);
  };
  function renderGrup() {
    const root = wadahGrup();
    if (!root) return;
    const cont = $(".s5-list-container", root);
    const semua = ent();
    const qr = R.q.grup.trim().toLowerCase();
    const list = semua.filter((e) => cocok(qr, e));
    if (!semua.length) {
      cont.innerHTML = '<div class="s5-empty">Belum ada rincian biaya.</div>';
      return;
    }
    const map = new Map();
    list.forEach((e) => {
      const g = grupOf(e);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(e);
    });
    if (qr) map.forEach((v, g) => R.grupBuka.add(g)); // saat mencari, grup yang cocok otomatis terbuka
    const urut = [...map.keys()].sort((a, b) => (GRUP_URUT.indexOf(a) + 1 || 99) - (GRUP_URUT.indexOf(b) + 1 || 99));
    cont.innerHTML = urut.length
      ? urut
          .map((g) => {
            const rows = map.get(g);
            const tAju = rows.reduce((t, e) => t + tot(e), 0);
            const tPph = rows.reduce((t, e) => t + pphOf(e), 0);
            const buka = R.grupBuka.has(g);
            return `
      <div class="grup-sec${buka ? " buka" : ""}" data-grup="${esc(g)}">
        <div class="grup-head" onclick="Review.toggleGrup(this)" title="${buka ? "Tutup" : "Buka"} grup">
          <i class="fa-solid fa-chevron-right grup-panah"></i>
          <div class="grup-nama">${esc(g)}<span>${rows.length} penerima</span></div>
          <div class="grup-tot"><span>Total Pengajuan</span><strong>${rp(tAju)}</strong></div>
          <div class="grup-tot"><span>Total PPh</span><strong class="text-red">${rp(tPph)}</strong></div>
        </div>
        <div class="grup-isi">${rows.map(barisRingkasan).join("")}</div>
      </div>`;
          })
          .join("")
      : '<div class="s5-empty">Tidak ada hasil untuk pencarian ini.</div>';
    pasangCari("grup", cont, renderGrup);
  }

  R.render = function () {
    try {
      renderKiri();
      renderRingkasan();
      renderGrup();
      renderPajak();
      renderPembayaran();
      renderJurnal();
      renderCatatan();
    } catch (e) {
      console.error("[review]", e);
    }
  };

  // nominal ringkasan di bawah hanya untuk tab Ringkasan Umum
  const tabAwal = window.switchs5Tab;
  window.switchs5Tab = function (tab) {
    if (tabAwal) tabAwal.apply(this, arguments);
    const w = $("#step-5-wrapper");
    if (w) w.classList.toggle("tab-lain", tab !== "ringkasan");
  };

  window.toggleKeperluan = function () {
    R.expandKeperluan = !R.expandKeperluan;
    renderKiri();
  };

  // ==========================================================================
  // PRATINJAU GABUNGAN (modal)
  // ==========================================================================
  // gabung=true : semua file dalam satu tampilan | gabung=false : satu file per kartu (1-1)
  const PV = { gabung: true, aktifId: null };
  function isiModalPreview() {
    const m = $("#filePreviewModal");
    const files = UploadApp.files;
    const grid = $(".file-grid-2col", m);
    grid.innerHTML = files.length
      ? files
          .map(
            (f) => `<div class="step3-file-card-submit${!PV.gabung && f.id === PV.aktifId ? " is-active" : ""}" data-fid="${f.id}" style="cursor:pointer"><div class="s4-fc-header-submit"><div class="fc-info-submit">${UploadApp.iconOf(f)}<span class="fc-title-submit" title="${esc(f.name)}">${esc(f.name)}</span></div><span class="fc-size-submit">${UploadApp.fmtSize(f.size)}</span></div><div class="s4-fc-tags-submit">${f.tags.map((t) => `<span class="doc-tag">${esc(UploadApp.jenisNama(t))}</span>`).join("")}</div></div>`,
          )
          .join("")
      : '<div class="fc-empty">Belum ada dokumen pendukung.</div>';
    const st = UploadApp.wajibStatus();
    const info = $(".list-pagination .pagination-info strong", m);
    if (info) info.textContent = `${files.length} Dokumen`;
    const pc = $(".list-pagination .pagination-controls", m);
    if (pc) pc.style.display = "none";
    const box = $(".mandatory-box", m);
    if (box) box.innerHTML = "<strong>Dokumen Wajib</strong><ul>" + st.wajib.map((k) => `<li class="${st.lengkap.includes(k) ? "ok" : "miss"}">${esc(UploadApp.jenisNama(k))}</li>`).join("") + "</ul>";
    grid.onclick = (ev) => {
      const c = ev.target.closest("[data-fid]");
      if (!c) return;
      // klik kartu = lihat file itu saja (1-1)
      PV.gabung = false;
      PV.aktifId = c.dataset.fid;
      isiModalPreview();
    };
    const z = $(".pt-zoom", m);
    if (z) z.style.display = "none";
    const aktif = !PV.gabung && files.find((x) => x.id === PV.aktifId);
    if (aktif) UploadApp.tampilPreview(aktif, m);
    else UploadApp.tampilGabungan(m);
  }
  // ikon di judul "Dokumen Pendukung": tampil 1-1, mulai dari file pertama
  window.openFilePreviewModal = function () {
    PV.gabung = !UploadApp.files.length;
    PV.aktifId = UploadApp.files[0] ? UploadApp.files[0].id : null;
    isiModalPreview();
    $("#filePreviewModal").style.display = "flex";
  };
  // tombol "Buka pratinjau gabungan": semua file jadi satu
  window.openMergedPreview = function () {
    PV.gabung = true;
    isiModalPreview();
    $("#filePreviewModal").style.display = "flex";
  };
  window.closeFilePreviewModal = function () {
    $("#filePreviewModal").style.display = "none";
  };
})();
