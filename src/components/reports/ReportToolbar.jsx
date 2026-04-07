import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

function exportCSV(headers, rows, filename) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(title, clientName) {
  const printContent = document.getElementById('report-printable');
  if (!printContent) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>${title} - ${clientName}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #222; margin: 32px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          h2 { font-size: 14px; margin-bottom: 12px; color: #555; font-weight: normal; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; text-transform: capitalize; }
          .section-title { font-size: 14px; font-weight: bold; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
          .summary-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
          .summary-value { font-size: 20px; font-weight: bold; }
          .summary-label { font-size: 11px; color: #888; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

export default function ReportToolbar({ title, clientName, csvHeaders, csvRows, csvFilename }) {
  return (
    <div className="flex items-center justify-between mb-4 print:hidden">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{clientName}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => exportCSV(csvHeaders, csvRows, csvFilename)}>
          <Download className="w-4 h-4 mr-2" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportPDF(title, clientName)}>
          <Download className="w-4 h-4 mr-2" /> PDF / Print
        </Button>
      </div>
    </div>
  );
}