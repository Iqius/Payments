// 1. Data JSON (Struktur Standar API)
const documentData = [
  {
    id: "25112601965430",
    tanggal: "02 Des 2025",
    tanggalRaw: "2025-12-02",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "draft",
    statusText: "Draft",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965431",
    tanggal: "03 Des 2025",
    tanggalRaw: "2025-12-03",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "approved",
    statusText: "Approved",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965432",
    tanggal: "02 Jan 2025",
    tanggalRaw: "2026-01-02",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "revise",
    statusText: "Revise",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965433",
    tanggal: "02 jan 2025",
    tanggalRaw: "2025-01-02",
    kantor: "33A",
    metode: "Persekot Kerja",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "unrealized",
    statusText: "Unrealized",
    statusDate: "15 Jan 2026",
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965434",
    tanggal: "08 Des 2025",
    tanggalRaw: "2025-12-08",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "done",
    statusText: "Done",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965435",
    tanggal: "02 Des 2025",
    tanggalRaw: "2025-12-02",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "draft",
    statusText: "Draft",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965436",
    tanggal: "03 Des 2025",
    tanggalRaw: "2025-12-03",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "approved",
    statusText: "Approved",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965437",
    tanggal: "02 Jan 2025",
    tanggalRaw: "2026-01-02",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "revise",
    statusText: "Revise",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965438",
    tanggal: "02 jan 2025",
    tanggalRaw: "2025-01-02",
    kantor: "33A",
    metode: "Persekot Kerja",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "unrealized",
    statusText: "Unrealized",
    statusDate: "15 Jan 2026",
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965439",
    tanggal: "08 Des 2025",
    tanggalRaw: "2025-12-08",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "done",
    statusText: "Done",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965440",
    tanggal: "02 Des 2025",
    tanggalRaw: "2025-12-02",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "draft",
    statusText: "Draft",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965441",
    tanggal: "03 Des 2025",
    tanggalRaw: "2025-12-03",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "approved",
    statusText: "Approved",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965442",
    tanggal: "02 Jan 2025",
    tanggalRaw: "2026-01-02",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "revise",
    statusText: "Revise",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965443",
    tanggal: "02 jan 2025",
    tanggalRaw: "2025-01-02",
    kantor: "33A",
    metode: "Persekot Kerja",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "unrealized",
    statusText: "Unrealized",
    statusDate: "15 Jan 2026",
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965444",
    tanggal: "08 Des 2025",
    tanggalRaw: "2025-12-08",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "done",
    statusText: "Done",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965445",
    tanggal: "02 Des 2025",
    tanggalRaw: "2025-12-02",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "draft",
    statusText: "Draft",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965446",
    tanggal: "03 Des 2025",
    tanggalRaw: "2025-12-03",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "approved",
    statusText: "Approved",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965447",
    tanggal: "02 Jan 2025",
    tanggalRaw: "2026-01-02",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "revise",
    statusText: "Revise",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965448",
    tanggal: "02 jan 2025",
    tanggalRaw: "2025-01-02",
    kantor: "33A",
    metode: "Persekot Kerja",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "unrealized",
    statusText: "Unrealized",
    statusDate: "15 Jan 2026",
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
  {
    id: "25112601965449",
    tanggal: "08 Des 2025",
    tanggalRaw: "2025-12-08",
    kantor: "33A",
    metode: "Reimburse / Klaim Langsung",
    anggaran: "Monitoring, Kontrol dan Evaluasi Proses Pengadaan di...",
    nominal: 1000000,
    keperluan:
      "Biaya Perjalanan Dinas Kunjungan Site Visite Peserta Tender Pengadaan Mitra Pelaksana dan Pengelola Layanan Masyarakat (Contact Center) 175 BPJS Ketenagakerjaan",
    status: "done",
    statusText: "Done",
    statusDate: null,
    verifikator: "Aprillia Wahyuningtyas, A.Md.",
  },
];

// Helper: Format Nominal ke Rupiah
function formatRupiah(amount) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(amount);
}

