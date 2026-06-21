import { storage, keys } from './storage';
import { exhibitionService } from './exhibitionService';
import type { Booking, BookingWithDetails } from '../types';
import { format } from 'date-fns';

export const bookingService = {
  getAll(): Booking[] {
    return storage.get<Booking[]>(keys.BOOKINGS) || [];
  },

  getById(id: string): Booking | undefined {
    return this.getAll().find(b => b.id === id);
  },

  getByCode(code: string): Booking | undefined {
    return this.getAll().find(b => b.code === code.toUpperCase());
  },

  getByPhone(phone: string): Booking[] {
    return this.getAll().filter(b => b.phone === phone);
  },

  getBySession(sessionId: string): Booking[] {
    return this.getAll().filter(b => b.sessionId === sessionId);
  },

  getWithDetails(id: string): BookingWithDetails | undefined {
    const booking = this.getById(id);
    if (!booking) return undefined;

    const session = exhibitionService.getSessionById(booking.sessionId);
    const exhibition = session ? exhibitionService.getById(session.exhibitionId) : undefined;
    const ticketType = exhibitionService.getTicketTypeById(booking.ticketTypeId);

    return { ...booking, session, exhibition, ticketType };
  },

  generateCode(): string {
    const today = new Date();
    const dateStr = format(today, 'MMdd');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let random = '';
    for (let i = 0; i < 8; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `EXH-${random}-${dateStr}`;
  },

  create(data: Omit<Booking, 'id' | 'code' | 'status' | 'createdAt'>): Booking | null {
    const remaining = exhibitionService.getRemainingTickets(data.sessionId);
    if (remaining < data.count) {
      return null;
    }

    const bookings = this.getAll();
    let code = this.generateCode();
    while (this.getByCode(code)) {
      code = this.generateCode();
    }

    const newBooking: Booking = {
      ...data,
      id: `bk-${Date.now()}`,
      code,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    storage.set(keys.BOOKINGS, bookings);
    exhibitionService.incrementBookedCount(data.sessionId, data.count);

    return newBooking;
  },

  update(id: string, data: Partial<Booking>): Booking | undefined {
    const bookings = this.getAll();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...data };
      storage.set(keys.BOOKINGS, bookings);
      return bookings[index];
    }
    return undefined;
  },

  updateSession(bookingId: string, newSessionId: string, newCount: number): Booking | null {
    const booking = this.getById(bookingId);
    if (!booking) return null;

    const isSameSession = booking.sessionId === newSessionId;
    const newSessionRemaining = exhibitionService.getRemainingTickets(newSessionId);

    let availableForNewCount: number;
    if (isSameSession) {
      availableForNewCount = newSessionRemaining + booking.count;
    } else {
      availableForNewCount = newSessionRemaining;
    }

    if (availableForNewCount < newCount) {
      return null;
    }

    if (isSameSession) {
      const diff = newCount - booking.count;
      if (diff > 0) {
        exhibitionService.incrementBookedCount(newSessionId, diff);
      } else if (diff < 0) {
        exhibitionService.decrementBookedCount(newSessionId, -diff);
      }
    } else {
      exhibitionService.decrementBookedCount(booking.sessionId, booking.count);
      exhibitionService.incrementBookedCount(newSessionId, newCount);
    }

    return this.update(bookingId, { sessionId: newSessionId, count: newCount });
  },

  cancel(id: string): boolean {
    const booking = this.getById(id);
    if (!booking) return false;

    exhibitionService.decrementBookedCount(booking.sessionId, booking.count);
    this.update(id, { status: 'cancelled' });
    return true;
  },

  checkIn(id: string): boolean {
    return this.update(id, { status: 'checked_in' }) !== undefined;
  },

  getStats() {
    const bookings = this.getAll();
    const today = format(new Date(), 'yyyy-MM-dd');

    const totalBookings = bookings.length;
    const checkedIn = bookings.filter(b => b.status === 'checked_in').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const todayBookings = bookings.filter(b => {
      const session = exhibitionService.getSessionById(b.sessionId);
      return session?.date === today;
    });

    const attendanceRate = confirmed > 0 ? Math.round((checkedIn / (checkedIn + confirmed)) * 100) : 0;

    return {
      totalBookings,
      checkedIn,
      confirmed,
      cancelled,
      todayBookings: todayBookings.length,
      attendanceRate,
    };
  },

  getBookingTrend(days: number = 7): { date: string; count: number }[] {
    const bookings = this.getAll();
    const trend: { date: string; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const count = bookings.filter(b => {
        const session = exhibitionService.getSessionById(b.sessionId);
        return session?.date === dateStr;
      }).length;

      trend.push({ date: format(date, 'MM-dd'), count });
    }

    return trend;
  },

  getTimeSlotStats(): { time: string; count: number }[] {
    const bookings = this.getAll().filter(b => b.status === 'checked_in');
    const slots: Record<string, number> = {};

    bookings.forEach(b => {
      const session = exhibitionService.getSessionById(b.sessionId);
      if (session) {
        const timeSlot = session.startTime;
        slots[timeSlot] = (slots[timeSlot] || 0) + b.count;
      }
    });

    return Object.entries(slots)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time.localeCompare(b.time));
  },

  getLowTicketAlerts(threshold: number = 10) {
    const sessions = storage.get<any[]>(keys.SESSIONS) || [];
    const exhibitions = exhibitionService.getAll();
    const alerts: { exhibition: any; session: any; remaining: number }[] = [];

    sessions.forEach(session => {
      const remaining = session.capacity - session.bookedCount;
      if (remaining <= threshold && remaining > 0) {
        const exhibition = exhibitions.find(e => e.id === session.exhibitionId);
        if (exhibition && exhibition.status === 'active') {
          alerts.push({ exhibition, session, remaining });
        }
      }
    });

    return alerts;
  },
};
