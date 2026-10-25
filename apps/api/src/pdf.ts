import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formatWhen } from '@repo/shared';
import PDFDocument from 'pdfkit';
import { ROOT } from './config.ts';
import type { Report } from './reports.ts';

// The report as an A4 landscape PDF in the house style: limestone-quiet, gold hairlines,
// Cormorant for the title, Jost for everything else, the Live Luxe monogram top left.

const FONT_DIR = resolve(ROOT, 'apps/api/node_modules/@fontsource');
const FONTS = {
  display: resolve(FONT_DIR, 'cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff'),
  body: resolve(FONT_DIR, 'jost/files/jost-latin-400-normal.woff'),
  medium: resolve(FONT_DIR, 'jost/files/jost-latin-500-normal.woff'),
};
const MARK_PATH = readFileSync(resolve(ROOT, 'apps/web/src/components/ll-mark.svg'), 'utf8').match(/ d="([^"]+)"/)![1]!;
const MARK_VIEWBOX_HEIGHT = 1018.2;

const C = {
  ink: '#0a0a0c',
  inkSoft: '#2e2d31',
  muted: '#5e574e',
  bronze: '#7c5e26',
  gold: '#d3ac60',
};

const PAGE = { margin: 36, header: 9, cell: 8.5, padX: 6, padY: 5 };
// Long text is for the CSV; in the PDF it's flattened to one paragraph and cut short, so a row stays a row.
const MAX_CELL_CHARS = 240;

function clip(s: string): string {
  const flat = s.length > 120 ? s.replace(/\s+/g, ' ').trim() : s;
  return flat.length > MAX_CELL_CHARS ? `${flat.slice(0, flat.lastIndexOf(' ', MAX_CELL_CHARS)).trimEnd()}…` : flat;
}

export function toPdf(report: Report, generatedBy: string): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: PAGE.margin,
    bufferPages: true,
    info: { Title: 'Property report · Live Luxe', Author: generatedBy, Creator: 'Listing Repo' },
  });
  doc.registerFont('display', FONTS.display);
  doc.registerFont('body', FONTS.body);
  doc.registerFont('medium', FONTS.medium);

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(chunks))));

  const left = PAGE.margin;
  const width = doc.page.width - PAGE.margin * 2;
  const bottom = doc.page.height - PAGE.margin - 18; // room for the footer

  // ---- masthead
  doc.save().translate(left, PAGE.margin).scale(24 / MARK_VIEWBOX_HEIGHT).path(MARK_PATH).fill(C.ink).restore();
  doc
    .font('medium')
    .fontSize(7.5)
    .fillColor(C.bronze)
    .text('LIVE LUXE · LISTING REPO', left + 30, PAGE.margin + 9, { characterSpacing: 1.6, lineBreak: false });
  doc
    .font('body')
    .fontSize(8)
    .fillColor(C.muted)
    .text(`Generated ${formatWhen(new Date().toISOString())} by ${generatedBy}`, left, PAGE.margin + 9, { width, align: 'right' });
  doc
    .moveTo(left, PAGE.margin + 32)
    .lineTo(left + width, PAGE.margin + 32)
    .lineWidth(0.6)
    .strokeColor(C.gold)
    .stroke();

  doc.font('display').fontSize(26).fillColor(C.ink).text('Property report', left, PAGE.margin + 46);
  doc
    .font('medium')
    .fontSize(8)
    .fillColor(C.bronze)
    .text(`${report.total} ${report.total === 1 ? 'PROPERTY' : 'PROPERTIES'}`, { characterSpacing: 1.6 });
  doc.moveDown(0.3).font('body').fontSize(9).fillColor(C.muted).text(report.filters.join(';  '), { width });
  doc.moveDown(1);

  // ---- column widths: share the page by each column's natural width, within sensible bounds
  doc.font('body').fontSize(PAGE.cell);
  const natural = report.columns.map((col, i) => {
    doc.font('medium').fontSize(PAGE.header);
    const head = doc.widthOfString(col.label.toUpperCase(), { characterSpacing: 1 });
    doc.font('body').fontSize(PAGE.cell);
    const widest = report.rows.reduce((m, r) => Math.max(m, doc.widthOfString(clip(r[i] ?? '').split('\n')[0] ?? '')), 0);
    return Math.min(Math.max(head, widest, 40), 240) + PAGE.padX * 2;
  });
  const sum = natural.reduce((a, b) => a + b, 0);
  const widths = natural.map((w) => (w / sum) * width);

  const drawHeader = () => {
    let x = left;
    const y = doc.y;
    doc.font('medium').fontSize(PAGE.header - 1.5).fillColor(C.bronze);
    const h = Math.max(...report.columns.map((c, i) => doc.heightOfString(c.label.toUpperCase(), { width: widths[i]! - PAGE.padX * 2, characterSpacing: 1 })));
    report.columns.forEach((c, i) => {
      doc.text(c.label.toUpperCase(), x + PAGE.padX, y + PAGE.padY, { width: widths[i]! - PAGE.padX * 2, characterSpacing: 1 });
      x += widths[i]!;
    });
    const end = y + h + PAGE.padY * 2;
    doc.moveTo(left, end).lineTo(left + width, end).lineWidth(0.8).strokeColor(C.gold).stroke();
    doc.y = end;
  };

  drawHeader();

  doc.font('body').fontSize(PAGE.cell);
  for (const row of report.rows) {
    const texts = row.map(clip);
    const h =
      Math.max(
        ...texts.map((t, i) => {
          const isName = report.columns[i]!.key === 'p:name';
          doc.font(isName ? 'display' : 'body').fontSize(isName ? PAGE.cell + 1.5 : PAGE.cell);
          return doc.heightOfString(t || ' ', { width: widths[i]! - PAGE.padX * 2, lineGap: 1.5 });
        }),
      ) + PAGE.padY * 2;
    if (doc.y + h > bottom) {
      doc.addPage();
      doc.y = PAGE.margin;
      drawHeader();
      doc.font('body').fontSize(PAGE.cell);
    }
    const y = doc.y;
    let x = left;
    texts.forEach((t, i) => {
      // Two voices: the property name in Cormorant, everything else in Jost.
      const isName = report.columns[i]!.key === 'p:name';
      doc
        .font(isName ? 'display' : 'body')
        .fontSize(isName ? PAGE.cell + 1.5 : PAGE.cell)
        .fillColor(isName ? C.ink : C.inkSoft)
        .text(t, x + PAGE.padX, y + PAGE.padY, { width: widths[i]! - PAGE.padX * 2, lineGap: 1.5 });
      x += widths[i]!;
    });
    doc
      .moveTo(left, y + h)
      .lineTo(left + width, y + h)
      .lineWidth(0.4)
      .strokeColor(C.gold)
      .strokeOpacity(0.55)
      .stroke()
      .strokeOpacity(1);
    doc.y = y + h;
  }

  if (report.rows.length === 0) {
    doc.moveDown(1).font('body').fontSize(10).fillColor(C.muted).text('No properties match these filters.', left);
  }

  // ---- footer on every page
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Writing inside the bottom margin would otherwise start a new page.
    doc.page.margins.bottom = 0;
    doc
      .font('body')
      .fontSize(7.5)
      .fillColor(C.muted)
      .text(`Page ${i + 1} of ${range.count}`, left, doc.page.height - PAGE.margin - 8, { width, align: 'right', lineBreak: false });
  }

  doc.end();
  return done;
}
