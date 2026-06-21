import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: string | Date, fmt: string = 'yyyy年MM月dd日'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: zhCN });
};

export const formatTime = (time: string): string => {
  return time;
};

export const formatDateTime = (dateTime: string | Date): string => {
  const d = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  return format(d, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
};

export const getDateLabel = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  if (isPast(addDays(date, 1))) return '已过期';
  return format(date, 'M月d日 EEEE', { locale: zhCN });
};

export const isDateInRange = (dateStr: string, startStr: string, endStr: string): boolean => {
  const date = parseISO(dateStr);
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  return date >= start && date <= end;
};

export const getDaysInRange = (startStr: string, endStr: string): Date[] => {
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  const days: Date[] = [];
  let current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
};

export const isTodayDate = (dateStr: string): boolean => {
  const date = parseISO(dateStr);
  return isToday(date);
};

export const getRelativeDateText = (dateStr: string): string => {
  const date = parseISO(dateStr);
  const today = new Date();
  const diff = differenceInDays(date, today);

  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff > 1 && diff < 7) return `${diff}天后`;
  if (diff < -1 && diff > -7) return `${Math.abs(diff)}天前`;
  return format(date, 'yyyy-MM-dd');
};
