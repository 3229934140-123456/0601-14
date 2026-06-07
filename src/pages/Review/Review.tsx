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
  ShoppingBag,
  CheckSquare,
  BarChart3,
  Sparkles,
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
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatTime,
  formatDuration,
} from '@/utils/format';
import type { AbnormalType, ReviewPoint as ReviewPointType, PeakData } from '@/types';

const Review = () => {
  const {
    currentSession,
    abnormalEvents,
    reviewPoints,
    addReviewPoint,
    deleteReviewPoint,
    peakData,
    products,
    tasks,
    danmaku,
    scriptNodes,
  } = useLiveStore();

  const [newPointType, setNewPointType] = useState<ReviewPointType['type']>('good');
  const [newPointContent, setNewPointContent] = useState('');

  const averageOrderValue = useMemo(() => {
    if (!currentSession || currentSession.viewerCount === 0) return 0;
    const conversionRate = 0.05;
    const buyerCount = Math.floor(currentSession.viewerCount * conversionRate);
    return buyerCount > 0 ? currentSession.transactionAmount / buyerCount : 0;
  }, [currentSession]);

  const sessionPeakData = useMemo(() => {
    if (peakData && peakData.length > 0) {
      return peakData;
    }
    if (products.length > 0 && danmaku.length > 0) {
      return generateSimulatedPeakData();
    }
    return [];
  }, [peakData, products, danmaku]);

  const generateSimulatedPeakData = (): PeakData[] => {
    const simulated: PeakData[] = [];
    const productList = products.slice(0, Math.min(5, products.length));
    const totalNodes = scriptNodes.length || 5;

    productList.forEach((product, idx) => {
      const timeOffset = Math.floor((idx + 1) * (120 / productList.length));
      const hours = 19 + Math.floor(timeOffset / 60);
      const minutes = timeOffset % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const baseAmount = product.price * (10 + Math.floor(Math.random() * 20));
      const amount = Math.floor(baseAmount * (0.8 + Math.random() * 0.4));

      simulated.push({
        time: timeStr,
        amount,
        productId: product.id,
        productName: product.name,
      });
    });

    return simulated.sort((a, b) => a.time.localeCompare(b.time));
  };

  const peakDataSorted = useMemo(() => {
    return [...sessionPeakData].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [sessionPeakData]);

  const maxAmount = useMemo(() => {
    if (sessionPeakData.length === 0) return 0;
    return Math.max(...sessionPeakData.map((item) => item.amount));
  }, [sessionPeakData]);

  const hasRealPeakData = peakData && peakData.length > 0;

  const completionStats = useMemo(() => {
    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const totalTasks = tasks.length;
    const completedNodes = scriptNodes.filter((n) => n.isCompleted).length;
    const totalNodes = scriptNodes.length;
    const onShelfProducts = products.filter((p) => p.onShelfTime).length;

    return {
      completedTasks,
      totalTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      completedNodes,
      totalNodes,
      nodeCompletionRate: totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0,
      onShelfProducts,
      totalProducts: products.length,
    };
  }, [tasks, scriptNodes, products]);

  const danmakuStats = useMemo(() => {
    const productQuestions = danmaku.filter((d) => d.category === '产品咨询').length;
    const priceQuestions = danmaku.filter((d) => d.category === '价格咨询').length;
    const positiveDanmaku = danmaku.filter((d) => d.sentiment === 'positive').length;
    const negativeDanmaku = danmaku.filter((d) => d.sentiment === 'negative').length;

    return {
      productQuestions,
      priceQuestions,
      positiveDanmaku,
      negativeDanmaku,
      totalDanmaku: danmaku.length,
      positiveRate: danmaku.length > 0 ? Math.round((positiveDanmaku / danmaku.length) * 100) : 0,
    };
  }, [danmaku]);

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

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <Card.Title>复盘摘要</Card.Title>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-7 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-slate-400 mb-1">任务完成率</p>
              <p className="text-lg font-bold text-slate-100 font-numeric">
                {completionStats.taskCompletionRate}%
              </p>
              <p className="text-xs text-slate-500">
                {completionStats.completedTasks}/{completionStats.totalTasks}
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-success/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-success" />
              </div>
              <p className="text-xs text-slate-400 mb-1">脚本节点完成率</p>
              <p className="text-lg font-bold text-slate-100 font-numeric">
                {completionStats.nodeCompletionRate}%
              </p>
              <p className="text-xs text-slate-500">
                {completionStats.completedNodes}/{completionStats.totalNodes}
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-warning/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-warning" />
              </div>
              <p className="text-xs text-slate-400 mb-1">已上架商品</p>
              <p className="text-lg font-bold text-slate-100 font-numeric">
                {completionStats.onShelfProducts}
              </p>
              <p className="text-xs text-slate-500">
                共 {completionStats.totalProducts} 件
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-success/10 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-success" />
              </div>
              <p className="text-xs text-slate-400 mb-1">弹幕正面率</p>
              <p className="text-lg font-bold text-slate-100 font-numeric">
                {danmakuStats.positiveRate}%
              </p>
              <p className="text-xs text-slate-500">
                {danmakuStats.positiveDanmaku}/{danmakuStats.totalDanmaku}
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-slate-400 mb-1">产品咨询</p>
              <p className="text-lg font-bold text-slate-100 font-numeric">
                {danmakuStats.productQuestions}
              </p>
              <p className="text-xs text-slate-500">
                条
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-warning" />
              </div>
              <p className="text-xs text-slate-400 mb-1">价格咨询</p>
              <p className="text-lg font-bold text-slate-100 font-numeric">
                {danmakuStats.priceQuestions}
              </p>
              <p className="text-xs text-slate-500">
                条
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-danger/10 flex items-center justify-center">
                <ThumbsDown className="w-5 h-5 text-danger" />
              </div>
              <p className="text-xs text-slate-400 mb-1">负面反馈</p>
              <p className="text-lg font-bold text-slate-100 font-numeric">
                {danmakuStats.negativeDanmaku}
              </p>
              <p className="text-xs text-slate-500">
                条
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Card.Title>成交趋势图</Card.Title>
                  {!hasRealPeakData && (
                    <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30">
                      数据为模拟生成
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span>峰值: {formatCurrency(maxAmount)}</span>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sessionPeakData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                    {sessionPeakData
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
                <div className="flex items-center gap-2">
                  <Card.Title>成交峰值分析</Card.Title>
                  {!hasRealPeakData && (
                    <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30">
                      数据为模拟生成
                    </span>
                  )}
                </div>
                <Tag className="w-4 h-4 text-slate-400" />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {peakDataSorted.map((peak, index) => (
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
