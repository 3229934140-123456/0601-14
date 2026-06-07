import { create } from 'zustand';
import type {
  LiveSession,
  Product,
  ScriptNode,
  Task,
  Danmaku,
  AbnormalEvent,
  Template,
  ReviewPoint,
  ProductType,
  Priority,
  PeakData,
  TeamMember,
  OperationLog,
  OperationType,
} from '@/types';
import { storage } from '@/utils/storage';
import {
  mockLiveSessions,
  mockTemplates,
  createNewSession,
} from '@/utils/mockData';
import { generateId } from '@/utils/format';

interface LiveState {
  sessions: LiveSession[];
  currentSessionId: string | null;
  templates: Template[];
  isLiveOngoing: boolean;
  liveStartTime: number | null;

  currentSession: LiveSession | null;
  products: Product[];
  scriptNodes: ScriptNode[];
  tasks: Task[];
  danmaku: Danmaku[];
  abnormalEvents: AbnormalEvent[];
  reviewPoints: ReviewPoint[];
  peakData: PeakData[];
  teamMembers: TeamMember[];
  operationLogs: OperationLog[];

  initStore: () => void;
  saveSessionsToStorage: () => void;
  saveTemplatesToStorage: () => void;

  addOperationLog: (type: OperationType, description: string, targetId?: string, targetName?: string, extra?: Record<string, any>) => void;

  createSession: (data: {
    title: string;
    startTime: string;
    category: string;
    targetAmount: number;
    owner: string;
  }) => void;
  switchSession: (sessionId: string) => void;
  updateSession: (updates: Partial<LiveSession>) => void;
  deleteSession: (sessionId: string) => void;

