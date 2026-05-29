'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  delay?: number
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className,
  delay = 0 
}: StatsCardProps) {
  // ✅ Replaced motion.div with CSS animations
  // Calculate animation delay in milliseconds for inline style
  const delayMs = delay * 1000
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm animate-fade-slide-up",
        className
      )}
      style={{ 
        animationDelay: `${delayMs}ms`,
        // Ensure animation is visible immediately
        opacity: 1
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
    </div>
  )
}
