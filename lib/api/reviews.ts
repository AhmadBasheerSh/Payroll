import { supabase } from '@/lib/supabase'

function normalizeReviewRequest(row: any) {
  if (!row) return row

  const employee = Array.isArray(row.employee) ? row.employee[0] : row.employee

  return {
    ...row,
    employeeId: row.employee_id,
    employeeName: employee?.full_name ?? '',
    employeeNumber: employee?.employee_id ?? '',
    payrollSheetId: row.payroll_sheet_id,
    adminResponse: row.admin_response,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  }
}

function reviewRequestPayload(request: any) {
  const payload: any = {
    employee_id: request.employee_id ?? request.employeeDbId ?? request.employeeId,
    payroll_sheet_id: request.payroll_sheet_id ?? request.payrollSheetId,
    month: request.month,
    year: request.year,
    reason: request.reason,
    status: request.status,
    admin_response: request.admin_response ?? request.adminResponse,
  }

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])
  return payload
}

export async function listReviewRequests() {
  const { data, error } = await supabase
    .from('review_requests')
    .select(`*, employee:employees(employee_id, full_name)`)
    .order('created_at', { ascending: false })
  return { data: data?.map(normalizeReviewRequest), error }
}

export async function listReviewRequestsByEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('review_requests')
    .select(`*, employee:employees(employee_id, full_name)`)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  return { data: data?.map(normalizeReviewRequest), error }
}

export async function addReviewRequest(request: any) {
  const { data, error } = await supabase.from('review_requests').insert(reviewRequestPayload(request))
  return { data, error }
}

export async function updateReviewRequest(id: string, updates: any) {
  const { data, error } = await supabase.from('review_requests').update(reviewRequestPayload(updates)).eq('id', id)
  return { data, error }
}

export async function deleteReviewRequest(id: string) {
  const { data, error } = await supabase.from('review_requests').delete().eq('id', id)
  return { data, error }
}
