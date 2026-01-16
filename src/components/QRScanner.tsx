import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  label?: string;
}

export function QRScanner({ onScan, label = 'Escaneie o QR Code' }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>(`qr-reader-${Date.now()}`);

  const startScanner = async () => {
    try {
      setError(null);
      const html5QrCode = new Html5Qrcode(containerRef.current);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {}
      );
      
      setIsScanning(true);
    } catch (err) {
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      console.error(err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <p className="text-sm font-medium">{label}</p>
      </div>
      
      <div className="relative">
        <div 
          id={containerRef.current}
          className="aspect-square bg-muted"
          style={{ display: isScanning ? 'block' : 'none' }}
        />
        
        {!isScanning && (
          <div className="aspect-square bg-muted flex flex-col items-center justify-center gap-4">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <Button onClick={startScanner} className="gap-2">
              <Camera className="h-4 w-4" />
              Iniciar Câmera
            </Button>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center p-4">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}
      </div>
      
      {isScanning && (
        <div className="p-4 border-t">
          <Button onClick={stopScanner} variant="outline" className="w-full gap-2">
            <CameraOff className="h-4 w-4" />
            Parar Câmera
          </Button>
        </div>
      )}
    </Card>
  );
}
