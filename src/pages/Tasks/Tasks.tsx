import { useState, useMemo } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  Layers,
  CheckSquare,
  Download,
  Save,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Plus,
  LayoutTemplate,
  ChevronRight,
  Filter,
  MessageSquare,
  Tag,
  TrendingUp,
  User,
  Package,
  History,
  Target,
} from 'lucide-react';
import Card from '@/components/Card/Card';
import { useLiveStore } from '@/store/useLiveStore';
import { formatCurrency, formatNumber, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { LiveStatus, Priority, Task } from '@/types';

type TabType = 'sessions' | 'templates' | 'tasks';
type TaskCategory = 'all' | '开播前' | '直播中' | '直播后';

const statusLabels: Record<LiveStatus, string> = {
  draft: '草稿',
  ongoing: '进行中',
  completed: '已完成',
};

const statusColors: Record<LiveStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  ongoing: 'bg-success/20 text-success border-success/30',
  completed: 'bg-primary/20 text-primary border-primary/30',
};

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const priorityColors: Record<Priority, string> = {
  high: 'bg-danger/20 text-danger border-danger/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const Tasks = () => {
  const {
    sessions,
    templates,
    tasks,
    teamMembers,
    operationLogs,
    currentSession,
    saveAsTemplate,
    applyTemplate,
    deleteTemplate,
    deleteSession,
    switchSession,
    toggleTask,
    addTask,
    createSession,
  } = useLiveStore();

  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('all');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('直播中');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    startTime: '',
    category: '美妆',
    targetAmount: 0,
    owner: '运营小王',
  });
  const [confirmAction, setConfirmAction] = useState<{
    type: 'applyTemplate' | 'deleteTemplate' | 'deleteSession';
    id: string;
    name: string;
  } | null>(null);

  const tabs = [
    { key: 'tasks' as TabType, label: '任务追踪', icon: CheckSquare },
    { key: 'sessions' as TabType, label: '场次管理', icon: Calendar },
    { key: 'templates' as TabType, label: '模板管理', icon: Layers },
  ];

  const taskCategories: { key: TaskCategory; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: '开播前', label: '开播前' },
    { key: '直播中', label: '直播中' },
    { key: '直播后', label: '直播后' },
  ];

  const filteredTasks = useMemo(() => {
    if (taskCategory === 'all') {
      return tasks;
    }
    return tasks.filter((t) => t.category === taskCategory);
  }, [tasks, taskCategory]);

  const completedCount = filteredTasks.filter((t) => t.isCompleted).length;
  const totalCount = filteredTasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const danmakuSourceTasks = useMemo(() => {
    return tasks.filter(t => t.sourceDanmakuId);
  }, [tasks]);

  const sortedOperationLogs = useMemo(() => {
    return [...operationLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [operationLogs]);

  const handleExportCSV = () => {
    const pendingTasks = tasks.filter((t) => !t.isCompleted);
    const header = '任务标题,描述,优先级,分类,状态,来源\n';
    const rows = pendingTasks
      .map(
        (t) =>
          `${t.title},${t.description},${priorityLabels[t.priority]},${t.category},待完成,${t.sourceDanmakuContent ? '弹幕' : '手动'}`
      )
      .join('\n');
    const csvContent = header + rows;

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `待跟进清单_${formatDateTime(new Date()).replace(/[- :]/g, '')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveAsTemplate(templateName.trim());
    setTemplateName('');
    setShowSaveTemplateModal(false);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      category: newTaskCategory,
      priority: newTaskPriority,
      isCompleted: false,
    });
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskCategory('直播中');
    setNewTaskPriority('medium');
    setShowAddTaskModal(false);
  };

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
    setNewSessionData({
      title: '',
      startTime: '',
      category: '美妆',
      targetAmount: 0,
      owner: '运营小王',
    });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case 'applyTemplate':
        applyTemplate(confirmAction.id);
        break;
      case 'deleteTemplate':
        deleteTemplate(confirmAction.id);
        break;
      case 'deleteSession':
        deleteSession(confirmAction.id);
        break;
    }
    setConfirmAction(null);
  };

  const handleDeleteSession = (id: string, name: string) => {
    setConfirmAction({ type: 'deleteSession', id, name });
  };

  const handleApplyTemplate = (id: string, name: string) => {
    setConfirmAction({ type: 'applyTemplate', id, name });
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    setConfirmAction({ type: 'deleteTemplate', id, name });
  };

  const getConfirmTitle = () => {
    if (!confirmAction) return '';
    switch (confirmAction.type) {
      case 'applyTemplate':
        return '应用模板';
      case 'deleteTemplate':
        return '删除模板';
      case 'deleteSession':
        return '删除场次';
    }
  };

  const getConfirmMessage = () => {
    if (!confirmAction) return '';
    switch (confirmAction.type) {
      case 'applyTemplate':
        return `确定要应用模板「${confirmAction.name}」吗？当前配置将被覆盖。`;
      case 'deleteTemplate':
        return `确定要删除模板「${confirmAction.name}」吗？删除后无法恢复。`;
      case 'deleteSession':
        return `确定要删除场次「${confirmAction.name}」吗？删除后无法恢复。`;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">任务日志</h1>
          <p className="text-sm text-slate-400 mt-1">
            管理直播场次、模板和任务，追踪直播进度
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'tasks' && (
            <>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium transition-all hover:bg-primary/90 shadow-glow hover:shadow-glow-hover"
              >
                <Plus className="w-4 h-4" />
                新建任务
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-200 rounded-lg text-sm font-medium transition-all hover:bg-slate-700"
              >
                <Download className="w-4 h-4" />
                导出清单
              </button>
            </>
          )}
          {activeTab === 'templates' && (
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium transition-all hover:bg-primary/90 shadow-glow hover:shadow-glow-hover"
            >
              <Save className="w-4 h-4" />
              保存为模板
            </button>
          )}
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <div className="flex border-b border-slate-700/50 px-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all border-b-2 -mb-px',
                  isActive
                    ? 'text-primary border-primary'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'sessions' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-200">历史场次</span>
                  <span className="text-xs text-slate-500">共 {sessions.length} 场</span>
                </div>
                <button
                  onClick={() => setShowNewSessionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium transition-all hover:bg-primary/90 shadow-glow hover:shadow-glow-hover"
                >
                  <Plus className="w-4 h-4" />
                  新建场次
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="py-16 text-center">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">暂无历史场次</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {sessions.map((session) => (
                    <Card
                      key={session.id}
                      hover
                      className="cursor-pointer"
                    >
                      <Card.Body>
                        <div
                          className="flex items-start justify-between"
                          onClick={() => switchSession(session.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={cn(
                                  'px-2 py-0.5 text-xs font-medium rounded-md border',
                                  statusColors[session.status]
                                )}
                              >
                                {statusLabels[session.status]}
                                {session.status === 'ongoing' && (
                                  <span className="ml-1 inline-block w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                )}
                              </span>
                              {currentSession?.id === session.id && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-primary/20 text-primary border border-primary/30">
                                  当前
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-slate-100 truncate">
                              {session.title}
                            </h3>
                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDateTime(session.startTime)}
                            </div>
                            {session.category && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                <Tag className="w-3.5 h-3.5" />
                                {session.category}
                                {session.owner && ` · ${session.owner}`}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0 mt-1" />
                        </div>

                        <div
                          className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/30"
                          onClick={() => switchSession(session.id)}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                              <Users className="w-3.5 h-3.5" />
                              观看人数
                            </div>
                            <p className="text-sm font-semibold text-slate-200">
                              {formatNumber(session.viewerCount)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              成交额
                            </div>
                            <p className="text-sm font-semibold text-success">
                              {formatCurrency(session.transactionAmount)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                              <CheckSquare className="w-3.5 h-3.5" />
                              任务数
                            </div>
                            <p className="text-sm font-semibold text-slate-200">
                              {session.tasks?.length || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-700/30">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id, session.title);
                            }}
                            className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                            title="删除场次"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div>
              {templates.length === 0 ? (
                <div className="py-16 text-center">
                  <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-4">暂无保存的模板</p>
                  <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium transition-all hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4" />
                    保存当前配置为模板
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} hover className="relative overflow-hidden">
                      <Card.Body>
                        <div className="absolute top-0 right-0">
                          <div className="bg-primary/20 text-primary text-xs font-medium px-3 py-1 rounded-bl-lg border-l border-b border-primary/30">
                            <LayoutTemplate className="w-3.5 h-3.5 inline-block mr-1" />
                            模板
                          </div>
                        </div>

                        <div className="pr-16">
                          <h3 className="text-sm font-semibold text-slate-100 truncate">
                            {template.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            创建时间：{formatDateTime(template.createdAt)}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/30">
                          <div className="text-center">
                            <p className="text-lg font-bold text-slate-200">
                              {template.products.length}
                            </p>
                            <p className="text-xs text-slate-400">商品</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-slate-200">
                              {template.scriptNodes.length}
                            </p>
                            <p className="text-xs text-slate-400">脚本</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-slate-200">
                              {template.tasks.length}
                            </p>
                            <p className="text-xs text-slate-400">任务</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-700/30">
                          <button
                            onClick={() => handleApplyTemplate(template.id, template.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                            应用模板
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id, template.name)}
                            className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                            title="删除模板"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="h-full flex flex-col">
              <div className="grid grid-cols-5 gap-3 mb-5">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs text-slate-400">总任务数</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{tasks.length}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-slate-400">已完成</span>
                  </div>
                  <p className="text-2xl font-bold text-success">{completedCount}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-xs text-slate-400">待完成</span>
                  </div>
                  <p className="text-2xl font-bold text-warning">{totalCount - completedCount}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-info" />
                    <span className="text-xs text-slate-400">弹幕来源</span>
                  </div>
                  <p className="text-2xl font-bold text-info">{danmakuSourceTasks.length}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400">团队成员</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{teamMembers.length}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <div className="flex bg-slate-800/50 rounded-lg p-1">
                    {taskCategories.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setTaskCategory(cat.key)}
                        className={cn(
                          'px-4 py-1.5 text-xs font-medium rounded-md transition-all',
                          taskCategory === cat.key
                            ? 'bg-primary text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  完成率：
                  <span className="font-semibold text-slate-200 ml-1">{completionRate}%</span>
                </div>
              </div>

              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full progress-transition"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <div className="flex-1 overflow-y-auto -mx-5 px-5">
                {filteredTasks.length === 0 ? (
                  <div className="py-16 text-center">
                    <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">暂无任务</p>
                    <button
                      onClick={() => setShowAddTaskModal(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-light transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      添加第一个任务
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-xl border transition-all',
                          task.isCompleted
                            ? 'bg-slate-800/20 border-slate-700/30'
                            : task.priority === 'high'
                            ? 'bg-danger/5 border-danger/30 hover:bg-danger/10'
                            : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-750/50 hover:border-slate-600/50'
                        )}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                            task.isCompleted
                              ? 'bg-success border-success'
                              : 'border-slate-500 hover:border-primary'
                          )}
                        >
                          {task.isCompleted && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                task.isCompleted
                                  ? 'text-slate-500 line-through'
                                  : 'text-slate-200'
                              )}
                            >
                              {task.title}
                            </span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                                priorityColors[task.priority]
                              )}
                            >
                              {priorityLabels[task.priority]}优先级
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-700/50 text-slate-400 border border-slate-600/30">
                              {task.category}
                            </span>
                            {task.sourceDanmakuId && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-info/15 text-info border border-info/30 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                弹幕来源
                              </span>
                            )}
                          </div>
                          <p
                            className={cn(
                              'text-xs mt-1.5',
                              task.isCompleted ? 'text-slate-600' : 'text-slate-400'
                            )}
                          >
                            {task.description}
                          </p>

                          {(task.assignee || task.relatedProductName) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {task.assignee && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                  <User className="w-3 h-3" />
                                  {task.assignee}
                                </span>
                              )}
                              {task.relatedProductName && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <Package className="w-3 h-3" />
                                  {task.relatedProductName}
                                  {task.relatedProductStock !== undefined && (
                                    <span className="ml-1">库存: {task.relatedProductStock}</span>
                                  )}
                                </span>
                              )}
                            </div>
                          )}

                          {task.sourceDanmakuContent && !task.isCompleted && (
                            <div className="mt-3 p-2.5 bg-slate-700/30 rounded-lg border border-slate-600/20">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="w-3 h-3 text-info" />
                                <span className="text-[10px] text-slate-500 font-medium">来源弹幕</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                "{task.sourceDanmakuContent}"
                              </p>
                            </div>
                          )}
                        </div>

                        {task.isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/30 text-sm text-slate-400">
                <span>
                  已完成 <span className="font-semibold text-slate-200">{completedCount}</span> /{' '}
                  {totalCount} 项
                </span>
                <span>
                  {totalCount > 0 && !filteredTasks.every((t) => t.isCompleted) && (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      还有 {totalCount - completedCount} 项待完成
                    </span>
                  )}
                  {totalCount > 0 && filteredTasks.every((t) => t.isCompleted) && (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      全部完成
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/30">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-200">操作记录</span>
                  <span className="text-xs text-slate-500">共 {sortedOperationLogs.length} 条</span>
                </div>

                {sortedOperationLogs.length === 0 ? (
                  <div className="py-8 text-center">
                    <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">暂无操作记录</p>
                  </div>
                ) : (
                  <div className="relative max-h-64 overflow-y-auto -mx-5 px-5">
                    <div className="absolute left-7 top-1 bottom-1 w-px bg-slate-700/50" />
                    <div className="space-y-3">
                      {sortedOperationLogs.map((log) => (
                        <div key={log.id} className="relative flex items-start gap-3 pl-2">
                          <div className="relative z-10 w-3 h-3 mt-1 rounded-full bg-primary border-2 border-slate-850 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-slate-200">
                                {log.operator}
                              </span>
                              <span className="text-xs text-slate-500">
                                {formatDateTime(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                              {log.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddTaskModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-850 rounded-xl border border-slate-700/50 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-100">新建任务</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  任务标题 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="请输入任务标题"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  任务描述
                </label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="请输入任务描述（选填）"
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    分类
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  >
                    <option value="开播前">开播前</option>
                    <option value="直播中">直播中</option>
                    <option value="直播后">直播后</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    优先级
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  >
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}

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
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  直播标题 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newSessionData.title}
                  onChange={(e) => setNewSessionData({ ...newSessionData, title: e.target.value })}
                  placeholder="请输入直播标题"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  开播时间 <span className="text-danger">*</span>
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

      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSaveTemplateModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-850 rounded-xl border border-slate-700/50 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-100">保存为模板</h3>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  模板名称
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="请输入模板名称"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-2">模板将包含以下内容：</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-semibold text-slate-200">
                      {useLiveStore.getState().products.length}
                    </p>
                    <p className="text-[11px] text-slate-500">商品</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-200">
                      {useLiveStore.getState().scriptNodes.length}
                    </p>
                    <p className="text-[11px] text-slate-500">脚本</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-200">
                      {useLiveStore.getState().tasks.length}
                    </p>
                    <p className="text-[11px] text-slate-500">任务</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存模板
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative w-full max-w-sm bg-slate-850 rounded-xl border border-slate-700/50 shadow-xl animate-fade-in">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    confirmAction.type === 'applyTemplate'
                      ? 'bg-primary/20'
                      : 'bg-danger/20'
                  )}
                >
                  {confirmAction.type === 'applyTemplate' ? (
                    <FileText className="w-5 h-5 text-primary" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-danger" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-100">
                  {getConfirmTitle()}
                </h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {getConfirmMessage()}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAction}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  confirmAction.type === 'applyTemplate'
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-danger hover:bg-danger/90'
                )}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
