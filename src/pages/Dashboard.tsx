import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEquipment } from '@/hooks/useEquipment';
import { useUsers } from '@/hooks/useUsers';
import { useTransactions } from '@/hooks/useTransactions';
import { Package, Users, ArrowRightLeft, CheckCircle, AlertCircle, Wrench } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoIcon from '@/assets/logo-icon.png';

export default function Dashboard() {
  const { data: equipment = [], isLoading: loadingEquipment } = useEquipment();
  const { data: users = [] } = useUsers();
  const { data: transactions = [] } = useTransactions();
  
  const availableCount = equipment.filter(e => e.status === 'Disponível').length;
  const inUseCount = equipment.filter(e => e.status === 'Em uso').length;
  const maintenanceCount = equipment.filter(e => e.status === 'Manutenção').length;
  
  const recentTransactions = transactions.slice(0, 5);
  const equipmentInUse = equipment.filter(e => e.status === 'Em uso').slice(0, 5);

  const availabilityRate = equipment.length > 0 
    ? Math.round((availableCount / equipment.length) * 100) 
    : 0;

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <img src={logoIcon} alt="UNAX" className="h-12 w-12 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Visão geral do almoxarifado</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Equipamentos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{equipment.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">cadastrados</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Disponíveis</CardTitle>
              <CheckCircle className="h-4 w-4 text-success hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-success">{availableCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">prontos</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Em Uso</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-warning">{inUseCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">em circulação</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Manutenção</CardTitle>
              <Wrench className="h-4 w-4 text-destructive hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-destructive">{maintenanceCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">em reparo</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Equipamentos em Uso */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-5 w-5 text-primary" />
                Equipamentos em Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEquipment ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
                </div>
              ) : equipmentInUse.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum equipamento em uso
                </p>
              ) : (
                <div className="space-y-3">
                  {equipmentInUse.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-slide-up">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{eq.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {eq.current_user?.name || 'Não identificado'}
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
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                Últimas Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma movimentação registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-slide-up">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{tx.equipment?.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {tx.user?.name} • {format(new Date(tx.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-primary" />
              Resumo do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 rounded-xl bg-muted">
                <p className="text-xl sm:text-3xl font-bold">{users.length}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Usuários</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-muted">
                <p className="text-xl sm:text-3xl font-bold">{transactions.length}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Movimentações</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-muted">
                <p className="text-xl sm:text-3xl font-bold">{availabilityRate}%</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Disponível</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
