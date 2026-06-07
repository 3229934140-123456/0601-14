import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Clock,
  Tag,
  Package,
  ShoppingCart,
  ListOrdered,
  CheckCircle,
  X,
  Upload,
  AlertTriangle,
  Settings,
  FileText,
  ListTodo,
} from 'lucide-react';
import Card from '@/components/Card/Card';
import { useLiveStore } from '@/store/useLiveStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Product, ProductType } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'list' | 'sort' | 'shelf' | 'import';

interface SortableProductItemProps {
  product: Product;
}

const productTypeLabels: Record<ProductType, string> = {
  main: '主推',
  secondary: '辅推',
  bonus: '福利',
};

const productTypeColors: Record<ProductType, string> = {
  main: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30',
  secondary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  bonus: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const SortableProductItem = ({ product }: SortableProductItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 transition-all',
        isDragging && 'opacity-50 shadow-lg border-primary/50 bg-slate-700/50'
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-medium text-slate-300">
        {product.sortOrder}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{product.name}</p>
      </div>

      <span
        className={cn(
          'px-2.5 py-1 text-xs font-medium rounded-md border',
          productTypeColors[product.type]
        )}
      >
        {productTypeLabels[product.type]}
      </span>
    </div>
  );
};

const Products = () => {
  const {
    products,
    currentSession,
    addProduct,
    updateProduct,
    deleteProduct,
    reorderProducts,
    markProductOnShelf,
    batchImportProducts,
    generateStockReplenishTasks,
    updateStockThreshold,
  } = useLiveStore();

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(100);

  const [formData, setFormData] = useState({
    name: '',
    stock: 0,
    price: 0,
    originalPrice: 0,
    type: 'main' as ProductType,
  });

  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Array<{
    name: string;
    stock: number;
    price: number;
    originalPrice: number;
    type: ProductType;
    isValid: boolean;
    errors: string[];
  }>>([]);

  const stockThreshold = currentSession?.stockWarningThreshold || 100;

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.sortOrder - b.sortOrder),
    [products]
  );

  const shelfProducts = useMemo(
    () =>
      products
        .filter((p) => p.onShelfTime)
        .sort((a, b) => (b.onShelfTime || '').localeCompare(a.onShelfTime || '')),
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter(p => p.stock < stockThreshold),
    [products, stockThreshold]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedProducts.findIndex((p) => p.id === active.id);
      const newIndex = sortedProducts.findIndex((p) => p.id === over.id);
      const newProducts = arrayMove(sortedProducts, oldIndex, newIndex);
      reorderProducts(newProducts);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        stock: product.stock,
        price: product.price,
        originalPrice: product.originalPrice,
        type: product.type,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        stock: 0,
        price: 0,
        originalPrice: 0,
        type: 'main',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该商品吗？')) {
      deleteProduct(id);
    }
  };

  const parseImportText = () => {
    if (!importText.trim()) {
      setImportPreview([]);
      return;
    }

    const lines = importText.trim().split('\n');
    const parsed: Array<{
      name: string;
      stock: number;
      price: number;
      originalPrice: number;
      type: ProductType;
      isValid: boolean;
      errors: string[];
    }> = [];

    const headerKeywords = ['商品', '库存', '价格', '售价', '原价', '类型', '名称', '产品', '数量', '单价'];
    let startIndex = 0;

    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      const hasHeaderKeywords = headerKeywords.some(keyword => firstLine.includes(keyword.toLowerCase()));
      if (hasHeaderKeywords) {
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/[,\t，]/).map(s => s.trim());
      if (parts.length >= 1 && parts[0]) {
        const errors: string[] = [];
        const name = parts[0] || '';

        const stockStr = parts[1];
        const stock = stockStr !== undefined ? parseInt(stockStr) : NaN;
        const isStockValid = !isNaN(stock) && stock >= 0;
        if (!isStockValid) {
          errors.push('库存格式错误');
        }

        const priceStr = parts[2];
        const price = priceStr !== undefined ? parseFloat(priceStr) : NaN;
        const isPriceValid = !isNaN(price) && price >= 0;
        if (!isPriceValid) {
          errors.push('价格格式错误');
        }

        const originalPriceStr = parts[3];
        const originalPrice = originalPriceStr && !isNaN(parseFloat(originalPriceStr))
          ? parseFloat(originalPriceStr)
          : (isPriceValid ? price : 0);

        const typeStr = (parts[4] || 'main').toLowerCase();
        let type: ProductType = 'main';
        if (typeStr.includes('辅') || typeStr === 'secondary') type = 'secondary';
        if (typeStr.includes('福') || typeStr === 'bonus') type = 'bonus';

        const isValid = isStockValid && isPriceValid && !!name;

        parsed.push({
          name,
          stock: isStockValid ? stock : 0,
          price: isPriceValid ? price : 0,
          originalPrice,
          type,
          isValid,
          errors,
        });
      }
    }

    setImportPreview(parsed);
  };

  const handleBatchImport = () => {
    const validProducts = importPreview.filter(item => item.isValid);
    if (validProducts.length === 0) return;
    batchImportProducts(validProducts);
    setImportText('');
    setImportPreview([]);
    setActiveTab('list');
  };

  const handleGenerateReplenishTasks = () => {
    if (lowStockProducts.length === 0) return;
    generateStockReplenishTasks();
    alert(`已生成 ${lowStockProducts.length} 条补货任务，请到任务日志查看`);
  };

  const handleUpdateThreshold = () => {
    if (thresholdInput <= 0) return;
    updateStockThreshold(thresholdInput);
    setShowThresholdModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      setTimeout(parseImportText, 100);
    };
    reader.readAsText(file);
  };

  const tabs = [
    { key: 'list' as TabType, label: '商品列表', icon: Package },
    { key: 'import' as TabType, label: '批量导入', icon: Upload },
    { key: 'sort' as TabType, label: '讲解排序', icon: ListOrdered },
    { key: 'shelf' as TabType, label: '上架记录', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">商品清单</h1>
          <p className="text-sm text-slate-400 mt-1">
            共 {products.length} 件商品
            {lowStockProducts.length > 0 && (
              <span className="ml-2 text-danger">
                <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1" />
                {lowStockProducts.length} 件低库存
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setThresholdInput(stockThreshold);
              setShowThresholdModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-200 rounded-lg text-sm font-medium transition-all hover:bg-slate-700"
          >
            <Settings className="w-4 h-4" />
            库存阈值
          </button>
          {lowStockProducts.length > 0 && (
            <button
              onClick={handleGenerateReplenishTasks}
              className="flex items-center gap-2 px-4 py-2.5 bg-warning/20 text-warning border border-warning/30 rounded-lg text-sm font-medium transition-all hover:bg-warning/30"
            >
              <ListTodo className="w-4 h-4" />
              生成补货任务
            </button>
          )}
          {activeTab === 'list' && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium transition-all hover:bg-primary/90 shadow-glow hover:shadow-glow-hover"
            >
              <Plus className="w-4 h-4" />
              添加商品
            </button>
          )}
        </div>
      </div>

      {lowStockProducts.length > 0 && activeTab === 'list' && (
        <Card className="border-warning/30">
          <Card.Body>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-warning">库存预警提醒</h3>
                <p className="text-sm text-slate-400 mt-1">
                  当前有 <span className="text-warning font-medium">{lowStockProducts.length}</span> 件商品库存低于预警阈值（{stockThreshold}件），请及时补货
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {lowStockProducts.slice(0, 5).map(p => (
                    <span
                      key={p.id}
                      className="px-2.5 py-1 text-xs bg-danger/10 text-danger border border-danger/30 rounded-md"
                    >
                      {p.name}（剩 {p.stock} 件）
                    </span>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <span className="px-2.5 py-1 text-xs bg-slate-700/50 text-slate-400 rounded-md">
                      +{lowStockProducts.length - 5} 件
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleGenerateReplenishTasks}
                className="flex items-center gap-1.5 px-3 py-2 bg-warning/20 text-warning text-xs font-medium rounded-lg hover:bg-warning/30 transition-colors shrink-0"
              >
                <ListTodo className="w-3.5 h-3.5" />
                一键补货
              </button>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card>
        <div className="flex border-b border-slate-700/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 -mb-px',
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

        <div className="p-5">
          {activeTab === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      序号
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      商品名称
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      库存
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      售价
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      原价
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {sortedProducts.map((product, index) => {
                    const isLowStock = product.stock < stockThreshold;
                    return (
                      <tr
                        key={product.id}
                        className={cn(
                          'transition-colors hover:bg-slate-800/40',
                          isLowStock && 'bg-danger/5'
                        )}
                      >
                        <td className="py-3.5 px-4">
                          <span className="text-sm text-slate-400 font-mono">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-200 font-medium">
                              {product.name}
                            </span>
                            {isLowStock && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-danger/20 text-danger rounded">
                                库存低
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'text-sm font-medium',
                              isLowStock
                                ? 'text-danger'
                                : product.stock < stockThreshold * 1.5
                                ? 'text-warning'
                                : 'text-slate-200'
                            )}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-sm font-semibold text-success">
                            {formatCurrency(product.price)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-sm text-slate-500 line-through">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border',
                              productTypeColors[product.type]
                            )}
                          >
                            <Tag className="w-3 h-3" />
                            {productTypeLabels[product.type]}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => markProductOnShelf(product.id)}
                              disabled={!!product.onShelfTime}
                              className={cn(
                                'p-1.5 rounded-md transition-colors',
                                product.onShelfTime
                                  ? 'text-slate-600 cursor-not-allowed'
                                  : 'text-success hover:bg-success/10'
                              )}
                              title={product.onShelfTime ? '已上架' : '标记上架'}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(product)}
                              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sortedProducts.length === 0 && (
                <div className="py-12 text-center">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">暂无商品，点击上方按钮添加</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    粘贴表格文本
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={'商品名,库存,售价,原价,类型\n示例：\n保湿面霜,150,99,199,主推\n口红套装,80,129,259,辅推\n小样礼盒,200,29,99,福利'}
                    rows={12}
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    支持逗号、Tab、中文逗号分隔，每行一个商品
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    导入预览
                  </label>
                  <div className="border border-slate-700/50 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {importPreview.length === 0 ? (
                        <div className="py-12 text-center">
                          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">输入文本后点击解析预览</p>
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-slate-700/30 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">商品名</th>
                              <th className="text-center py-2 px-3 text-xs font-medium text-slate-400">库存</th>
                              <th className="text-center py-2 px-3 text-xs font-medium text-slate-400">售价</th>
                              <th className="text-center py-2 px-3 text-xs font-medium text-slate-400">类型</th>
                              <th className="text-center py-2 px-3 text-xs font-medium text-slate-400">状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/30">
                            {importPreview.map((item, idx) => (
                              <tr key={idx} className={cn(
                                'transition-colors',
                                item.isValid ? 'hover:bg-slate-700/20' : 'bg-danger/10 hover:bg-danger/15'
                              )}>
                                <td className="py-2 px-3 text-slate-200">{item.name}</td>
                                <td className={cn(
                                  'py-2 px-3 text-center',
                                  item.errors.includes('库存格式错误') ? 'text-danger' : 'text-slate-300'
                                )}>
                                  {item.errors.includes('库存格式错误') ? '-' : item.stock}
                                </td>
                                <td className={cn(
                                  'py-2 px-3 text-center',
                                  item.errors.includes('价格格式错误') ? 'text-danger' : 'text-success'
                                )}>
                                  {item.errors.includes('价格格式错误') ? '-' : `¥${item.price}`}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={cn(
                                    'text-[10px] px-1.5 py-0.5 rounded',
                                    productTypeColors[item.type]
                                  )}>
                                    {productTypeLabels[item.type]}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {item.isValid ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30">
                                      有效
                                    </span>
                                  ) : (
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-danger/15 text-danger border border-danger/30 cursor-help"
                                      title={item.errors.join('；')}
                                    >
                                      {item.errors[0] || '无效'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                      共解析到 <span className="text-primary font-medium">{importPreview.length}</span> 条商品
                    </p>
                    <p className="text-xs text-slate-500">
                      有效商品数：<span className="text-success font-medium">{importPreview.filter(i => i.isValid).length}</span>
                      {importPreview.filter(i => !i.isValid).length > 0 && (
                        <span className="ml-2 text-danger">
                          异常 <span className="font-medium">{importPreview.filter(i => !i.isValid).length}</span> 条
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg text-sm cursor-pointer hover:bg-slate-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    上传 CSV 文件
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={parseImportText}
                    className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    解析预览
                  </button>
                  <button
                    onClick={handleBatchImport}
                    disabled={importPreview.filter(i => i.isValid).length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认导入 {importPreview.filter(i => i.isValid).length > 0 && `(${importPreview.filter(i => i.isValid).length}件有效)`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sort' && (
            <div>
              <p className="text-sm text-slate-400 mb-4">
                拖拽调整商品讲解顺序，拖拽手柄在每行左侧
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedProducts.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortedProducts.map((product) => (
                      <SortableProductItem
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {sortedProducts.length === 0 && (
                <div className="py-12 text-center">
                  <ListOrdered className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">暂无商品，请到商品列表添加</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shelf' && (
            <div className="space-y-3">
              {shelfProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">暂无上架记录</p>
                </div>
              ) : (
                shelfProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          上架时间：{formatDateTime(product.onShelfTime!)}
                        </span>
                        {product.duration && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            讲解时长：{product.duration} 分钟
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-md border',
                        productTypeColors[product.type]
                      )}
                    >
                      {productTypeLabels[product.type]}
                    </span>
                    <span className="text-sm font-semibold text-success">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-md bg-slate-850 rounded-xl border border-slate-700/50 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-100">
                {editingProduct ? '编辑商品' : '添加商品'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  商品名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入商品名称"
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    库存数量
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: Number(e.target.value),
                      })
                    }
                    min="0"
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    商品类型
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as ProductType,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  >
                    <option value="main">主推</option>
                    <option value="secondary">辅推</option>
                    <option value="bonus">福利</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    售价（元）
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    原价（元）
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPrice: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingProduct ? '保存修改' : '添加商品'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showThresholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowThresholdModal(false)}
          />
          <div className="relative w-full max-w-sm bg-slate-850 rounded-xl border border-slate-700/50 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-100">
                库存预警阈值设置
              </h3>
              <button
                onClick={() => setShowThresholdModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-slate-400 mb-4">
                当商品库存低于此数值时，将标红提醒并可生成补货任务
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  预警阈值（件）
                </label>
                <input
                  type="number"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(Number(e.target.value))}
                  min="1"
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                当前阈值：{stockThreshold} 件，将影响 {lowStockProducts.length} 件商品的预警状态
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setShowThresholdModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateThreshold}
                disabled={thresholdInput <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
