 'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { StatsCard } from '@/components/admin/stats-card'
import { Users, Wallet, TrendingDown, CreditCard, Banknote, Clock } from 'lucide-react'
import { listEmployees } from '@/lib/api/employees'
import { listDepartments } from '@/lib/api/departments'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const empRes = await listEmployees()
      if (!empRes.error && empRes.data) setEmployees(empRes.data)
      const deptRes = await listDepartments()
      if (!deptRes.error && deptRes.data) setDepartments(deptRes.data)
    }
    load()
  }, [])

  // Calculate stats
  const totalEmployees = employees.length
  const totalSalaries = employees.reduce((sum: number, e: any) => sum + (Number(e.base_salary) || 0), 0)
  const totalWithdrawals = employees.reduce((sum: number, e: any) => sum + (Number(e.withdrawals) || 0), 0)
  const totalDeductions = 0
  const cashPayments = employees.filter((e: any) => (Number(e.remaining) || 0) < 700).length
  const bankTransfers = employees.filter((e: any) => e.payment_status === 'bank_transfer').length
  const processing = employees.filter((e: any) => e.payment_status === 'processing').length

  // Department stats for chart
  const departmentStats = departments.map((dept: any) => {
    const deptEmployees = employees.filter((e: any) => String(e.department_id || e.departmentId) === String(dept.id))
    return {
      name: dept.name,
      employees: deptEmployees.length,
      salary: deptEmployees.reduce((sum: number, e: any) => sum + (Number(e.base_salary) || 0), 0),
      withdrawals: deptEmployees.reduce((sum: number, e: any) => sum + (Number(e.withdrawals) || 0), 0),
    }
  }).filter((d: any) => d.employees > 0)

  // Payment status distribution
  const paymentDistribution = [
    { name: 'تحويل بنكي', value: bankTransfers, color: '#10b981' },
    { name: 'كاش', value: cashPayments, color: '#f59e0b' },
    { name: 'قيد المعالجة', value: processing, color: '#3b82f6' },
  ].filter((p: any) => p.value > 0)

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="لوحة التحكم" 
        description="نظرة عامة على رواتب الموظفين"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard
            title="إجمالي الموظفين"
            value={totalEmployees}
            icon={Users}
            delay={0}
          />
          <StatsCard
            title="إجمالي الرواتب"
            value={`${totalSalaries.toLocaleString()} ₪`}
            icon={Wallet}
            delay={0.1}
          />
          <StatsCard
            title="إجمالي السحوبات"
            value={`${totalWithdrawals.toLocaleString()} ₪`}
            icon={TrendingDown}
            delay={0.2}
          />
          <StatsCard
            title="إجمالي الخصومات"
            value={`${totalDeductions.toLocaleString()} ₪`}
            icon={TrendingDown}
            delay={0.3}
          />
          <StatsCard
            title="تحويل بنكي"
            value={bankTransfers}
            icon={CreditCard}
            delay={0.4}
          />
          <StatsCard
            title="استلام كاش"
            value={cashPayments}
            icon={Banknote}
            delay={0.5}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Salaries Chart */}
          {/* ✅ Replaced motion.div with CSS animation */}
          <div
            className="rounded-2xl border bg-card p-6 animate-fade-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <h3 className="text-lg font-semibold mb-4">الرواتب حسب القسم</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString()} ₪`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="salary" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Distribution */}
          <div
            className="rounded-2xl border bg-card p-6 animate-fade-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <h3 className="text-lg font-semibold mb-4">توزيع طرق الدفع</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value} موظف`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Department Stats Table */}
        <div
          className="rounded-2xl border bg-card p-6 animate-fade-slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          <h3 className="text-lg font-semibold mb-4">إحصائيات الأقسام</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">القسم</th>
                  <th className="text-right py-3 px-4 font-semibold">عدد الموظفين</th>
                  <th className="text-right py-3 px-4 font-semibold">إجمالي الرواتب</th>
                  <th className="text-right py-3 px-4 font-semibold">إجمالي السحوبات</th>
                  <th className="text-right py-3 px-4 font-semibold">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept, index) => (
                  <tr key={dept.name} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{dept.name}</td>
                    <td className="py-3 px-4">{dept.employees}</td>
                    <td className="py-3 px-4">{dept.salary.toLocaleString()} ₪</td>
                    <td className="py-3 px-4 text-destructive">{dept.withdrawals.toLocaleString()} ₪</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${(dept.salary / totalSalaries) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {((dept.salary / totalSalaries) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-slide-up"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            <Clock className="h-8 w-8 text-primary mb-3" />
            <h4 className="font-semibold mb-1">قيد المعالجة</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {processing} رواتب في انتظار المعالجة
            </p>
          </div>
          
          <div className="rounded-2xl border bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6">
            <Banknote className="h-8 w-8 text-amber-600 mb-3" />
            <h4 className="font-semibold mb-1">استلام كاش</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {cashPayments} موظفين سيستلمون كاش (أقل من 700₪)
            </p>
          </div>
          
          <div className="rounded-2xl border bg-gradient-to-br from-green-500/10 to-green-500/5 p-6">
            <CreditCard className="h-8 w-8 text-green-600 mb-3" />
            <h4 className="font-semibold mb-1">تحويل بنكي</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {bankTransfers} موظفين عبر التحويل البنكي
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