  addProduct: (product: Omit<Product, 'id' | 'sortOrder'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  reorderProducts: (products: Product[]) => void;
  markProductOnShelf: (id: string) => void;
  batchImportProducts: (products: Omit<Product, 'id' | 'sortOrder'>[]) => void;
  generateStockReplenishTasks: () => void;
  updateStockThreshold: (threshold: number) => void;

  addScriptNode: (node: Omit<ScriptNode, 'id'>) => void;
  updateScriptNode: (id: string, updates: Partial<ScriptNode>) => void;
  deleteScriptNode: (id: string) => void;
  reorderScriptNodes: (nodes: ScriptNode[]) => void;
  completeScriptNode: (id: string) => void;
  skipScriptNode: (id: string) => void;
  delayScriptNode: (id: string, minutes: number) => void;

  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  addDanmaku: (danmaku: Omit<Danmaku, 'id'>) => void;
  addBatchDanmaku: (list: Danmaku[]) => void;
  batchImportDanmaku: (text: string) => void;
  convertDanmakuToTask: (danmakuId: string, priority: Priority) => void;
  markDanmakuFollowUp: (danmakuId: string) => void;

  addAbnormalEvent: (event: Omit<AbnormalEvent, 'id'>) => void;
  deleteAbnormalEvent: (id: string) => void;

  addReviewPoint: (point: Omit<ReviewPoint, 'id'>) => void;
  deleteReviewPoint: (id: string) => void;

  saveAsTemplate: (name: string) => void;
  applyTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;

  startLive: () => void;
  endLive: () => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  templates: [],
  isLiveOngoing: false,
  liveStartTime: null,

  currentSession: null,
  products: [],
  scriptNodes: [],
  tasks: [],
  danmaku: [],
  abnormalEvents: [],
  reviewPoints: [],
  peakData: [],
  teamMembers: [],
  operationLogs: [],

  initStore: () => {
    const savedSessions = storage.get<LiveSession[]>('sessions', []);
    const savedTemplates = storage.get<Template[]>('templates', []);
    const savedCurrentId = storage.get<string | null>('currentSessionId', null);

    let sessions = savedSessions;
    let templates = savedTemplates;

    if (savedSessions.length === 0) {
      sessions = mockLiveSessions;
      storage.set('sessions', sessions);
    }

    if (savedTemplates.length === 0) {
      templates = mockTemplates;
      storage.set('templates', templates);
    }

    const currentId = savedCurrentId || sessions[0]?.id || null;
    const currentSession = sessions.find(s => s.id === currentId) || sessions[0] || null;

    set({
      sessions,
      templates,
      currentSessionId: currentSession?.id || null,
      currentSession,
      products: currentSession?.products || [],
      scriptNodes: currentSession?.scriptNodes || [],
      tasks: currentSession?.tasks || [],
      danmaku: currentSession?.danmaku || [],
      abnormalEvents: currentSession?.abnormalEvents || [],
      reviewPoints: currentSession?.reviewPoints || [],
      peakData: currentSession?.peakData || [],
      teamMembers: currentSession?.teamMembers || [],
      operationLogs: currentSession?.operationLogs || [],
    });
  },

  saveSessionsToStorage: () => {
    const { sessions } = get();
    storage.set('sessions', sessions);
  },

  saveTemplatesToStorage: () => {
    const { templates } = get();
    storage.set('templates', templates);
  },

  addOperationLog: (type, description, targetId, targetName, extra) => {
    const { operationLogs, currentSession, currentSessionId, sessions } = get();
    const operator = currentSession?.owner || '系统';
    const newLog: OperationLog = {
      id: generateId(),
      type,
      operator,
      targetId,
      targetName,
      description,
      timestamp: new Date().toISOString(),
      extra,
    };
    const updatedLogs = [...operationLogs, newLog];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, operationLogs: updatedLogs, updatedAt: new Date().toISOString() } : s
    );
    const currentSessionUpdated = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      operationLogs: updatedLogs,
      sessions: updatedSessions,
      currentSession: currentSessionUpdated,
    });
    storage.set('sessions', updatedSessions);
  },

  createSession: (data) => {
    const { sessions } = get();
    const newSession = createNewSession(
      data.title,
      data.startTime,
      data.category,
      data.targetAmount,
      data.owner
    );
    const updatedSessions = [...sessions, newSession];
    set({
      sessions: updatedSessions,
      currentSessionId: newSession.id,
      currentSession: newSession,
      products: newSession.products,
      scriptNodes: newSession.scriptNodes,
      tasks: newSession.tasks,
      danmaku: newSession.danmaku,
      abnormalEvents: newSession.abnormalEvents,
      reviewPoints: newSession.reviewPoints,
      peakData: newSession.peakData,
      teamMembers: newSession.teamMembers,
      operationLogs: newSession.operationLogs,
    });
    storage.set('sessions', updatedSessions);
    storage.set('currentSessionId', newSession.id);
  },

  switchSession: (sessionId) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      set({
        currentSessionId: sessionId,
        currentSession: session,
        products: session.products,
        scriptNodes: session.scriptNodes,
        tasks: session.tasks,
        danmaku: session.danmaku,
        abnormalEvents: session.abnormalEvents,
        reviewPoints: session.reviewPoints,
        peakData: session.peakData,
        teamMembers: session.teamMembers,
        operationLogs: session.operationLogs,
      });
      storage.set('currentSessionId', sessionId);
    }
  },

  updateSession: (updates) => {
    const { sessions, currentSessionId } = get();
    const updatedSessions = sessions.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, ...updates, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;
    set({
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  deleteSession: (sessionId) => {
    const { sessions, currentSessionId } = get();
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    const newCurrentId = currentSessionId === sessionId
      ? (updatedSessions[0]?.id || null)
      : currentSessionId;
    const newCurrent = updatedSessions.find(s => s.id === newCurrentId) || null;

    set({
      sessions: updatedSessions,
      currentSessionId: newCurrentId,
      currentSession: newCurrent,
      products: newCurrent?.products || [],
      scriptNodes: newCurrent?.scriptNodes || [],
      tasks: newCurrent?.tasks || [],
      danmaku: newCurrent?.danmaku || [],
      abnormalEvents: newCurrent?.abnormalEvents || [],
      reviewPoints: newCurrent?.reviewPoints || [],
      peakData: newCurrent?.peakData || [],
      teamMembers: newCurrent?.teamMembers || [],
      operationLogs: newCurrent?.operationLogs || [],
    });
    storage.set('sessions', updatedSessions);
    if (newCurrentId) {
      storage.set('currentSessionId', newCurrentId);
    } else {
      storage.remove('currentSessionId');
    }
  },

  addProduct: (product) => {
    const { products, currentSessionId, sessions } = get();
    const newProduct: Product = {
      ...product,
      id: generateId(),
      sortOrder: products.length + 1,
    };
    const updatedProducts = [...products, newProduct];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, products: updatedProducts, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      products: updatedProducts,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'add_product',
      `添加商品「${newProduct.name}」`,
      newProduct.id,
      newProduct.name
    );
  },

  updateProduct: (id, updates) => {
    const { products, currentSessionId, sessions } = get();
    const updatedProducts = products.map(p => p.id === id ? { ...p, ...updates } : p);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, products: updatedProducts, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      products: updatedProducts,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  deleteProduct: (id) => {
    const { products, currentSessionId, sessions } = get();
    const updatedProducts = products
      .filter(p => p.id !== id)
      .map((p, idx) => ({ ...p, sortOrder: idx + 1 }));

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, products: updatedProducts, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      products: updatedProducts,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  reorderProducts: (newProducts) => {
    const { currentSessionId, sessions } = get();
    const updatedProducts = newProducts.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, products: updatedProducts, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      products: updatedProducts,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  markProductOnShelf: (id) => {
    const { products, currentSessionId, sessions } = get();
    const targetProduct = products.find(p => p.id === id);
    const updatedProducts = products.map(p =>
      p.id === id ? { ...p, onShelfTime: new Date().toISOString() } : p
    );

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, products: updatedProducts, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      products: updatedProducts,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    if (targetProduct) {
      get().addOperationLog(
        'mark_on_shelf',
        `标记商品「${targetProduct.name}」已上架`,
        targetProduct.id,
        targetProduct.name
      );
    }
  },

  batchImportProducts: (productsList) => {
    const { products, currentSessionId, sessions } = get();
    let startOrder = products.length;
    const newProducts = productsList.map(p => ({
      ...p,
      id: generateId(),
      sortOrder: ++startOrder,
    }));
    const updatedProducts = [...products, ...newProducts];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, products: updatedProducts, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      products: updatedProducts,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'import_products',
      `批量导入${newProducts.length}个商品`,
      undefined,
      undefined,
      { count: newProducts.length }
    );
  },

  generateStockReplenishTasks: () => {
    const { products, tasks, currentSession } = get();
    const threshold = currentSession?.stockWarningThreshold || 100;
    const lowStockProducts = products.filter(p => p.stock < threshold);

    const pendingReplenishProductIds = tasks
      .filter(t => !t.isCompleted && t.relatedProductId)
      .map(t => t.relatedProductId);

    const productsToReplenish = lowStockProducts.filter(
      p => !pendingReplenishProductIds.includes(p.id)
    );

    if (productsToReplenish.length === 0) return;

    const newTasks: Task[] = productsToReplenish.map(p => ({
      id: generateId(),
      title: `补货：${p.name}`,
      description: `当前库存 ${p.stock} 件，低于阈值 ${threshold}，请尽快补货`,
      priority: p.stock < threshold / 2 ? 'high' : 'medium',
      isCompleted: false,
      category: '直播后',
      relatedProductId: p.id,
      relatedProductName: p.name,
      relatedProductStock: p.stock,
    }));

    const { currentSessionId, sessions } = get();
    const updatedTasks = [...tasks, ...newTasks];
    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, tasks: updatedTasks, updatedAt: new Date().toISOString() } : s
    );
    const currentSessionUpdated = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      tasks: updatedTasks,
      sessions: updatedSessions,
      currentSession: currentSessionUpdated,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'generate_replenish_task',
      `生成${newTasks.length}条补货待办任务`,
      undefined,
      undefined,
      { count: newTasks.length }
    );
  },

  updateStockThreshold: (threshold) => {
    const { currentSessionId, sessions } = get();
    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, stockWarningThreshold: threshold, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  addScriptNode: (node) => {
    const { scriptNodes, currentSessionId, sessions } = get();
    const newNode: ScriptNode = { ...node, id: generateId() };
    const updatedNodes = [...scriptNodes, newNode].sort((a, b) => a.timeOffset - b.timeOffset);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, scriptNodes: updatedNodes, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      scriptNodes: updatedNodes,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  updateScriptNode: (id, updates) => {
    const { scriptNodes, currentSessionId, sessions } = get();
    const updatedNodes = scriptNodes
      .map(n => n.id === id ? { ...n, ...updates } : n)
      .sort((a, b) => a.timeOffset - b.timeOffset);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, scriptNodes: updatedNodes, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      scriptNodes: updatedNodes,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  deleteScriptNode: (id) => {
    const { scriptNodes, currentSessionId, sessions } = get();
    const updatedNodes = scriptNodes.filter(n => n.id !== id);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, scriptNodes: updatedNodes, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      scriptNodes: updatedNodes,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  reorderScriptNodes: (nodes) => {
    const { currentSessionId, sessions } = get();
    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, scriptNodes: nodes, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      scriptNodes: nodes,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  completeScriptNode: (id) => {
    const { scriptNodes, currentSessionId, sessions } = get();
    const targetNode = scriptNodes.find(n => n.id === id);
    const updatedNodes = scriptNodes.map(n =>
      n.id === id ? { ...n, isCompleted: !n.isCompleted } : n
    );

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, scriptNodes: updatedNodes, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      scriptNodes: updatedNodes,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    if (targetNode) {
      const newCompleted = !targetNode.isCompleted;
      get().addOperationLog(
        'complete_script_node',
        newCompleted ? `标记脚本节点「${targetNode.title}」为已完成` : `取消脚本节点「${targetNode.title}」的完成状态`,
        targetNode.id,
        targetNode.title
      );
    }
  },

  skipScriptNode: (id) => {
    const { scriptNodes, currentSessionId, sessions } = get();
    const targetNode = scriptNodes.find(n => n.id === id);
    const updatedNodes = scriptNodes.map(n =>
      n.id === id ? { ...n, isSkipped: !n.isSkipped, isCompleted: !n.isSkipped } : n
    );

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, scriptNodes: updatedNodes, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      scriptNodes: updatedNodes,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    if (targetNode) {
      const newSkipped = !targetNode.isSkipped;
      get().addOperationLog(
        'skip_script_node',
        newSkipped ? `跳过脚本节点「${targetNode.title}」` : `取消跳过脚本节点「${targetNode.title}」`,
        targetNode.id,
        targetNode.title
      );
    }
  },

  delayScriptNode: (id, minutes) => {
    const { scriptNodes, currentSessionId, sessions } = get();
    const delaySeconds = minutes * 60;
    const targetNode = scriptNodes.find(n => n.id === id);
    if (!targetNode) return;

    const targetIndex = scriptNodes.findIndex(n => n.id === id);
    const updatedNodes = scriptNodes.map((n, idx) => {
      if (idx >= targetIndex) {
        return { ...n, timeOffset: n.timeOffset + delaySeconds };
      }
      return n;
    });

    const sortedNodes = [...updatedNodes].sort((a, b) => a.timeOffset - b.timeOffset);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, scriptNodes: sortedNodes, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      scriptNodes: sortedNodes,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'delay_script_node',
      `将脚本节点「${targetNode.title}」延后${minutes}分钟`,
      targetNode.id,
      targetNode.title,
      { delayMinutes: minutes }
    );
  },

  addTask: (task) => {
    const { tasks, currentSessionId, sessions } = get();
    const newTask: Task = { ...task, id: generateId() };
    const updatedTasks = [...tasks, newTask];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, tasks: updatedTasks, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      tasks: updatedTasks,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'create_task',
      `创建待办任务「${newTask.title}」`,
      newTask.id,
      newTask.title
    );
  },

  updateTask: (id, updates) => {
    const { tasks, currentSessionId, sessions } = get();
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, tasks: updatedTasks, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      tasks: updatedTasks,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  deleteTask: (id) => {
    const { tasks, currentSessionId, sessions } = get();
    const updatedTasks = tasks.filter(t => t.id !== id);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, tasks: updatedTasks, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      tasks: updatedTasks,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  toggleTask: (id) => {
    const { tasks, currentSessionId, sessions } = get();
    const targetTask = tasks.find(t => t.id === id);
    const updatedTasks = tasks.map(t =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, tasks: updatedTasks, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      tasks: updatedTasks,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    if (targetTask) {
      const newCompleted = !targetTask.isCompleted;
      get().addOperationLog(
        'complete_task',
        newCompleted ? `完成待办任务「${targetTask.title}」` : `取消完成待办任务「${targetTask.title}」`,
        targetTask.id,
        targetTask.title
      );
    }
  },

  addDanmaku: (item) => {
    const { danmaku, currentSessionId, sessions } = get();
    const newItem: Danmaku = { ...item, id: generateId() };
    const updatedDanmaku = [...danmaku, newItem];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, danmaku: updatedDanmaku, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      danmaku: updatedDanmaku,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  addBatchDanmaku: (list) => {
    const { danmaku, currentSessionId, sessions } = get();
    const updatedDanmaku = [...danmaku, ...list];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, danmaku: updatedDanmaku, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      danmaku: updatedDanmaku,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  batchImportDanmaku: (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const now = new Date();

    const productKeywords = ['好用', '效果', '成分', '敏感', '肤质', '怎么用', '使用'];
    const priceKeywords = ['多少', '钱', '价格', '优惠', '便宜', '贵', '打折'];
    const logisticsKeywords = ['发货', '快递', '物流', '几天到', '售后', '退换', '保修'];
    const positiveKeywords = ['好', '棒', '赞', '喜欢', '买', '下单', '冲', '回购'];
    const negativeKeywords = ['差', '不好', '太贵', '骗人', '退', '垃圾'];

    const newDanmaku: Danmaku[] = lines.map((line, idx) => {
      const trimmed = line.trim();
      let category = '其他';
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';

      if (productKeywords.some(k => trimmed.includes(k))) {
        category = '产品咨询';
      } else if (priceKeywords.some(k => trimmed.includes(k))) {
        category = '价格咨询';
      } else if (logisticsKeywords.some(k => trimmed.includes(k))) {
        category = '物流售后';
      }

      if (positiveKeywords.some(k => trimmed.includes(k)) && !negativeKeywords.some(k => trimmed.includes(k))) {
        sentiment = 'positive';
        if (category === '其他') category = '购买反馈';
      } else if (negativeKeywords.some(k => trimmed.includes(k))) {
        sentiment = 'negative';
      }

      if (/^(主播|哈哈|来了|打卡|在)/.test(trimmed) || trimmed.length <= 4) {
        if (category === '其他') category = '互动';
        if (sentiment === 'neutral') sentiment = 'positive';
      }

      const time = new Date(now.getTime() + idx * 30000);

      return {
        id: generateId(),
        content: trimmed,
        user: `用户${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: time.toISOString(),
        sentiment,
        category,
      };
    });

    const { danmaku, currentSessionId, sessions } = get();
    const updatedDanmaku = [...danmaku, ...newDanmaku];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, danmaku: updatedDanmaku, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      danmaku: updatedDanmaku,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'import_danmaku',
      `批量导入${newDanmaku.length}条弹幕`,
      undefined,
      undefined,
      { count: newDanmaku.length }
    );
  },

  convertDanmakuToTask: (danmakuId, priority) => {
    const { danmaku, tasks, currentSessionId, sessions } = get();
    const item = danmaku.find(d => d.id === danmakuId);
    if (!item) return;

    const newTask: Task = {
      id: generateId(),
      title: `跟进弹幕问题: ${item.content.slice(0, 20)}`,
      description: item.content,
      priority,
      isCompleted: false,
      category: '直播后',
      sourceDanmakuId: item.id,
      sourceDanmakuContent: item.content,
    };

    const updatedDanmaku = danmaku.map(d =>
      d.id === danmakuId ? { ...d, isFollowUp: true } : d
    );
    const updatedTasks = [...tasks, newTask];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId
        ? { ...s, danmaku: updatedDanmaku, tasks: updatedTasks, updatedAt: new Date().toISOString() }
        : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      danmaku: updatedDanmaku,
      tasks: updatedTasks,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'create_task',
      `将弹幕转换为待办任务「${newTask.title}」`,
      newTask.id,
      newTask.title,
      { sourceDanmakuId: item.id, sourceDanmakuContent: item.content }
    );
  },

  markDanmakuFollowUp: (danmakuId) => {
    const { danmaku, currentSessionId, sessions } = get();
    const updatedDanmaku = danmaku.map(d =>
      d.id === danmakuId ? { ...d, isFollowUp: !d.isFollowUp } : d
    );

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, danmaku: updatedDanmaku, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      danmaku: updatedDanmaku,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  addAbnormalEvent: (event) => {
    const { abnormalEvents, currentSessionId, sessions } = get();
    const newEvent: AbnormalEvent = { ...event, id: generateId() };
    const updatedEvents = [...abnormalEvents, newEvent];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, abnormalEvents: updatedEvents, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      abnormalEvents: updatedEvents,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  deleteAbnormalEvent: (id) => {
    const { abnormalEvents, currentSessionId, sessions } = get();
    const updatedEvents = abnormalEvents.filter(e => e.id !== id);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, abnormalEvents: updatedEvents, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      abnormalEvents: updatedEvents,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  addReviewPoint: (point) => {
    const { reviewPoints, currentSessionId, sessions } = get();
    const newPoint: ReviewPoint = { ...point, id: generateId() };
    const updatedPoints = [...reviewPoints, newPoint];

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, reviewPoints: updatedPoints, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      reviewPoints: updatedPoints,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'add_review_point',
      `添加复盘要点「${newPoint.content.slice(0, 20)}」`,
      newPoint.id,
      newPoint.content
    );
  },

  deleteReviewPoint: (id) => {
    const { reviewPoints, currentSessionId, sessions } = get();
    const updatedPoints = reviewPoints.filter(p => p.id !== id);

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId ? { ...s, reviewPoints: updatedPoints, updatedAt: new Date().toISOString() } : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      reviewPoints: updatedPoints,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  saveAsTemplate: (name) => {
    const { products, scriptNodes, tasks, templates } = get();
    const newTemplate: Template = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      products: JSON.parse(JSON.stringify(products)),
      scriptNodes: JSON.parse(JSON.stringify(scriptNodes)),
      tasks: JSON.parse(JSON.stringify(tasks)),
    };
    const updated = [...templates, newTemplate];
    set({ templates: updated });
    storage.set('templates', updated);
  },

  applyTemplate: (templateId) => {
    const { templates, currentSessionId, sessions } = get();
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const updatedProducts = template.products.map(p => ({ ...p, id: generateId() }));
    const updatedScriptNodes = template.scriptNodes.map(n => ({ ...n, id: generateId() }));
    const updatedTasks = template.tasks.map(t => ({ ...t, id: generateId(), isCompleted: false }));

    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId
        ? {
            ...s,
            products: updatedProducts,
            scriptNodes: updatedScriptNodes,
            tasks: updatedTasks,
            updatedAt: new Date().toISOString(),
          }
        : s
    );
    const currentSession = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      products: updatedProducts,
      scriptNodes: updatedScriptNodes,
      tasks: updatedTasks,
      sessions: updatedSessions,
      currentSession,
    });
    storage.set('sessions', updatedSessions);
  },

  deleteTemplate: (templateId) => {
    const { templates } = get();
    const updated = templates.filter(t => t.id !== templateId);
    set({ templates: updated });
    storage.set('templates', updated);
  },

  startLive: () => {
    const { currentSessionId, sessions, currentSession } = get();
    const now = Date.now();
    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId
        ? { ...s, status: 'ongoing' as const, startTime: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : s
    );
    const currentSessionUpdated = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      isLiveOngoing: true,
      liveStartTime: now,
      sessions: updatedSessions,
      currentSession: currentSessionUpdated,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'start_live',
      '开始直播'
    );
  },

  endLive: () => {
    const { currentSessionId, sessions } = get();
    const updatedSessions = sessions.map(s =>
      s.id === currentSessionId
        ? { ...s, status: 'completed' as const, endTime: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : s
    );
    const currentSessionUpdated = updatedSessions.find(s => s.id === currentSessionId) || null;

    set({
      isLiveOngoing: false,
      sessions: updatedSessions,
      currentSession: currentSessionUpdated,
    });
    storage.set('sessions', updatedSessions);

    get().addOperationLog(
      'end_live',
      '结束直播'
    );
  },
}));
