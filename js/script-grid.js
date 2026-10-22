// ==========================================================================
// GRID PENGAJUAN (index.html)
// Sumber data : Store (store.js). Perubahan disimpan di localStorage.
// Isi file    : konfigurasi -> helper -> filter & grup -> render -> aksi -> event
// ==========================================================================

// ---------- Konfigurasi ----------
const URL_FORM_OPERASIONAL = "pages/pencairan/form-operasional.html";
const URL_FORM_VERIFIKASI = "pages/verifikasi/form-verifikasi.html";
const URL_FORM_APPROVAL = "pages/approval/form-approval.html";

const DEFAULT_PAGE_SIZE = 20;
const TOTAL_COLUMNS = 11;

// ---------- State ----------
let docCurrentPage = 1;
let docPageSize = DEFAULT_PAGE_SIZE;
let activeTab = "operasional";

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

const st = (d) => String(d.status || "draft").toLowerCase().trim();
const flowOf = (d) => (["perjalanan_dinas", "pengadaan"].includes(d.flow) ? d.flow : "operasional");
const urlEdit = (d) => `${URL_FORM_OPERASIONAL}?type=${flowOf(d)}&edit=${encodeURIComponent(d.id)}`;
const urlPertanggungjawaban = (d) =>
  `${URL_FORM_OPERASIONAL}?type=${flowOf(d)}&id=${encodeURIComponent(d.id)}&idAnggaran=${encodeURIComponent(d.idAnggaran || "")}`;

// ==========================================================================
// FILTER + GRUP (persekot dan pertanggungjawabannya = 1 unit)
// ==========================================================================
function cocok(item) {
  const keyword = (byId("search-input")?.value || "").toLowerCase().trim();
  const selectedStatus = (byId("filter-status")?.value || "all").toLowerCase();
  const startDate = byId("start-date")?.value || "";
  const endDate = byId("end-date")?.value || "";

  if ((item.tab || "operasional") !== activeTab) return false;
  if (selectedStatus !== "all" && st(item) !== selectedStatus) return false;

  const matchSearch = [item.id, item.keperluan, item.anggaran, item.verifikator, item.metode].some((f) =>
    String(f || "").toLowerCase().includes(keyword),
  );
  if (!matchSearch) return false;

  if (item.tanggalRaw) {
    if (startDate && item.tanggalRaw < startDate) return false;
    if (endDate && item.tanggalRaw > endDate) return false;
  }
  return true;
}

// Satu unit = [induk, ...anak]. Unit tampil bila SALAH SATU anggotanya cocok.
function getUnits() {
  const all = Store.list();
  const hit = new Set(all.filter(cocok).map((d) => d.id));
  const ada = new Set(all.map((d) => d.id));
  const units = [];
  all.forEach((d) => {
    if (d.refId && ada.has(d.refId)) return; // anak dirender bersama induknya
    const unit = [d, ...all.filter((c) => c.refId === d.id)];
    if (unit.some((x) => hit.has(x.id))) units.push(unit);
  });
  return units;
}

// Halaman dihitung per BARIS (docPageSize baris), tetapi persekot + pertanggungjawabannya
// tidak pernah terpisah: grup dimulai di halaman berikutnya hanya jika halaman ini sudah penuh.
// Contoh (5 baris/hal): persekot di baris 5 + pertanggungjawaban di baris 6 -> tetap 1 halaman (6 baris).
function paginate(units, size) {
  const pages = [];
  let cur = [];
  let n = 0;
  units.forEach((u) => {
    if (n >= size) {
      pages.push(cur);
      cur = [];
      n = 0;
    }
    cur.push(u);
    n += u.length;
  });
  if (cur.length) pages.push(cur);
  return pages;
}

// ==========================================================================
// TOMBOL AKSI & MASTER CHECKBOX
// ==========================================================================
function updateButtonAndCheckAllState() {
  const btnAction = byId("btnPencairanBaru");
  const checkAll = byId("check-all");

  const enabledCheckboxes = document.querySelectorAll("#table-body .row-checkbox:not(:disabled)");
  const checkedCount = document.querySelectorAll("#table-body .row-checkbox:checked").length;

  if (btnAction) {
    const hasSelection = checkedCount > 0;
    btnAction.classList.toggle("danger-btn", hasSelection);
    btnAction.classList.toggle("primary-btn", !hasSelection);
    btnAction.innerHTML = hasSelection
      ? `<i class="fas fa-times" style="font-size: 16px;"></i><span>Hapus (${checkedCount})</span>`
      : `<i class="fas fa-plus" style="font-size: 16px;"></i><span>Pencairan Baru</span>`;
  }

  if (checkAll) {
    checkAll.checked = enabledCheckboxes.length > 0 && checkedCount === enabledCheckboxes.length;
  }
}

