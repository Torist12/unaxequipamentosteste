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
import { useUsers, useCreateUser, useDeleteUser } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useDepartments';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { userSchema } from '@/lib/validation';
import { DEPARTMENTS } from '@/lib/departments';
import { Plus, Trash2, Users, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const { data: departments = [] } = useDepartments();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    qr_code: '',
    department_id: '',
    role: '',
  });

  const validateForm = () => {
    const result = userSchema.safeParse(formData);
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
      await createUser.mutateAsync({
        name: formData.name,
        role: formData.role,
        department_id: formData.department_id || null,
        qr_code: formData.qr_code.trim() ? formData.qr_code.trim().toUpperCase() : undefined,
      });
      setIsOpen(false);
      setFormData({ name: '', qr_code: '', department_id: '', role: '' });
      setErrors({});
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteUser.mutate(id);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower);
    const matchesDepartment = departmentFilter === 'all' || user.department_id === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie os usuários do sistema</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>Cadastrar Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João da Silva"
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
                  <Label htmlFor="qr_code">ID do Usuário (QR) (opcional)</Label>
                  <Input
                    id="qr_code"
                    value={formData.qr_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qr_code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                      })
                    }
                    placeholder="USR-0001"
                    maxLength={100}
                    className={errors.qr_code ? 'border-destructive' : ''}
                    inputMode="text"
                    autoCapitalize="characters"
                  />
                  {errors.qr_code && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.qr_code}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Se deixar vazio, o sistema gera automaticamente.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {departments
                        .filter(dept => DEPARTMENTS.includes(dept.name as typeof DEPARTMENTS[number]))
                        .map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo / Função *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: Analista de TI"
                    maxLength={50}
                    className={errors.role ? 'border-destructive' : ''}
                  />
                  {errors.role && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.role}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={createUser.isPending}>
                  {createUser.isPending ? 'Cadastrando...' : 'Cadastrar Usuário'}
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
                  placeholder="Buscar por nome ou cargo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[200px] rounded-xl">
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments
                    .filter(dept => DEPARTMENTS.includes(dept.name as typeof DEPARTMENTS[number]))
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table / Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="h-5 w-5 text-primary" />
              Lista de Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="animate-fade-in">
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.department?.name || '-'}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <QRCodeDisplay value={user.qr_code} label={user.name} />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(user.id, user.name)}
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
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className="p-4 rounded-xl border bg-card animate-slide-up"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.role}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <QRCodeDisplay value={user.qr_code} label={user.name} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(user.id, user.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Departamento: </span>
                        {user.department?.name || '-'}
                      </div>
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
