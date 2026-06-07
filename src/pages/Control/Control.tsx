import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Play,
  Square,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ListTodo,
  Zap,
  SkipForward,
  Clock3,
  AlertCircle,
  Package,
  Bell,
} from 'lucide-react';
import Card from '@/components/Card/Card';
import Progress from '@/components/Progress/Progress';
import { useLiveStore } from '@/store/useLiveStore';
import { formatDuration, formatTime } from '@/utils/format';
import type { ScriptNode, Task } from '@/types';
import { cn } from '@/lib/utils';

const Control = () => {
  const {
    isLiveOngoing,
    liveStartTime,
    scriptNodes,
    tasks,
    products,
    currentSession,
    startLive,
    endLive,
    completeScriptNode,
    skipScriptNode,
    delayScriptNode,
    toggleTask,
  } = useLiveStore();

  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [notifiedNodes, setNotifiedNodes] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stockThreshold = currentSession?.stockWarningThreshold || 100;
  const lowStockProducts = useMemo(
    () => products.filter(p => p.stock < stockThreshold),
    [products, stockThreshold]
  );

  useEffect(() => {
    if (!isLiveOngoing || !liveStartTime) {
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const start = new Date(liveStartTime).getTime();
      const elapsed = Math.floor((now - start) / 1000);
      setCurrentTime(now);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [isLiveOngoing, liveStartTime]);

  const { currentNode, nextNode, progressPercent, sortedNodes } = useMemo(() => {
    const sorted = [...scriptNodes]
      .filter(n => !n.isSkipped)
      .sort((a, b) => a.timeOffset - b.timeOffset);

    let currentIdx = -1;
    for (let i = 0; i < sorted.length; i++) {
      if (elapsedSeconds >= sorted[i].timeOffset) {
        currentIdx = i;
      } else {
        break;
      }
    }

    const current = currentIdx >= 0 ? sorted[currentIdx] : null;
    const next = currentIdx + 1 < sorted.length ? sorted[currentIdx + 1] : null;

    const lastNode = sorted[sorted.length - 1];
    const totalDuration = lastNode ? lastNode.timeOffset + 300 : 3600;
    const progress = Math.min(100, (elapsedSeconds / totalDuration) * 100);

    return {
      currentNode: current,
      nextNode: next,
      progressPercent: progress,
      sortedNodes: sorted,
    };
  }, [scriptNodes, elapsedSeconds]);

  useEffect(() => {
    if (currentNode && isLiveOngoing && !notifiedNodes.has(currentNode.id)) {
      setNotifiedNodes(prev => new Set([...prev, currentNode.id]));
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('场控提醒', {
          body: `当前环节：${currentNode.title}`,
          icon: '/vite.svg',
        });
      }
    }
  }, [currentNode?.id, isLiveOngoing, notifiedNodes]);

  const countdownSeconds = useMemo(() => {
    if (!isLiveOngoing || !nextNode) return 0;
    return Math.max(0, nextNode.timeOffset - elapsedSeconds);
  }, [isLiveOngoing, nextNode, elapsedSeconds]);

  const sortedTasks = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks]);

  const getNodeTypeLabel = (type: ScriptNode['type']): string => {
    const labels: Record<ScriptNode['type'], string> = {
      opening: '开场',
      product: '商品',
      interaction: '互动',
      promotion: '促销',
      closing: '收尾',
    };
    return labels[type];
  };

  const getNodeTypeClasses = (type: ScriptNode['type']): { text: string; bg: string } => {
    const classMap: Record<ScriptNode['type'], { text: string; bg: string }> = {
      opening: { text: 'text-primary', bg: 'bg-primary/20' },
      product: { text: 'text-success', bg: 'bg-success/20' },
      interaction: { text: 'text-warning', bg: 'bg-warning/20' },
      promotion: { text: 'text-danger', bg: 'bg-danger/20' },
      closing: { text: 'text-slate-400', bg: 'bg-slate-700' },
    };
    return classMap[type];
  };

  const getNodeTypeBadgeClasses = (type: ScriptNode['type']): { text: string; bg: string } => {
    const classMap: Record<ScriptNode['type'], { text: string; bg: string }> = {
      opening: { text: 'text-primary', bg: 'bg-primary/15' },
      product: { text: 'text-success', bg: 'bg-success/15' },
      interaction: { text: 'text-warning', bg: 'bg-warning/15' },
      promotion: { text: 'text-danger', bg: 'bg-danger/15' },
      closing: { text: 'text-slate-400', bg: 'bg-slate-700/50' },
    };
    return classMap[type];
  };

  const getPriorityLabel = (priority: Task['priority']): string => {
    const labels: Record<Task['priority'], string> = {
      high: '紧急',
      medium: '重要',
      low: '普通',
    };
    return labels[priority];
  };

  const getNodeStatus = (node: ScriptNode, index: number): 'completed' | 'current' | 'upcoming' | 'skipped' => {
    if (node.isSkipped) return 'skipped';
    if (node.isCompleted) return 'completed';
    if (!isLiveOngoing) {
      if (index === 0) return 'current';
      return 'upcoming';
    }
    if (currentNode?.id === node.id) return 'current';
    if (elapsedSeconds > node.timeOffset) return 'completed';
    return 'upcoming';
  };

  const formatNodeTime = (timeOffset: number): string => {
    const minutes = Math.floor(timeOffset / 60);
    const secs = timeOffset % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedTime = (timeOffset: number): string => {
    if (!liveStartTime) return '--:--';
    const start = new Date(liveStartTime).getTime();
    const target = start + timeOffset * 1000;
    return formatTime(new Date(target));
  };

  const completedTasksCount = tasks.filter(t => t.isCompleted).length;

  const handleCompleteNode = (id: string) => {
    completeScriptNode(id);
  };

  const handleSkipNode = (id: string) => {
    skipScriptNode(id);
  };

  const handleDelayNode = (id: string, minutes: number) => {
    delayScriptNode(id, minutes);
  };

  const handleStartLive = () => {
    if (!isLiveOngoing) {
      startLive();
    }
  };

  const isNodeUrgent = (node: ScriptNode): boolean => {
    if (!isLiveOngoing || node.isCompleted || node.isSkipped) return false;
    const timeToNode = node.timeOffset - elapsedSeconds;
    return timeToNode > 0 && timeToNode <= 60;
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">场控提醒</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isLiveOngoing ? '直播进行中，注意把控节奏' : '准备就绪，点击开始直播'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            isLiveOngoing
              ? 'bg-danger/20 text-danger border border-danger/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isLiveOngoing ? 'bg-danger animate-pulse' : 'bg-slate-500'
            }`} />
            {isLiveOngoing ? '直播中' : '未开播'}
          </div>
          {isLiveOngoing ? (
            <button
              onClick={endLive}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all"
            >
              <Square className="w-4 h-4" fill="currentColor" />
              结束直播
            </button>
          ) : (
            <button
              onClick={handleStartLive}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-danger text-white shadow-glow-danger hover:bg-danger-light transition-all"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              开始直播
            </button>
          )}
        </div>
      </div>

      {lowStockProducts.length > 0 && isLiveOngoing && (
        <Card className="border-warning/30">
          <Card.Body>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-warning">库存风险提醒</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  当前有 <span className="text-warning font-medium">{lowStockProducts.length}</span> 件商品库存不足，请及时关注
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lowStockProducts.slice(0, 5).map(p => (
                  <span
                    key={p.id}
                    className="px-2 py-1 text-[11px] bg-danger/10 text-danger border border-danger/30 rounded-md"
                  >
                    {p.name}（剩{p.stock}件）
                  </span>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-4 flex flex-col gap-4 min-h-0">
          <Card className="flex-1 flex flex-col">
            <Card.Header>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <Card.Title>实时看板</Card.Title>
              </div>
            </Card.Header>
            <Card.Body className="flex-1 flex flex-col justify-between">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">
                  {isLiveOngoing ? (nextNode ? '距离下一节点' : '直播即将结束') : '距离开播'}
                </p>
                <div className={`font-numeric font-bold tracking-wider ${
                  isLiveOngoing && countdownSeconds < 60 && countdownSeconds > 0
                    ? 'text-6xl text-danger animate-pulse'
                    : 'text-7xl text-white'
                }`}>
                  {isLiveOngoing
                    ? (nextNode ? formatDuration(countdownSeconds) : '00:00')
                    : '--:--'}
                </div>
                {nextNode && isLiveOngoing && (
                  <p className="text-sm text-slate-400 mt-3">
                    下一环节：<span className="text-primary font-medium">{nextNode.title}</span>
                  </p>
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">当前环节</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    currentNode
                      ? `${getNodeTypeClasses(currentNode.type).bg} ${getNodeTypeClasses(currentNode.type).text}`
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {currentNode ? getNodeTypeLabel(currentNode.type) : '等待开始'}
                  </span>
                </div>
                <div className={`text-center py-4 px-6 rounded-xl ${
                  isLiveOngoing && currentNode
                    ? 'bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 shadow-glow'
                    : 'bg-slate-800/50 border border-slate-700/50'
                }`}>
                  <p className={`text-lg font-semibold ${
                    currentNode ? 'text-white' : 'text-slate-500'
                  }`}>
                    {currentNode ? currentNode.title : '暂无进行中的环节'}
                  </p>
                  {currentNode && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {currentNode.content}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">直播总进度</span>
                  <span className="text-sm font-numeric text-slate-300">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <Progress value={progressPercent} size="lg" color="primary" />
                <div className="flex justify-between mt-2 text-xs text-slate-500 font-numeric">
                  <span>{formatDuration(elapsedSeconds)}</span>
                  <span>{formatDuration(sortedNodes[sortedNodes.length - 1]?.timeOffset || 0)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                <Card.Title>直播控制</Card.Title>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <Clock className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500">已开播时长</p>
                  <p className="text-lg font-numeric font-semibold text-slate-200 mt-1">
                    {isLiveOngoing ? formatDuration(elapsedSeconds) : '--:--'}
                  </p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-success mb-2" />
                  <p className="text-xs text-slate-500">已完成节点</p>
                  <p className="text-lg font-numeric font-semibold text-slate-200 mt-1">
                    {scriptNodes.filter(n => n.isCompleted).length} / {scriptNodes.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">低库存商品</span>
                  <span className="text-xs text-danger font-medium">
                    {lowStockProducts.length} 件
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lowStockProducts.slice(0, 4).map(p => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 text-[10px] bg-danger/10 text-danger rounded"
                    >
                      {p.name}
                    </span>
                  ))}
                  {lowStockProducts.length > 4 && (
                    <span className="px-2 py-0.5 text-[10px] bg-slate-700/50 text-slate-400 rounded">
                      +{lowStockProducts.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-span-4 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-success" />
                  <Card.Title>节点提醒</Card.Title>
                </div>
                <span className="text-xs text-slate-500">
                  共 {scriptNodes.length} 个节点
                </span>
              </div>
            </Card.Header>
            <Card.Body className="flex-1 overflow-y-auto p-0">
              <div className="px-5 py-2 space-y-2">
                {sortedNodes.map((node, index) => {
                  const status = getNodeStatus(node, index);
                  const isCurrent = status === 'current';
                  const isCompleted = status === 'completed';
                  const isSkipped = status === 'skipped';
                  const isUrgent = isNodeUrgent(node);

                  return (
                    <div
                      key={node.id}
                      className={cn(
                        'relative p-4 rounded-xl border transition-all',
                        isSkipped
                          ? 'bg-slate-800/20 border-slate-700/30 opacity-40'
                          : isCurrent && isLiveOngoing
                          ? 'bg-primary/10 border-primary/50 shadow-glow'
                          : isCompleted
                          ? 'bg-slate-800/30 border-slate-700/30 opacity-60'
                          : isUrgent
                          ? 'bg-warning/10 border-warning/40 animate-pulse'
                          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/40 hover:border-slate-600'
                      )}
                    >
                      {isCurrent && isLiveOngoing && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full animate-pulse" />
                      )}
                      {isUrgent && !isCompleted && !isSkipped && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-3 h-3 bg-warning rounded-full flex items-center justify-center">
                            <Bell className="w-2 h-2 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {isSkipped ? (
                            <span className="text-xs text-slate-500">跳过</span>
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : isCurrent && isLiveOngoing ? (
                            <div className="relative">
                              <Circle className="w-5 h-5 text-primary fill-primary/20" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              </div>
                            </div>
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isSkipped || isCompleted
                                ? 'bg-slate-700/50 text-slate-500'
                                : `${getNodeTypeBadgeClasses(node.type).bg} ${getNodeTypeBadgeClasses(node.type).text}`
                            }`}>
                              {getNodeTypeLabel(node.type)}
                            </span>
                            <span className="text-xs text-slate-500 font-numeric">
                              {formatNodeTime(node.timeOffset)}
                            </span>
                            {isUrgent && !isCompleted && !isSkipped && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                                即将开始
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            'text-sm font-medium mt-1.5',
                            isSkipped || isCompleted
                              ? 'text-slate-500 line-through'
                              : 'text-slate-200'
                          )}>
                            {node.title}
                          </p>
                          <p className={cn(
                            'text-xs mt-1 line-clamp-2',
                            isSkipped || isCompleted
                              ? 'text-slate-600'
                              : 'text-slate-400'
                          )}>
                            {node.content}
                          </p>
                          {!isCompleted && !isSkipped && !isCurrent && (
                            <p className="text-xs text-slate-500 mt-2 font-numeric">
                              预计 {getEstimatedTime(node.timeOffset)} 开始
                            </p>
                          )}

                          {isLiveOngoing && !isSkipped && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/30">
                              {!isCompleted ? (
                                <>
                                  <button
                                    onClick={() => handleCompleteNode(node.id)}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-success bg-success/10 hover:bg-success/20 rounded-md transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    标记已播
                                  </button>
                                  <button
                                    onClick={() => handleDelayNode(node.id, 5)}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-warning bg-warning/10 hover:bg-warning/20 rounded-md transition-colors"
                                  >
                                    <Clock3 className="w-3.5 h-3.5" />
                                    延后5分
                                  </button>
                                  <button
                                    onClick={() => handleSkipNode(node.id)}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-400 bg-slate-700/30 hover:bg-slate-700/50 rounded-md transition-colors"
                                  >
                                    <SkipForward className="w-3.5 h-3.5" />
                                    跳过
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleCompleteNode(node.id)}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-400 bg-slate-700/30 hover:bg-slate-700/50 rounded-md transition-colors"
                                >
                                  <Circle className="w-3.5 h-3.5" />
                                  撤销完成
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-span-4 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  <Card.Title>待办任务</Card.Title>
                </div>
                <span className="text-xs text-slate-500">
                  {completedTasksCount} / {tasks.length}
                </span>
              </div>
            </Card.Header>
            <Card.Body className="flex-1 overflow-y-auto p-0">
              <div className="px-5 py-2 space-y-2">
                {sortedTasks.map((task) => {
                  const isHighPriority = task.priority === 'high' && !task.isCompleted;

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer transition-all',
                        task.isCompleted
                          ? 'bg-slate-800/20 border-slate-700/30 opacity-50'
                          : isHighPriority
                          ? 'bg-danger/10 border-danger/40 hover:bg-danger/15'
                          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/40 hover:border-slate-600'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                            task.isCompleted
                              ? 'bg-success border-success'
                              : isHighPriority
                              ? 'border-danger'
                              : 'border-slate-500'
                          )}
                        >
                          {task.isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              task.isCompleted
                                ? 'bg-slate-700/50 text-slate-500'
                                : task.priority === 'high'
                                ? 'bg-danger/20 text-danger'
                                : task.priority === 'medium'
                                ? 'bg-warning/20 text-warning'
                                : 'bg-slate-600/50 text-slate-400'
                            )}>
                              {getPriorityLabel(task.priority)}
                            </span>
                            <span className="text-xs text-slate-500">{task.category}</span>
                          </div>
                          <p className={cn(
                            'text-sm font-medium mt-1.5',
                            task.isCompleted
                              ? 'text-slate-500 line-through'
                              : isHighPriority
                              ? 'text-white'
                              : 'text-slate-200'
                          )}>
                            {task.title}
                          </p>
                          <p className={cn(
                            'text-xs mt-1',
                            task.isCompleted ? 'text-slate-600' : 'text-slate-400'
                          )}>
                            {task.description}
                          </p>
                          {task.sourceDanmakuContent && !task.isCompleted && (
                            <div className="mt-2 p-2 bg-slate-700/30 rounded-md">
                              <p className="text-[10px] text-slate-500 mb-0.5">来源弹幕：</p>
                              <p className="text-xs text-slate-400 line-clamp-1">
                                "{task.sourceDanmakuContent}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
            <Card.Footer>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>任务完成率</span>
                <span className="font-numeric">{tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0}%</span>
              </div>
              <div className="mt-2">
                <Progress value={completedTasksCount} max={tasks.length || 1} size="sm" color="success" />
              </div>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Control;
