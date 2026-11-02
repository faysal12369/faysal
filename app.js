// Portfolio v2: real Code128 barcodes, a thermal printer that prints the
// business card, labels scanned by a laser as they scroll into view, and a few
// count-ups. Everything degrades to the final state with reduced motion.

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Code128-B ----------
const CODE128 = (
  "212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 " +
  "221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 " +
  "221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 " +
  "212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 " +
  "231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 " +
  "231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 " +
  "314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 " +
  "112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 " +
  "111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 " +
  "214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 " +
  "114131 311141 411131 211412 211214 211232 2331112"
).split(" ");

function code128B(text) {
  const values = [104];
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c >= 32 && c <= 126) values.push(c - 32);
  }
  let sum = 104;
  for (let i = 1; i < values.length; i++) sum += values[i] * i;
  values.push(sum % 103, 106);
  return values.map((v) => CODE128[v]).join("");
}

// Draws bars into an SVG whose viewBox width is stretched to the module count,
// so any code fills the element's width.
function drawBarcode(svg) {
  const widths = code128B(svg.dataset.code || "");
  const total = [...widths].reduce((a, w) => a + Number(w), 0);
  const height = svg.viewBox.baseVal.height || 54;
  svg.setAttribute("viewBox", `0 0 ${total} ${height}`);
  let x = 0;
  let d = "";
  let bar = true;
  for (const w of widths) {
    const n = Number(w);
    if (bar) d += `M${x} 0h${n}v${height}h${-n}z`;
    x += n;
    bar = !bar;
  }
  svg.innerHTML = `<path d="${d}" fill="currentColor"/>`;
}
document.querySelectorAll("svg[data-code]").forEach(drawBarcode);

// ---------- Printer ----------
// Printing starts when the printer comes into view (below the title on phones).
const paper = document.getElementById("paper");
const printer = document.querySelector(".printer");
function startPrint() {
  if (!paper) return;
  if (REDUCED) { paper.classList.add("torn"); return; }
  printer.classList.add("printing");
  paper.classList.add("feed");
  paper.addEventListener("animationend", (e) => {
    if (e.animationName !== "feed") return;
    printer.classList.remove("printing");
    paper.classList.remove("feed");
    paper.classList.add("torn");
  });
}

// ---------- Warehouse bins (ERP modules) ----------
const MODULES = [
  "Projets", "Appels d'offres", "Lots de prix", "Achats", "Commandes", "Clients",
  "Fournisseurs", "Stock", "Équipements", "Services", "Interventions", "Réunions",
  "Revues", "Drive", "Messagerie", "Notifications", "Déclarations", "Journal d'audit",
  "Rapports", "Utilisateurs", "Paramètres", "Assistant",
];
const bins = document.querySelector(".bins");
if (bins) {
  bins.innerHTML = MODULES.map((m, i) => {
    const aisle = String.fromCharCode(65 + Math.floor(i / 6));
    const slot = String((i % 6) + 1).padStart(2, "0");
    return `<div class="bin" style="--i:${i}"><small>${aisle}-${slot}<i></i></small><span>${m}</span></div>`;
  }).join("");
}

// ---------- Count-ups ----------
const fmt = new Intl.NumberFormat("fr-FR");
function countUp(el) {
  const target = Number(el.dataset.count);
  if (REDUCED) { el.textContent = fmt.format(target); return; }
  const start = performance.now();
  const dur = 1400;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = fmt.format(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------- Scan a label: laser sweeps, then the stamp lands ----------
function scan(label) {
  if (REDUCED) { label.classList.add("scanned"); return; }
  label.classList.add("scanning");
  setTimeout(() => {
    label.classList.remove("scanning");
    label.classList.add("scanned");
  }, 1700);
}

// ---------- Reveal on scroll ----------
// A position check rather than IntersectionObserver: anything whose top has
// passed 82% of the viewport is revealed, including blocks scrolled past quickly.
let pending = [...document.querySelectorAll(".printer, [data-scan], [data-anim]")];
function reveal(el) {
  el.classList.add("in");
  if (el === printer) startPrint();
  if (el.matches("[data-scan]")) setTimeout(() => scan(el), 450);
  el.querySelectorAll("[data-count]").forEach(countUp);
}
function check() {
  const limit = window.innerHeight * 0.82;
  pending = pending.filter((el) => {
    if (el.getBoundingClientRect().top < limit) { reveal(el); return false; }
    return true;
  });
  if (!pending.length) {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  }
}
let queued = false;
function onScroll() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; check(); });
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
check();

// ---------- Algiers clock ----------
const clock = document.getElementById("clock");
if (clock) {
  const tf = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Algiers" });
  const update = () => { clock.textContent = tf.format(new Date()); };
  update();
  setInterval(update, 15000);
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
