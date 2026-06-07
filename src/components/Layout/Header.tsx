import { Bell, Settings, ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveStore } from '@/store/useLiveStore';
import { formatFullDate } from '@/utils/format';
import { cn } from '@/lib/utils';

const Header = () => {
  const navigate = useNavigate();
  const { currentSession, sessions, switchSession, createSession } = useLiveStore();
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    startTime: '',
    category: '美妆',
    targetAmount: 0,
    owner: '运营小王',
  });

  const handleCreateSession = () => {
    if (!newSessionData.title.trim() || !newSessionData.startTime) return;
    createSession({
      title: newSessionData.title,
      startTime: new Date(newSessionData.startTime).toISOString(),
      category: newSessionData.category,
      targetAmount: newSessionData.targetAmount,
      owner: newSessionData.owner,
    });
    setShowNewSessionModal(false);
    setShowSessionDropdown(false);
    setNewSessionData({
      title: '',
      startTime: '',
      category: '美妆',
      targetAmount: 0,
      owner: '运营小王',
    });
  };

  return (
    <header className="h-16 bg-slate-850/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowSessionDropdown(!showSessionDropdown)}
            className="flex items-center gap-2 hover:bg-slate-700/30 px-3 py-2 rounded-lg transition-colors"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-100 text-left">
                {currentSession?.title || '未命名场次'}
              </h2>
              <p className="text-xs text-slate-500 text-left">
                {currentSession ? formatFullDate(currentSession.startTime) : ''}
              </p>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', showSessionDropdown && 'rotate-180')} />
          </button>

          {showSessionDropdown && (
            <>
              <div className="absolute inset-0 w-full h-full" onClick={() => setShowSessionDropdown(false)} />
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-850 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-2 border-b border-slate-700/50">
                  <button
                    onClick={() => {
                      setShowSessionDropdown(false);
                      setShowNewSessionModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新建直播场次
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        switchSession(session.id);
                        setShowSessionDropdown(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md transition-colors',
                        currentSession?.id === session.id
                          ? 'bg-primary/15 text-primary'
                          : 'text-slate-300 hover:bg-slate-700/40'
                      )}
                    >
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatFullDate(session.startTime)} · {session.category}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        <button className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewSessionModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-850 rounded-xl border border-slate-700/50 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-100">新建直播场次</h3>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  直播标题
                </label>
                <input
                  type="text"
                  value={newSessionData.title}
                  onChange={(e) => setNewSessionData({ ...newSessionData, title: e.target.value })}
                  placeholder="请输入直播标题"
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  开播时间
                </label>
                <input
                  type="datetime-local"
                  value={newSessionData.startTime}
                  onChange={(e) => setNewSessionData({ ...newSessionData, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    类目
                  </label>
                  <select
                    value={newSessionData.category}
                    onChange={(e) => setNewSessionData({ ...newSessionData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  >
                    <option value="美妆">美妆</option>
                    <option value="服饰">服饰</option>
                    <option value="食品">食品</option>
                    <option value="家居">家居</option>
                    <option value="数码">数码</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    负责人
                  </label>
                  <input
                    type="text"
                    value={newSessionData.owner}
                    onChange={(e) => setNewSessionData({ ...newSessionData, owner: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  目标成交额（元）
                </label>
                <input
                  type="number"
                  value={newSessionData.targetAmount}
                  onChange={(e) => setNewSessionData({ ...newSessionData, targetAmount: Number(e.target.value) })}
                  min="0"
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!newSessionData.title.trim() || !newSessionData.startTime}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建场次
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
