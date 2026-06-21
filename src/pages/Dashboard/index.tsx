import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  Ticket,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Download,
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { StatsCard } from '@/components/features/StatsCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { bookingService } from '@/services/bookingService';
import { exhibitionService } from '@/services/exhibitionService';
import { announcementService } from '@/services/announcementService';
import { exportBookingsToExcel, exportBookingsToCSV } from '@/utils/export';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { BookingWithDetails, Announcement } from '@/types';

export const DashboardPage: React.FC = () => {
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [bookingTrend, setBookingTrend] = useState<any[]>([]);
  const [timeSlotStats, setTimeSlotStats] = useState<any[]>([]);
  const [lowTicketAlerts, setLowTicketAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [activeExhibition, setActiveExhibition] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [trendDays]);

  const loadData = () => {
    setBookingTrend(bookingService.getBookingTrend(trendDays));
    setTimeSlotStats(bookingService.getTimeSlotStats());
    setLowTicketAlerts(bookingService.getLowTicketAlerts(10));
    setStats(bookingService.getStats());
    setAnnouncements(announcementService.getActive());
  };

  const handleCreateAnnouncement = () => {
    if (newAnnouncement.title && newAnnouncement.content) {
      announcementService.create({
        ...newAnnouncement,
        isActive: true,
      });
      setNewAnnouncement({ title: '', content: '' });
      setShowAnnouncementModal(false);
      loadData();
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    announcementService.delete(id);
    loadData();
  };

  const handleExport = (format: 'excel' | 'csv') => {
    const allBookings = bookingService.getAll();
    const bookingsWithDetails: BookingWithDetails[] = allBookings.map(b =>
      bookingService.getWithDetails(b.id)!
    );

    let filtered = bookingsWithDetails;
    if (activeExhibition !== 'all') {
      filtered = bookingsWithDetails.filter(b => b.exhibition?.id === activeExhibition);
    }

    const filename = `预约名单_${formatDate(new Date(), 'yyyyMMdd')}`;
    if (format === 'excel') {
      exportBookingsToExcel(filtered, `${filename}.xlsx`);
    } else {
      exportBookingsToCSV(filtered, `${filename}.csv`);
    }
    setShowExportModal(false);
  };

  const exhibitions = exhibitionService.getAll().filter(e => e.status === 'active');

  if (!stats) return <div className="flex items-center justify-center h-64">加载中...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">数据概览</h1>
          <p className="text-gray-500 text-sm">实时查看展览运营数据和预约情况</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            导出名单
          </Button>
          <Button onClick={() => setShowAnnouncementModal(true)}>
            <Megaphone className="w-4 h-4 mr-2" />
            发布公告
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="总预约数"
          value={stats.totalBookings}
          subtitle="累计预约记录"
          trend={12}
          icon={<Ticket className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="今日预约"
          value={stats.todayBookings}
          subtitle="当日待参观人数"
          trend={8}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="已核验"
          value={stats.checkedIn}
          subtitle="累计入场人数"
          trend={15}
          icon={<CheckCircle className="w-5 h-5" />}
          color="gold"
        />
        <StatsCard
          title="到场率"
          value={`${stats.attendanceRate}%`}
          subtitle="已核验 / 已预约"
          trend={-3}
          icon={<TrendingUp className="w-5 h-5" />}
          color={stats.attendanceRate >= 80 ? 'green' : stats.attendanceRate >= 60 ? 'gold' : 'red'}
        />
      </div>

      {lowTicketAlerts.length > 0 && (
        <div className="card p-5 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-amber-800">余票预警</h3>
              <p className="text-sm text-amber-600">以下场次剩余票数不足10张</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowTicketAlerts.slice(0, 6).map((alert, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{alert.exhibition.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(alert.session.date)} {alert.session.startTime}
                  </p>
                </div>
                <div className="ml-3">
                  <span className={cn(
                    'px-2 py-1 rounded-lg text-xs font-bold',
                    alert.remaining <= 5 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  )}>
                    余{alert.remaining}张
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">预约趋势</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {([7, 30] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setTrendDays(days)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                    trendDays === days
                      ? 'bg-white text-primary-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  近{days}天
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="预约数"
                  stroke="#1E3A5F"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">热门时段</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSlotStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis dataKey="time" type="category" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="count" name="入场人数" fill="#5B8C5A" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">最新公告</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAnnouncementModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              发布
            </Button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
            {announcements.length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无公告</p>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 bg-gradient-to-r from-primary-50/50 to-transparent rounded-xl border border-primary-100/50 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-primary-900">{announcement.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(announcement.createdAt, 'MM-dd HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">实时场次热度</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
            {timeSlotStats.map((slot, index) => {
              const maxCount = Math.max(...timeSlotStats.map(s => s.count), 1);
              const percentage = (slot.count / maxCount) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{slot.time}</span>
                    </div>
                    <span className="font-medium text-primary-900">{slot.count}人</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        title="发布公告"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="label">公告标题</label>
            <input
              type="text"
              className="input-field"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              placeholder="请输入公告标题"
            />
          </div>
          <div>
            <label className="label">公告内容</label>
            <textarea
              className="input-field min-h-[120px] resize-none"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              placeholder="请输入公告内容"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setShowAnnouncementModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreateAnnouncement}
              disabled={!newAnnouncement.title || !newAnnouncement.content}
            >
              发布
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出预约名单"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">选择展览</label>
            <select
              className="input-field"
              value={activeExhibition}
              onChange={(e) => setActiveExhibition(e.target.value)}
            >
              <option value="all">全部展览</option>
              {exhibitions.map((exhibition) => (
                <option key={exhibition.id} value={exhibition.id}>
                  {exhibition.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 pt-2">
            <Button fullWidth variant="secondary" onClick={() => handleExport('excel')}>
              <Download className="w-4 h-4 mr-2" />
              导出 Excel (.xlsx)
            </Button>
            <Button fullWidth variant="secondary" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              导出 CSV (.csv)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
