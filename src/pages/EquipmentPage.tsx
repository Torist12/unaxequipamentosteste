import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEquipment, useCreateEquipment, useDeleteEquipment, useUpdateEquipment } from '@/hooks/useEquipment';
import { useCategories } from '@/hooks/useCategories';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { equipmentSchema } from '@/lib/validation';
import { Plus, Trash2, Package, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EquipmentPage() {
  const { data: equipment = [], isLoading } = useEquipment();
  const { data: categories = [] } = useCategories();
  const createEquipment = useCreateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const updateEquipment = useUpdateEquipment();
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    patrimony_number: '',
    status: 'Disponível' as const,
  });

  const validateForm = () => {
    const result = equipmentSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    try {
      await createEquipment.mutateAsync({
        ...formData,
        category_id: formData.category_id || null,
      });
      setIsOpen(false);
      setFormData({ name: '', category_id: '', patrimony_number: '', status: 'Disponível' });
      setErrors({});
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateEquipment.mutateAsync({ 
      id, 
      status: newStatus as 'Disponível' | 'Em uso' | 'Manutenção',
      current_user_id: newStatus === 'Disponível' ? null : undefined
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteEquipment.mutate(id);
    }
  };

  const filteredEquipment = equipment.filter((eq) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = eq.name.toLowerCase().includes(searchLower) ||
      eq.patrimony_number.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Equipamentos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie os equipamentos do almoxarifado</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Equipamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>Cadastrar Equipamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Equipamento *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Notebook Dell"
                    maxLength={100}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patrimony">Número de Patrimônio *</Label>
                  <Input
                    id="patrimony"
                    value={formData.patrimony_number}
                    onChange={(e) => setFormData({ ...formData, patrimony_number: e.target.value.toUpperCase() })}
                    placeholder="Ex: PAT-001234"
                    maxLength={50}
                    className={errors.patrimony_number ? 'border-destructive' : ''}
                  />
                  {errors.patrimony_number && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.patrimony_number}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status Inicial</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disponível">Disponível</SelectItem>
                      <SelectItem value="Em uso">Em uso</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full" disabled={createEquipment.isPending}>
                  {createEquipment.isPending ? 'Cadastrando...' : 'Cadastrar Equipamento'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou patrimônio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Em uso">Em uso</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table / Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Package className="h-5 w-5 text-primary" />
              Lista de Equipamentos ({filteredEquipment.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredEquipment.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum equipamento encontrado
              </p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Patrimônio</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEquipment.map((eq) => (
                        <TableRow key={eq.id} className="animate-fade-in">
                          <TableCell className="font-medium">{eq.name}</TableCell>
                          <TableCell className="font-mono text-sm">{eq.patrimony_number}</TableCell>
                          <TableCell>{eq.category?.name || '-'}</TableCell>
                          <TableCell>
                            <Select
                              value={eq.status}
                              onValueChange={(value) => handleStatusChange(eq.id, value)}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <StatusBadge status={eq.status} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Disponível">Disponível</SelectItem>
                                <SelectItem value="Em uso">Em uso</SelectItem>
                                <SelectItem value="Manutenção">Manutenção</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{eq.current_user?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <QRCodeDisplay 
                                value={eq.qr_code} 
                                label={eq.name} 
                                patrimony={eq.patrimony_number}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(eq.id, eq.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredEquipment.map((eq) => (
                    <div 
                      key={eq.id} 
                      className="p-4 rounded-xl border bg-card animate-slide-up"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{eq.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{eq.patrimony_number}</p>
                        </div>
                        <StatusBadge status={eq.status} />
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Categoria: </span>
                          {eq.category?.name || '-'}
                        </div>
                        <div className="flex items-center gap-1">
                          <QRCodeDisplay 
                            value={eq.qr_code} 
                            label={eq.name}
                            patrimony={eq.patrimony_number}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(eq.id, eq.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {eq.current_user && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Responsável: </span>
                          {eq.current_user.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
