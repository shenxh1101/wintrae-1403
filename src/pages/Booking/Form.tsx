import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Users,
  Ticket,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { bookingService } from '@/services/bookingService';
import { exhibitionService } from '@/services/exhibitionService';
import { formatDate } from '@/utils/date';
import { getNameError, getPhoneError, getCountError } from '@/utils/validation';
import { cn } from '@/lib/utils';
import type { Exhibition, Session, TicketType } from '@/types';

export const BookingFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    exhibition: Exhibition;
    session: Session;
    date: string;
  } | null;

  const exhibition = state?.exhibition;
  const session = state?.session;
  const date = state?.date ? new Date(state.date) : null;

  if (!exhibition || !session || !date) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-gray-600 mb-4">请先选择展览和场次</p>
        <Button onClick={() => navigate('/booking')}>
          返回预约
        </Button>
      </div>
    );
  }
  const [formData, setFormData] = useState({
    visitorName: '',
    phone: '',
    count: 1,
    ticketTypeId: '',
  });
  const [errors, setErrors] = useState({
    visitorName: '',
    phone: '',
    count: '',
  });
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const types = exhibitionService.getTicketTypes(exhibition.id);
    setTicketTypes(types);
    if (types.length > 0) {
      setFormData(prev => ({ ...prev, ticketTypeId: types[0].id }));
    }
  }, [exhibition.id]);

  const remaining = exhibitionService.getRemainingTickets(session.id);

  const validateForm = () => {
    const newErrors = {
      visitorName: getNameError(formData.visitorName),
      phone: getPhoneError(formData.phone),
      count: getCountError(formData.count, remaining),
    };
    setErrors(newErrors);
    return !newErrors.visitorName && !newErrors.phone && !newErrors.count;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const booking = bookingService.create({
      sessionId: session.id,
      ticketTypeId: formData.ticketTypeId,
      visitorName: formData.visitorName.trim(),
      phone: formData.phone.trim(),
      count: formData.count,
    });

    setIsSubmitting(false);

    if (booking) {
      navigate(`/booking/success/${booking.id}`, { replace: true });
    } else {
      setErrors(prev => ({
        ...prev,
        count: '预约失败，可能余票不足，请刷新后重试',
      }));
    }
  };

  const handleCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(remaining, formData.count + delta));
    setFormData(prev => ({ ...prev, count: newCount }));
  };

  const selectedTicketType = ticketTypes.find(t => t.id === formData.ticketTypeId);
  const totalPrice = selectedTicketType ? selectedTicketType.price * formData.count : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="page-title mb-0">填写预约信息</h1>
          <p className="text-gray-500 text-sm">请填写参观人员信息</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card p-6 space-y-6">
              <h3 className="section-title">参观人员信息</h3>

              <div>
                <label className="label">
                  <User className="w-4 h-4 inline mr-1" />
                  姓名 *
                </label>
                <input
                  type="text"
                  className={cn('input-field', errors.visitorName && 'input-error')}
                  value={formData.visitorName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, visitorName: e.target.value }));
                    if (errors.visitorName) {
                      setErrors(prev => ({ ...prev, visitorName: getNameError(e.target.value) }));
                    }
                  }}
                  placeholder="请输入您的姓名"
                />
                {errors.visitorName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.visitorName}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  <Phone className="w-4 h-4 inline mr-1" />
                  手机号 *
                </label>
                <input
                  type="tel"
                  className={cn('input-field', errors.phone && 'input-error')}
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, phone: e.target.value }));
                    if (errors.phone) {
                      setErrors(prev => ({ ...prev, phone: getPhoneError(e.target.value) }));
                    }
                  }}
                  placeholder="请输入手机号"
                  maxLength={11}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  <Users className="w-4 h-4 inline mr-1" />
                  参观人数 *
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleCountChange(-1)}
                      className="px-4 py-2.5 hover:bg-gray-50 transition-colors text-xl font-medium text-gray-600"
                      disabled={formData.count <= 1}
                    >
                      −
                    </button>
                    <span className="px-6 py-2.5 text-lg font-semibold text-primary-900 min-w-[60px] text-center">
                      {formData.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCountChange(1)}
                      className="px-4 py-2.5 hover:bg-gray-50 transition-colors text-xl font-medium text-gray-600"
                      disabled={formData.count >= remaining}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    剩余 {remaining} 张
                  </span>
                </div>
                {errors.count && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.count}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  <Ticket className="w-4 h-4 inline mr-1" />
                  票种选择
                </label>
                <div className="space-y-2">
                  {ticketTypes.map((ticket) => (
                    <label
                      key={ticket.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        formData.ticketTypeId === ticket.id
                          ? 'border-primary-900 bg-primary-50'
                          : 'border-gray-100 hover:border-primary-200'
                      )}
                    >
                      <input
                        type="radio"
                        name="ticketType"
                        value={ticket.id}
                        checked={formData.ticketTypeId === ticket.id}
                        onChange={() => setFormData(prev => ({ ...prev, ticketTypeId: ticket.id }))}
                        className="w-4 h-4 text-primary-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary-900">{ticket.name}</span>
                          <span className="font-semibold text-accent-gold-dark">
                            ¥{ticket.price}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{ticket.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={!formData.ticketTypeId}
            >
              确认预约
            </Button>
          </form>
        </div>

        <div>
          <div className="card p-5 sticky top-6">
            <h3 className="section-title">预约信息</h3>

            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden">
                <img
                  src={exhibition.coverImage}
                  alt={exhibition.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h4 className="font-serif font-semibold text-lg text-primary-900">
                {exhibition.title}
              </h4>

              <div className="space-y-3 py-3 border-y border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">{formatDate(date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">{session.startTime} - {session.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ticket className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">{selectedTicketType?.name || '未选择'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">{formData.count} 人</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-600">合计金额</span>
                <span className="font-serif text-2xl font-bold text-accent-gold-dark">
                  ¥{totalPrice}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
