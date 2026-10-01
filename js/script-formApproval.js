const STATUS_TANPA_AKSI = ["approved", "done"];

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

  if (STATUS_TANPA_AKSI.includes(status)) {
    document
      .querySelectorAll(".btn-approve, .btn-kembalikan")
      .forEach((btn) => (btn.style.display = "none"));
  }
}

document.addEventListener("DOMContentLoaded", applyApprovalActions);