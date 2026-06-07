import { Bell, Save, Settings } from 'lucide-react';
import { useLiveStore } from '@/store/useLiveStore';
import { formatFullDate } from '@/utils/format';

const Header = () => {
  const { currentSession, saveSession } = useLiveStore();

  return (
    <header className="h-16 bg-slate-850/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            {currentSession?.title || '未命名场次'}
          </h2>
          <p className="text-xs text-slate-500">
            {currentSession ? formatFullDate(currentSession.startTime) : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={saveSession}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <Save className="w-4 h-4" />
          保存
        </button>

        <button className="relative p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        <button className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
