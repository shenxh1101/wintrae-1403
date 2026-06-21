import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Ticket, User, Phone, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QRCodeDisplay } from '@/components/features/QRCodeDisplay';
import { bookingService } from '@/services/bookingService';
import { formatDate } from '@/utils/date';

export const BookingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = React.useState<any>(null);

  React.useEffect(() => {
    if (id) {
      const bookingData = bookingService.getWithDetails(id);
      setBooking(bookingData);
    }
  }, [id]);

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="page-title mb-2">预约成功！</h1>
        <p className="text-gray-500">请保存好预约码，入场时出示核验</p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex justify-center mb-6">
          <QRCodeDisplay code={booking.code} size={180} />
        </div>

        <div className="divider" />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary-50/50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span>预约人</span>
              </div>
              <p className="font-medium text-primary-900">{booking.visitorName}</p>
            </div>
            <div className="p-4 bg-primary-50/50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Phone className="w-4 h-4" />
                <span>手机号</span>
              </div>
              <p className="font-medium text-primary-900">
                {booking.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-accent-gold/10 to-accent-gold/5 rounded-xl">
            <h4 className="font-serif font-semibold text-lg text-primary-900 mb-3">
              {booking.exhibition?.title}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">
                  {booking.session ? formatDate(booking.session.date) : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">
                  {booking.session ? `${booking.session.startTime} - ${booking.session.endTime}` : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">
                  {booking.ticketType?.name || '-'} × {booking.count}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-accent-gold-dark font-medium">
                  ¥{booking.ticketType ? booking.ticketType.price * booking.count : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate('/booking/my')}
        >
          查看我的预约
        </Button>
        <Button
          fullWidth
          onClick={() => navigate('/booking')}
        >
          继续预约
        </Button>
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <h4 className="font-medium text-amber-800 mb-2">温馨提示</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• 请在预约时间前15分钟到达场馆，配合工作人员核验入场</li>
          <li>• 如需取消预约，请至少提前1小时操作</li>
          <li>• 迟到15分钟以上，预约可能失效</li>
        </ul>
      </div>
    </div>
  );
};
