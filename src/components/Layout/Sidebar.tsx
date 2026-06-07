import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Package,
  FileText,
  Timer,
  MessageSquare,
  BarChart3,
  ListTodo,
  Radio,
  Play,
  Square,
} from 'lucide-react';
import { useLiveStore } from '@/store/useLiveStore';

const navItems = [
  { path: '/', label: '总览', icon: LayoutDashboard },
  { path: '/account-check', label: '账号检查', icon: ShieldCheck },
  { path: '/products', label: '商品清单', icon: Package },
  { path: '/script', label: '脚本排程', icon: FileText },
  { path: '/control', label: '场控提醒', icon: Timer },
  { path: '/danmaku', label: '弹幕整理', icon: MessageSquare },
  { path: '/review', label: '复盘报表', icon: BarChart3 },
  { path: '/tasks', label: '任务日志', icon: ListTodo },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { isLiveOngoing, startLive, endLive } = useLiveStore();

  const handleStartLive = () => {
    if (!isLiveOngoing) {
      startLive();
    } else {
      endLive();
    }
    navigate('/control');
  };

  return (
    <aside className="w-60 h-screen bg-slate-850 border-r border-slate-700/50 flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">直播运营助手</h1>
            <p className="text-[10px] text-slate-400">Live Operations</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <p className="px-3 text-xs text-slate-500 mb-2">快捷操作</p>
          <div className="space-y-1">
            <button
              onClick={handleStartLive}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isLiveOngoing
                  ? 'bg-danger/20 text-danger hover:bg-danger/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveOngoing ? 'bg-danger animate-pulse' : 'bg-success'}`}></span>
              <span className="flex items-center gap-2 font-medium">
                {isLiveOngoing ? (
                  <>
                    <Square className="w-3.5 h-3.5" fill="currentColor" />
                    结束直播
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" fill="currentColor" />
                    开始直播
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/50 to-primary-dark/50 flex items-center justify-center text-white text-sm font-medium">
              运
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">运营小王</p>
              <p className="text-xs text-slate-500 truncate">美妆类目</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
