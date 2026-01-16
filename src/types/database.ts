export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  department_id: string | null;
  role: string;
  qr_code: string;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface Equipment {
  id: string;
  name: string;
  category_id: string | null;
  patrimony_number: string;
  status: 'Disponível' | 'Em uso' | 'Manutenção';
  qr_code: string;
  current_user_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  current_user?: User;
}

export interface Transaction {
  id: string;
  equipment_id: string;
  user_id: string;
  type: 'retirada' | 'devolucao';
  created_at: string;
  equipment?: Equipment;
  user?: User;
}
