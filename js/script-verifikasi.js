// ==========================================================================
// VERIFIKASI / APPROVAL - interaksi halaman
// Dipakai oleh : form-verifikasi.html, form-approval.html
// Catatan      : fungsi bernama dipanggil lewat atribut onclick di HTML,
//                jadi harus tetap global.
// Isi file     : tab & accordion -> catatan perbaikan -> preview file
//                -> pembayaran -> modal rincian & status
// ==========================================================================

// ==========================================================================
// TAB & ACCORDION
// ==========================================================================

// Konten tab di panel tengah (id elemen: s5-content-<nama>).
// Konten "lainnya" sengaja tidak diatur di sini.
const S5_TAB_NAMES = ["ringkasan", "pajak", "jurnal", "pembayaran", "catatan"];

function switchs5Tab(tabId, element) {
  // Tombol ikon yang diklik menjadi aktif
  element
    .closest(".s5-middle-panel")
    .querySelectorAll(".s5-icon-btn")
    .forEach((tab) => tab.classList.remove("active"));
  element.classList.add("active");

  // Hanya konten tab terpilih yang tampil
  S5_TAB_NAMES.forEach((name) => {
    const content = document.getElementById(`s5-content-${name}`);
    if (content) content.style.display = name === tabId ? "block" : "none";
  });
}

function toggleS5Accordion(element) {
  const item = element.closest(".s5-acc-item");
  const detail = item.querySelector(".s5-acc-detail");
  const arrow = element.querySelector(".kw-arrow");
  const willExpand = !item.classList.contains("expanded");

  item.classList.toggle("expanded", willExpand);
  detail.style.display = willExpand ? "flex" : "none";
  arrow.style.transform = willExpand ? "rotate(90deg)" : "rotate(0deg)";
}

function toggleRow(element) {
  element.closest(".s5-accordion-item").classList.toggle("active");
}

// Level 1 (.tax-item) maupun level 2 (.objek-item)
function toggleAccordion(element) {
  const item = element.closest(".tax-item, .objek-item");
  if (item) item.classList.toggle("active");
}

function toggleBiaya(headerEl) {
  const item = headerEl.closest(".biaya-item");
  if (item) item.classList.toggle("expanded");
}

// Accordion kuitansi Badan Usaha
function togglekuitansi(e, headerElem) {
  if (e) e.stopPropagation();

  const item = headerElem.closest(".kuitansi-item");
  const detail = item.querySelector(".kw-detail");
  const arrow = item.querySelector(".kw-arrow");
  if (!detail) return;

  const isHidden = detail.style.display === "none" || !detail.style.display;
  detail.style.display = isHidden ? "block" : "none";
  if (arrow) arrow.style.transform = isHidden ? "rotate(90deg)" : "rotate(0deg)";
}

