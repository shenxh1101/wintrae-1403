import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Scanner } from '@/components/features/Scanner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { verificationService } from '@/services/verificationService';
import { bookingService } from '@/services/bookingService';
import { cn } from '@/lib/utils';
import { formatDate, formatTime } from '@/utils/date';
import type { VerificationWithDetails, BookingWithDetails } from '@/types';

type TabType = 'scan' | 'manual' | 'group';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTodayVerifications(verificationService.getTodayWithDetails());
    setTodayStats(verificationService.getTodayStats());
  };

  const handleScan = (code: string) => {
    const result = verificationService.verifyBooking(code);
    setVerificationResult(result);
    setShowResultModal(true);

    if (result.success && result.booking) {
      setTimeout(() => {
        verificationService.checkIn(result.booking!.id, result.isLate || false);
        loadData();
      }, 500);
    }
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
      if (result.success && result.booking) {
        booking = result.booking;
      } else {
        setSearchError(result.message);
        return;
      }
    }

    if (!booking) {
      setSearchError('未找到相关预约记录');
      return;
    }

    const result = verificationService.verifyBooking(booking.code);
    setVerificationResult(result);
    setShowResultModal(true);

    if (result.success) {
      setTimeout(() => {
        verificationService.checkIn(booking!.id, result.isLate || false);
        loadData();
      }, 500);
    }
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
    setGroupCodes('');
  };

  const handleConfirmCheckIn = () => {
    if (verificationResult?.success && verificationResult?.booking) {
      verificationService.checkIn(verificationResult.booking.id, verificationResult.isLate || false);
      loadData();
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
            <h3 className="section-title mb-4">今日核验记录</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
              {todayVerifications.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无核验记录</p>
              ) : (
                todayVerifications.map((verification) => (
                  <div
                    key={verification.id}
                    className="p-3 bg-gray-50 rounded-xl flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        verification.status === 'success'
                          ? 'bg-green-100'
                          : verification.status === 'late'
                          ? 'bg-amber-100'
                          : 'bg-red-100'
                      )}
                    >
                      {verification.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : verification.status === 'late' ? (
                        <Clock className="w-4 h-4 text-amber-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">
                        {verification.booking?.visitorName || '未知'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-xs',
                            verification.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : verification.status === 'late'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {verification.status === 'success'
                            ? '已入场'
                            : verification.status === 'late'
                            ? '迟到'
                            : '失败'}
                        </span>
                        {formatTime(verification.checkInTime)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyCode(verification.booking?.code || '')}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))
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
