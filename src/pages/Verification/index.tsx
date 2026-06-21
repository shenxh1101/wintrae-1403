import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  User,
  Phone,
  Ticket,
  ChevronRight,
  Download,
  Filter,
  Calendar,
} from 'lucide-react';
import { Scanner } from '@/components/features/Scanner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { verificationService } from '@/services/verificationService';
import { bookingService } from '@/services/bookingService';
import { exhibitionService } from '@/services/exhibitionService';
import { exportToExcel } from '@/utils/export';
import { cn } from '@/lib/utils';
import { formatDate, formatTime, isTodayDate } from '@/utils/date';
import type { VerificationWithDetails, BookingWithDetails, Exhibition, Session } from '@/types';

type TabType = 'scan' | 'manual' | 'group';
type StatusGroup = 'all' | 'checked' | 'late' | 'notArrived' | 'cancelled';

export const VerificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [searchCode, setSearchCode] = useState('');
  const [groupCodes, setGroupCodes] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    booking?: BookingWithDetails;
    isLate?: boolean;
  } | null>(null);
  const [todayVerifications, setTodayVerifications] = useState<VerificationWithDetails[]>([]);
  const [todayStats, setTodayStats] = useState({ total: 0, success: 0, late: 0, failed: 0 });
  const [showResultModal, setShowResultModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [filterExhibition, setFilterExhibition] = useState<string>('all');
  const [filterSession, setFilterSession] = useState<string>('all');
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const exhibitions = exhibitionService.getAll();

  const todaySessions = useMemo(() => {
    if (filterExhibition === 'all') return [];
    return exhibitionService.getSessions(filterExhibition).filter(s => isTodayDate(s.date));
  }, [filterExhibition]);

  const todayBookings = useMemo(() => {
    const allBookings = bookingService.getAllWithDetails();
    const todayOnly = allBookings.filter(b => {
      if (b.status === 'cancelled') {
        return b.session && isTodayDate(b.session.date);
      }
      return b.session && isTodayDate(b.session.date) && b.status === 'confirmed';
    });
    return todayOnly;
  }, [refreshKey]);

  const filteredBookings = useMemo(() => {
    let result = todayBookings;

    if (filterExhibition !== 'all') {
      result = result.filter(b => b.exhibition?.id === filterExhibition);
    }

    if (filterSession !== 'all') {
      result = result.filter(b => b.sessionId === filterSession);
    }

    switch (statusGroup) {
      case 'checked':
        result = result.filter(b => {
          const v = verificationService.getByBookingId(b.id);
          return v && v.status !== 'failed';
        });
        break;
      case 'late':
        result = result.filter(b => {
          const v = verificationService.getByBookingId(b.id);
          return v && v.status === 'late';
        });
        break;
      case 'notArrived':
        result = result.filter(b => {
          const v = verificationService.getByBookingId(b.id);
          return !v && b.status === 'confirmed';
        });
        break;
      case 'cancelled':
        result = result.filter(b => b.status === 'cancelled');
        break;
    }

    return result.sort((a, b) => {
      const timeA = a.session?.startTime || '';
      const timeB = b.session?.startTime || '';
      return timeA.localeCompare(timeB);
    });
  }, [todayBookings, filterExhibition, filterSession, statusGroup]);

  const groupStats = useMemo(() => {
    const checked = filteredBookings.filter(b => {
      const v = verificationService.getByBookingId(b.id);
      return v && v.status !== 'failed';
    }).length;
    const late = filteredBookings.filter(b => {
      const v = verificationService.getByBookingId(b.id);
      return v && v.status === 'late';
    }).length;
    const notArrived = filteredBookings.filter(b => {
      const v = verificationService.getByBookingId(b.id);
      return !v && b.status === 'confirmed';
    }).length;
    const cancelled = filteredBookings.filter(b => b.status === 'cancelled').length;

    return { total: filteredBookings.length, checked, late, notArrived, cancelled };
  }, [filteredBookings]);

  const loadData = () => {
    setTodayVerifications(verificationService.getTodayWithDetails());
    setTodayStats(verificationService.getTodayStats());
  };

  const handleExport = () => {
    const data = filteredBookings.map(booking => {
      const verification = verificationService.getByBookingId(booking.id);
      let status = '未到';
      let checkInTime = '-';
      if (verification) {
        if (verification.status === 'success') status = '已入场';
        else if (verification.status === 'late') status = '迟到';
        else status = '核验失败';
        checkInTime = formatTime(verification.checkInTime);
      } else if (booking.status === 'cancelled') {
        status = '已取消';
      }
      return {
        '预约码': booking.code,
        '姓名': booking.visitorName,
        '手机': booking.phone,
        '展览': booking.exhibition?.title || '-',
        '场次': `${booking.session?.startTime || '-'}-${booking.session?.endTime || '-'}`,
        '票种': booking.ticketType?.name || '-',
        '人数': booking.count,
        '状态': status,
        '入场时间': checkInTime,
      };
    });
    exportToExcel(data, `入场名单_${formatDate(new Date(), 'yyyyMMdd')}`);
  };

  const handleScan = (code: string) => {
    const result = verificationService.verifyBooking(code);
    setVerificationResult(result);
    setShowResultModal(true);
  };

  const handleManualSearch = () => {
    setSearchError('');

    if (!searchCode.trim()) {
      setSearchError('请输入预约码或手机号');
      return;
    }

    let booking: BookingWithDetails | undefined;

    if (/^1[3-9]\d{9}$/.test(searchCode.trim())) {
      const bookings = bookingService.getByPhone(searchCode.trim());
      if (bookings.length > 0) {
        const latestBooking = bookings.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        booking = bookingService.getWithDetails(latestBooking.id);
      }
    } else {
      const result = verificationService.verifyBooking(searchCode.trim());
      setVerificationResult(result);
      setShowResultModal(true);
      setSearchCode('');
      return;
    }

    if (!booking) {
      setSearchError('未找到相关预约记录');
      return;
    }

    const result = verificationService.verifyBooking(booking.code);
    setVerificationResult(result);
    setShowResultModal(true);
    setSearchCode('');
  };

  const handleGroupCheckIn = () => {
    const codes = groupCodes
      .split(/[\n,，\s]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (codes.length === 0) {
      setSearchError('请输入至少一个预约码');
      return;
    }

    const result = verificationService.batchCheckIn(codes);
    setVerificationResult({
      success: result.success.length > 0,
      message: `成功核验 ${result.success.length} 人，失败 ${result.failed.length} 人`,
    });
    setShowResultModal(true);
    loadData();
    setRefreshKey(k => k + 1);
    setGroupCodes('');
  };

  const handleConfirmCheckIn = () => {
    if (verificationResult?.success && verificationResult?.booking) {
      verificationService.checkIn(verificationResult.booking.id, verificationResult.isLate || false);
      loadData();
      setRefreshKey(k => k + 1);
    }
    setShowResultModal(false);
    setVerificationResult(null);
    setSearchCode('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'scan' as TabType, label: '扫码核验', icon: QrCode },
    { id: 'manual' as TabType, label: '手动核验', icon: Search },
    { id: 'group' as TabType, label: '团体核验', icon: Users },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">入场核验</h1>
          <p className="text-gray-500 text-sm">扫码或手动输入预约码进行入场核验</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{todayStats.total}</p>
              <p className="text-xs text-gray-500">今日核验</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{todayStats.success}</p>
              <p className="text-xs text-gray-500">成功入场</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{todayStats.late}</p>
              <p className="text-xs text-gray-500">迟到</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{todayStats.failed}</p>
              <p className="text-xs text-gray-500">核验失败</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-white text-primary-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab === 'scan' && (
              <div className="space-y-4">
                <Scanner
                  onScan={handleScan}
                  onError={(error) => {
                    setVerificationResult({ success: false, message: error });
                    setShowResultModal(true);
                  }}
                />
                <p className="text-center text-sm text-gray-500">
                  将预约二维码对准扫描框即可自动核验
                </p>
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="label">预约码 / 手机号</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      className="input-field pl-10"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                      placeholder="请输入预约码或手机号"
                    />
                  </div>
                  {searchError && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {searchError}
                    </p>
                  )}
                </div>
                <Button fullWidth onClick={handleManualSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  核验入场
                </Button>
                <p className="text-center text-sm text-gray-500">
                  支持输入预约码（如 EXH-XXXXXXXX-MMDD）或手机号查询
                </p>
              </div>
            )}

            {activeTab === 'group' && (
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="label">批量预约码</label>
                  <textarea
                    className="input-field min-h-[160px] resize-none"
                    value={groupCodes}
                    onChange={(e) => setGroupCodes(e.target.value)}
                    placeholder="请输入预约码，支持换行、逗号、空格分隔&#10;例如：&#10;EXH-ABC12345-0101&#10;EXH-DEF67890-0101"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    已输入 {groupCodes.split(/[\n,，\s]+/).filter(c => c.trim()).length} 个预约码
                  </p>
                </div>
                <Button fullWidth onClick={handleGroupCheckIn}>
                  <Users className="w-4 h-4 mr-2" />
                  批量核验入场
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">今日预约名单</h3>
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" /> 导出
              </Button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">选择展览</label>
                <select
                  className="input-field !py-2 !text-sm"
                  value={filterExhibition}
                  onChange={(e) => {
                    setFilterExhibition(e.target.value);
                    setFilterSession('all');
                  }}
                >
                  <option value="all">全部展览</option>
                  {exhibitions.map((exh) => (
                    <option key={exh.id} value={exh.id}>
                      {exh.title}
                    </option>
                  ))}
                </select>
              </div>

              {filterExhibition !== 'all' && todaySessions.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">选择场次</label>
                  <select
                    className="input-field !py-2 !text-sm"
                    value={filterSession}
                    onChange={(e) => setFilterSession(e.target.value)}
                  >
                    <option value="all">全部场次</option>
                    {todaySessions.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.startTime}-{s.endTime}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => setStatusGroup('all')}
                className={cn(
                  'p-2 rounded-lg text-xs text-center transition-all',
                  statusGroup === 'all'
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <p className="text-lg font-bold">{groupStats.total}</p>
                <p className="text-[10px] opacity-80">全部</p>
              </button>
              <button
                onClick={() => setStatusGroup('checked')}
                className={cn(
                  'p-2 rounded-lg text-xs text-center transition-all',
                  statusGroup === 'checked'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <p className="text-lg font-bold text-green-600">{groupStats.checked}</p>
                <p className="text-[10px] opacity-80">已到</p>
              </button>
              <button
                onClick={() => setStatusGroup('notArrived')}
                className={cn(
                  'p-2 rounded-lg text-xs text-center transition-all',
                  statusGroup === 'notArrived'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <p className="text-lg font-bold text-amber-600">{groupStats.notArrived}</p>
                <p className="text-[10px] opacity-80">未到</p>
              </button>
              <button
                onClick={() => setStatusGroup('cancelled')}
                className={cn(
                  'p-2 rounded-lg text-xs text-center transition-all',
                  statusGroup === 'cancelled'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <p className="text-lg font-bold text-gray-500">{groupStats.cancelled}</p>
                <p className="text-[10px] opacity-80">取消</p>
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin">
              {filteredBookings.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无预约记录</p>
              ) : (
                filteredBookings.map((booking) => {
                  const verification = verificationService.getByBookingId(booking.id);
                  let statusText = '未到';
                  let statusColor = 'amber';
                  let StatusIcon = Clock;

                  if (booking.status === 'cancelled') {
                    statusText = '已取消';
                    statusColor = 'gray';
                    StatusIcon = XCircle;
                  } else if (verification) {
                    if (verification.status === 'success') {
                      statusText = '已入场';
                      statusColor = 'green';
                      StatusIcon = CheckCircle;
                    } else if (verification.status === 'late') {
                      statusText = '迟到';
                      statusColor = 'amber';
                      StatusIcon = Clock;
                    } else {
                      statusText = '失败';
                      statusColor = 'red';
                      StatusIcon = XCircle;
                    }
                  }

                  return (
                    <div
                      key={booking.id}
                      className="p-3 bg-gray-50 rounded-xl flex items-center gap-3 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          statusColor === 'green' && 'bg-green-100',
                          statusColor === 'amber' && 'bg-amber-100',
                          statusColor === 'red' && 'bg-red-100',
                          statusColor === 'gray' && 'bg-gray-200',
                        )}
                      >
                        <StatusIcon className={cn(
                          'w-4 h-4',
                          statusColor === 'green' && 'text-green-600',
                          statusColor === 'amber' && 'text-amber-600',
                          statusColor === 'red' && 'text-red-600',
                          statusColor === 'gray' && 'text-gray-500',
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">
                          {booking.visitorName}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="text-gray-400">{booking.session?.startTime}</span>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs',
                              statusColor === 'green' && 'bg-green-100 text-green-700',
                              statusColor === 'amber' && 'bg-amber-100 text-amber-700',
                              statusColor === 'red' && 'bg-red-100 text-red-700',
                              statusColor === 'gray' && 'bg-gray-200 text-gray-600',
                            )}
                          >
                            {statusText}
                          </span>
                          {verification && formatTime(verification.checkInTime)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {booking.count}人
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={verificationResult?.success ? '核验成功' : '核验失败'}
        size="md"
      >
        <div className="text-center py-4">
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
              verificationResult?.success ? 'bg-green-100' : 'bg-red-100'
            )}
          >
            {verificationResult?.success ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>

          <p
            className={cn(
              'text-lg font-medium mb-2',
              verificationResult?.success ? 'text-green-600' : 'text-red-600'
            )}
          >
            {verificationResult?.message}
          </p>

          {verificationResult?.isLate && (
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">已迟到15分钟以上，请提醒观众</span>
            </div>
          )}

          {verificationResult?.booking && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  姓名：<span className="font-medium text-gray-800">{verificationResult.booking.visitorName}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  手机：<span className="font-medium text-gray-800">{verificationResult.booking.phone}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  票种：<span className="font-medium text-gray-800">{verificationResult.booking.ticketType?.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  人数：<span className="font-medium text-gray-800">{verificationResult.booking.count}人</span>
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-primary-900">
                  {verificationResult.booking.exhibition?.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(verificationResult.booking.session?.date || '')} {verificationResult.booking.session?.startTime}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="ghost" fullWidth onClick={() => setShowResultModal(false)}>
              关闭
            </Button>
            {verificationResult?.success && (
              <Button fullWidth onClick={handleConfirmCheckIn}>
                确认入场
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
