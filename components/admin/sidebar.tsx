'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileSpreadsheet, 
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  FileText,
  Clock,
  Wallet,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const menuItems = [
  { 
    href: '/admin', 
    label: 'لوحة التحكم', 
    icon: LayoutDashboard 
  },
  { 
    href: '/admin/employees', 
    label: 'الموظفين', 
    icon: Users 
  },
  { 
    href: '/admin/departments', 
    label: 'الأقسام', 
    icon: Building2 
  },
  { 
    href: '/admin/payroll', 
    label: 'إثبات الرواتب', 
    icon: Wallet 
  },
  { 
    href: '/admin/reviews', 
    label: 'طلبات المراجعة', 
    icon: MessageSquare 
  },
  { 
    href: '/admin/import', 
    label: 'استيراد Excel', 
    icon: FileSpreadsheet 
  },
  { 
    href: '/admin/reports', 
    label: 'التقارير', 
    icon: FileText 
  },
  { 
    href: '/admin/attendance', 
    label: 'الحضور', 
    icon: Clock 
  },
  { 
    href: '/admin/settings', 
    label: 'الإعدادات', 
    icon: Settings 
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('o2_current_user')
      if (raw) setCurrentUser(JSON.parse(raw))
    } catch (e) {
      setCurrentUser(null)
    }
  }, [])

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-40 h-screen w-72 border-l bg-card transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center border-b px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
                O2
              </div>
              <div>
                <h1 className="font-bold text-lg">O2 Payroll</h1>
                <p className="text-xs text-muted-foreground">نظام إدارة الرواتب</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="border-b px-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {currentUser?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentUser?.fullName || 'المدير'}</p>
                <p className="text-xs text-muted-foreground">
                  {currentUser?.role === 'admin' ? 'مدير النظام' : 
                   currentUser?.role === 'hr' ? 'موارد بشرية' : 'موظف'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      {isActive && (
                        <ChevronRight className="mr-auto h-4 w-4" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Link href="/">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  localStorage.removeItem('o2_current_user')
                  setIsOpen(false)
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>تسجيل الخروج</span>
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
