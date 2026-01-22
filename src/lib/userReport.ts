import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface UserData {
  id: string;
  name: string;
  role: string;
  qr_code: string;
  created_at: string;
  department?: { name: string } | null;
}

// PDF Report for Users
export function generateUserPdfReport(users: UserData[]) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(220, 38, 38); // Red color
  doc.text('UNAX Group', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('RELATÓRIO DE USUÁRIOS', 14, 30);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const dateStr = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
  doc.text(dateStr, 14, 38);
  doc.text(`Total de usuários: ${users.length}`, 14, 44);
  
  // Table data
  const tableData = users.map((user, index) => [
    index + 1,
    user.qr_code,
    user.name,
    user.department?.name || '-',
    user.role,
    new Date(user.created_at).toLocaleDateString('pt-BR'),
  ]);
  
  // Generate table
  autoTable(doc, {
    head: [['#', 'ID', 'Nome Completo', 'Departamento', 'Cargo', 'Data de Cadastro']],
    body: tableData,
    startY: 50,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 35 },
      4: { cellWidth: 40 },
      5: { cellWidth: 28 },
    },
  });
  
  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `UNAX Group - Sistema de Gestão de Equipamentos | Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_usuarios_${timestamp}.pdf`);
}

// Excel Report for Users
export function generateUserExcelReport(users: UserData[]) {
  // Prepare data
  const data = users.map((user, index) => ({
    '#': index + 1,
    'ID': user.qr_code,
    'Nome Completo': user.name,
    'Departamento': user.department?.name || '-',
    'Cargo': user.role,
    'Data de Cadastro': new Date(user.created_at).toLocaleDateString('pt-BR'),
  }));
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Header rows
  const title = 'UNAX Group - RELATÓRIO DE USUÁRIOS';
  const dateStr = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
  const totalStr = `Total de usuários: ${users.length}`;
  
  const wsData = [
    [title],
    [dateStr],
    [totalStr],
    [],
    ['#', 'ID', 'Nome Completo', 'Departamento', 'Cargo', 'Data de Cadastro'],
    ...data.map(row => Object.values(row))
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Column widths
  worksheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 15 },  // ID
    { wch: 35 },  // Nome
    { wch: 20 },  // Departamento
    { wch: 25 },  // Cargo
    { wch: 18 },  // Data
  ];
  
  // Merge title cells
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuários');
  
  // Save
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `relatorio_usuarios_${timestamp}.xlsx`);
}
