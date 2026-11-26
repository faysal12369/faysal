// Portfolio v3: split-letter hero, words that light up while scrolling, a pinned
// horizontal project rail, counters and a timeline that draws itself.
// Narrow screens get a native swipe rail; reduced motion gets the final state.

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const WIDE = window.matchMedia("(min-width: 901px)");
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// ---------- Language ----------
// The page's own <html lang> picks the strings: "/" is French, "/en/" English.
const LANG = document.documentElement.lang.startsWith("en") ? "en" : "fr";
const T = {
  fr: {
    locale: "fr-FR",
    modules: ["Projets", "Appels d'offres", "Lots de prix", "Achats", "Commandes", "Clients", "Fournisseurs", "Stock", "Équipements", "Services", "Interventions", "Réunions", "Revues", "Drive", "Messagerie", "Notifications", "Déclarations", "Journal", "Rapports", "Utilisateurs", "Paramètres", "Assistant"],
    formMissing: "Merci de remplir les trois champs (avec un email valide).",
    formSending: "Envoi en cours…",
    formOk: "Merci, votre message est bien parti. Je vous réponds rapidement.",
    formErr: "L'envoi n'a pas abouti. Écrivez-moi directement à gheroufellafaycal@gmail.com.",
    formRetry: "Envoi par une autre voie…",
  },
  en: {
    locale: "en-GB",
    modules: ["Projects", "Tenders", "Price lots", "Purchasing", "Orders", "Customers", "Suppliers", "Stock", "Equipment", "Services", "Field jobs", "Meetings", "Reviews", "Drive", "Messaging", "Notifications", "Declarations", "Audit log", "Reports", "Users", "Settings", "Assistant"],
    formMissing: "Please fill in all three fields (with a valid email).",
    formSending: "Sending…",
    formOk: "Thank you, your message has been sent. I'll get back to you soon.",
    formErr: "The message could not be sent. Please email me directly at gheroufellafaycal@gmail.com.",
    formRetry: "Sending another way…",
  },
}[LANG];

// ---------- Code128-B (real, scannable barcodes) ----------
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
  const v = [104];
  for (const ch of text) { const c = ch.charCodeAt(0); if (c >= 32 && c <= 126) v.push(c - 32); }
  let sum = 104;
  for (let i = 1; i < v.length; i++) sum += v[i] * i;
  v.push(sum % 103, 106);
  return v.map((x) => CODE128[x]).join("");
}
document.querySelectorAll("svg[data-code]").forEach((svg) => {
  const widths = code128B(svg.dataset.code);
  const h = svg.viewBox.baseVal.height || 40;
  let x = 0, d = "", bar = true;
  for (const w of widths) { const n = +w; if (bar) d += `M${x} 0h${n}v${h}h${-n}z`; x += n; bar = !bar; }
  svg.setAttribute("viewBox", `0 0 ${x} ${h}`);
  svg.innerHTML = `<path d="${d}" fill="currentColor"/>`;
});

// The curtain lifts with CSS; remove it anyway in case animations are paused
// (background tab, power saving) so it can never hide the page.
const curtain = document.querySelector(".curtain");
if (curtain) setTimeout(() => curtain.remove(), 1400);

// ---------- Hero letters ----------
let c = 0;
document.querySelectorAll("[data-split]").forEach((row) => {
  row.setAttribute("aria-hidden", "true");
  row.innerHTML = [...row.textContent].map((ch) => `<span class="char"><span style="--c:${c++}">${ch}</span></span>`).join("");
});

// ---------- Manifesto words ----------
const wordsEl = document.querySelector("[data-words]");
let words = [];
if (wordsEl) {
  wordsEl.innerHTML = wordsEl.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  words = [...wordsEl.querySelectorAll(".w")];
}

// ---------- ERP modules ----------
const modules = document.getElementById("modules");
if (modules) modules.innerHTML = T.modules.map((m, i) => `<span class="mod" style="--i:${i}">${m}</span>`).join("");

// ---------- Horizontal rail ----------
const hs = document.querySelector(".hscroll");
const track = hs?.querySelector(".track");
const bar = document.getElementById("hs-bar");
const idx = document.getElementById("hs-index");
const cards = track ? track.children.length : 0;
let pinned = false;

function layoutRail() {
  pinned = WIDE.matches && !REDUCED;
  if (!hs) return;
  if (pinned) {
    const distance = track.scrollWidth - window.innerWidth;
    hs.style.height = `${distance + window.innerHeight}px`;
  } else {
    hs.style.height = "";
    track.style.transform = "";
  }
}
// The counter shows the card closest to the middle of the screen.
function setRailProgress(p) {
  if (bar) bar.style.transform = `scaleX(${p})`;
  if (!idx) return;
  const mid = window.innerWidth / 2;
  let best = 0, bestDist = Infinity;
  [...track.children].forEach((card, i) => {
    const r = card.getBoundingClientRect();
    const dist = Math.abs(r.left + r.width / 2 - mid);
    if (dist < bestDist) { bestDist = dist; best = i; }
  });
  idx.textContent = String(best + 1).padStart(2, "0");
}
track?.addEventListener("scroll", () => {
  if (pinned) return;
  const max = track.scrollWidth - track.clientWidth;
  setRailProgress(max > 0 ? track.scrollLeft / max : 0);
}, { passive: true });

