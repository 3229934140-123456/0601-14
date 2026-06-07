import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  MessageCircle,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Calendar,
  Play,
} from 'lucide-react';
import Card from '@/components/Card/Card';
import StatCard from '@/components/Card/StatCard';
import { useLiveStore } from '@/store/useLiveStore';
import { formatCurrency, formatNumber, formatDateTime, formatPercent } from '@/utils/format';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    currentSession,
    sessions,
    products,
    tasks,
    danmaku,
    initStore,
    isLiveOngoing,
    liveStartTime,
  } = useLiveStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const pendingTasks = tasks.filter(t => !t.isCompleted).length;
  const highPriorityTasks = tasks.filter(t => !t.isCompleted && t.priority === 'high').length;

  const quickActions = [
    { label: '账号检查', path: '/account-check', icon: CheckCircle2, color: 'primary' as const },
    { label: '商品清单', path: '/products', icon: ShoppingBag, color: 'success' as const },
    { label: '脚本排程', path: '/script', icon: Calendar, color: 'warning' as const },
    { label: '开始直播', path: '/control', icon: Play, color: 'danger' as const },
  ];

  const recentSessions = sessions.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">直播运营总览</h1>
          <p className="text-sm text-slate-400 mt-1">
            {currentSession ? `当前场次: ${currentSession.title}` : '欢迎使用直播运营助手'}
          </p>
        </div>
        <button
          onClick={() => navigate('/control')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isLiveOngoing
              ? 'bg-danger text-white shadow-glow-danger animate-pulse-slow'
              : 'bg-primary text-white shadow-glow hover:shadow-glow-hover'
          }`}
        >
          <Play className="w-4 h-4" fill="currentColor" />
          {isLiveOngoing ? '直播进行中' : '开始直播'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colorMap = {
            primary: 'from-primary/20 to-primary/5 border-primary/30 text-primary',
            success: 'from-success/20 to-success/5 border-success/30 text-success',
            warning: 'from-warning/20 to-warning/5 border-warning/30 text-warning',
            danger: 'from-danger/20 to-danger/5 border-danger/30 text-danger',
          };
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`p-5 rounded-xl border bg-gradient-to-br ${colorMap[action.color]} transition-all hover:scale-[1.02] card-hover text-left`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6" />
                  <span className="font-medium">{action.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-60" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="观看人数"
          value={formatNumber(currentSession?.viewerCount || 0)}
          icon={<Users className="w-5 h-5" />}
          trend="12.5%"
          trendUp
          color="primary"
        />
        <StatCard
          title="成交金额"
          value={formatCurrency(currentSession?.transactionAmount || 0)}
          icon={<DollarSign className="w-5 h-5" />}
          trend="8.3%"
          trendUp
          color="success"
        />
        <StatCard
          title="互动率"
          value={formatPercent(currentSession?.interactionRate || 0)}
          icon={<MessageCircle className="w-5 h-5" />}
          trend="2.1%"
          trendUp
          color="warning"
        />
        <StatCard
          title="商品数量"
          value={products.length}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>待办任务</Card.Title>
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-xs text-primary hover:text-primary-light transition-colors"
                >
                  查看全部
                </button>
              </div>
            </Card.Header>
            <Card.Body>
              {highPriorityTasks > 0 && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-danger" />
                    <span className="text-sm font-medium text-danger">
                      {highPriorityTasks} 个高优先级任务待完成
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      task.isCompleted ? 'bg-slate-800/30' : 'bg-slate-800/60 hover:bg-slate-700/40'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.priority === 'high'
                          ? 'bg-danger'
                          : task.priority === 'medium'
                          ? 'bg-warning'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span
                      className={`flex-1 text-sm ${
                        task.isCompleted
                          ? 'text-slate-500 line-through'
                          : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>已完成 {completedTasks} / {tasks.length}</span>
                <span>{Math.round((completedTasks / tasks.length) * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full progress-transition"
                  style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
                />
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>弹幕动态</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {danmaku.slice(-8).reverse().map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2.5 bg-slate-800/40 rounded-lg"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-primary-dark/40 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                      {item.user.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-300">{item.user}</span>
                        <span className="text-[10px] text-slate-500">
                          {item.timestamp.slice(11, 16)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5 truncate">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>直播状态</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-4">
                <div
                  className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    isLiveOngoing
                      ? 'bg-danger/20 shadow-glow-danger'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <Clock className={`w-10 h-10 ${isLiveOngoing ? 'text-danger' : 'text-slate-500'}`} />
                </div>
                <p className="text-lg font-semibold text-slate-100">
                  {isLiveOngoing ? '直播进行中' : '准备中'}
                </p>
                {isLiveOngoing && liveStartTime && (
                  <p className="text-sm text-slate-400 mt-1 font-numeric">
                    已开播 {formatDateTime(liveStartTime)}
                  </p>
                )}
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">商品已上架</span>
                  <span className="text-slate-200 font-medium">
                    {products.filter(p => p.onShelfTime).length} / {products.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">待办任务</span>
                  <span className="text-warning font-medium">{pendingTasks} 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">弹幕数量</span>
                  <span className="text-slate-200 font-medium">{danmaku.length}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>历史场次</Card.Title>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                    onClick={() => {
                      useLiveStore.getState().loadSession(session.id);
                      navigate('/review');
                    }}
                  >
                    <p className="text-sm font-medium text-slate-200 truncate">{session.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(session.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">
                        {formatNumber(session.viewerCount)} 观看
                      </span>
                      <span className="text-sm font-medium text-success">
                        {formatCurrency(session.transactionAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
