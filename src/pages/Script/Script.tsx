import { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  X,
  Mic,
  Tag,
  MessageCircle,
  Gift,
  Flag,
  ShoppingBag,
  Timer,
  Save,
} from 'lucide-react';
import Card from '@/components/Card/Card';
import { useLiveStore } from '@/store/useLiveStore';
import { formatDuration } from '@/utils/format';
import type { ScriptNode, ScriptNodeType } from '@/types';
import { cn } from '@/lib/utils';

const nodeTypeConfig: Record<ScriptNodeType, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Mic }> = {
  opening: { label: '开场', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/30', icon: Flag },
  product: { label: '商品', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', icon: ShoppingBag },
  interaction: { label: '互动', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30', icon: MessageCircle },
  promotion: { label: '优惠', color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/30', icon: Gift },
  closing: { label: '收尾', color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30', icon: Tag },
};

const Script = () => {
  const { scriptNodes, products, addScriptNode, updateScriptNode, deleteScriptNode, completeScriptNode } = useLiveStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNode, setNewNode] = useState({
    title: '',
    content: '',
    type: 'opening' as ScriptNodeType,
    timeOffset: 0,
    relatedProductId: '',
  });
  const [promoStartTime, setPromoStartTime] = useState(1800);
  const [promoEndTime, setPromoEndTime] = useState(2400);

  const sortedNodes = useMemo(() => {
    return [...scriptNodes].sort((a, b) => a.timeOffset - b.timeOffset);
  }, [scriptNodes]);

  const selectedNode = useMemo(() => {
    return scriptNodes.find(n => n.id === selectedNodeId) || null;
  }, [scriptNodes, selectedNodeId]);

  const relatedProduct = useMemo(() => {
    if (!selectedNode?.relatedProductId) return null;
    return products.find(p => p.id === selectedNode.relatedProductId) || null;
  }, [selectedNode, products]);

  const handleSelectNode = (node: ScriptNode) => {
    setSelectedNodeId(node.id);
  };

  const handleUpdateNode = (field: keyof ScriptNode, value: string | number | boolean) => {
    if (!selectedNodeId) return;
    updateScriptNode(selectedNodeId, { [field]: value });
  };

  const handleDeleteNode = (id: string) => {
    deleteScriptNode(id);
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  const handleAddNode = () => {
    if (!newNode.title.trim()) return;

    const nodeData: Omit<ScriptNode, 'id'> = {
      title: newNode.title,
      content: newNode.content,
      type: newNode.type,
      timeOffset: newNode.timeOffset,
      isCompleted: false,
      ...(newNode.type === 'product' && newNode.relatedProductId ? { relatedProductId: newNode.relatedProductId } : {}),
    };

    addScriptNode(nodeData);
    setShowAddModal(false);
    setNewNode({
      title: '',
      content: '',
      type: 'opening',
      timeOffset: 0,
      relatedProductId: '',
    });
  };

  const totalDuration = sortedNodes.length > 0 ? sortedNodes[sortedNodes.length - 1].timeOffset + 300 : 0;

  const promoCountdown = promoEndTime - promoStartTime > 0 ? promoEndTime - promoStartTime : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">脚本排程</h1>
          <p className="text-sm text-slate-400 mt-1">
            共 {scriptNodes.length} 个节点 · 总时长约 {formatDuration(totalDuration)}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium shadow-glow hover:shadow-glow-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          添加节点
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    时间轴
                  </span>
                </Card.Title>
                <span className="text-xs text-slate-500">点击节点编辑</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700/50" />

                <div className="space-y-1">
                  {sortedNodes.map((node, index) => {
                    const config = nodeTypeConfig[node.type];
                    const Icon = config.icon;
                    const isSelected = selectedNodeId === node.id;

                    return (
                      <div
                        key={node.id}
                        className={cn(
                          'relative pl-10 pr-3 py-3 rounded-lg cursor-pointer transition-all',
                          isSelected ? 'bg-primary/10' : 'hover:bg-slate-800/50',
                          node.isCompleted && 'opacity-60'
                        )}
                        onClick={() => handleSelectNode(node)}
                      >
                        <div
                          className={cn(
                            'absolute left-2 top-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                            config.borderColor,
                            config.bgColor,
                            isSelected && 'ring-2 ring-offset-2 ring-offset-slate-900 ring-primary/50'
                          )}
                        >
                          {node.isCompleted ? (
                            <CheckCircle2 className={cn('w-3 h-3', config.color)} />
                          ) : (
                            <Circle className={cn('w-3 h-3', config.color)} />
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon className={cn('w-4 h-4 shrink-0', config.color)} />
                              <span
                                className={cn(
                                  'text-sm font-medium truncate',
                                  node.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'
                                )}
                              >
                                {node.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  config.bgColor,
                                  config.color
                                )}
                              >
                                {config.label}
                              </span>
                              <span className="text-xs text-slate-500 font-numeric flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(node.timeOffset)}
                              </span>
                            </div>
                          </div>

                          <button
                            className="shrink-0 p-1.5 text-slate-500 hover:text-danger hover:bg-danger/10 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(node.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {index < sortedNodes.length - 1 && (
                          <div className="absolute left-[17px] top-full w-px h-1 bg-slate-700/30" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {sortedNodes.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">暂无脚本节点</p>
                    <p className="text-xs mt-1">点击上方按钮添加第一个节点</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-span-7 space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>
                <span className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary" />
                  口播脚本编辑
                </span>
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">节点类型</label>
                    <div className="flex gap-2">
                      {(Object.keys(nodeTypeConfig) as ScriptNodeType[]).map((type) => {
                        const config = nodeTypeConfig[type];
                        const Icon = config.icon;
                        return (
                          <button
                            key={type}
                            onClick={() => handleUpdateNode('type', type)}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                              selectedNode.type === type
                                ? cn(config.bgColor, config.color, 'border', config.borderColor)
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">节点标题</label>
                    <input
                      type="text"
                      value={selectedNode.title}
                      onChange={(e) => handleUpdateNode('title', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                      placeholder="输入节点标题"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">时间偏移（秒）</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={selectedNode.timeOffset}
                        onChange={(e) => handleUpdateNode('timeOffset', parseInt(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                        min="0"
                      />
                      <span className="text-sm text-slate-500 font-numeric">
                        ≈ {formatDuration(selectedNode.timeOffset)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">口播内容</label>
                    <textarea
                      value={selectedNode.content}
                      onChange={(e) => handleUpdateNode('content', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                      placeholder="输入口播脚本内容..."
                    />
                  </div>

                  {selectedNode.type === 'product' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">关联商品</label>
                      <select
                        value={selectedNode.relatedProductId || ''}
                        onChange={(e) => handleUpdateNode('relatedProductId', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                      >
                        <option value="">请选择关联商品</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ¥{product.price}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {relatedProduct && (
                    <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {relatedProduct.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-danger font-medium">
                              ¥{relatedProduct.price}
                            </span>
                            <span className="text-xs text-slate-500 line-through">
                              ¥{relatedProduct.originalPrice}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          库存 {relatedProduct.stock}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => completeScriptNode(selectedNode.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        selectedNode.isCompleted
                          ? 'bg-success/20 text-success border border-success/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {selectedNode.isCompleted ? '已完成' : '标记完成'}
                    </button>

                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="flex items-center gap-2 px-4 py-2 text-danger hover:bg-danger/10 rounded-lg text-sm font-medium transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除节点
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">选择左侧节点进行编辑</p>
                  <p className="text-xs mt-1">或点击添加按钮创建新节点</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>
                <span className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-success" />
                  优惠倒计时配置
                </span>
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">开始时间（秒）</label>
                    <input
                      type="number"
                      value={promoStartTime}
                      onChange={(e) => setPromoStartTime(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-success/50 focus:ring-1 focus:ring-success/30 transition-all"
                      min="0"
                    />
                    <p className="text-xs text-slate-500 mt-1">约 {formatDuration(promoStartTime)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">结束时间（秒）</label>
                    <input
                      type="number"
                      value={promoEndTime}
                      onChange={(e) => setPromoEndTime(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-danger/50 focus:ring-1 focus:ring-danger/30 transition-all"
                      min="0"
                    />
                    <p className="text-xs text-slate-500 mt-1">约 {formatDuration(promoEndTime)}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">倒计时预览</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-slate-900 px-4 py-3 rounded-lg border border-slate-700/50">
                      <span className="text-3xl font-bold text-success font-mono">
                        {formatDuration(promoCountdown)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 text-center mt-2">
                    优惠持续时长：{formatDuration(promoCountdown)}
                  </p>
                </div>

                <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 h-full bg-gradient-to-r from-success to-success/50 rounded-full"
                    style={{
                      left: `${totalDuration > 0 ? (promoStartTime / totalDuration) * 100 : 0}%`,
                      width: `${totalDuration > 0 ? ((promoEndTime - promoStartTime) / totalDuration) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>00:00</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-850 rounded-xl border border-slate-700/50 w-full max-w-md mx-4 shadow-card animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-100">添加脚本节点</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">节点类型</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(nodeTypeConfig) as ScriptNodeType[]).map((type) => {
                    const config = nodeTypeConfig[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setNewNode({ ...newNode, type })}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2.5 rounded-lg text-xs font-medium transition-all',
                          newNode.type === type
                            ? cn(config.bgColor, config.color, 'border', config.borderColor)
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">节点标题</label>
                <input
                  type="text"
                  value={newNode.title}
                  onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  placeholder="输入节点标题"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">时间偏移（秒）</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={newNode.timeOffset}
                    onChange={(e) => setNewNode({ ...newNode, timeOffset: parseInt(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    min="0"
                  />
                  <span className="text-sm text-slate-500 font-numeric">
                    ≈ {formatDuration(newNode.timeOffset)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">口播内容</label>
                <textarea
                  value={newNode.content}
                  onChange={(e) => setNewNode({ ...newNode, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                  placeholder="输入口播脚本内容..."
                />
              </div>

              {newNode.type === 'product' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">关联商品</label>
                  <select
                    value={newNode.relatedProductId}
                    onChange={(e) => setNewNode({ ...newNode, relatedProductId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  >
                    <option value="">请选择关联商品</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ¥{product.price}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddNode}
                disabled={!newNode.title.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-glow hover:shadow-glow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Script;