// ---------- Counters ----------
const fmt = new Intl.NumberFormat(T.locale);
function countUp(el) {
  const target = +el.dataset.count, suffix = el.dataset.suffix || "";
  if (REDUCED) { el.textContent = fmt.format(target) + suffix; return; }
  const t0 = performance.now();
  const tick = (now) => {
    const t = clamp((now - t0) / 1600);
    el.textContent = fmt.format(Math.round(target * (1 - Math.pow(1 - t, 4)))) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------- Generic reveal ----------
document.querySelectorAll(".sec-title, .list li, .numbers div, .big-cta, .mail, .links, .aside, .shot-fig").forEach((el) => el.classList.add("rise"));
let pending = [...document.querySelectorAll(".rise, [data-count]")];

// ---------- Timeline ----------
const timeline = document.getElementById("timeline");
const tItems = timeline ? [...timeline.children] : [];

// ---------- One scroll loop ----------
function frame() {
  const vh = window.innerHeight;

  if (words.length) {
    const r = wordsEl.getBoundingClientRect();
    const p = REDUCED ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("lit", i < lit));
  }

  if (pinned && hs) {
    const r = hs.getBoundingClientRect();
    const p = clamp(-r.top / (hs.offsetHeight - vh));
    track.style.transform = `translate3d(${-(track.scrollWidth - window.innerWidth) * p}px,0,0)`;
    setRailProgress(p);
  }

  pending = pending.filter((el) => {
    if (el.getBoundingClientRect().top < vh * 0.88) {
      el.classList.add("in");
      if (el.dataset.count) countUp(el);
      return false;
    }
    return true;
  });

  if (timeline) {
    const r = timeline.getBoundingClientRect();
    const p = REDUCED ? 1 : clamp((vh * 0.6 - r.top) / r.height);
    timeline.style.setProperty("--p", p.toFixed(3));
    tItems.forEach((li) => li.classList.toggle("on", li.getBoundingClientRect().top < vh * 0.6 || REDUCED));
  }
}
let queued = false;
function onScroll() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; frame(); });
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => { layoutRail(); onScroll(); });
WIDE.addEventListener?.("change", () => { layoutRail(); onScroll(); });
document.fonts?.ready.then(() => { layoutRail(); frame(); });
layoutRail();
frame();

// ---------- Contact form ----------
// Sent through FormSubmit (no backend on GitHub Pages). Without JavaScript the
// form still posts to FormSubmit's normal endpoint, which sends the visitor
// back here (hidden "_next" field) with ?envoye=1 or ?sent=1.
const form = document.getElementById("contact-form");
if (form) {
  const status = document.getElementById("form-status");
  const button = form.querySelector("button");
  const setStatus = (text, kind) => { status.textContent = text; status.className = "form-status" + (kind ? " " + kind : ""); };
  const back = new URLSearchParams(location.search);
  if (back.has("envoye") || back.has("sent")) {
    setStatus(T.formOk, "ok");
    history.replaceState(null, "", location.pathname + "#contact");
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll("input[required], textarea[required]")];
    fields.forEach((f) => f.classList.toggle("bad", !f.value.trim() || (f.type === "email" && !f.checkValidity())));
    if (form.querySelector(".bad")) { setStatus(T.formMissing, "err"); return; }
    if (form._honey.value) return; // filled only by bots
    button.disabled = true;
    setStatus(T.formSending);
    try {
      const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") {
        // FormSubmit answered but refused: show its reason (in English).
        setStatus(T.formErr + (data.message ? " (" + data.message + ")" : ""), "err");
        button.disabled = false;
        return;
      }
      form.reset();
      setStatus(T.formOk, "ok");
      button.disabled = false;
    } catch (err) {
      // The request never reached FormSubmit (blocked by an ad blocker, a
      // firewall or the network): post the form the normal way instead.
      setStatus(T.formRetry);
      HTMLFormElement.prototype.submit.call(form);
    }
  });
}

// ---------- Video dialog ----------
// The link points at the .mp4 itself, so without JavaScript it still plays.
const dlg = document.getElementById("video-dlg");
if (dlg && dlg.showModal) {
  const video = dlg.querySelector("video");
  document.querySelectorAll("a[data-video]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    if (video.getAttribute("src") !== a.getAttribute("href")) video.src = a.getAttribute("href");
    dlg.showModal();
    video.play().catch(() => {});
  }));
  dlg.querySelector(".dlg-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => video.pause());
}

// ---------- Clock & year ----------
const clock = document.getElementById("clock");
if (clock) {
  const tf = new Intl.DateTimeFormat(T.locale, { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Algiers" });
  const tickClock = () => { clock.textContent = tf.format(new Date()); };
  tickClock();
  setInterval(tickClock, 15000);
}
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
