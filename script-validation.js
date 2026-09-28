
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
  } else if (tabId === "pajak") {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "block";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "none";
  } else if (tabId === "jurnal") {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "block";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "none";
  } else if (tabId === "pembayaran") {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "block";
    contentCatatan.style.display = "none";
  } else if (tabId === "catatan") {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "block";
  } else {
    contentRingkasan.style.display = "none";
    contentPajak.style.display = "none";
    contentJurnal.style.display = "none";
    contentPembayaran.style.display = "none";
    contentCatatan.style.display = "none";
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

function toggleRow(element) {
  const parent = element.closest(".s5-accordion-item");
  parent.classList.toggle("active");
}

function toggleAccordion(element) {
  // Mencari parent terdekat (baik level 1 maupun level 2)
  const item = element.closest(".tax-item, .objek-item");
  if (item) {
    item.classList.toggle("active");
  }
}

function openFilePreviewModal() {
  const modal = document.getElementById("filePreviewModal");
  if (modal) modal.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("revisionNote");
  const currentChar = document.getElementById("currentChar");
  const btnHapus = document.getElementById("btnHapus");
  const btnMinta = document.getElementById("btnMinta");

  // Update counter karakter saat mengetik
  function updateCount() {
    currentChar.textContent = textarea.value.length;
  }

  textarea.addEventListener("input", updateCount);
  updateCount(); // hitung saat load awal

  // Aksi tombol Hapus Tanda Perbaikan
  btnHapus.addEventListener("click", () => {
    if (confirm("Apakah Anda yakin ingin menghapus tanda perbaikan?")) {
      textarea.value = "";
      updateCount();
    }
  });

  // Aksi tombol Minta Perbaikan
  btnMinta.addEventListener("click", () => {
    const note = textarea.value.trim();
    if (!note) {
      alert("Harap masukkan catatan perbaikan terlebih dahulu.");
      textarea.focus();
      return;
    }
    // Kirim data / panggil API Anda di sini
    alert("Permintaan perbaikan berhasil dikirim!");
  });
});

