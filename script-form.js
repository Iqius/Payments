/* ========================================================================= */
/* EXISTING FORM LOGIC (KEPT INTACT)                                         */
/* ========================================================================= */
function selectSumberAnggaran(type) {
  // 1. Ganti active class pada kartu filter
  document
    .querySelectorAll(".select-card")
    .forEach((card) => card.classList.remove("selected"));

  const targetCard = document.getElementById(`card-${type}`);
  if (targetCard) targetCard.classList.add("selected");

  // 2. Kirim 2 argumen: array data + tipe kategorinya
  renderAnggaranList(anggaranData, type);
}

// 4. Handler Pemilihan Item List (Radio Behavior)
function selectAnggaranItem(element) {
  const selectedId = element.getAttribute("data-id");

  // Update status di array data
  anggaranData.forEach((item) => {
    item.terpilih = item.id === selectedId;
  });

  // Update styling aktif di tampilan
  document
    .querySelectorAll("#list-anggaran-container .list-item")
    .forEach((el) => {
      el.classList.remove("selected");
    });
  element.classList.add("selected");
}

function renderDetilPerjalananHTML() {
  return `
        <!-- Card Detil Perjalanan Dinas -->
        <div class="detil-perjalanan-card" style="background-color: #eaf5fc; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; border: 1px solid #d0e7f7;">
            <div style="font-weight: 700; font-size: 14px; color: #2d3748; margin-bottom: 12px;">Detil perjalanan dinas</div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; font-size: 12px; color: #4a5568;">
                <!-- Kolom 1: Jenis & Transportasi -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="width: 100px; color: #718096;">Jenis Perjalanan</span>
                        <span style="font-weight: 600; color: #2d3748;">Luar kota</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="width: 100px; color: #718096;">Transportasi</span>
                        <div style="display: inline-flex; align-items: center; gap: 8px; background: #ffffff; border: 1.5px solid #1d6fbf; color: #1d6fbf; padding: 4px 12px; border-radius: 8px; font-weight: 600;">
                            <i class="fas fa-train"></i>
                            <span>Kereta Api</span>
                            <i class="fas fa-check-circle" style="color: #1d6fbf; font-size: 12px;"></i>
                        </div>
                    </div>
                </div>

                <!-- Kolom 2: Tanggal -->
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; gap: 8px;">
                        <span style="color: #718096; width: 110px;">Tanggal Berangkat</span>
                        <span style="font-weight: 500;">01 Agustus 2026</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <span style="color: #718096; width: 110px;">Tanggal Kembali</span>
                        <span style="font-weight: 500;">05 Agustus 2026</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <span style="color: #718096; width: 110px;">Durasi Perjalanan</span>
                        <span style="font-weight: 500;">5 Hari</span>
                    </div>
                </div>

                <!-- Kolom 3: Highlight Durasi -->
                <div style="text-align: center; padding: 0 16px;">
                    <div style="color: #718096; font-size: 11px; margin-bottom: 4px;">Durasi Perjalanan</div>
                    <div style="font-size: 20px; font-weight: 700; color: #1a202c;">5 Hari</div>
                </div>

                <!-- Kolom 4: Rute Kota -->
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; gap: 8px;">
                        <span style="color: #718096; width: 80px;">Kota Asal</span>
                        <span style="font-weight: 500;">Jakarta</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <span style="color: #718096; width: 80px;">Kota Tujuan</span>
                        <span style="font-weight: 500;">Denpasar</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <span style="color: #718096; width: 80px;">Kota Kembali</span>
                        <span style="font-weight: 500;">Jakarta</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function selectSkema(type) {
  document.getElementById("skema-pembayaran").classList.remove("selected");
  document.getElementById("skema-persekot").classList.remove("selected");
  document.getElementById(`skema-${type}`).classList.add("selected");

  if (type === "persekot") {
    document.getElementById("dynamic-persekot").style.display = "flex";
  } else {
    document.getElementById("dynamic-persekot").style.display = "none";
  }
}
// Konfigurasi alur form dan label stepper
const FLOWS_CONFIG = {
  operasional: [
    { targetWrapper: 1, label: "Sumber Anggaran & Kegiatan" },
    { targetWrapper: 2, label: "Dokumen Pendukung" },
    { targetWrapper: 4, label: "Rincian Biaya" },
    { targetWrapper: 5, label: "Review & Submit" },
  ],
  perjalanan_dinas: [
    { targetWrapper: 1, label: "Sumber Anggaran & Kegiatan" },
    { targetWrapper: 2, label: "Dokumen Pendukung" },
    { targetWrapper: 3, label: "Detil Perjalanan" },
    { targetWrapper: 4, label: "Rincian Biaya" },
    { targetWrapper: 5, label: "Review & Submit" },
  ],
};

let currentType = "operasional";
let currentIndex = 0;

// Inisialisasi saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get("type");
  const titleEl = document.getElementById("header-title");

  if (typeParam === "perjalanan_dinas") {
    currentType = "perjalanan_dinas";
    document.title = "Form Perjalanan Dinas";
    if (titleEl) titleEl.textContent = "Perjalanan Dinas";
  } else {
    currentType = "operasional";
    document.title = "Form Operasional Umum";
    if (titleEl) titleEl.textContent = "Operasional Umum";
  }

  render();
});

function nextStep() {
  const activeFlow = FLOWS_CONFIG[currentType];
  if (currentIndex < activeFlow.length - 1) {
    currentIndex++;
    render();
    updateFooter();
  }
}

function prevStep() {
  if (currentIndex > 0) {
    currentIndex--;
    render();
    updateFooter();
  }
}

function render() {
  const activeFlow = FLOWS_CONFIG[currentType];
  const stepperContainer = document.getElementById("stepper-wrapper");

  // 1. Generate struktur HTML Stepper (Circle, Label, Line) secara dinamis
  if (stepperContainer) {
    let stepperHtml = "";
    activeFlow.forEach((step, idx) => {
      const stepNumber = idx + 1;
      let stepClass = "step";
      let circleContent = stepNumber.toString();
      let lineClass = "line";

      if (idx < currentIndex) {
        stepClass += " completed step-completed";
        circleContent = '<i class="fas fa-check"></i>';
        lineClass += " completed-line line-active";
      } else if (idx === currentIndex) {
        stepClass += " active";
      }

      stepperHtml += `
        <div class="${stepClass}">
          <div class="circle">${circleContent}</div>
          <div class="label">${step.label}</div>
        </div>
      `;

      // Buat garis penghubung kecuali di step paling akhir
      if (idx < activeFlow.length - 1) {
        stepperHtml += `<div class="${lineClass}"></div>`;
      }
    });

    stepperContainer.innerHTML = stepperHtml;
  }

  // 2. Sembunyikan semua wrapper form lama (1 s/d 5)
  for (let i = 1; i <= 5; i++) {
    const wrap = document.getElementById(`step-${i}-wrapper`);
    if (wrap) wrap.style.display = "none";
  }

  // 3. Tampilkan hanya wrapper step yang aktif
  const targetWrapperId = activeFlow[currentIndex].targetWrapper;
  const activeWrap = document.getElementById(`step-${targetWrapperId}-wrapper`);
  if (activeWrap) {
    activeWrap.style.display = "flex";
  }
}

function simpanDraft() {
  const toast = document.getElementById("toastNotification");
  toast.classList.remove("hidden");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 3000);
}

document
  .getElementById("btnTambahRincian")
  ?.addEventListener("click", function () {
    document.getElementById("modalTambahRincian").classList.remove("hidden");
  });
document
  .getElementById("closeRincianModal")
  ?.addEventListener("click", function () {
    document.getElementById("modalTambahRincian").classList.add("hidden");
  });

/* ========================================================================= */
/* NEW LOGIC: MODAL REKENING & STEP 3 DATA POPULATION                        */
/* ========================================================================= */

// Open Rekening Modal from Rincian list
function openRekeningModal() {
  document.getElementById("modalTambahRincian").classList.add("hidden");
  document.getElementById("modalRekening").classList.remove("hidden");
}

// Close Rekening Modal
function closeRekeningModal() {
  const modalRekening = document.getElementById("modalRekening");
  if (modalRekening) modalRekening.classList.add("hidden");

  // HANYA buka kembali modal Rincian jika sebelumnya dibuka dari list rincian
  if (isOpenedFromRincianList) {
    const modalRincian = document.getElementById("modalTambahRincian");
    if (modalRincian) modalRincian.classList.remove("hidden");
  }

  // Reset flag
  isOpenedFromRincianList = false;
}

// Switch between Rekening Sources in the Modal (Terdaftar, Referensi, Baru)
function switchRekeningSource(source) {
  // 1. Manage Active Class on Radio Cards
  document
    .querySelectorAll(".rek-radio-card")
    .forEach((card) => card.classList.remove("active"));
  document.getElementById(`rek-radio-${source}`).classList.add("active");

  // 2. Hide all Views, show selected View
  document.querySelectorAll(".rek-view-panel").forEach((panel) => {
    panel.classList.remove("active");
  });
  document.getElementById(`rek-view-${source}`).classList.add("active");
}

// Hit Simpan in Rekening Modal -> Populates Step 3
function simpanRekening() {
  document.getElementById("modalRekening").classList.add("hidden");

  // Hide original empty states
  document.getElementById("s4-left-empty").style.display = "none";
  document.querySelector(".search-box-wrapper").style.display = "none"; // Optional: hide search box based on mockup
  document.getElementById("s4-right-empty").style.display = "none";

  // Show new populated views
  document.getElementById("s4-left-populated").style.display = "flex";
  document.getElementById("s4-right-populated").style.display = "flex";

  // Default switch to first tab
  switchStep3Tab("toyota", document.querySelector(".s4-pop-item"));
}

// Switch Right Panel based on Left List item clicked
function switchStep3Tab(type, el) {
  // Handle Active state
  document
    .querySelectorAll(".s3-pop-item")
    .forEach((item) => item.classList.remove("active"));
  if (el) el.classList.add("active");

  const kwList = document.getElementById("kuitansi-list-container");
  kwList.innerHTML = ""; // clear
  setTipePenerima(type);

  if (type === "toyota") {
    const title = document.getElementById("dyn-title");
    const subtitle = document.getElementById("dyn-subtitle");
    const kode = document.getElementById("dyn-kode");
    const badge = document.getElementById("dyn-badge");
    const bannerCard = document.querySelector(".sdh-banner-card");
    const extraBadge = document.getElementById("container-extra-badge");
    const cardDetil = document.getElementById("cardDetilPerjalananDinas");
    if (cardDetil) {
      cardDetil.style.display = "none";
    }
    if (extraBadge) {
      // Tipe Toyota mengambil badge ini
      extraBadge.innerHTML = `<span class="kw-badge-count" >10 Kuitansi</span>`;
    }
    if (title) title.innerText = "PT Toyota Motor Manufacturing Indonesia";
    if (subtitle) subtitle.innerText = "Ahmad Rizki Pratama";
    if (kode) kode.innerText = "RC100000470";
    if (badge) {
      badge.innerText = "Badan Usaha";
      badge.className = "dyn-badge badge-badan-usaha";
    }
    if (bannerCard) {
      bannerCard.className = "sdh-banner-card theme-badan-usaha";
    }

    kwList.innerHTML = `

  <!-- HEADER ROW LABEL KOLOM -->
<div class="kw-table-columns-header" >
  <div style="width: 24px;"></div>
  <div style="flex: 1.5;">No kuitansi / Invoice</div>
  <div style="width: 130px;">Tanggal</div>
  <div style="width: 150px;">Nominal Invoice + PPN</div>
  <div style="width: 20px;"></div>
  <div style="width: 130px;">PPN</div>
  <div style="width: 130px;">Potongan PPh</div>
</div>
<div class="kw-scroll-list-area" style="max-height: 420px; overflow-y: auto; overflow-x: hidden; padding-right: 6px; display: flex; flex-direction: column; gap: 8px;">
  <!-- Container kuitansi (HTML ASLI DIBIARKAN) -->
  <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
  <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
    <div class="kuitansi-wrapper">
    
    <div class="kuitansi-row-container">
      <!-- Card Utama (Default Tertutup / Collapsed) -->
      <div class="kuitansi-item">
        
        <!-- Header Row Baris kuitansi -->
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
              <span class="prefix">Rp.</span>
              <input type="text" value="0,00" class="text-right text-danger" readonly />
            </div>
          </div>
        </div>

        <!-- Detail Box (Disembunyikan di awal lewat CSS/inline style) -->
        <div class="kw-detail" style="display: none;">
          <div class="kw-detail-inner">
            <div class="branch-icon">
              <i class="branch-connector"></i>
            </div>

            <div class="biaya-detail-table">
              <!-- Row Sub 1 -->
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
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Row Sub 2 -->
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
                  <div class="input-sub-wrapper">
                    <span>Rp.</span>
                    <input type="text" value="0,00" class="input-sub text-right" />
                  </div>
                </div>
                <div class="sub-col sub-col-tarif"></div>
                <div class="sub-col sub-col-potongan"></div>

                <div class="sub-col sub-col-action">
                  <button type="button" class="btn-sub-remove"><i class="fas fa-minus-circle"></i></button>
                </div>
              </div>

              <!-- Add Row Button -->
              <div class="kw-add-action">
                <button type="button" class="btn-add-sub" onclick="openObjekPajakModal(this)">
                  <i class="far fa-plus-square"></i> Objek pajak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Baris -->
      <button type="button" class="btn-remove-row" title="Hapus kuitansi">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
  </div>
    `;

    // MENGHITUNG OTOMATIS JUMLAH ROW kuitansi
    const totalkuitansi = kwList.querySelectorAll(
      ".kuitansi-row-container",
    ).length;
    const badgeEl = document.getElementById("kw-total-badge");
    if (badgeEl) {
      badgeEl.innerText = `${totalkuitansi} Kuitansi`;
    }
  } else if (type === "siti") {
    const title = document.getElementById("dyn-title");
    const subtitle = document.getElementById("dyn-subtitle");
    const kode = document.getElementById("dyn-kode");
    const badge = document.getElementById("dyn-badge");
    const bannerCard = document.querySelector(".sdh-banner-card");
    const extraBadge = document.getElementById("container-extra-badge");
    const urlParams = new URLSearchParams(window.location.search);
    const flowType = urlParams.get("type");
    const isPerjalananDinas = flowType === "perjalanan_dinas";
    const cardDetil = document.getElementById("cardDetilPerjalananDinas");

    // Tampilkan kartu jika alur perjalanan dinas, sembunyikan jika bukan
    if (cardDetil) {
      cardDetil.style.display = isPerjalananDinas ? "block" : "none";
    }
    if (extraBadge) {
      extraBadge.innerHTML = "";
    }
    if (title) title.innerText = "Siti Rahmawati";
    if (subtitle) subtitle.innerText = "Kementrian Sosial";
    if (kode) kode.innerText = "EJ15000156";
    if (badge) {
      badge.innerText = "Perorangan";
      badge.className = "dyn-badge badge-perorangan";
    }
    if (bannerCard) {
      bannerCard.className = "sdh-banner-card theme-perorangan";
    }

    // Pastikan container utama tidak scroll dan menjadi layout flex kolom
    if (kwList) {
      kwList.style.overflow = "hidden";
      kwList.style.display = "flex";
      kwList.style.flexDirection = "column";
    }

    // Data 7 kelompok biaya
    const kelompokBiayaData = [
      { title: "Honor dan Jasa Perorangan" },
      { title: "Hadiah Royalti dan Sewa" },
      { title: "Pendapatan Bunga Deposito" },
      { title: "Penghasilan Usaha Perseorangan" },
      { title: "Penghasilan dari Jasa Profesional" },
      { title: "Pendapatan Sewa Properti" },
      { title: "Nama Kelompok Biaya" },
    ];

    // Render HTML: Header di luar area scroll
    kwList.innerHTML = `    
        <div class="biaya-wrapper" style="display: flex; flex-direction: column; height: 100%; max-height: 100%; overflow: hidden; gap: 8px;">
            <!-- 1. HEADER TETAP DI LUAR (TIDAK AKAN TERTEMBUS KARENA BUKAN AREA SCROLL) -->
            <div class="biaya-global-header" >
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 12px;">
                    <div style="width: 100px; text-align: left; padding-left: 2px;">Nominal</div>
                    <div style="width: 100px; text-align: left; padding-left: 2px;">Potongan PPh</div>
                </div>
            </div>
            
            <!-- 2. HANYA AREA INI YANG MENJADI SCROLL (TIDAK AKAN LEWAT KE ATAS HEADER) -->
            <div class="kw-scroll-list-area" style="flex: 1; overflow-y: auto; overflow-x: hidden; padding-right: 4px; display: flex; flex-direction: column; gap: 8px;">
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

                        <!-- Detail Box Component -->
                        <div class="biaya-detail">
                            <div class="biaya-detail-inner">
                                <div class="branch-icon">
                                    <i class="branch-connector"></i>
                                </div>

                                <div class="biaya-detail-table">
                                    <!-- Row 1 -->
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

                                    <!-- Row 2 -->
                                    <div class="biaya-sub-row">
                                        <div class="sub-col sub-col-nama">
                                            <input type="text" placeholder="Nama Komponen" class="sub-input" />
                                        </div>
                                        <div class="sub-col sub-col-formula"></div>
                                        <div class="sub-col sub-col-nominal">
                                            <div class="sub-input-box">
                                                <span class="prefix">Rp.</span>
                                                <input type="text" value="0,00" class="sub-input-field text-right" />
                                            </div>
                                        </div>
                                        <div class="sub-col sub-col-pph">
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
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
    `;
  }
}

// Toggle accordion logic for kuitansi Item
function togglekuitansi(event, headerEl) {
  // Cegah buka/tutup saat user sedang mengetik di form
  if (event.target.tagName === "INPUT") return;

  const item = headerEl.closest(".kuitansi-item");
  const arrow = headerEl.querySelector(".kw-arrow");
  const detail = item.querySelector(".kw-detail");
  const rowContainer = item.closest(".kuitansi-row-container");

  const isClosed =
    detail.style.display === "none" || !item.classList.contains("expanded");

  if (isClosed) {
    // Buka detail
    item.classList.add("expanded");
    detail.style.display = "block";
    arrow.style.transform = "rotate(180deg)";
    rowContainer.style.alignItems = "flex-start";
  } else {
    // Tutup detail
    item.classList.remove("expanded");
    detail.style.display = "none";
    arrow.style.transform = "rotate(0deg)";
    rowContainer.style.alignItems = "center";
  }
}

function toggleBiaya(headerEl) {
  const item = headerEl.closest(".biaya-item");
  item.classList.toggle("expanded");
}
function setTipePenerima(type) {
  const titleBadan = document.getElementById("titleBadanUsaha");
  const dropdownPerorangan = document.getElementById("dropdownPerorangan");
  const btnText = document.getElementById("btnAddText");

  if (type === "siti") {
    // Mode Siti (Perorangan): Dropdown + Tambah Komponen Biaya
    if (titleBadan) titleBadan.style.display = "none";
    if (dropdownPerorangan) dropdownPerorangan.style.display = "block";
    if (btnText) btnText.textContent = "Tambah Komponen Biaya";
  } else if (type === "toyota") {
    // Mode Toyota (Badan Usaha): Daftar kuitansi + Tambah kuitansi / Invoice
    if (titleBadan) titleBadan.style.display = "block";
    if (dropdownPerorangan) dropdownPerorangan.style.display = "none";
    if (btnText) btnText.textContent = "Tambah kuitansi / Invoice";
  }
}

function handleTambah() {
  const dropdownPerorangan = document.getElementById("dropdownPerorangan");
  const isSiti =
    dropdownPerorangan && dropdownPerorangan.style.display !== "none";

  if (isSiti) {
    // Logika Tambah Komponen Biaya (Siti - Perorangan)
    const selectEl = document.querySelector(".kw-select-kategori");
    const selectedKategori = selectEl ? selectEl.value : "";

    console.log("Tambah Komponen Biaya untuk kategori:", selectedKategori);
    // Jalankan fungsi tambah sub-komponen biaya di sini
  } else {
    // Logika Tambah kuitansi (Toyota - Badan Usaha)
    console.log("Tambah Baris kuitansi / Invoice baru");
    // Jalankan fungsi tambah kuitansi/invoice di sini
  }
}
let currentActiveTargetRow = null;

// Buka Modal
function openObjekPajakModal(triggerBtn) {
  currentActiveTargetRow = triggerBtn
    ? triggerBtn.closest(".biaya-sub-row, .kuitansi-item")
    : null;
  const modal = document.getElementById("modalObjekPajak");
  if (modal) modal.style.display = "flex";
}

// Tutup Modal
function closeObjekPajakModal() {
  const modal = document.getElementById("modalObjekPajak");
  if (modal) modal.style.display = "none";
}

// Handler Pilih Item dari Modal ke Form
function selectTaxItem(code, name, rate) {
  console.log("Dipilih:", code, name, rate);

  // Jika tombol trigger berasal dari sub-row tertentu, auto-fill inputnya:
  if (currentActiveTargetRow) {
    const inputNama = currentActiveTargetRow.querySelector(
      '.sub-input[placeholder*="Nama"], input[placeholder*="Nama"]',
    );
    if (inputNama) inputNama.value = name;
  }

  closeObjekPajakModal();
}

// Filter Tab
function switchTaxTab(btnEl, category) {
  document
    .querySelectorAll(".tax-tab")
    .forEach((btn) => btn.classList.remove("active"));
  btnEl.classList.add("active");
}

// Filter Pencarian Input
function filterTaxList() {
  const input = document.getElementById("searchTaxInput").value.toLowerCase();
  const rows = document.querySelectorAll(".tax-row-item");

  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(input) ? "flex" : "none";
  });
}

let currentkuitansiRow = null;

// Buka Modal Faktur PPN
function openFakturPPNModal(triggerEl) {
  // Ambil referensi baris kuitansi tempat ikon diklik
  currentkuitansiRow = triggerEl ? triggerEl.closest(".kuitansi-item") : null;

  if (currentkuitansiRow) {
    // Sinkronisasi otomatis nomor kuitansi & nominal jika sudah diinput di card
    const inputNoKw = currentkuitansiRow.querySelector(".kw-field-no input");
    const inputNominal = currentkuitansiRow.querySelector(
      ".kw-field-nominal input",
    );

    if (inputNoKw && inputNoKw.value) {
      document.getElementById("ppnNokuitansi").value = inputNoKw.value;
    }
    if (inputNominal && inputNominal.value) {
      document.getElementById("ppnNilaiInvoice").value =
        "Rp " + inputNominal.value;
    }
  }

  const modal = document.getElementById("modalFakturPPN");
  if (modal) modal.style.display = "flex";
}

// Tutup / Simpan Modal Faktur PPN
function saveFakturPPN() {
  const modal = document.getElementById("modalFakturPPN");
  if (modal) modal.style.display = "none";
  console.log("Data Faktur PPN Tersimpan");
}

// Hapus Faktur PPN
function deleteFakturPPN() {
  if (confirm("Apakah Anda yakin ingin menghapus data faktur ini?")) {
    const modal = document.getElementById("modalFakturPPN");
    if (modal) modal.style.display = "none";
    console.log("Data Faktur PPN Dihapus");
  }
}

// Toggle Buka / Tutup Dropdown
function toggleTransaksiDropdown(event) {
  event.stopPropagation();
  const wrapper = document.getElementById("transaksiDropdownWrapper");
  if (wrapper) wrapper.classList.toggle("open");
}

// Handler Saat Salah Satu Opsi Dipilih
function gantiTipeTransaksi(tipe) {
  const triggerCard = document.querySelector(".s3-trigger-card");
  const titleEl = document.getElementById("selectedTransaksiTitle");
  const iconEl = document.getElementById("selectedTransaksiIcon");
  const cardDasar = document.getElementById("cardDasarPerjalanan");
  const wrapper = document.getElementById("transaksiDropdownWrapper");

  const formDomestik = document.getElementById("kontenKiriDalamNegeri");
  const ruteDomestik = document.getElementById("boxRuteDalamNegeri");

  const formInternasional = document.getElementById("kontenKiriLuarNegeri");
  const ruteInternasional = document.getElementById("boxRuteLuarNegeri");

  if (tipe === "luar_negeri") {
    // 1. Update UI Header Card
    if (titleEl) titleEl.innerText = "Luar Negeri";
    if (iconEl) iconEl.innerHTML = '<i class="fas fa-globe"></i>';
    if (triggerCard)
      triggerCard.className = "transaksi-card card-luar-negeri s3-trigger-card";
    if (cardDasar) cardDasar.classList.add("theme-luar-negeri");

    // 2. Tampilkan Luar Negeri & Aktifkan Inputnya
    formInternasional.style.display = "block";
    ruteInternasional.style.display = "block";
    toggleInputs(formInternasional, true);
    toggleInputs(ruteInternasional, true);

    // 3. Sembunyikan Dalam Negeri & Matikan Inputnya
    formDomestik.style.display = "none";
    ruteDomestik.style.display = "none";
    toggleInputs(formDomestik, false);
    toggleInputs(ruteDomestik, false);
  } else {
    // 1. Update UI Header Card
    if (titleEl) titleEl.innerText = "Dalam Negeri";
    if (iconEl) iconEl.innerHTML = '<i class="fas fa-globe-asia"></i>';
    if (triggerCard)
      triggerCard.className =
        "transaksi-card card-dalam-negeri s3-trigger-card";
    if (cardDasar) cardDasar.classList.remove("theme-luar-negeri");

    // 2. Tampilkan Dalam Negeri & Aktifkan Inputnya
    formDomestik.style.display = "block";
    ruteDomestik.style.display = "block";
    toggleInputs(formDomestik, true);
    toggleInputs(ruteDomestik, true);

    // 3. Sembunyikan Luar Negeri & Matikan Inputnya
    formInternasional.style.display = "none";
    ruteInternasional.style.display = "none";
    toggleInputs(formInternasional, false);
    toggleInputs(ruteInternasional, false);
  }

  // Tutup dropdown
  if (wrapper) wrapper.classList.remove("open");
}

// Tutup Dropdown jika pengguna klik di luar area
document.addEventListener("click", function (e) {
  const wrapper = document.getElementById("transaksiDropdownWrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    wrapper.classList.remove("open");
  }
});

// Menonaktifkan input di kontainer yang disembunyikan
function toggleInputs(container, isEnabled) {
  const inputs = container.querySelectorAll("input, select, textarea");
  inputs.forEach((el) => {
    el.disabled = !isEnabled;
  });
}

function resetChoice(container) {
  // Menghapus status active atau mereset value
  const activeItems = container.querySelectorAll(".active");
  activeItems.forEach((item) => item.classList.remove("active"));
}

// Pilihan Kartu Kategori Hijau
function selectCardGreen(el) {
  const parent = el.parentElement;
  parent.querySelectorAll(".s3-choice-card-green").forEach((c) => {
    c.classList.remove("active");
    const chk = c.querySelector(".check-icon-green");
    if (chk) chk.remove();
  });
  el.classList.add("active");
  const title = el.querySelector(".choice-title");
  if (title && !title.querySelector(".check-icon-green")) {
    title.insertAdjacentHTML(
      "afterbegin",
      '<i class="fas fa-check check-icon-green"></i> ',
    );
  }
}

// Pilihan Pill Transport Hijau
function selectPillGreen(element) {
  // 1. Cari parent pembungkusnya
  const container = element.parentElement;
  if (!container) return;

  // 2. Hapus class 'active' dan hapus icon centang lama dari semua tombol
  container.querySelectorAll(".s3-btn-pill-green").forEach((btn) => {
    btn.classList.remove("active");
    const icon = btn.querySelector(".check-icon-transport");
    if (icon) icon.remove();
  });

  // 3. Tambahkan class 'active' pada tombol yang diklik
  element.classList.add("active");

  // 4. Sisipkan icon centang di awal teks tombol yang baru diklik
  element.insertAdjacentHTML(
    "afterbegin",
    '<i class="fas fa-check check-icon-transport" style="margin-right: 6px;"></i>',
  );
}

// Master Switcher 3 Mode Transaksi
function gantiTipeTransaksi(tipe) {
  const triggerCard = document.querySelector(".s3-trigger-card");
  const titleEl = document.getElementById("selectedTransaksiTitle");
  const iconEl = document.getElementById("selectedTransaksiIcon");
  const cardDasar = document.getElementById("cardDasarPerjalanan");
  const wrapper = document.getElementById("transaksiDropdownWrapper");

  // Konten Kiri
  const kDom = document.getElementById("kontenKiriDalamNegeri");
  const kInt = document.getElementById("kontenKiriLuarNegeri");
  const kDin = document.getElementById("kontenKiriKegiatanDinas");

  // Rute Kanan
  const rDom = document.getElementById("boxRuteDalamNegeri");
  const rInt = document.getElementById("boxRuteLuarNegeri");
  const rDin = document.getElementById("boxRuteKegiatanDinas");

  // Akomodasi vs Tempat Kegiatan
  const akomodasiBox = document.querySelector(".s3-box-akomodasi");
  const tempatKegiatanBox = document.getElementById("boxTempatKegiatan");

  // Reset Semua Tampilan
  [kDom, kInt, kDin, rDom, rInt, rDin].forEach((el) => {
    if (el) el.style.display = "none";
  });
  if (cardDasar)
    cardDasar.classList.remove("theme-luar-negeri", "theme-kegiatan-dinas");

  if (tipe === "luar_negeri") {
    titleEl.innerText = "Luar Negeri";
    iconEl.innerHTML = '<i class="fas fa-globe"></i>';
    triggerCard.className = "transaksi-card card-luar-negeri s3-trigger-card";
    cardDasar.classList.add("theme-luar-negeri");

    kInt.style.display = "block";
    rInt.style.display = "block";
    if (akomodasiBox) akomodasiBox.style.display = "block";
    if (tempatKegiatanBox) tempatKegiatanBox.style.display = "none";
  } else if (tipe === "kegiatan_dinas") {
    titleEl.innerText = "Kegiatan Kedinasan";
    iconEl.innerHTML = '<i class="far fa-calendar-check"></i>';
    triggerCard.className =
      "transaksi-card card-kegiatan-dinas s3-trigger-card";
    cardDasar.classList.add("theme-kegiatan-dinas");

    kDin.style.display = "block";
    rDin.style.display = "block";
    if (akomodasiBox) akomodasiBox.style.display = "none";
    if (tempatKegiatanBox) tempatKegiatanBox.style.display = "block";
  } else {
    // Default: Dalam Negeri
    titleEl.innerText = "Dalam Negeri";
    iconEl.innerHTML = '<i class="fas fa-globe-asia"></i>';
    triggerCard.className = "transaksi-card card-dalam-negeri s3-trigger-card";

    kDom.style.display = "block";
    rDom.style.display = "block";
    if (akomodasiBox) akomodasiBox.style.display = "block";
    if (tempatKegiatanBox) tempatKegiatanBox.style.display = "none";
  }

  if (wrapper) wrapper.classList.remove("open");
}

function selectModaS3(cardEl) {
  // Cegah event bubbling
  if (window.event) window.event.stopPropagation();

  // 1. Cari container grid pembungkusnya
  const gridContainer = cardEl.closest(".s3-moda-grid");
  if (!gridContainer) return;

  // 2. Hapus class 'active' dan ikon centang dari SEMUA kartu di dalam grid
  gridContainer.querySelectorAll(".s3-moda-card").forEach((card) => {
    card.classList.remove("active");
    const existingCheck = card.querySelector(".check-moda");
    if (existingCheck) {
      existingCheck.remove();
    }
  });

  // 3. Tambahkan class 'active' ke kartu yang diklik
  cardEl.classList.add("active");

  // 4. Tambahkan ikon centang baru ke kartu yang diklik
  const checkIcon = document.createElement("i");
  checkIcon.className = "fas fa-check-circle check-moda";
  cardEl.appendChild(checkIcon);

  console.log("Moda dipilih:", cardEl.innerText.trim());
}

function selectAkomodasiS3(cardEl) {
  // 1. Ambil container list pembungkusnya
  const parentList = cardEl.closest(".s3-akomodasi-list");
  if (!parentList) return;

  // 2. Hapus class 'active' dari semua opsi akomodasi
  parentList.querySelectorAll(".s3-akomodasi-card").forEach((card) => {
    card.classList.remove("active");
  });

  // 3. Tambahkan class 'active' ke kartu yang sedang diklik
  cardEl.classList.add("active");

  console.log(
    "Akomodasi dipilih:",
    cardEl.querySelector("span:last-child").innerText.trim(),
  );
}

function selectPillOptionS3(buttonEl) {
  const container = buttonEl.parentElement;
  if (!container) return;

  // 1. Reset status aktif & hapus icon centang dari semua tombol di grupnya
  container.querySelectorAll(".s3-btn-pill-choice").forEach((btn) => {
    btn.classList.remove("active");
    const existingIcon = btn.querySelector(".fa-check");
    if (existingIcon) existingIcon.remove();
  });

  // 2. Aktifkan tombol yang diklik
  buttonEl.classList.add("active");

  // 3. Sisipkan icon centang di tombol yang aktif
  buttonEl.insertAdjacentHTML(
    "afterbegin",
    '<i class="fas fa-check" style="margin-right: 6px;"></i>',
  );
}

function selectCardOptionS3(cardEl) {
  const container = cardEl.parentElement;
  if (!container) return;

  // 1. Reset class active dari semua opsi di grup
  container
    .querySelectorAll(".s3-choice-card, .s3-choice-card-full")
    .forEach((card) => {
      card.classList.remove("active");

      // Hapus ikon centang lama jika ada
      const oldCheck = card.querySelector(".check-icon");
      if (oldCheck) oldCheck.remove();
    });

  // 2. Aktifkan kartu yang diklik
  cardEl.classList.add("active");

  // 3. Tambahkan ikon centang baru ke dalam .choice-title (khusus s3-choice-card)
  const titleEl = cardEl.querySelector(".choice-title");
  if (titleEl && !titleEl.querySelector(".check-icon")) {
    titleEl.insertAdjacentHTML(
      "afterbegin",
      '<i class="fas fa-check check-icon" style="margin-right: 6px;"></i>',
    );
  }
}

function selectTujuanPurple(cardEl) {
  const container = cardEl.parentElement;
  if (!container) return;

  // 1. Reset class active dari semua kartu tujuan ungu
  container.querySelectorAll(".s3-choice-card-purple").forEach((card) => {
    card.classList.remove("active");
  });

  // 2. Tambahkan class active ke kartu yang diklik
  cardEl.classList.add("active");
}

function selectPillPurple(buttonEl) {
  const container = buttonEl.parentElement;
  if (!container) return;

  // 1. Reset class 'active' & hapus ikon centang lama dari semua tombol
  container.querySelectorAll(".s3-btn-pill-purple").forEach((btn) => {
    btn.classList.remove("active");
    const existingIcon = btn.querySelector(".fa-check");
    if (existingIcon) existingIcon.remove();
  });

  // 2. Aktifkan tombol yang diklik
  buttonEl.classList.add("active");

  // 3. Sisipkan ikon centang ungu di awal teks tombol yang baru diklik
  buttonEl.insertAdjacentHTML(
    "afterbegin",
    '<i class="fas fa-check" style="margin-right: 6px;"></i>',
  );
}

// Open Modal Function
function openDocModal() {
  const modal = document.getElementById("modalJenisDokumen");
  modal.classList.remove("hidden");
}

// Close Modal Function
function closeDocModal() {
  const modal = document.getElementById("modalJenisDokumen");
  modal.classList.add("hidden");
}

// Attach click event to all file names (fc-title)
document.addEventListener("DOMContentLoaded", function () {
  const fileNames = document.querySelectorAll(".s4-fc-header .fc-title");
  fileNames.forEach((file) => {
    file.style.cursor = "pointer";
    file.style.textDecoration = "underline";
    file.addEventListener("click", openDocModal);
  });
});

/* ========================================================================= */
/* NEW LOGIC: STEP 4 INTERACTIONS                                            */
/* ========================================================================= */

// Handle Middle Buttons Tab Switching
function switchs5Tab(tabId, element) {
  // Remove active state from all icon buttons in middle panel
  const tabs = element
    .closest(".s5-middle-panel")
    .querySelectorAll(".s5-icon-btn");
  tabs.forEach((tab) => tab.classList.remove("active"));

  // Set clicked button to active
  element.classList.add("active");

  // Toggle content visibility
  const contentRingkasan = document.getElementById("s5-content-ringkasan");
  const contentPajak = document.getElementById("s5-content-pajak");
  const contentJurnal = document.getElementById("s5-content-jurnal");
  const contentPembayaran = document.getElementById("s5-content-pembayaran");
  const contentCatatan = document.getElementById("s5-content-catatan");
  const contentLainnya = document.getElementById("s5-content-lainnya");

  if (tabId === "ringkasan") {
    contentRingkasan.style.display = "block";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "none";
    contentLainnya.style.display = "none";
  } else if (tabId === "pajak") {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "block";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "none";
    contentLainnya.style.display = "none";
  } else if (tabId === "jurnal") {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "block";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "none";
    contentLainnya.style.display = "none";
  } else if (tabId === "pembayaran") {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "block";
    contentCatatan.style.display = "none";
    contentLainnya.style.display = "none";
  } else if (tabId === "catatan") {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "block";
    contentLainnya.style.display = "none";
  } else {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "none";
    contentLainnya.style.display = "none";
  }
}

// Handle Accordion Toggle in Step 5
function toggleS5Accordion(element) {
  const item = element.closest(".s5-acc-item");
  const detail = item.querySelector(".s5-acc-detail");
  const arrow = element.querySelector(".kw-arrow");

  if (item.classList.contains("expanded")) {
    item.classList.remove("expanded");
    detail.style.display = "none";
    arrow.style.transform = "rotate(0deg)";
  } else {
    item.classList.add("expanded");
    detail.style.display = "flex";
    arrow.style.transform = "rotate(90deg)";
  }
}

// Final Submit Function
function submitPengajuan() {
  const toast = document.getElementById("toastNotification");
  toast.innerHTML =
    '<i class="fas fa-check-circle"></i> Pengajuan Berhasil Dikirim';
  toast.classList.remove("hidden");
  toast.classList.add("show");

  // Simulate navigation/reload after toast
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
    // window.location.href = 'grid-payment.html'; // Uncomment to redirect
  }, 3000);
}

function toggleRow(element) {
  const parent = element.closest(".s5-accordion-item");
  parent.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const dataSentralisasi = [
    {
      id: 1,
      code: "42A",
      name: "Deputi Bidang Human Capital",
      num: 1,
      type: "Anggaran Kegiatan",
    },
    {
      id: 2,
      code: "42B",
      name: "Kepala Bagian Keuangan",
      num: 2,
      type: "Anggaran Kegiatan",
    },
    {
      id: 3,
      code: "42C",
      name: "Asisten Manajer Proyek",
      num: 3,
      type: "Anggaran Kegiatan",
    },
    {
      id: 4,
      code: "42D",
      name: "Staf Administrasi",
      num: 4,
      type: "Anggaran Kegiatan",
    },
    {
      id: 5,
      code: "42E",
      name: "Manajer Sumber Daya Manusia",
      num: 5,
      type: "Anggaran Kegiatan",
    },
    {
      id: 6,
      code: "42F",
      name: "Koordinator Pelatihan",
      num: 6,
      type: "Anggaran Kegiatan",
    },
    {
      id: 7,
      code: "42G",
      name: "Spesialis Pengadaan",
      num: 7,
      type: "Anggaran Kegiatan",
    },
  ];

  const triggerSentral = document.getElementById("trigger-sentralisasi");
  const modalSentral = document.getElementById("modal-sentralisasi");
  const btnCloseSentral = document.getElementById("btn-sentralisasi-close");
  const searchInputSentral = document.getElementById("search-sentral-input");
  const itemListSentral = document.getElementById("sentralisasi-item-list");

  // Render daftar data
  function renderSentralisasiList(items) {
    if (!itemListSentral) return;
    itemListSentral.innerHTML = "";

    if (items.length === 0) {
      itemListSentral.innerHTML =
        '<div class="sentralisasi-empty-state">Data tidak ditemukan</div>';
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "sentralisasi-card";
      card.innerHTML = `
        <div class="sentralisasi-card-left">
          <span class="sentralisasi-card-code">${item.code}</span>
          <span class="sentralisasi-card-name">${item.name}</span>
        </div>
        <div class="sentralisasi-card-right">
          <span class="sentralisasi-badge-num">${item.num}</span>
          <span class="sentralisasi-card-label">${item.type}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        if (triggerSentral) {
          const subText = triggerSentral.querySelector("span");
          if (subText) subText.textContent = `[${item.code}] ${item.name}`;
        }
        closeModalSentralisasi();
      });

      itemListSentral.appendChild(card);
    });
  }

  function openModalSentralisasi() {
    if (modalSentral) {
      modalSentral.classList.add("active");
      if (searchInputSentral) {
        searchInputSentral.value = "";
        renderSentralisasiList(dataSentralisasi);
        setTimeout(() => searchInputSentral.focus(), 100);
      }
    }
  }

  function closeModalSentralisasi() {
    if (modalSentral) {
      modalSentral.classList.remove("active");
    }
  }

  // Event Listeners
  if (triggerSentral)
    triggerSentral.addEventListener("click", openModalSentralisasi);
  if (btnCloseSentral)
    btnCloseSentral.addEventListener("click", closeModalSentralisasi);

  if (modalSentral) {
    modalSentral.addEventListener("click", (e) => {
      if (e.target === modalSentral) closeModalSentralisasi();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      modalSentral &&
      modalSentral.classList.contains("active")
    ) {
      closeModalSentralisasi();
    }
  });

  if (searchInputSentral) {
    searchInputSentral.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase().trim();
      const filtered = dataSentralisasi.filter(
        (item) =>
          item.code.toLowerCase().includes(keyword) ||
          item.name.toLowerCase().includes(keyword),
      );
      renderSentralisasiList(filtered);
    });
  }
});

