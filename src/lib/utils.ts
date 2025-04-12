import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { ja } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, formatStr: string = 'yyyy/MM/dd') {
  return format(date, formatStr, { locale: ja })
}

export function getWeekDays(date: Date) {
  const start = startOfWeek(date, { locale: ja })
  const end = endOfWeek(date, { locale: ja })
  
  return eachDayOfInterval({ start, end }).map(day => ({
    date: day,
    dayOfWeek: format(day, 'EEEE', { locale: ja }),
    isToday: format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
  }))
}

export function getMonthDays(date: Date) {
  const start = startOfWeek(date, { locale: ja })
  const end = endOfWeek(date, { locale: ja })
  
  return eachDayOfInterval({ start, end }).map(day => ({
    date: day,
    dayOfWeek: format(day, 'EEEE', { locale: ja }),
    isToday: format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
  }))
} 