import type { Exhibition, Session, TicketType, Exhibit, Booking, Verification, Feedback, Announcement, Waitlist } from '../types';
import { addDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { keys, storage } from './storage';

const today = new Date();
const startDate = addDays(today, -3);
const endDate = addDays(today, 30);

export const mockExhibitions: Exhibition[] = [
  {
    id: 'exh-001',
    title: '丝路遗珍——唐代文物精品展',
    description: '展览汇聚来自全国多家博物馆的唐代文物精品120余件（套），通过丝路往来、盛世风华、诗意长安三个单元，展现大唐盛世的文化魅力与中外交流的历史画卷。',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20tang%20dynasty%20cultural%20relics%20exhibition%20poster%20elegant%20gold%20and%20red%20artistic&image_size=landscape_16_9',
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    languages: ['中文', 'English', '日本語'],
    status: 'active',
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'exh-002',
    title: '自然万象——近现代油画名家作品展',
    description: '展出林风眠、徐悲鸿、吴冠中等近现代油画大师的60余幅精品力作，呈现中国油画百年来的发展脉络与艺术成就。',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20chinese%20oil%20painting%20art%20exhibition%20elegant%20colorful%20artistic%20gallery&image_size=landscape_16_9',
    startDate: format(addDays(today, -10), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 60), 'yyyy-MM-dd'),
    languages: ['中文', 'English'],
    status: 'active',
    createdAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 'exh-003',
    title: '匠心独运——明清家具珍品展',
    description: '精选明清两代的硬木家具珍品50余件，涵盖坐具、桌案、床榻、柜架等品类，展现中国传统家具的工艺之美与人文内涵。',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ming%20qing%20dynasty%20chinese%20rosewood%20furniture%20exhibition%20elegant%20traditional%20craftsmanship&image_size=landscape_16_9',
    startDate: format(addDays(today, 15), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 90), 'yyyy-MM-dd'),
    languages: ['中文'],
    status: 'draft',
    createdAt: '2026-06-10T10:00:00Z',
  },
];

const generateSessions = (exhibitionId: string, start: Date, end: Date): Session[] => {
  const sessions: Session[] = [];
  const times = [
    { start: '09:00', end: '10:30' },
    { start: '11:00', end: '12:30' },
    { start: '14:00', end: '15:30' },
    { start: '16:00', end: '17:30' },
  ];

  let current = new Date(start);
  let id = 0;
  while (current <= end) {
    times.forEach((time) => {
      sessions.push({
        id: `sess-${exhibitionId}-${String(id).padStart(3, '0')}`,
        exhibitionId,
        date: format(current, 'yyyy-MM-dd'),
        startTime: time.start,
        endTime: time.end,
        capacity: 50,
        bookedCount: Math.floor(Math.random() * 45),
      });
      id++;
    });
    current = addDays(current, 1);
  }
  return sessions;
};

export const mockSessions: Session[] = [
  ...generateSessions('exh-001', startDate, endDate),
  ...generateSessions('exh-002', addDays(today, -10), addDays(today, 60)),
];

export const mockTicketTypes: TicketType[] = [
  { id: 'tt-001', exhibitionId: 'exh-001', name: '全价票', price: 80, description: '单人单次入场，含免费导览器' },
  { id: 'tt-002', exhibitionId: 'exh-001', name: '学生票', price: 40, description: '凭有效学生证入场' },
  { id: 'tt-003', exhibitionId: 'exh-001', name: '老年票', price: 40, description: '65岁以上老人凭身份证' },
  { id: 'tt-004', exhibitionId: 'exh-001', name: '团体票', price: 60, description: '10人以上团体，需提前预约' },
  { id: 'tt-005', exhibitionId: 'exh-002', name: '全价票', price: 60, description: '单人单次入场' },
  { id: 'tt-006', exhibitionId: 'exh-002', name: '学生票', price: 30, description: '凭有效学生证入场' },
];

export const mockExhibits: Exhibit[] = [
  {
    id: 'exbt-001',
    exhibitionId: 'exh-001',
    name: '三彩骆驼载乐俑',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tang%20dynasty%20sancai%20pottery%20camel%20with%20musicians%20ancient%20chinese%20artifact&image_size=square',
    description: '唐代三彩釉陶器精品，展现了丝绸之路的文化交流。',
  },
  {
    id: 'exbt-002',
    exhibitionId: 'exh-001',
    name: '鎏金舞马衔杯纹银壶',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tang%20dynasty%20gilded%20silver%20pot%20with%20dancing%20horse%20design%20ancient%20artifact&image_size=square',
    description: '唐代金银器的代表之作，何家村窖藏出土珍品。',
  },
  {
    id: 'exbt-003',
    exhibitionId: 'exh-001',
    name: '彩绘陶女立俑',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tang%20dynasty%20painted%20pottery%20female%20figure%20ancient%20chinese%20statue&image_size=square',
    description: '展现唐代女性丰腴之美与社会风貌。',
  },
  {
    id: 'exbt-004',
    exhibitionId: 'exh-001',
    name: '镶金兽首玛瑙杯',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tang%20dynasty%20agate%20cup%20with%20gold%20inlay%20beast%20head%20design%20ancient%20treasure&image_size=square',
    description: '唐代玉器珍品，中西文化交流的见证。',
  },
  {
    id: 'exbt-005',
    exhibitionId: 'exh-002',
    name: '林风眠《秋林》',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lin%20fengmian%20style%20autumn%20forest%20oil%20painting%20chinese%20modern%20art&image_size=square',
    description: '林风眠融合中西的代表作品，秋林静谧意境深远。',
  },
  {
    id: 'exbt-006',
    exhibitionId: 'exh-002',
    name: '吴冠中《江南水乡》',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wu%20guanzhong%20style%20jiangnan%20water%20town%20oil%20painting%20chinese%20modern%20art&image_size=square',
    description: '吴冠中江南系列代表作，水墨意境与油画语言的完美结合。',
  },
];

