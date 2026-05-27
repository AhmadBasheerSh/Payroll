import { supabase } from '@/lib/supabase'

function emptyToNull(value: unknown) {
  return value === '' || value === undefined ? null : value
}

function relationName(relation: any) {
  return Array.isArray(relation) ? relation[0]?.name ?? '' : relation?.name ?? ''
}

function normalizeEmployee(row: any) {
  if (!row) return row

  return {
    ...row,
    nationalId: row.national_id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    employeeId: row.employee_id,
    branchId: row.branch_id,
    branch: relationName(row.branch ?? row.branches),
    departmentId: row.department_id,
    department: relationName(row.department ?? row.departments),
    workType: row.work_type,
    hourlyRate: row.hourly_rate,
    dailyRate: row.daily_rate,
    wallet: {
      phoneNumber: row.wallet_phone_number ?? '',
      ownerName: row.wallet_owner_name ?? '',
      ownerId: row.wallet_owner_id ?? '',
    },
    baseSalary: row.base_salary,
    workHours: 0,
    withdrawals: 0,
    remaining: 0,
    paymentStatus: row.payment_status,
    cashDays: row.cash_days,
  }
}

function employeePayload(employee: any) {
  return {
    national_id: emptyToNull(employee.nationalId ?? employee.national_id),
    full_name: employee.fullName ?? employee.full_name,
    phone_number: emptyToNull(employee.phoneNumber ?? employee.phone_number),
    password: employee.password,
    employee_id: employee.employeeId ?? employee.employee_id,
    branch_id: emptyToNull(employee.branchId ?? employee.branch_id),
    department_id: emptyToNull(employee.departmentId ?? employee.department_id),
    work_type: employee.workType ?? employee.work_type,
    hourly_rate: employee.hourlyRate ?? employee.hourly_rate,
    daily_rate: employee.dailyRate ?? employee.daily_rate,
    wallet_phone_number: emptyToNull(employee.wallet?.phoneNumber ?? employee.wallet_phone_number),
    wallet_owner_name: emptyToNull(employee.wallet?.ownerName ?? employee.wallet_owner_name),
    wallet_owner_id: emptyToNull(employee.wallet?.ownerId ?? employee.wallet_owner_id),
    status: employee.status,
    role: employee.role,
    base_salary: employee.baseSalary ?? employee.base_salary ?? 0,
    payment_status: employee.paymentStatus ?? employee.payment_status ?? 'processing',
    cash_days: employee.cashDays ?? employee.cash_days ?? 0
  }
}

export async function listEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select(`id, national_id, full_name, phone_number, employee_id, branch_id, department_id, work_type, hourly_rate, daily_rate, wallet_phone_number, wallet_owner_name, wallet_owner_id, status, role, base_salary, payment_status, cash_days, created_at, updated_at, branch:branches(name), department:departments(name)`)
  return { data: data?.map(normalizeEmployee), error }
}

export async function getEmployeeById(id: string) {
  const { data, error } = await supabase
    .from('employees')
    .select(`id, national_id, full_name, phone_number, employee_id, branch_id, department_id, work_type, hourly_rate, daily_rate, wallet_phone_number, wallet_owner_name, wallet_owner_id, status, role, base_salary, payment_status, cash_days, created_at, updated_at, branch:branches(name), department:departments(name)`)
    .eq('id', id)
    .single()
  return { data: normalizeEmployee(data), error }
}

export async function addEmployee(employee: any) {
  const payload = employeePayload(employee)

  const { data, error } = await supabase.from('employees').insert(payload).select().single()
  return { data, error }
}

export async function updateEmployee(id: string, employee: any) {
  const nextPayload = employeePayload(employee)
  const payload: any = {}
  if (employee.nationalId !== undefined || employee.national_id !== undefined) payload.national_id = nextPayload.national_id
  if (employee.fullName !== undefined) payload.full_name = employee.fullName
  if (employee.full_name !== undefined) payload.full_name = employee.full_name
  if (employee.phoneNumber !== undefined) payload.phone_number = employee.phoneNumber
  if (employee.phone_number !== undefined) payload.phone_number = employee.phone_number
  if (employee.password !== undefined) payload.password = employee.password
  if (employee.employeeId !== undefined || employee.employee_id !== undefined) payload.employee_id = nextPayload.employee_id
  if (employee.branchId !== undefined) payload.branch_id = employee.branchId
  if (employee.branch_id !== undefined) payload.branch_id = employee.branch_id
  if (employee.departmentId !== undefined) payload.department_id = employee.departmentId
  if (employee.department_id !== undefined) payload.department_id = employee.department_id
  if (employee.workType !== undefined) payload.work_type = employee.workType
  if (employee.work_type !== undefined) payload.work_type = employee.work_type
  if (employee.hourlyRate !== undefined) payload.hourly_rate = employee.hourlyRate
  if (employee.hourly_rate !== undefined) payload.hourly_rate = employee.hourly_rate
  if (employee.dailyRate !== undefined) payload.daily_rate = employee.dailyRate
  if (employee.daily_rate !== undefined) payload.daily_rate = employee.daily_rate
  if (employee.wallet?.phoneNumber !== undefined) payload.wallet_phone_number = employee.wallet.phoneNumber
  if (employee.wallet_phone_number !== undefined) payload.wallet_phone_number = employee.wallet_phone_number
  if (employee.wallet?.ownerName !== undefined) payload.wallet_owner_name = employee.wallet.ownerName
  if (employee.wallet_owner_name !== undefined) payload.wallet_owner_name = employee.wallet_owner_name
  if (employee.wallet?.ownerId !== undefined) payload.wallet_owner_id = employee.wallet.ownerId
  if (employee.wallet_owner_id !== undefined) payload.wallet_owner_id = employee.wallet_owner_id
  if (employee.status !== undefined) payload.status = employee.status
  if (employee.role !== undefined) payload.role = employee.role
  if (employee.baseSalary !== undefined) payload.base_salary = employee.baseSalary
  if (employee.base_salary !== undefined) payload.base_salary = employee.base_salary
  if (employee.paymentStatus !== undefined) payload.payment_status = employee.paymentStatus
  if (employee.payment_status !== undefined) payload.payment_status = employee.payment_status
  if (employee.cashDays !== undefined) payload.cash_days = employee.cashDays
  if (employee.cash_days !== undefined) payload.cash_days = employee.cash_days

  const { data, error } = await supabase.from('employees').update(payload).eq('id', id)
  return { data, error }
}

export async function deleteEmployee(id: string) {
  const { data, error } = await supabase.from('employees').delete().eq('id', id)
  return { data, error }
}
