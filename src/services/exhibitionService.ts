import { storage, keys } from './storage';
import { bookingService } from './bookingService';
import type { Exhibition, Session, TicketType, Exhibit } from '../types';
import { format, parseISO, eachDayOfInterval } from 'date-fns';

export const exhibitionService = {
  getAll(): Exhibition[] {
    return storage.get<Exhibition[]>(keys.EXHIBITIONS) || [];
  },

  getById(id: string): Exhibition | undefined {
    return this.getAll().find(e => e.id === id);
  },

  create(data: Omit<Exhibition, 'id' | 'createdAt'>): Exhibition {
    const exhibitions = this.getAll();
    const newExhibition: Exhibition = {
      ...data,
      id: `exh-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    exhibitions.push(newExhibition);
    storage.set(keys.EXHIBITIONS, exhibitions);
    return newExhibition;
  },

  update(id: string, data: Partial<Exhibition>): Exhibition | undefined {
    const exhibitions = this.getAll();
    const index = exhibitions.findIndex(e => e.id === id);
    if (index !== -1) {
      exhibitions[index] = { ...exhibitions[index], ...data };
      storage.set(keys.EXHIBITIONS, exhibitions);
      return exhibitions[index];
    }
    return undefined;
  },

  delete(id: string): boolean {
    const exhibitions = this.getAll().filter(e => e.id !== id);
    storage.set(keys.EXHIBITIONS, exhibitions);
    this.deleteSessionsByExhibition(id);
    this.deleteTicketTypesByExhibition(id);
    this.deleteExhibitsByExhibition(id);
    return true;
  },

  getSessions(exhibitionId: string): Session[] {
    return storage.get<Session[]>(keys.SESSIONS)?.filter(s => s.exhibitionId === exhibitionId) || [];
  },

  getSessionById(id: string): Session | undefined {
    return storage.get<Session[]>(keys.SESSIONS)?.find(s => s.id === id);
  },

  getSessionsByDate(exhibitionId: string, date: string): Session[] {
    return this.getSessions(exhibitionId).filter(s => s.date === date);
  },

  createSessions(exhibitionId: string, startDate: string, endDate: string, times: { startTime: string; endTime: string }[], capacity: number): Session[] {
    const sessions = storage.get<Session[]>(keys.SESSIONS) || [];
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    const newSessions: Session[] = [];
    const timestamp = Date.now();

    days.forEach((day, dayIndex) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      times.forEach((time, timeIndex) => {
        const session: Session = {
          id: `sess-${timestamp}-${String(dayIndex * times.length + timeIndex).padStart(3, '0')}`,
          exhibitionId,
          date: dateStr,
          startTime: time.startTime,
          endTime: time.endTime,
          capacity,
          bookedCount: 0,
        };
        newSessions.push(session);
      });
    });

    const updatedSessions = [...sessions, ...newSessions];
    storage.set(keys.SESSIONS, updatedSessions);
    return newSessions;
  },

  createSessionsPreview(exhibitionId: string, startDate: string, endDate: string, times: { startTime: string; endTime: string }[], capacity: number): Session[] {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    const newSessions: Session[] = [];
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);

    days.forEach((day, dayIndex) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      times.forEach((time, timeIndex) => {
        const session: Session = {
          id: `sess-${timestamp}-${String(dayIndex * times.length + timeIndex).padStart(3, '0')}`,
          exhibitionId,
          date: dateStr,
          startTime: time.startTime,
          endTime: time.endTime,
          capacity,
          bookedCount: 0,
        };
        newSessions.push(session);
      });
    });

    return newSessions;
  },

  saveSessions(sessions: Session[]): Session[] {
    const existingSessions = storage.get<Session[]>(keys.SESSIONS) || [];
    const updatedSessions = [...existingSessions, ...sessions];
    storage.set(keys.SESSIONS, updatedSessions);
    return sessions;
  },

  updateSession(id: string, data: Partial<Session>): Session | undefined {
    const sessions = storage.get<Session[]>(keys.SESSIONS) || [];
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...data };
      storage.set(keys.SESSIONS, sessions);
      return sessions[index];
    }
    return undefined;
  },

  deleteSessionsByExhibition(exhibitionId: string): void {
    const sessions = storage.get<Session[]>(keys.SESSIONS)?.filter(s => s.exhibitionId !== exhibitionId) || [];
    storage.set(keys.SESSIONS, sessions);
  },

  getTicketTypes(exhibitionId: string): TicketType[] {
    return storage.get<TicketType[]>(keys.TICKET_TYPES)?.filter(t => t.exhibitionId === exhibitionId) || [];
  },

  getTicketTypeById(id: string): TicketType | undefined {
    return storage.get<TicketType[]>(keys.TICKET_TYPES)?.find(t => t.id === id);
  },

  createTicketType(data: Omit<TicketType, 'id'>): TicketType {
    const ticketTypes = storage.get<TicketType[]>(keys.TICKET_TYPES) || [];
    const newTicketType: TicketType = {
      ...data,
      id: `tt-${Date.now()}`,
    };
    ticketTypes.push(newTicketType);
    storage.set(keys.TICKET_TYPES, ticketTypes);
    return newTicketType;
  },

  updateTicketType(id: string, data: Partial<TicketType>): TicketType | undefined {
    const ticketTypes = storage.get<TicketType[]>(keys.TICKET_TYPES) || [];
    const index = ticketTypes.findIndex(t => t.id === id);
    if (index !== -1) {
      ticketTypes[index] = { ...ticketTypes[index], ...data };
      storage.set(keys.TICKET_TYPES, ticketTypes);
      return ticketTypes[index];
    }
    return undefined;
  },

  deleteTicketType(id: string): boolean {
    const ticketTypes = storage.get<TicketType[]>(keys.TICKET_TYPES)?.filter(t => t.id !== id) || [];
    storage.set(keys.TICKET_TYPES, ticketTypes);
    return true;
  },

  deleteTicketTypesByExhibition(exhibitionId: string): void {
    const ticketTypes = storage.get<TicketType[]>(keys.TICKET_TYPES)?.filter(t => t.exhibitionId !== exhibitionId) || [];
    storage.set(keys.TICKET_TYPES, ticketTypes);
  },

  getExhibits(exhibitionId: string): Exhibit[] {
    return storage.get<Exhibit[]>(keys.EXHIBITS)?.filter(e => e.exhibitionId === exhibitionId) || [];
  },

  createExhibit(data: Omit<Exhibit, 'id'>): Exhibit {
    const exhibits = storage.get<Exhibit[]>(keys.EXHIBITS) || [];
    const newExhibit: Exhibit = {
      ...data,
      id: `exbt-${Date.now()}`,
    };
    exhibits.push(newExhibit);
    storage.set(keys.EXHIBITS, exhibits);
    return newExhibit;
  },

  deleteExhibitsByExhibition(exhibitionId: string): void {
    const exhibits = storage.get<Exhibit[]>(keys.EXHIBITS)?.filter(e => e.exhibitionId !== exhibitionId) || [];
    storage.set(keys.EXHIBITS, exhibits);
  },

  getRemainingTickets(sessionId: string): number {
    const session = this.getSessionById(sessionId);
    if (!session) return 0;
    return session.capacity - session.bookedCount;
  },

  incrementBookedCount(sessionId: string, count: number): boolean {
    const session = this.getSessionById(sessionId);
    if (!session) return false;
    const remaining = session.capacity - session.bookedCount;
    if (remaining < count) return false;
    return this.updateSession(sessionId, { bookedCount: session.bookedCount + count }) !== undefined;
  },

  decrementBookedCount(sessionId: string, count: number): boolean {
    const session = this.getSessionById(sessionId);
    if (!session) return false;
    return this.updateSession(sessionId, { bookedCount: Math.max(0, session.bookedCount - count) }) !== undefined;
  },

  getSessionBookedCount(sessionId: string): number {
    const bookings = bookingService.getBySession(sessionId).filter(b => b.status !== 'cancelled');
    return bookings.reduce((sum, b) => sum + b.count, 0);
  },

  getTicketTypeUsageCount(ticketTypeId: string): number {
    const bookings = bookingService.getAll().filter(b => b.ticketTypeId === ticketTypeId && b.status !== 'cancelled');
    return bookings.length;
  },

  getExhibitionAffectedBookings(exhibitionId: string): { sessionId: string; count: number; bookingCount: number }[] {
    const sessions = this.getSessions(exhibitionId);
    return sessions.map(session => {
      const bookings = bookingService.getBySession(session.id).filter(b => b.status !== 'cancelled');
      return {
        sessionId: session.id,
        count: bookings.reduce((sum, b) => sum + b.count, 0),
        bookingCount: bookings.length,
      };
    }).filter(s => s.bookingCount > 0);
  },

  migrateBookingsToSession(oldSessionId: string, newSessionId: string): boolean {
    const bookings = bookingService.getBySession(oldSessionId).filter(b => b.status !== 'cancelled');
    if (bookings.length === 0) return true;

    const newSession = this.getSessionById(newSessionId);
    const oldSession = this.getSessionById(oldSessionId);
    if (!newSession) return false;

    const totalCount = bookings.reduce((sum, b) => sum + b.count, 0);
    const remaining = newSession.capacity - newSession.bookedCount;
    if (remaining < totalCount) return false;

    const newExhibition = this.getById(newSession.exhibitionId);

    bookings.forEach(booking => {
      const ticketType = this.getTicketTypeById(booking.ticketTypeId);
      bookingService.update(booking.id, {
        sessionId: newSessionId,
        snapshot: {
          sessionDate: newSession.date,
          sessionStartTime: newSession.startTime,
          sessionEndTime: newSession.endTime,
          ticketTypeName: ticketType?.name || booking.snapshot?.ticketTypeName || '',
          ticketTypePrice: ticketType?.price ?? booking.snapshot?.ticketTypePrice ?? 0,
          exhibitionTitle: newExhibition?.title || booking.snapshot?.exhibitionTitle || '',
        },
      });
    });

    if (oldSession) {
      this.decrementBookedCount(oldSessionId, totalCount);
    }
    this.incrementBookedCount(newSessionId, totalCount);

    return true;
  },

  cancelBookingsBySession(sessionId: string): number {
    const bookings = bookingService.getBySession(sessionId).filter(b => b.status === 'confirmed');
    bookings.forEach(booking => {
      bookingService.cancel(booking.id);
    });
    return bookings.length;
  },
};