// 2. Fungsi Render Tabel
function renderTable(data) {
  const tbody = document.getElementById("table-body");
  if (!tbody) return;

  tbody.innerHTML = data
    .map((item) => {
      // Logika khusus badge status (apakah ada tanggal di bawahnya)
      const statusHtml = item.statusDate
        ? `<div class="status-container">
             <span class="badge badge-${item.status}">${item.statusText}</span>
             <span class="status-date">${item.statusDate}</span>
           </div>`
        : `<span class="badge badge-${item.status}">${item.statusText}</span>`;

      return `
        <tr>
            <td><input type="checkbox" class="row-checkbox"></td>
            <td><a href="#" class="doc-link">${item.id}</a></td>
            <td>${item.tanggal}</td>
            <td>${item.kantor}</td>
            <td>${item.metode}</td>
            <td class="truncate" title="${item.anggaran}">${item.anggaran}</td>
            <td>${formatRupiah(item.nominal)}</td>
            <td class="truncate" title="${item.keperluan}">${item.keperluan}</td>
            <td class="${item.statusDate ? "status-cell" : ""}">${statusHtml}</td>
            <td>${item.verifikator}</td>
            <td class="action-cell"><i class="fas fa-ellipsis-h"></i></td>
        </tr>
      `;
    })
    .join("");
}

// 3. Inisialisasi saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
  renderTable(documentData);
});

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const filterSelect = document.getElementById("filter-status");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
  const pageSizeSelect = document.getElementById("page-size-select");

  // 1. Pastikan ukuran halaman awal adalah 5
  if (pageSizeSelect) {
    docPageSize = parseInt(pageSizeSelect.value, 10) || 5;
  } else {
    docPageSize = 5;
  }

  function applyFilters() {
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedStatus = filterSelect
      ? filterSelect.value.toLowerCase()
      : "all";
    const startDate = startDateInput ? startDateInput.value : "";
    const endDate = endDateInput ? endDateInput.value : "";

    const filtered = documentData.filter((item) => {
      // Filter Status
      const matchStatus =
        selectedStatus === "all" ||
        item.status.toLowerCase() === selectedStatus;

      // Filter Search Teks
      const matchSearch =
        item.id.toLowerCase().includes(keyword) ||
        item.keperluan.toLowerCase().includes(keyword) ||
        item.anggaran.toLowerCase().includes(keyword) ||
        item.verifikator.toLowerCase().includes(keyword);

      // Filter Rentang Tanggal
      let matchDate = true;
      if (item.tanggalRaw) {
        if (startDate && item.tanggalRaw < startDate) matchDate = false;
        if (endDate && item.tanggalRaw > endDate) matchDate = false;
      }

      return matchStatus && matchSearch && matchDate;
    });

    // 2. Reset halaman ke 1 tiap kali filter berubah
    docCurrentPage = 1;

    // 3. Potong data agar HANYA 5 yang dikirim ke tabel
    const startIndex = (docCurrentPage - 1) * docPageSize;
    const paginatedData = filtered.slice(startIndex, startIndex + docPageSize);

    // 4. Update total counter (misal: "dari 20 items")
    const totalElem = document.getElementById("total-doc-items");
    if (totalElem) {
      totalElem.textContent = filtered.length;
    }

    // 5. Render HANYA data hasil potongan (maksimal 5)
    renderTable(paginatedData);
  }

  // Event Listeners
  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (filterSelect) filterSelect.addEventListener("change", applyFilters);
  if (startDateInput) startDateInput.addEventListener("change", applyFilters);
  if (endDateInput) endDateInput.addEventListener("change", applyFilters);

  // Render awal (akan otomatis memotong 5 data pertama)
  applyFilters();
});

// State Pagination Dokumen
let docCurrentPage = 1;
let docPageSize = 20;

// Helper format Rupiah
function formatRupiah(val) {
  if (val === null || val === undefined || isNaN(val)) return "Rp. 0,00";
  return "Rp. " + new Intl.NumberFormat("id-ID").format(val) + ",00";
}

// Fungsi Render Tabel Sesuai 11 Kolom HTML
// ==========================================
// 1. FUNGSI SINKRONISASI TOMBOL & MASTER CHECKBOX
// ==========================================
function updateButtonAndCheckAllState() {
  const btnAction = document.getElementById("btnPencairanBaru");
  const checkAll = document.getElementById("check-all");

  const enabledCheckboxes = document.querySelectorAll("#table-body .row-checkbox:not(:disabled)");
  const checkedBoxes = document.querySelectorAll("#table-body .row-checkbox:checked");
  const checkedCount = checkedBoxes.length;

  // Toggle mode tombol (Hapus / Pencairan Baru)
  if (btnAction) {
    if (checkedCount > 0) {
      btnAction.classList.remove("primary-btn");
      btnAction.classList.add("danger-btn");
      btnAction.innerHTML = `
        <i class="fas fa-times" style="font-size: 16px;"></i>
        <span>Hapus (${checkedCount})</span>
      `;
    } else {
      btnAction.classList.remove("danger-btn");
      btnAction.classList.add("primary-btn");
      btnAction.innerHTML = `
        <i class="fas fa-plus" style="font-size: 16px;"></i>
        <span>Pencairan Baru</span>
      `;
    }
  }

  // Sinkronisasi status check-all
  if (checkAll) {
    checkAll.checked = enabledCheckboxes.length > 0 && checkedBoxes.length === enabledCheckboxes.length;
  }
}

