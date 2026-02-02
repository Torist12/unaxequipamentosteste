import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Vehicle, VehicleTrip } from '@/types/database';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Gera relatório PDF de veículos
export function generateVehiclePdfReport(vehicles: Vehicle[]) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text('Relatório de Veículos', 14, 22);

  // Data
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    30
  );

  // Tabela
  const tableData = vehicles.map((v) => [
    v.plate,
    v.model,
    v.status,
    v.current_user?.name || '-',
    format(new Date(v.created_at), 'dd/MM/yyyy', { locale: ptBR }),
  ]);

  autoTable(doc, {
    head: [['Placa', 'Modelo', 'Status', 'Usuário Atual', 'Cadastrado em']],
    body: tableData,
    startY: 38,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [220, 53, 69] },
  });

  // Resumo
  const y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total de veículos: ${vehicles.length}`, 14, y);
  doc.text(
    `Disponíveis: ${vehicles.filter((v) => v.status === 'Disponível').length}`,
    14,
    y + 6
  );
  doc.text(
    `Em uso: ${vehicles.filter((v) => v.status === 'Em uso').length}`,
    14,
    y + 12
  );
  doc.text(
    `Manutenção: ${vehicles.filter((v) => v.status === 'Manutenção').length}`,
    14,
    y + 18
  );

  doc.save(`veiculos_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Gera relatório Excel de veículos
export function generateVehicleExcelReport(vehicles: Vehicle[]) {
  const data = vehicles.map((v) => ({
    Placa: v.plate,
    Modelo: v.model,
    Status: v.status,
    'Usuário Atual': v.current_user?.name || '-',
    'Cadastrado em': format(new Date(v.created_at), 'dd/MM/yyyy', { locale: ptBR }),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Veículos');

  // Ajusta largura das colunas
  ws['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
  ];

  XLSX.writeFile(wb, `veiculos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// Calcula duração da viagem
function calculateTripDuration(trip: VehicleTrip): string {
  if (!trip.end_time) return 'Em andamento';

  const minutes = differenceInMinutes(
    new Date(trip.end_time),
    new Date(trip.start_time)
  );

  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

// Gera relatório PDF de viagens
export function generateTripPdfReport(trips: VehicleTrip[]) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text('Relatório de Viagens', 14, 22);

  // Data
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    30
  );

  // Tabela
  const tableData = trips.map((t) => [
    (t.vehicle as any)?.plate || '-',
    (t.user as any)?.name || '-',
    format(new Date(t.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    t.end_time
      ? format(new Date(t.end_time), "dd/MM/yyyy HH:mm", { locale: ptBR })
      : '-',
    calculateTripDuration(t),
    t.status,
  ]);

  autoTable(doc, {
    head: [['Veículo', 'Responsável', 'Início', 'Fim', 'Duração', 'Status']],
    body: tableData,
    startY: 38,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [220, 53, 69] },
  });

  // Resumo
  const y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total de viagens: ${trips.length}`, 14, y);
  doc.text(
    `Finalizadas: ${trips.filter((t) => t.status === 'Finalizada').length}`,
    14,
    y + 6
  );
  doc.text(
    `Em andamento: ${trips.filter((t) => t.status === 'Em andamento').length}`,
    14,
    y + 12
  );

  doc.save(`viagens_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Gera relatório Excel de viagens
export function generateTripExcelReport(trips: VehicleTrip[]) {
  const data = trips.map((t) => ({
    Veículo: (t.vehicle as any)?.plate || '-',
    Modelo: (t.vehicle as any)?.model || '-',
    Responsável: (t.user as any)?.name || '-',
    Início: format(new Date(t.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    Fim: t.end_time
      ? format(new Date(t.end_time), "dd/MM/yyyy HH:mm", { locale: ptBR })
      : '-',
    Duração: calculateTripDuration(t),
    Status: t.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Viagens');

  // Ajusta largura das colunas
  ws['!cols'] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.writeFile(wb, `viagens_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
