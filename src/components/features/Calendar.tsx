import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  highlightedDates?: { date: Date; count?: number; status?: 'available' | 'limited' | 'full' }[];
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
  highlightedDates = [],
  className,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), date)) return true;
    return disabledDates.some(d => isSameDay(d, date));
  };

  const getHighlightInfo = (date: Date) => {
    return highlightedDates.find(h => isSameDay(h.date, date));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'full':
        return 'bg-red-400';
      case 'limited':
        return 'bg-amber-400';
      case 'available':
      default:
        return 'bg-accent-teal';
    }
  };

  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <div className={cn('bg-white rounded-2xl shadow-card p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="font-serif text-lg font-semibold text-primary-900">
          {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, i) => (
          <div key={`padding-${i}`} className="h-12" />
        ))}

        {daysInMonth.map((day) => {
          const isDisabled = isDateDisabled(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const highlightInfo = getHighlightInfo(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isDisabled && onDateSelect(day)}
              disabled={isDisabled || !isCurrentMonth}
              className={cn(
                'relative h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200',
                isCurrentMonth && !isDisabled && 'hover:bg-primary-50 cursor-pointer',
                isSelected && 'bg-primary-900 text-white hover:bg-primary-800',
                isDisabled && 'text-gray-200 cursor-not-allowed',
                !isCurrentMonth && 'text-gray-200',
                isToday(day) && !isSelected && 'ring-2 ring-primary-300 ring-inset'
              )}
            >
              <span className={cn('text-sm font-medium', isSelected ? 'text-white' : '')}>
                {format(day, 'd')}
              </span>
              {highlightInfo && !isSelected && (
                <Circle
                  className={cn(
                    'w-1.5 h-1.5 fill-current',
                    getStatusColor(highlightInfo.status)
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-teal" />
          <span className="text-xs text-gray-500">可预约</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-gray-500">即将满员</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs text-gray-500">已满员</span>
        </div>
      </div>
    </div>
  );
};
