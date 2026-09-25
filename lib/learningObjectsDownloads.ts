'use client';

export interface DownloadFormulaItem {
  title?: string;
  name?: string;
  formula: string;
  variables?: { symbol: string; description: string; unit?: string }[];
  example?: string;
  description?: string;
}

export interface DownloadFlashcardItem {
  title: string;
  front: string;
  back: string;
  number: number;
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'xpedition-card';
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars = 44) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 12);
}

async function deliverSvg(svg: string, fileName: string) {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not render learning card'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1400;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG conversion failed')), 'image/png', 0.95);
    });
    const pngUrl = URL.createObjectURL(pngBlob);
    const anchor = document.createElement('a');
    anchor.href = pngUrl;
    anchor.download = `${fileName}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(pngUrl);
    return 'downloaded' as const;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadFormulaCards(conceptName: string, formulas: DownloadFormulaItem[]) {
  for (let i = 0; i < formulas.length; i += 1) {
    const item = formulas[i];
    const vars = (item.variables || []).slice(0, 7);
    const variableLines = vars.flatMap((v) => wrapText(`${v.symbol} — ${v.description}${v.unit ? ` (${v.unit})` : ''}`, 46));
    const titleText = item.title || item.name || conceptName || 'Formula';
    const lines = [titleText, '', item.formula, '', ...variableLines, '', ...(item.example ? wrapText(`Example: ${item.example}`, 46) : [])];
    const tspans = lines.map((line, idx) => `<tspan x="62" dy="${idx === 0 ? 0 : 28}">${escapeXml(line)}</tspan>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" rx="42" fill="#f7f1df"/><rect x="24" y="24" width="852" height="1152" rx="34" fill="none" stroke="#164e3a" stroke-width="8"/><rect x="46" y="46" width="808" height="1108" rx="28" fill="none" stroke="#c9bfa8" stroke-width="3"/><text x="450" y="105" text-anchor="middle" font-family="Georgia,serif" font-size="28" font-weight="700" fill="#164e3a">XPEDITION SCIENCE</text><text x="62" y="170" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#171a18">${tspans}</text><text x="62" y="1090" font-family="monospace" font-size="18" fill="#5c665f">${escapeXml(conceptName)} · Formula Card ${i + 1}</text><text x="820" y="1090" text-anchor="end" font-family="Georgia,serif" font-size="34" fill="#164e3a">♣</text></svg>`;
    await deliverSvg(svg, `xpedition-${safeFileName(conceptName)}-formula-${i + 1}`);
  }
}

export async function downloadFlashcards(conceptName: string, cards: DownloadFlashcardItem[]) {
  for (const card of cards) {
    const front = wrapText(card.front, 42);
    const back = wrapText(card.back, 42);
    const frontText = front.map((line, idx) => `<tspan x="450" dy="${idx === 0 ? 0 : 34}">${escapeXml(line)}</tspan>`).join('');
    const backText = back.map((line, idx) => `<tspan x="450" dy="${idx === 0 ? 0 : 30}">${escapeXml(line)}</tspan>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1400" viewBox="0 0 1000 1400"><rect width="1000" height="1400" rx="54" fill="#103a32"/><rect x="28" y="28" width="944" height="1344" rx="44" fill="none" stroke="#f4e7c5" stroke-width="6"/><text x="72" y="100" font-family="monospace" font-size="22" fill="#f4e7c5">XPEDITION</text><text x="928" y="100" text-anchor="end" font-family="Georgia,serif" font-size="46" fill="#f4e7c5">♠</text><text x="500" y="230" text-anchor="middle" font-family="Georgia,serif" font-size="42" font-weight="700" fill="#fff">${escapeXml(card.title)}</text><text x="500" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="600" fill="#fff">${frontText}</text><line x1="130" y1="690" x2="870" y2="690" stroke="#f4e7c5" stroke-width="3" stroke-dasharray="10 12"/><text x="500" y="790" text-anchor="middle" font-family="monospace" font-size="20" fill="#bfe9d6">ANSWER</text><text x="500" y="850" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#fff">${backText}</text><text x="72" y="1310" font-family="monospace" font-size="18" fill="#bfe9d6">${escapeXml(conceptName)}</text><text x="928" y="1310" text-anchor="end" font-family="monospace" font-size="18" fill="#bfe9d6">${card.number}</text></svg>`;
    await deliverSvg(svg, `xpedition-${safeFileName(conceptName)}-flashcard-${card.number}`);
  }
}

export async function downloadStudyNote(conceptName: string, note: string) {
  const lines = wrapText(note || 'No note text saved yet.', 48);
  const noteText = lines.map((line, idx) => `<tspan x="72" dy="${idx === 0 ? 0 : 32}">${escapeXml(line)}</tspan>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1400" viewBox="0 0 1000 1400"><rect width="1000" height="1400" rx="54" fill="#f7f1df"/><rect x="28" y="28" width="944" height="1344" rx="44" fill="none" stroke="#164e3a" stroke-width="7"/><text x="72" y="105" font-family="monospace" font-size="20" fill="#164e3a">XPEDITION NOTE CARD</text><text x="928" y="105" text-anchor="end" font-family="Georgia,serif" font-size="48" fill="#164e3a">♥</text><text x="72" y="185" font-family="Georgia,serif" font-size="36" font-weight="700" fill="#171a18">${escapeXml(conceptName)}</text><line x1="72" y1="220" x2="928" y2="220" stroke="#c9bfa8" stroke-width="3"/><text x="72" y="285" font-family="Arial,sans-serif" font-size="28" fill="#303831">${noteText}</text><text x="72" y="1310" font-family="monospace" font-size="18" fill="#5c665f">Personal study note</text><text x="928" y="1310" text-anchor="end" font-family="Georgia,serif" font-size="40" fill="#164e3a">♥</text></svg>`;
  await deliverSvg(svg, `xpedition-${safeFileName(conceptName)}-notes`);
}
