import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  label: string;
  patrimony?: string;
  size?: number;
}

export function QRCodeDisplay({ value, label, patrimony, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
  };

  const generatePNG = (): Promise<string> => {
    return new Promise((resolve) => {
      const svg = document.getElementById(`qr-${value}`);
      if (!svg) return resolve('');
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Tamanho maior para incluir texto
      const padding = 40;
      const textHeight = 60;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2 + textHeight;
      
      img.onload = () => {
        if (!ctx) return resolve('');
        
        // Fundo branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // QR Code
        ctx.drawImage(img, padding, padding, size, size);
        
        // Nome do equipamento
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 14px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, canvas.width / 2, size + padding + 20);
        
        // ID do equipamento
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#444444';
        ctx.fillText(`ID: ${value}`, canvas.width / 2, size + padding + 38);
        
        // Patrimônio
        if (patrimony) {
          ctx.font = '11px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#666666';
          ctx.fillText(`PAT: ${patrimony}`, canvas.width / 2, size + padding + 54);
        }
        
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
  };

  const handleDownload = async () => {
    const pngData = await generatePNG();
    if (!pngData) return;
    
    const filename = `QRCode-${sanitizeFilename(label)}${patrimony ? `-${sanitizeFilename(patrimony)}` : ''}.png`;
    const downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = pngData;
    downloadLink.click();
  };

  const handlePrint = async () => {
    const pngData = await generatePNG();
    if (!pngData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${label}</title>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            img { max-width: 100%; }
            @media print {
              body { padding: 20mm; }
            }
          </style>
        </head>
        <body>
          <img src="${pngData}" alt="QR Code ${label}" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{label}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="qr-container">
            <QRCodeSVG
              id={`qr-${value}`}
              value={value}
              size={size}
              level="H"
              includeMargin
            />
          </div>
          {patrimony && (
            <p className="text-sm text-muted-foreground">
              Patrimônio: <span className="font-mono font-medium">{patrimony}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground font-mono break-all max-w-full px-4">{value}</p>
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Baixar PNG
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
