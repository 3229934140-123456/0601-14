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
} from '@/types';
import { storage } from '@/utils/storage';
import {
  mockProducts,
  mockScriptNodes,
  mockTasks,
  mockDanmaku,
  mockAbnormalEvents,
  mockLiveSessions,
  mockTemplates,
  mockReviewPoints,
} from '@/utils/mockData';
import { generateId } from '@/utils/format';

interface LiveState {
  currentSession: LiveSession | null;
  sessions: LiveSession[];
  products: Product[];
  scriptNodes: ScriptNode[];
  tasks: Task[];
  danmaku: Danmaku[];
  abnormalEvents: AbnormalEvent[];
  templates: Template[];
  reviewPoints: ReviewPoint[];
  liveStartTime: string | null;
  isLiveOngoing: boolean;
  currentNodeIndex: number;

  initStore: () => void;

  setCurrentSession: (session: LiveSession | null) => void;
  updateSessionTitle: (title: string) => void;

  addProduct: (product: Omit<Product, 'id' | 'sortOrder'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  reorderProducts: (products: Product[]) => void;
  markProductOnShelf: (id: string) => void;

  addScriptNode: (node: Omit<ScriptNode, 'id'>) => void;
  updateScriptNode: (id: string, updates: Partial<ScriptNode>) => void;
  deleteScriptNode: (id: string) => void;
  reorderScriptNodes: (nodes: ScriptNode[]) => void;
  completeScriptNode: (id: string) => void;

  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  addDanmaku: (danmaku: Omit<Danmaku, 'id'>) => void;
  addBatchDanmaku: (list: Danmaku[]) => void;

  addAbnormalEvent: (event: Omit<AbnormalEvent, 'id'>) => void;
  deleteAbnormalEvent: (id: string) => void;

  addReviewPoint: (point: Omit<ReviewPoint, 'id'>) => void;
  deleteReviewPoint: (id: string) => void;

  saveAsTemplate: (name: string) => void;
  applyTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;

  startLive: () => void;
  endLive: () => void;

  saveSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  currentSession: null,
  sessions: [],
  products: [],
  scriptNodes: [],
  tasks: [],
  danmaku: [],
  abnormalEvents: [],
  templates: [],
  reviewPoints: [],
  liveStartTime: null,
  isLiveOngoing: false,
  currentNodeIndex: 0,

  initStore: () => {
    const savedSessions = storage.get<LiveSession[]>('sessions', []);
    const savedTemplates = storage.get<Template[]>('templates', []);

    if (savedSessions.length === 0 && savedTemplates.length === 0) {
      set({
        sessions: mockLiveSessions,
        templates: mockTemplates,
        products: mockProducts,
        scriptNodes: mockScriptNodes,
        tasks: mockTasks,
        danmaku: mockDanmaku,
        abnormalEvents: mockAbnormalEvents,
        reviewPoints: mockReviewPoints,
        currentSession: mockLiveSessions[0],
      });
      storage.set('sessions', mockLiveSessions);
      storage.set('templates', mockTemplates);
      storage.set('products', mockProducts);
      storage.set('scriptNodes', mockScriptNodes);
      storage.set('tasks', mockTasks);
      storage.set('danmaku', mockDanmaku);
      storage.set('abnormalEvents', mockAbnormalEvents);
      storage.set('reviewPoints', mockReviewPoints);
    } else {
      set({
        sessions: savedSessions,
        templates: savedTemplates,
        products: storage.get<Product[]>('products', mockProducts),
        scriptNodes: storage.get<ScriptNode[]>('scriptNodes', mockScriptNodes),
        tasks: storage.get<Task[]>('tasks', mockTasks),
        danmaku: storage.get<Danmaku[]>('danmaku', mockDanmaku),
        abnormalEvents: storage.get<AbnormalEvent[]>('abnormalEvents', mockAbnormalEvents),
        reviewPoints: storage.get<ReviewPoint[]>('reviewPoints', mockReviewPoints),
        currentSession: savedSessions[0] || null,
      });
    }
  },

  setCurrentSession: (session) => set({ currentSession: session }),

  updateSessionTitle: (title) => {
    const { currentSession } = get();
    if (currentSession) {
      const updated = { ...currentSession, title, updatedAt: new Date().toISOString() };
      set({ currentSession: updated });
    }
  },

  addProduct: (product) => {
    const { products } = get();
    const newProduct: Product = {
      ...product,
      id: generateId(),
      sortOrder: products.length + 1,
    };
    const updated = [...products, newProduct];
    set({ products: updated });
    storage.set('products', updated);
  },

  updateProduct: (id, updates) => {
    const { products } = get();
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    set({ products: updated });
    storage.set('products', updated);
  },

  deleteProduct: (id) => {
    const { products } = get();
    const updated = products.filter(p => p.id !== id).map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
    set({ products: updated });
    storage.set('products', updated);
  },

  reorderProducts: (newProducts) => {
    const updated = newProducts.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
    set({ products: updated });
    storage.set('products', updated);
  },

  markProductOnShelf: (id) => {
    const { products } = get();
    const updated = products.map(p =>
      p.id === id ? { ...p, onShelfTime: new Date().toISOString() } : p
    );
    set({ products: updated });
    storage.set('products', updated);
  },

  addScriptNode: (node) => {
    const { scriptNodes } = get();
    const newNode: ScriptNode = { ...node, id: generateId() };
    const updated = [...scriptNodes, newNode].sort((a, b) => a.timeOffset - b.timeOffset);
    set({ scriptNodes: updated });
    storage.set('scriptNodes', updated);
  },

  updateScriptNode: (id, updates) => {
    const { scriptNodes } = get();
    const updated = scriptNodes.map(n => n.id === id ? { ...n, ...updates } : n)
      .sort((a, b) => a.timeOffset - b.timeOffset);
    set({ scriptNodes: updated });
    storage.set('scriptNodes', updated);
  },

  deleteScriptNode: (id) => {
    const { scriptNodes } = get();
    const updated = scriptNodes.filter(n => n.id !== id);
    set({ scriptNodes: updated });
    storage.set('scriptNodes', updated);
  },

  reorderScriptNodes: (nodes) => {
    set({ scriptNodes: nodes });
    storage.set('scriptNodes', nodes);
  },

  completeScriptNode: (id) => {
    const { scriptNodes } = get();
    const updated = scriptNodes.map(n =>
      n.id === id ? { ...n, isCompleted: !n.isCompleted } : n
    );
    set({ scriptNodes: updated });
    storage.set('scriptNodes', updated);
  },

  addTask: (task) => {
    const { tasks } = get();
    const newTask: Task = { ...task, id: generateId() };
    const updated = [...tasks, newTask];
    set({ tasks: updated });
    storage.set('tasks', updated);
  },

  updateTask: (id, updates) => {
    const { tasks } = get();
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    set({ tasks: updated });
    storage.set('tasks', updated);
  },

  deleteTask: (id) => {
    const { tasks } = get();
    const updated = tasks.filter(t => t.id !== id);
    set({ tasks: updated });
    storage.set('tasks', updated);
  },

  toggleTask: (id) => {
    const { tasks } = get();
    const updated = tasks.map(t =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );
    set({ tasks: updated });
    storage.set('tasks', updated);
  },

  addDanmaku: (item) => {
    const { danmaku } = get();
    const newItem: Danmaku = { ...item, id: generateId() };
    const updated = [...danmaku, newItem];
    set({ danmaku: updated });
    storage.set('danmaku', updated);
  },

  addBatchDanmaku: (list) => {
    const { danmaku } = get();
    const updated = [...danmaku, ...list];
    set({ danmaku: updated });
    storage.set('danmaku', updated);
  },

  addAbnormalEvent: (event) => {
    const { abnormalEvents } = get();
    const newEvent: AbnormalEvent = { ...event, id: generateId() };
    const updated = [...abnormalEvents, newEvent];
    set({ abnormalEvents: updated });
    storage.set('abnormalEvents', updated);
  },

  deleteAbnormalEvent: (id) => {
    const { abnormalEvents } = get();
    const updated = abnormalEvents.filter(e => e.id !== id);
    set({ abnormalEvents: updated });
    storage.set('abnormalEvents', updated);
  },

  addReviewPoint: (point) => {
    const { reviewPoints } = get();
    const newPoint: ReviewPoint = { ...point, id: generateId() };
    const updated = [...reviewPoints, newPoint];
    set({ reviewPoints: updated });
    storage.set('reviewPoints', updated);
  },

  deleteReviewPoint: (id) => {
    const { reviewPoints } = get();
    const updated = reviewPoints.filter(p => p.id !== id);
    set({ reviewPoints: updated });
    storage.set('reviewPoints', updated);
  },

  saveAsTemplate: (name) => {
    const { products, scriptNodes, tasks, templates } = get();
    const newTemplate: Template = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      products: [...products],
      scriptNodes: [...scriptNodes],
      tasks: [...tasks],
    };
    const updated = [...templates, newTemplate];
    set({ templates: updated });
    storage.set('templates', updated);
  },