// ==========================================
// 2. FUNGSI RENDER TABEL DOKUMEN
// ==========================================
function renderDocumentTable() {
  const tableBody = document.getElementById("table-body");
  const totalItemsEl = document.getElementById("total-doc-items");
  const pageSizeSelect = document.getElementById("page-size-select");
  const currentPageEl = document.getElementById("current-page-num");
  const totalPagesEl = document.getElementById("total-pages-text");

  if (typeof documentData === "undefined" || !Array.isArray(documentData)) {
    console.error("Data 'documentData' tidak ditemukan atau bukan array.");
    return;
  }

  // 1. Ambil ukuran halaman dari dropdown
  if (pageSizeSelect) {
    docPageSize = parseInt(pageSizeSelect.value, 10) || 20;
  }

  // 2. Hitung jumlah data dan halaman
  const totalItems = documentData.length;
  if (totalItemsEl) totalItemsEl.innerText = totalItems;

  const totalPages = Math.ceil(totalItems / docPageSize) || 1;
  if (docCurrentPage > totalPages) docCurrentPage = totalPages;
  if (docCurrentPage < 1) docCurrentPage = 1;

  // Update indikator nomor halaman
  if (currentPageEl) currentPageEl.innerText = docCurrentPage;
  if (totalPagesEl) totalPagesEl.innerText = `of ${totalPages}`;

  if (!tableBody) return;

  // 3. Tampilan saat data kosong
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

  // 4. Potong data sesuai pagination
  const startIndex = (docCurrentPage - 1) * docPageSize;
  const paginatedData = documentData.slice(
    startIndex,
    startIndex + docPageSize,
  );

  // 5. Render 11 Kolom Sesuai <thead>
  tableBody.innerHTML = paginatedData
    .map((item) => {
      const idDok = item.id || "-";
      const tgl = item.tanggal || "-";
      const kantor = item.kantor || "-";
      const metode = item.metode || "-";
      const nominal = typeof formatRupiah === "function" ? formatRupiah(item.nominal) : item.nominal;
      const verifikator = item.verifikator || "-";

      // Pemotongan Anggaran
      const anggaran = item.anggaran || "-";
      const anggaranDisplay = anggaran.length > 32 
        ? anggaran.substring(0, 32) + "..." 
        : anggaran;

      // Pemotongan Keperluan
      const keperluan = item.keperluan || "-";
      const keperluanDisplay = keperluan.length > 36 
        ? keperluan.substring(0, 36) + "..." 
        : keperluan;

      // Format status & tanggal
      const statusClass = (item.status || "draft").toLowerCase().trim();
      const statusText = item.statusText || item.status || "Draft";
      const statusDate = item.statusDate 
        ? `<span class="status-date">${item.statusDate}</span>` 
        : "";

      // Validasi ketat: Hanya Draft yang aktif
      const isDraft = String(statusText).toLowerCase().trim() === "draft" ||
                      String(item.status).toLowerCase().trim() === "draft";

      return `
        <tr>
          <td>
            <input type="checkbox" 
                   class="row-checkbox" 
                   value="${idDok}" 
                   data-status="${statusText}"
                   ${!isDraft ? "disabled" : ""}>
          </td>
          <td><span class="link-col">${idDok}</span></td>
          <td>${tgl}</td>
          <td><span class="link-col">${kantor}</span></td>
          <td><span class="link-col">${metode}</span></td>
          <td title="${anggaran}"><span class="link-col">${anggaranDisplay}</span></td>
          <td><span class="link-col">${nominal}</span></td>
          <!-- Kolom Keperluan Singkat & Teks Biasa -->
          <td title="${keperluan}"><span class="link-col">${keperluanDisplay}</span></td>
          <td style="text-align: center;">
            <span class="badge ${statusClass} badge-${statusClass}">
              ${statusText}
            </span>
            ${statusDate}
          </td>
          <td><span class="link-col">${verifikator}</span></td>
          <td style="text-align: center; cursor: pointer; color: #8c8c8c; font-weight: bold;" onclick="openActionMenu(event, '${idDok}')">
            ...
          </td>
        </tr>
      `;
    })
    .join("");

  // Update tombol dan master checkbox setiap kali render selesai
  updateButtonAndCheckAllState();
}

