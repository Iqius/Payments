// ==========================================
// HELPER
// ==========================================
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

// ==========================================
// STATE
// ==========================================
let docCurrentPage = 1;
let docPageSize = 20;

// ==========================================
// FILTER
// ==========================================
function getFilteredData() {
  if (typeof documentData === "undefined" || !Array.isArray(documentData)) {
    console.error("Data 'documentData' tidak ditemukan atau bukan array.");
    return [];
  }

  const keyword = (document.getElementById("search-input")?.value || "")
    .toLowerCase()
    .trim();
  const selectedStatus = (
    document.getElementById("filter-status")?.value || "all"
  ).toLowerCase();
  const startDate = document.getElementById("start-date")?.value || "";
  const endDate = document.getElementById("end-date")?.value || "";

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

// ==========================================
// SINKRONISASI TOMBOL & MASTER CHECKBOX
// ==========================================
function updateButtonAndCheckAllState() {
  const btnAction = document.getElementById("btnPencairanBaru");
  const checkAll = document.getElementById("check-all");

  const enabledCheckboxes = document.querySelectorAll(
    "#table-body .row-checkbox:not(:disabled)",
  );
  const checkedCount = document.querySelectorAll(
    "#table-body .row-checkbox:checked",
  ).length;

  // Toggle mode tombol (Hapus / Pencairan Baru)
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

  // Sinkronisasi status check-all
  if (checkAll) {
    checkAll.checked =
      enabledCheckboxes.length > 0 && checkedCount === enabledCheckboxes.length;
  }
}

// ==========================================
// RENDER SATU BARIS
// ==========================================
function buildRowHtml(item) {
  const idDok = escapeHtml(item.id || "-");
  const anggaran = item.anggaran || "-";
  const keperluan = item.keperluan || "-";

  const statusClass = escapeHtml((item.status || "draft").toLowerCase().trim());
  const statusText = escapeHtml(item.statusText || item.status || "Draft");
  const statusLower = statusText.toLowerCase().trim();

  // Hanya Draft yang checkbox-nya aktif
  const isDraft = statusLower === "draft" || statusClass === "draft";
  // Hanya Submitted yang ID dokumennya berupa link

  const isUnrealized =
    statusLower === "unrealized" || statusClass === "unrealized";

  // Badge status: untuk Unrealized, badge-nya yang menjadi link
  // ke form operasional (bawa id dokumen + id anggaran)
  const badgeHtml = `<span class="badge ${statusClass} badge-${statusClass}">${statusText}</span>`;
  let statusBadgeHtml = badgeHtml;
  if (isUnrealized) {
    const params = new URLSearchParams({
      id: item.id || "",
      idAnggaran: item.idAnggaran || "",
    });
    statusBadgeHtml = `<a href="../pages/form-operasional.html?${params.toString()}"
          title="Buka form pertanggungjawaban"
          style="text-decoration: none; cursor: pointer; display: inline-block;">${badgeHtml}</a>`;
  }

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
      <td><span class="link-col">${idDok}</span></td>
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

// ==========================================
// RENDER TABEL (filter + pagination + 11 kolom)
// ==========================================
function renderTable() {
  const tableBody = document.getElementById("table-body");
  const totalItemsEl = document.getElementById("total-doc-items");
  const pageSizeSelect = document.getElementById("page-size-select");
  const currentPageEl = document.getElementById("current-page-num");
  const totalPagesEl = document.getElementById("total-pages-text");

  // 1. Ukuran halaman dari dropdown
  if (pageSizeSelect) {
    docPageSize = parseInt(pageSizeSelect.value, 10) || 20;
  }

  // 2. Data hasil filter + hitung halaman
  const filtered = getFilteredData();
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / docPageSize) || 1;
  docCurrentPage = Math.min(Math.max(docCurrentPage, 1), totalPages);

  if (totalItemsEl) totalItemsEl.innerText = totalItems;
  if (currentPageEl) currentPageEl.innerText = docCurrentPage;
  if (totalPagesEl) totalPagesEl.innerText = `of ${totalPages}`;

  if (!tableBody) return;

  // 3. Data kosong
  if (totalItems === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 24px; color: #94a3b8;">
          Tidak ada data dokumen.
        </td>
      </tr>
    `;
    updateButtonAndCheckAllState();
    return;
  }

  // 4. Potong sesuai halaman & render
  const startIndex = (docCurrentPage - 1) * docPageSize;
  tableBody.innerHTML = filtered
    .slice(startIndex, startIndex + docPageSize)
    .map(buildRowHtml)
    .join("");

  updateButtonAndCheckAllState();
}

// Ganti halaman lalu render ulang
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

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // --- Filter ---
  const searchInput = document.getElementById("search-input");
  const filterSelect = document.getElementById("filter-status");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");

  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);
  startDateInput?.addEventListener("change", applyFilters);
  endDateInput?.addEventListener("change", applyFilters);

  // --- Pagination ---
  document
    .getElementById("page-size-select")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("btn-first-page")
    ?.addEventListener("click", () => goToPage(1));
  document
    .getElementById("btn-prev-page")
    ?.addEventListener("click", () => goToPage(docCurrentPage - 1));
  document
    .getElementById("btn-next-page")
    ?.addEventListener("click", () => goToPage(docCurrentPage + 1));
  document
    .getElementById("btn-last-page")
    ?.addEventListener("click", () => goToPage(Infinity));

  // --- Select All (hanya yang tidak disabled / Draft) ---
  const checkAll = document.getElementById("check-all");
  checkAll?.addEventListener("change", () => {
    document
      .querySelectorAll("#table-body .row-checkbox:not(:disabled)")
      .forEach((cb) => (cb.checked = checkAll.checked));
    updateButtonAndCheckAllState();
  });

  // --- Delegasi checkbox baris ---
  document.getElementById("table-body")?.addEventListener("change", (e) => {
    if (e.target.classList.contains("row-checkbox")) {
      updateButtonAndCheckAllState();
    }
  });

  // --- Tombol aksi (Pencairan Baru / Hapus) ---
  document.getElementById("btnPencairanBaru")?.addEventListener("click", () => {
    const selectedIds = Array.from(
      document.querySelectorAll("#table-body .row-checkbox:checked"),
    ).map((cb) => cb.value);

    if (selectedIds.length > 0) {
      console.log("Menghapus data ID:", selectedIds); // Mode Hapus
    } else {
      console.log("Membuka form Pencairan Baru"); // Mode Pencairan Baru
    }
  });

  // --- Tab kategori ---
  const tabGroup = document.getElementById("kategoriTabs");
  tabGroup?.addEventListener("click", (e) => {
    const clickedBtn = e.target.closest(".tab-btn");
    if (!clickedBtn) return;

    tabGroup
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    clickedBtn.classList.add("active");

    console.log("Kategori dipilih:", clickedBtn.dataset.tab);
  });

  // --- Render awal ---
  renderTable();
});

// ==========================================
// GLOBAL (dipanggil dari HTML bila ada)
// ==========================================
function handleRowRedirect(event, url) {
  if (event.target.closest("input[type='checkbox']")) return;
  window.location.href = url;
}

window.viewDetail = function (id) {
  console.log("Detail dokumen:", id);
};