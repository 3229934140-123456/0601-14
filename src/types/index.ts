export type LiveStatus = 'draft' | 'ongoing' | 'completed';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export type OperationType =
  | 'complete_script_node'
  | 'skip_script_node'
  | 'delay_script_node'
  | 'add_product'
  | 'delete_product'
  | 'update_product'
  | 'mark_on_shelf'
  | 'create_task'
  | 'complete_task'
  | 'generate_replenish_task'
  | 'start_live'
  | 'end_live'
  | 'import_products'
  | 'import_danmaku'
  | 'add_review_point';

export interface OperationLog {
  id: string;
  type: OperationType;
  operator: string;
  targetId?: string;
  targetName?: string;
  description: string;
  timestamp: string;
  extra?: Record<string, any>;
}

export interface LiveSession {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  status: LiveStatus;
  coverImage?: string;
  category: string;
  targetAmount: number;
  owner: string;
  viewerCount: number;
  transactionAmount: number;
  interactionRate: number;
  stockWarningThreshold: number;
  products: Product[];
  scriptNodes: ScriptNode[];
  tasks: Task[];
  danmaku: Danmaku[];
  abnormalEvents: AbnormalEvent[];
  reviewPoints: ReviewPoint[];
  peakData: PeakData[];
  teamMembers: TeamMember[];
  operationLogs: OperationLog[];
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
  lowStock?: boolean;
}

export type ScriptNodeType = 'opening' | 'product' | 'interaction' | 'promotion' | 'closing';

export interface ScriptNode {
  id: string;
  title: string;
  content: string;
  type: ScriptNodeType;
  timeOffset: number;
  isCompleted: boolean;
  isSkipped?: boolean;
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
  isFollowUp?: boolean;
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
  assignee?: string;
  sourceDanmakuId?: string;
  sourceDanmakuContent?: string;
  relatedProductId?: string;
  relatedProductName?: string;
  relatedProductStock?: number;
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

export type DanmakuCategory =
  | '产品咨询'
  | '价格咨询'
  | '物流售后'
  | '购买反馈'
  | '互动'
  | '其他';
