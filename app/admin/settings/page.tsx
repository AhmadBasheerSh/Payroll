'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Save, RefreshCw, Shield, Bell, Database, Palette } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [localCashDays, setLocalCashDays] = useState(3)
  const [notifications, setNotifications] = useState(true)
  const [autoBackup, setAutoBackup] = useState(false)

  useEffect(() => {
    const v = localStorage.getItem('o2_cash_days_default')
    if (v) setLocalCashDays(Number(v))
  }, [])

  const handleSave = () => {
    localStorage.setItem('o2_cash_days_default', String(localCashDays))
    toast.success('تم حفظ الإعدادات بنجاح')
  }

  const handleResetData = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟')) {
      localStorage.removeItem('o2-payroll-storage')
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="الإعدادات" 
        description="إعدادات النظام"
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">الإعدادات العامة</CardTitle>
                    <CardDescription>إعدادات النظام الأساسية</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cashDays">أيام استلام الكاش الافتراضية</Label>
                  <Input
                    id="cashDays"
                    type="number"
                    min={1}
                    max={30}
                    value={localCashDays}
                    onChange={(e) => setLocalCashDays(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    عدد الأيام للموظفين الذين سيستلمون الراتب كاش
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>النسخ الاحتياطي التلقائي</Label>
                    <p className="text-sm text-muted-foreground">
                      حفظ البيانات تلقائياً كل يوم
                    </p>
                  </div>
                  <Switch
                    checked={autoBackup}
                    onCheckedChange={setAutoBackup}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">المظهر</CardTitle>
                    <CardDescription>تخصيص مظهر النظام</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>وضع العرض</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="w-full"
                    >
                      فاتح
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="w-full"
                    >
                      داكن
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="w-full"
                    >
                      تلقائي
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">الإشعارات</CardTitle>
                    <CardDescription>إدارة إشعارات النظام</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل الإشعارات</Label>
                    <p className="text-sm text-muted-foreground">
                      استلام إشعارات عن تحديثات الرواتب
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <Shield className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">الأمان</CardTitle>
                    <CardDescription>إعدادات الأمان والبيانات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleResetData}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة تعيين جميع البيانات
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  تحذير: سيتم حذف جميع البيانات نهائياً
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <Button size="lg" onClick={handleSave}>
            <Save className="h-4 w-4 ml-2" />
            حفظ الإعدادات
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
