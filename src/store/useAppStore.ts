import { create } from 'zustand';
import { initMockData } from '../services/mockData';
import type { Exhibition, Session, TicketType, Booking, Announcement } from '../types';

interface AppState {
  initialized: boolean;
  currentView: 'staff' | 'public';
  selectedExhibition: Exhibition | null;
  announcements: Announcement[];
  init: () => void;
  setCurrentView: (view: 'staff' | 'public') => void;
  setSelectedExhibition: (exhibition: Exhibition | null) => void;
  refreshData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  currentView: 'staff',
  selectedExhibition: null,
  announcements: [],

  init: () => {
    if (!get().initialized) {
      initMockData();
      set({ initialized: true });
    }
  },

  setCurrentView: (view) => set({ currentView: view }),

  setSelectedExhibition: (exhibition) => set({ selectedExhibition: exhibition }),

  refreshData: () => {
    set({ initialized: false });
    get().init();
  },
}));
