import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEquipment } from '@/hooks/useEquipment';
import { useUsers } from '@/hooks/useUsers';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { Package, Users, ArrowRightLeft, CheckCircle, AlertCircle, Wrench, Filter, FileText, Ship, FileSpreadsheet, Printer } from 'lucide-react';
import { StatusBadge, EQUIPMENT_STATUSES } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-unax.png';
import { generateEquipmentReport } from '@/lib/pdfReport';
import { generateEquipmentSpreadsheet, generatePrintableSpreadsheet } from '@/lib/excelReport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export default function Dashboard() {
  const {
    data: equipment = [],
    isLoading: loadingEquipment
  } = useEquipment();
  const {
    data: users = []
  } = useUsers();
  const {
    data: transactions = []
  } = useTransactions();
  const {
    data: categories = []
  } = useCategories();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filteredEquipment = equipment.filter(e => {
    const matchesCategory = categoryFilter === 'all' || e.category_id === categoryFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesCategory && matchesStatus;
  });
  const availableCount = equipment.filter(e => e.status === 'Disponível').length;
  const inUseCount = equipment.filter(e => e.status === 'Em uso').length;
  const maintenanceCount = equipment.filter(e => e.status === 'Manutenção').length;
  const shippedCount = equipment.filter(e => e.status === 'Embarcado').length;
  const recentTransactions = transactions.slice(0, 5);
  const equipmentInUse = filteredEquipment.filter(e => e.status === 'Em uso' || e.status === 'Embarcado').slice(0, 5);
  const availabilityRate = equipment.length > 0 ? Math.round(availableCount / equipment.length * 100) : 0;
  const handleGeneratePDF = () => {
    const categoryName = categoryFilter !== 'all' ? categories.find(c => c.id === categoryFilter)?.name : undefined;
    generateEquipmentReport(filteredEquipment, {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryName
    });
  };
  const handleGenerateExcel = () => {
    const categoryName = categoryFilter !== 'all' ? categories.find(c => c.id === categoryFilter)?.name : undefined;
    generateEquipmentSpreadsheet(filteredEquipment, {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryName
    });
  };
  const handlePrint = () => {
    const categoryName = categoryFilter !== 'all' ? categories.find(c => c.id === categoryFilter)?.name : undefined;

    // Get full URL for logo
    const logoUrl = new URL(logoFull, window.location.origin).href;
    generatePrintableSpreadsheet(filteredEquipment, {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryName
    }, logoUrl);
  };
  return <MainLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <img alt="UNAX" className="h-14 w-14 hidden sm:block transition-transform hover:scale-105" src="/lovable-uploads/4715c69b-ed93-4f84-8674-77621d122b99.png" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Visão geral do almoxarifado</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos status</SelectItem>
                {EQUIPMENT_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={handleGeneratePDF} disabled={filteredEquipment.length === 0}>
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={handleGenerateExcel} disabled={filteredEquipment.length === 0}>
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Planilha</span>
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={handlePrint} disabled={filteredEquipment.length === 0}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="card-hover rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{equipment.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">equipamentos</p>
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
          
          <Card className="card-hover rounded-2xl border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Embarcado</CardTitle>
              <Ship className="h-4 w-4 text-blue-500 hidden sm:block" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{shippedCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">em campo</p>
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
                Equipamentos em Uso / Embarcados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEquipment ? <div className="flex justify-center py-6">
                  <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
                </div> : equipmentInUse.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum equipamento em uso
                </p> : <div className="space-y-3">
                  {equipmentInUse.map(eq => <div key={eq.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 animate-slide-up">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{eq.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="truncate">{eq.current_user?.name || 'Não identificado'}</span>
                          {eq.category && <>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                                {eq.category.name}
                              </span>
                            </>}
                        </div>
                      </div>
                      <StatusBadge status={eq.status} />
                    </div>)}
                </div>}
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
              {recentTransactions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma movimentação registrada
                </p> : <div className="space-y-3">
                  {recentTransactions.map(tx => <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 animate-slide-up">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{tx.equipment?.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {tx.user?.name} • {format(new Date(tx.created_at), "dd/MM HH:mm", {
                      locale: ptBR
                    })}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${tx.type === 'retirada' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                        {tx.type === 'retirada' ? 'Retirada' : 'Devolução'}
                      </span>
                    </div>)}
                </div>}
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
    </MainLayout>;
}