import { useState, useRef, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRScanner, QRScannerHandle } from '@/components/QRScanner';
import { useCheckout, useReturn } from '@/hooks/useTransactions';
import { qrCodeSchema } from '@/lib/validation';
import { ArrowDown, ArrowUp, Package, User, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MovementPage() {
  const checkout = useCheckout();
  const returnMutation = useReturn();
  
  // Scanner refs to control camera
  const checkoutEquipmentScannerRef = useRef<QRScannerHandle>(null);
  const checkoutUserScannerRef = useRef<QRScannerHandle>(null);
  const returnEquipmentScannerRef = useRef<QRScannerHandle>(null);
  const returnUserScannerRef = useRef<QRScannerHandle>(null);
  
  // Checkout state
  const [equipmentQr, setEquipmentQr] = useState('');
  const [userQr, setUserQr] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'equipment' | 'user'>('equipment');
  const [qrError, setQrError] = useState('');
  
  // Return state
  const [returnEquipmentQr, setReturnEquipmentQr] = useState('');
  const [returnUserQr, setReturnUserQr] = useState('');
  const [returnStep, setReturnStep] = useState<'equipment' | 'user'>('equipment');
  const [returnError, setReturnError] = useState('');

  const validateQrCode = (value: string): boolean => {
    const result = qrCodeSchema.safeParse(value);
    return result.success;
  };

  // Stop all cameras
  const stopAllCameras = useCallback(async () => {
    await Promise.all([
      checkoutEquipmentScannerRef.current?.stopCamera(),
      checkoutUserScannerRef.current?.stopCamera(),
      returnEquipmentScannerRef.current?.stopCamera(),
      returnUserScannerRef.current?.stopCamera(),
    ].filter(Boolean));
    
    // Small delay to ensure all cameras are released
    await new Promise((resolve) => setTimeout(resolve, 100));
  }, []);

  // Checkout handlers
  const handleEquipmentScan = useCallback(async (result: string) => {
    if (!validateQrCode(result)) {
      toast.error('QR Code inválido');
      return;
    }
    
    // Camera stops automatically via autoStopOnScan
    setEquipmentQr(result);
    setCheckoutStep('user');
    setQrError('');
  }, []);

  const handleUserScan = useCallback(async (result: string) => {
    if (!validateQrCode(result)) {
      toast.error('QR Code inválido');
      return;
    }
    
    // Camera stops automatically via autoStopOnScan
    setUserQr(result);
    setQrError('');
  }, []);

  const handleEquipmentInput = (value: string) => {
    const sanitized = value.replace(/[<>\"'&]/g, '').toUpperCase();
    setEquipmentQr(sanitized);
  };

  const handleUserInput = (value: string) => {
    const sanitized = value.replace(/[<>\"'&]/g, '').toUpperCase();
    setUserQr(sanitized);
  };

  const handleCheckout = async () => {
    if (!equipmentQr || !userQr) {
      setQrError('Preencha ambos os campos');
      return;
    }
    
    // Ensure cameras are stopped before processing
    await stopAllCameras();
    
    try {
      await checkout.mutateAsync({ equipmentQr, userQr });
      setEquipmentQr('');
      setUserQr('');
      setCheckoutStep('equipment');
      setQrError('');
    } catch {
      // Error handled by mutation
    }
  };

  // Return handlers
  const handleReturnEquipmentScan = useCallback(async (result: string) => {
    if (!validateQrCode(result)) {
      toast.error('QR Code inválido');
      return;
    }
    
    // Camera stops automatically via autoStopOnScan
    setReturnEquipmentQr(result);
    setReturnStep('user');
    setReturnError('');
  }, []);

  const handleReturnUserScan = useCallback(async (result: string) => {
    if (!validateQrCode(result)) {
      toast.error('QR Code inválido');
      return;
    }
    
    // Camera stops automatically via autoStopOnScan
    setReturnUserQr(result);
    setReturnError('');
  }, []);

  const handleReturnEquipmentInput = (value: string) => {
    const sanitized = value.replace(/[<>\"'&]/g, '').toUpperCase();
    setReturnEquipmentQr(sanitized);
  };

  const handleReturnUserInput = (value: string) => {
    const sanitized = value.replace(/[<>\"'&]/g, '').toUpperCase();
    setReturnUserQr(sanitized);
  };

  const handleReturn = async () => {
    if (!returnEquipmentQr || !returnUserQr) {
      setReturnError('Escaneie o equipamento e o usuário');
      return;
    }
    
    // Ensure cameras are stopped before processing
    await stopAllCameras();
    
    try {
      await returnMutation.mutateAsync({ equipmentQr: returnEquipmentQr, userQr: returnUserQr });
      setReturnEquipmentQr('');
      setReturnUserQr('');
      setReturnStep('equipment');
      setReturnError('');
    } catch {
      // Error handled by mutation
    }
  };

  const resetCheckout = async () => {
    await stopAllCameras();
    setEquipmentQr('');
    setUserQr('');
    setCheckoutStep('equipment');
    setQrError('');
  };

  const resetReturn = async () => {
    await stopAllCameras();
    setReturnEquipmentQr('');
    setReturnUserQr('');
    setReturnStep('equipment');
    setReturnError('');
  };

  // Handle tab change - stop all cameras
  const handleTabChange = async () => {
    await stopAllCameras();
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Movimentação</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Registrar retirada e devolução de equipamentos</p>
        </div>

        <Tabs defaultValue="checkout" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="checkout" className="gap-2">
              <ArrowUp className="h-4 w-4" />
              <span className="hidden sm:inline">Retirada</span>
              <span className="sm:hidden">Retirar</span>
            </TabsTrigger>
            <TabsTrigger value="return" className="gap-2">
              <ArrowDown className="h-4 w-4" />
              <span className="hidden sm:inline">Devolução</span>
              <span className="sm:hidden">Devolver</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkout" className="mt-4 sm:mt-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Scanner / Input */}
              <div className="space-y-4">
                {checkoutStep === 'equipment' ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Package className="h-5 w-5 text-primary" />
                        1. Escanear Equipamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <QRScanner 
                        ref={checkoutEquipmentScannerRef}
                        onScan={handleEquipmentScan} 
                        label="QR Code do Equipamento"
                        autoStopOnScan={true}
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">ou digite</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Código do Equipamento</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="EQ-XXXXX..."
                            value={equipmentQr}
                            onChange={(e) => handleEquipmentInput(e.target.value)}
                            maxLength={100}
                          />
                          <Button 
                            onClick={async () => {
                              await stopAllCameras();
                              setCheckoutStep('user');
                            }}
                            disabled={!equipmentQr}
                          >
                            Próximo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <User className="h-5 w-5 text-primary" />
                        2. Escanear Usuário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <QRScanner 
                        ref={checkoutUserScannerRef}
                        onScan={handleUserScan} 
                        label="QR Code do Usuário"
                        autoStopOnScan={true}
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">ou digite</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Código do Usuário</Label>
                        <Input
                          placeholder="USR-XXXXX..."
                          value={userQr}
                          onChange={(e) => handleUserInput(e.target.value)}
                          maxLength={100}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={async () => {
                          await stopAllCameras();
                          setCheckoutStep('equipment');
                        }}
                        className="w-full"
                      >
                        Voltar para Equipamento
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Resumo da Retirada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        equipmentQr ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {equipmentQr ? <CheckCircle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Equipamento</p>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          {equipmentQr || 'Aguardando leitura...'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        userQr ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {userQr ? <CheckCircle className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Usuário</p>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          {userQr || 'Aguardando leitura...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {qrError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {qrError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={resetCheckout}
                    >
                      Limpar
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleCheckout}
                      disabled={!equipmentQr || !userQr || checkout.isPending}
                    >
                      {checkout.isPending ? 'Registrando...' : 'Confirmar Retirada'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="return" className="mt-4 sm:mt-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Scanner */}
              <div className="space-y-4">
                {returnStep === 'equipment' ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Package className="h-5 w-5 text-primary" />
                        1. Escanear Equipamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <QRScanner 
                        ref={returnEquipmentScannerRef}
                        onScan={handleReturnEquipmentScan} 
                        label="QR Code do Equipamento"
                        autoStopOnScan={true}
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">ou digite</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Código do Equipamento</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="EQ-XXXXX..."
                            value={returnEquipmentQr}
                            onChange={(e) => handleReturnEquipmentInput(e.target.value)}
                            maxLength={100}
                          />
                          <Button 
                            onClick={async () => {
                              await stopAllCameras();
                              setReturnStep('user');
                            }}
                            disabled={!returnEquipmentQr}
                          >
                            Próximo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <User className="h-5 w-5 text-primary" />
                        2. Escanear Usuário (Validação)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <QRScanner 
                        ref={returnUserScannerRef}
                        onScan={handleReturnUserScan} 
                        label="QR Code do Usuário que está devolvendo"
                        autoStopOnScan={true}
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">ou digite</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Código do Usuário</Label>
                        <Input
                          placeholder="USR-XXXXX..."
                          value={returnUserQr}
                          onChange={(e) => handleReturnUserInput(e.target.value)}
                          maxLength={100}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={async () => {
                          await stopAllCameras();
                          setReturnStep('equipment');
                        }}
                        className="w-full"
                      >
                        Voltar para Equipamento
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Resumo da Devolução</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        returnEquipmentQr ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {returnEquipmentQr ? <CheckCircle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Equipamento</p>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          {returnEquipmentQr || 'Aguardando leitura...'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        returnUserQr ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {returnUserQr ? <CheckCircle className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Usuário</p>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          {returnUserQr || 'Aguardando leitura...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {returnError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {returnError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={resetReturn}
                    >
                      Limpar
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleReturn}
                      disabled={!returnEquipmentQr || !returnUserQr || returnMutation.isPending}
                    >
                      {returnMutation.isPending ? 'Registrando...' : 'Confirmar Devolução'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
