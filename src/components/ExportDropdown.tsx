import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface ExportDropdownProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
}

export function ExportDropdown({ onExportPDF, onExportExcel, disabled }: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-500" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Exportar Planilha (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
