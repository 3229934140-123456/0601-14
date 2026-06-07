import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Trophy,
  Clock,
  User,
} from 'lucide-react';
import Card from '@/components/Card/Card';
import { useLiveStore } from '@/store/useLiveStore';
import type { Sentiment, Danmaku as DanmakuType } from '@/types';
import { mockHighFrequencyQuestions } from '@/utils/mockData';
import { formatDateTime } from '@/utils/format';

const Danmaku = () => {
  const { danmaku } = useLiveStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | 'all'>('all');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const sentimentStats = useMemo(() => {
    const total = danmaku.length;
    const positive = danmaku.filter((d) => d.sentiment === 'positive').length;
    const negative = danmaku.filter((d) => d.sentiment === 'negative').length;
    const neutral = danmaku.filter((d) => d.sentiment === 'neutral').length;

    return {
      total,
      positive,
      negative,
      neutral,
      positivePercent: total > 0 ? ((positive / total) * 100).toFixed(1) : '0',
      negativePercent: total > 0 ? ((negative / total) * 100).toFixed(1) : '0',
      neutralPercent: total > 0 ? ((neutral / total) * 100).toFixed(1) : '0',
    };
  }, [danmaku]);

  const filteredDanmaku = useMemo(() => {
    return danmaku.filter((item) => {
      if (searchKeyword && !item.content.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }

      if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) {
        return false;
      }

      if (startTime && new Date(item.timestamp) < new Date(startTime)) {
        return false;
      }

      if (endTime && new Date(item.timestamp) > new Date(endTime + 'T23:59:59')) {
        return false;
      }

      return true;
    });
  }, [danmaku, searchKeyword, sentimentFilter, startTime, endTime]);

  const maxCount = mockHighFrequencyQuestions[0]?.count || 1;

  const getSentimentLabel = (sentiment: Sentiment) => {
    const labels = {
      positive: '正面',
      negative: '负面',
      neutral: '中性',
    };
    return labels[sentiment];
  };

  const getSentimentColor = (sentiment: Sentiment) => {
    const colors = {
      positive: 'bg-success/15 text-success border-success/30',
      negative: 'bg-danger/15 text-danger border-danger/30',
      neutral: 'bg-slate-600/30 text-slate-400 border-slate-600/50',
    };
    return colors[sentiment];
  };

  const getRankStyle = (index: number) => {
    if (index === 0) {
      return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white';
    }
    if (index === 1) {
      return 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800';
    }
    if (index === 2) {
      return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
    }
    return 'bg-slate-700/60 text-slate-400';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      产品咨询: 'bg-primary/15 text-primary',
      价格咨询: 'bg-warning/15 text-warning',
      物流咨询: 'bg-info/15 text-info',
      购买反馈: 'bg-success/15 text-success',
      互动: 'bg-purple-500/15 text-purple-400',
    };
    return colorMap[category] || 'bg-slate-600/30 text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">弹幕整理</h1>
          <p className="text-sm text-slate-400 mt-1">分析直播弹幕数据，洞察观众反馈</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-warning" />
                <Card.Title>高频问题排行</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {mockHighFrequencyQuestions.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${getRankStyle(index)}`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm text-slate-200 truncate">{item.question}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-numeric w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <Card.Title>反馈汇总</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                      <ThumbsUp className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">正面反馈</p>
                      <p className="text-xs text-slate-400">积极评价与支持</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-success font-numeric">
                      {sentimentStats.positive}
                    </p>
                    <p className="text-xs text-success/70">{sentimentStats.positivePercent}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-danger/10 rounded-lg border border-danger/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-danger/20 flex items-center justify-center">
                      <ThumbsDown className="w-5 h-5 text-danger" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">负面反馈</p>
                      <p className="text-xs text-slate-400">投诉与不满</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-danger font-numeric">
                      {sentimentStats.negative}
                    </p>
                    <p className="text-xs text-danger/70">{sentimentStats.negativePercent}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-600/40 flex items-center justify-center">
                      <Minus className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">中性反馈</p>
                      <p className="text-xs text-slate-400">疑问与咨询</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-300 font-numeric">
                      {sentimentStats.neutral}
                    </p>
                    <p className="text-xs text-slate-500">{sentimentStats.neutralPercent}%</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">总弹幕数</span>
                    <span className="font-medium text-slate-200 font-numeric">
                      {sentimentStats.total} 条
                    </span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <Card.Title>弹幕筛选</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索弹幕关键词..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">情感分类</label>
                  <select
                    value={sentimentFilter}
                    onChange={(e) => setSentimentFilter(e.target.value as Sentiment | 'all')}
                    className="px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="all">全部</option>
                    <option value="positive">正面</option>
                    <option value="negative">负面</option>
                    <option value="neutral">中性</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">开始时间</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">结束时间</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-10 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span>共找到</span>
                <span className="text-primary font-medium">{filteredDanmaku.length}</span>
                <span>条弹幕</span>
              </div>
            </Card.Body>
          </Card>

          <Card className="flex flex-col">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <Card.Title>弹幕列表</Card.Title>
                </div>
                <span className="text-xs text-slate-400">
                  共 {filteredDanmaku.length} 条
                </span>
              </div>
            </Card.Header>
            <Card.Body className="flex-1 p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {filteredDanmaku.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">暂无符合条件的弹幕</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {filteredDanmaku.map((item: DanmakuType) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-4 hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-primary-dark/40 flex items-center justify-center text-sm text-white font-medium shrink-0">
                          {item.user.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-sm font-medium text-slate-300">{item.user}</span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {formatDateTime(item.timestamp)}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${getSentimentColor(item.sentiment)}`}
                            >
                              {getSentimentLabel(item.sentiment)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">{item.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Danmaku;