// ==========================================================================
// RENDER BARIS
// ==========================================================================
const LINK_STYLE = 'style="cursor: pointer; font-weight: bold; text-decoration: underline; color: #1e60aa;"';

function buildDocLink(item) {
  const idDok = escapeHtml(item.id || "-");
  const s = st(item);
  const raw = encodeURIComponent(item.id || "");
  if (s === "draft" || s === "revise") return `<a href="${urlEdit(item)}" class="doc-link" ${LINK_STYLE}>${idDok}</a>`;
  if (s === "submitted") {
    const url = item.verified ? `${URL_FORM_APPROVAL}?id=${raw}&mode=view` : `${URL_FORM_VERIFIKASI}?id=${raw}`;
    return `<a href="${url}" class="doc-link" ${LINK_STYLE}>${idDok}</a>`;
  }
  // persekot (unrealized / realized) tidak punya halaman approval
  if (item.skema === "persekot") return `<span class="link-col">${idDok}</span>`;
  return `<a href="${URL_FORM_APPROVAL}?id=${raw}&mode=view" class="doc-link" ${LINK_STYLE}>${idDok}</a>`;
}

// Badge status: Unrealized -> link ke form pertanggungjawaban
function buildStatusBadge(item, statusClass, statusText) {
  const badge = `<span class="badge ${statusClass} badge-${statusClass}">${statusText}</span>`;
  if (st(item) !== "unrealized") return badge;
  return `<a href="${urlPertanggungjawaban(item)}" title="Buka form pertanggungjawaban"
             style="text-decoration: none; cursor: pointer; display: inline-block;">${badge}</a>`;
}

