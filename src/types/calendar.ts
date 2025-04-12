export type CalendarEvent = {
  id: string
  title: string
  start_time: string
  end_time: string
  work_type: 'office' | 'remote'
  user_id: string
  created_at: string
  updated_at: string
}

export type CalendarDay = {
  date: Date
  dayOfWeek: string
  isToday: boolean
  events?: CalendarEvent[]
}

export type CalendarViewType = 'month' | 'week' | 'day'

export type CalendarProps = {
  events: CalendarEvent[]
  viewType?: CalendarViewType
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onViewChange?: (view: CalendarViewType) => void
} 