// ==========================================================================
// AKSI VERIFIKASI & APPROVAL (form-verifikasi.html / form-approval.html ?id=...)
// Menyambungkan tombol Approve / Kembalikan ke Store.
//   verifikasi : Approve = Verifikasi (Store.verify), Kembalikan = Store.returnDoc
//   approval   : Approve = Store.approve, Kembalikan = Store.returnDoc,
//                dokumen Approved -> tombol "Tandai Selesai" (Store.complete)
// Muat setelah store.js dan ui.js.
// ==========================================================================
(function () {
  "use strict";
  const MODE = location.pathname.includes("form-verifikasi") ? "verifikasi" : "approval";
  const P = new URLSearchParams(location.search);
  const id = P.get("id");
  // kembali ke daftar asal (grid verifikasi / approval) bila dibuka dari sana, selain itu ke menu pencairan
  const kembali = () => {
    const r = document.referrer;
    location.href = /grid-(verifikasi|approval)\.html/.test(r) ? r : "../../index.html";
  };
  const hide = () => document.querySelectorAll(".btn-approve, .btn-kembalikan").forEach((b) => (b.style.display = "none"));

  function bisaAksi(d) {
    if (!d || P.get("mode") === "view") return false;
    if (MODE === "verifikasi") return d.status === "submitted" && !d.verified;
    return d.status === "submitted" && d.verified;
  }

  function jalankan(fn, pesan) {
    try {
      fn();
      UI.toast(pesan, "ok");
      setTimeout(kembali, 800);
    } catch (e) {
      UI.toast(e.message, "err");
    }
  }

  document.addEventListener(
    "click",
    (ev) => {
      const btn = ev.target.closest(".btn-approve, .btn-kembalikan, .btn-selesai");
      if (!btn) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const d = Store.get(id);
      if (!d) return UI.toast("Dokumen tidak ditemukan.", "err");
      if (btn.classList.contains("btn-selesai")) return jalankan(() => Store.complete(id), "Dokumen ditandai selesai (Done)");
      if (!bisaAksi(d)) return UI.toast("Dokumen ini tidak menunggu tindakan Anda.", "err");
      if (btn.classList.contains("btn-approve")) {
        (async () => {
          if (window.Viewer && !(await Viewer.cekSebelum())) return;
          jalankan(() => (MODE === "verifikasi" ? Store.verify(id) : Store.approve(id)), MODE === "verifikasi" ? "Dokumen terverifikasi" : "Dokumen disetujui");
        })();
        return;
      }
      UI.prompt("Tulis catatan perbaikan untuk pembuat.", { judul: "Kembalikan pengajuan", placeholder: "Catatan perbaikan (maks 500 karakter)", wajib: true, ya: "Kembalikan", nilai: window.Viewer ? Viewer.catatanOtomatis() : "" }).then((cat) => {
        if (cat === null) return;
        jalankan(() => Store.returnDoc(id, cat.trim()), "Pengajuan dikembalikan ke pembuat");
      });
    },
    true,
  );

  function init() {
    const d = Store.get(id);
    if (!d) return;
    if (!bisaAksi(d)) hide();
    if (MODE === "approval" && d.status === "approved" && P.get("mode") !== "view") {
      const wrap = document.querySelector(".form-footer .right-actions, .form-footer > div:last-child") || document.querySelector(".form-footer");
      if (wrap) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn-action btn-approve btn-selesai";
        b.textContent = "Tandai Selesai";
        wrap.appendChild(b);
      }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
