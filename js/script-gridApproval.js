// ==========================================
// GRID APPROVAL - sumber data: documentData (script-dataGridPengajuan.js)
// ==========================================

// Pemetaan filter "Status" -> status pada data.
// disetujui      : status approved / done
// belumDisetujui : semua status selain itu
const STATUS_DISETUJUI = ["approved", "done"];

// ---------- Helper ----------
function formatRupiah(val) {
  if (val === null || val === undefined || isNaN(val)) return "Rp. 0,00";
  return "Rp. " + new Intl.NumberFormat("id-ID").format(val) + ",00";
}

function truncateText(text, maxLength = 36) {
  if (!text) return "-";
  return text.length <= maxLength ? text : text.substring(0, maxLength) + "...";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- State ----------
let docCurrentPage = 1;
let docPageSize = 5;

// ---------- Filter ----------
function getFilteredData() {
  if (typeof documentData === "undefined" || !Array.isArray(documentData)) {
    console.error("Data 'documentData' tidak ditemukan atau bukan array.");
    return [];
  }

  const keyword = (document.getElementById("search-input")?.value || "")
    .toLowerCase()
    .trim();
  const selectedStatus = document.getElementById("filter-status")?.value || "all";
  const startDate = document.getElementById("start-date")?.value || "";
  const endDate = document.getElementById("end-date")?.value || "";

  return documentData.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    const disetujui = STATUS_DISETUJUI.includes(status);

    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "disetujui" && disetujui) ||
      (selectedStatus === "belumDisetujui" && !disetujui);

    const matchSearch = [
      item.id,
      item.kantor,
      item.metode,
      item.jenis,
      item.keperluan,
      item.pengaju,
    ].some((field) =>
      String(field || "")
        .toLowerCase()
        .includes(keyword),
    );

    let matchDate = true;
    if (item.tanggalRaw) {
      if (startDate && item.tanggalRaw < startDate) matchDate = false;
      if (endDate && item.tanggalRaw > endDate) matchDate = false;
    }

    return matchStatus && matchSearch && matchDate;
  });
}

// ---------- Render satu baris (8 kolom) ----------
function buildRowHtml(item) {
  const idDok = escapeHtml(item.id || "-");
  const keperluan = item.keperluan || "-";

  const statusClass = escapeHtml((item.status || "draft").toLowerCase().trim());
  const statusText = escapeHtml(item.statusText || item.status || "Draft");
  const statusLower = statusText.toLowerCase().trim();

  // Hanya Submitted yang ID dokumennya berupa link ke halaman verifikasi
  const isSubmitted = statusLower === "submitted" || statusClass === "submitted";

  const linkStyle =
    'style="cursor: pointer; font-weight: bold; text-decoration: underline; color: #1e60aa;"';

  const docLinkHtml = isSubmitted
    ? `<a href="../pages/form-verifikasi.html?id=${encodeURIComponent(item.id || "")}"
          class="doc-link" ${linkStyle}>${idDok}</a>`
    : `<span class="link-col">${idDok}</span>`;

  return `
    <tr data-status="${statusClass}" data-id="${idDok}">
      <td>${docLinkHtml}</td>
      <td><span class="link-col">${escapeHtml(item.kantor || "-")}</span></td>
      <td><span class="link-col">${escapeHtml(item.metode || "-")}</span></td>
      <td><span class="link-col">${escapeHtml(item.jenis || "-")}</span></td>
      <td><span class="link-col">${formatRupiah(item.nominal)}</span></td>
      <td title="${escapeHtml(keperluan)}">
        <span class="link-col">${escapeHtml(truncateText(keperluan, 60))}</span>
      </td>
      <td>${escapeHtml(item.tanggal || "-")}</td>
      <td><span class="link-col">${escapeHtml(item.pengaju || "-")}</span></td>
    </tr>
  `;
}

// ---------- Render tabel (filter + pagination) ----------
function renderTable() {
  const tableBody = document.getElementById("table-body");
  const totalItemsEl = document.getElementById("total-doc-items");
  const pageSizeSelect = document.getElementById("page-size-select");
  const currentPageEl = document.getElementById("current-page-num");
  const totalPagesEl = document.getElementById("total-pages-text");

  if (pageSizeSelect) {
    docPageSize = parseInt(pageSizeSelect.value, 10) || 5;
  }

  const filtered = getFilteredData();
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / docPageSize) || 1;
  docCurrentPage = Math.min(Math.max(docCurrentPage, 1), totalPages);

  if (totalItemsEl) totalItemsEl.innerText = totalItems;
  if (currentPageEl) currentPageEl.innerText = docCurrentPage;
  if (totalPagesEl) totalPagesEl.innerText = `of ${totalPages}`;

  if (!tableBody) return;

  if (totalItems === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 24px; color: #94a3b8;">
          Tidak ada data dokumen.
        </td>
      </tr>
    `;
    return;
  }

  const startIndex = (docCurrentPage - 1) * docPageSize;
  tableBody.innerHTML = filtered
    .slice(startIndex, startIndex + docPageSize)
    .map(buildRowHtml)
    .join("");
}

function goToPage(page) {
  const totalPages = Math.ceil(getFilteredData().length / docPageSize) || 1;
  const target = Math.min(Math.max(page, 1), totalPages);
  if (target === docCurrentPage) return;
  docCurrentPage = target;
  renderTable();
}

function applyFilters() {
  docCurrentPage = 1;
  renderTable();
}

// ---------- Inisialisasi ----------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search-input")?.addEventListener("input", applyFilters);
  document.getElementById("filter-status")?.addEventListener("change", applyFilters);
  document.getElementById("start-date")?.addEventListener("change", applyFilters);
  document.getElementById("end-date")?.addEventListener("change", applyFilters);
  document.getElementById("page-size-select")?.addEventListener("change", applyFilters);

  document.getElementById("btn-first-page")?.addEventListener("click", () => goToPage(1));
  document
    .getElementById("btn-prev-page")
    ?.addEventListener("click", () => goToPage(docCurrentPage - 1));
  document
    .getElementById("btn-next-page")
    ?.addEventListener("click", () => goToPage(docCurrentPage + 1));
  document
    .getElementById("btn-last-page")
    ?.addEventListener("click", () => goToPage(Infinity));

  renderTable();
});