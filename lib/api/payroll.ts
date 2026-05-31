import { supabase } from '@/lib/supabase'

function normalizePayrollEntry(row: any) {
  if (!row) return row

  const employee = Array.isArray(row.employee) ? row.employee[0] : row.employee
  const branch = Array.isArray(employee?.branch) ? employee.branch[0] : employee?.branch
  const department = Array.isArray(employee?.department) ? employee.department[0] : employee?.department

  return {
    ...row,
    employeeDbId: row.employee_id,
    employeeId: employee?.employee_id ?? row.employee_id,
    employeeName: employee?.full_name ?? '',
    employeeNumber: employee?.employee_id ?? '',
    department: department?.name ?? '',
    departmentId: employee?.department_id ?? employee?.departmentId ?? '',
    branch: branch?.name ?? '',
    paymentStatus: employee?.payment_status ?? row.payment_status ?? '',
    workType: employee?.work_type ?? '',
    hoursOrDays: Number(row.hours_or_days) || 0,
    rate: Number(row.rate) || 0,
    grossSalary: Number(row.gross_salary) || 0,
    withdrawals: Number(row.withdrawals) || 0,
    netSalary: Number(row.net_salary) || 0,
    cashReceived: Number(row.cash_received) || 0,
    transferReceived: Number(row.transfer_received) || 0,
    remaining: Number(row.remaining) || 0,
    notes: row.notes ?? '',
  }
}

function normalizePayrollSheet(row: any, entries: any[] = []) {
  if (!row) return row

  return {
    ...row,
    entries,
    totalGrossSalary: row.total_gross_salary ?? 0,
    totalWithdrawals: row.total_withdrawals ?? 0,
    totalNetSalary: row.total_net_salary ?? 0,
    totalCashReceived: row.total_cash_received ?? 0,
    totalTransferReceived: row.total_transfer_received ?? 0,
    totalRemaining: row.total_remaining ?? 0,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    closedAt: row.closed_at ? new Date(row.closed_at) : null,
    createdBy: row.created_by ?? '',
  }
}

function payrollEntryPayload(entry: any, sheetId?: string) {
  const payload: any = {
    ...(sheetId ? { payroll_sheet_id: sheetId } : {}),
    employee_id: entry.employee_id ?? entry.employeeDbId ?? entry.employeeUuid ?? entry.employeeId,
    hours_or_days: entry.hoursOrDays ?? entry.hours_or_days ?? 0,
    rate: entry.rate ?? 0,
    gross_salary: entry.grossSalary ?? entry.gross_salary ?? 0,
    withdrawals: entry.withdrawals ?? 0,
    net_salary: entry.netSalary ?? entry.net_salary ?? 0,
    cash_received: entry.cashReceived ?? entry.cash_received ?? 0,
    transfer_received: entry.transferReceived ?? entry.transfer_received ?? 0,
    remaining: entry.remaining ?? 0,
    notes: entry.notes ?? '',
  }

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])
  return payload
}

async function updateSheetTotals(sheetId: string) {
  const { data } = await supabase.from('payroll_entries').select('*').eq('payroll_sheet_id', sheetId)
  const entries = data ?? []

  await supabase.from('payroll_sheets').update({
    total_gross_salary: entries.reduce((sum, e) => sum + (Number(e.gross_salary) || 0), 0),
    total_withdrawals: entries.reduce((sum, e) => sum + (Number(e.withdrawals) || 0), 0),
    total_net_salary: entries.reduce((sum, e) => sum + (Number(e.net_salary) || 0), 0),
    total_cash_received: entries.reduce((sum, e) => sum + (Number(e.cash_received) || 0), 0),
    total_transfer_received: entries.reduce((sum, e) => sum + (Number(e.transfer_received) || 0), 0),
    total_remaining: entries.reduce((sum, e) => sum + (Number(e.remaining) || 0), 0),
  }).eq('id', sheetId)
}

export async function listPayrollSheets() {
  const { data, error } = await supabase.from('payroll_sheets').select('*').order('year', { ascending: false }).order('month', { ascending: false })
  return { data: data?.map(row => normalizePayrollSheet(row)), error }
}

export async function getPayrollSheet(id: string) {
  const { data, error } = await supabase.from('payroll_sheets').select('*').eq('id', id).single()
  return { data: normalizePayrollSheet(data), error }
}

export async function addPayrollSheet(sheet: any) {
  const { data, error } = await supabase.from('payroll_sheets').insert(sheet)
  return { data, error }
}

export async function updatePayrollSheet(id: string, updates: any) {
  const { data, error } = await supabase.from('payroll_sheets').update(updates).eq('id', id)
  return { data, error }
}

export async function deletePayrollSheet(id: string) {
  const { data, error } = await supabase.from('payroll_sheets').delete().eq('id', id)
  return { data, error }
}

export async function listPayrollEntriesForEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('payroll_entries')
    .select(`*, payroll_sheet:payroll_sheets(*), employee:employees(employee_id, full_name, work_type, department_id, branch:branches(name), department:departments(name))`)
    .eq('employee_id', employeeId)
  return { data: data?.map(normalizePayrollEntry), error }
}

export async function listPayrollEntriesForSheet(sheetId: string) {
  const { data, error } = await supabase
    .from('payroll_entries')
    .select(`*, employee:employees(employee_id, full_name, work_type, department_id, payment_status, branch:branches(name), department:departments(name))`)
    .eq('payroll_sheet_id', sheetId)
  return { data: data?.map(normalizePayrollEntry), error }
}

export async function listPayrollEntriesForMonth(month: number, year: number) {
  const { data, error } = await supabase
    .from('payroll_entries')
    .select(`*, payroll_sheet:payroll_sheets(*), employee:employees(employee_id, full_name, work_type, department_id, payment_status, branch:branches(name), department:departments(name))`)
    .eq('payroll_sheet.month', month)
    .eq('payroll_sheet.year', year)
    .in('payroll_sheet.status', ['approved', 'closed'])
  return { data: data?.map(normalizePayrollEntry), error }
}

export async function addPayrollEntry(entry: any, sheetId?: string) {
  const payload = payrollEntryPayload(entry, sheetId)
  const { data, error } = await supabase.from('payroll_entries').insert(payload).select().single()
  if (!error && payload.payroll_sheet_id) await updateSheetTotals(payload.payroll_sheet_id)
  return { data, error }
}

export async function updatePayrollEntry(id: string, updates: any) {
  const payload = payrollEntryPayload(updates)
  const { data, error } = await supabase.from('payroll_entries').update(payload).eq('id', id).select().single()
  if (!error && data?.payroll_sheet_id) await updateSheetTotals(data.payroll_sheet_id)
  return { data, error }
}

export async function deletePayrollEntry(id: string) {
  const existing = await supabase.from('payroll_entries').select('payroll_sheet_id').eq('id', id).single()
  const { data, error } = await supabase.from('payroll_entries').delete().eq('id', id)
  if (!error && existing.data?.payroll_sheet_id) await updateSheetTotals(existing.data.payroll_sheet_id)
  return { data, error }
}
