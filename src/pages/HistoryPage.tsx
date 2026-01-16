import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useTransactions } from '@/hooks/useTransactions';
import { useUsers } from '@/hooks/useUsers';
import { History, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoryPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: users = [] } = useUsers();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter((tx) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      tx.equipment?.name?.toLowerCase().includes(searchLower) ||
      tx.user?.name?.toLowerCase().includes(searchLower);
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesUser = userFilter === 'all' || tx.user_id === userFilter;
    return matchesSearch && matchesType && matchesUser;
  });

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Histórico</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Registro de todas as movimentações</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por equipamento ou usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="retirada">Retirada</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table / Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <History className="h-5 w-5 text-primary" />
              Movimentações ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhuma movimentação encontrada
              </p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id} className="animate-fade-in">
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                              tx.type === 'retirada'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-success/10 text-success'
                            }`}>
                              {tx.type === 'retirada' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )}
                              {tx.type === 'retirada' ? 'Retirada' : 'Devolução'}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {tx.equipment?.name || 'Equipamento removido'}
                          </TableCell>
                          <TableCell>{tx.user?.name || 'Usuário removido'}</TableCell>
                          <TableCell>
                            {format(new Date(tx.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredTransactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="p-4 rounded-xl border bg-card animate-slide-up"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">{tx.equipment?.name || 'Equipamento removido'}</h3>
                          <p className="text-sm text-muted-foreground">{tx.user?.name || 'Usuário removido'}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                          tx.type === 'retirada'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                        }`}>
                          {tx.type === 'retirada' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          {tx.type === 'retirada' ? 'Retirada' : 'Devolução'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
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
