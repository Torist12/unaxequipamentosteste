import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRScanner } from '@/components/QRScanner';
import { useCheckout, useReturn } from '@/hooks/useTransactions';
import { ArrowDown, ArrowUp, Package, User, CheckCircle } from 'lucide-react';

export default function MovementPage() {
  const checkout = useCheckout();
  const returnMutation = useReturn();
  
  // Checkout state
  const [equipmentQr, setEquipmentQr] = useState('');
  const [userQr, setUserQr] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'equipment' | 'user'>('equipment');
  
  // Return state
  const [returnEquipmentQr, setReturnEquipmentQr] = useState('');

  const handleEquipmentScan = (result: string) => {
    setEquipmentQr(result);
    setCheckoutStep('user');
  };

  const handleUserScan = (result: string) => {
    setUserQr(result);
  };

  const handleCheckout = async () => {
    await checkout.mutateAsync({ equipmentQr, userQr });
    setEquipmentQr('');
    setUserQr('');
    setCheckoutStep('equipment');
  };

  const handleReturnScan = (result: string) => {
    setReturnEquipmentQr(result);
  };

  const handleReturn = async () => {
    await returnMutation.mutateAsync(returnEquipmentQr);
    setReturnEquipmentQr('');
  };

  const resetCheckout = () => {
    setEquipmentQr('');
    setUserQr('');
    setCheckoutStep('equipment');
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimentação</h1>
          <p className="text-muted-foreground">Registrar retirada e devolução de equipamentos</p>
        </div>

        <Tabs defaultValue="checkout" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="checkout" className="gap-2">
              <ArrowUp className="h-4 w-4" />
              Retirada
            </TabsTrigger>
            <TabsTrigger value="return" className="gap-2">
              <ArrowDown className="h-4 w-4" />
              Devolução
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkout" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Scanner / Input */}
              <div className="space-y-4">
                {checkoutStep === 'equipment' ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Package className="h-5 w-5" />
                          1. Escanear Equipamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <QRScanner onScan={handleEquipmentScan} label="QR Code do Equipamento" />
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">ou digite manualmente</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Código do Equipamento</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="EQ-XXXXX..."
                              value={equipmentQr}
                              onChange={(e) => setEquipmentQr(e.target.value)}
                            />
                            <Button 
                              onClick={() => setCheckoutStep('user')}
                              disabled={!equipmentQr}
                            >
                              Próximo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <User className="h-5 w-5" />
                          2. Escanear Usuário
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <QRScanner onScan={handleUserScan} label="QR Code do Usuário" />
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">ou digite manualmente</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Código do Usuário</Label>
                          <Input
                            placeholder="USR-XXXXX..."
                            value={userQr}
                            onChange={(e) => setUserQr(e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo da Retirada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        equipmentQr ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {equipmentQr ? <CheckCircle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Equipamento</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {equipmentQr || 'Aguardando leitura...'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        userQr ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {userQr ? <CheckCircle className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Usuário</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {userQr || 'Aguardando leitura...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
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

          <TabsContent value="return" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Scanner */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    Escanear Equipamento para Devolução
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <QRScanner onScan={handleReturnScan} label="QR Code do Equipamento" />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou digite manualmente</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Código do Equipamento</Label>
                    <Input
                      placeholder="EQ-XXXXX..."
                      value={returnEquipmentQr}
                      onChange={(e) => setReturnEquipmentQr(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo da Devolução</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      returnEquipmentQr ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {returnEquipmentQr ? <CheckCircle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Equipamento</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {returnEquipmentQr || 'Aguardando leitura...'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setReturnEquipmentQr('')}
                    >
                      Limpar
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleReturn}
                      disabled={!returnEquipmentQr || returnMutation.isPending}
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
