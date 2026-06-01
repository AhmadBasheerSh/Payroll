import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AUTH_COOKIE_NAME = 'complete_tasks_auth'
const ROLE_COOKIE_NAME = 'complete_tasks_role'
const EMPLOYEE_COOKIE_NAME = 'complete_tasks_employee'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 1 day

export function setAuthCookies(role: string, employeeId: string) {
  if (typeof document === 'undefined') return

  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}`
  document.cookie = `${ROLE_COOKIE_NAME}=${encodeURIComponent(role)}; path=/; max-age=${COOKIE_MAX_AGE}`
  document.cookie = `${EMPLOYEE_COOKIE_NAME}=${encodeURIComponent(employeeId)}; path=/; max-age=${COOKIE_MAX_AGE}`
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`
  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`
  document.cookie = `${EMPLOYEE_COOKIE_NAME}=; path=/; max-age=0`
}
