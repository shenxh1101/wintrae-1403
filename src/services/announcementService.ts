import { storage, keys } from './storage';
import type { Announcement } from '../types';

export const announcementService = {
  getAll(): Announcement[] {
    return storage.get<Announcement[]>(keys.ANNOUNCEMENTS) || [];
  },

  getActive(): Announcement[] {
    return this.getAll().filter(a => a.isActive).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getById(id: string): Announcement | undefined {
    return this.getAll().find(a => a.id === id);
  },

  create(data: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const announcements = this.getAll();
    const newAnnouncement: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    announcements.push(newAnnouncement);
    storage.set(keys.ANNOUNCEMENTS, announcements);
    return newAnnouncement;
  },

  update(id: string, data: Partial<Announcement>): Announcement | undefined {
    const announcements = this.getAll();
    const index = announcements.findIndex(a => a.id === id);
    if (index !== -1) {
      announcements[index] = { ...announcements[index], ...data };
      storage.set(keys.ANNOUNCEMENTS, announcements);
      return announcements[index];
    }
    return undefined;
  },

  delete(id: string): boolean {
    const announcements = this.getAll().filter(a => a.id !== id);
    storage.set(keys.ANNOUNCEMENTS, announcements);
    return true;
  },

  toggleActive(id: string): Announcement | undefined {
    const announcement = this.getById(id);
    if (announcement) {
      return this.update(id, { isActive: !announcement.isActive });
    }
    return undefined;
  },
};
