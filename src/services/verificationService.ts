import { storage, keys } from './storage';
import { bookingService } from './bookingService';
import type { Verification, VerificationWithDetails } from '../types';
import { format, parse, isAfter, isSameDay } from 'date-fns';

export const verificationService = {
  getAll(): Verification[] {
    return storage.get<Verification[]>(keys.VERIFICATIONS) || [];
  },

  getByBookingId(bookingId: string): Verification | undefined {
    return this.getAll().find(v => v.bookingId === bookingId);
  },

  getToday(): Verification[] {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.getAll().filter(v => v.checkInTime.startsWith(today));
  },

  getWithDetails(id: string): VerificationWithDetails | undefined {
    const verification = this.getAll().find(v => v.id === id);
    if (!verification) return undefined;

    const booking = bookingService.getWithDetails(verification.bookingId);
    return { ...verification, booking };
  },

  getTodayWithDetails(): VerificationWithDetails[] {
    return this.getToday().map(v => ({
      ...v,
      booking: bookingService.getWithDetails(v.bookingId),
    }));
  },

  isLate(sessionDate: string, sessionStartTime: string, checkInTime: Date = new Date()): boolean {
    const sessionDateTime = parse(`${sessionDate} ${sessionStartTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const fifteenMinutesLater = new Date(sessionDateTime.getTime() + 15 * 60 * 1000);
    return isAfter(checkInTime, fifteenMinutesLater);
  },

  isSameDayAsSession(sessionDate: string, checkInTime: Date = new Date()): boolean {
    const sessionDay = parse(sessionDate, 'yyyy-MM-dd', new Date());
    return isSameDay(checkInTime, sessionDay);
  },

  verifyBooking(bookingCode: string): { success: boolean; message: string; booking?: any; isLate?: boolean } {
    const booking = bookingService.getByCode(bookingCode);

    if (!booking) {
      return { success: false, message: '预约不存在，请检查预约码是否正确' };
    }

    if (booking.status === 'cancelled') {
      return { success: false, message: '该预约已取消' };
    }

    if (booking.status === 'checked_in') {
      return { success: false, message: '该预约已核验入场，请勿重复核验' };
    }

    const bookingWithDetails = bookingService.getWithDetails(booking.id);
    const session = bookingWithDetails?.session;
    if (!session) {
      return { success: false, message: '场次信息不存在' };
    }

    const existingVerification = this.getByBookingId(booking.id);
    if (existingVerification) {
      return { success: false, message: '该预约已核验入场，请勿重复核验' };
    }

    if (!this.isSameDayAsSession(session.date)) {
      return {
        success: false,
        message: `该预约场次为${format(parse(session.date, 'yyyy-MM-dd', new Date()), 'MM月dd日')}，非今日场次，无法核验`,
      };
    }

    const isLate = this.isLate(session.date, session.startTime);

    return {
      success: true,
      message: isLate ? '预约有效，但已迟到15分钟以上' : '预约有效，核验成功',
      booking: bookingWithDetails,
      isLate,
    };
  },

  checkIn(bookingId: string, isLate: boolean = false): Verification | null {
    const existing = this.getByBookingId(bookingId);
    if (existing) {
      return null;
    }

    const verifications = this.getAll();
    const verification: Verification = {
      id: `ver-${Date.now()}`,
      bookingId,
      checkInTime: new Date().toISOString(),
      status: isLate ? 'late' : 'success',
      isLate,
    };

    verifications.push(verification);
    storage.set(keys.VERIFICATIONS, verifications);
    bookingService.checkIn(bookingId);

    return verification;
  },

  batchCheckIn(bookingCodes: string[]): { success: string[]; failed: { code: string; message: string }[] } {
    const success: string[] = [];
    const failed: { code: string; message: string }[] = [];

    bookingCodes.forEach(code => {
      const result = this.verifyBooking(code);
      if (result.success && result.booking) {
        const checked = this.checkIn(result.booking.id, result.isLate || false);
        if (checked) {
          success.push(code);
        } else {
          failed.push({ code, message: '该预约已核验入场' });
        }
      } else {
        failed.push({ code, message: result.message });
      }
    });

    return { success, failed };
  },

  getTodayStats() {
    const today = this.getToday();
    const total = today.length;
    const success = today.filter(v => v.status === 'success').length;
    const late = today.filter(v => v.status === 'late').length;
    const failed = today.filter(v => v.status === 'failed').length;

    return { total, success, late, failed };
  },
};
