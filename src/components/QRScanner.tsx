import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  label?: string;
}

export function QRScanner({ onScan, label = 'Escaneie o QR Code' }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef(`qr-reader-${Math.random().toString(36).substr(2, 9)}`);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.log('Error stopping scanner:', err);
    }
    setIsScanning(false);
    setIsInitializing(false);
  }, []);

  const startScanner = async () => {
    if (isInitializing) return;
    
    try {
      setError(null);
      setIsInitializing(true);
      
      // Stop any existing scanner first
      await stopScanner();
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const containerId = containerIdRef.current;
      const container = document.getElementById(containerId);
      
      if (!container) {
        throw new Error('Container not found');
      }
      
      // Check camera permission first
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('Nenhuma câmera encontrada');
      }
      
      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });
      
      scannerRef.current = html5QrCode;
      
      // Determine container size
      const containerWidth = container.clientWidth || 300;
      const qrboxSize = Math.min(250, containerWidth - 40);
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {} // Ignore errors during scanning
      );
      
      setIsScanning(true);
      setIsInitializing(false);
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsInitializing(false);
      
      let errorMsg = 'Não foi possível acessar a câmera.';
      if (err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError') {
        errorMsg = 'Permissão de câmera negada. Verifique as configurações do navegador.';
      } else if (err?.message?.includes('NotFoundError') || err?.message?.includes('Nenhuma câmera')) {
        errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (err?.message?.includes('NotReadableError')) {
        errorMsg = 'Câmera em uso por outro aplicativo.';
      }
      
      setError(errorMsg);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
            }).catch(() => {});
          } else {
            scannerRef.current.clear();
          }
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, []);

  return (
    <Card className="overflow-hidden rounded-2xl">
      <div className="p-4 border-b">
        <p className="text-sm font-medium">{label}</p>
      </div>
      
      <div className="relative bg-muted" style={{ minHeight: 300 }}>
        {/* Scanner container - always rendered */}
        <div 
          id={containerIdRef.current}
          className="w-full"
          style={{ 
            display: isScanning ? 'block' : 'none',
            minHeight: 300
          }}
        />
        
        {/* Placeholder when not scanning */}
        {!isScanning && !isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <Button onClick={startScanner} className="gap-2" disabled={isInitializing}>
              <Camera className="h-4 w-4" />
              Iniciar Câmera
            </Button>
          </div>
        )}
        
        {/* Loading state */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Iniciando câmera...</p>
          </div>
        )}
        
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-destructive/10 flex flex-col items-center justify-center p-4 gap-4">
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" onClick={startScanner} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
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
