import { storage, keys } from './storage';
import { exhibitionService } from './exhibitionService';
import type { Waitlist, WaitlistWithDetails } from '../types';

export const waitlistService = {
  getAll(): Waitlist[] {
    return storage.get<Waitlist[]>(keys.WAITLISTS) || [];
  },

  getById(id: string): Waitlist | undefined {
    return this.getAll().find(w => w.id === id);
  },

  getBySession(sessionId: string): Waitlist[] {
    return this.getAll()
      .filter(w => w.sessionId === sessionId && w.status === 'waiting')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getByPhone(phone: string): Waitlist[] {
    return this.getAll()
      .filter(w => w.phone === phone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getWithDetails(sessionId?: string): WaitlistWithDetails[] {
    let waitlists = this.getAll();
    if (sessionId) {
      waitlists = waitlists.filter(w => w.sessionId === sessionId);
    }
    return waitlists.map(w => {
      const session = exhibitionService.getSessionById(w.sessionId);
      const exhibition = session ? exhibitionService.getById(session.exhibitionId) : undefined;
      return { ...w, session, exhibition };
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  create(data: Omit<Waitlist, 'id' | 'status' | 'createdAt'>): Waitlist | null {
    const session = exhibitionService.getSessionById(data.sessionId);
    if (!session) return null;

    const waitlists = this.getAll();
    const newWaitlist: Waitlist = {
      ...data,
      id: `wl-${Date.now()}`,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    waitlists.push(newWaitlist);
    storage.set(keys.WAITLISTS, waitlists);
    return newWaitlist;
  },

  updateStatus(id: string, status: Waitlist['status']): Waitlist | undefined {
    const waitlists = this.getAll();
    const index = waitlists.findIndex(w => w.id === id);
    if (index !== -1) {
      waitlists[index] = { ...waitlists[index], status };
      storage.set(keys.WAITLISTS, waitlists);
      return waitlists[index];
    }
    return undefined;
  },

  getPosition(id: string): number {
    const waitlist = this.getById(id);
    if (!waitlist) return -1;

    const sessionWaitlists = this.getBySession(waitlist.sessionId);
    return sessionWaitlists.findIndex(w => w.id === id) + 1;
  },

  getWaitlistCount(sessionId: string): number {
    return this.getBySession(sessionId).length;
  },

  processWaitlistOnCancel(sessionId: string, releasedCount: number): Waitlist[] {
    const waitingList = this.getBySession(sessionId);
    if (waitingList.length === 0) return [];

    const notified: Waitlist[] = [];
    let remaining = releasedCount;

    for (const w of waitingList) {
      if (remaining <= 0) break;
      if (w.count <= remaining) {
        this.updateStatus(w.id, 'notified');
        notified.push({ ...w, status: 'notified' });
        remaining -= w.count;
      }
    }

    return notified;
  },

  convertToBooking(waitlistId: string, ticketTypeId: string, visitorName: string, phone: string): any {
    // 调用方需配合 bookingService 使用，这里只做状态更新
    return this.updateStatus(waitlistId, 'converted');
  },

  expireOldWaitlists(days: number = 1): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const waitlists = this.getAll();

    waitlists.forEach(w => {
      if (w.status === 'waiting' && new Date(w.createdAt) < cutoff) {
        w.status = 'expired';
      }
    });

    storage.set(keys.WAITLISTS, waitlists);
  },
};