document.addEventListener('DOMContentLoaded', () => {
    // Elemen DOM
    const fileCards = document.querySelectorAll('.file-item-card');
    const textarea = document.getElementById('revisionNote');
    const charCounter = document.getElementById('currentChar');
    const btnMinta = document.getElementById('btnMinta');
    const btnHapus = document.getElementById('btnHapus');

    // 1. Simpan state perbaikan untuk masing-masing card secara independen
    // Objek penyimpan data: { [cardIndex]: { note: string, needsRevision: boolean } }
    const fileDataStore = {};

    // 2. Fungsi helper untuk memperbarui counter karakter textarea
    function updateCharCount() {
        if (charCounter && textarea) {
            charCounter.textContent = textarea.value.length;
        }
    }

    if (textarea) {
        textarea.addEventListener('input', updateCharCount);
        updateCharCount(); // Inisialisasi awal
    }

    // 3. Fungsi untuk mendapatkan card yang sedang aktif / terseleksi
    function getActiveCard() {
        return document.querySelector('.file-item-card.active-card');
    }

    // 4. Logika pemilihan file saat card diklik
    fileCards.forEach((card, index) => {
        card.dataset.index = index;

        // Ambil status awal jika card sudah memiliki badge bawaan di HTML
        const hasExistingBadge = card.querySelector('.badge-perbaikan') !== null;
        fileDataStore[index] = {
            needsRevision: hasExistingBadge,
            note: hasExistingBadge ? (textarea ? textarea.value : '') : ''
        };

        card.addEventListener('click', () => {
            // Hapus kelas aktif dari card sebelumnya
            fileCards.forEach(c => c.classList.remove('active-card'));
            
            // Tandai card yang diklik sebagai aktif
            card.classList.add('active-card');

            // Perbarui preview judul file di panel kanan
            const fileName = card.querySelector('.fic-name')?.textContent || 'File Name.pdf';
            const fileNamePreview = document.querySelector('.preview-toolbar .file-name');
            const noticeSpan = document.querySelector('.info-notice span');

            if (fileNamePreview) fileNamePreview.textContent = fileName;
            if (noticeSpan) noticeSpan.textContent = `Catatan dan status hanya berlaku untuk ${fileName}.`;

            // Muat kembali catatan tersimpan untuk card ini
            const savedData = fileDataStore[index];
            if (textarea) {
                textarea.value = savedData ? savedData.note : '';
                updateCharCount();
            }
        });
    });

    // 5. Aksi tombol: Minta Perbaikan (Menambahkan tanda peringatan)
    if (btnMinta) {
        btnMinta.addEventListener('click', () => {
            const activeCard = getActiveCard();
            if (!activeCard) {
                alert('Silakan pilih salah satu dokumen terlebih dahulu.');
                return;
            }

            const noteVal = textarea ? textarea.value.trim() : '';
            if (!noteVal) {
                alert('Catatan perbaikan wajib diisi!');
                textarea?.focus();
                return;
            }

            const cardIndex = activeCard.dataset.index;

            // Simpan ke state
            fileDataStore[cardIndex] = {
                needsRevision: true,
                note: noteVal
            };

            // Tambahkan badge jika belum ada
            let badge = activeCard.querySelector('.badge-perbaikan');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'badge-perbaikan';
                badge.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Perlu perbaikan';
                activeCard.appendChild(badge);
            }
        });
    }

    // 6. Aksi tombol: Hapus Tanda Perbaikan (Menghapus tanda peringatan)
    if (btnHapus) {
        btnHapus.addEventListener('click', () => {
            const activeCard = getActiveCard();
            if (!activeCard) {
                alert('Silakan pilih dokumen terlebih dahulu.');
                return;
            }

            const cardIndex = activeCard.dataset.index;

            // Bersihkan dari state
            fileDataStore[cardIndex] = {
                needsRevision: false,
                note: ''
            };

            // Hapus elemen badge jika ada
            const badge = activeCard.querySelector('.badge-perbaikan');
            if (badge) {
                badge.remove();
            }

            // Kosongkan form catatan
            if (textarea) {
                textarea.value = '';
                updateCharCount();
            }
        });
    }
});

// Fungsi global agar terbaca oleh onclick="openFilePreviewModal()" di HTML
window.openFilePreviewModal = function() {
    const modal = document.getElementById('filePreviewModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
};

window.closeFilePreviewModal = function() {
    const modal = document.getElementById('filePreviewModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('filePreviewModal');
    const closeBtn = document.querySelector('.modal-close-btn');

    // Klik tombol tanda silang (x) untuk menutup modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFilePreviewModal);
    }

    // Klik area luar modal (backdrop) untuk menutup
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeFilePreviewModal();
            }
        });
    }

    // Tekan tombol ESC untuk menutup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFilePreviewModal();
        }
    });
});

function togglePayment(btn) {
  const textSpan = btn.querySelector('.btn-text');

  if (btn.classList.contains('is-cek')) {
    btn.classList.remove('is-cek');
    textSpan.textContent = 'Bank';
  } else {
    btn.classList.add('is-cek');
    textSpan.textContent = 'Cek';
  }
}

function closeModal() {
  const modal = document.getElementById("modalPerorangan");
  if (modal) modal.style.display = "none";
}

// Menutup popup saat klik area abu-abu di luar modal box
window.addEventListener("click", function (e) {
  const modal = document.getElementById("modalPerorangan");
  if (e.target === modal) {
    closeModal();
  }
});

function toggleBiaya(headerEl) {
  const item = headerEl.closest(".biaya-item");
  if (item) {
    item.classList.toggle("expanded");
  }
}
// Variabel global pelacak status dan modal aktif
let currentActiveStatusBtn = null;
let currentActiveModal = null;

