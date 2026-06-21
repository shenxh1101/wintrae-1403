import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { announcementService } from '@/services/announcementService';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const announcements = announcementService.getActive();
  const hasUnread = announcements.length > 0;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索预约码、姓名、手机号..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-100">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-700 to-primary-900 rounded-full flex items-center justify-center text-white font-medium text-sm">
              管
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-800">管理员</p>
              <p className="text-xs text-gray-500">工作人员</p>
            </div>
          </div>
        </div>
      </div>

      {hasUnread && (
        <div className="px-4 lg:px-6 py-2 bg-gradient-to-r from-accent-gold/10 to-accent-gold/5 border-t border-accent-gold/20">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="shrink-0 px-2 py-0.5 bg-accent-gold/20 text-accent-gold-dark text-xs font-medium rounded-full">
              公告
            </span>
            <div className="overflow-hidden">
              <p className="text-sm text-gray-700 truncate animate-pulse">
                {announcements[0]?.title}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
