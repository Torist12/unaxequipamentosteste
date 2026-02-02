import { z } from 'zod';

// Schema de validação para equipamentos
export const equipmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .refine((val) => !/[<>\"'&]/.test(val), 'Caracteres especiais não permitidos'),
  
  patrimony_number: z
    .string()
    .min(1, 'Número de patrimônio é obrigatório')
    .max(50, 'Patrimônio deve ter no máximo 50 caracteres')
    .trim()
    .refine((val) => /^[a-zA-Z0-9\-_]+$/.test(val), 'Apenas letras, números, hífen e underscore'),
  
  category_id: z.string().optional(),
  
  status: z.enum(['Disponível', 'Em uso', 'Manutenção']),
});

// Schema de validação para usuários
export const userSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .refine((val) => !/[<>\"'&]/.test(val), 'Caracteres especiais não permitidos'),

  role: z
    .string()
    .min(2, 'Cargo deve ter pelo menos 2 caracteres')
    .max(50, 'Cargo deve ter no máximo 50 caracteres')
    .trim()
    .refine((val) => !/[<>\"'&]/.test(val), 'Caracteres especiais não permitidos'),

  qr_code: z
    .string()
    .max(100, 'ID deve ter no máximo 100 caracteres')
    .trim()
    .refine((val) => val === '' || /^USR-[\w-]+$/.test(val), 'Formato de ID inválido (use USR-...)'),

  department_id: z.string().optional(),
});

// Schema para QR Codes
export const qrCodeSchema = z
  .string()
  .min(5, 'Código QR inválido')
  .max(100, 'Código QR muito longo')
  .refine((val) => /^(EQ|USR)-[\w-]+$/.test(val), 'Formato de QR Code inválido');

// Schema de validação para veículos
export const vehicleSchema = z.object({
  plate: z
    .string()
    .min(7, 'Placa deve ter 7 caracteres')
    .max(8, 'Placa deve ter no máximo 8 caracteres')
    .trim()
    .refine(
      (val) => /^[A-Z]{3}-?\d{4}$/.test(val) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(val),
      'Formato de placa inválido (ABC-1234 ou ABC1D23)'
    ),

  model: z
    .string()
    .min(2, 'Modelo deve ter pelo menos 2 caracteres')
    .max(50, 'Modelo deve ter no máximo 50 caracteres')
    .trim()
    .refine((val) => !/[<>\"'&]/.test(val), 'Caracteres especiais não permitidos'),

  status: z.enum(['Disponível', 'Em uso', 'Manutenção']).optional(),
});

// Tipos derivados dos schemas
export type EquipmentFormData = z.infer<typeof equipmentSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type VehicleFormData = z.infer<typeof vehicleSchema>;

// Funções de sanitização
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizeForDisplay(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
