import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  Employee, 
  Department, 
  Branch,
  SalaryHistory, 
  User, 
  Notification,
  PayrollSheet,
  PayrollEntry,
  ReviewRequest,
  EmployeeStatus,
  PayrollStatus,
  ReviewRequestStatus
} from './types'
import { 
  mockEmployees, 
  mockDepartments, 
  mockBranches,
  mockSalaryHistory,
  mockPayrollSheets,
  mockReviewRequests
} from './mock-data'
import { clearAuthCookies, setAuthCookies } from './utils'

interface AppState {
  // Auth
  currentUser: User | null
  isAuthenticated: boolean
  login: (employeeId: string, password: string) => boolean
  logout: () => void
  
  // Employees
  employees: Employee[]
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'remaining'>) => void
  updateEmployee: (id: string, data: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  getEmployeeById: (id: string) => Employee | undefined
  getEmployeeByEmployeeId: (employeeId: string) => Employee | undefined
  updateEmployeeStatus: (id: string, status: EmployeeStatus) => void
  
  // Branches
  branches: Branch[]
  addBranch: (name: string) => void
  updateBranch: (id: string, name: string) => void
  deleteBranch: (id: string) => void
  
  // Departments
  departments: Department[]
  addDepartment: (name: string) => void
  updateDepartment: (id: string, name: string) => void
  deleteDepartment: (id: string) => void
  
  // Payroll Sheets
  payrollSheets: PayrollSheet[]
  addPayrollSheet: (month: number, year: number) => PayrollSheet
  updatePayrollSheet: (id: string, data: Partial<PayrollSheet>) => void
  deletePayrollSheet: (id: string) => void
  getPayrollSheet: (id: string) => PayrollSheet | undefined
  updatePayrollStatus: (id: string, status: PayrollStatus) => void
  addPayrollEntry: (sheetId: string, entry: Omit<PayrollEntry, 'id'>) => void
  updatePayrollEntry: (sheetId: string, entryId: string, data: Partial<PayrollEntry>) => void
  deletePayrollEntry: (sheetId: string, entryId: string) => void
  importPayrollEntries: (sheetId: string, entries: Omit<PayrollEntry, 'id'>[]) => void
  
  // Review Requests
  reviewRequests: ReviewRequest[]
  addReviewRequest: (request: Omit<ReviewRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'adminResponse'>) => void
  updateReviewRequest: (id: string, data: Partial<ReviewRequest>) => void
  updateReviewRequestStatus: (id: string, status: ReviewRequestStatus, response?: string) => void
  deleteReviewRequest: (id: string) => void
  
  // Salary History
  salaryHistory: SalaryHistory[]
  addSalaryHistory: (history: Omit<SalaryHistory, 'id' | 'createdAt'>) => void
  
  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  
  // Settings
  cashDaysDefault: number
  setCashDaysDefault: (days: number) => void
  
  // Import
  importEmployees: (employees: Partial<Employee>[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      currentUser: null,
      isAuthenticated: false,
      
      login: (employeeId: string, password: string) => {
        const employee = get().employees.find(
          e => e.employeeId === employeeId && 
          (e.password === password || password === e.employeeId.slice(-4))
        )
        
        if (employee && employee.status !== 'terminated') {
          set({
            currentUser: {
              id: employee.id,
              employeeId: employee.employeeId,
              fullName: employee.fullName,
              role: employee.role,
              department: employee.department
            },
            isAuthenticated: true
          })
          setAuthCookies(employee.role || 'employee', employee.employeeId)
          return true
        }
        return false
      },
      
      logout: () => {
        clearAuthCookies()
        set({ currentUser: null, isAuthenticated: false })
      },
      
      // Employees
      employees: mockEmployees,
      
      addEmployee: (employeeData) => {
        const remaining = employeeData.baseSalary - employeeData.withdrawals
        const newEmployee: Employee = {
          ...employeeData,
          id: crypto.randomUUID(),
          remaining,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        set(state => ({ employees: [...state.employees, newEmployee] }))
        
        // Update department count
        const dept = get().departments.find(d => d.id === employeeData.departmentId)
        if (dept) {
          set(state => ({
            departments: state.departments.map(d =>
              d.id === employeeData.departmentId
                ? { ...d, employeeCount: d.employeeCount + 1 }
                : d
            )
          }))
        }
      },
      
      updateEmployee: (id, data) => {
        set(state => ({
          employees: state.employees.map(emp => {
            if (emp.id === id) {
              const updated = { ...emp, ...data, updatedAt: new Date() }
              updated.remaining = updated.baseSalary - updated.withdrawals
              return updated
            }
            return emp
          })
        }))
      },
      
      deleteEmployee: (id) => {
        const employee = get().employees.find(e => e.id === id)
        if (employee) {
          set(state => ({
            employees: state.employees.filter(e => e.id !== id),
            departments: state.departments.map(d =>
              d.id === employee.departmentId
                ? { ...d, employeeCount: Math.max(0, d.employeeCount - 1) }
                : d
            )
          }))
        }
      },
      
      getEmployeeById: (id) => get().employees.find(e => e.id === id),
      getEmployeeByEmployeeId: (employeeId) => get().employees.find(e => e.employeeId === employeeId),
      
      updateEmployeeStatus: (id, status) => {
        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === id ? { ...emp, status, updatedAt: new Date() } : emp
          )
        }))
      },
      
      // Branches
      branches: mockBranches,
      
      addBranch: (name) => {
        const newBranch: Branch = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date()
        }
        set(state => ({ branches: [...state.branches, newBranch] }))
      },
      
      updateBranch: (id, name) => {
        set(state => ({
          branches: state.branches.map(b =>
            b.id === id ? { ...b, name } : b
          ),
          employees: state.employees.map(e =>
            e.branchId === id ? { ...e, branch: name } : e
          )
        }))
      },
      
      deleteBranch: (id) => {
        set(state => ({
          branches: state.branches.filter(b => b.id !== id)
        }))
      },
      
      // Departments
      departments: mockDepartments,
      
      addDepartment: (name) => {
        const newDept: Department = {
          id: crypto.randomUUID(),
          name,
          employeeCount: 0,
          createdAt: new Date()
        }
        set(state => ({ departments: [...state.departments, newDept] }))
      },
      
      updateDepartment: (id, name) => {
        set(state => ({
          departments: state.departments.map(d =>
            d.id === id ? { ...d, name } : d
          ),
          employees: state.employees.map(e =>
            e.departmentId === id ? { ...e, department: name } : e
          )
        }))
      },
      
      deleteDepartment: (id) => {
        set(state => ({
          departments: state.departments.filter(d => d.id !== id)
        }))
      },
      
      // Payroll Sheets
      payrollSheets: mockPayrollSheets,
      
      addPayrollSheet: (month, year) => {
        const newSheet: PayrollSheet = {
          id: crypto.randomUUID(),
          month,
          year,
          status: 'draft',
          entries: [],
          totalGrossSalary: 0,
          totalWithdrawals: 0,
          totalNetSalary: 0,
          totalCashReceived: 0,
          totalTransferReceived: 0,
          totalRemaining: 0,
          createdAt: new Date(),
          approvedAt: null,
          closedAt: null,
          createdBy: get().currentUser?.employeeId || 'admin'
        }
        set(state => ({ payrollSheets: [...state.payrollSheets, newSheet] }))
        return newSheet
      },
      
      updatePayrollSheet: (id, data) => {
        set(state => ({
          payrollSheets: state.payrollSheets.map(sheet =>
            sheet.id === id ? { ...sheet, ...data } : sheet
          )
        }))
      },
      
      deletePayrollSheet: (id) => {
        set(state => ({
          payrollSheets: state.payrollSheets.filter(sheet => sheet.id !== id)
        }))
      },
      
      getPayrollSheet: (id) => get().payrollSheets.find(sheet => sheet.id === id),
      
      updatePayrollStatus: (id, status) => {
        set(state => ({
          payrollSheets: state.payrollSheets.map(sheet => {
            if (sheet.id === id) {
              return {
                ...sheet,
                status,
                approvedAt: status === 'approved' ? new Date() : sheet.approvedAt,
                closedAt: status === 'closed' ? new Date() : sheet.closedAt
              }
            }
            return sheet
          })
        }))
      },
      
      addPayrollEntry: (sheetId, entry) => {
        const newEntry: PayrollEntry = {
          ...entry,
          id: crypto.randomUUID()
        }
        set(state => ({
          payrollSheets: state.payrollSheets.map(sheet => {
            if (sheet.id === sheetId) {
              const entries = [...sheet.entries, newEntry]
              return {
                ...sheet,
                entries,
                ...calculatePayrollTotals(entries)
              }
            }
            return sheet
          })
        }))
      },
      
      updatePayrollEntry: (sheetId, entryId, data) => {
        set(state => ({
          payrollSheets: state.payrollSheets.map(sheet => {
            if (sheet.id === sheetId) {
              const entries = sheet.entries.map(entry =>
                entry.id === entryId ? { ...entry, ...data } : entry
              )
              return {
                ...sheet,
                entries,
                ...calculatePayrollTotals(entries)
              }
            }
            return sheet
          })
        }))
      },
      
      deletePayrollEntry: (sheetId, entryId) => {
        set(state => ({
          payrollSheets: state.payrollSheets.map(sheet => {
            if (sheet.id === sheetId) {
              const entries = sheet.entries.filter(entry => entry.id !== entryId)
              return {
                ...sheet,
                entries,
                ...calculatePayrollTotals(entries)
              }
            }
            return sheet
          })
        }))
      },
      
      importPayrollEntries: (sheetId, entries) => {
        const newEntries: PayrollEntry[] = entries.map(entry => ({
          ...entry,
          id: crypto.randomUUID()
        }))
        set(state => ({
          payrollSheets: state.payrollSheets.map(sheet => {
            if (sheet.id === sheetId) {
              const allEntries = [...sheet.entries, ...newEntries]
              return {
                ...sheet,
                entries: allEntries,
                ...calculatePayrollTotals(allEntries)
              }
            }
            return sheet
          })
        }))
      },
      
      // Review Requests
      reviewRequests: mockReviewRequests,
      
      addReviewRequest: (request) => {
        const newRequest: ReviewRequest = {
          ...request,
          id: crypto.randomUUID(),
          status: 'pending',
          adminResponse: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        set(state => ({ reviewRequests: [...state.reviewRequests, newRequest] }))
      },
      
      updateReviewRequest: (id, data) => {
        set(state => ({
          reviewRequests: state.reviewRequests.map(req =>
            req.id === id ? { ...req, ...data, updatedAt: new Date() } : req
          )
        }))
      },
      
      updateReviewRequestStatus: (id, status, response) => {
        set(state => ({
          reviewRequests: state.reviewRequests.map(req =>
            req.id === id ? { 
              ...req, 
              status, 
              adminResponse: response || req.adminResponse,
              updatedAt: new Date() 
            } : req
          )
        }))
      },
      
      deleteReviewRequest: (id) => {
        set(state => ({
          reviewRequests: state.reviewRequests.filter(req => req.id !== id)
        }))
      },
      
      // Salary History
      salaryHistory: mockSalaryHistory,
      
      addSalaryHistory: (history) => {
        const newHistory: SalaryHistory = {
          ...history,
          id: crypto.randomUUID(),
          createdAt: new Date()
        }
        set(state => ({ salaryHistory: [...state.salaryHistory, newHistory] }))
      },
      
      // Notifications
      notifications: [],
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          read: false,
          createdAt: new Date()
        }
        set(state => ({ notifications: [newNotification, ...state.notifications] }))
      },
      
      markAsRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }))
      },
      
      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }))
      },
      
      // Settings
      cashDaysDefault: 3,
      setCashDaysDefault: (days) => set({ cashDaysDefault: days }),
      
      // Import
      importEmployees: (importedEmployees) => {
        const newEmployees = importedEmployees.map(emp => {
          const dept = get().departments.find(d => d.name === emp.department)
          const branch = get().branches.find(b => b.name === emp.branch)
          const baseSalary = emp.baseSalary || 0
          const withdrawals = emp.withdrawals || 0
          
          return {
            id: crypto.randomUUID(),
            nationalId: emp.nationalId || '',
            fullName: emp.fullName || 'غير معروف',
            phoneNumber: emp.phoneNumber || '',
            password: emp.password || emp.employeeId?.slice(-4) || '0000',
            employeeId: emp.employeeId || `E${Date.now()}`,
            branchId: branch?.id || get().branches[0]?.id || '',
            branch: emp.branch || get().branches[0]?.name || '',
            departmentId: dept?.id || get().departments[0]?.id || '',
            department: emp.department || get().departments[0]?.name || '',
            workType: emp.workType || 'hourly',
            hourlyRate: emp.hourlyRate || 15,
            dailyRate: emp.dailyRate || 120,
            wallet: emp.wallet || { phoneNumber: '', ownerName: '', ownerId: '' },
            status: emp.status || 'active',
            role: emp.role || 'employee',
            baseSalary,
            workHours: emp.workHours || 0,
            withdrawals,
            remaining: baseSalary - withdrawals,
            paymentStatus: emp.paymentStatus || 'processing',
            cashDays: emp.cashDays || get().cashDaysDefault,
            createdAt: new Date(),
            updatedAt: new Date()
          } as Employee
        })
        
        set(state => ({ employees: [...state.employees, ...newEmployees] }))
      }
    }),
    {
      name: 'o2-payroll-storage-v2',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        employees: state.employees,
        branches: state.branches,
        departments: state.departments,
        payrollSheets: state.payrollSheets,
        reviewRequests: state.reviewRequests,
        salaryHistory: state.salaryHistory,
        notifications: state.notifications,
        cashDaysDefault: state.cashDaysDefault
      })
    }
  )
)

// Helper function to calculate payroll totals
function calculatePayrollTotals(entries: PayrollEntry[]) {
  return {
    totalGrossSalary: entries.reduce((sum, e) => sum + e.grossSalary, 0),
    totalWithdrawals: entries.reduce((sum, e) => sum + e.withdrawals, 0),
    totalNetSalary: entries.reduce((sum, e) => sum + e.netSalary, 0),
    totalCashReceived: entries.reduce((sum, e) => sum + e.cashReceived, 0),
    totalTransferReceived: entries.reduce((sum, e) => sum + e.transferReceived, 0),
    totalRemaining: entries.reduce((sum, e) => sum + e.remaining, 0)
  }
}
