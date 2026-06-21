import { storage, keys } from './storage';
import { exhibitionService } from './exhibitionService';
import type { Feedback, FeedbackWithDetails } from '../types';

export const feedbackService = {
  getAll(): Feedback[] {
    return storage.get<Feedback[]>(keys.FEEDBACKS) || [];
  },

  getById(id: string): Feedback | undefined {
    return this.getAll().find(f => f.id === id);
  },

  getByBookingId(bookingId: string): Feedback | undefined {
    return this.getAll().find(f => f.bookingId === bookingId);
  },

  getWithDetails(exhibitionId?: string): FeedbackWithDetails[] {
    const allFeedbacks = this.getAll().map(f => {
      const booking = storage.get<any[]>(keys.BOOKINGS)?.find(b => b.id === f.bookingId);
      const session = booking ? exhibitionService.getSessionById(booking.sessionId) : undefined;
      const exhibition = session ? exhibitionService.getById(session.exhibitionId) : undefined;
      return { ...f, booking, exhibition };
    });

    if (exhibitionId && exhibitionId !== 'all') {
      return allFeedbacks.filter(f => f.exhibition?.id === exhibitionId);
    }
    return allFeedbacks;
  },

  create(data: Omit<Feedback, 'id' | 'createdAt'>): Feedback {
    const feedbacks = this.getAll();
    const newFeedback: Feedback = {
      ...data,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    feedbacks.push(newFeedback);
    storage.set(keys.FEEDBACKS, feedbacks);
    return newFeedback;
  },

  getStats(exhibitionId?: string) {
    let feedbacks = this.getAll();

    if (exhibitionId && exhibitionId !== 'all') {
      const bookingIds = new Set(
        (storage.get<any[]>(keys.BOOKINGS) || [])
          .filter(b => {
            const session = exhibitionService.getSessionById(b.sessionId);
            return session?.exhibitionId === exhibitionId;
          })
          .map(b => b.id)
      );
      feedbacks = feedbacks.filter(f => bookingIds.has(f.bookingId));
    }

    const total = feedbacks.length;

    if (total === 0) {
      return {
        total: 0,
        avgContent: 0,
        avgGuide: 0,
        avgEnvironment: 0,
        avgOverall: 0,
      };
    }

    const avgContent = feedbacks.reduce((sum, f) => sum + f.ratingContent, 0) / total;
    const avgGuide = feedbacks.reduce((sum, f) => sum + f.ratingGuide, 0) / total;
    const avgEnvironment = feedbacks.reduce((sum, f) => sum + f.ratingEnvironment, 0) / total;
    const avgOverall = (avgContent + avgGuide + avgEnvironment) / 3;

    return {
      total,
      avgContent: Math.round(avgContent * 10) / 10,
      avgGuide: Math.round(avgGuide * 10) / 10,
      avgEnvironment: Math.round(avgEnvironment * 10) / 10,
      avgOverall: Math.round(avgOverall * 10) / 10,
    };
  },

  getPopularExhibits(exhibitionId?: string): { exhibit: any; count: number }[] {
    let feedbacks = this.getAll();

    if (exhibitionId && exhibitionId !== 'all') {
      const bookingIds = new Set(
        (storage.get<any[]>(keys.BOOKINGS) || [])
          .filter(b => {
            const session = exhibitionService.getSessionById(b.sessionId);
            return session?.exhibitionId === exhibitionId;
          })
          .map(b => b.id)
      );
      feedbacks = feedbacks.filter(f => bookingIds.has(f.bookingId));
    }

    const exhibitCounts: Record<string, number> = {};

    feedbacks.forEach(f => {
      f.interestedExhibits.forEach(exhibitId => {
        exhibitCounts[exhibitId] = (exhibitCounts[exhibitId] || 0) + 1;
      });
    });

    const exhibits = exhibitionId && exhibitionId !== 'all'
      ? exhibitionService.getExhibits(exhibitionId)
      : storage.get<any[]>(keys.EXHIBITS) || [];

    return Object.entries(exhibitCounts)
      .map(([id, count]) => ({
        exhibit: exhibits.find(e => e.id === id),
        count,
      }))
      .filter(item => item.exhibit)
      .sort((a, b) => b.count - a.count);
  },

  getRatingDistribution(exhibitionId?: string): { rating: number; count: number }[] {
    let feedbacks = this.getAll();

    if (exhibitionId && exhibitionId !== 'all') {
      const bookingIds = new Set(
        (storage.get<any[]>(keys.BOOKINGS) || [])
          .filter(b => {
            const session = exhibitionService.getSessionById(b.sessionId);
            return session?.exhibitionId === exhibitionId;
          })
          .map(b => b.id)
      );
      feedbacks = feedbacks.filter(f => bookingIds.has(f.bookingId));
    }

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    feedbacks.forEach(f => {
      const avg = Math.round((f.ratingContent + f.ratingGuide + f.ratingEnvironment) / 3);
      distribution[avg] = (distribution[avg] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([rating, count]) => ({ rating: parseInt(rating), count }))
      .sort((a, b) => b.rating - a.rating);
  },
};