// ==========================================
// 3. INISIALISASI EVENT LISTENER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Event ganti limit items per halaman
  const pageSizeSelect = document.getElementById("page-size-select");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", function () {
      docPageSize = parseInt(this.value, 10);
      docCurrentPage = 1;
      renderDocumentTable();
    });
  }

  // Event Navigasi Tombol Pagination
  const btnFirst = document.getElementById("btn-first-page");
  const btnPrev = document.getElementById("btn-prev-page");
  const btnNext = document.getElementById("btn-next-page");
  const btnLast = document.getElementById("btn-last-page");

  if (btnFirst) {
    btnFirst.addEventListener("click", () => {
      if (docCurrentPage > 1) {
        docCurrentPage = 1;
        renderDocumentTable();
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (docCurrentPage > 1) {
        docCurrentPage--;
        renderDocumentTable();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      const totalPages = Math.ceil(documentData.length / docPageSize) || 1;
      if (docCurrentPage < totalPages) {
        docCurrentPage++;
        renderDocumentTable();
      }
    });
  }

  if (btnLast) {
    btnLast.addEventListener("click", () => {
      const totalPages = Math.ceil(documentData.length / docPageSize) || 1;
      if (docCurrentPage < totalPages) {
        docCurrentPage = totalPages;
        renderDocumentTable();
      }
    });
  }

  // Event: Checkbox Select All (hanya centang yang status Draft / tidak disabled)
  const checkAll = document.getElementById("check-all");
  if (checkAll) {
    checkAll.addEventListener("change", function () {
      const enabledCheckboxes = document.querySelectorAll("#table-body .row-checkbox:not(:disabled)");
      enabledCheckboxes.forEach((cb) => {
        cb.checked = checkAll.checked;
      });
      updateButtonAndCheckAllState();
    });
  }

  // Event: Delegasi Klik Checkbox Baris di Tabel
  const tableBody = document.getElementById("table-body");
  if (tableBody) {
    tableBody.addEventListener("change", function (e) {
      if (e.target && e.target.classList.contains("row-checkbox")) {
        updateButtonAndCheckAllState();
      }
    });
  }

  // Event: Tombol Aksi (Pencairan Baru / Hapus)
  const btnAction = document.getElementById("btnPencairanBaru");
  if (btnAction) {
    btnAction.addEventListener("click", function () {
      const checkedBoxes = document.querySelectorAll("#table-body .row-checkbox:checked");
      const selectedIds = Array.from(checkedBoxes).map((cb) => cb.value);

      if (selectedIds.length > 0) {
        // Mode Hapus
        console.log("Menghapus data ID:", selectedIds);
      } else {
        // Mode Pencairan Baru
        console.log("Membuka form Pencairan Baru");
      }
    });
  }

  // Render pertama kali saat halaman dimuat
  renderDocumentTable();
});

// Aksi detail per baris
window.viewDetail = function (id) {
  console.log("Detail dokumen:", id);
};

function truncateText(text, maxLength = 36) {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

document.addEventListener("DOMContentLoaded", () => {
  const tabGroup = document.getElementById("kategoriTabs");

  tabGroup.addEventListener("click", (e) => {
    const clickedBtn = e.target.closest(".tab-btn");
    
    // Abaikan jika yang diklik bukan tombol tab
    if (!clickedBtn) return;

    // 1. Hapus class 'active' dari semua tab di dalam grup
    tabGroup.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    // 2. Pasang class 'active' ke tombol yang baru diklik
    clickedBtn.classList.add("active");

    // 3. Ambil data kategori yang dipilih (opsional untuk filter tabel)
    const selectedCategory = clickedBtn.dataset.tab;
    console.log("Kategori dipilih:", selectedCategory);

    // Panggil fungsi filter tabel Anda di sini jika ada:
    // filterTabelByKategori(selectedCategory);
  });
});