import {
  holdingColor,
  shortDonutName,
  wrapDonutLabel,
} from "../dca-profiles/donut-layout.js";
import {
  nameOf,
  pct,
  editorialWeight,
  performanceIssues,
  benchmarkIssue,
  hasText,
  lastCompletedMonthEnd,
  collectedPerformance,
} from "./lib.js";

// v3. The v1/v2 renderer remains frozen for already published episodes.
// Labels are rounded for reading; arcs always use the unmodified source weights.
export function renderEditorialImages(
  profile,
  snapshot,
  episode,
  { preview = false } = {},
) {
  const C = {
    navy: "#071d36",
    ivory: "#fff4df",
    gold: "#ffd342",
    muted: "#a9bdd3",
    panel: "#102d49",
  };
  const positions = [...snapshot.positions].sort(
    (a, b) => Number(b.weight) - Number(a.weight),
  );
  const knownWeight = (row) =>
    row.weight !== "" &&
    row.weight != null &&
    Number.isFinite(Number(row.weight));
  const completeWeights = positions.every(knownWeight);
  const total = completeWeights
    ? positions.reduce((sum, row) => sum + Number(row.weight), 0)
    : NaN;
  const grouped = positions
    .slice(0, 4)
    .map((r, i) => ({ ...r, color: holdingColor(i) }));
  if (positions.length > 4)
    grouped.push({
      name: `Autres (${positions.length - 4} lignes)`,
      weight: positions.slice(4).every(knownWeight)
        ? positions.slice(4).reduce((sum, r) => sum + Number(r.weight), 0)
        : "",
      color: holdingColor(4),
    });
  const pages = [];
  let canvas, ctx;
  const text = (
    value,
    x,
    y,
    size = 34,
    color = C.ivory,
    family = "Arial",
    weight = 600,
  ) => {
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = color;
    ctx.fillText(String(value), x, y);
  };
  const lines = (value, width, size = 34, family = "Arial") => {
    ctx.font = `600 ${size}px ${family}`;
    return wrapDonutLabel(
      (value) => ctx.measureText(value).width,
      value,
      width,
    );
  };
  const wrap = (
    value,
    x,
    y,
    width,
    size = 34,
    color = C.ivory,
    family = "Arial",
  ) => {
    const rows = lines(value, width, size, family);
    rows.forEach((row, i) =>
      text(row, x, y + i * (size + 10), size, color, family),
    );
    return y + rows.length * (size + 10);
  };
  function create() {
    canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = C.gold;
    ctx.fillRect(60, 58, 58, 8);
    text(`LE PORTEFEUILLE`, 60, 114, 38, C.gold);
    text(`DE LA SEMAINE #${episode}`, 60, 156, 38, C.gold);
    const nameRows = lines(nameOf(profile), 960, 54, "Georgia");
    nameRows
      .slice(0, 2)
      .forEach((row, i) =>
        text(
          i === 1 && nameRows.length > 2 ? row.slice(0, -1) + "…" : row,
          60,
          245 + i * 64,
          54,
          C.ivory,
          "Georgia",
        ),
      );
    const bottom = 245 + Math.min(2, nameRows.length) * 64;
    if (preview)
      text(
        snapshot.acquisition?.performanceSource
          ? "APERÇU · CHIFFRES À CONFIRMER"
          : "APERÇU · DONNÉES À COMPLÉTER",
        60,
        bottom + 12,
        28,
        C.gold,
      );
    return bottom + (preview ? 65 : 30);
  }
  function finish() {
    ctx.strokeStyle = "#36516b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 1240);
    ctx.lineTo(1020, 1240);
    ctx.stroke();
    ctx.textAlign = "center";
    text("L’épargnant libre", 540, 1300, 38, C.gold, "Georgia");
    ctx.textAlign = "left";
    pages.push(canvas);
  }
  const monthEnd =
    snapshot.month.end || lastCompletedMonthEnd(snapshot.consulted);
  const month = monthEnd
    ? new Date(monthEnd + "T12:00:00Z").toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Période à confirmer";
  let y = create();
  text(
    `${month} · ${snapshot.currency || "Devise à confirmer"}`,
    60,
    y,
    32,
    C.muted,
  );
  y += 38;
  for (const [index, key] of ["month", "ytd"].entries()) {
    const x = 60 + index * 490;
    ctx.fillStyle = C.panel;
    ctx.beginPath();
    ctx.roundRect(x, y, 470, 168, 18);
    ctx.fill();
    text(
      key === "month" ? "SUR LE MOIS" : "DEPUIS JANVIER",
      x + 24,
      y + 44,
      28,
      C.muted,
    );
    const unknown =
      preview &&
      performanceIssues(snapshot, key).length &&
      !collectedPerformance(snapshot, key);
    const na = hasText(snapshot[key].na);
    text(
      unknown
        ? "—"
        : na
          ? "Sans objet"
          : `${snapshot[key].approximate ? "≈ " : ""}${pct(snapshot[key].value)}`,
      x + 24,
      y + 124,
      na ? 48 : 72,
      unknown ? C.muted : C.gold,
      "Georgia",
    );
  }
  y += 220;
  text("CE QU’IL DÉTIENT", 60, y, 32, C.gold);
  const chartY = y + 215;
  ctx.lineWidth = 72;
  ctx.strokeStyle = "#304962";
  ctx.beginPath();
  ctx.arc(270, chartY, 165, 0, Math.PI * 2);
  ctx.stroke();
  if (
    total > 0 &&
    total <= 100.5 &&
    grouped.every((r) => Number(r.weight) >= 0)
  ) {
    let angle = -Math.PI / 2;
    for (const row of grouped) {
      const end = angle + (Number(row.weight) / 100) * Math.PI * 2;
      if (end > angle) {
        ctx.strokeStyle = row.color;
        ctx.beginPath();
        ctx.arc(270, chartY, 165, angle, end);
        ctx.stroke();
      }
      angle = end;
    }
  }
  ctx.textAlign = "center";
  text(
    completeWeights ? String(positions.length) : "À vérifier",
    270,
    chartY,
    completeWeights ? 70 : 36,
    C.ivory,
    "Georgia",
  );
  text(
    completeWeights ? "placements" : "poids incomplets",
    270,
    chartY + 45,
    28,
    C.muted,
  );
  ctx.textAlign = "left";
  let legendY = y + 60;
  let shortened = false;
  for (const row of grouped) {
    ctx.fillStyle = row.color;
    ctx.beginPath();
    ctx.arc(520, legendY - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    const label = shortDonutName(row.name);
    const labelRows = lines(label, 295, 42);
    if (labelRows.length > 2 || label !== row.name) shortened = true;
    for (const [i, line] of labelRows.slice(0, 2).entries())
      text(
        i === 1 && labelRows.length > 2 ? line.slice(0, -1) + "…" : line,
        540,
        legendY + i * 46,
        42,
      );
    ctx.textAlign = "right";
    text(
      knownWeight(row) ? editorialWeight(row.weight) : "—",
      1020,
      legendY,
      40,
    );
    ctx.textAlign = "left";
    legendY += 92;
  }
  const longProfileName = lines(nameOf(profile), 960, 54, "Georgia").length > 2;
  const needsDetails =
    longProfileName ||
    positions.length > 4 ||
    shortened ||
    positions.some((row) => lines(row.name, 700).length > 2);
  let bottom = Math.max(chartY + 220, legendY);
  if (total < 100 - 1e-8) wrap(`Non renseigné : ${editorialWeight(100-total)}`,60,chartY+230,420,30,C.muted);
  if (total > 100 + .005) wrap(`Total : ${editorialWeight(total)} · à contrôler`,60,chartY+230,420,30,C.gold);
  if (needsDetails && bottom < 1170)
    text(
      "Toutes les lignes sur les images suivantes →",
      60,
      bottom,
      30,
      C.muted,
    );
  if (!preview && !benchmarkIssue(snapshot) && bottom < 1130) {
    const label = `${snapshot.benchmark.name} : ${pct(snapshot.benchmark.value)} sur le mois`;
    text(
      lines(label, 960, 30).length === 1
        ? label
        : "Benchmark : comparaison sur l’image suivante",
      60,
      bottom + 42,
      30,
      C.gold,
    );
  }
  const dateLabel = snapshot.effective
    ? `Répartition au ${snapshot.effective}`
    : `Répartition consultée le ${snapshot.consulted || "date inconnue"}`;
  text(dateLabel, 60, 1212, 28, C.muted);
  finish();
  // A comparable benchmark gets its own spacious page with full provenance in the post.
  if (!preview && !benchmarkIssue(snapshot)) {
    y = create();
    y = wrap("LE POINT DE COMPARAISON", 60, y + 30, 950, 36, C.gold);
    y = wrap(snapshot.benchmark.name, 60, y + 50, 950, 52, C.ivory, "Georgia");
    text(
      `${snapshot.month.start} → ${snapshot.month.end}`,
      60,
      y + 35,
      32,
      C.muted,
    );
    text(
      `Portefeuille : ${pct(snapshot.month.value)}`,
      60,
      y + 145,
      54,
      C.gold,
      "Georgia",
    );
    text(
      `Benchmark : ${pct(snapshot.benchmark.value)}`,
      60,
      y + 245,
      54,
      C.ivory,
      "Georgia",
    );
    text(
      `${snapshot.currency} · dividendes réinvestis`,
      60,
      y + 330,
      32,
      C.muted,
    );
    finish();
  }
  if (needsDetails) {
    y = create();
    text("TOUS LES PLACEMENTS", 60, y, 32, C.gold);
    y += 70;
    if (longProfileName) y = wrap(nameOf(profile), 60, y, 950, 32) + 30;
    for (const row of positions) {
      let firstLine = true;
      const rows = lines(row.name, 740, 40);
      if (y + Math.min(rows.length, 3) * 50 > 1180) {
        finish();
        y = create();
        text("LES PLACEMENTS · SUITE", 60, y, 32, C.gold);
        y += 70;
      }
      for (const line of rows) {
        if (y > 1180) {
          finish();
          y = create();
          text("LES PLACEMENTS · SUITE", 60, y, 32, C.gold);
          y += 70;
        }
        text(line, 60, y, 40);
        if (firstLine) {
          ctx.textAlign = "right";
          text(editorialWeight(row.weight), 1020, y, 40, C.gold);
          ctx.textAlign = "left";
          firstLine = false;
        }
        y += 50;
      }
      y += 35;
    }
    finish();
  }
  return pages;
}
