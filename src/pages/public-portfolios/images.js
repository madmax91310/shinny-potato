import {
  nameOf,
  hasText,
  pct,
  benchmarkIssue,
  weightPct,
  lastCompletedMonthEnd,
  performanceIssues,
} from "./lib.js";
// Preview and PNG share the same canvas pixels. No allocation is renormalized.
export function renderImages(p, s, episode, { preview = false, version = 2 } = {}) {
  const canvases = [];
  function create() {
    const c = document.createElement("canvas");
    c.width = 1080;
    c.height = 1350;
    const x = c.getContext("2d");
    x.fillStyle = "#101e26";
    x.fillRect(0, 0, 1080, 1350);
    return { c, x };
  }
  let { c, x } = create();
  function line(text, y, size = 36, color = "#f4f4e9") {
    x.font = `600 ${size}px Arial`;
    x.fillStyle = color;
    x.fillText(text, 60, y);
  }
  function rows(text, width, size) {
    x.font = `600 ${size}px Arial`;
    const result = [];
    let row = "";
    for (const word of text.split(/\s+/)) {
      if (x.measureText(row + " " + word).width > width && row) {
        result.push(row);
        row = "";
      }
      if (x.measureText(word).width > width) {
        for (const char of word) {
          if (x.measureText(row + char).width > width) {
            result.push(row);
            row = "";
          }
          row += char;
        }
      } else row += (row ? " " : "") + word;
    }
    if (row) result.push(row);
    return result;
  }
  function wrapped(text, y, width = 900, size = 36) {
    const lines = rows(text, width, size);
    lines.forEach((t, i) => line(t, y + i * (size + 10), size));
    return y + lines.length * (size + 10);
  }
  function header() {
    if (preview) line("APERÇU — CONTRÔLES À COMPLÉTER", 42, 30, "#f1b56b");
    const offset = preview ? 35 : 0;
    line(
      `LE PORTEFEUILLE DE LA SEMAINE #${episode}`,
      78 + offset,
      30,
      "#71dfb2",
    );
    let y = wrapped(nameOf(p), 155 + offset, 900, 44);
    line(
      preview
        ? `Consulté le ${s.consulted || "date à renseigner"}`
        : `${s.month.start || (hasText(s.month.na) ? lastCompletedMonthEnd(s.consulted).slice(0, 7) + "-01" : s.consulted)} → ${s.month.end || (hasText(s.month.na) ? lastCompletedMonthEnd(s.consulted) : s.consulted)}`,
      y + 15,
      30,
    );
    line(`Devise : ${s.currency || "à renseigner"}`, y + 55, 30);
    return y + 90;
  }
  function finish() {
    x.textAlign = "center";
    x.font = "600 34px Arial";
    x.fillStyle = "#71dfb2";
    x.fillText("L’épargnant libre", 540, 1290);
    x.textAlign = "left";
    canvases.push(c);
  }
  let y = header();
  const metric = (key) =>
    preview && performanceIssues(s, key).length
      ? "À RENSEIGNER / VÉRIFIER"
      : hasText(s[key].na)
        ? "Non applicable"
        : pct(s[key].value);
  line("MOIS", y, 30, "#71dfb2");
  line(
    metric("month"),
    y + 75,
    preview && performanceIssues(s, "month").length ? 44 : 66,
  );
  line("DEPUIS JANVIER", y + 145, 30, "#71dfb2");
  line(
    metric("ytd"),
    y + 220,
    preview && performanceIssues(s, "ytd").length ? 44 : 66,
  );
  y += 300;
  if (!preview && !benchmarkIssue(s))
    y =
      wrapped(
        `${s.benchmark.name} · mois : ${pct(s.benchmark.value)}`,
        y,
        900,
        32,
      ) + 20;
  line(version === 1 ? "RÉPARTITION" : `RÉPARTITION · ${s.effective ? `AU ${s.effective}` : `CONSULTÉE LE ${s.consulted}`}`, y, version === 1 ? 32 : 28, "#71dfb2");
  y += 60;
  const shown = [];
  for (const r of s.positions) {
    const height = rows(r.name, 720, 34).length * 44 + 28;
    if (y + height > 1120) break;
    shown.push(r);
    y = wrapped(r.name, y, 720, 34);
    x.textAlign = "right";
    x.fillText(weightPct(r.weight), 1010, y - 44);
    x.textAlign = "left";
    y += 28;
  }
  if (shown.length < s.positions.length)
    wrapped(
      `${s.positions.length - shown.length} autres positions : détail complet dans les images suivantes`,
      y + 15,
      900,
      30,
    );
  finish();
  if (shown.length < s.positions.length) {
    ({ c, x } = create());
    y = header();
    line("DÉTAIL DES POSITIONS", y, 32, "#71dfb2");
    y += 65;
    for (const r of s.positions) {
      const height = rows(r.name, 720, 34).length * 44 + 28;
      if (y + height > 1180) {
        finish();
        ({ c, x } = create());
        y = header();
        line("DÉTAIL DES POSITIONS (SUITE)", y, 32, "#71dfb2");
        y += 65;
      }
      y = wrapped(r.name, y, 720, 34);
      x.textAlign = "right";
      x.fillText(weightPct(r.weight), 1010, y - 44);
      x.textAlign = "left";
      y += 28;
    }
    finish();
  }
  return canvases;
}
