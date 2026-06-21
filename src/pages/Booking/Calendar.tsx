import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, Ticket, ChevronRight, Info, ListPlus, User, Phone, CheckCircle } from 'lucide-react';
import { Calendar } from '@/components/features/Calendar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { exhibitionService } from '@/services/exhibitionService';
import { waitlistService } from '@/services/waitlistService';
import { formatDate } from '@/utils/date';
import { validatePhone, getNameError } from '@/utils/validation';
import { cn } from '@/lib/utils';
import type { Exhibition, Session } from '@/types';

export const BookingCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showExhibitionModal, setShowExhibitionModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSession, setWaitlistSession] = useState<Session | null>(null);
  const [waitlistForm, setWaitlistForm] = useState({ name: '', phone: '', count: 1 });
  const [waitlistSuccess, setWaitlistSuccess] = useState<{ position: number; total: number } | null>(null);
  const [waitlistErrors, setWaitlistErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const activeExhibitions = exhibitionService.getAll().filter(e => e.status === 'active');
    setExhibitions(activeExhibitions);
    if (activeExhibitions.length > 0) {
      setSelectedExhibition(activeExhibitions[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedExhibition && selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const exhibitionSessions = exhibitionService.getSessionsByDate(selectedExhibition.id, dateStr);
      setSessions(exhibitionSessions);
    } else {
      setSessions([]);
    }
    setSelectedSession(null);
  }, [selectedExhibition, selectedDate]);

  const getHighlightedDates = () => {
    if (!selectedExhibition) return [];

    const allSessions = exhibitionService.getSessions(selectedExhibition.id);
    const dateMap = new Map<string, { status: 'available' | 'limited' | 'full'; count: number }>();

    allSessions.forEach(session => {
      const remaining = session.capacity - session.bookedCount;
      const existing = dateMap.get(session.date) || { status: 'full', count: 0 };

      let status: 'available' | 'limited' | 'full' = existing.status;
      if (remaining > 10) status = 'available';
      else if (remaining > 0) status = 'limited';
      else if (existing.status === 'available') status = existing.status;

      dateMap.set(session.date, { status, count: existing.count + remaining });
    });

    return Array.from(dateMap.entries()).map(([date, info]) => ({
      date: parseISO(date),
      status: info.status,
      count: info.count,
    }));
  };

  const handleSelectExhibition = (exhibition: Exhibition) => {
    setSelectedExhibition(exhibition);
    setSelectedDate(null);
    setSelectedSession(null);
    setShowExhibitionModal(false);
  };

  const handleNext = () => {
    if (selectedExhibition && selectedSession && selectedDate) {
      navigate('/booking/form', {
        state: {
          exhibition: selectedExhibition,
          session: selectedSession,
          date: selectedDate.toISOString(),
        },
      });
    }
  };

  const handleOpenWaitlist = (session: Session) => {
    setWaitlistSession(session);
    setWaitlistForm({ name: '', phone: '', count: 1 });
    setWaitlistSuccess(null);
    setWaitlistErrors({});
    setShowWaitlistModal(true);
  };

  const validateWaitlistForm = (): boolean => {
    const errors: Record<string, string> = {};
    const nameError = getNameError(waitlistForm.name);
    if (nameError) errors.name = nameError;
    if (!validatePhone(waitlistForm.phone)) errors.phone = '请输入正确的手机号';
    if (waitlistForm.count <= 0) errors.count = '人数必须大于0';
    setWaitlistErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWaitlistSubmit = () => {
    if (!validateWaitlistForm() || !waitlistSession) return;

    const result = waitlistService.create({
      sessionId: waitlistSession.id,
      visitorName: waitlistForm.name,
      phone: waitlistForm.phone,
      count: waitlistForm.count,
    });

    if (result) {
      const position = waitlistService.getPosition(result.id);
      const total = waitlistService.getWaitlistCount(waitlistSession.id);
      setWaitlistSuccess({ position, total });
    }
  };

  const handleCloseWaitlist = () => {
    setShowWaitlistModal(false);
    setWaitlistSession(null);
    setWaitlistSuccess(null);
  };

  const getRemainingPercentage = (session: Session) => {
    return ((session.capacity - session.bookedCount) / session.capacity) * 100;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">在线预约</h1>
        <p className="text-gray-500 text-sm">选择展览、日期和场次进行预约</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">选择展览</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowExhibitionModal(true)}>
                切换展览
              </Button>
            </div>

            {selectedExhibition ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-48 h-32 shrink-0 rounded-xl overflow-hidden">
                  <img
                    src={selectedExhibition.coverImage}
                    alt={selectedExhibition.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-lg font-semibold text-primary-900 mb-2">
                    {selectedExhibition.title}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {selectedExhibition.description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {formatDate(selectedExhibition.startDate)} - {formatDate(selectedExhibition.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                请选择一个展览
              </div>
            )}
          </div>

          {selectedExhibition && (
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              minDate={startOfDay(new Date())}
              maxDate={parseISO(selectedExhibition.endDate)}
              highlightedDates={getHighlightedDates()}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="section-title">选择场次</h3>

            {!selectedDate ? (
              <div className="text-center py-8 text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>请先选择日期</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>该日期暂无场次安排</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {sessions.map((session) => {
                  const remaining = session.capacity - session.bookedCount;
                  const isFull = remaining <= 0;
                  const isSelected = selectedSession?.id === session.id;
                  const percentage = getRemainingPercentage(session);

                  const waitlistCount = waitlistService.getWaitlistCount(session.id);
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        'rounded-xl border-2 transition-all duration-200 overflow-hidden',
                        isSelected
                          ? 'border-primary-900 bg-primary-50'
                          : isFull
                          ? 'border-gray-100 bg-gray-50'
                          : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                      )}
                    >
                      <button
                        onClick={() => !isFull && setSelectedSession(session)}
                        disabled={isFull}
                        className={cn('w-full p-4 text-left', isFull && 'cursor-default')}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-primary-900">
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                          {isFull ? (
                            <span className="badge bg-red-100 text-red-600">已满</span>
                          ) : remaining <= 10 ? (
                            <span className="badge bg-amber-100 text-amber-600">即将满员</span>
                          ) : (
                            <span className="badge bg-green-100 text-green-600">可预约</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            剩余 {remaining} / {session.capacity} 人
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              percentage > 30 ? 'bg-accent-teal' : percentage > 10 ? 'bg-amber-400' : 'bg-red-400'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                      {isFull && (
                        <button
                          onClick={() => handleOpenWaitlist(session)}
                          className="w-full py-2.5 border-t border-gray-200 text-sm text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ListPlus className="w-4 h-4" />
                          候补排队
                          {waitlistCount > 0 && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                              {waitlistCount}人
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedSession && (
            <Button fullWidth size="lg" onClick={handleNext}>
              下一步：填写信息
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showExhibitionModal}
        onClose={() => setShowExhibitionModal(false)}
        title="选择展览"
        size="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin pr-2">
          {exhibitions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无开放的展览</p>
          ) : (
            exhibitions.map((exhibition) => (
              <button
                key={exhibition.id}
                onClick={() => handleSelectExhibition(exhibition)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex gap-4',
                  selectedExhibition?.id === exhibition.id
                    ? 'border-primary-900 bg-primary-50'
                    : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                )}
              >
                <div className="w-24 h-20 shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={exhibition.coverImage}
                    alt={exhibition.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-semibold text-primary-900">{exhibition.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{exhibition.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showWaitlistModal}
        onClose={handleCloseWaitlist}
        title="候补登记"
        size="md"
      >
        {waitlistSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-primary-900 mb-2">
              候补登记成功
            </h3>
            <p className="text-gray-600 mb-4">
              您的排队位置：
              <span className="font-bold text-primary-600 text-lg">
                第 {waitlistSuccess.position} 位
              </span>
              <span className="text-gray-400"> / 共 {waitlistSuccess.total} 人</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              有人取消预约时会自动顺延，请注意接听电话通知
            </p>
            <Button onClick={handleCloseWaitlist}>
              知道了
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {waitlistSession && (
              <div className="p-4 bg-primary-50/50 rounded-xl">
                <p className="font-medium text-primary-900 mb-1">
                  {selectedExhibition?.title}
                </p>
                <p className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatDate(waitlistSession.date)} {waitlistSession.startTime}-{waitlistSession.endTime}
                </p>
              </div>
            )}

            <div>
              <label className="label">姓名 *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className={cn('input-field pl-10', waitlistErrors.name && 'input-error')}
                  value={waitlistForm.name}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, name: e.target.value })}
                  placeholder="请输入您的姓名"
                />
              </div>
              {waitlistErrors.name && (
                <p className="text-red-500 text-sm mt-1">{waitlistErrors.name}</p>
              )}
            </div>

            <div>
              <label className="label">手机号 *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  className={cn('input-field pl-10', waitlistErrors.phone && 'input-error')}
                  value={waitlistForm.phone}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, phone: e.target.value })}
                  placeholder="请输入手机号"
                  maxLength={11}
                />
              </div>
              {waitlistErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{waitlistErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="label">候补人数 *</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setWaitlistForm({ ...waitlistForm, count: Math.max(1, waitlistForm.count - 1) })}
                    className="px-4 py-2.5 hover:bg-gray-50 transition-colors text-xl font-medium text-gray-600"
                  >
                    −
                  </button>
                  <span className="px-6 py-2.5 text-lg font-semibold text-primary-900 min-w-[60px] text-center">
                    {waitlistForm.count}
                  </span>
                  <button
                    type="button"
                    onClick={() => setWaitlistForm({ ...waitlistForm, count: waitlistForm.count + 1 })}
                    className="px-4 py-2.5 hover:bg-gray-50 transition-colors text-xl font-medium text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="ghost" fullWidth onClick={handleCloseWaitlist}>
                取消
              </Button>
              <Button fullWidth onClick={handleWaitlistSubmit}>
                确认候补
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
