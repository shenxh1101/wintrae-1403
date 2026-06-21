import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle,
  Palette,
  Users,
  Leaf,
  Image,
  Search,
  ChevronRight,
  Star,
} from 'lucide-react';
import { StarRating } from '@/components/features/StarRating';
import { Button } from '@/components/ui/Button';
import { feedbackService } from '@/services/feedbackService';
import { bookingService } from '@/services/bookingService';
import { exhibitionService } from '@/services/exhibitionService';
import { cn } from '@/lib/utils';
import type { Exhibit } from '@/types';
interface FeedbackFormData {
  bookingId: string;
  ratingContent: number;
  ratingGuide: number;
  ratingEnvironment: number;
  comment: string;
  interestedExhibits: string[];
}
export const FeedbackSubmitPage: React.FC = () => {
  const [step, setStep] = useState<'query' | 'form' | 'success'>('query');
  const [bookingCode, setBookingCode] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [formData, setFormData] = useState<FeedbackFormData>({
    bookingId: '',
    ratingContent: 0,
    ratingGuide: 0,
    ratingEnvironment: 0,
    comment: '',
    interestedExhibits: [],
  });
  const [searchError, setSearchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSearchBooking = () => {
    setSearchError('');
    if (!bookingCode.trim()) {
      setSearchError('请输入预约码');
      return;
    }
    const foundBooking = bookingService.getByCode(bookingCode.trim());
    if (!foundBooking) {
      setSearchError('未找到相关预约记录');
      return;
    }
    if (foundBooking.status !== 'checked_in') {
      setSearchError('请先完成入场核验后再提交反馈');
      return;
    }
    const existingFeedback = feedbackService.getByBookingId(foundBooking.id);
    if (existingFeedback) {
      setSearchError('该预约已提交过反馈');
      return;
    }
    const bookingWithDetails = bookingService.getWithDetails(foundBooking.id);
    setBooking(bookingWithDetails);
    if (bookingWithDetails?.exhibition?.id) {
      setExhibits(exhibitionService.getExhibits(bookingWithDetails.exhibition.id));
    }
    setFormData({
      ...formData,
      bookingId: foundBooking.id,
    });
    setStep('form');
  };
  const handleExhibitToggle = (exhibitId: string) => {
    setFormData({
      ...formData,
      interestedExhibits: formData.interestedExhibits.includes(exhibitId)
        ? formData.interestedExhibits.filter((id) => id !== exhibitId)
        : [...formData.interestedExhibits, exhibitId],
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ratingContent === 0 || formData.ratingGuide === 0 || formData.ratingEnvironment === 0) {
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      feedbackService.create({
        ...formData,
      });
      setIsSubmitting(false);
      setStep('success');
    }, 800);
  };
  const handleReset = () => {
    setStep('query');
    setBookingCode('');
    setBooking(null);
    setFormData({
      bookingId: '',
      ratingContent: 0,
      ratingGuide: 0,
      ratingEnvironment: 0,
      comment: '',
      interestedExhibits: [],
    });
  };
  const ratingCategories = [
    {
      key: 'ratingContent',
      label: '展览内容',
      icon: Palette,
      description: '展品丰富度、陈列设计、主题呈现',
    },
    {
      key: 'ratingGuide',
      label: '导览服务',
      icon: Users,
      description: '工作人员态度、专业度、讲解质量',
    },
    {
      key: 'ratingEnvironment',
      label: '场馆环境',
      icon: Leaf,
      description: '场馆环境、卫生状况、参观体验',
    },
  ];
  if (step === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary-900 mb-3">
            感谢您的反馈！
          </h2>
          <p className="text-gray-600 mb-8">
            您的意见对我们非常重要，我们将持续改进服务质量，期待您的再次光临。
          </p>
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-gray-700">综合评分：</span>
              <span className="font-bold text-primary-900">
                {((formData.ratingContent + formData.ratingGuide + formData.ratingEnvironment) / 3).toFixed(1)}
              </span>
              <span className="text-gray-500">/5.0</span>
            </div>
          </div>
          <Button onClick={handleReset}>
            继续提交反馈
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="page-title mb-2">观众反馈</h1>
        <p className="text-gray-500">您的反馈是我们进步的动力</p>
      </div>

      {step === 'query' && (
        <div className="card p-8">
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="label">预约码</label>
              <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="input-field pl-10"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchBooking()}
                placeholder="请输入预约码（如 EXH-XXXXXXXX-MMDD）"
              />
            </div>
            {searchError && (
              <p className="text-red-500 text-sm mt-2">{searchError}</p>
            )}
          </div>
          <Button fullWidth onClick={handleSearchBooking}>
            查询预约
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <p className="text-center text-sm text-gray-500">
            请输入参观完成入场核验后，再提交反馈
          </p>
        </div>
        </div>
      )}

      {step === 'form' && booking && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">预约信息</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-sm">
                <span className="text-gray-500">展览：</span>
                <span className="font-medium text-primary-900">{booking.exhibition?.title}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">场次：</span>
                <span className="font-medium text-gray-800">
                  {booking.session?.date} {booking.session?.startTime}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">观众：</span>
                <span className="font-medium text-gray-800">{booking.visitorName}</span>
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-6">分项评分</h3>
            <div className="space-y-6">
              {ratingCategories.map((category) => (
                <div key={category.key} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <category.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-800">{category.label}</h4>
                      <StarRating
                        value={formData[category.key as keyof FeedbackFormData] as number}
                        onChange={(value) =>
                          setFormData({ ...formData, [category.key]: value })
                        }
                        size="lg"
                      />
                    </div>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {exhibits.length > 0 && (
            <div className="card p-6">
              <h3 className="section-title mb-4">感兴趣的展品</h3>
              <p className="text-sm text-gray-500 mb-4">可多选，帮助我们了解您的偏好</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {exhibits.map((exhibit) => (
                  <button
                    key={exhibit.id}
                    type="button"
                    onClick={() => handleExhibitToggle(exhibit.id)}
                    className={cn(
                      'relative p-3 rounded-xl border-2 transition-all text-left',
                      formData.interestedExhibits.includes(exhibit.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
                      {exhibit.image ? (
                        <img
                          src={exhibit.image}
                          alt={exhibit.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {exhibit.name}
                    </p>
                    {formData.interestedExhibits.includes(exhibit.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h3 className="section-title mb-4">留言评价</h3>
            <textarea
              className="input-field min-h-[120px] resize-none"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="请分享您的参观体验和建议..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setStep('query')}
            >
              返回
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={
                formData.ratingContent === 0 ||
                formData.ratingGuide === 0 ||
                formData.ratingEnvironment === 0 ||
                isSubmitting
              }
            >
              {isSubmitting ? '提交中...' : '提交反馈'}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
