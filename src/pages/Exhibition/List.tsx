import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Globe,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { exhibitionService } from '@/services/exhibitionService';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Exhibition, Session, TicketType } from '@/types';

const LANGUAGE_OPTIONS = ['中文', 'English', '日本語', '한국어', 'Français'];

export const ExhibitionListPage: React.FC = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    startDate: '',
    endDate: '',
    languages: [] as string[],
    status: 'draft' as 'draft' | 'active' | 'ended',
  });
  const [sessions, setSessions] = useState<{ startTime: string; endTime: string }[]>([
    { startTime: '09:00', endTime: '10:30' },
    { startTime: '11:00', endTime: '12:30' },
    { startTime: '14:00', endTime: '15:30' },
    { startTime: '16:00', endTime: '17:30' },
  ]);
  const [capacity, setCapacity] = useState(50);
  const [ticketTypes, setTicketTypes] = useState<{ name: string; price: number; description: string }[]>([
    { name: '全价票', price: 80, description: '单人单次入场' },
  ]);

  useEffect(() => {
    loadExhibitions();
  }, []);

  const loadExhibitions = () => {
    setExhibitions(exhibitionService.getAll().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const handleOpenForm = (exhibition?: Exhibition) => {
    if (exhibition) {
      setEditingExhibition(exhibition);
      setFormData({
        title: exhibition.title,
        description: exhibition.description,
        coverImage: exhibition.coverImage,
        startDate: exhibition.startDate,
        endDate: exhibition.endDate,
        languages: exhibition.languages,
        status: exhibition.status,
      });
      const existingSessions = exhibitionService.getSessions(exhibition.id);
      if (existingSessions.length > 0) {
        const uniqueTimes = Array.from(
          new Map(existingSessions.map(s => [`${s.startTime}-${s.endTime}`, s]))
            .values()
        ).map(s => ({ startTime: s.startTime, endTime: s.endTime }));
        setSessions(uniqueTimes);
        setCapacity(existingSessions[0].capacity);
      }
      setTicketTypes(
        exhibitionService.getTicketTypes(exhibition.id).map(t => ({
          name: t.name,
          price: t.price,
          description: t.description,
        }))
      );
    } else {
      setEditingExhibition(null);
      setFormData({
        title: '',
        description: '',
        coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=art%20museum%20exhibition%20elegant%20gallery%20interior%20design&image_size=landscape_16_9',
        startDate: formatDate(new Date(), 'yyyy-MM-dd'),
        endDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        languages: ['中文'],
        status: 'draft',
      });
      setSessions([
        { startTime: '09:00', endTime: '10:30' },
        { startTime: '11:00', endTime: '12:30' },
        { startTime: '14:00', endTime: '15:30' },
        { startTime: '16:00', endTime: '17:30' },
      ]);
      setCapacity(50);
      setTicketTypes([{ name: '全价票', price: 80, description: '单人单次入场' }]);
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.startDate || !formData.endDate) return;

    let exhibition: Exhibition | undefined;

    if (editingExhibition) {
      exhibition = exhibitionService.update(editingExhibition.id, formData);
      exhibitionService.deleteSessionsByExhibition(editingExhibition.id);
      exhibitionService.deleteTicketTypesByExhibition(editingExhibition.id);
    } else {
      exhibition = exhibitionService.create(formData);
    }

    if (exhibition) {
      exhibitionService.createSessions(
        exhibition.id,
        formData.startDate,
        formData.endDate,
        sessions,
        capacity
      );

      ticketTypes.forEach(ticket => {
        if (ticket.name) {
          exhibitionService!.createTicketType({
            exhibitionId: exhibition!.id,
            ...ticket,
          });
        }
      });
    }

    setShowForm(false);
    loadExhibitions();
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';
    exhibitionService.update(id, { status: newStatus as any });
    loadExhibitions();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个展览吗？相关的场次和票种也会被删除。')) {
      exhibitionService.delete(id);
      loadExhibitions();
    }
  };

  const addSession = () => {
    setSessions([...sessions, { startTime: '10:00', endTime: '11:30' }]);
  };

  const removeSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const updateSession = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...sessions];
    updated[index][field] = value;
    setSessions(updated);
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: 0, description: '' }]);
  };

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const updateTicketType = (index: number, field: string, value: string | number) => {
    const updated = [...ticketTypes];
    (updated[index] as any)[field] = value;
    setTicketTypes(updated);
  };

  const toggleLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.includes(lang)
        ? formData.languages.filter(l => l !== lang)
        : [...formData.languages, lang],
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'badge-active',
      draft: 'badge-draft',
      ended: 'badge-ended',
    };
    const labels = {
      active: '已上线',
      draft: '草稿',
      ended: '已结束',
    };
    return (
      <span className={cn('badge', styles[status as keyof typeof styles])}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">展览管理</h1>
          <p className="text-gray-500 text-sm">创建和管理临时展览信息</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4 mr-2" />
          新建展览
        </Button>
      </div>

      <div className="grid gap-4">
        {exhibitions.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-gray-500 mb-4">暂无展览，点击上方按钮创建第一个展览</p>
            <Button onClick={() => handleOpenForm()}>新建展览</Button>
          </div>
        ) : (
          exhibitions.map((exhibition) => {
            const sessionCount = exhibitionService.getSessions(exhibition.id).length;
            const ticketCount = exhibitionService.getTicketTypes(exhibition.id).length;

            return (
              <div
                key={exhibition.id}
                className="card card-hover overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-72 h-48 md:h-auto shrink-0 relative">
                    <img
                      src={exhibition.coverImage}
                      alt={exhibition.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(exhibition.status)}
                    </div>
                  </div>

                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-xl font-semibold text-primary-900 mb-2">
                          {exhibition.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                          {exhibition.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(exhibition.startDate, 'MM-dd')} - {formatDate(exhibition.endDate, 'MM-dd')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{sessionCount} 场次</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>{ticketCount} 票种</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-4 h-4" />
                            <span>{exhibition.languages.join(' / ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(exhibition.id, exhibition.status)}
                        >
                          {exhibition.status === 'active' ? (
                            <><EyeOff className="w-4 h-4 mr-1" />下线</>
                          ) : (
                            <><Eye className="w-4 h-4 mr-1" />上线</>
                          )}
                        </Button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenForm(exhibition)}
                            className="p-2 hover:bg-primary-50 rounded-lg text-gray-500 hover:text-primary-900 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exhibition.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingExhibition ? '编辑展览' : '新建展览'}
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin pr-2">
          <div>
            <label className="label">展览名称 *</label>
            <input
              type="text"
              className="input-field"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入展览名称"
            />
          </div>

          <div>
            <label className="label">展览简介 *</label>
            <textarea
              className="input-field min-h-[100px] resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入展览简介"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">开始日期 *</label>
              <input
                type="date"
                className="input-field"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">结束日期 *</label>
              <input
                type="date"
                className="input-field"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">封面图片</label>
            <input
              type="text"
              className="input-field"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="请输入图片URL"
            />
            {formData.coverImage && (
              <div className="mt-2 aspect-video bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={formData.coverImage}
                  alt="封面预览"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="divider" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">场次配置</label>
              <Button variant="ghost" size="sm" onClick={addSession}>
                <Plus className="w-4 h-4 mr-1" /> 添加场次
              </Button>
            </div>
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="time"
                    className="input-field flex-1"
                    value={session.startTime}
                    onChange={(e) => updateSession(index, 'startTime', e.target.value)}
                  />
                  <span className="text-gray-400">至</span>
                  <input
                    type="time"
                    className="input-field flex-1"
                    value={session.endTime}
                    onChange={(e) => updateSession(index, 'endTime', e.target.value)}
                  />
                  <button
                    onClick={() => removeSession(index)}
                    className="p-2.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    disabled={sessions.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="label">单场人数上限</label>
              <input
                type="number"
                className="input-field w-32"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 50)}
                min={1}
              />
            </div>
          </div>

          <div className="divider" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">票种管理</label>
              <Button variant="ghost" size="sm" onClick={addTicketType}>
                <Plus className="w-4 h-4 mr-1" /> 添加票种
              </Button>
            </div>
            <div className="space-y-3">
              {ticketTypes.map((ticket, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    <label className="label">名称</label>
                    <input
                      type="text"
                      className="input-field"
                      value={ticket.name}
                      onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                      placeholder="如：全价票"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="label">价格</label>
                    <input
                      type="number"
                      className="input-field"
                      value={ticket.price}
                      onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="label">说明</label>
                    <input
                      type="text"
                      className="input-field"
                      value={ticket.description}
                      onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                      placeholder="票种说明"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => removeTicketType(index)}
                      className="p-2.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors w-full"
                      disabled={ticketTypes.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />

          <div>
            <label className="label">导览语言</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    formData.languages.includes(lang)
                      ? 'bg-primary-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">状态</label>
            <div className="flex gap-3">
              {(['draft', 'active', 'ended'] as const).map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={() => setFormData({ ...formData, status })}
                    className="w-4 h-4 text-primary-900"
                  />
                  <span className="text-sm">
                    {status === 'draft' ? '草稿' : status === 'active' ? '上线' : '已结束'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <Button variant="ghost" onClick={() => setShowForm(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.startDate || !formData.endDate}
          >
            {editingExhibition ? '保存修改' : '创建展览'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