  applyTemplate: (templateId) => {
    const { templates } = get();
    const template = templates.find(t => t.id === templateId);
    if (template) {
      set({
        products: [...template.products],
        scriptNodes: [...template.scriptNodes],
        tasks: [...template.tasks],
      });
      storage.set('products', template.products);
      storage.set('scriptNodes', template.scriptNodes);
      storage.set('tasks', template.tasks);
    }
  },

  deleteTemplate: (templateId) => {
    const { templates } = get();
    const updated = templates.filter(t => t.id !== templateId);
    set({ templates: updated });
    storage.set('templates', updated);
  },

  startLive: () => {
    const now = new Date().toISOString();
    set({
      isLiveOngoing: true,
      liveStartTime: now,
      currentNodeIndex: 0,
    });
  },

  endLive: () => {
    set({
      isLiveOngoing: false,
    });
  },

  saveSession: () => {
    const { sessions, currentSession, products, scriptNodes, tasks, danmaku, abnormalEvents } = get();
    const now = new Date().toISOString();

    if (currentSession) {
      const updatedSession = { ...currentSession, updatedAt: now };
      const updatedSessions = sessions.map(s => s.id === currentSession.id ? updatedSession : s);
      set({ sessions: updatedSessions, currentSession: updatedSession });
      storage.set('sessions', updatedSessions);
    } else {
      const newSession: LiveSession = {
        id: generateId(),
        title: '新直播场次',
        startTime: now,
        status: 'draft',
        viewerCount: 0,
        transactionAmount: 0,
        interactionRate: 0,
        createdAt: now,
        updatedAt: now,
      };
      const updatedSessions = [...sessions, newSession];
      set({ sessions: updatedSessions, currentSession: newSession });
      storage.set('sessions', updatedSessions);
    }

    storage.set('products', products);
    storage.set('scriptNodes', scriptNodes);
    storage.set('tasks', tasks);
    storage.set('danmaku', danmaku);
    storage.set('abnormalEvents', abnormalEvents);
  },

  loadSession: (sessionId) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      set({ currentSession: session });
    }
  },

  deleteSession: (sessionId) => {
    const { sessions, currentSession } = get();
    const updated = sessions.filter(s => s.id !== sessionId);
    set({
      sessions: updated,
      currentSession: currentSession?.id === sessionId ? updated[0] || null : currentSession,
    });
    storage.set('sessions', updated);
  },
}));
