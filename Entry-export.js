'use strict';

// Small, dependency-free OOXML writer for this mockup's tabular downloads.
// Strings are inline text cells (never interpreted as Excel formulas).
function buildEntryWorkbook(record, rows, mode) {
  const xml = value => String(value ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const column = index => { let result = ''; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result; return result; };
  const date = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value) : '';
  const registeredAtcc = String(record.registration?.atcc || '').trim();
  const baseName = String(record.name || '').trim();
  const organismName = /\bATCC\s+\d+/i.test(baseName) || !registeredAtcc ? baseName : `${baseName} ${registeredAtcc}`;
  const identity = [record.id, organismName || 'Not specified', record.registration?.batch || record.batch || ''];
  const modeColumns = {
    culture: [['Monthly QC ID', 'id'], ['Source Tube', 'vial'], ['Identification Test', 'test'], ['Expected Result', 'expected'], ['Kit Lot Number', 'lot'], ['Passage (Monthly)', 'passage'], ['Working Slant', 'workingSlant'], ['Working Culture Prepared', 'quantity'], ['Status', 'performance'], ['Kit Expiry Date', 'expiry'], ['Date Prepared', 'datePrepared'], ['Date Discarded', 'dateDiscarded']],
    subculture: [['Subculture ID', 'id'], ['Source Tube', 'vial'], ['Number of Working Culture (Slant)', 'quantity'], ['Passage (Working)', 'passage'], ['Identification Test', 'test'], ['Kit Lot Number', 'lot'], ['Kit Expiry Date', 'expiry'], ['Expected Result', 'expected'], ['Status', 'performance']],
    weekly: [['Weekly QC ID', 'id'], ['Source Tube', 'vial'], ['Number of Working Culture (Slant)', 'quantity'], ['Passage Working', 'passage'], ['Passage Weekly', 'weeklyPassage'], ['Media', 'media'], ['Media Lot Number', 'lot'], ['Media Expiry Date', 'expiry'], ['Date Prepared', 'datePrepared'], ['Date Discarded', 'dateDiscarded']]
  }[mode];
  const auditColumns = [['Performed By', 'performedBy'], ['Performed Date', 'performedAt'], ['Reviewed By', 'reviewedBy'], ['Reviewed Date', 'reviewedAt'], ['Endorsed By', 'endorsedBy'], ['Endorsed Date', 'endorsedAt']];
  const columns = [...modeColumns, ...auditColumns];
  const headers = ['Organism ID', 'Organism Name', 'Batch / Lot Number', ...columns.map(([label]) => label)];
  const dateKeys = new Set(['expiry', 'datePrepared', 'dateDiscarded', 'performedAt', 'reviewedAt', 'endorsedAt']);
  const data = [headers, ...rows.map(row => [...identity, ...columns.map(([, key]) => {
    const value = row[key];
    if (!dateKeys.has(key) || !value) return value ?? '';
    return date(['expiry', 'datePrepared', 'dateDiscarded'].includes(key) ? value + 'T00:00:00' : value);
  })])];
  const cells = data.map((values, r) => '<row r="' + (r + 1) + '"' + (r === 0 ? ' ht="32" customHeight="1"' : '') + '>' + values.map((value, c) => {
    const ref = column(c) + (r + 1);
    if (r > 0 && value instanceof Date) {
      // Excel has no timezone; preserve the local date/time displayed by Entry.
      const serial = (Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes(), value.getSeconds()) - Date.UTC(1899, 11, 30)) / 86400000;
      return '<c r="' + ref + '" s="' + (['Kit Expiry Date', 'Media Expiry Date', 'Date Prepared', 'Date Discarded'].includes(headers[c]) ? 2 : 3) + '"><v>' + serial + '</v></c>';
    }
    if (r > 0 && typeof value === 'number' && Number.isFinite(value)) return '<c r="' + ref + '"><v>' + value + '</v></c>';
    return '<c r="' + ref + '" t="inlineStr" s="' + (r === 0 ? 1 : 0) + '"><is><t xml:space="preserve">' + xml(value) + '</t></is></c>';
  }).join('') + '</row>').join('');
  const sheetName = mode === 'culture' ? 'Monthly Checking' : mode === 'weekly' ? 'Weekly Culture' : 'Working Culture';
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<?xml version="1.0"?><workbook xmlns="' + ns + '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + sheetName + '" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml': '<?xml version="1.0"?><styleSheet xmlns="' + ns + '"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd mmm yyyy"/><numFmt numFmtId="165" formatCode="dd mmm yyyy hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF236B92"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    'xl/worksheets/sheet1.xml': '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="' + ns + '"><dimension ref="A1:' + column(headers.length - 1) + data.length + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' + headers.map((header, c) => '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + (['Organism Name', 'Identification Test', 'Expected Result'].includes(header) ? 36 : ['Performed Date', 'Reviewed Date', 'Endorsed Date'].includes(header) ? 24 : 22) + '" customWidth="1"/>').join('') + '</cols><sheetData>' + cells + '</sheetData><autoFilter ref="A1:' + column(headers.length - 1) + data.length + '"/></worksheet>'
  };
  return zipEntryFiles(files);
}

function zipEntryFiles(files) {
  const encoder = new TextEncoder();
  const local = [], central = [];
  let offset = 0;
  const crc32 = bytes => {
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    return (crc ^ 0xffffffff) >>> 0;
  };
  for (const [path, content] of Object.entries(files)) {
    const name = encoder.encode(path), bytes = encoder.encode(content), crc = crc32(bytes);
    const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer);
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(12, 33, true);
    h.setUint32(14, crc, true); h.setUint32(18, bytes.length, true); h.setUint32(22, bytes.length, true); h.setUint16(26, name.length, true); header.set(name, 30);
    local.push(header, bytes);
    const directory = new Uint8Array(46 + name.length), d = new DataView(directory.buffer);
    d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(14, 33, true);
    d.setUint32(16, crc, true); d.setUint32(20, bytes.length, true); d.setUint32(24, bytes.length, true); d.setUint16(28, name.length, true); d.setUint32(42, offset, true); directory.set(name, 46);
    central.push(directory); offset += header.length + bytes.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, central.length, true); e.setUint16(10, central.length, true); e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
  const output = new Uint8Array(offset + centralSize + end.length);
  let cursor = 0;
  for (const part of [...local, ...central, end]) { output.set(part, cursor); cursor += part.length; }
  return output;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { buildEntryWorkbook };