// ==========================================================================
// CATATAN PERBAIKAN PER DOKUMEN
// Setiap card file punya catatan sendiri; tombol "Minta Perbaikan" menandai
// card aktif, "Hapus Tanda Perbaikan" menghapus tandanya.
// ==========================================================================
function initRevisionNotes() {
  const fileCards = document.querySelectorAll(".file-item-card");
  const textarea = document.getElementById("revisionNote");
  const charCounter = document.getElementById("currentChar");
  const btnMinta = document.getElementById("btnMinta");
  const btnHapus = document.getElementById("btnHapus");

  // Data tiap card: { [index]: { note: string, needsRevision: boolean } }
  const fileDataStore = {};

  const getActiveCard = () => document.querySelector(".file-item-card.active-card");

  function updateCharCount() {
    if (charCounter && textarea) charCounter.textContent = textarea.value.length;
  }

  function setNote(value) {
    if (!textarea) return;
    textarea.value = value;
    updateCharCount();
  }

  function addRevisionBadge(card) {
    if (card.querySelector(".badge-perbaikan")) return;

    const badge = document.createElement("div");
    badge.className = "badge-perbaikan";
    badge.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Perlu perbaikan';
    card.appendChild(badge);
  }

  if (textarea) {
    textarea.addEventListener("input", updateCharCount);
    updateCharCount();
  }

  // Pilih file: tandai card aktif, perbarui judul preview, muat catatannya
  fileCards.forEach((card, index) => {
    card.dataset.index = index;

    // Card yang sudah punya badge di HTML dianggap perlu perbaikan
    const hasExistingBadge = card.querySelector(".badge-perbaikan") !== null;
    fileDataStore[index] = {
      needsRevision: hasExistingBadge,
      note: hasExistingBadge && textarea ? textarea.value : "",
    };

    card.addEventListener("click", () => {
      fileCards.forEach((c) => c.classList.remove("active-card"));
      card.classList.add("active-card");

      const fileName = card.querySelector(".fic-name")?.textContent || "File Name.pdf";
      const fileNamePreview = document.querySelector(".preview-toolbar .file-name");
      const noticeSpan = document.querySelector(".info-notice span");

      if (fileNamePreview) fileNamePreview.textContent = fileName;
      if (noticeSpan) {
        noticeSpan.textContent = `Catatan dan status hanya berlaku untuk ${fileName}.`;
      }

      setNote(fileDataStore[index]?.note || "");
    });
  });

  // Minta Perbaikan: simpan catatan + tampilkan badge pada card aktif
  btnMinta?.addEventListener("click", () => {
    const activeCard = getActiveCard();
    if (!activeCard) {
      alert("Silakan pilih salah satu dokumen terlebih dahulu.");
      return;
    }

    const note = textarea ? textarea.value.trim() : "";
    if (!note) {
      alert("Catatan perbaikan wajib diisi!");
      textarea?.focus();
      return;
    }

    fileDataStore[activeCard.dataset.index] = { needsRevision: true, note };
    addRevisionBadge(activeCard);
    // Kirim data / panggil API Anda di sini
    alert("Permintaan perbaikan berhasil dikirim!");
  });

  // Hapus Tanda Perbaikan: bersihkan data, badge, dan catatan
  btnHapus?.addEventListener("click", () => {
    const activeCard = getActiveCard();
    if (!activeCard) {
      alert("Silakan pilih dokumen terlebih dahulu.");
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus tanda perbaikan?")) return;

    fileDataStore[activeCard.dataset.index] = { needsRevision: false, note: "" };
    activeCard.querySelector(".badge-perbaikan")?.remove();
    setNote("");
  });
}

document.addEventListener("DOMContentLoaded", initRevisionNotes);

// ==========================================================================
// MODAL PREVIEW FILE (#filePreviewModal)
// ==========================================================================
function openFilePreviewModal() {
  const modal = document.getElementById("filePreviewModal");
  if (!modal) return;

  modal.classList.add("show");
  modal.style.display = "flex";
}

function closeFilePreviewModal() {
  const modal = document.getElementById("filePreviewModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("filePreviewModal");
  const closeBtn = document.querySelector(".modal-close-btn");

  // Tombol silang (x)
  closeBtn?.addEventListener("click", closeFilePreviewModal);

  // Klik area gelap di luar kotak modal
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeFilePreviewModal();
  });

  // Tombol ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFilePreviewModal();
  });
});

// ==========================================================================
// PEMBAYARAN
// ==========================================================================

// Tombol bergantian antara "Bank" dan "Cek"
function togglePayment(btn) {
  const textSpan = btn.querySelector(".btn-text");
  const isCek = btn.classList.toggle("is-cek");
  textSpan.textContent = isCek ? "Cek" : "Bank";
}

// ==========================================================================
// STATUS BARIS (warning -> success -> error)
// ==========================================================================
const STATUS_STATES = {
  warning: { btnClass: "status-warning", iconClass: "fa-solid fa-question" },
  success: { btnClass: "status-success", iconClass: "fa-solid fa-check" },
  error: { btnClass: "status-error", iconClass: "fa-solid fa-ban" },
};
const STATUS_CYCLE = ["warning", "success", "error"];

// Ubah class, ikon, dan atribut data-status sebuah tombol status
function updateStatusUI(btn, status) {
  if (!btn) return;

  const target = STATUS_STATES[status] || STATUS_STATES.warning;

  Object.values(STATUS_STATES).forEach((s) => btn.classList.remove(s.btnClass));
  btn.classList.add(target.btnClass);
  btn.innerHTML = `<i class="${target.iconClass}"></i>`;
  btn.setAttribute("data-status", status);
}

// Klik langsung pada tombol status: pindah ke status berikutnya
function handleStatusClick(e, btn) {
  if (e) e.stopPropagation();

  const current = btn.getAttribute("data-status") || "warning";
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
  updateStatusUI(btn, next);
}

// ==========================================================================
// MODAL RINCIAN (Perorangan / Badan Usaha)
// ==========================================================================

// Tombol status baris pemicu & modal yang sedang terbuka
let currentActiveStatusBtn = null;
let currentActiveModal = null;

