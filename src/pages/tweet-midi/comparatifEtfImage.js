// Affiche PNG du format Comparatif ETF. Toutes les données viennent du thème affiché.
const W = 1600;
const CARD_W = 720;
const CARD_H = 780;
const ROW_H = 825;
const TOP = 410;
const COLORS = ['#85d3ba', '#ffc080', '#d5b9ed', '#a7c8f7'];
const INK = '#17303a';
const MUTED = '#43605e';
const FONT = '"DejaVu Sans", Arial, sans-serif';

function txt(ctx, str, x, y, size, color, bold = false, align = 'left') {
  ctx.font = `${bold ? 700 : 400} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(String(str), x, y);
  ctx.textAlign = 'left';
}

function wrap(ctx, value, maxWidth, size, bold = false) {
  ctx.font = `${bold ? 700 : 400} ${size}px ${FONT}`;
  const rows = [];
  let current = '';
  for (const word of String(value).split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      rows.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) rows.push(current);
  return rows;
}

function fitted(ctx, value, maxWidth, maxRows, start, min, bold = false) {
  for (let size = start; size >= min; size -= 2) {
    const rows = wrap(ctx, value, maxWidth, size, bold);
    if (rows.length <= maxRows && rows.every((row) => {
      ctx.font = `${bold ? 700 : 400} ${size}px ${FONT}`;
      return ctx.measureText(row).width <= maxWidth;
    })) return { size, rows };
  }
  return { size: min, rows: wrap(ctx, value, maxWidth, min, bold) };
}

function placement(fund) {
  const note = fund.differenciateur.toLowerCase();
  if (/\bpea\b/.test(note) && !/non[ -]éligible pea/.test(note)) return 'PEA';
  if (/\bcto\b/.test(note)) return 'CTO';
  return null;
}

function card(ctx, fund, i, total) {
  const x = total % 2 === 1 && i === total - 1 ? (W - CARD_W) / 2 : 65 + (i % 2) * (CARD_W + 35);
  const y = TOP + Math.floor(i / 2) * ROW_H;
  const color = COLORS[i % COLORS.length];
  ctx.fillStyle = '#f8f5e9';
  ctx.beginPath(); ctx.roundRect(x, y, CARD_W, CARD_H, 32); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(x, y, CARD_W, 17);
  const badge = placement(fund);
  if (badge) {
    ctx.beginPath(); ctx.roundRect(x + 38, y + 52, 152, 64, 27); ctx.fill();
    txt(ctx, badge, x + 114, y + 64, 39, INK, true, 'center');
  }
  const fullName = fund.nom.replace(/ UCITS ETF.*$/i, '').replace(/ ETF$/i, '');
  const title = fitted(ctx, fullName, 644, 3, 56, 40, true);
  title.rows.forEach((row, j) => txt(ctx, row, x + 38, y + 151 + j * (title.size + 6), title.size, INK, true));
  txt(ctx, 'TER', x + 38, y + 357, 37, '#596b67', true);
  const fee = `${fund.frais.replace(/\s*%$/, '')} %`;
  txt(ctx, fee, x + 38, y + 406, 98, '#154d46', true);
  ctx.fillStyle = '#cbd5ca'; ctx.fillRect(x + 38, y + 536, 644, 3);
  txt(ctx, fund.isin, x + 38, y + 560, 39, INK, true);
  txt(ctx, `${fund.encours} d’encours`, x + 38, y + 616, 36, MUTED);
  const detail = fitted(ctx, fund.differenciateur, 644, 3, 30, 25);
  detail.rows.forEach((row, j) => txt(ctx, row, x + 38, y + 662 + j * (detail.size + 5), detail.size, MUTED));
}

export async function renderComparatifEtfImage(theme) {
  await document.fonts.ready;
  const rows = Math.ceil(theme.etfs.length / 2);
  const H = TOP + rows * ROW_H + 80;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#122c35'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#345b5a'; ctx.lineWidth = 48;
  ctx.beginPath(); ctx.arc(1820, -130, 350, 0.5, 2.8); ctx.stroke();
  txt(ctx, 'ÉPARGNANT LIBRE  /  COMPARATIF ETF', W / 2, 72, 35, '#c6e6d6', true, 'center');
  const kind = theme.id === 'etc-metaux' ? 'PRODUITS' : 'ETF';
  const title = `${theme.id === 'monde' ? 'LE MONDE' : theme.nom.toLocaleUpperCase('fr-FR')} EN ${theme.etfs.length} ${kind}`;
  const heading = fitted(ctx, title, W - 130, 2, 100, 51, true);
  heading.rows.forEach((row, i) => txt(ctx, row, W / 2, heading.rows.length === 1 ? 155 : 116 + i * 88, Math.min(heading.size, heading.rows.length === 1 ? 100 : 74), '#fff4da', true, 'center'));
  txt(ctx, 'Exposition · frais · enveloppe · ISIN', W / 2, 319, 43, '#afc7bf', false, 'center');
  theme.etfs.forEach((fund, i) => card(ctx, fund, i, theme.etfs.length));
  txt(ctx, '@Epargnantlibre', W / 2, H - 69, 45, '#fff4da', true, 'center');
  return canvas;
}

export async function downloadComparatifEtfImage(theme) {
  const canvas = await renderComparatifEtfImage(theme);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Échec de la génération du PNG');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `comparatif-etf-${theme.id}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
