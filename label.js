// Draws the 60 x 40 mm device label (480 x 320 dots at 203 dpi) with real
// Code128-B barcodes, the same layout the Windows labelling app prints.

// Bar/space widths for Code128 values 0-106 (106 = stop, 7 elements).
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

const START_B = 104;
const STOP = 106;

function code128B(text) {
  const values = [START_B];
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c >= 32 && c <= 126) values.push(c - 32);
  }
  let sum = START_B;
  for (let i = 1; i < values.length; i++) sum += values[i] * i;
  values.push(sum % 103, STOP);
  return values.map((v) => CODE128[v]).join("");
}

function barsPath(text, x, y, height, module) {
  let d = "";
  let bar = true;
  for (const w of code128B(text)) {
    const width = Number(w) * module;
    if (bar) d += `M${x} ${y}h${width}v${height}h${-width}z`;
    x += width;
    bar = !bar;
  }
  return d;
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const IMEI = "356938035643809"; // documentation sample IMEI, not a real device

function drawLabel(serial) {
  const svg = document.getElementById("label");
  if (!svg) return;
  const sn = serial || " ";
  const font = 'font-family="Arial, Helvetica, sans-serif" fill="#000"';
  svg.innerHTML = `
    <text x="22" y="62" ${font} font-size="50" font-weight="700" letter-spacing="-2">CE</text>
    <text x="118" y="38" ${font} font-size="17">MARQUE</text>
    <text x="214" y="38" ${font} font-size="17" font-weight="700">DEMO</text>
    <text x="118" y="62" ${font} font-size="17">MODÈLE</text>
    <text x="214" y="62" ${font} font-size="17" font-weight="700">X1-PRO</text>
    <path d="${barsPath(IMEI, 22, 80, 62, 2)}" fill="#000"/>
    <text x="22" y="166" ${font} font-size="17">IMEI ${IMEI}</text>
    <path d="${barsPath(sn, 22, 182, 62, 2)}" fill="#000"/>
    <text x="22" y="268" ${font} font-size="17">S/N ${esc(sn)}</text>
    <text x="22" y="302" ${font} font-size="15">Made in China</text>
  `;
}

const input = document.getElementById("sn");
if (input) {
  const update = () => {
    const clean = input.value.toUpperCase().replace(/[^\x20-\x7E]/g, "").slice(0, 16);
    if (clean !== input.value) input.value = clean;
    drawLabel(clean.trim());
  };
  input.addEventListener("input", update);
  update();
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
