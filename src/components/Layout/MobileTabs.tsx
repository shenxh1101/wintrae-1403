import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, QrCode, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const staffTabs = [
  { path: '/', label: '概览', icon: LayoutDashboard },
  { path: '/exhibitions', label: '展览', icon: QrCode },
  { path: '/verification', label: '核验', icon: QrCode },
  { path: '/feedback/list', label: '反馈', icon: MessageSquare },
];

const publicTabs = [
  { path: '/booking', label: '预约', icon: CalendarDays },
  { path: '/booking/my', label: '我的', icon: User },
  { path: '/feedback', label: '反馈', icon: MessageSquare },
];

interface MobileTabsProps {
  currentView: 'staff' | 'public';
}

export const MobileTabs: React.FC<MobileTabsProps> = ({ currentView }) => {
  const location = useLocation();
  const tabs = currentView === 'staff' ? staffTabs : publicTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200',
                isActive ? 'text-primary-900' : 'text-gray-400'
              )}
            >
              <div
                className={cn(
                  'relative p-2 rounded-xl transition-all duration-200',
                  isActive ? 'bg-primary-50 scale-110' : ''
                )}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-900 rounded-full" />
                )}
              </div>
              <span className="text-xs mt-0.5 font-medium">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
