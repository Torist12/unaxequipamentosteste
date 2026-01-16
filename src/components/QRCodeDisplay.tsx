import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Download } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  label: string;
  size?: number;
}

export function QRCodeDisplay({ value, label, size = 200 }: QRCodeDisplayProps) {
  const handleDownload = () => {
    const svg = document.getElementById(`qr-${value}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QRCode-${label}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
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
          <p className="text-sm text-muted-foreground font-mono">{value}</p>
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Baixar QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
