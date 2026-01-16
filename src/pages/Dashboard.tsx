import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEquipment } from '@/hooks/useEquipment';
import { useUsers } from '@/hooks/useUsers';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { Package, Users, ArrowRightLeft, CheckCircle, AlertCircle, Wrench, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoIcon from '@/assets/logo-icon.png';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Dashboard() {
  const { data: equipment = [], isLoading: loadingEquipment } = useEquipment();
  const { data: users = [] } = useUsers();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const filteredEquipment = categoryFilter === 'all' 
    ? equipment 
    : equipment.filter(e => e.category_id === categoryFilter);
  
  const availableCount = filteredEquipment.filter(e => e.status === 'Disponível').length;
  const inUseCount = filteredEquipment.filter(e => e.status === 'Em uso').length;
  const maintenanceCount = filteredEquipment.filter(e => e.status === 'Manutenção').length;
  
  const recentTransactions = transactions.slice(0, 5);
  const equipmentInUse = filteredEquipment.filter(e => e.status === 'Em uso').slice(0, 5);

  const availabilityRate = filteredEquipment.length > 0 
    ? Math.round((availableCount / filteredEquipment.length) * 100) 
    : 0;

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <img src={logoIcon} alt="UNAX" className="h-14 w-14 hidden sm:block transition-transform hover:scale-105" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Visão geral do almoxarifado</p>
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="card-hover rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Equipamentos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{filteredEquipment.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">cadastrados</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover rounded-2xl border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Disponíveis</CardTitle>
              <CheckCircle className="h-4 w-4 text-success hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-success">{availableCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">prontos</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover rounded-2xl border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Em Uso</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-warning">{inUseCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">em circulação</p>
            </CardContent>
          </Card>
          
          <Card className="card-hover rounded-2xl border-l-4 border-l-destructive">
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
          <Card className="rounded-2xl">
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
                    <div key={eq.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 animate-slide-up">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{eq.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="truncate">{eq.current_user?.name || 'Não identificado'}</span>
                          {eq.category && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                                {eq.category.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={eq.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimas Movimentações */}
          <Card className="rounded-2xl">
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
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 animate-slide-up">
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
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-primary" />
              Resumo do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 rounded-2xl bg-muted">
                <p className="text-xl sm:text-3xl font-bold">{users.length}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Usuários</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-2xl bg-muted">
                <p className="text-xl sm:text-3xl font-bold">{transactions.length}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Movimentações</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-2xl bg-muted">
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
