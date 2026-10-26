import React from 'react';
import { LayoutGrid, CalendarClock, DownloadCloud, BellRing, User } from 'lucide-react';
import { useCourses } from '../context/CourseContext';

export type TabId = 'dashboard' | 'assignments' | 'downloads' | 'notifications' | 'profile';

interface BottomNavProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { allAssignments, cachedFiles } = useCourses();

  // Count pending assignments due in <= 24 hours
  const urgentCount = allAssignments.filter((a) => {
    if (a.status !== 'pending') return false;
    const diffHours = (new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  }).length;

  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Courses', icon: LayoutGrid },
    { id: 'assignments', label: 'Deadlines', icon: CalendarClock, badge: urgentCount },
    { id: 'downloads', label: 'Offline', icon: DownloadCloud, badge: cachedFiles.length },
    { id: 'notifications', label: 'Alerts', icon: BellRing },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 pb-safe transition-all shadow-2xl"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center relative py-1 transition-all rounded-xl active:scale-95 ${
                isActive ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200 font-normal'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 leading-none">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-1 shadow-sm shadow-amber-400/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
