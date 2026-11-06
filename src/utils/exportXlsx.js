/**
 * A real Excel workbook (.xlsx), not a CSV.
 *
 * Arabic Windows Excel opens a comma-separated file with every value in
 * column A, because its list separator is not the comma — the school saw one
 * long line of quoted numbers per teacher. A workbook carries its own columns,
 * right-to-left direction, widths and a styled header, so it opens ready to
 * read. ExcelJS is loaded only when someone exports.
 *
 * columns: [{ header, key, width?, numFmt? }]
 */
export async function downloadXlsx({ fileName, sheetName = "تقرير", title, columns, rows }) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ rightToLeft: true, state: "frozen", ySplit: title ? 2 : 1 }],
  });

  if (title) {
    sheet.mergeCells(1, 1, 1, columns.length);
    const cell = sheet.getCell(1, 1);
    cell.value = title;
    cell.font = { bold: true, size: 13 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 24;
  }

  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF244A70" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FF9AA6B2" } } };
  });
  headerRow.height = 32;

  rows.forEach((row, index) => {
    const added = sheet.addRow(columns.map((c) => row[c.key] ?? ""));
    added.eachCell((cell, col) => {
      cell.alignment = { horizontal: col === 1 ? "right" : "center", vertical: "middle" };
      if (columns[col - 1]?.numFmt) cell.numFmt = columns[col - 1].numFmt;
      if (index % 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7FA" } };
    });
  });

  columns.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width || Math.max(12, String(c.header).length + 4);
  });
  sheet.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: headerRow.number, column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 8410 minutes → "140:10" (hours:minutes), what a person reads at a glance. */
export const minutesToHours = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