// Tanggal di bawah status: HANYA persekot kerja berstatus Unrealized / Realized.
// Isinya batas pertanggungjawaban = 15 hari kerja (Sen-Jum) setelah tanggal kegiatan persekot.
const HARI_KERJA_PERTANGGUNGJAWABAN = 15;
function tambahHariKerja(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  let sisa = n;
  while (sisa > 0) {
    dt.setDate(dt.getDate() + 1);
    const h = dt.getDay();
    if (h !== 0 && h !== 6) sisa--;
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function tglUnderBadge(item) {
  if (item.skema !== "persekot" || !["unrealized", "realized"].includes(st(item))) return "";
  const dasar = item.tanggalKegiatanRaw || item.tanggalRaw;
  return dasar ? Store.util.fmtTgl(tambahHariKerja(dasar, HARI_KERJA_PERTANGGUNGJAWABAN)) : "";
}

// ---------- kolom per tab ----------
// default (Operasional, Remunerasi, Pelatihan) | Perjalanan Dinas: + Jatuh Tempo | Pengadaan: + Lampiran
const SET_KOLOM = {
  default: [["chk", "", "5%"], ["id", "ID Dokumen", "10%"], ["tgl", "Tanggal Pengajuan", "8%"], ["kantor", "Kantor", "5%"], ["metode", "Metode Pencairan", "12%"], ["anggaran", "Anggaran Kegiatan", "15%"], ["nominal", "Nominal Pengajuan", "10%"], ["keperluan", "Keperluan", "20%"], ["status", "Status", "7%"], ["verif", "Verifikator", "8%"], ["aksi", "Action", "2%"]],
  "perjalanan-dinas": [["chk", "", "5%"], ["id", "ID Dokumen", "10%"], ["kantor", "Kantor", "5%"], ["tgl", "Tanggal", "8%"], ["anggaran", "Anggaran Kegiatan", "18%"], ["nominal", "Nominal", "9%"], ["keperluan", "Keperluan", "20%"], ["tempo", "Jatuh Tempo", "8%"], ["status", "Status", "7%"], ["verif", "Verifikator", "9%"], ["aksi", "Action", "3%"]],
  pengadaan: [["chk", "", "5%"], ["id", "ID Dokumen", "10%"], ["kantor", "Kantor", "5%"], ["tgl", "Tanggal", "9%"], ["anggaran", "Anggaran Kegiatan", "18%"], ["nominal", "Nominal", "9%"], ["keperluan", "Keperluan", "20%"], ["status", "Status", "7%"], ["lampiran", "Lampiran", "8%"], ["verif", "Verifikator", "9%"], ["aksi", "Action", "3%"]],
};
const kolomAktif = () => SET_KOLOM[activeTab] || SET_KOLOM.default;

function renderHead() {
  const tr = document.querySelector(".data-table thead tr");
  if (!tr) return;
  tr.innerHTML = kolomAktif()
    .map(([k, label, w]) => (k === "chk" ? `<th width="${w}"><input type="checkbox" class="row-checkbox" id="check-all"></th>` : `<th width="${w}">${label}</th>`))
    .join("");
}

// jatuh tempo pertanggungjawaban: 30 hari setelah tanggal pengajuan (contoh aturan; ubah sesuai kebutuhan)
function jatuhTempo(item) {
  if (!item.tanggalRaw) return "-";
  const [y, m, d] = item.tanggalRaw.split("-").map(Number);
  const dt = new Date(y, m - 1, d + 30);
  return Store.util.fmtTgl(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`);
}
function lampiranHtml(item) {
  const n = Array.isArray(item.dokumen) ? item.dokumen.length : item.lampiran || 2;
  return `<span class="lampiran"><i class="fas fa-paperclip"></i> ${n} files</span>`;
}

// ikon branch yang sama dengan step Review (css: .branch-icon i.branch-connector), diletakkan di kiri checkbox
const BRANCH_ICON = '<svg class="grp-branch" width="22" height="34" viewBox="0 0 18 30" fill="none"><path d="M3 3 V14 Q3 21 10 21 H14" stroke="#1d70b8" stroke-width="2.2" stroke-linecap="round"/><circle cx="3" cy="3.4" r="2.6" fill="#fff" stroke="#1d70b8" stroke-width="1.8"/><circle cx="15" cy="21" r="2.8" fill="#1d70b8"/></svg>';
const BRANCH_SVG = '<svg class="grp-branch" width="18" height="30" viewBox="0 0 18 30" fill="none"><path d="M3 2 V14 Q3 21 10 21 H14" stroke="#1f6fa8" stroke-width="2" stroke-linecap="round"/><circle cx="3" cy="3" r="2.6" fill="#1f6fa8"/><circle cx="15" cy="21" r="2.6" fill="#1f6fa8"/></svg>';

function buildRowHtml(item, grp = "") {
  const idDok = escapeHtml(item.id || "-");
  const anggaran = item.anggaran || "-";
  const keperluan = item.keperluan || "-";
  const statusClass = escapeHtml(st(item));
  const statusText = escapeHtml(item.statusText || item.status || "Draft");
  const isDraft = st(item) === "draft"; // hanya Draft yang checkbox-nya aktif
  const anak = grp.includes("grp-mid") || grp.includes("grp-bottom");

  const tgl = tglUnderBadge(item);
  const statusDateHtml = tgl ? `<span class="status-date">${escapeHtml(tgl)}</span>` : "";

  const cell = {
    chk: `<td><span class="chk-cell">${anak ? BRANCH_ICON : ""}${anak && !isDraft ? "" : `<input type="checkbox" class="row-checkbox" value="${idDok}" data-status="${statusText}" ${isDraft ? "" : "disabled"}>`}</span></td>`,
    id: `<td><span class="id-cell">${buildDocLink(item)}</span></td>`,
    tgl: `<td>${escapeHtml(item.tanggal || "-")}</td>`,
    kantor: `<td><span class="link-col">${escapeHtml(item.kantor || "-")}</span></td>`,
    metode: `<td><span class="link-col">${escapeHtml(String(item.metode || "-").trim())}</span></td>`,
    anggaran: `<td title="${escapeHtml(anggaran)}"><span class="link-col">${escapeHtml(truncateText(anggaran, 32))}</span></td>`,
    nominal: `<td><span class="link-col">${formatRupiah(item.nominal)}</span></td>`,
    keperluan: `<td title="${escapeHtml(keperluan)}"><span class="link-col">${escapeHtml(truncateText(keperluan, 36))}</span></td>`,
    tempo: `<td>${escapeHtml(jatuhTempo(item))}</td>`,
    status: `<td style="text-align: center;">${buildStatusBadge(item, statusClass, statusText)}${statusDateHtml}</td>`,
    lampiran: `<td>${lampiranHtml(item)}</td>`,
    verif: `<td><span class="link-col">${escapeHtml(item.verifikator || "-")}</span></td>`,
    aksi: `<td class="action-cell" style="text-align: center; cursor: pointer; color: #8c8c8c; font-weight: bold;" onclick="openActionMenu(event, '${idDok}')">...</td>`,
  };
  return `<tr class="${grp}" data-status="${statusClass}" data-id="${idDok}">${kolomAktif().map(([k]) => cell[k]).join("")}</tr>`;
}

// ==========================================================================
// RENDER TABEL (filter -> grup -> pagination -> baris)
// ==========================================================================
function renderTable() {
  renderHead();
  const tableBody = byId("table-body");
  const pageSizeSelect = byId("page-size-select");
  if (pageSizeSelect) docPageSize = parseInt(pageSizeSelect.value, 10) || DEFAULT_PAGE_SIZE;

  const units = getUnits();
  const pages = paginate(units, docPageSize);
  const totalItems = units.reduce((n, u) => n + u.length, 0); // jumlah dokumen
  const totalPages = pages.length || 1;
  docCurrentPage = Math.min(Math.max(docCurrentPage, 1), totalPages);

  if (byId("total-doc-items")) byId("total-doc-items").innerText = totalItems;
  if (byId("current-page-num")) byId("current-page-num").innerText = docCurrentPage;
  if (byId("total-pages-text")) byId("total-pages-text").innerText = `of ${totalPages}`;

  if (!tableBody) return;

  if (totalItems === 0) {
    tableBody.innerHTML = `
      <tr><td colspan="${TOTAL_COLUMNS}" style="text-align: center; padding: 24px; color: #94a3b8;">Tidak ada data dokumen.</td></tr>`;
    updateButtonAndCheckAllState();
    return;
  }

  tableBody.innerHTML = (pages[docCurrentPage - 1] || [])
    .map((unit) =>
      unit
        .map((item, i) => {
          if (unit.length === 1) return buildRowHtml(item);
          const pos = i === 0 ? "grp-top" : i === unit.length - 1 ? "grp-bottom" : "grp-mid";
          return buildRowHtml(item, "grp " + pos);
        })
        .join(""),
    )
    .join("");

  updateButtonAndCheckAllState();
}

function goToPage(page) {
  const totalPages = paginate(getUnits(), docPageSize).length || 1;
  const target = Math.min(Math.max(page, 1), totalPages);
  if (target === docCurrentPage) return;
  docCurrentPage = target;
  renderTable();
}

function applyFilters() {
  docCurrentPage = 1;
  renderTable();
}

// ==========================================================================
// MENU AKSI (...)
// ==========================================================================
function closeActionMenu() {
  document.querySelectorAll(".action-menu").forEach((m) => m.remove());
}

function jalankan(fn, pesanOk) {
  try {
    fn();
    if (pesanOk) UI.toast(pesanOk, "ok");
  } catch (e) {
    UI.toast(e.message || "Gagal memproses", "err");
  }
  renderTable();
}

function menuItems(item) {
  const s = st(item);
  const id = item.id;
  const out = [];
  const go = (url) => () => (window.location.href = url);
  if (s === "draft") {
    out.push({ t: "Buka / Edit draft", f: go(urlEdit(item)) });
    out.push({ t: "Hapus draft", danger: true, f: () => hapusIds([id]) });
  } else if (s === "revise") {
    if (item.catatanRevisi) out.push({ t: "Catatan: " + truncateText(item.catatanRevisi, 40), f: () => UI.alert(item.catatanRevisi, "Catatan revisi") });
    out.push({ t: "Perbaiki (Revise)", f: go(urlEdit(item)) });
  } else if (s === "submitted") {
    if (!item.verified) {
      out.push({ t: "Buka halaman verifikasi", f: go(`${URL_FORM_VERIFIKASI}?id=${encodeURIComponent(id)}`) });
      out.push({ t: "Verifikasi (simulasi)", f: () => jalankan(() => Store.verify(id), "Dokumen diverifikasi") });
    } else {
      out.push({ t: "Buka halaman approval", f: go(`${URL_FORM_APPROVAL}?id=${encodeURIComponent(id)}`) });
      out.push({ t: "Approve (simulasi)", f: () => jalankan(() => Store.approve(id), "Dokumen disetujui") });
    }
    out.push({
      t: "Kembalikan (Revise)",
      danger: true,
      f: async () => {
        const note = await UI.prompt("Tulis catatan revisi untuk pembuat.", { judul: "Kembalikan dokumen", placeholder: "Catatan revisi (maks 500 karakter)", wajib: true, ya: "Kembalikan" });
        if (note === null) return;
        jalankan(() => Store.returnDoc(id, note), "Dokumen dikembalikan ke pembuat");
      },
    });
  } else if (s === "unrealized") {
    out.push({ t: "Buat pertanggungjawaban", f: go(urlPertanggungjawaban(item)) });
  } else if (s === "approved") {
    out.push({ t: "Lihat detail", f: go(`${URL_FORM_APPROVAL}?id=${encodeURIComponent(id)}&mode=view`) });
    out.push({ t: "Tandai selesai dibayar", f: () => jalankan(() => Store.complete(id), "Ditandai selesai") });
  } else if (item.skema !== "persekot") {
    out.push({ t: "Lihat detail", f: go(`${URL_FORM_APPROVAL}?id=${encodeURIComponent(id)}&mode=view`) });
  }
  if (!out.length) out.push({ t: "Tidak ada aksi", disabled: true });
  return out;
}

window.openActionMenu = function (event, id) {
  event.stopPropagation();
  closeActionMenu();
  const item = Store.get(id);
  if (!item) return;
  const menu = document.createElement("div");
  menu.className = "action-menu";
  menuItems(item).forEach((m) => {
    if (m.disabled) {
      menu.insertAdjacentHTML("beforeend", `<div class="am-empty">${m.t}</div>`);
      return;
    }
    const b = document.createElement("button");
    b.type = "button";
    if (m.danger) b.className = "danger";
    b.textContent = m.t;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      closeActionMenu();
      m.f();
    });
    menu.appendChild(b);
  });
  document.body.appendChild(menu);
  const r = event.currentTarget.getBoundingClientRect();
  menu.style.top = window.scrollY + r.bottom + 4 + "px";
  menu.style.left = Math.max(8, window.scrollX + r.right - menu.offsetWidth) + "px";
};

async function hapusIds(ids) {
  if (!ids.length) return;
  if (!(await UI.confirm(`Hapus ${ids.length} dokumen Draft yang dipilih?`, { danger: true, ya: "Hapus", judul: "Hapus dokumen" }))) return;
  jalankan(() => Store.remove(ids), `${ids.length} dokumen dihapus`);
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
  document.querySelector(".data-table thead")?.addEventListener("change", (e) => {
    if (e.target.id !== "check-all") return;
    document.querySelectorAll("#table-body .row-checkbox:not(:disabled)").forEach((cb) => (cb.checked = e.target.checked));
    updateButtonAndCheckAllState();
  });
  byId("table-body")?.addEventListener("change", (e) => {
    if (e.target.classList.contains("row-checkbox")) updateButtonAndCheckAllState();
  });
}

function bindActionButton() {
  byId("btnPencairanBaru")?.addEventListener("click", () => {
    const selectedIds = Array.from(document.querySelectorAll("#table-body .row-checkbox:checked")).map((cb) => cb.value);
    if (selectedIds.length > 0) hapusIds(selectedIds); // mode Hapus; mode "Pencairan Baru" ditangani script di index.html
  });
}

function bindCategoryTabs() {
  const tabGroup = byId("kategoriTabs");
  tabGroup?.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    tabGroup.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.dataset.tab;
    applyFilters();
  });
}

window.resetDataDemo = async function () {
  if (!(await UI.confirm("Kembalikan semua data ke data awal? Semua perubahan Anda akan hilang.", { danger: true, ya: "Reset", judul: "Reset data demo" }))) return;
  Store.reset();
  docCurrentPage = 1;
  renderTable();
  UI.toast("Data dikembalikan ke data awal", "ok");
};

document.addEventListener("click", closeActionMenu);

document.addEventListener("DOMContentLoaded", () => {
  const aktif = document.querySelector("#kategoriTabs .tab-btn.active");
  if (aktif) activeTab = aktif.dataset.tab;
  bindFilters();
  bindPagination();
  bindSelection();
  bindActionButton();
  bindCategoryTabs();
  renderTable();
});

// Kembali dari halaman form (tombol Back / bfcache): muat ulang data terbaru
window.addEventListener("pageshow", (e) => {
  if (e.persisted) renderTable();
});

window.handleRowRedirect = function (event, url) {
  if (event.target.closest("input[type='checkbox']")) return;
  window.location.href = url;
};
