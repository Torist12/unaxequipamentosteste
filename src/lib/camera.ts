// src/lib/camera.ts

export function isCameraSupported(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export function assertSecureContextForCamera(): void {
  // Camera access requires a secure context (HTTPS), except localhost.
  if (!window.isSecureContext) {
    throw new Error('SecurityError: insecure_context');
  }
}

export function stopCameraStream(stream: MediaStream | null | undefined): void {
  try {
    stream?.getTracks()?.forEach((t) => t.stop());
  } catch {
    // ignore
  }
}

function isProbablyMobile(): boolean {
  const ua = navigator.userAgent || '';
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
}

/**
 * Solicita permissão explicitamente (deve ser chamada após clique do usuário).
 * Retorna um MediaStream ativo; o chamador pode parar em seguida.
 */
export async function requestCameraPermission(): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new Error('NotSupportedError: mediaDevices');
  }

  assertSecureContextForCamera();

  const constraints: MediaStreamConstraints = isProbablyMobile()
    ? { video: { facingMode: { ideal: 'environment' } }, audio: false }
    : { video: true, audio: false };

  return navigator.mediaDevices.getUserMedia(constraints);
}

export function getCameraErrorMessage(err: unknown): string {
  const name = (err as any)?.name as string | undefined;
  const message = (err as any)?.message as string | undefined;
  const str = `${name ?? ''} ${message ?? ''}`.trim();

  if (str.includes('insecure_context') || name === 'SecurityError') {
    return 'A câmera exige HTTPS. Abra o sistema pelo link seguro (https).';
  }
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Permissão de câmera negada. Permita o acesso à câmera e tente novamente.';
  }
  if (name === 'NotFoundError' || str.toLowerCase().includes('no camera')) {
    return 'Nenhuma câmera encontrada no dispositivo.';
  }
  if (name === 'NotReadableError') {
    return 'A câmera está indisponível (pode estar em uso por outro app). Feche outros apps e tente novamente.';
  }
  if (name === 'OverconstrainedError') {
    return 'Não foi possível usar a câmera preferida. Tente novamente (ou outra câmera).';
  }
  if (name === 'AbortError') {
    return 'A inicialização da câmera foi cancelada. Tente novamente.';
  }
  if (!isCameraSupported()) {
    return 'Câmera não suportada neste navegador.';
  }

  return 'Erro ao abrir a câmera.';
}