const generateBookings = (): Booking[] => {
  const bookings: Booking[] = [];
  const names = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十'];
  const statuses: Booking['status'][] = ['confirmed', 'checked_in', 'cancelled'];

  for (let i = 0; i < 20; i++) {
    const randomSession = mockSessions[Math.floor(Math.random() * mockSessions.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const bookingDate = addDays(today, Math.floor(Math.random() * 7) - 3);
    const codeDate = format(bookingDate, 'MMdd');
    const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomCode = '';
    for (let j = 0; j < 8; j++) {
      randomCode += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
    }

    bookings.push({
      id: `bk-${String(i + 1).padStart(4, '0')}`,
      code: `EXH-${randomCode}-${codeDate}`,
      sessionId: randomSession.id,
      ticketTypeId: mockTicketTypes[Math.floor(Math.random() * mockTicketTypes.length)].id,
      visitorName: name,
      phone: `1${Math.floor(Math.random() * 9 + 3)}${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
      count: Math.floor(Math.random() * 4) + 1,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: format(bookingDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    });
  }
  return bookings;
};

export const mockBookings: Booking[] = generateBookings();

export const mockVerifications: Verification[] = mockBookings
  .filter(b => b.status === 'checked_in')
  .map((booking, i) => ({
    id: `ver-${String(i + 1).padStart(4, '0')}`,
    bookingId: booking.id,
    checkInTime: new Date().toISOString(),
    status: Math.random() > 0.9 ? 'late' : 'success',
    isLate: Math.random() > 0.9,
  }));

export const mockFeedbacks: Feedback[] = [
  {
    id: 'fb-001',
    bookingId: 'bk-0001',
    ratingContent: 5,
    ratingGuide: 5,
    ratingEnvironment: 4,
    comment: '展览非常精彩，文物精美，讲解详细。希望能有更多这样的好展览！',
    interestedExhibits: ['exbt-001', 'exbt-002'],
    handleStatus: 'closed',
    internalNote: '已将观众建议转交给策展团队，下次展览考虑增加互动环节。',
    createdAt: '2026-06-20T10:00:00Z',
  },
  {
    id: 'fb-002',
    bookingId: 'bk-0002',
    ratingContent: 4,
    ratingGuide: 4,
    ratingEnvironment: 5,
    comment: '场馆环境很好，展品布置用心。建议增加更多互动体验环节。',
    interestedExhibits: ['exbt-003'],
    handleStatus: 'processing',
    internalNote: '已记录互动体验建议，评估可行性中。',
    createdAt: '2026-06-19T15:30:00Z',
  },
  {
    id: 'fb-003',
    bookingId: 'bk-0003',
    ratingContent: 5,
    ratingGuide: 5,
    ratingEnvironment: 5,
    comment: '周末带孩子来看，孩子很喜欢，尤其是唐三彩骆驼，看得目不转睛。',
    interestedExhibits: ['exbt-001', 'exbt-004'],
    handleStatus: 'pending',
    internalNote: '',
    createdAt: '2026-06-18T11:20:00Z',
  },
];

export const mockWaitlists: Waitlist[] = [
  {
    id: 'wl-001',
    sessionId: 'ses-001',
    visitorName: '王小明',
    phone: '13800138001',
    count: 2,
    status: 'waiting',
    createdAt: '2026-06-22T09:15:00Z',
  },
  {
    id: 'wl-002',
    sessionId: 'ses-001',
    visitorName: '李华',
    phone: '13900139002',
    count: 3,
    status: 'waiting',
    createdAt: '2026-06-22T09:20:00Z',
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-001',
    title: '关于延长「丝路遗珍」展览展期的通知',
    content: '应广大观众要求，「丝路遗珍——唐代文物精品展」将延长展期至7月31日，欢迎参观。',
    isActive: true,
    createdAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'ann-002',
    title: '端午假期开放安排',
    content: '6月22日（周一）端午节期间，本馆正常开放，开放时间：9:00-18:00（17:00停止入场）。',
    isActive: true,
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'ann-003',
    title: '7月「匠心独运」展览预告',
    content: '「匠心独运——明清家具珍品展」将于7月7日正式开展，敬请期待！',
    isActive: true,
    createdAt: '2026-06-05T10:00:00Z',
  },
];

export const initMockData = (): void => {
  if (!storage.get(keys.EXHIBITIONS)) {
    storage.set(keys.EXHIBITIONS, mockExhibitions);
    storage.set(keys.SESSIONS, mockSessions);
    storage.set(keys.TICKET_TYPES, mockTicketTypes);
    storage.set(keys.EXHIBITS, mockExhibits);
    storage.set(keys.BOOKINGS, mockBookings);
    storage.set(keys.VERIFICATIONS, mockVerifications);
    storage.set(keys.FEEDBACKS, mockFeedbacks);
    storage.set(keys.ANNOUNCEMENTS, mockAnnouncements);
    storage.set(keys.WAITLISTS, mockWaitlists);
  }
};
