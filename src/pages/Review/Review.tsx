import { useState, useMemo } from 'react';
import {
  Users,
  DollarSign,
  MessageCircle,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  Plus,
  X,
  Clock,
  Tag,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import Card from '@/components/Card/Card';
import StatCard from '@/components/Card/StatCard';
import { useLiveStore } from '@/store/useLiveStore';
import { mockPeakData } from '@/utils/mockData';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatTime,
  formatDuration,
} from '@/utils/format';
import type { AbnormalType, ReviewPoint as ReviewPointType, PeakData } from '@/types';

const Review = () => {
  const { currentSession, abnormalEvents, reviewPoints, addReviewPoint, deleteReviewPoint } =
    useLiveStore();

  const [newPointType, setNewPointType] = useState<ReviewPointType['type']>('good');
  const [newPointContent, setNewPointContent] = useState('');

  const averageOrderValue = useMemo(() => {
    if (!currentSession || currentSession.viewerCount === 0) return 0;
    const conversionRate = 0.05;
    const buyerCount = Math.floor(currentSession.viewerCount * conversionRate);
    return buyerCount > 0 ? currentSession.transactionAmount / buyerCount : 0;
  }, [currentSession]);

  const peakData = useMemo(() => {
    return mockPeakData.sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, []);

  const maxAmount = useMemo(() => {
    return Math.max(...mockPeakData.map((item) => item.amount));
  }, []);

  const handleAddPoint = () => {
    if (!newPointContent.trim()) return;
    addReviewPoint({
      content: newPointContent.trim(),
      type: newPointType,
    });
    setNewPointContent('');
  };

  const getAbnormalTypeConfig = (type: AbnormalType) => {
    const configs = {
      technical: {
        label: '技术',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/30',
        icon: Wrench,
      },
      content: {
        label: '内容',
        color: 'text-danger',
        bgColor: 'bg-danger/10',
        borderColor: 'border-danger/30',
        icon: AlertCircle,
      },
      emergency: {
        label: '紧急',
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10',
        borderColor: 'border-purple-400/30',
        icon: Zap,
      },
    };
    return configs[type];
  };

  const getReviewTypeConfig = (type: ReviewPointType['type']) => {
    const configs = {
      good: {
        label: '做得好的',
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/30',
        icon: ThumbsUp,
      },
      bad: {
        label: '待改进的',
        color: 'text-danger',
        bgColor: 'bg-danger/10',
        borderColor: 'border-danger/30',
        icon: ThumbsDown,
      },
      improvement: {
        label: '需优化的',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
        icon: TrendingUp,
      },
    };
    return configs[type];
  };

  const goodPoints = reviewPoints.filter((p) => p.type === 'good');
  const badPoints = reviewPoints.filter((p) => p.type === 'bad');
  const improvementPoints = reviewPoints.filter((p) => p.type === 'improvement');

  const renderReviewList = (points: ReviewPointType[], type: ReviewPointType['type']) => {
    const config = getReviewTypeConfig(type);
    const Icon = config.icon;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label} ({points.length})
          </span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {points.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">暂无记录</p>
          ) : (
            points.map((point) => (
              <div
                key={point.id}
                className={`group flex items-start gap-2 p-3 rounded-lg ${config.bgColor} ${config.borderColor} border`}
              >
                <p className="flex-1 text-sm text-slate-200">{point.content}</p>
                <button
                  onClick={() => deleteReviewPoint(point.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-danger shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: PeakData }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-slate-300 mb-1">{label}</p>
          <p className="text-lg font-bold text-success font-numeric">
            {formatCurrency(data.amount)}
          </p>
          {data.productName && (
            <p className="text-xs text-slate-400 mt-1">
              商品: {data.productName}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">复盘报表</h1>
        <p className="text-sm text-slate-400 mt-1">
          {currentSession
            ? `${currentSession.title} - 直播数据复盘分析`
            : '请选择一场直播进行复盘'}
        </p>
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
          title="客单价"
          value={formatCurrency(averageOrderValue)}
          icon={<ShoppingCart className="w-5 h-5" />}
          trend="5.7%"
          trendUp
          color="primary"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>成交趋势图</Card.Title>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span>峰值: {formatCurrency(maxAmount)}</span>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockPeakData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis
                      dataKey="time"
                      stroke="#64748B"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#colorAmount)"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4, stroke: '#0F172A' }}
                      activeDot={{ r: 6, fill: '#10B981', stroke: '#0F172A', strokeWidth: 2 }}
                    />
                    {mockPeakData
                      .filter((item) => item.amount === maxAmount)
                      .map((item, index) => (
                        <ReferenceDot
                          key={index}
                          x={item.time}
                          y={item.amount}
                          r={8}
                          fill="#F59E0B"
                          stroke="#0F172A"
                          strokeWidth={2}
                        />
                      ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>成交峰值分析</Card.Title>
                <Tag className="w-4 h-4 text-slate-400" />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {peakData.map((peak, index) => (
                  <div
                    key={peak.time}
                    className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800/70 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? 'bg-warning/20 text-warning'
                          : index === 1
                          ? 'bg-slate-400/20 text-slate-300'
                          : index === 2
                          ? 'bg-amber-700/20 text-amber-600'
                          : 'bg-slate-700/50 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">
                          {peak.productName}
                        </span>
                        <span className="text-sm font-bold text-success font-numeric">
                          {formatCurrency(peak.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">{peak.time}</span>
                      </div>
                    </div>
                    <div className="w-24 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-success/50 to-success rounded-full"
                        style={{ width: `${(peak.amount / maxAmount) * 100}%` }}
                      />
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
              <div className="flex items-center justify-between">
                <Card.Title>异常事件</Card.Title>
                <div className="flex items-center gap-1 text-xs text-danger">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{abnormalEvents.length} 条</span>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {abnormalEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">暂无异常事件</p>
                ) : (
                  abnormalEvents.map((event) => {
                    const config = getAbnormalTypeConfig(event.type);
                    const Icon = config.icon;
                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg ${config.bgColor} ${config.color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${config.color} px-2 py-0.5 rounded ${config.bgColor}`}>
                                {config.label}
                              </span>
                              <span className="text-xs text-slate-500 font-numeric">
                                {formatTime(event.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-200 mt-2">{event.description}</p>
                            {event.duration > 0 && (
                              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                持续 {formatDuration(event.duration)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>复盘要点</Card.Title>
            <div className="flex items-center gap-2">
              <select
                value={newPointType}
                onChange={(e) => setNewPointType(e.target.value as ReviewPointType['type'])}
                className="text-xs bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-200 focus:border-primary/50"
              >
                <option value="good">做得好的</option>
                <option value="bad">待改进的</option>
                <option value="improvement">需优化的</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  value={newPointContent}
                  onChange={(e) => setNewPointContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPoint()}
                  placeholder="添加复盘要点..."
                  className="text-sm bg-slate-700/50 border border-slate-600 rounded-lg pl-3 pr-10 py-1.5 w-64 text-slate-200 placeholder-slate-500 focus:border-primary/50"
                />
                <button
                  onClick={handleAddPoint}
                  disabled={!newPointContent.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-3 gap-6">
            {renderReviewList(goodPoints, 'good')}
            {renderReviewList(badPoints, 'bad')}
            {renderReviewList(improvementPoints, 'improvement')}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Review;
