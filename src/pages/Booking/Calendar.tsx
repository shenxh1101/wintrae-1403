import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, Ticket, ChevronRight, Info } from 'lucide-react';
import { Calendar } from '@/components/features/Calendar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { exhibitionService } from '@/services/exhibitionService';
import { formatDate } from '@/utils/date';
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

                  return (
                    <button
                      key={session.id}
                      onClick={() => !isFull && setSelectedSession(session)}
                      disabled={isFull}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                        isSelected
                          ? 'border-primary-900 bg-primary-50'
                          : isFull
                          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                          : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                      )}
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
    </div>
  );
};
