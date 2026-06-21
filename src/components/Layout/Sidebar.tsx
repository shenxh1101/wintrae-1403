import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Palette,
  CalendarDays,
  QrCode,
  MessageSquare,
  Building2,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const staffNavItems = [
  { path: '/', label: '数据概览', icon: LayoutDashboard },
  { path: '/exhibitions', label: '展览管理', icon: Palette },
  { path: '/verification', label: '入场核验', icon: QrCode },
  { path: '/feedback/list', label: '反馈管理', icon: MessageSquare },
];

const publicNavItems = [
  { path: '/booking', label: '在线预约', icon: CalendarDays },
  { path: '/booking/my', label: '我的预约', icon: Ticket },
  { path: '/feedback', label: '参观反馈', icon: MessageSquare },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'staff' | 'public';
  onViewChange: (view: 'staff' | 'public') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onViewChange }) => {
  const location = useLocation();

  const navItems = currentView === 'staff' ? staffNavItems : publicNavItems;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static left-0 top-0 z-50 h-full w-64 bg-white border-r border-gray-100 shadow-sm transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-semibold text-primary-900 leading-tight">
                  展览馆
                </h1>
                <p className="text-xs text-gray-500">预约管理系统</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="sr-only">关闭</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewChange('staff')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200',
                  currentView === 'staff'
                    ? 'bg-white text-primary-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                工作人员
              </button>
              <button
                onClick={() => onViewChange('public')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200',
                  currentView === 'public'
                    ? 'bg-white text-primary-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                观众入口
              </button>
            </div>
          </div>

          <nav className="flex-1 px-4 py-2 overflow-y-auto scrollbar-thin">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-primary-900 to-primary-800 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-primary-900'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-br from-primary-50 to-accent-gold/10 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">今日日期</p>
              <p className="font-serif text-lg font-semibold text-primary-900">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
