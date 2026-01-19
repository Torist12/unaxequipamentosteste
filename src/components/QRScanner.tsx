import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import {
  getCameraErrorMessage,
  requestCameraPermission,
  stopCameraStream,
} from '@/lib/camera';

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

  const pickPreferredCameraId = useCallback(async () => {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras || cameras.length === 0) return null;

    // Labels só aparecem após permissão; por isso pedimos permissão antes.
    const labels = cameras.map((c) => ({ ...c, label: (c.label || '').toLowerCase() }));
    const backKeywords = ['back', 'rear', 'environment', 'traseira'];

    const backCam = labels.find((c) => backKeywords.some((k) => c.label.includes(k)));
    return (backCam?.id ?? cameras[cameras.length - 1]?.id) || null;
  }, []);

  const startScanner = async () => {
    if (isInitializing || isScanning) return;

    let permissionStream: MediaStream | null = null;

    try {
      setError(null);
      setIsInitializing(true);

      // Stop any existing scanner first
      await stopScanner();

      // Give browser time to release camera resources
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (!mountedRef.current) return;

      // Capability checks (clear errors on mobile/desktop)
      if (!window.isSecureContext) {
        throw new Error('SecurityError: insecure_context');
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('NotSupportedError: mediaDevices');
      }

      const containerId = containerIdRef.current;
      const container = document.getElementById(containerId);
      if (!container) throw new Error('Container não encontrado');

      // Ensure container has dimensions before starting
      container.style.minHeight = '300px';
      container.style.width = '100%';
      container.style.display = 'block';

      // 1) Solicitar permissão explicitamente (deve ocorrer após clique)
      try {
        permissionStream = await requestCameraPermission();
      } finally {
        // Libera imediatamente; o scanner abrirá a câmera de verdade em seguida.
        stopCameraStream(permissionStream);
        permissionStream = null;
      }

      // Pequena pausa para garantir liberação da câmera em alguns navegadores mobile.
      await new Promise((resolve) => setTimeout(resolve, 150));

      if (!mountedRef.current) return;

      // 2) Iniciar html5-qrcode priorizando câmera traseira via deviceId (mais compatível)
      const html5QrCode = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = html5QrCode;

      const containerWidth = container.clientWidth || 280;
      const qrboxSize = Math.min(220, Math.floor(containerWidth * 0.7));

      const config = {
        fps: 10,
        qrbox: { width: qrboxSize, height: qrboxSize },
        disableFlip: false,
      };

      const onSuccess = (decodedText: string) => {
        onScan(decodedText);
        stopScanner();
      };

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw Object.assign(new Error('NotFoundError: no_camera'), { name: 'NotFoundError' });
      }

      const preferredId = await pickPreferredCameraId();
      const fallbackId = cameras[0]?.id;

      try {
        await html5QrCode.start(preferredId ?? fallbackId, config, onSuccess, () => {});
      } catch (err1) {
        // Se a câmera preferida falhar, tenta a primeira disponível.
        if (fallbackId && preferredId && fallbackId !== preferredId) {
          await html5QrCode.start(fallbackId, config, onSuccess, () => {});
        } else {
          throw err1;
        }
      }

      // iOS/Safari: playsinline para não forçar fullscreen e permitir autoplay.
      setTimeout(() => {
        const root = document.getElementById(containerId);
        const video = root?.querySelector('video') as HTMLVideoElement | null;
        if (video) {
          video.setAttribute('autoplay', 'true');
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
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

      stopCameraStream(permissionStream);

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

      setError(getCameraErrorMessage(err));
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
