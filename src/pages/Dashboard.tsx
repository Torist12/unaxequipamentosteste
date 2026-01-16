import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEquipment } from '@/hooks/useEquipment';
import { useUsers } from '@/hooks/useUsers';
import { useTransactions } from '@/hooks/useTransactions';
import { Package, Users, ArrowRightLeft, CheckCircle, AlertCircle, Wrench } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { data: equipment = [] } = useEquipment();
  const { data: users = [] } = useUsers();
  const { data: transactions = [] } = useTransactions();
  
  const availableCount = equipment.filter(e => e.status === 'Disponível').length;
  const inUseCount = equipment.filter(e => e.status === 'Em uso').length;
  const maintenanceCount = equipment.filter(e => e.status === 'Manutenção').length;
  
  const recentTransactions = transactions.slice(0, 5);
  const equipmentInUse = equipment.filter(e => e.status === 'Em uso').slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do almoxarifado</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{equipment.length}</div>
              <p className="text-xs text-muted-foreground">cadastrados no sistema</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{availableCount}</div>
              <p className="text-xs text-muted-foreground">prontos para uso</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Uso</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{inUseCount}</div>
              <p className="text-xs text-muted-foreground">em circulação</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
              <Wrench className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{maintenanceCount}</div>
              <p className="text-xs text-muted-foreground">em reparo</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Equipamentos em Uso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Equipamentos em Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {equipmentInUse.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum equipamento em uso no momento
                </p>
              ) : (
                <div className="space-y-4">
                  {equipmentInUse.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{eq.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {eq.current_user?.name || 'Usuário não identificado'}
                        </p>
                      </div>
                      <StatusBadge status={eq.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimas Movimentações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Últimas Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma movimentação registrada
                </p>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tx.equipment?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.user?.name} • {format(new Date(tx.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        tx.type === 'retirada' 
                          ? 'bg-warning/10 text-warning' 
                          : 'bg-success/10 text-success'
                      }`}>
                        {tx.type === 'retirada' ? 'Retirada' : 'Devolução'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumo do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Usuários cadastrados</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold">{transactions.length}</p>
                <p className="text-sm text-muted-foreground">Movimentações totais</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold">
                  {Math.round((availableCount / equipment.length) * 100) || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Taxa de disponibilidade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
