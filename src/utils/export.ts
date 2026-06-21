import * as XLSX from 'xlsx';
import type { BookingWithDetails } from '../types';
import { formatDate } from './date';

export const exportBookingsToExcel = (
  bookings: BookingWithDetails[],
  filename: string = '预约名单.xlsx'
): void => {
  const data = bookings.map(booking => ({
    '预约码': booking.code,
    '姓名': booking.visitorName,
    '手机号': booking.phone,
    '人数': booking.count,
    '展览': booking.exhibition?.title || '',
    '场次日期': booking.session ? formatDate(booking.session.date) : '',
    '场次时间': booking.session ? `${booking.session.startTime}-${booking.session.endTime}` : '',
    '票种': booking.ticketType?.name || '',
    '状态': getBookingStatusText(booking.status),
    '预约时间': formatDate(booking.createdAt, 'yyyy-MM-dd HH:mm'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '预约名单');

  ws['!cols'] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 8 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
  ];

  XLSX.writeFile(wb, filename);
};

export const exportBookingsToCSV = (
  bookings: BookingWithDetails[],
  filename: string = '预约名单.csv'
): void => {
  const headers = ['预约码', '姓名', '手机号', '人数', '展览', '场次日期', '场次时间', '票种', '状态', '预约时间'];
  const rows = bookings.map(booking => [
    booking.code,
    booking.visitorName,
    booking.phone,
    booking.count,
    booking.exhibition?.title || '',
    booking.session ? formatDate(booking.session.date) : '',
    booking.session ? `${booking.session.startTime}-${booking.session.endTime}` : '',
    booking.ticketType?.name || '',
    getBookingStatusText(booking.status),
    formatDate(booking.createdAt, 'yyyy-MM-dd HH:mm'),
  ]);

  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const getBookingStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    checked_in: '已入场',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
};
