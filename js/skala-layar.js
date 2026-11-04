// ==========================================================================
// SKALA LAYAR — ukuran tampilan mengikuti lebar MONITOR, bukan lebar jendela.
// Semua ukuran CSS memakai rem; 1rem = 16px di monitor 2560px (2K).
//   monitor 2560 ke atas -> 16px (100%), di bawahnya (Full HD, laptop) -> 12px (75%).
// Karena dihitung dari screen.width (tidak berubah saat zoom di Chrome/Edge),
// Ctrl + / Ctrl − di browser tetap memperbesar / memperkecil seperti biasa.
// Dimuat di <head> sebelum CSS supaya tidak berkedip.
// ==========================================================================
(function () {
  function atur() {
    var lebar = (window.screen && screen.width) || 1920;
    // di bawah 2K selalu 75% (12px) — termasuk Full HD dengan scaling Windows 125% (terbaca 1536)
    var px = lebar >= 2560 ? 16 : 12;
    document.documentElement.style.fontSize = px + "px";
  }
  atur();
  window.addEventListener("resize", atur); // jendela dipindah ke monitor lain
})();
