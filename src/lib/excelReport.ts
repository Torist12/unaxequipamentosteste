import * as XLSX from 'xlsx';

interface EquipmentData {
  id: string;
  name: string;
  patrimony_number: string;
  status: string;
  category?: { name: string } | null;
  current_user?: { name: string } | null;
}

export function generateEquipmentSpreadsheet(
  equipment: EquipmentData[],
  filters?: { status?: string; category?: string }
) {
  // Prepare data for Excel
  const data = equipment.map((eq, index) => ({
    '#': index + 1,
    'ID': eq.patrimony_number,
    'Nome': eq.name,
    'Categoria': eq.category?.name || '-',
    'Status': eq.status,
    'Responsável': eq.current_user?.name || '-',
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  
  // Create header with title
  const title = 'UNAX Group - LEVANTAMENTO DE EQUIPAMENTOS';
  const subtitle = generateSubtitle(filters);
  const dateStr = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
  
  // Create worksheet with headers
  const wsData = [
    [title],
    [subtitle],
    [dateStr],
    [], // Empty row
    ['#', 'ID', 'Nome', 'Categoria', 'Status', 'Responsável'],
    ...data.map(row => Object.values(row))
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 15 },  // ID
    { wch: 30 },  // Nome
    { wch: 15 },  // Categoria
    { wch: 12 },  // Status
    { wch: 25 },  // Responsável
  ];
  
  // Merge title cells
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Subtitle
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Date
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipamentos');
  
  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `levantamento_equipamentos_${timestamp}.xlsx`;
  
  // Download file
  XLSX.writeFile(workbook, filename);
}

function generateSubtitle(filters?: { status?: string; category?: string }): string {
  const parts: string[] = [];
  if (filters?.status) parts.push(`Status: ${filters.status}`);
  if (filters?.category) parts.push(`Categoria: ${filters.category}`);
  return parts.length > 0 ? `Filtros: ${parts.join(' | ')}` : 'Todos os equipamentos';
}

// Function to generate printable HTML version
export function generatePrintableSpreadsheet(
  equipment: EquipmentData[],
  filters?: { status?: string; category?: string },
  logoUrl?: string
) {
  const subtitle = generateSubtitle(filters);
  const dateStr = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
  
  const tableRows = equipment.map((eq, index) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">${eq.patrimony_number}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${eq.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${eq.category?.name || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${eq.status}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${eq.current_user?.name || '-'}</td>
    </tr>
  `).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>UNAX Group - Levantamento de Equipamentos</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .logo { height: 60px; }
        .brand { color: #dc2626; font-size: 28px; font-weight: bold; margin: 0; }
        h1 { color: #1a1a1a; margin: 5px 0 0 0; font-size: 20px; }
        .subtitle { color: #666; margin: 5px 0; }
        .date { color: #888; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #dc2626; color: white; padding: 10px; text-align: left; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 20px; text-align: center; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="UNAX" class="logo" />` : ''}
        <div>
          <p class="brand">UNAX Group</p>
          <h1>LEVANTAMENTO DE EQUIPAMENTOS</h1>
          <p class="subtitle">${subtitle}</p>
        </div>
      </div>
      <p class="date">${dateStr}</p>
      
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th style="width: 120px;">ID</th>
            <th>Nome</th>
            <th style="width: 120px;">Categoria</th>
            <th style="width: 100px;">Status</th>
            <th style="width: 150px;">Responsável</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Total de equipamentos: ${equipment.length}</p>
        <p>UNAX - Sistema de Gestão de Equipamentos</p>
      </div>
      
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
