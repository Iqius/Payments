// ==========================================================================
// GRID APPROVAL (pages/approval/grid-approval.html)
// Sumber data : documentData (script-dataGridPengajuan.js)
// Isi file    : konfigurasi -> helper -> filter -> render -> event
// ==========================================================================

// ---------- Konfigurasi ----------
// Isi dropdown "Status" -> daftar status pada data
const STATUS_GROUPS = {
  disetujui: ["approved", "done"],
  belumDisetujui: ["submitted"],
};

// Path relatif terhadap halaman ini (satu folder dengan form-approval.html)
const URL_FORM_APPROVAL = "form-approval.html";

const DEFAULT_PAGE_SIZE = 5;
const TOTAL_COLUMNS = 8;

// ---------- State ----------
let docCurrentPage = 1;
let docPageSize = DEFAULT_PAGE_SIZE;

// ==========================================================================
// HELPER
// ==========================================================================
const byId = (id) => document.getElementById(id);

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

// ==========================================================================
// FILTER (status + pencarian + rentang tanggal)
// ==========================================================================
function getFilteredData() {
  if (typeof documentData === "undefined" || !Array.isArray(documentData)) {
    console.error("Data 'documentData' tidak ditemukan atau bukan array.");
    return [];
  }

  const keyword = (byId("search-input")?.value || "").toLowerCase().trim();
  const selectedStatus = byId("filter-status")?.value || "all";
  const startDate = byId("start-date")?.value || "";
  const endDate = byId("end-date")?.value || "";

  return documentData.filter((item) => {
    const status = String(item.status || "").toLowerCase();

    // Hanya status yang terdaftar di STATUS_GROUPS yang ditampilkan
    const matchStatus = Boolean(STATUS_GROUPS[selectedStatus]?.includes(status));

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

// ==========================================================================
// RENDER BARIS (8 kolom)
// ==========================================================================
const LINK_STYLE =
  'style="cursor: pointer; font-weight: bold; text-decoration: underline; color: #1e60aa;"';

function buildRowHtml(item) {
  const idDok = escapeHtml(item.id || "-");
  const keperluan = item.keperluan || "-";
  const statusClass = escapeHtml((item.status || "draft").toLowerCase().trim());

  // Semua dokumen di grid ini dibuka di halaman approval;
  // tombol Approve/Kembalikan diatur di script-formApproval.js sesuai status.
  const docLinkHtml = `<a href="${URL_FORM_APPROVAL}?id=${encodeURIComponent(item.id || "")}"
                          class="doc-link" ${LINK_STYLE}>${idDok}</a>`;

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
      <td><span class="link-col">${escapeHtml(item.penyetuju || "-")}</span></td>
    </tr>
  `;
}

// ==========================================================================
// RENDER TABEL (filter -> pagination -> baris)
// ==========================================================================
function renderTable() {
  const tableBody = byId("table-body");
  const pageSizeSelect = byId("page-size-select");

  // 1. Ukuran halaman dari dropdown
  if (pageSizeSelect) {
    docPageSize = parseInt(pageSizeSelect.value, 10) || DEFAULT_PAGE_SIZE;
  }

  // 2. Data hasil filter + jumlah halaman
  const filtered = getFilteredData();
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / docPageSize) || 1;
  docCurrentPage = Math.min(Math.max(docCurrentPage, 1), totalPages);

  // 3. Info pagination
  if (byId("total-doc-items")) byId("total-doc-items").innerText = totalItems;
  if (byId("current-page-num")) byId("current-page-num").innerText = docCurrentPage;
  if (byId("total-pages-text")) byId("total-pages-text").innerText = `of ${totalPages}`;

  if (!tableBody) return;

  // 4. Data kosong
  if (totalItems === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="${TOTAL_COLUMNS}" style="text-align: center; padding: 24px; color: #94a3b8;">
          Tidak ada data dokumen.
        </td>
      </tr>
    `;
    return;
  }

  // 5. Potong sesuai halaman, lalu render
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

// Filter berubah -> kembali ke halaman 1
function applyFilters() {
  docCurrentPage = 1;
  renderTable();
}

// ==========================================================================
// EVENT
// ==========================================================================
function bindFilters() {
  byId("search-input")?.addEventListener("input", applyFilters);
  byId("filter-status")?.addEventListener("change", applyFilters);
  byId("start-date")?.addEventListener("change", applyFilters);
  byId("end-date")?.addEventListener("change", applyFilters);
}

function bindPagination() {
  byId("page-size-select")?.addEventListener("change", applyFilters);
  byId("btn-first-page")?.addEventListener("click", () => goToPage(1));
  byId("btn-prev-page")?.addEventListener("click", () => goToPage(docCurrentPage - 1));
  byId("btn-next-page")?.addEventListener("click", () => goToPage(docCurrentPage + 1));
  byId("btn-last-page")?.addEventListener("click", () => goToPage(Infinity));
}

document.addEventListener("DOMContentLoaded", () => {
  bindFilters();
  bindPagination();
  renderTable();
});