// Template rincian kuitansi/invoice Badan Usaha
function buildBadanUsahaKwList() {
  return `
        <!-- Judul & Badge Kuitansi / Invoice -->


        <!-- HEADER ROW LABEL KOLOM -->
        <div class="kw-table-columns-header">
          <div style="width: 40px;"></div>
          <div style="width: 220px;">No kuitansi / Invoice</div>
          <div style="width: 100px;">Tanggal</div>
          <div style="width: 210px;">Nominal Invoice + PPN</div>
          <div style="width: 20px;"></div>
          <div style="width: 150px;">PPN</div>
          <div style="width: 130px;">Potongan PPh</div>
        </div>

        <div class="kw-scroll-list-area" style="max-height: 380px; overflow-y: auto; overflow-x: hidden; padding-right: 6px; display: flex; flex-direction: column; gap: 8px;">
          <div class="kuitansi-wrapper" style="display: flex; flex-direction: column; gap: 8px;">
            ${Array.from({ length: 10 })
              .map(
                (_, index) => `
              <div class="kuitansi-row-container">
                <div class="kuitansi-item">
                  <div class="kw-header" onclick="togglekuitansi(event, this)">
                    <button type="button" class="btn-toggle-arrow">
                      <i class="fas fa-chevron-right kw-arrow"></i>
                    </button>

                    <div class="kw-field kw-field-no">
                      <div class="input-container">
                        <input type="text" placeholder="Masukkan nomor kuitansi..." />
                      </div>
                    </div>

                    <div class="kw-field kw-field-date">
                      <div class="input-container">
                        <input type="date" value="2026-08-13" class="input-date-custom" />
                      </div>
                    </div>

                    <div class="kw-field kw-field-nominal">
                      <div class="input-container prefix-rp">
                        <span class="prefix">Rp.</span>
                        <input type="text" value="0,00" class="text-right" />
                      </div>
                    </div>

                    <div class="kw-icon-doc" onclick="openFakturPPNModal(this)">
                      <i class="fas fa-file-alt"></i>
                    </div>

                    <div class="kw-field kw-field-ppn">
                      <div class="input-container prefix-rp readonly">
                        <span class="prefix">Rp.</span>
                        <input type="text" value="0,00" class="text-right" readonly />
                      </div>
                    </div>

                    <div class="kw-field kw-field-pph">
                      <div class="input-container prefix-rp danger readonly">
                        <span class="prefix text-danger">Rp.</span>
                        <input type="text" value="0,00" class="text-right text-danger" readonly />
                      </div>
                    </div>
                  </div>

                  <div class="kw-detail" style="display: none;">
                    <div class="kw-detail-inner">
                      <div class="branch-icon">
                        <i class="branch-connector"></i>
                      </div>

                      <div class="biaya-detail-table">
                        <div class="kw-sub-row">
                          <div class="sub-col sub-col-code">
                            <input type="text" value="-" class="input-sub text-center" />
                          </div>
                          <div class="sub-col sub-col-name">
                            <input type="text" placeholder="Nama objek pajak..." class="input-sub" />
                          </div>
                          <div class="sub-col sub-col-code">
                            <input type="text" value="-" class="input-sub text-center" />
                          </div>

                          <div class="sub-col sub-col-dpp">
                            <span class="sub-label-head">DPP PPh</span>
                            <div class="input-sub-wrapper">
                              <span>Rp.</span>
                              <input type="text" value="0,00" class="input-sub text-right" />
                            </div>
                          </div>

                          <div class="sub-col sub-col-tarif">
                            <span class="sub-label-head">Tarif</span>
                            <input type="text" value="0 %" class="input-sub text-center font-bold" />
                          </div>

                          <div class="sub-col sub-col-potongan">
                            <span class="sub-label-head">Potongan PPh</span>
                            <div class="input-sub-wrapper danger">
                              <span class="text-danger">Rp.</span>
                              <input type="text" value="0,00" class="input-sub text-right text-danger" />
                            </div>
                          </div>

                          <div class="sub-col sub-col-action">
                            <button type="button" class="btn-sub-remove" onclick="this.closest('.kw-sub-row').remove()">
                              <i class="fas fa-minus-circle"></i>
                            </button>
                          </div>
                        </div>

                        <div class="kw-add-action">
                          <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                            <i class="far fa-plus-square"></i> Objek pajak
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>`,
              )
              .join("")}
          </div>
        </div>
      `;
}

