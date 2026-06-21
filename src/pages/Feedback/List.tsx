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
} from 'lucide-react';
import { StarRating } from '@/components/features/StarRating';
import { StatsCard } from '@/components/features/StatsCard';
import { feedbackService } from '@/services/feedbackService';
import { exhibitionService } from '@/services/exhibitionService';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import type { FeedbackWithDetails } from '@/types';

export const FeedbackListPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithDetails[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [popularExhibits, setPopularExhibits] = useState<any[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeExhibition, setActiveExhibition] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allFeedbacks = feedbackService.getWithDetails();
    const filtered = activeExhibition === 'all'
      ? allFeedbacks
      : allFeedbacks.filter(f => f.exhibition?.id === activeExhibition);

    setFeedbacks(filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setStats(feedbackService.getStats());
    setPopularExhibits(feedbackService.getPopularExhibits());
    setRatingDistribution(feedbackService.getRatingDistribution());
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

      <div className="card p-5">
        <h3 className="section-title mb-4">反馈列表</h3>
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
                        <p className="text-sm text-gray-500 mb-2">
                          {feedback.exhibition?.title || '未知展览'}
                        </p>
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
