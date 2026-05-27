-- Supabase PostgreSQL schema for payroll / HR app

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (authentication and app roles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  employee_id UUID,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'hr', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  employee_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  national_id VARCHAR(50) UNIQUE NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  work_type VARCHAR(20) NOT NULL CHECK (work_type IN ('hourly', 'daily')),
  hourly_rate DECIMAL(10, 2),
  daily_rate DECIMAL(10, 2),
  wallet_phone_number VARCHAR(50),
  wallet_owner_name VARCHAR(255),
  wallet_owner_id VARCHAR(50),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'suspended', 'terminated')) DEFAULT 'active',
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'hr', 'employee')) DEFAULT 'employee',
  base_salary DECIMAL(12, 2),
  payment_status VARCHAR(30) CHECK (payment_status IN ('bank_transfer', 'cash', 'processing')),
  cash_days INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll sheets table
CREATE TABLE IF NOT EXISTS payroll_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')) DEFAULT 'draft',
  total_gross_salary DECIMAL(15, 2) DEFAULT 0,
  total_withdrawals DECIMAL(15, 2) DEFAULT 0,
  total_net_salary DECIMAL(15, 2) DEFAULT 0,
  total_cash_received DECIMAL(15, 2) DEFAULT 0,
  total_transfer_received DECIMAL(15, 2) DEFAULT 0,
  total_remaining DECIMAL(15, 2) DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (month, year)
);

-- Payroll entries table
CREATE TABLE IF NOT EXISTS payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_sheet_id UUID NOT NULL REFERENCES payroll_sheets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  hours_or_days DECIMAL(8, 2) NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  gross_salary DECIMAL(14, 2) NOT NULL,
  withdrawals DECIMAL(12, 2) DEFAULT 0,
  net_salary DECIMAL(14, 2) NOT NULL,
  cash_received DECIMAL(14, 2) DEFAULT 0,
  transfer_received DECIMAL(14, 2) DEFAULT 0,
  remaining DECIMAL(14, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review requests table
CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_sheet_id UUID NOT NULL REFERENCES payroll_sheets(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary history table
CREATE TABLE IF NOT EXISTS salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  base_salary DECIMAL(12, 2),
  work_hours DECIMAL(8, 2),
  withdrawals DECIMAL(12, 2),
  remaining DECIMAL(12, 2),
  payment_status VARCHAR(30),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (optional/future use)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(20) CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_sheet_id ON payroll_entries(payroll_sheet_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_employee_id ON payroll_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_employee_id ON review_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_employee_id ON salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_sheets_month_year ON payroll_sheets(month, year);
