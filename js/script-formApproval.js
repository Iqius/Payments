const STATUS_TANPA_AKSI = ["approved", "done"];

function hideActionButtons() {
  document
    .querySelectorAll(".btn-approve, .btn-kembalikan")
    .forEach((btn) => (btn.style.display = "none"));
}

function applyApprovalActions() {
  const params = new URLSearchParams(window.location.search);

  // Dibuka dari grid: tampilan baca saja
  if (params.get("mode") === "view") {
    hideActionButtons();
    return;
  }

  const id = params.get("id");
  if (!id || typeof documentData === "undefined") return;

  const item = documentData.find((d) => d.id === id);
  if (!item) {
    console.warn("[approval] dokumen tidak ditemukan:", id);
    return;
  }

  const status = String(item.status || "").toLowerCase();
  if (STATUS_TANPA_AKSI.includes(status)) hideActionButtons();
}

document.addEventListener("DOMContentLoaded", applyApprovalActions);