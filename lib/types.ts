// Employee Status
export type EmployeeStatus = 'active' | 'suspended' | 'terminated'

// Work Type
export type WorkType = 'hourly' | 'daily'

// Payment Status
export type PaymentStatus = 'bank_transfer' | 'cash' | 'processing'

// User Role
export type UserRole = 'admin' | 'hr' | 'employee'

// Payroll Status
export type PayrollStatus = 'draft' | 'approved' | 'closed'

// Review Request Status
export type ReviewRequestStatus = 'pending' | 'approved' | 'rejected'

// Branch
export interface Branch {
  id: string
  name: string
  createdAt: Date
}

// Department
export interface Department {
  id: string
  name: string
  employeeCount: number
  createdAt: Date
}

// Wallet Data
export interface WalletData {
  phoneNumber: string
  ownerName: string
  ownerId: string
}

// Employee
export interface Employee {
  id: string
  // Basic Data
  nationalId: string
  fullName: string
  phoneNumber: string
  password: string
  
  // Job Data (immutable after creation except by admin)
  employeeId: string
  branchId: string
  branch: string
  departmentId: string
  department: string
  workType: WorkType
  hourlyRate: number
  dailyRate: number
  
  // Wallet Data
  wallet: WalletData
  
  // Status
  status: EmployeeStatus
  role: UserRole
  
  // Legacy fields for compatibility
  baseSalary: number
  workHours: number
  withdrawals: number
  remaining: number
  paymentStatus: PaymentStatus
  cashDays: number
  
  createdAt: Date
  updatedAt: Date
}

// Payroll Entry (individual employee salary in a payroll sheet)
export interface PayrollEntry {
  id: string
  employeeId: string
  employee_id?: string
  employeeDbId?: string
  employeeName: string
  employeeNumber: string
  department: string
  departmentId?: string
  branch: string
  workType: WorkType
  hoursOrDays: number
  rate: number
  grossSalary: number
  withdrawals: number
  netSalary: number
  cashReceived: number
  transferReceived: number
  remaining: number
  notes: string
}

// Payroll Sheet (monthly salary sheet)
export interface PayrollSheet {
  id: string
  month: number
  year: number
  status: PayrollStatus
  entries: PayrollEntry[]
  totalGrossSalary: number
  totalWithdrawals: number
  totalNetSalary: number
  totalCashReceived: number
  totalTransferReceived: number
  totalRemaining: number
  createdAt: Date
  approvedAt: Date | null
  closedAt: Date | null
  createdBy: string
}

// Review Request
export interface ReviewRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeNumber: string
  payrollSheetId: string
  month: number
  year: number
  reason: string
  status: ReviewRequestStatus
  adminResponse: string | null
  createdAt: Date
  updatedAt: Date
}

// Salary History (for filtering)
export interface SalaryHistory {
  id: string
  employeeId: string
  month: string
  year: number
  baseSalary: number
  workHours: number
  withdrawals: number
  remaining: number
  paymentStatus: PaymentStatus
  paidAt: Date | null
  createdAt: Date
}

// User
export interface User {
  id: string
  employeeId: string
  fullName: string
  role: UserRole
  department: string
}

// Notification
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
}

// Dashboard Stats
export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalSalaries: number
  totalWithdrawals: number
  totalRemaining: number
  pendingReviews: number
}

// Department Stats
export interface DepartmentStats {
  name: string
  employeeCount: number
  totalSalary: number
  totalWithdrawals: number
}