function toggleAccordion(element) {
  // Mencari parent terdekat (baik level 1 maupun level 2)
  const item = element.closest(".tax-item, .objek-item");
  if (item) {
    item.classList.toggle("active");
  }
}

// Helper format mata uang rupiah
function formatRupiah(val) {
  return "Rp. " + new Intl.NumberFormat("id-ID").format(val) + ",00";
}
// State aplikasi
let activeKategori = "bpjs";
let currentPage = 1;
const itemsPerPage = 10;
let currentFilteredData = [];

// Helper format Rupiah
function formatRupiah(val) {
  return "Rp. " + new Intl.NumberFormat("id-ID").format(val) + ",00";
}

// 1. Render List Item Halaman Aktif
function renderAnggaranList(data, totalItems) {
  const container = document.getElementById("list-anggaran-container");
  const countElement = document.getElementById("total-anggaran-count");

  if (!container) return;
  if (countElement) countElement.innerText = totalItems;

  if (data.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 14px;">
        Kegiatan anggaran tidak ditemukan.
      </div>`;
    renderPagination(0);
    return;
  }

  container.innerHTML = data
    .map((item) => {
      const isBpjs = item.kategori.toUpperCase() === "BPJS";
      const itemClass = isBpjs ? "bpjs-item" : "skp-item";
      const badgeClass = isBpjs ? "badge-bpjs" : "badge-skp";
      const selectedClass = item.terpilih ? "selected" : "";

      return `
        <div class="list-item ${itemClass} ${selectedClass}" data-id="${item.id}" onclick="selectAnggaranItem(this)">
          <div class="check-area"><i class="fas fa-check"></i></div>
          <div class="item-content">
            <div class="item-header">
              <span class="kode">${item.id}</span>
              <span class="badge-mini ${badgeClass}">${item.kategori.toUpperCase()}</span>
            </div>
            <div class="item-title">${item.judul}</div>
          </div>
          <div class="item-amount">
            <span class="label">Saldo Dapat Digunakan</span>
            <strong class="val text-green">${formatRupiah(item.saldo)}</strong>
          </div>
          <div class="chevron"><i class="fas fa-chevron-right"></i></div>
        </div>`;
    })
    .join("");

  renderPagination(totalItems);
}

// 2. Sinkronkan dengan Struktur Pagination HTML Anda
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentPageBtn = document.querySelector(
    ".pagination-controls .active-page",
  );
  const totalPagesText = document.querySelector(
    ".pagination-controls .page-text",
  );

  const btnFirst = document.querySelector(
    ".pagination-controls button:nth-child(1)",
  );
  const btnPrev = document.querySelector(
    ".pagination-controls button:nth-child(2)",
  );
  const btnNext = document.querySelector(
    ".pagination-controls button:nth-child(5)",
  );
  const btnLast = document.querySelector(
    ".pagination-controls button:nth-child(6)",
  );

  if (currentPageBtn) currentPageBtn.innerText = currentPage;
  if (totalPagesText) totalPagesText.innerText = `of ${totalPages}`;

  if (btnFirst) {
    btnFirst.disabled = currentPage === 1;
    btnFirst.onclick = () => goToPage(1);
  }
  if (btnPrev) {
    btnPrev.disabled = currentPage === 1;
    btnPrev.onclick = () => goToPage(currentPage - 1);
  }
  if (btnNext) {
    btnNext.disabled = currentPage === totalPages;
    btnNext.onclick = () => goToPage(currentPage + 1);
  }
  if (btnLast) {
    btnLast.disabled = currentPage === totalPages;
    btnLast.onclick = () => goToPage(totalPages);
  }
}

// 3. Pindah Halaman
function goToPage(page) {
  const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage) || 1;
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  sliceAndRender();
}

// 4. Potong Data Sesuai Halaman Aktif
function sliceAndRender() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = currentFilteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  renderAnggaranList(paginatedData, currentFilteredData.length);
}

// 5. Filter Data
function filterAndRenderAnggaran(resetPage = true) {
  if (resetPage) currentPage = 1;

  const searchInput = document.getElementById("search-anggaran");
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";

  currentFilteredData = anggaranData.filter((item) => {
    const matchCategory =
      activeKategori.toUpperCase() === "ALL" ||
      item.kategori.toUpperCase() === activeKategori.toUpperCase();

    const matchSearch =
      item.id.toLowerCase().includes(keyword) ||
      item.judul.toLowerCase().includes(keyword);

    return matchCategory && matchSearch;
  });

  sliceAndRender();
}

// 6. Ganti Tab Kategori
window.selectSumberAnggaran = function (type) {
  activeKategori = type;

  document
    .querySelectorAll(".select-card")
    .forEach((card) => card.classList.remove("selected"));
  const targetCard = document.getElementById(`card-${type}`);
  if (targetCard) targetCard.classList.add("selected");

  const searchInput = document.getElementById("search-anggaran");
  if (searchInput) searchInput.value = "";

  filterAndRenderAnggaran(true);
};

// 7. Handler Pilih Item List & Update Summary (Satu Fungsi Utuh)
window.selectAnggaranItem = function (element) {
  const selectedId = element.getAttribute("data-id");
  const selectedItem = anggaranData.find((item) => item.id === selectedId);
  if (!selectedItem) return;

  anggaranData.forEach((item) => {
    item.terpilih = item.id === selectedId;
  });

  document
    .querySelectorAll("#list-anggaran-container .list-item")
    .forEach((el) => {
      el.classList.remove("selected");
    });
  element.classList.add("selected");

  const tahun = selectedItem.id.substring(0, 4);
  const judul = selectedItem.judul;
  const saldo = formatRupiah(selectedItem.saldo);

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setText("summary-tahun", tahun);
  setText("summary-judul", judul);
  setText("summary-saldo", saldo);

  setText("step3-summary-tahun", tahun);
  setText("step3-summary-judul", judul);
  setText("step3-summary-saldo", saldo);

  setText("info-kegiatan-terpilih", judul);
  setText("info-saldo-tersedia", saldo);
  setText("info-kegiatan-terpilih-2", judul);
  setText("info-saldo-tersedia-2", saldo);
  setText("info-kegiatan-terpilih-3", judul);
  setText("info-saldo-tersedia-3", saldo);
};

// 8. Inisialisasi Event Listener Awal
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-anggaran");
  if (searchInput) {
    searchInput.addEventListener("input", () => filterAndRenderAnggaran(true));
  }

  selectSumberAnggaran("bpjs");
});
function handleStatusClick(e, btn) {
  // Hentikan agar accordion tidak ikut terbuka/tertutup
  e.stopPropagation();

  // Urutan status dimulai dari warning
  const states = [
    {
      status: "warning",
      btnClass: "status-warning",
      iconClass: "fa-solid fa-question",
    },
    {
      status: "success",
      btnClass: "status-success",
      iconClass: "fa-solid fa-check",
    },
    { status: "error", btnClass: "status-error", iconClass: "fa-solid fa-ban" },
  ];

  const currentStatus = btn.getAttribute("data-status") || "warning";
  let currentIndex = states.findIndex((s) => s.status === currentStatus);
  let nextIndex = (currentIndex + 1) % states.length;
  let nextState = states[nextIndex];

  // Ganti class warna & icon
  states.forEach((s) => btn.classList.remove(s.btnClass));
  btn.classList.add(nextState.btnClass);
  btn.innerHTML = `<i class="${nextState.iconClass}"></i>`;
  btn.setAttribute("data-status", nextState.status);
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get("type");

  const titleEl = document.getElementById("header-title");
  const stepperOp = document.getElementById("stepper-operasional");
  const stepperPd = document.getElementById("stepper-perjalanan");

  if (typeParam === "perjalanan_dinas") {
    currentType = "perjalanan_dinas";

    // Ganti Title Tab Browser & Judul Header H2
    document.title = "Form Perjalanan Dinas";
    if (titleEl) titleEl.textContent = "Perjalanan Dinas";

    // Tampilkan Stepper 5 Langkah
    if (stepperPd) stepperPd.style.display = "flex";
    if (stepperOp) stepperOp.style.display = "none";
  } else {
    currentType = "operasional";

    // Ganti Title Tab Browser & Judul Header H2
    document.title = "Form Operasional Umum";
    if (titleEl) titleEl.textContent = "Operasional Rutin";

    // Tampilkan Stepper 4 Langkah
    if (stepperOp) stepperOp.style.display = "flex";
    if (stepperPd) stepperPd.style.display = "none";
  }

  // Jalankan render step awal
  render();
});

function openFilePreviewModal() {
  const modal = document.getElementById("filePreviewModal");
  if (modal) modal.style.display = "flex";
}

function closeFilePreviewModal() {
  const modal = document.getElementById("filePreviewModal");
  if (modal) modal.style.display = "none";
}

function toggleKeperluan() {
  const textBox = document.getElementById("keperluanText");
  const btn = document.getElementById("btnToggleKeperluan");

  const isCollapsed = textBox.classList.toggle("clamp-3");

  btn.innerText = isCollapsed ? "Lihat Selengkapnya" : "Lihat Lebih Sedikit";
}

function formatIndonesianDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function initDate() {
  const el = document.getElementById("doc-date");
  if (!el) return;

  const status = el.getAttribute("data-status");
  const lockedDate = el.getAttribute("data-date");

  // Jika sudah berstatus final/terkirim dan ada tanggal arsipnya, kunci di tanggal tersebut.
  // Selain itu (draft, form baru, atau tanggal kosong), SELALU gunakan tanggal hari ini (today).
  if (status === "submitted" && lockedDate) {
    el.textContent = formatIndonesianDate(new Date(lockedDate));
  } else {
    el.textContent = formatIndonesianDate(new Date());
  }
}

document.addEventListener("DOMContentLoaded", initDate);

const textarea = document.querySelector(".base-textarea");
const targetDiv = document.querySelector(".keperluan-text-box");
const targetP = document.querySelector(".info-desc"); // hapus jika p tidak perlu ikut update

// Fungsi untuk sinkronisasi teks
function updateText() {
  // textContent menjaga keamanan teks (mencegah XSS)
  targetDiv.textContent = textarea.value;

  if (targetP) {
    targetP.textContent = textarea.value;
  }
}

// Dengarkan setiap ada input/ketikan dari user
textarea.addEventListener("input", updateText);

// Jalankan sekali di awal agar sinkron dengan isi textarea bawaan
updateText();

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");

// 1. Trigger input file saat div diklik
dropArea.addEventListener("click", () => {
  fileInput.click();
});

// 2. Tangani file yang dipilih via klik explorer
fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

// 3. Mencegah browser membuka file secara default saat drag-and-drop
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    false,
  );
});

// Efek visual saat file diseret di atas area (opsional)
["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    () => {
      dropArea.classList.add("drag-active");
    },
    false,
  );
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    () => {
      dropArea.classList.remove("drag-active");
    },
    false,
  );
});

// 4. Tangani file saat dilepas (drop)
dropArea.addEventListener("drop", (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
});

// 5. Fungsi pemrosesan file (validasi ukuran & format)
function handleFiles(files) {
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  const validExtensions = ["pdf", "jpg", "jpeg", "png"];

  Array.from(files).forEach((file) => {
    const ext = file.name.split(".").pop().toLowerCase();

    // Validasi format
    if (!validExtensions.includes(ext)) {
      alert(`Format file "${file.name}" tidak didukung.`);
      return;
    }

    // Validasi ukuran
    if (file.size > maxSizeBytes) {
      alert(`Ukuran file "${file.name}" melebihi batas 10MB.`);
      return;
    }

    // File valid: teruskan ke fungsi penambahan list kartu Anda
    console.log("File siap diproses:", file);
  });

  // Reset nilai input agar bisa memilih file yang sama jika dihapus sebelumnya
  fileInput.value = "";
}

// Variable state untuk melacak step saat ini
let currentStep = 1;

  const lastStep = FLOWS_CONFIG[currentType].length;

// Fungsi untuk memperbarui visibilitas tombol di footer
function updateFooterold() {
    // const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    // currentStep = document


    // 2. Kontrol tombol Berikutnya dan Submit di Step Terakhir (Step 5)
    if (currentStep === lastStep) {
        // Step 5 (Terakhir): Sembunyikan 'Berikutnya', Tampilkan 'Submit'
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'inline-block';
    } else {
        // Step 1-4: Tampilkan 'Berikutnya', Sembunyikan 'Submit'
        btnNext.style.display = 'inline-block';
        btnSubmit.style.display = 'none';
    }
}

function updateFooter() {
    // 1. Get all step content elements as an array
    const steps = Array.from(document.querySelectorAll('.step-content'));
    if (steps.length === 0) return;

    // 2. Find the visible step and the last step
    const currentStepEl = steps.find(step => step.style.display !== 'none');
    const lastStepEl = steps[steps.length - 1];

    const btnNext = document.getElementById('btn-nextstep');
    const btnSubmit = document.getElementById('btn-submit');

    // 3. Compare current step ID against the last step ID
    if (currentStepEl && currentStepEl.id === lastStepEl.id) {
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'inline-block';
    } else {
        btnNext.style.display = 'inline-block';
        btnSubmit.style.display = 'none';
    }
}

// Jalankan updateFooter pertama kali saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    updateFooter();
});