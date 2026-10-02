// ==========================================================================
// GRID PENGAJUAN (index.html)
// Sumber data : documentData (script-dataGridPengajuan.js)
// Isi file    : konfigurasi -> helper -> filter -> render -> event
// ==========================================================================

// ---------- Konfigurasi ----------
// Path relatif terhadap index.html (root)
const URL_FORM_OPERASIONAL = "pages/pencairan/form-operasional.html";
const URL_FORM_VERIFIKASI = "pages/verifikasi/form-verifikasi.html";

const DEFAULT_PAGE_SIZE = 20;
const TOTAL_COLUMNS = 11;

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
  const selectedStatus = (byId("filter-status")?.value || "all").toLowerCase();
  const startDate = byId("start-date")?.value || "";
  const endDate = byId("end-date")?.value || "";

  return documentData.filter((item) => {
    const matchStatus =
      selectedStatus === "all" ||
      String(item.status || "").toLowerCase() === selectedStatus;

    const matchSearch = [
      item.id,
      item.keperluan,
      item.anggaran,
      item.verifikator,
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
// TOMBOL AKSI & MASTER CHECKBOX
// ==========================================================================
function updateButtonAndCheckAllState() {
  const btnAction = byId("btnPencairanBaru");
  const checkAll = byId("check-all");

  const enabledCheckboxes = document.querySelectorAll(
    "#table-body .row-checkbox:not(:disabled)",
  );
  const checkedCount = document.querySelectorAll(
    "#table-body .row-checkbox:checked",
  ).length;

  // Mode tombol: "Hapus (n)" saat ada yang dipilih, selain itu "Pencairan Baru"
  if (btnAction) {
    const hasSelection = checkedCount > 0;
    btnAction.classList.toggle("danger-btn", hasSelection);
    btnAction.classList.toggle("primary-btn", !hasSelection);
    btnAction.innerHTML = hasSelection
      ? `<i class="fas fa-times" style="font-size: 16px;"></i>
         <span>Hapus (${checkedCount})</span>`
      : `<i class="fas fa-plus" style="font-size: 16px;"></i>
         <span>Pencairan Baru</span>`;
  }

  // Master checkbox tercentang jika semua baris yang aktif tercentang
  if (checkAll) {
    checkAll.checked =
      enabledCheckboxes.length > 0 && checkedCount === enabledCheckboxes.length;
  }
}

// ==========================================================================
// RENDER BARIS
// ==========================================================================
const LINK_STYLE =
  'style="cursor: pointer; font-weight: bold; text-decoration: underline; color: #1e60aa;"';

// ID dokumen: berupa link ke halaman verifikasi hanya untuk status Submitted
function buildDocLink(idDok, rawId, isSubmitted) {
  if (!isSubmitted) return `<span class="link-col">${idDok}</span>`;

  return `<a href="${URL_FORM_VERIFIKASI}?id=${encodeURIComponent(rawId)}"
             class="doc-link" ${LINK_STYLE}>${idDok}</a>`;
}

// Badge status: untuk Unrealized, badge-nya menjadi link ke form operasional
// (membawa id dokumen + id anggaran)
function buildStatusBadge(item, statusClass, statusText, isUnrealized) {
  const badge = `<span class="badge ${statusClass} badge-${statusClass}">${statusText}</span>`;
  if (!isUnrealized) return badge;

  const params = new URLSearchParams({
    id: item.id || "",
    idAnggaran: item.idAnggaran || "",
  });

  return `<a href="${URL_FORM_OPERASIONAL}?${params.toString()}"
             title="Buka form pertanggungjawaban"
             style="text-decoration: none; cursor: pointer; display: inline-block;">${badge}</a>`;
}

function buildRowHtml(item) {
  const idDok = escapeHtml(item.id || "-");
  const anggaran = item.anggaran || "-";
  const keperluan = item.keperluan || "-";

  // Status
  const statusClass = escapeHtml((item.status || "draft").toLowerCase().trim());
  const statusText = escapeHtml(item.statusText || item.status || "Draft");
  const statusLower = statusText.toLowerCase().trim();
  const is = (name) => statusClass === name || statusLower === name;

  const isDraft = is("draft"); // hanya Draft yang checkbox-nya aktif
  const isSubmitted = is("submitted");
  const isUnrealized = is("unrealized");

  // Bagian baris yang butuh logika
  const docLinkHtml = buildDocLink(idDok, item.id || "", isSubmitted);
  const statusBadgeHtml = buildStatusBadge(
    item,
    statusClass,
    statusText,
    isUnrealized,
  );
  const statusDateHtml = item.statusDate
    ? `<span class="status-date">${escapeHtml(item.statusDate)}</span>`
    : "";

  return `
    <tr data-status="${statusClass}" data-id="${idDok}">
      <td>
        <input type="checkbox"
               class="row-checkbox"
               value="${idDok}"
               data-status="${statusText}"
               ${isDraft ? "" : "disabled"}>
      </td>
      <td>${docLinkHtml}</td>
      <td>${escapeHtml(item.tanggal || "-")}</td>
      <td><span class="link-col">${escapeHtml(item.kantor || "-")}</span></td>
      <td><span class="link-col">${escapeHtml(item.metode || "-")}</span></td>
      <td title="${escapeHtml(anggaran)}">
        <span class="link-col">${escapeHtml(truncateText(anggaran, 32))}</span>
      </td>
      <td><span class="link-col">${formatRupiah(item.nominal)}</span></td>
      <td title="${escapeHtml(keperluan)}">
        <span class="link-col">${escapeHtml(truncateText(keperluan, 36))}</span>
      </td>
      <td style="text-align: center;">
        ${statusBadgeHtml}
        ${statusDateHtml}
      </td>
      <td><span class="link-col">${escapeHtml(item.verifikator || "-")}</span></td>
      <td style="text-align: center; cursor: pointer; color: #8c8c8c; font-weight: bold;"
          onclick="openActionMenu(event, '${idDok}')">
        ...
      </td>
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
    updateButtonAndCheckAllState();
    return;
  }

  // 5. Potong sesuai halaman, lalu render
  const startIndex = (docCurrentPage - 1) * docPageSize;
  tableBody.innerHTML = filtered
    .slice(startIndex, startIndex + docPageSize)
    .map(buildRowHtml)
    .join("");

  updateButtonAndCheckAllState();
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

function bindSelection() {
  const checkAll = byId("check-all");

  // Pilih semua (hanya baris Draft / checkbox yang tidak disabled)
  checkAll?.addEventListener("change", () => {
    document
      .querySelectorAll("#table-body .row-checkbox:not(:disabled)")
      .forEach((cb) => (cb.checked = checkAll.checked));
    updateButtonAndCheckAllState();
  });

  // Checkbox per baris (delegasi, karena baris dirender ulang)
  byId("table-body")?.addEventListener("change", (e) => {
    if (e.target.classList.contains("row-checkbox")) {
      updateButtonAndCheckAllState();
    }
  });
}

function bindActionButton() {
  byId("btnPencairanBaru")?.addEventListener("click", () => {
    const selectedIds = Array.from(
      document.querySelectorAll("#table-body .row-checkbox:checked"),
    ).map((cb) => cb.value);

    if (selectedIds.length > 0) {
      console.log("Menghapus data ID:", selectedIds); // mode Hapus
    } else {
      console.log("Membuka form Pencairan Baru"); // mode Pencairan Baru
    }
  });
}

function bindCategoryTabs() {
  const tabGroup = byId("kategoriTabs");

  tabGroup?.addEventListener("click", (e) => {
    const clickedBtn = e.target.closest(".tab-btn");
    if (!clickedBtn) return;

    tabGroup
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    clickedBtn.classList.add("active");

    console.log("Kategori dipilih:", clickedBtn.dataset.tab);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindFilters();
  bindPagination();
  bindSelection();
  bindActionButton();
  bindCategoryTabs();
  renderTable();
});

// ==========================================================================
// GLOBAL (dipanggil dari HTML bila ada)
// ==========================================================================
function handleRowRedirect(event, url) {
  if (event.target.closest("input[type='checkbox']")) return;
  window.location.href = url;
}

window.viewDetail = function (id) {
  console.log("Detail dokumen:", id);
};