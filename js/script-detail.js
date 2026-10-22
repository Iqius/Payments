// ==========================================================================
// DETAIL VERIFIKASI + KEPERLUAN (3 baris + expand)
//   DetailInfo.rows(flow, detail)      -> [[label, nilai], ...] (kosong untuk operasional)
//   DetailInfo.fill(cardEl, flow, d)   -> isi card "Detail Verifikasi"
//   DetailInfo.mount(doc)              -> dipakai halaman approval/verifikasi
//   DetailInfo.clamp(pEl)              -> keperluan 3 baris + tombol "Lihat selengkapnya"
// Perjalanan Dinas : Nomor SPPD, Kategori Perjalanan, Tanggal Kegiatan (dari s.d.)
// Pengadaan        : Nama Pengadaan, Nomor Kontrak, Nama Penyedia
// ==========================================================================
(function () {
  "use strict";
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const D = (window.DetailInfo = {});

  D.flowOf = (doc) => doc.flow || ({ "perjalanan-dinas": "perjalanan_dinas", pengadaan: "pengadaan" }[doc.tab] || "operasional");

  // daftar field pengadaan (dipakai form, card review, dan halaman approval/verifikasi)
  D.PENGADAAN = [
    { k: "noPengadaan", l: "Nomor Pengadaan" },
    { k: "namaPengadaan", l: "Nama Pengadaan" },
    { k: "noKontrak", l: "Nomor Kontrak" },
    { k: "namaPenyedia", l: "Nama Penyedia" },
    { k: "nilaiKontrak", l: "Nilai Kontrak/Nilai Pagu Pengadaan", uang: true },
    { k: "noRekening", l: "No Rekening" },
    { k: "bank", l: "Bank" },
    { k: "termin", l: "Termin/Sekaligus" },
    { k: "nilaiTagihan", l: "Nilai Tagihan", uang: true },
    { k: "denda", l: "Denda/Pinalti (jika ada)", uang: true, opsional: true },
  ];
  const rp = (n) => "Rp. " + new Intl.NumberFormat("id-ID").format(Number(n) || 0) + ",00";

  // -> { utama: [[label, nilai]], tambahan: [[label, nilai]] }
  D.rows = function (flow, d) {
    d = d || {};
    const v = (x) => (x && String(x).trim()) || "-";
    if (flow === "perjalanan_dinas") {
      const tgl = d.tglDari ? d.tglDari + (d.tglSampai ? " s.d. " + d.tglSampai : "") : "-";
      return { utama: [["Nomor SPPD", v(d.sppd)], ["Kategori Perjalanan", v(d.kategori)], ["Tanggal Kegiatan", tgl]], tambahan: [] };
    }
    if (flow === "pengadaan") {
      const semua = D.PENGADAAN.filter((f) => !(f.opsional && !Number(d[f.k]))).map((f) => [f.l, f.uang ? (d[f.k] ? rp(d[f.k]) : "-") : v(d[f.k])]);
      return { utama: semua.slice(0, 3), tambahan: semua.slice(3) };
    }
    return { utama: [], tambahan: [] };
  };

  D.fill = function (card, flow, d) {
    const r = D.rows(flow, d);
    card.style.display = r.utama.length ? "" : "none";
    if (!r.utama.length) return;
    const row = ([l, x]) => `<div class="info-row-inline dv-row"><span class="s5-info-label">${esc(l)}</span><strong class="s5-info-value dv-val${/^Rp\./.test(x) ? " dv-rp" : ""}">${esc(x)}</strong></div>`;
    const buka = card.dataset.open === "1";
    card.innerHTML =
      "<h4>Detail Verifikasi</h4>" +
      r.utama.map(row).join("") +
      (r.tambahan.length
        ? `<div class="dv-extra"${buka ? "" : " hidden"}>${r.tambahan.map(row).join("")}</div><button type="button" class="s5-lihat dv-toggle">${buka ? 'Sembunyikan <i class="fas fa-chevron-up"></i>' : 'Lihat informasi lengkap <i class="fas fa-chevron-down"></i>'}</button>`
        : "");
    const t = card.querySelector(".dv-toggle");
    if (t)
      t.onclick = () => {
        card.dataset.open = card.dataset.open === "1" ? "0" : "1";
        D.fill(card, flow, d);
      };
  };

  // keperluan: maksimal 3 baris, ada tombol expand bila lebih panjang
  D.clamp = function (p) {
    if (!p) return;
    p.classList.add("clamp");
    let btn = p.parentElement.querySelector(".s5-lihat");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "s5-lihat";
      p.insertAdjacentElement("afterend", btn);
    }
    const label = () => (p.classList.contains("clamp") ? 'Lihat selengkapnya <i class="fas fa-chevron-down"></i>' : 'Sembunyikan <i class="fas fa-chevron-up"></i>');
    btn.innerHTML = label();
    btn.onclick = () => {
      p.classList.toggle("clamp");
      btn.innerHTML = label();
    };
    requestAnimationFrame(() => {
      btn.style.display = p.scrollHeight > p.clientHeight + 2 || !p.classList.contains("clamp") ? "" : "none";
    });
  };

  // halaman approval / verifikasi (?id=...)
  D.mount = function () {
    const id = new URLSearchParams(location.search).get("id");
    const info = document.querySelector(".s5-info-card");
    if (!info) return;
    const doc = id && window.Store ? Store.get(id) : null;
    const p = info.querySelector(".info-desc");
    if (p && doc && doc.keperluan) p.textContent = doc.keperluan;
    D.clamp(p);
    let card = document.getElementById("s5-detail-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "s5-detail-card";
      card.className = "step3-summary-card s5-detail-card";
      info.insertAdjacentElement("afterend", card);
    }
    D.fill(card, doc ? D.flowOf(doc) : "operasional", doc && doc.detail);
  };

  // dibaca dari DOM step 3 (perjalanan dinas)
  D.bacaPerjalanan = function () {
    const q = (s) => Array.from(document.querySelectorAll(s));
    const sppd = q("#step-3-wrapper .s3-sppd-code").map((e) => e.textContent.trim()).filter(Boolean).join(", ");
    let kategori = "";
    q("#step-3-wrapper .s3-form-group").forEach((g) => {
      const l = g.querySelector(".group-title");
      if (l && /kategori perjalanan/i.test(l.textContent)) {
        const a = g.querySelector(".s3-choice-card.active .choice-title");
        if (a) kategori = a.textContent.trim();
      }
    });
    if (!kategori) kategori = (document.getElementById("selectedTransaksiTitle") || {}).textContent || "";
    const tgl = q("#step-3-wrapper .s3-jadwal-inputs input").map((i) => i.value.trim());
    return { sppd, kategori: kategori.trim(), tglDari: tgl[0] || "", tglSampai: tgl[1] || "" };
  };

  if (document.querySelector(".s5-info-card") && !document.getElementById("step-1-wrapper")) {
    const go = () => D.mount();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
    else go();
  }
})();
