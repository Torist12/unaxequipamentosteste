-- Tabela de categorias de equipamentos
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de departamentos
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de usuários do almoxarifado
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  role TEXT NOT NULL,
  qr_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de equipamentos
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  patrimony_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Disponível' CHECK (status IN ('Disponível', 'Em uso', 'Manutenção')),
  qr_code TEXT NOT NULL UNIQUE,
  current_user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de movimentações
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('retirada', 'devolucao')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas (acesso público para sistema interno)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sistema interno sem autenticação complexa)
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Public delete categories" ON public.categories FOR DELETE USING (true);

CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public insert departments" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update departments" ON public.departments FOR UPDATE USING (true);
CREATE POLICY "Public delete departments" ON public.departments FOR DELETE USING (true);

CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Public delete users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Public read equipment" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Public insert equipment" ON public.equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update equipment" ON public.equipment FOR UPDATE USING (true);
CREATE POLICY "Public delete equipment" ON public.equipment FOR DELETE USING (true);

CREATE POLICY "Public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO public.categories (name) VALUES 
  ('Informática'),
  ('Ferramentas'),
  ('Eletrônicos'),
  ('Segurança'),
  ('Outros');

-- Inserir departamentos padrão
INSERT INTO public.departments (name) VALUES 
  ('TI'),
  ('Administrativo'),
  ('Operacional'),
  ('Manutenção'),
  ('Segurança');