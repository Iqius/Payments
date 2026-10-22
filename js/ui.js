// ==========================================================================
// UI helper bersama (SweetAlert2, file lokal js/lib/sweetalert2.all.min.js)
//   UI.toast(msg, 'ok'|'err')      notifikasi kecil
//   UI.alert(msg, judul?)          pesan
//   UI.confirm(msg, opsi?)         -> Promise<boolean>
//   UI.prompt(msg, opsi?)          -> Promise<string|null>
// window.alert juga dialihkan ke SweetAlert agar semua pesan seragam.
// ==========================================================================
window.UI = (function () {
  const ada = () => typeof Swal !== "undefined";
  const warna = { confirmButtonColor: "#1f6fa8", cancelButtonColor: "#94a3b8" };
  const T = () =>
    Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 2800, timerProgressBar: true, customClass: { popup: "swal-toast-app" } });

  function toast(msg, type) {
    if (!ada()) return console.log("[toast]", msg);
    T().fire({ icon: type === "err" ? "error" : type === "info" ? "info" : "success", title: msg });
  }
  function alertBox(msg, judul, icon) {
    if (!ada()) return Promise.resolve(window.__nativeAlert ? window.__nativeAlert(msg) : null);
    return Swal.fire(Object.assign({ icon: icon || "info", title: judul || undefined, text: String(msg), confirmButtonText: "OK" }, warna));
  }
  async function confirmBox(msg, o) {
    o = o || {};
    if (!ada()) return window.confirm(msg);
    const r = await Swal.fire(
      Object.assign(
        { icon: o.danger ? "warning" : "question", title: o.judul || "Konfirmasi", text: msg, showCancelButton: true, confirmButtonText: o.ya || "Ya", cancelButtonText: o.tidak || "Batal", reverseButtons: true, focusCancel: !!o.danger },
        warna,
        o.danger ? { confirmButtonColor: "#d93025" } : {},
      ),
    );
    return r.isConfirmed;
  }
  async function promptBox(msg, o) {
    o = o || {};
    if (!ada()) return window.prompt(msg, "");
    const r = await Swal.fire(
      Object.assign(
        {
          title: o.judul || msg,
          text: o.judul ? msg : undefined,
          input: "textarea",
          inputPlaceholder: o.placeholder || "",
          inputValue: o.nilai || "",
          inputAttributes: { maxlength: o.maxlength || 500 },
          showCancelButton: true,
          confirmButtonText: o.ya || "Kirim",
          cancelButtonText: "Batal",
          reverseButtons: true,
          inputValidator: o.wajib ? (v) => (!String(v || "").trim() ? "Wajib diisi." : undefined) : undefined,
        },
        warna,
      ),
    );
    return r.isConfirmed ? String(r.value || "") : null;
  }
  // semua alert() bawaan -> SweetAlert
  window.__nativeAlert = window.alert.bind(window);
  window.alert = (m) => {
    alertBox(m, "Perhatian", /berhasil/i.test(m) ? "success" : "warning");
  };
  return { toast, alert: alertBox, confirm: confirmBox, prompt: promptBox };
})();
