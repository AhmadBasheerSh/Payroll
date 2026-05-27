'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import type { UserRole } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAppStore()
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const normalizedEmployeeId = employeeId.trim()

    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, employee_id, role, department_id, status, password')
      .eq('employee_id', normalizedEmployeeId)
      .maybeSingle()

    if (error || !data) {
      toast.error('بيانات الدخول غير صحيحة')
      setIsLoading(false)
      return
    }

    const validPassword = data.password === password || password === normalizedEmployeeId.slice(-4)

    if (!validPassword || data.status === 'terminated') {
      toast.error('بيانات الدخول غير صحيحة')
      setIsLoading(false)
      return
    }

    const employeeIdValue = String(data.employee_id ?? '').trim()
    if (!employeeIdValue) {
      toast.error('بيانات الدخول غير صحيحة')
      setIsLoading(false)
      return
    }

    const normalizedRole = String(data.role ?? 'employee').trim().toLowerCase()
    const role: UserRole =
      normalizedRole === 'admin' || normalizedRole === 'hr' || normalizedRole === 'employee'
        ? normalizedRole
        : 'employee'

    useAppStore.setState({
      currentUser: {
        id: data.id,
        employeeId: employeeIdValue,
        fullName: data.full_name,
        role,
        department: data.department_id ?? ''
      },
      isAuthenticated: true
    })

    toast.success(`مرحباً ${data.full_name}`)

    if (role === 'admin' || role === 'hr') {
      router.replace('/admin')
    } else {
      router.replace(`/employee/${encodeURIComponent(employeeIdValue)}`)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-primary-foreground">O2</span>
              </div>
            </motion.div>
            
            <CardTitle className="text-2xl font-bold">O2 Payroll System</CardTitle>
            <CardDescription>نظام إدارة رواتب الموظفين</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employeeId">الرقم الوظيفي</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="employeeId"
                    placeholder="E20001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="آخر 4 أرقام من الهوية"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">بيانات تجريبية:</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">مدير:</span> E20001 / admin123</p>
                <p><span className="text-muted-foreground">موظف:</span> E20003 / 0003</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          © 2024 O2 Restaurant. جميع الحقوق محفوظة
        </p>
      </motion.div>
    </div>
  )
}
