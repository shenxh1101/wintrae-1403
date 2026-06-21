const STORAGE_KEYS = {
  EXHIBITIONS: 'exhibitions',
  SESSIONS: 'sessions',
  TICKET_TYPES: 'ticketTypes',
  EXHIBITS: 'exhibits',
  BOOKINGS: 'bookings',
  VERIFICATIONS: 'verifications',
  FEEDBACKS: 'feedbacks',
  ANNOUNCEMENTS: 'announcements',
  WAITLISTS: 'waitlists',
};

export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};

export const keys = STORAGE_KEYS;
