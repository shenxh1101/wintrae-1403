import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Ticket,
  Edit2,
  X,
  CheckCircle,
  XCircle,
  Search,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { QRCodeDisplay } from '@/components/features/QRCodeDisplay';
import { bookingService } from '@/services/bookingService';
import { exhibitionService } from '@/services/exhibitionService';
import { formatDate, formatDateTime } from '@/utils/date';
import { validatePhone } from '@/utils/validation';
import { cn } from '@/lib/utils';
import type { BookingWithDetails } from '@/types';

export const MyBookingsPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCount, setEditCount] = useState(1);
  const [editSessionId, setEditSessionId] = useState('');
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [phoneError, setPhoneError] = useState('');

  const handleSearch = () => {
    const error = validatePhone(phone) ? '' : '请输入正确的手机号';
    setPhoneError(error);

    if (error) return;

    const rawBookings = bookingService.getByPhone(phone);
    const detailedBookings = rawBookings
      .map(b => bookingService.getWithDetails(b.id)!)
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setBookings(detailedBookings);
    setSearchPhone(phone);
    setHasSearched(true);
  };

  const handleViewQR = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setShowQRModal(true);
  };

  const handleEdit = (booking: BookingWithDetails) => {
    if (booking.session) {
      const sessions = exhibitionService
        .getSessions(booking.session.exhibitionId)
        .filter(s => {
          const remaining = s.capacity - s.bookedCount;
          return s.date >= booking.session!.date && remaining > 0;
        });

      setAvailableSessions(sessions);
      setSelectedBooking(booking);
      setEditCount(booking.count);
      setEditSessionId(booking.sessionId);
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedBooking) return;

    const success = bookingService.updateSession(
      selectedBooking.id,
      editSessionId,
      editCount
    );

    if (success) {
      setShowEditModal(false);
      handleSearch();
    }
  };

  const handleCancel = (booking: BookingWithDetails) => {
    if (confirm('确定要取消这个预约吗？')) {
      bookingService.cancel(booking.id);
      handleSearch();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-blue-100 text-blue-700',
      checked_in: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    const labels = {
      confirmed: '已确认',
      checked_in: '已入场',
      cancelled: '已取消',
    };
    return (
      <span className={cn('badge', styles[status as keyof typeof styles])}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const canModify = (booking: BookingWithDetails) => {
    return booking.status === 'confirmed';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">我的预约</h1>
        <p className="text-gray-500 text-sm">查看和管理您的预约记录</p>
      </div>

      {!hasSearched ? (
        <div className="max-w-md mx-auto">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-primary-900 mb-2">
                查询我的预约
              </h3>
              <p className="text-gray-500 text-sm">
                请输入预约时使用的手机号查询您的预约记录
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">手机号</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    className={cn('input-field flex-1', phoneError && 'input-error')}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="请输入手机号"
                    maxLength={11}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-1" />
                    查询
                  </Button>
                </div>
                {phoneError && (
                  <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 max-w-md">
              <div className="flex gap-2">
                <input
                  type="tel"
                  className="input-field flex-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="输入手机号查询"
                  maxLength={11}
                />
                <Button variant="secondary" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 mb-2">暂无预约记录</p>
              <p className="text-gray-400 text-sm mb-4">
                手机号 {searchPhone} 暂无预约记录
              </p>
              <Button onClick={() => setHasSearched(false)}>返回查询</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="card overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-32 md:h-auto shrink-0">
                      <img
                        src={booking.exhibition?.coverImage}
                        alt={booking.exhibition?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-serif font-semibold text-lg text-primary-900 truncate">
                              {booking.exhibition?.title}
                            </h4>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {booking.session ? formatDate(booking.session.date) : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>
                                {booking.session
                                  ? `${booking.session.startTime} - ${booking.session.endTime}`
                                  : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Ticket className="w-4 h-4" />
                              <span>
                                {booking.ticketType?.name || '-'} × {booking.count}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-gray-400">
                            预约时间：{formatDateTime(booking.createdAt)} · 预约码：{booking.code}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => handleViewQR(booking)}
                            >
                              出示预约码
                            </Button>
                          )}
                          <div className="flex gap-1">
                            {canModify(booking) && (
                              <>
                                <button
                                  onClick={() => handleEdit(booking)}
                                  className="p-2 hover:bg-primary-50 rounded-lg text-gray-500 hover:text-primary-900 transition-colors"
                                  title="修改预约"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCancel(booking)}
                                  className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                  title="取消预约"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="预约码"
        size="sm"
      >
        {selectedBooking && (
          <div className="text-center">
            <QRCodeDisplay code={selectedBooking.code} size={200} />

            <div className="mt-6 p-4 bg-primary-50/50 rounded-xl text-left">
              <h5 className="font-medium text-primary-900 mb-2">
                {selectedBooking.exhibition?.title}
              </h5>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {selectedBooking.session ? formatDate(selectedBooking.session.date) : '-'}
                </p>
                <p>
                  <Clock className="w-4 h-4 inline mr-1" />
                  {selectedBooking.session
                    ? `${selectedBooking.session.startTime} - ${selectedBooking.session.endTime}`
                    : '-'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-amber-600 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-left">请向工作人员出示此二维码，或报预约码完成核验</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="修改预约"
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="p-4 bg-primary-50/50 rounded-xl">
              <h5 className="font-medium text-primary-900 mb-1">
                {selectedBooking.exhibition?.title}
              </h5>
              <p className="text-sm text-gray-500">
                当前场次：{selectedBooking.session
                  ? `${formatDate(selectedBooking.session.date)} ${selectedBooking.session.startTime}-${selectedBooking.session.endTime}`
                  : '-'}
              </p>
            </div>

            <div>
              <label className="label">选择新场次</label>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {availableSessions.map((session) => {
                  const remaining = session.capacity - session.bookedCount;
                  const isFull = remaining < editCount;
                  return (
                    <label
                      key={session.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all',
                        editSessionId === session.id
                          ? 'border-primary-900 bg-primary-50'
                          : isFull
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-100 hover:border-primary-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="session"
                          value={session.id}
                          checked={editSessionId === session.id}
                          onChange={() => !isFull && setEditSessionId(session.id)}
                          disabled={isFull}
                          className="w-4 h-4 text-primary-900"
                        />
                        <div>
                          <p className="font-medium text-primary-900">
                            {formatDate(session.date)} {session.startTime}-{session.endTime}
                          </p>
                          <p className="text-xs text-gray-500">
                            剩余 {remaining} 人
                          </p>
                        </div>
                      </div>
                      {isFull && (
                        <span className="text-xs text-red-500">人数不足</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">参观人数</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setEditCount(Math.max(1, editCount - 1))}
                    className="px-4 py-2.5 hover:bg-gray-50 transition-colors text-xl font-medium text-gray-600"
                  >
                    −
                  </button>
                  <span className="px-6 py-2.5 text-lg font-semibold text-primary-900 min-w-[60px] text-center">
                    {editCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentSession = availableSessions.find(s => s.id === editSessionId);
                      const remaining = currentSession ? currentSession.capacity - currentSession.bookedCount : 0;
                      setEditCount(Math.min(remaining, editCount + 1));
                    }}
                    className="px-4 py-2.5 hover:bg-gray-50 transition-colors text-xl font-medium text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                取消
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editSessionId === selectedBooking.sessionId && editCount === selectedBooking.count}
              >
                保存修改
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
