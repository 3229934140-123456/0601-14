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
} from 'lucide-react';
import Card from '@/components/Card/Card';
import { useLiveStore } from '@/store/useLiveStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Product, ProductType } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'list' | 'sort' | 'shelf';

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
    addProduct,
    updateProduct,
    deleteProduct,
    reorderProducts,
    markProductOnShelf,
  } = useLiveStore();

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    stock: 0,
    price: 0,
    originalPrice: 0,
    type: 'main' as ProductType,
  });

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

  const tabs = [
    { key: 'list' as TabType, label: '商品列表', icon: Package },
    { key: 'sort' as TabType, label: '讲解排序', icon: ListOrdered },
    { key: 'shelf' as TabType, label: '上架记录', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">商品清单</h1>
          <p className="text-sm text-slate-400 mt-1">管理直播带货商品，设置讲解顺序</p>
        </div>
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
                  {sortedProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-slate-400 font-mono">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-slate-200 font-medium">
                          {product.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            product.stock < 50
                              ? 'text-danger'
                              : product.stock < 100
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
                  ))}
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
    </div>
  );
};

export default Products;
