import { useState, useMemo } from 'react';
import {
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Filter,
  Search,
  Plus,
  Upload,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Minus,
  SendToBack,
  CheckCircle2,
  RefreshCw,
  ShoppingCart,
  X,
} from 'lucide-react';
import Card from '@/components/Card/Card';
import { useLiveStore } from '@/store/useLiveStore';
import type { Danmaku, DanmakuCategory, Priority } from '@/types';
import { cn } from '@/lib/utils';

const categoryConfig: Record<DanmakuCategory, { label: string; icon: typeof Tag; color: string; bgColor: string }> = {
  '产品咨询': { label: '产品咨询', icon: ShoppingCart, color: 'text-primary', bgColor: 'bg-primary/15' },
  '价格咨询': { label: '价格咨询', icon: TrendingUp, color: 'text-warning', bgColor: 'bg-warning/15' },
  '物流售后': { label: '物流售后', icon: SendToBack, color: 'text-success', bgColor: 'bg-success/15' },
  '购买反馈': { label: '购买反馈', icon: MessageSquare, color: 'text-info', bgColor: 'bg-info/15' },
  '互动': { label: '互动闲聊', icon: MessageSquare, color: 'text-slate-300', bgColor: 'bg-slate-600/30' },
  '其他': { label: '其他', icon: Tag, color: 'text-slate-400', bgColor: 'bg-slate-700/50' },
};

const priorityLabels: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const priorityColors: Record<Priority, string> = {
  high: 'bg-danger/20 text-danger border-danger/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  low: 'bg-slate-600/30 text-slate-400 border-slate-600/30',
};

const sentimentLabels: Record<Danmaku['sentiment'], string> = {
  positive: '正面',
  neutral: '中性',
  negative: '负面',
};

