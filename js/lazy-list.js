// ==========================================================================
// LAZY LIST — tampilkan daftar panjang bertahap saat di-scroll
// Muat SEBELUM script-rincian.js / script-komponen.js / script-form-app.js.
//
//   const L = LazyList({
//     wadah:  elemen yang di-scroll,
//     daftar: elemen tempat item ditulis (default = wadah),
//     langkah: jumlah item per muat (default 20),
//     ambil:  () => array data (sudah difilter),
//     html:   (item, index) => string HTML 1 item,
//     kosong: string HTML (atau fungsi yang mengembalikan string) saat data kosong,
//     sesudah: (tampil, total) => {} dipanggil setiap selesai menampilkan,
//   });
//   L.muatUlang();   // panggil saat data / filter / pencarian berubah
//
// Data dari backend nanti cukup mengganti "ambil" (atau memanggil muatUlang setelah data datang);
// untuk data ribuan baris, "ambil" bisa diganti permintaan per halaman ke server.
// ==========================================================================
(function () {
  "use strict";
  window.LazyList = function (o) {
    const wadah = o.wadah, daftar = o.daftar || o.wadah, langkah = o.langkah || 20;
    let data = [], n = 0, sibuk = false;

    const indikator = () => daftar.querySelector(":scope > .lz-muat");
    function tambah() {
      indikator()?.remove();
      const akhir = Math.min(data.length, n + langkah);
      daftar.insertAdjacentHTML("beforeend", data.slice(n, akhir).map((x, i) => o.html(x, n + i)).join(""));
      n = akhir;
      if (n < data.length) daftar.insertAdjacentHTML("beforeend", `<div class="lz-muat"><i class="fas fa-spinner fa-spin"></i> Memuat ${Math.min(langkah, data.length - n)} data berikutnya…</div>`);
      o.sesudah && o.sesudah(n, data.length);
      // belum bisa di-scroll tapi masih ada sisa -> muat lagi supaya area terisi
      if (n < data.length && wadah.scrollHeight <= wadah.clientHeight + 4 && wadah.clientHeight > 0) requestAnimationFrame(tambah);
    }
    function muatUlang(keAtas = true) {
      data = o.ambil() || [];
      n = 0;
      daftar.innerHTML = "";
      if (keAtas) wadah.scrollTop = 0;
      if (!data.length) {
        daftar.innerHTML = (typeof o.kosong === "function" ? o.kosong() : o.kosong) || "";
        o.sesudah && o.sesudah(0, 0);
        return;
      }
      tambah();
    }
    wadah.addEventListener("scroll", () => {
      if (sibuk || n >= data.length) return;
      if (wadah.scrollTop + wadah.clientHeight < wadah.scrollHeight - 80) return;
      sibuk = true;
      setTimeout(() => { tambah(); sibuk = false; }, 120); // jeda kecil supaya indikator "Memuat…" terlihat
    });
    // layar besar / ukuran jendela berubah: daftar jadi lebih tinggi dari isinya -> muat lagi tanpa perlu scroll
    if (window.ResizeObserver) new ResizeObserver(() => {
      if (n < data.length && n > 0 && wadah.clientHeight > 0 && wadah.scrollHeight <= wadah.clientHeight + 4) tambah();
    }).observe(wadah);
    return { muatUlang, tampil: () => n, total: () => data.length, data: () => data };
  };

  // ---------- loading sebentar di atas daftar (kerangka abu-abu + "Memuat data…") ----------
  //   LazyList.loading(el, ms)  -> menutupi elemen el selama ms milidetik. Data di bawahnya sudah tergambar
  //   (jadi kode lain yang langsung memilih item tetap bekerja); ini hanya tampilan "sedang memuat".
  //   Nanti saat data dari backend: tampilkan loading sampai respons datang.
  window.LazyList.loading = function (el, ms = 450, baris = 4) {
    if (!el) return;
    el.classList.add("lz-wadah");
    let o = el.querySelector(":scope > .lz-loading");
    if (!o) {
      o = document.createElement("div");
      o.className = "lz-loading";
      el.appendChild(o);
    }
    o.innerHTML = `<div class="lz-teks"><i class="fas fa-spinner fa-spin"></i> Memuat data…</div>` + '<div class="lz-skel"><i></i><i></i><i></i></div>'.repeat(baris);
    o.style.top = el.scrollTop + "px"; // menutupi area yang sedang terlihat
    o.style.height = Math.max(el.clientHeight, 120) + "px";
    o.classList.remove("hilang");
    clearTimeout(o._t);
    o._t = setTimeout(() => o.classList.add("hilang"), ms);
  };
})();
