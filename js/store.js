// ==========================================================================
// STORE - lapisan data lokal (CRUD) untuk seluruh halaman
// Penyimpanan : localStorage (dokumen, anggaran terpakai) + IndexedDB (file upload)
// Muat SETELAH script-dataGridPengajuan.js (dipakai sebagai data awal / seed)
// dan SETELAH script-dataForm.js (anggaranData, untuk saldo anggaran).
//
// API (semua sinkron kecuali File.*):
//   Store.list()            -> semua dokumen
//   Store.get(id)           -> satu dokumen
//   Store.save(doc)         -> Create / Update (simpan apa adanya, mis. Simpan Draf)
//   Store.submit(doc)       -> simpan + terapkan aturan status & anggaran
//   Store.verify(id) / Store.approve(id) / Store.returnDoc(id, catatan)
//   Store.remove([ids])     -> Delete (hanya Draft)
//   Store.reset()           -> kembalikan ke data awal
//   Store.File.put/get/remove/removeDoc  (async, IndexedDB)
// Pindah ke backend nanti: ganti isi fungsi-fungsi ini dengan fetch ke API.
// ==========================================================================
(function () {
  "use strict";

  const CFG = (window.APP_CONFIG = Object.assign(
    {
      validasiDokumenWajib: true, // Submit ditolak bila dokumen wajib belum lengkap
      pengaju: { nama: "Satria Arindra", subUnit: "Asisten Deputi Bidang Treasury", kantor: "33A" },
      verifikator: "Aprillia Wahyuningtyas, A.Md.",
      penyetuju: "Aldi Suadana",
    },
    window.APP_CONFIG || {},
  ));

  const K_DOCS = "pencairan.docs.v1";
  const K_USE = "pencairan.anggaranDipakai.v1";
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // ---------- penyimpanan dengan fallback memori ----------
  const mem = {};
  const ls = {
    get(k) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? mem[k] ?? null : v;
      } catch (e) {
        return mem[k] ?? null;
      }
    },
    set(k, v) {
      mem[k] = v;
      try {
        localStorage.setItem(k, v);
      } catch (e) {
        /* kuota penuh / diblokir: tetap di memori */
      }
    },
  };
  const readJson = (k, d) => {
    try {
      const v = ls.get(k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return d;
    }
  };

  // ---------- helper ----------
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, "0");
  const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const fmtTgl = (iso) => {
    if (!iso) return "";
    const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    return y ? `${pad(d)} ${BULAN[m - 1]} ${y}` : "";
  };
  const fmtTglPanjang = (iso) => {
    if (!iso) return "";
    const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    return y ? `${d} ${BULAN_PANJANG[m - 1]} ${y}` : "";
  };
  const stampNow = () => {
    const d = new Date();
    return `${pad(d.getDate())} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const newId = () => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(2);
    let rand = "";
    for (let i = 0; i < 8; i++) rand += Math.floor(Math.random() * 10);
    return yy + pad(d.getMonth() + 1) + pad(d.getDate()) + rand;
  };
  const STATUS_TEXT = { draft: "Draft", submitted: "Submitted", approved: "Approved", revise: "Revise", unrealized: "Unrealized", realized: "Realized", done: "Done" };
  const skemaDari = (metode) => {
    const m = String(metode || "").toLowerCase();
    return m.includes("pertanggungjawaban") ? "pertanggungjawaban" : m.includes("persekot") ? "persekot" : "pembayaran";
  };
  const METODE = { pembayaran: "Reimburse / Klaim Langsung", persekot: "Persekot Kerja", pertanggungjawaban: "Pertanggungjawaban Persekot Kerja" };
  const TAB_DARI_FLOW = { operasional: "operasional", perjalanan_dinas: "perjalanan-dinas", pengadaan: "pengadaan", remunerasi: "remunerasi", pelatihan: "pelatihan" };

  class StoreError extends Error {}
  const fail = (m) => {
    throw new StoreError(m);
  };

  // ==========================================================================
  // SEED (dari documentData statis)
  // ==========================================================================
  function normSeed(d) {
    const status = String(d.status || "draft").toLowerCase().trim();
    const skema = skemaDari(d.metode);
    const iso = d.tanggalRaw || "";
    const doc = {
      id: String(d.id),
      flow: "operasional",
      tab: "operasional",
      jenis: d.jenis || "Operasional Umum",
      skema,
      metode: METODE[skema],
      status,
      statusText: STATUS_TEXT[status] || d.statusText || status,
      statusDate: d.statusDate || null,
      tanggal: d.tanggal || fmtTgl(iso),
      tanggalRaw: iso,
      kantor: d.kantor || CFG.pengaju.kantor,
      idAnggaran: d.idAnggaran || "",
      anggaran: d.anggaran || "",
      keperluan: d.keperluan || "",
      nominal: Number(d.nominal) || 0,
      pph: 0,
      verifikator: d.verifikator || CFG.verifikator,
      penyetuju: d.penyetuju || null,
      pengaju: String(d.pengaju || CFG.pengaju.nama).replace(/\.$/, ""),
      verified: !!d.verified || ["approved", "done", "unrealized", "realized"].includes(status),
      kepemilikan: "unit",
      unitSentral: null,
      tanggalKegiatan: "",
      nilaiPersekot: skema === "persekot" ? Number(d.nominal) || 0 : 0,
      refId: d.refId || null,
      pjId: d.pjId || null,
      rincian: [],
      dokumen: [],
      anggaranDipakai: 0,
      catatanRevisi: "",
      activity: [],
      seed: true,
    };
    doc.activity.push({ stamp: doc.tanggal, text: "Pengajuan dibuat", by: "Sistem", role: "", kind: "grey" });
    if (status !== "draft") doc.activity.push({ stamp: doc.tanggal, text: "Pengajuan dikirim oleh pembuat", by: doc.pengaju, role: "Pembuat", kind: "green" });
    if (doc.verified && skema !== "persekot") doc.activity.push({ stamp: doc.tanggal, text: "Diverifikasi oleh Verifikator Keuangan", by: doc.verifikator, role: "Verifikator", kind: "green" });
    if (["approved", "done"].includes(status)) doc.activity.push({ stamp: doc.tanggal, text: "Disetujui", by: doc.penyetuju || CFG.penyetuju, role: "Penyetuju", kind: "green" });
    if (status === "revise") {
      doc.catatanRevisi = "Dokumen pendukung belum sesuai dengan kegiatan yang diajukan. Mohon perbarui kuitansi dan rincian biaya.";
      doc.activity.push({ stamp: doc.tanggal, text: "Pengajuan dikembalikan ke pembuat", by: "Budi Santoso", role: "Deputi Unit Kerja", kind: "orange", note: doc.catatanRevisi });
    }
    return doc;
  }

  // salinan data awal diambil sekali, sebelum documentData disinkronkan dengan isi Store
  const SEED_SRC = typeof documentData !== "undefined" && Array.isArray(documentData) ? JSON.parse(JSON.stringify(documentData)) : [];
  function buildSeed() {
    const docs = SEED_SRC.map(normSeed);
    // hubungkan pertanggungjawaban yang belum punya refId ke persekot Unrealized
    docs.forEach((pj) => {
      if (pj.skema !== "pertanggungjawaban" || pj.refId) return;
      const pk = docs.find((x) => x.skema === "persekot" && x.status === "unrealized" && !x.pjId);
      if (pk) {
        pj.refId = pk.id;
        pk.pjId = pj.id;
        pk.status = "realized";
        pk.statusText = "Realized";
        pj.nilaiPersekot = pk.nilaiPersekot;
      }
    });
    return docs;
  }

  let docs = readJson(K_DOCS, null);
  let use = readJson(K_USE, {});
  if (!Array.isArray(docs) || !docs.length) {
    docs = buildSeed();
    use = {};
    persist();
  }
  function persist() {
    ls.set(K_DOCS, JSON.stringify(docs));
    ls.set(K_USE, JSON.stringify(use));
    syncLegacy();
  }

  // Halaman lama membaca array global documentData: isi diganti di tempat agar selalu mutakhir
  function syncLegacy() {
    if (typeof documentData !== "undefined" && Array.isArray(documentData)) {
      documentData.length = 0;
      docs.forEach((d) => documentData.push(d));
    }
  }

  // ==========================================================================
  // ANGGARAN
  // ==========================================================================
  const anggaranAsli = (id) => {
    const a = typeof anggaranData !== "undefined" ? anggaranData.find((x) => x.idAnggaran === id) : null;
    return a ? a.saldo : 0;
  };
  // simpan saldo awal supaya tidak berubah saat anggaranData dimodifikasi
  const saldoAwal = {};
  if (typeof anggaranData !== "undefined") anggaranData.forEach((a) => (saldoAwal[a.idAnggaran] = a.saldo));
  const saldoDasar = (id) => (id in saldoAwal ? saldoAwal[id] : anggaranAsli(id));
  const saldo = (id) => saldoDasar(id) - (use[id] || 0);
  function pakai(id, delta) {
    if (!id || !delta) return;
    use[id] = (use[id] || 0) + delta;
    applySaldoToData();
  }
  function applySaldoToData() {
    if (typeof anggaranData === "undefined") return;
    anggaranData.forEach((a) => (a.saldo = saldoDasar(a.idAnggaran) - (use[a.idAnggaran] || 0)));
  }
  applySaldoToData();

  // ==========================================================================
  // HITUNG TOTAL dari rincian (client number tidak dipercaya)
  // ==========================================================================
  const adaObj = (x) => x && typeof x === "object";
  function hitungRincian(rincian) {
    let total = 0;
    let pph = 0;
    (rincian || []).forEach((r) => {
      total += Number(r.total) || 0;
      pph += Number(r.pph) || 0;
    });
    return { total, pph };
  }

  // ==========================================================================
  // CRUD
  // ==========================================================================
  const idx = (id) => docs.findIndex((d) => d.id === id);
  const get = (id) => docs.find((d) => d.id === id) || null;
  const list = () => docs;

  function logAct(doc, text, kind, extra) {
    doc.activity = doc.activity || [];
    doc.activity.push(Object.assign({ stamp: stampNow(), text, by: CFG.pengaju.nama, role: "Pembuat", kind: kind || "green" }, extra || {}));
  }

  // Create / Update tanpa mengubah alur (dipakai Simpan Draf)
  function save(input) {
    const doc = clone(input);
    const skema = doc.skema || "pembayaran";
    const old = get(doc.id);
    if (old && !["draft", "revise"].includes(old.status)) fail("Hanya dokumen Draft atau Revise yang bisa diubah.");
    const t = hitungRincian(doc.rincian);
    Object.assign(doc, {
      skema,
      metode: METODE[skema],
      tab: TAB_DARI_FLOW[doc.flow] || "operasional",
      status: old ? old.status : "draft",
      statusText: STATUS_TEXT[old ? old.status : "draft"],
      nominal: skema === "persekot" ? Number(doc.nilaiPersekot) || t.total : t.total,
      pph: t.pph,
      kantor: doc.kantor || CFG.pengaju.kantor,
      pengaju: doc.pengaju || CFG.pengaju.nama,
      verifikator: doc.verifikator || CFG.verifikator,
      verified: false,
      penyetuju: null,
      tanggal: old ? old.tanggal : fmtTgl(todayIso()),
      tanggalRaw: old ? old.tanggalRaw : todayIso(),
      statusDate: old ? old.statusDate : null,
      anggaranDipakai: old ? old.anggaranDipakai || 0 : 0,
      catatanRevisi: old ? old.catatanRevisi || "" : "",
      activity: old ? old.activity : [],
      jenis: doc.jenis || ({ perjalanan_dinas: "Perjalanan Dinas", pengadaan: "Pengadaan" }[doc.flow] || "Operasional Umum"),
    });
    if (!old) logAct(doc, "Pengajuan dibuat", "grey", { by: "Sistem", role: "" });
    else if (old.status === "revise") doc.statusDate = old.statusDate;
    if (old) docs[idx(doc.id)] = doc;
    else docs.unshift(doc);
    persist();
    return doc;
  }

  // Submit: simpan + aturan status dan anggaran
  function submit(input) {
    const doc = clone(input);
    const skema = doc.skema || "pembayaran";
    if (!doc.idAnggaran) fail("Pilih anggaran kegiatan terlebih dahulu.");
    if (!String(doc.keperluan || "").trim()) fail("Keperluan pencairan belum diisi.");
    if (!doc.rincian || !doc.rincian.length) fail("Rincian biaya belum diisi.");
    const t = hitungRincian(doc.rincian);
    if (t.total <= 0) fail("Total rincian biaya harus lebih dari 0.");

    const old = get(doc.id);
    if (old && !["draft", "revise"].includes(old.status)) fail("Dokumen ini sudah diajukan.");
    const wasRevise = !!old && old.status === "revise";
    if (old && old.anggaranDipakai) {
      pakai(old.idAnggaran, -old.anggaranDipakai); // batalkan efek lama sebelum dihitung ulang
      old.anggaranDipakai = 0;
    }

    const cekSaldo = (n) => {
      if (n > saldo(doc.idAnggaran)) fail("Saldo anggaran tidak mencukupi.");
    };
    let efek = 0;
    let status = "submitted";
    let ref = null;

    if (skema === "persekot") {
      const nilai = Number(doc.nilaiPersekot) || 0;
      if (nilai <= 0) fail("Nilai persekot harus lebih dari 0.");
      if (!doc.tanggalKegiatan) fail("Tanggal kegiatan persekot belum diisi.");
      if (Math.round(t.total) !== Math.round(nilai)) fail("Jumlah rincian harus sama dengan nilai persekot kerja.");
      cekSaldo(nilai);
      efek = nilai;
      status = "unrealized";
    } else if (skema === "pertanggungjawaban") {
      ref = get(doc.refId);
      const milik = ref && ref.status === "realized" && ref.pjId === doc.id;
      if (!ref || (ref.status !== "unrealized" && !milik)) fail("Persekot ini tidak dalam status Unrealized.");
      const nilaiPk = ref.nilaiPersekot || ref.nominal || 0;
      efek = t.total - nilaiPk; // sama: tetap, lebih kecil: kembali, lebih besar: tambahan
      if (efek > 0) cekSaldo(efek);
      doc.nilaiPersekot = nilaiPk;
    } else {
      cekSaldo(t.total);
      efek = t.total;
    }

    const hasil = Object.assign(doc, {
      skema,
      metode: METODE[skema],
      tab: TAB_DARI_FLOW[doc.flow] || "operasional",
      status,
      statusText: STATUS_TEXT[status],
      nominal: skema === "persekot" ? Number(doc.nilaiPersekot) : t.total,
      pph: t.pph,
      kantor: doc.kantor || CFG.pengaju.kantor,
      pengaju: doc.pengaju || CFG.pengaju.nama,
      verifikator: doc.verifikator || CFG.verifikator,
      verified: status === "unrealized",
      penyetuju: null,
      tanggal: old ? old.tanggal : fmtTgl(todayIso()),
      tanggalRaw: old ? old.tanggalRaw : todayIso(),
      statusDate: fmtTgl(todayIso()),
      anggaranDipakai: efek,
      catatanRevisi: "",
      activity: old ? old.activity : [],
      jenis: doc.jenis || ({ perjalanan_dinas: "Perjalanan Dinas", pengadaan: "Pengadaan" }[doc.flow] || "Operasional Umum"),
    });
    pakai(hasil.idAnggaran, efek);
    if (!old) logAct(hasil, "Pengajuan dibuat", "grey", { by: "Sistem", role: "" });
    logAct(hasil, wasRevise ? "Pembuat mengajukan ulang setelah revisi" : "Pengajuan dikirim oleh pembuat", "green");
    if (status === "unrealized") logAct(hasil, "Persekot kerja langsung berstatus Unrealized (tanpa verifikasi)", "blue");
    if (ref) {
      ref.status = "realized";
      ref.statusText = "Realized";
      ref.statusDate = fmtTgl(todayIso());
      ref.pjId = hasil.id;
      logAct(ref, "Pertanggungjawaban diajukan, status menjadi Realized", "green");
    }
    if (old) docs[idx(hasil.id)] = hasil;
    else docs.unshift(hasil);
    persist();
    return hasil;
  }

  function verify(id) {
    const d = get(id);
    if (!d || d.status !== "submitted" || d.verified) fail("Dokumen tidak menunggu verifikasi.");
    d.verified = true;
    d.statusDate = fmtTgl(todayIso());
    logAct(d, "Diverifikasi oleh Verifikator Keuangan", "green", { by: d.verifikator, role: "Verifikator" });
    persist();
    return d;
  }
  function approve(id) {
    const d = get(id);
    if (!d || d.status !== "submitted" || !d.verified) fail("Dokumen belum terverifikasi atau sudah diproses.");
    d.status = "approved";
    d.statusText = "Approved";
    d.penyetuju = CFG.penyetuju;
    d.statusDate = fmtTgl(todayIso());
    logAct(d, "Disetujui", "green", { by: CFG.penyetuju, role: "Penyetuju" });
    persist();
    return d;
  }
  function returnDoc(id, catatan) {
    const d = get(id);
    if (!d || d.status !== "submitted") fail("Hanya dokumen Submitted yang bisa dikembalikan.");
    if (d.anggaranDipakai) {
      pakai(d.idAnggaran, -d.anggaranDipakai);
      d.anggaranDipakai = 0;
    }
    d.returnedAt = d.verified ? "approval" : "verifikasi";
    d.status = "revise";
    d.statusText = "Revise";
    d.verified = false;
    d.statusDate = fmtTgl(todayIso());
    d.catatanRevisi = String(catatan || "").slice(0, 500);
    logAct(d, "Pengajuan dikembalikan ke pembuat", "orange", { by: d.returnedAt === "approval" ? CFG.penyetuju : d.verifikator, role: d.returnedAt === "approval" ? "Penyetuju" : "Verifikator", note: d.catatanRevisi });
    // persekot tetap Realized selama pertanggungjawabannya direvisi (pjId tetap)
    persist();
    return d;
  }
  function complete(id) {
    const d = get(id);
    if (!d || d.status !== "approved") fail("Hanya dokumen Approved yang bisa ditandai selesai.");
    d.status = "done";
    d.statusText = "Done";
    d.statusDate = fmtTgl(todayIso());
    logAct(d, "Pembayaran selesai diproses", "green", { by: "Sistem", role: "" });
    persist();
    return d;
  }
  // ubah sebagian field dokumen (catatan verifikasi, metode bayar, kode buku, dst.)
  function patch(id, fields) {
    const d = get(id);
    if (!d) fail("Dokumen tidak ditemukan.");
    Object.assign(d, clone(fields));
    persist();
    return d;
  }
  function remove(ids) {
    const set = new Set([].concat(ids));
    const blok = docs.filter((d) => set.has(d.id) && d.status !== "draft");
    if (blok.length) fail("Hanya dokumen Draft yang bisa dihapus.");
    const hapus = docs.filter((d) => set.has(d.id));
    docs = docs.filter((d) => !set.has(d.id));
    persist();
    hapus.forEach((d) => File.removeDoc(d.id));
    return hapus.length;
  }
  function reset() {
    docs = buildSeed();
    use = {};
    applySaldoToData();
    persist();
    File.clearAll();
  }

  // ==========================================================================
  // FILE (IndexedDB) - blob dokumen pendukung
  // ==========================================================================
  const File = (() => {
    let dbp = null;
    const open = () =>
      dbp ||
      (dbp = new Promise((res, rej) => {
        try {
          const rq = indexedDB.open("pencairan-files", 1);
          rq.onupgradeneeded = () => rq.result.createObjectStore("f");
          rq.onsuccess = () => res(rq.result);
          rq.onerror = () => rej(rq.error);
        } catch (e) {
          rej(e);
        }
      }));
    const tx = (mode, fn) =>
      open().then(
        (db) =>
          new Promise((res, rej) => {
            const t = db.transaction("f", mode);
            const r = fn(t.objectStore("f"));
            t.oncomplete = () => res(r && "result" in r ? r.result : undefined);
            t.onerror = () => rej(t.error);
          }),
      );
    const memBlobs = {}; // cadangan bila IndexedDB tidak tersedia
    return {
      put: (key, blob) => {
        memBlobs[key] = blob;
        return tx("readwrite", (s) => s.put(blob, key)).catch(() => {});
      },
      get: (key) => tx("readonly", (s) => s.get(key)).then((b) => b || memBlobs[key] || null, () => memBlobs[key] || null),
      remove: (key) => {
        delete memBlobs[key];
        return tx("readwrite", (s) => s.delete(key)).catch(() => {});
      },
      removeDoc: (docId) =>
        open()
          .then(
            (db) =>
              new Promise((res) => {
                const t = db.transaction("f", "readwrite");
                const s = t.objectStore("f");
                const rq = s.openCursor();
                rq.onsuccess = () => {
                  const c = rq.result;
                  if (c) {
                    if (String(c.key).startsWith(docId + ":")) c.delete();
                    c.continue();
                  }
                };
                t.oncomplete = () => res();
                t.onerror = () => res();
              }),
          )
          .catch(() => {}),
      clearAll: () => tx("readwrite", (s) => s.clear()).catch(() => {}),
    };
  })();

  // ==========================================================================
  // JENIS DOKUMEN PENDUKUNG (dipakai step Dokumen & Review)
  // ==========================================================================
  const JENIS_DOKUMEN = [
    { key: "kuitansi", nama: "Kuitansi / Invoice" },
    { key: "perpajakan", nama: "Dokumen Perpajakan" },
    { key: "ba", nama: "B.A. Penyelesaian Pekerjaan" },
    { key: "laporan", nama: "Laporan Kegiatan" },
    { key: "surat", nama: "Surat Tugas / Permohonan" },
    { key: "bukutab", nama: "Buku Tabungan / Rekening Koran" },
    { key: "lainnya", nama: "Dokumen Lainnya" },
  ];
  const WAJIB = {
    pembayaran: ["kuitansi", "perpajakan", "ba", "laporan"],
    persekot: ["surat"],
    pertanggungjawaban: ["kuitansi", "laporan"],
  };

  window.Store = {
    config: CFG,
    list,
    get,
    save,
    submit,
    verify,
    approve,
    returnDoc,
    complete,
    patch,
    remove,
    reset,
    newId,
    saldo,
    File,
    JENIS_DOKUMEN,
    WAJIB,
    METODE,
    STATUS_TEXT,
    util: { todayIso, fmtTgl, fmtTglPanjang, stampNow, clone, skemaDari },
    StoreError,
  };
  syncLegacy();
})();
