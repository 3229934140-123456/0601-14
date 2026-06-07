export type LiveStatus = 'draft' | 'ongoing' | 'completed';

export interface LiveSession {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  status: LiveStatus;
  coverImage?: string;
  viewerCount: number;
  transactionAmount: number;
  interactionRate: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductType = 'main' | 'secondary' | 'bonus';

export interface Product {
  id: string;
  name: string;
  image?: string;
  stock: number;
  price: number;
  originalPrice: number;
  sortOrder: number;
  type: ProductType;
  onShelfTime?: string;
  duration?: number;
  description?: string;
}

export type ScriptNodeType = 'opening' | 'product' | 'interaction' | 'promotion' | 'closing';

export interface ScriptNode {
  id: string;
  title: string;
  content: string;
  type: ScriptNodeType;
  timeOffset: number;
  isCompleted: boolean;
  relatedProductId?: string;
}

export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface Danmaku {
  id: string;
  content: string;
  user: string;
  timestamp: string;
  sentiment: Sentiment;
  category: string;
}

export type AbnormalType = 'technical' | 'content' | 'emergency';

export interface AbnormalEvent {
  id: string;
  type: AbnormalType;
  description: string;
  timestamp: string;
  duration: number;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  isCompleted: boolean;
  dueTime?: string;
  category: string;
}

export interface Template {
  id: string;
  name: string;
  createdAt: string;
  products: Product[];
  scriptNodes: ScriptNode[];
  tasks: Task[];
}

export interface TitleCheckResult {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface CoverCheckResult {
  width: number;
  height: number;
  ratio: string;
  sizeKB: number;
  isValid: boolean;
  issues: string[];
}

export interface AccountStatus {
  healthScore: number;
  canStartLive: boolean;
  violationCount: number;
  warnings: string[];
}

export interface HighFrequencyQuestion {
  question: string;
  count: number;
  category: string;
}

export interface PeakData {
  time: string;
  amount: number;
  productId?: string;
  productName?: string;
}

export interface ReviewPoint {
  id: string;
  content: string;
  type: 'good' | 'bad' | 'improvement';
}