const Danmaku = () => {
  const {
    danmaku,
    batchImportDanmaku,
    convertDanmakuToTask,
    markDanmakuFollowUp,
  } = useLiveStore();

  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DanmakuCategory | 'all'>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [importText, setImportText] = useState('');
  const [showFollowUpOnly, setShowFollowUpOnly] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState<Danmaku | null>(null);
  const [convertPriority, setConvertPriority] = useState<Priority>('medium');

  const stats = useMemo(() => {
    const total = danmaku.length;
    const categories: Record<DanmakuCategory, number> = {
      '产品咨询': 0, '价格咨询': 0, '物流售后': 0, '购买反馈': 0, '互动': 0, '其他': 0,
    };
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    let followUp = 0;

    danmaku.forEach(d => {
      categories[d.category]++;
      if (d.sentiment === 'positive') positive++;
      else if (d.sentiment === 'negative') negative++;
      else neutral++;
      if (d.isFollowUp) followUp++;
    });

    return { total, categories, positive, neutral, negative, followUp };
  }, [danmaku]);

  const filteredDanmaku = useMemo(() => {
    return danmaku.filter(d => {
      if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
      if (selectedSentiment !== 'all' && d.sentiment !== selectedSentiment) return false;
      if (showFollowUpOnly && !d.isFollowUp) return false;
      if (searchQuery && !d.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [danmaku, selectedCategory, selectedSentiment, searchQuery, showFollowUpOnly]);

  const highFrequencyDanmaku = useMemo(() => {
    const contentMap = new Map<string, { count: number; danmaku: Danmaku }>();
    danmaku.forEach(d => {
      const key = d.content.slice(0, 20);
      const existing = contentMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        contentMap.set(key, { count: 1, danmaku: d });
      }
    });
    return Array.from(contentMap.values())
      .filter(item => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [danmaku]);

  const handleImport = () => {
    if (!importText.trim()) return;
    batchImportDanmaku(importText);
    setImportText('');
    setActiveTab('list');
  };

  const handleConvertToTask = (d: Danmaku) => {
    setShowConvertModal(d);
    setConvertPriority('medium');
  };

  const confirmConvertToTask = () => {
    if (!showConvertModal) return;
    convertDanmakuToTask(showConvertModal.id, convertPriority);
    setShowConvertModal(null);
  };

  const handleMarkFollowUp = (id: string) => {
    markDanmakuFollowUp(id);
  };

  const getSentimentIcon = (sentiment: Danmaku['sentiment']) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-3 h-3 text-success" />;
      case 'negative': return <ThumbsDown className="w-3 h-3 text-danger" />;
      default: return <Minus className="w-3 h-3 text-slate-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">弹幕整理</h1>
          <p className="text-sm text-slate-400 mt-1">
            自动分类弹幕内容，提取高频问题，快速跟进用户反馈
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'list' ? 'import' : 'list')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'import'
                ? 'bg-primary text-white shadow-glow'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            )}
          >
            <Upload className="w-4 h-4" />
            批量导入
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-xs text-slate-400">总弹幕数</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs text-slate-400">正面</span>
          </div>
          <p className="text-2xl font-bold text-success">{stats.positive}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Minus className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">中性</span>
          </div>
          <p className="text-2xl font-bold text-slate-300">{stats.neutral}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-danger" />
            <span className="text-xs text-slate-400">负面</span>
          </div>
          <p className="text-2xl font-bold text-danger">{stats.negative}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-warning" />
            <span className="text-xs text-slate-400">待跟进</span>
          </div>
          <p className="text-2xl font-bold text-warning">{stats.followUp}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-info" />
            <span className="text-xs text-slate-400">分类数</span>
          </div>
          <p className="text-2xl font-bold text-info">
            {Object.values(stats.categories).filter(v => v > 0).length}
          </p>
        </div>
      </div>

      {activeTab === 'import' ? (
        <Card className="flex-1">
          <Card.Header>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <Card.Title>批量导入弹幕</Card.Title>
            </div>
          </Card.Header>
          <Card.Body className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                粘贴弹幕文本（每行一条）
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'这个口红是什么色号的？\n有没有优惠啊？\n物流快吗？\n主播好漂亮！\n质量怎么样，会不会掉色？'}
                className="w-full h-64 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                已输入 {importText.trim() ? importText.trim().split('\n').filter(l => l.trim()).length : 0} 条弹幕
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
                >
                  <Plus className="w-4 h-4" />
                  导入并自动分类
                </button>
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3">分类规则说明</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="text-slate-300 font-medium">产品咨询</p>
                    <p className="text-slate-500">包含产品、质量、规格、色号、好用等关键词</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning mt-1.5" />
                  <div>
                    <p className="text-slate-300 font-medium">价格咨询</p>
                    <p className="text-slate-500">包含价格、优惠、便宜、贵、多少钱、折扣等关键词</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-success mt-1.5" />
                  <div>
                    <p className="text-slate-300 font-medium">物流售后</p>
                    <p className="text-slate-500">包含快递、物流、发货、售后、退换、保修等关键词</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-info mt-1.5" />
                  <div>
                    <p className="text-slate-300 font-medium">互动闲聊</p>
                    <p className="text-slate-500">包含问候、夸赞、闲聊等非咨询类内容</p>
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            <Card className="flex-shrink-0">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <Card.Title>分类筛选</Card.Title>
                </div>
              </Card.Header>
              <Card.Body className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all',
                    selectedCategory === 'all'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'hover:bg-slate-700/40 text-slate-300'
                  )}
                >
                  <span>全部分类</span>
                  <span className="text-xs text-slate-500">{stats.total}</span>
                </button>
                {(Object.keys(categoryConfig) as DanmakuCategory[]).map(cat => {
                  const config = categoryConfig[cat];
                  const count = stats.categories[cat];
                  const Icon = config.icon;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all',
                        selectedCategory === cat
                          ? `${config.bgColor} ${config.color} border border-slate-600/30`
                          : 'hover:bg-slate-700/40 text-slate-300'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-500">{count}</span>
                    </button>
                  );
                })}
              </Card.Body>
            </Card>

            <Card className="flex-shrink-0">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-warning" />
                  <Card.Title>情感筛选</Card.Title>
                </div>
              </Card.Header>
              <Card.Body className="space-y-2">
                <button
                  onClick={() => setSelectedSentiment('all')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                    selectedSentiment === 'all'
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-slate-700/40 text-slate-300'
                  )}
                >
                  <span>全部情感</span>
                </button>
                <button
                  onClick={() => setSelectedSentiment('positive')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    selectedSentiment === 'positive'
                      ? 'bg-success/20 text-success'
                      : 'hover:bg-slate-700/40 text-slate-300'
                  )}
                >
                  <ThumbsUp className="w-4 h-4" />
                  正面
                  <span className="ml-auto text-xs text-slate-500">{stats.positive}</span>
                </button>
                <button
                  onClick={() => setSelectedSentiment('neutral')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    selectedSentiment === 'neutral'
                      ? 'bg-slate-600/40 text-slate-200'
                      : 'hover:bg-slate-700/40 text-slate-300'
                  )}
                >
                  <Minus className="w-4 h-4" />
                  中性
                  <span className="ml-auto text-xs text-slate-500">{stats.neutral}</span>
                </button>
                <button
                  onClick={() => setSelectedSentiment('negative')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    selectedSentiment === 'negative'
                      ? 'bg-danger/20 text-danger'
                      : 'hover:bg-slate-700/40 text-slate-300'
                  )}
                >
                  <ThumbsDown className="w-4 h-4" />
                  负面
                  <span className="ml-auto text-xs text-slate-500">{stats.negative}</span>
                </button>
              </Card.Body>
            </Card>

            <Card className="flex-1 flex flex-col min-h-0">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-warning" />
                  <Card.Title>高频问题</Card.Title>
                </div>
              </Card.Header>
              <Card.Body className="flex-1 overflow-y-auto p-0">
                <div className="px-4 py-2 space-y-2">
                  {highFrequencyDanmaku.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">暂无高频问题</p>
                  ) : (
                    highFrequencyDanmaku.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {item.danmaku.content}
                          </p>
                          <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium text-warning bg-warning/15 rounded">
                            {item.count}次
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded',
                            categoryConfig[item.danmaku.category].bgColor,
                            categoryConfig[item.danmaku.category].color
                          )}>
                            {categoryConfig[item.danmaku.category].label}
                          </span>
                          {!item.danmaku.isFollowUp && (
                            <button
                              onClick={() => handleConvertToTask(item.danmaku)}
                              className="ml-auto text-[10px] text-primary hover:text-primary-light transition-colors flex items-center gap-0.5"
                            >
                              <RefreshCw className="w-3 h-3" />
                              转任务
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-span-9 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-info" />
                    <Card.Title>弹幕列表</Card.Title>
                    <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">
                      {filteredDanmaku.length} 条
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="搜索弹幕内容..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 w-64 text-sm bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setShowFollowUpOnly(!showFollowUpOnly)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all',
                        showFollowUpOnly
                          ? 'bg-warning/20 text-warning border border-warning/30'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      )}
                    >
                      <Tag className="w-4 h-4" />
                      仅看待跟进
                    </button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="flex-1 overflow-y-auto p-0">
                <div className="divide-y divide-slate-700/30">
                  {filteredDanmaku.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                      <p className="text-sm">暂无弹幕数据</p>
                      <p className="text-xs mt-1">点击右上角批量导入弹幕</p>
                    </div>
                  ) : (
                    filteredDanmaku.map((d) => {
                      const catConfig = categoryConfig[d.category];
                      const CatIcon = catConfig.icon;

                      return (
                        <div
                          key={d.id}
                          className={cn(
                            'px-6 py-4 hover:bg-slate-800/30 transition-colors',
                            d.isFollowUp && 'bg-warning/5'
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                                  catConfig.bgColor,
                                  catConfig.color
                                )}>
                                  <CatIcon className="w-3 h-3" />
                                  {catConfig.label}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  {getSentimentIcon(d.sentiment)}
                                  {sentimentLabels[d.sentiment]}
                                </span>
                                <span className="text-xs text-slate-600 font-numeric">
                                  {d.timestamp}
                                </span>
                                {d.isFollowUp && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                                    待跟进
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                {d.content}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {!d.isFollowUp ? (
                                <button
                                  onClick={() => handleMarkFollowUp(d.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-warning hover:bg-warning/10 rounded-md transition-colors"
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                  标记跟进
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMarkFollowUp(d.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-warning bg-warning/10 rounded-md"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  已标记
                                </button>
                              )}
                              <button
                                onClick={() => handleConvertToTask(d)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                转待办
                              </button>
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
      )}

      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConvertModal(null)}
          />
          <div className="relative w-full max-w-md bg-slate-850 rounded-xl border border-slate-700/50 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-100">转为待办任务</h3>
              <button
                onClick={() => setShowConvertModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                <p className="text-[11px] text-slate-500 mb-1.5">弹幕内容：</p>
                <p className="text-sm text-slate-300">
                  "{showConvertModal.content}"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  任务优先级
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setConvertPriority(p)}
                      className={cn(
                        'px-3 py-2 text-xs font-medium rounded-lg border transition-all',
                        convertPriority === p
                          ? priorityColors[p]
                          : 'bg-slate-800/30 text-slate-400 border-slate-700/30 hover:bg-slate-700/30'
                      )}
                    >
                      {priorityLabels[p]}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500">
                将创建「直播后」分类的任务，并关联此弹幕内容作为任务描述。
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setShowConvertModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmConvertToTask}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
              >
                确认转换
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Danmaku;
