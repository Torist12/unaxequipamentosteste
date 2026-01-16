// Lista oficial de departamentos - NÃO ALTERAR
export const DEPARTMENTS = [
  'Marketing',
  'Operacional', 
  'T.I',
  'Administrativo',
  'Qualidade',
  'Laboratório'
] as const;

export type DepartmentName = typeof DEPARTMENTS[number];

export function isValidDepartment(name: string): name is DepartmentName {
  return DEPARTMENTS.includes(name as DepartmentName);
}
