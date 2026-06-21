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
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  UserClock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { exhibitionService } from '@/services/exhibitionService';
import { bookingService } from '@/services/bookingService';
import { waitlistService } from '@/services/waitlistService';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Exhibition, Session, TicketType, WaitlistWithDetails } from '@/types';

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExhibition, setDeletingExhibition] = useState<Exhibition | null>(null);
  const [deleteStats, setDeleteStats] = useState({ bookingCount: 0, sessionCount: 0 });
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [affectedStats, setAffectedStats] = useState({ bookings: 0, sessions: 0 });
  const [showAffectedDetail, setShowAffectedDetail] = useState(false);
  const [affectedSessions, setAffectedSessions] = useState<any[]>([]);
  const [affectedTicketTypes, setAffectedTicketTypes] = useState<any[]>([]);
  const [sessionActions, setSessionActions] = useState<Record<string, { action: 'keep' | 'migrate' | 'cancel'; targetSessionKey: string }>>({});
  const [ticketActions, setTicketActions] = useState<Record<string, { action: 'keep' | 'cancel' }>>({});
  const [previewNewSessions, setPreviewNewSessions] = useState<any[]>([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistExhibition, setWaitlistExhibition] = useState<Exhibition | null>(null);
  const [waitlistData, setWaitlistData] = useState<any[]>([]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = '请输入展览名称';
    }

    if (!formData.startDate) {
      errors.startDate = '请选择开始日期';
    }

    if (!formData.endDate) {
      errors.endDate = '请选择结束日期';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.dateRange = '结束日期不能早于开始日期';
    }

    sessions.forEach((session, index) => {
      if (!session.startTime) {
        errors[`session-start-${index}`] = `请输入第${index + 1}场开始时间`;
      }
      if (!session.endTime) {
        errors[`session-end-${index}`] = `请输入第${index + 1}场结束时间`;
      }
      if (session.startTime && session.endTime && session.startTime >= session.endTime) {
        errors[`session-range-${index}`] = `第${index + 1}场结束时间必须晚于开始时间`;
      }
    });

    if (capacity <= 0 || !Number.isFinite(capacity)) {
      errors.capacity = '人数上限必须是大于0的正数';
    }

    ticketTypes.forEach((ticket, index) => {
      if (!ticket.name.trim()) {
        errors[`ticket-name-${index}`] = `请输入第${index + 1}个票种名称`;
      }
      if (ticket.price < 0 || !Number.isFinite(ticket.price)) {
        errors[`ticket-price-${index}`] = `第${index + 1}个票种价格不能为负数`;
      }
    });

    if (formData.languages.length === 0) {
      errors.languages = '请至少选择一种导览语言';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (): boolean => {
    if (!formData.title.trim()) return false;
    if (!formData.startDate || !formData.endDate) return false;
    if (formData.startDate > formData.endDate) return false;
    if (capacity <= 0 || !Number.isFinite(capacity)) return false;
    if (formData.languages.length === 0) return false;
    for (const session of sessions) {
      if (!session.startTime || !session.endTime) return false;
      if (session.startTime >= session.endTime) return false;
    }
    for (const ticket of ticketTypes) {
      if (!ticket.name.trim()) return false;
      if (ticket.price < 0 || !Number.isFinite(ticket.price)) return false;
    }
    return true;
  };

  useEffect(() => {
    loadExhibitions();
  }, []);

  const loadExhibitions = () => {
    setExhibitions(exhibitionService.getAll().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const handleOpenForm = (exhibition?: Exhibition) => {
    setFormErrors({});
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
    if (!validateForm()) return;

    if (editingExhibition) {
      const affected = exhibitionService.getExhibitionAffectedBookings(editingExhibition.id);
      const totalBookings = affected.reduce((sum, a) => sum + a.bookingCount, 0);

      if (totalBookings > 0) {
        const oldSessions = exhibitionService.getSessions(editingExhibition.id);
        const oldTicketTypes = exhibitionService.getTicketTypes(editingExhibition.id);

        const sessionList = affected.map(a => {
          const s = oldSessions.find(os => os.id === a.sessionId);
          return {
            ...a,
            session: s,
            date: s?.date,
            startTime: s?.startTime,
            endTime: s?.endTime,
          };
        }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        const ticketList = oldTicketTypes.filter(tt => {
          const count = exhibitionService.getTicketTypeUsageCount(tt.id);
          return count > 0;
        }).map(tt => ({
          ...tt,
          usageCount: exhibitionService.getTicketTypeUsageCount(tt.id),
        }));

        const newSessionKeys: string[] = [];
        const sDate = formData.startDate;
        const eDate = formData.endDate;
        if (sDate && eDate) {
          const start = new Date(sDate);
          const end = new Date(eDate);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dStr = formatDate(d, 'yyyy-MM-dd');
            sessions.forEach(t => {
              newSessionKeys.push(`${dStr}_${t.startTime}_${t.endTime}`);
            });
          }
        }

        const actions: Record<string, { action: 'keep' | 'migrate' | 'cancel'; targetSessionKey: string }> = {};
        sessionList.forEach(s => {
          actions[s.sessionId] = { action: 'keep', targetSessionKey: newSessionKeys[0] || '' };
        });

        const tActions: Record<string, { action: 'keep' | 'cancel' }> = {};
        ticketList.forEach(t => {
          tActions[t.id] = { action: 'keep' };
        });

        setAffectedSessions(sessionList);
        setAffectedTicketTypes(ticketList);
        setSessionActions(actions);
        setTicketActions(tActions);
        setPreviewNewSessions(newSessionKeys.map(k => {
          const [date, start, end] = k.split('_');
          return { key: k, date, start, end, label: `${formatDate(date)} ${start}-${end}` };
        }));
        setShowAffectedDetail(true);
        setPendingSave(true);
        return;
      }
    }

    doSaveDetailed({});
  };

  const doSaveDetailed = (customActions?: any) => {
    let exhibition: Exhibition | undefined;

    if (editingExhibition) {
      const finalSessionActions = customActions.sessionActions || sessionActions;
      const finalTicketActions = customActions.ticketActions || ticketActions;

      const allNewSessions = exhibitionService.createSessionsPreview(
        editingExhibition.id,
        formData.startDate,
        formData.endDate,
        sessions,
        capacity
      );

      Object.entries(finalSessionActions).forEach(([sessionId, action]) => {
        const act = action as any;
        if (act.action === 'cancel') {
          exhibitionService.cancelBookingsBySession(sessionId);
        } else if (act.action === 'migrate' && act.targetSessionKey) {
          const target = allNewSessions.find((s: any) => `${s.date}_${s.startTime}_${s.endTime}` === act.targetSessionKey);
          if (target) {
            exhibitionService.migrateBookingsToSession(sessionId, target.id);
          }
        }
      });

      exhibition = exhibitionService.update(editingExhibition.id, formData);
      exhibitionService.deleteSessionsByExhibition(editingExhibition.id);
      exhibitionService.saveSessions(allNewSessions);
      exhibitionService.deleteTicketTypesByExhibition(editingExhibition.id);
    } else {
      exhibition = exhibitionService.create(formData);
    }

    if (exhibition) {
      if (!editingExhibition) {
        exhibitionService.createSessions(
          exhibition.id,
          formData.startDate,
          formData.endDate,
          sessions,
          capacity
        );
      }

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
    setShowSaveWarning(false);
    setShowAffectedDetail(false);
    setPendingSave(false);
    loadExhibitions();
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';
    exhibitionService.update(id, { status: newStatus as any });
    loadExhibitions();
  };

  const handleDelete = (exhibition: Exhibition) => {
    const affected = exhibitionService.getExhibitionAffectedBookings(exhibition.id);
    const totalBookings = affected.reduce((sum, a) => sum + a.bookingCount, 0);
    const totalSessions = affected.filter(a => a.bookingCount > 0).length;
    setDeletingExhibition(exhibition);
    setDeleteStats({ bookingCount: totalBookings, sessionCount: totalSessions });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingExhibition) {
      exhibitionService.delete(deletingExhibition.id);
      loadExhibitions();
    }
    setShowDeleteConfirm(false);
    setDeletingExhibition(null);
  };

  const handleViewWaitlist = (exhibition: Exhibition) => {
    const sessions = exhibitionService.getSessions(exhibition.id);
    const data = sessions.map(s => ({
      session: s,
      waitlists: waitlistService.getWithDetails(s.id),
    })).filter(d => d.waitlists.length > 0);

    setWaitlistExhibition(exhibition);
    setWaitlistData(data);
    setShowWaitlistModal(true);
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
                            onClick={(e) => { e.stopPropagation(); handleViewWaitlist(exhibition); }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                            title="候补名单"
                          >
                            <UserClock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(exhibition); }}
                            className="p-2 hover:bg-primary-50 rounded-lg text-gray-500 hover:text-primary-900 transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(exhibition); }}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                            title="删除"
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
              className={cn('input-field', formErrors.title && 'input-error')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入展览名称"
            />
            {formErrors.title && (
              <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
            )}
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
                className={cn('input-field', (formErrors.startDate || formErrors.dateRange) && 'input-error')}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              {formErrors.startDate && (
                <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className="label">结束日期 *</label>
              <input
                type="date"
                className={cn('input-field', (formErrors.endDate || formErrors.dateRange) && 'input-error')}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              {formErrors.endDate && (
                <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>
              )}
            </div>
          </div>
          {formErrors.dateRange && (
            <p className="text-red-500 text-sm -mt-2">{formErrors.dateRange}</p>
          )}

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
              {sessions.map((session, index) => {
                const startError = formErrors[`session-start-${index}`];
                const endError = formErrors[`session-end-${index}`];
                const rangeError = formErrors[`session-range-${index}`];
                const hasError = startError || endError || rangeError;
                return (
                  <div key={index}>
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        className={cn('input-field flex-1', (startError || rangeError) && 'input-error')}
                        value={session.startTime}
                        onChange={(e) => updateSession(index, 'startTime', e.target.value)}
                      />
                      <span className="text-gray-400">至</span>
                      <input
                        type="time"
                        className={cn('input-field flex-1', (endError || rangeError) && 'input-error')}
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
                    {(startError || endError || rangeError) && (
                      <p className="text-red-500 text-sm mt-1">
                        {startError || endError || rangeError}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <label className="label">单场人数上限</label>
              <input
                type="number"
                className={cn('input-field w-32', formErrors.capacity && 'input-error')}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                min={1}
              />
              {formErrors.capacity && (
                <p className="text-red-500 text-sm mt-1">{formErrors.capacity}</p>
              )}
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
              {ticketTypes.map((ticket, index) => {
                const nameError = formErrors[`ticket-name-${index}`];
                const priceError = formErrors[`ticket-price-${index}`];
                return (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <label className="label">名称</label>
                      <input
                        type="text"
                        className={cn('input-field', nameError && 'input-error')}
                        value={ticket.name}
                        onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                        placeholder="如：全价票"
                      />
                      {nameError && (
                        <p className="text-red-500 text-sm mt-1">{nameError}</p>
                      )}
                    </div>
                    <div className="col-span-3">
                      <label className="label">价格</label>
                      <input
                        type="number"
                        className={cn('input-field', priceError && 'input-error')}
                        value={ticket.price}
                        onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min={0}
                      />
                      {priceError && (
                        <p className="text-red-500 text-sm mt-1">{priceError}</p>
                      )}
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
                );
              })}
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
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    formErrors.languages && 'ring-2 ring-red-300'
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
            {formErrors.languages && (
              <p className="text-red-500 text-sm mt-2">{formErrors.languages}</p>
            )}
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
            disabled={!isFormValid()}
          >
            {editingExhibition ? '保存修改' : '创建展览'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="删除展览确认"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-1">
                确定要删除「{deletingExhibition?.title}」吗？
              </h4>
              <p className="text-sm text-red-700">
                删除后相关的场次、票种数据会被清除，此操作不可撤销。
              </p>
            </div>
          </div>

          {deleteStats.bookingCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                该展览有 {deleteStats.bookingCount} 条预约记录
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-700">{deleteStats.sessionCount}</p>
                  <p className="text-xs text-gray-500">受影响场次</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-700">{deleteStats.bookingCount}</p>
                  <p className="text-xs text-gray-500">受影响预约</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button
              fullWidth
              className="!bg-red-600 hover:!bg-red-700"
              onClick={confirmDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSaveWarning}
        onClose={() => {
          setShowSaveWarning(false);
          setPendingSave(false);
        }}
        title="保存提示"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 mb-1">
                本场展览已有 {affectedStats.bookings} 条预约
              </h4>
              <p className="text-sm text-amber-700">
                修改日期、场次或票种后，已有的预约记录会受到影响。
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">请选择处理方式：</p>

            <button
              onClick={() => doSave('keep')}
              className="w-full p-4 border border-gray-200 rounded-xl text-left hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">保留原有预约</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    预约仍然有效，观众可查看原来的参观日期、人数和票种信息（从快照读取）
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            <button
              onClick={() => doSave('cancel')}
              className="w-full p-4 border border-gray-200 rounded-xl text-left hover:border-red-300 hover:bg-red-50/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">取消全部相关预约</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    所有已预约的订单将被取消，系统会自动处理候补队列
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>

          <div className="pt-2">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                setShowSaveWarning(false);
                setPendingSave(false);
              }}
            >
              取消保存
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAffectedDetail}
        onClose={() => {
          setShowAffectedDetail(false);
          setPendingSave(false);
        }}
        title="处理已有预约"
        size="lg"
      >
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 rounded-xl">
            <p className="text-sm text-amber-800">
              本次修改将影响 <b>{affectedSessions.length}</b> 个场次，共 <b>{affectedSessions.reduce((s, a) => s + a.bookingCount, 0)}</b> 条预约记录。
              请为每个受影响的场次选择处理方式。
            </p>
          </div>

          {affectedSessions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">场次变更处理</h4>
              <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                {affectedSessions.map((item) => (
                  <div key={item.sessionId} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-primary-900">
                          {item.date ? formatDate(item.date) : ''} {item.startTime}-{item.endTime}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.bookingCount} 条预约 · {item.count} 人次
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        待处理
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => setSessionActions({
                          ...sessionActions,
                          [item.sessionId]: { ...sessionActions[item.sessionId], action: 'keep' }
                        })}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all',
                          sessionActions[item.sessionId]?.action === 'keep'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className={cn(
                            'w-4 h-4',
                            sessionActions[item.sessionId]?.action === 'keep' ? 'text-green-600' : 'text-gray-400'
                          )} />
                          <span className="text-sm font-medium text-gray-800">保留旧信息</span>
                        </div>
                        <span className="text-xs text-gray-500">快照保存，仍可查看</span>
                      </button>

                      <button
                        onClick={() => setSessionActions({
                          ...sessionActions,
                          [item.sessionId]: { ...sessionActions[item.sessionId], action: 'migrate' }
                        })}
                        className={cn(
                          'p-3 rounded-lg border-2 text-left transition-all',
                          sessionActions[item.sessionId]?.action === 'migrate'
                            ? 'border-primary-900 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ArrowRight className={cn(
                              'w-4 h-4',
                              sessionActions[item.sessionId]?.action === 'migrate' ? 'text-primary-600' : 'text-gray-400'
                            )} />
                            <span className="text-sm font-medium text-gray-800">迁移到新场次</span>
                          </div>
                        </div>
                        {sessionActions[item.sessionId]?.action === 'migrate' && (
                          <select
                            className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                            value={sessionActions[item.sessionId]?.targetSessionKey || ''}
                            onChange={(e) => setSessionActions({
                              ...sessionActions,
                              [item.sessionId]: {
                                ...sessionActions[item.sessionId],
                                targetSessionKey: e.target.value
                              }
                            })}
                          >
                            <option value="">请选择目标场次...</option>
                            {previewNewSessions.map((s) => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                        )}
                      </button>

                      <button
                        onClick={() => setSessionActions({
                          ...sessionActions,
                          [item.sessionId]: { ...sessionActions[item.sessionId], action: 'cancel' }
                        })}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all',
                          sessionActions[item.sessionId]?.action === 'cancel'
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className={cn(
                            'w-4 h-4',
                            sessionActions[item.sessionId]?.action === 'cancel' ? 'text-red-600' : 'text-gray-400'
                          )} />
                          <span className="text-sm font-medium text-gray-800">仅取消这部分</span>
                        </div>
                        <span className="text-xs text-gray-500">不影响其他场次</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {affectedTicketTypes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">票种变更处理</h4>
              <div className="space-y-2">
                {affectedTicketTypes.map((tt) => (
                  <div key={tt.id} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {tt.name} <span className="text-xs text-gray-400 ml-1">¥{tt.price}</span>
                      </p>
                      <p className="text-xs text-gray-500">{tt.usageCount} 条预约使用</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                      自动保留快照
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                setShowAffectedDetail(false);
                setPendingSave(false);
              }}
            >
              返回编辑
            </Button>
            <Button
              fullWidth
              onClick={() => doSaveDetailed()}
              disabled={Object.values(sessionActions).some(a => a.action === 'migrate' && !a.targetSessionKey)}
            >
              确认并保存
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        title={`${waitlistExhibition?.title} - 候补名单`}
        size="lg"
      >
        <div className="space-y-5">
          {waitlistData.length === 0 ? (
            <div className="text-center py-12">
              <UserClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无候补记录</p>
            </div>
          ) : (
            waitlistData.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-900">
                      {formatDate(item.session.date)} {item.session.startTime}-{item.session.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                      共 {item.waitlists.length} 人候补
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {item.waitlists.map((wl: WaitlistWithDetails, wi: number) => {
                    const statusConfig = {
                      waiting: { label: '排队中', style: 'bg-blue-100 text-blue-700' },
                      notified: { label: '已通知', style: 'bg-green-100 text-green-700' },
                      expired: { label: '已过期', style: 'bg-gray-100 text-gray-500' },
                      converted: { label: '已转预约', style: 'bg-primary-100 text-primary-700' },
                    };
                    const cfg = statusConfig[wl.status as keyof typeof statusConfig] || statusConfig.waiting;
                    return (
                      <div key={wl.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-700">
                            {wi + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{wl.visitorName}</p>
                            <p className="text-xs text-gray-500">{wl.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')} · {wl.count}人</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn('px-2 py-1 rounded-lg text-xs font-medium', cfg.style)}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(wl.createdAt, 'MM-dd HH:mm')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
