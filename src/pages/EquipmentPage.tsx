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
import { Plus, Trash2, Package, Search } from 'lucide-react';

export default function EquipmentPage() {
  const { data: equipment = [], isLoading } = useEquipment();
  const { data: categories = [] } = useCategories();
  const createEquipment = useCreateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const updateEquipment = useUpdateEquipment();
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    patrimony_number: '',
    status: 'Disponível',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEquipment.mutateAsync({
      ...formData,
      category_id: formData.category_id || null,
    });
    setIsOpen(false);
    setFormData({ name: '', category_id: '', patrimony_number: '', status: 'Disponível' });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateEquipment.mutateAsync({ 
      id, 
      status: newStatus as 'Disponível' | 'Em uso' | 'Manutenção',
      current_user_id: newStatus === 'Disponível' ? null : undefined
    });
  };

  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch = eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.patrimony_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipamentos</h1>
            <p className="text-muted-foreground">Gerencie os equipamentos do almoxarifado</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Equipamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Equipamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Equipamento</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Notebook Dell"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patrimony">Número de Patrimônio</Label>
                  <Input
                    id="patrimony"
                    value={formData.patrimony_number}
                    onChange={(e) => setFormData({ ...formData, patrimony_number: e.target.value })}
                    placeholder="Ex: PAT-001234"
                    required
                  />
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
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
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
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou patrimônio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lista de Equipamentos ({filteredEquipment.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : filteredEquipment.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum equipamento encontrado
              </p>
            ) : (
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
                    <TableRow key={eq.id}>
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
                          <QRCodeDisplay value={eq.qr_code} label={eq.name} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteEquipment.mutate(eq.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
