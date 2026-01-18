import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const containerIdRef = useRef(`qr-reader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        
        try {
          const state = scanner.getState();
          // State 2 = SCANNING, State 3 = PAUSED
          if (state === 2 || state === 3) {
            await scanner.stop();
          }
        } catch (stopErr) {
          console.log('Stop error (ignorable):', stopErr);
        }
        
        try {
          scanner.clear();
        } catch (clearErr) {
          console.log('Clear error (ignorable):', clearErr);
        }
      }
    } catch (err) {
      console.log('Error in stopScanner:', err);
    }
    
    if (mountedRef.current) {
      setIsScanning(false);
      setIsInitializing(false);
    }
  }, []);

  const startScanner = async () => {
    if (isInitializing || isScanning) return;

    try {
      setError(null);
      setIsInitializing(true);

      // Stop any existing scanner first
      await stopScanner();

      // Give browser time to release camera resources
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!mountedRef.current) return;

      // Basic capability checks (better errors on mobile)
      if (!window.isSecureContext) {
        throw new Error('SecurityError: insecure_context');
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('NotSupportedError: mediaDevices');
      }

      const containerId = containerIdRef.current;
      const container = document.getElementById(containerId);

      if (!container) {
        throw new Error('Container não encontrado');
      }

      // Ensure container has dimensions before starting
      container.style.minHeight = '300px';
      container.style.width = '100%';
      container.style.display = 'block';

      // iOS/Safari: trigger permission prompt first, then release immediately
      try {
        const preflight = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        preflight.getTracks().forEach((t) => t.stop());
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch {
        // Permission errors will be handled by the html5-qrcode start attempt below
      }

      if (!mountedRef.current) return;

      const ua = navigator.userAgent || '';
      const isIOS =
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);

      // Create scanner instance
      const html5QrCode = new Html5Qrcode(containerId, {
        verbose: false,
        experimentalFeatures: {
          // iOS can be unstable with BarcodeDetector; prefer the default decoder
          useBarCodeDetectorIfSupported: !isIOS,
        },
      });

      scannerRef.current = html5QrCode;

      // Calculate optimal qrbox size
      const containerWidth = container.clientWidth || 280;
      const qrboxSize = Math.min(220, Math.floor(containerWidth * 0.7));

      const config = {
        fps: 10,
        qrbox: { width: qrboxSize, height: qrboxSize },
        disableFlip: false,
      };

      const onSuccess = (decodedText: string) => {
        console.log('QR Code scanned:', decodedText);
        onScan(decodedText);
        stopScanner();
      };

      // Try with facingMode first (best for mobile), fallback to cameraId
      try {
        await html5QrCode.start(
          { facingMode: { ideal: 'environment' } },
          config,
          onSuccess,
          () => {}
        );
      } catch (firstErr) {
        try {
          const cameras = await Html5Qrcode.getCameras();
          const cameraId = cameras?.[cameras.length - 1]?.id;
          if (!cameraId) throw firstErr;

          await html5QrCode.start(cameraId, config, onSuccess, () => {});
        } catch {
          throw firstErr;
        }
      }

      // iOS needs playsinline to keep video embedded
      setTimeout(() => {
        const root = document.getElementById(containerId);
        const video = root?.querySelector('video') as HTMLVideoElement | null;
        if (video) {
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          (video as any).playsInline = true;
          video.muted = true;
          video.autoplay = true;
        }
      }, 50);

      if (mountedRef.current) {
        setIsScanning(true);
        setIsInitializing(false);
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);

      if (!mountedRef.current) return;

      setIsInitializing(false);

      // Clean up on error
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }

      let errorMsg = 'Não foi possível acessar a câmera.';
      const errorString = err?.message || err?.name || String(err);

      if (errorString.includes('insecure_context') || errorString.includes('SecurityError')) {
        errorMsg = 'Acesso à câmera bloqueado. Abra pelo link HTTPS (não funciona em páginas não seguras).';
      } else if (errorString.includes('NotSupportedError') || errorString.includes('mediaDevices')) {
        errorMsg = 'Seu navegador não suporta câmera neste modo. Tente Safari/Chrome atualizado.';
      } else if (errorString.includes('NotAllowedError') || errorString.includes('Permission')) {
        errorMsg = 'Permissão de câmera negada. Permita o acesso à câmera e recarregue a página.';
      } else if (errorString.includes('NotFoundError') || errorString.includes('Requested device not found')) {
        errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (errorString.includes('NotReadableError') || errorString.includes('Could not start')) {
        errorMsg = 'Câmera pode estar em uso por outro aplicativo. Feche outros apps e tente novamente.';
      } else if (errorString.includes('OverconstrainedError')) {
        errorMsg = 'Configuração de câmera não suportada. Tente novamente.';
      } else if (errorString.includes('AbortError')) {
        errorMsg = 'Inicialização da câmera foi cancelada. Tente novamente.';
      }

      setError(errorMsg);
    }
  };

  // Stop camera when tab/app goes to background (mobile browsers)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') {
        stopScanner();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;

        try {
          const state = scanner.getState();
          if (state === 2 || state === 3) {
            scanner.stop().catch(() => {});
          }
          scanner.clear();
        } catch (e) {
          // Ignore cleanup errors
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
        {/* Scanner container - always in DOM for proper initialization */}
        <div 
          id={containerIdRef.current}
          className="w-full"
          style={{ 
            minHeight: 300,
            opacity: isScanning || isInitializing ? 1 : 0,
            pointerEvents: isScanning ? 'auto' : 'none',
            position: 'relative',
          }}
        />
        
        {/* Placeholder when not scanning */}
        {!isScanning && !isInitializing && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <Button 
              onClick={startScanner} 
              className="gap-2" 
              disabled={isInitializing}
              type="button"
            >
              <Camera className="h-4 w-4" />
              Iniciar Câmera
            </Button>
          </div>
        )}
        
        {/* Loading state */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted z-10">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Iniciando câmera...</p>
            <p className="text-xs text-muted-foreground text-center px-4">
              Se solicitado, permita o acesso à câmera
            </p>
          </div>
        )}
        
        {/* Error overlay */}
        {error && !isInitializing && (
          <div className="absolute inset-0 bg-destructive/10 flex flex-col items-center justify-center p-4 gap-4 z-10">
            <p className="text-sm text-destructive text-center max-w-xs">{error}</p>
            <Button 
              variant="outline" 
              onClick={startScanner} 
              className="gap-2"
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
      
      {isScanning && (
        <div className="p-4 border-t">
          <Button 
            onClick={stopScanner} 
            variant="outline" 
            className="w-full gap-2"
            type="button"
          >
            <CameraOff className="h-4 w-4" />
            Parar Câmera
          </Button>
        </div>
      )}
    </Card>
  );
}
