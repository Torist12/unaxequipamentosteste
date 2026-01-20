import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Equipment } from '@/types/database';

interface ReportFilters {
  status?: string;
  category?: string;
}

export function generateEquipmentReport(
  equipment: Equipment[],
  filters: ReportFilters = {}
) {
  const doc = new jsPDF();
  
  // Header with company name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red color
  doc.text('UNAX Group', 14, 18);
  
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text('Relatório de Equipamentos', 14, 28);
  
  // Subtitle with filters
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  
  let filterText = 'Todos os equipamentos';
  const filterParts: string[] = [];
  
  if (filters.status && filters.status !== 'all') {
    filterParts.push(`Status: ${filters.status}`);
  }
  if (filters.category && filters.category !== 'all') {
    filterParts.push(`Categoria: ${filters.category}`);
  }
  
  if (filterParts.length > 0) {
    filterText = filterParts.join(' | ');
  }
  
  doc.text(filterText, 14, 36);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 42);
  
  // Reset text color
  doc.setTextColor(0);
  
  // Table data
  const tableData = equipment.map((eq) => [
    eq.id.substring(0, 8),
    eq.name,
    eq.category?.name || '-',
    eq.patrimony_number,
    eq.status,
    eq.current_user?.name || '-'
  ]);
  
  // Generate table
  autoTable(doc, {
    head: [['ID', 'Nome', 'Categoria', 'Patrimônio', 'Status', 'Responsável']],
    body: tableData,
    startY: 50,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [220, 38, 38], // Primary red
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 35 },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  const filename = `relatorio-equipamentos-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