// Helper terpusat untuk mengubah status, ikon, dan class
function updateStatusUI(btn, status) {
  if (!btn) return;

  const states = {
    warning: {
      btnClass: "status-warning",
      iconClass: "fa-solid fa-question",
    },
    success: {
      btnClass: "status-success",
      iconClass: "fa-solid fa-check",
    },
    error: {
      btnClass: "status-error",
      iconClass: "fa-solid fa-ban",
    },
  };

  const targetState = states[status] || states.warning;

  Object.values(states).forEach((s) => btn.classList.remove(s.btnClass));
  btn.classList.add(targetState.btnClass);
  btn.innerHTML = `<i class="${targetState.iconClass}"></i>`;
  btn.setAttribute("data-status", status);
}

// Handler klik status baris langsung
function handleStatusClick(e, btn) {
  if (e) e.stopPropagation();

  const cycle = ["warning", "success", "error"];
  const currentStatus = btn.getAttribute("data-status") || "warning";
  const nextIndex = (cycle.indexOf(currentStatus) + 1) % cycle.length;

  updateStatusUI(btn, cycle[nextIndex]);
}

/**
 * Membuka Modal (Perorangan atau Badan Usaha)
 * @param {Event} e - Event klik
 * @param {string} modalId - ID modal yang ingin dibuka ('modalPerorangan' atau 'modalBadanUsaha')
 */
function openModal(e, modalId = "modalPerorangan") {
  if (e) e.stopPropagation();

  // 1. Simpan tombol status baris pemicu
  const trigger = e ? e.currentTarget : null;
  if (trigger) {
    const row = trigger.closest(".s5-list-row");
    currentActiveStatusBtn = row ? row.querySelector(".status-btn") : null;
  }

  // 2. Ambil elemen modal
  const modal = document.getElementById(modalId);
  if (!modal) return;
  currentActiveModal = modal;

  const cardDetil = modal.querySelector("#cardDetilPerjalananDinas");
  const kwList = modal.querySelector(".kw-list");

  // 3. Cek apakah ini Badan Usaha
  const isBadanUsaha = modalId === "modalBadanUsaha";

  if (isBadanUsaha) {
    // Sembunyikan detail perjalanan dinas jika badan usaha
    if (cardDetil) {
      cardDetil.style.display = "none";
    }

    // Render template kuitansi/invoice Badan Usaha
if (kwList) {
      kwList.innerHTML = `
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
              </div>`
              )
              .join("")}
          </div>
        </div>
      `;
    }
  } else {
    // Format Perorangan
    if (cardDetil) {
      cardDetil.style.display = "block";
    }

    const kelompokBiayaData = [
      { title: "Honor dan Jasa Perorangan" },
      { title: "Hadiah Royalti dan Sewa" },
      { title: "Pendapatan Bunga Deposito" },
      { title: "Penghasilan Usaha Perseorangan" },
      { title: "Penghasilan dari Jasa Profesional" },
      { title: "Pendapatan Sewa Properti" },
      { title: "Nama Kelompok Biaya" }
    ];

    if (kwList) {
      kwList.innerHTML = `
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
                </div>`
              )
              .join("")}
          </div>
        </div>
      `;
    }
  }

  // 4. Buka modal
  modal.style.display = "flex";
}

// 3. Helper accordion kuitansi Badan Usaha
function togglekuitansi(e, headerElem) {
  if (e) e.stopPropagation();
  const item = headerElem.closest(".kuitansi-item");
  const detail = item.querySelector(".kw-detail");
  const arrow = item.querySelector(".kw-arrow");

  if (detail) {
    const isHidden = detail.style.display === "none" || !detail.style.display;
    detail.style.display = isHidden ? "block" : "none";
    if (arrow) {
      arrow.style.transform = isHidden ? "rotate(90deg)" : "rotate(0deg)";
    }
  }
}

// 4. Tutup Modal
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

// 5. Handle Setuju & Tolak
function handleSetuju() {
  if (currentActiveStatusBtn) {
    updateStatusUI(currentActiveStatusBtn, "success");
  }
  closeModal();
}

function handleTolak() {
  if (currentActiveStatusBtn) {
    updateStatusUI(currentActiveStatusBtn, "error");
  }
  closeModal();
}