// Template rincian kelompok biaya Perorangan
function buildPeroranganKwList() {
  const kelompokBiayaData = [
    { title: "Honor dan Jasa Perorangan" },
    { title: "Hadiah Royalti dan Sewa" },
    { title: "Pendapatan Bunga Deposito" },
    { title: "Penghasilan Usaha Perseorangan" },
    { title: "Penghasilan dari Jasa Profesional" },
    { title: "Pendapatan Sewa Properti" },
    { title: "Nama Kelompok Biaya" },
  ];

  return `
        <div class="biaya-wrapper" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="biaya-global-header" style="display: flex; justify-content: flex-end; padding: 4px 8px;">
            <div style="display: flex; gap: 12px;">
              <div style="width: 100px; text-align: left; padding-left: 2px;">Nominal</div>
              <div style="width: 100px; text-align: left; padding-left: 2px;">Potongan PPh</div>
            </div>
          </div>
          <div class="kw-scroll-list-area" style="max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            ${kelompokBiayaData
              .map(
                (item) => `
                <div class="biaya-item">
                  <div class="biaya-header" onclick="toggleBiaya(this)">
                    <div class="biaya-header-left">
                      <i class="fas fa-chevron-right biaya-arrow"></i>
                      <span class="biaya-title">${item.title}</span>
                    </div>
                    <div class="biaya-header-right">
                      <div class="biaya-field">
                        <div class="biaya-input-box readonly">
                          <span class="prefix">Rp.</span>
                          <input type="text" value="0,00" readonly class="text-right" />
                        </div>
                      </div>
                      <div class="biaya-field">
                        <div class="biaya-input-box danger readonly">
                          <span class="prefix text-danger">Rp.</span>
                          <input type="text" value="0,00" readonly class="text-right text-danger" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="biaya-detail">
                    <div class="biaya-detail-inner">
                      <div class="branch-icon"><i class="branch-connector"></i></div>
                      <div class="biaya-detail-table">
                        <div class="biaya-sub-row">
                          <div class="sub-col sub-col-nama">
                            <span class="sub-label-head">Nama Komponen</span>
                            <input type="text" placeholder="Nama Komponen" class="sub-input" />
                          </div>
                          <div class="sub-col sub-col-formula">
                            <span class="sub-label-head">Formula</span>
                            <input type="text" placeholder="Formula" class="sub-input" />
                          </div>
                          <div class="sub-col sub-col-nominal">
                            <span class="sub-label-head">Nominal</span>
                            <div class="sub-input-box">
                              <span class="prefix">Rp.</span>
                              <input type="text" value="0,00" class="sub-input-field text-right" />
                            </div>
                          </div>
                          <div class="sub-col sub-col-pph">
                            <span class="sub-label-head">Potongan PPh</span>
                            <div class="sub-input-box danger">
                              <span class="prefix text-danger">Rp.</span>
                              <input type="text" value="0,00" class="sub-input-field text-right text-danger" />
                            </div>
                          </div>
                          <div class="sub-col sub-col-btn">
                            <button type="button" class="btn-sub-del"><i class="fas fa-minus-circle"></i></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>`,
              )
              .join("")}
          </div>
        </div>
      `;
}

/**
 * Membuka modal rincian.
 * @param {Event} e - event klik
 * @param {string} modalId - "modalPerorangan" (default) atau "modalBadanUsaha"
 */
function openModal(e, modalId = "modalPerorangan") {
  if (e) e.stopPropagation();

  // 1. Simpan tombol status pada baris pemicu
  const trigger = e ? e.currentTarget : null;
  if (trigger) {
    const row = trigger.closest(".s5-list-row");
    currentActiveStatusBtn = row ? row.querySelector(".status-btn") : null;
  }

  // 2. Ambil modal
  const modal = document.getElementById(modalId);
  if (!modal) return;
  currentActiveModal = modal;

  const cardDetil = modal.querySelector("#cardDetilPerjalananDinas");
  const kwList = modal.querySelector(".kw-list");

  // 3. Isi sesuai jenis: Badan Usaha menyembunyikan detail perjalanan dinas
  if (modalId === "modalBadanUsaha") {
    if (cardDetil) cardDetil.style.display = "none";
    if (kwList) kwList.innerHTML = buildBadanUsahaKwList();
  } else {
    if (cardDetil) cardDetil.style.display = "block";
    if (kwList) kwList.innerHTML = buildPeroranganKwList();
  }

  // 4. Tampilkan
  modal.style.display = "flex";
}

// Tutup modal aktif; jika tidak ada, tutup semua .app-modal-overlay
function closeModal() {
  if (currentActiveModal) {
    currentActiveModal.style.display = "none";
    currentActiveModal = null;
  } else {
    document.querySelectorAll(".app-modal-overlay").forEach((m) => {
      m.style.display = "none";
    });
  }
}

// Klik area abu-abu di luar kotak modal Perorangan menutup popup
window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("modalPerorangan")) closeModal();
});

// Tombol Setuju / Tolak di modal: set status baris, lalu tutup
function handleSetuju() {
  updateStatusUI(currentActiveStatusBtn, "success");
  closeModal();
}

function handleTolak() {
  updateStatusUI(currentActiveStatusBtn, "error");
  closeModal();
}