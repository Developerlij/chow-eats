/**
 * Utility to export tables and grids to downloadable CSV format.
 */
export function exportToCSV(filename, headers, rows) {
  const escapeField = (field) => {
    if (field === null || field === undefined) return '';
    const stringValue = String(field);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvRows = [];
  csvRows.push(headers.map(escapeField).join(','));

  for (const row of rows) {
    csvRows.push(row.map(escapeField).join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
