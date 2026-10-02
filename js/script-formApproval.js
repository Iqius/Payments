// ==========================================================================
// FORM APPROVAL (pages/approval/form-approval.html?id=...)
// Tombol Approve & Kembalikan hanya tampil untuk dokumen yang masih menunggu
// persetujuan (submitted). Dokumen approved / done tidak punya aksi.
// Sumber data: documentData (script-dataGridPengajuan.js)
// ==========================================================================

// Status yang tidak menampilkan tombol aksi
const STATUS_TANPA_AKSI = ["approved", "done"];

function hideActionButtons() {
  document
    .querySelectorAll(".btn-approve, .btn-kembalikan")
    .forEach((btn) => (btn.style.display = "none"));
}

function applyApprovalActions() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id || typeof documentData === "undefined") return;

  const item = documentData.find((d) => d.id === id);
  if (!item) {
    console.warn("[approval] dokumen tidak ditemukan:", id);
    return;
  }

  const status = String(item.status || "").toLowerCase();
  console.log("[approval] id:", id, "status:", status);

  if (STATUS_TANPA_AKSI.includes(status)) hideActionButtons();
}

document.addEventListener("DOMContentLoaded", applyApprovalActions);