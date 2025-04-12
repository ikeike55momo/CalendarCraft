'use client'

import { useState } from 'react'
import { CalendarProps, CalendarViewType } from '@/types/calendar'
import { cn } from '@/lib/utils'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'

export function Calendar({
  events,
  viewType = 'month',
  onEventClick,
  onDateClick,
  onViewChange,
}: CalendarProps) {
  const [currentView, setCurrentView] = useState<CalendarViewType>(viewType)

  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view)
    onViewChange?.(view)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange('month')}
            className={cn(
              'px-3 py-1 rounded-md',
              currentView === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            月
          </button>
          <button
            onClick={() => handleViewChange('week')}
            className={cn(
              'px-3 py-1 rounded-md',
              currentView === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            週
          </button>
          <button
            onClick={() => handleViewChange('day')}
            className={cn(
              'px-3 py-1 rounded-md',
              currentView === 'day'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            日
          </button>
        </div>
      </div>

      <div className="flex-1">
        {currentView === 'month' && (
          <MonthView
            events={events}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
          />
        )}
        {currentView === 'week' && (
          <WeekView
            events={events}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
          />
        )}
        {currentView === 'day' && (
          <DayView
            events={events}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
          />
        )}
      </div>
    </div>
  )
} 