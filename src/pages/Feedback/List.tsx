import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Palette,
  Leaf,
  ChevronDown,
  ChevronUp,
  Image,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  StickyNote,
  Save,
} from 'lucide-react';
import { StarRating } from '@/components/features/StarRating';
import { StatsCard } from '@/components/features/StatsCard';
import { Button } from '@/components/ui/Button';
import { feedbackService } from '@/services/feedbackService';
import { exhibitionService } from '@/services/exhibitionService';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import type { FeedbackWithDetails, Feedback } from '@/types';

export const FeedbackListPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithDetails[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [popularExhibits, setPopularExhibits] = useState<any[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeExhibition, setActiveExhibition] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Feedback['handleStatus']>('all');
  const [statusStats, setStatusStats] = useState({ pending: 0, processing: 0, closed: 0 });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    loadData();
  }, [activeExhibition, statusFilter]);

  const loadData = () => {
    const allFeedbacks = feedbackService.getWithDetails(activeExhibition);
    const filtered = statusFilter === 'all'
      ? allFeedbacks
      : allFeedbacks.filter(f => f.handleStatus === statusFilter);

    setFeedbacks(filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setStats(feedbackService.getStats(activeExhibition));
    setPopularExhibits(feedbackService.getPopularExhibits(activeExhibition));
    setRatingDistribution(feedbackService.getRatingDistribution(activeExhibition));
    setStatusStats(feedbackService.getStatusStats(activeExhibition));
  };

  const handleStatusChange = (id: string, newStatus: Feedback['handleStatus']) => {
    feedbackService.updateStatus(id, newStatus);
    loadData();
  };

  const handleStartEditNote = (feedback: FeedbackWithDetails) => {
    setEditingNoteId(feedback.id);
    setEditNote(feedback.internalNote || '');
  };

  const handleSaveNote = (id: string) => {
    feedbackService.updateInternalNote(id, editNote);
    setEditingNoteId(null);
    setEditNote('');
    loadData();
  };

  const exhibitions = exhibitionService.getAll();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getOverallRating = (feedback: FeedbackWithDetails) => {
    return (feedback.ratingContent + feedback.ratingGuide + feedback.ratingEnvironment) / 3;
  };

  const getExhibitNames = (exhibitIds: string[]) => {
    const allExhibits = exhibitionService.getAll().flatMap(e =>
      exhibitionService.getExhibits(e.id)
    );
    return exhibitIds
      .map(id => allExhibits.find(e => e.id === id)?.name)
      .filter(Boolean);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...ratingDistribution.map(d => d.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">反馈管理</h1>
          <p className="text-gray-500 text-sm">查看和分析观众反馈数据</p>
        </div>
        <div className="w-full sm:w-auto">
          <select
            className="input-field"
            value={activeExhibition}
            onChange={(e) => {
              setActiveExhibition(e.target.value);
              setTimeout(loadData, 0);
            }}
          >
            <option value="all">全部展览</option>
            {exhibitions.map((exhibition) => (
              <option key={exhibition.id} value={exhibition.id}>
                {exhibition.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="总反馈数"
          value={stats.total}
          subtitle="累计收到反馈"
          icon={<MessageSquare className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="展览内容"
          value={stats.avgContent.toFixed(1)}
          subtitle="平均评分"
          icon={<Palette className="w-5 h-5" />}
          color="gold"
        />
        <StatsCard
          title="导览服务"
          value={stats.avgGuide.toFixed(1)}
          subtitle="平均评分"
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="场馆环境"
          value={stats.avgEnvironment.toFixed(1)}
          subtitle="平均评分"
          icon={<Leaf className="w-5 h-5" />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-title mb-4">综合评分</h3>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-900 mb-2">
                {stats.avgOverall.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-5 h-5',
                      star <= Math.round(stats.avgOverall)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200'
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">基于 {stats.total} 条评价</p>
            </div>

            <div className="flex-1 space-y-3">
              {ratingDistribution.map((item) => (
                <div key={item.rating} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-12">{item.rating} 星</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">热门展品</h3>
          <div className="space-y-4">
            {popularExhibits.slice(0, 5).length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无数据</p>
            ) : (
              popularExhibits.slice(0, 5).map((item, index) => (
                <div key={item.exhibit?.id || index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.exhibit?.image ? (
                      <img
                        src={item.exhibit.image}
                        alt={item.exhibit.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.exhibit?.name}
                    </p>
                    <p className="text-xs text-gray-500">{item.count} 人感兴趣</p>
                  </div>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-600">{index + 1}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'p-4 rounded-xl border-2 text-left transition-all',
            statusFilter === 'all'
              ? 'border-primary-900 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <p className="text-2xl font-bold text-primary-900">{statusStats.pending + statusStats.processing + statusStats.closed}</p>
          <p className="text-sm text-gray-500">全部反馈</p>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={cn(
            'p-4 rounded-xl border-2 text-left transition-all',
            statusFilter === 'pending'
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <p className="text-2xl font-bold text-amber-600">{statusStats.pending}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 待处理
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('processing')}
          className={cn(
            'p-4 rounded-xl border-2 text-left transition-all',
            statusFilter === 'processing'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <p className="text-2xl font-bold text-blue-600">{statusStats.processing}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> 已跟进
          </p>
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">反馈列表</h3>
          <select
            className="input-field !w-auto !py-1.5 !text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">已跟进</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">暂无反馈数据</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((feedback) => {
              const overallRating = getOverallRating(feedback);
              const isExpanded = expandedId === feedback.id;
              const exhibitNames = getExhibitNames(feedback.interestedExhibits);

              return (
                <div
                  key={feedback.id}
                  className="border border-gray-200 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(feedback.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-primary-600">
                            {feedback.booking?.visitorName?.charAt(0) || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-800">
                              {feedback.booking?.visitorName || '匿名用户'}
                            </h4>
                            <StarRating value={Math.round(overallRating)} readOnly size="sm" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(feedback.createdAt, 'MM-dd HH:mm')}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm text-gray-500">
                            {feedback.exhibition?.title || '未知展览'}
                          </p>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-medium',
                            feedback.handleStatus === 'pending' && 'bg-amber-100 text-amber-700',
                            feedback.handleStatus === 'processing' && 'bg-blue-100 text-blue-700',
                            feedback.handleStatus === 'closed' && 'bg-green-100 text-green-700',
                          )}>
                            {feedback.handleStatus === 'pending' && '待处理'}
                            {feedback.handleStatus === 'processing' && '已跟进'}
                            {feedback.handleStatus === 'closed' && '已关闭'}
                          </span>
                        </div>
                        {feedback.comment && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {feedback.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                        <div className="bg-white rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Palette className="w-4 h-4 text-primary-600" />
                            <span className="text-sm text-gray-600">展览内容</span>
                          </div>
                          <StarRating value={feedback.ratingContent} readOnly size="sm" />
                        </div>
                        <div className="bg-white rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-primary-600" />
                            <span className="text-sm text-gray-600">导览服务</span>
                          </div>
                          <StarRating value={feedback.ratingGuide} readOnly size="sm" />
                        </div>
                        <div className="bg-white rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Leaf className="w-4 h-4 text-primary-600" />
                            <span className="text-sm text-gray-600">场馆环境</span>
                          </div>
                          <StarRating value={feedback.ratingEnvironment} readOnly size="sm" />
                        </div>
                      </div>

                      {exhibitNames.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">感兴趣的展品：</p>
                          <div className="flex flex-wrap gap-2">
                            {exhibitNames.map((name, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {feedback.comment && (
                        <div className="mt-4 bg-white rounded-xl p-4">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {feedback.comment}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">处理状态</p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(feedback.id, 'pending'); }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                                feedback.handleStatus === 'pending'
                                  ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              )}
                            >
                              <Clock className="w-3.5 h-3.5" /> 待处理
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(feedback.id, 'processing'); }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                                feedback.handleStatus === 'processing'
                                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              )}
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> 已跟进
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(feedback.id, 'closed'); }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                                feedback.handleStatus === 'closed'
                                  ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              )}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> 已关闭
                            </button>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              <StickyNote className="w-4 h-4 text-primary-600" /> 内部备注
                            </p>
                            {editingNoteId !== feedback.id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStartEditNote(feedback); }}
                                className="text-xs text-primary-600 hover:text-primary-700"
                              >
                                编辑
                              </button>
                            )}
                          </div>
                          {editingNoteId === feedback.id ? (
                            <div className="space-y-2">
                              <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                                rows={3}
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="输入内部备注..."
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingNoteId(null); }}
                                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSaveNote(feedback.id); }}
                                  className="px-3 py-1.5 text-xs bg-primary-900 text-white rounded-lg hover:bg-primary-800 flex items-center gap-1"
                                >
                                  <Save className="w-3.5 h-3.5" /> 保存
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 min-h-[60px]">
                              {feedback.internalNote || (
                                <span className="text-gray-400 italic">暂无备注</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
