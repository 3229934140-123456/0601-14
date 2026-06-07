import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Type,
  ImageIcon,
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Gauge,
  Ban,
  AlertTriangle,
  Play,
} from 'lucide-react';
import Card from '@/components/Card/Card';
import Progress from '@/components/Progress/Progress';
import { checkTitle, checkCover, getAccountStatus } from '@/utils/validation';
import type { TitleCheckResult, CoverCheckResult, AccountStatus } from '@/types';

const AccountCheck = () => {
  const [直播标题, 设置直播标题] = useState('');
  const [标题校验结果, 设置标题校验结果] = useState<TitleCheckResult | null>(null);

  const [封面图片, 设置封面图片] = useState<string | null>(null);
  const [封面检测结果, 设置封面检测结果] = useState<CoverCheckResult | null>(null);
  const [是否拖拽中, 设置是否拖拽中] = useState(false);
  const 文件输入引用 = useRef<HTMLInputElement>(null);

  const [账号状态, 设置账号状态] = useState<AccountStatus | null>(null);

  useEffect(() => {
    const 状态 = getAccountStatus();
    设置账号状态(状态);
  }, []);

  useEffect(() => {
    const 结果 = checkTitle(直播标题);
    设置标题校验结果(结果);
  }, [直播标题]);

  const 处理标题变化 = (事件: React.ChangeEvent<HTMLInputElement>) => {
    设置直播标题(事件.target.value);
  };

  const 处理文件选择 = useCallback((文件: File) => {
    if (!文件.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    const 读取器 = new FileReader();
    读取器.onload = (读取事件) => {
      const 数据地址 = 读取事件.target?.result as string;
      设置封面图片(数据地址);

      const 图片 = new Image();
      图片.onload = () => {
        const 结果 = checkCover(文件, 图片.width, 图片.height);
        设置封面检测结果(结果);
      };
      图片.src = 数据地址;
    };
    读取器.readAsDataURL(文件);
  }, []);

  const 处理拖拽进入 = (事件: React.DragEvent) => {
    事件.preventDefault();
    事件.stopPropagation();
    设置是否拖拽中(true);
  };

  const 处理拖拽离开 = (事件: React.DragEvent) => {
    事件.preventDefault();
    事件.stopPropagation();
    设置是否拖拽中(false);
  };

  const 处理拖拽悬停 = (事件: React.DragEvent) => {
    事件.preventDefault();
    事件.stopPropagation();
  };

  const 处理放置 = (事件: React.DragEvent) => {
    事件.preventDefault();
    事件.stopPropagation();
    设置是否拖拽中(false);

    const 文件列表 = 事件.dataTransfer.files;
    if (文件列表.length > 0) {
      处理文件选择(文件列表[0]);
    }
  };

  const 处理输入框变化 = (事件: React.ChangeEvent<HTMLInputElement>) => {
    const 文件列表 = 事件.target.files;
    if (文件列表 && 文件列表.length > 0) {
      处理文件选择(文件列表[0]);
    }
  };

  const 处理上传区域点击 = () => {
    文件输入引用.current?.click();
  };

  const 获取评分颜色 = (分数: number): 'primary' | 'success' | 'warning' | 'danger' => {
    if (分数 >= 80) return 'success';
    if (分数 >= 60) return 'warning';
    return 'danger';
  };

  const 获取健康度颜色 = (分数: number): 'primary' | 'success' | 'warning' | 'danger' => {
    if (分数 >= 90) return 'success';
    if (分数 >= 70) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">账号检查</h1>
        <p className="text-sm text-slate-400 mt-1">
          开播前全面检查标题、封面和账号状态，确保直播顺利进行
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              <Card.Title>标题校验</Card.Title>
            </div>
          </Card.Header>
          <Card.Body className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">直播标题</label>
                <span className="text-xs text-slate-500">
                  {直播标题.length} 字
                </span>
              </div>
              <input
                type="text"
                value={直播标题}
                onChange={处理标题变化}
                placeholder="请输入直播标题..."
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>

            {标题校验结果 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-primary" />
                      标题评分
                    </span>
                    <span className={`text-sm font-bold ${
                      标题校验结果.score >= 80 ? 'text-success' :
                      标题校验结果.score >= 60 ? 'text-warning' : 'text-danger'
                    }`}>
                      {标题校验结果.score} 分
                    </span>
                  </div>
                  <Progress
                    value={标题校验结果.score}
                    color={获取评分颜色(标题校验结果.score)}
                    size="lg"
                  />
                </div>

                {标题校验结果.issues.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-danger" />
                      <span className="text-sm font-medium text-danger">问题列表</span>
                    </div>
                    <ul className="space-y-1.5">
                      {标题校验结果.issues.map((问题, 索引) => (
                        <li key={索引} className="flex items-start gap-2 text-xs text-slate-400">
                          <XCircle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                          <span>{问题}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {标题校验结果.suggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-warning" />
                      <span className="text-sm font-medium text-warning">优化建议</span>
                    </div>
                    <ul className="space-y-1.5">
                      {标题校验结果.suggestions.map((建议, 索引) => (
                        <li key={索引} className="flex items-start gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                          <span>{建议}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              <Card.Title>封面检测</Card.Title>
            </div>
          </Card.Header>
          <Card.Body className="space-y-4">
            <div
              onClick={处理上传区域点击}
              onDragEnter={处理拖拽进入}
              onDragLeave={处理拖拽离开}
              onDragOver={处理拖拽悬停}
              onDrop={处理放置}
              className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                是否拖拽中
                  ? 'border-primary bg-primary/10'
                  : 'border-slate-700/50 hover:border-primary/50 hover:bg-slate-800/30'
              }`}
            >
              <input
                ref={文件输入引用}
                type="file"
                accept="image/*"
                onChange={处理输入框变化}
                className="hidden"
              />
              {封面图片 ? (
                <div className="relative">
                  <img
                    src={封面图片}
                    alt="封面预览"
                    className="max-h-40 mx-auto rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="py-6">
                  <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400">点击或拖拽上传封面图片</p>
                  <p className="text-xs text-slate-500 mt-1">支持 JPG、PNG、WebP 格式</p>
                </div>
              )}
            </div>

            {封面检测结果 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">尺寸</p>
                    <p className="text-sm font-medium text-slate-200">
                      {封面检测结果.width} × {封面检测结果.height}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">比例</p>
                    <p className="text-sm font-medium text-slate-200">
                      {封面检测结果.ratio}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">大小</p>
                    <p className="text-sm font-medium text-slate-200">
                      {封面检测结果.sizeKB} KB
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">检测结果</p>
                    <p className={`text-sm font-medium flex items-center gap-1 ${
                      封面检测结果.isValid ? 'text-success' : 'text-danger'
                    }`}>
                      {封面检测结果.isValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          合格
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          不合格
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {封面检测结果.issues.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-sm font-medium text-warning">检测问题</span>
                    </div>
                    <ul className="space-y-1.5">
                      {封面检测结果.issues.map((问题, 索引) => (
                        <li key={索引} className="flex items-start gap-2 text-xs text-slate-400">
                          <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                          <span>{问题}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <Card.Title>账号状态</Card.Title>
            </div>
          </Card.Header>
          <Card.Body className="space-y-4">
            {账号状态 && (
              <>
                <div className="text-center py-4">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${
                    账号状态.canStartLive
                      ? 'bg-success/20'
                      : 'bg-danger/20'
                  }`}>
                    {账号状态.canStartLive ? (
                      <Play className="w-9 h-9 text-success" fill="currentColor" />
                    ) : (
                      <Ban className="w-9 h-9 text-danger" />
                    )}
                  </div>
                  <p className={`text-lg font-semibold ${
                    账号状态.canStartLive ? 'text-success' : 'text-danger'
                  }`}>
                    {账号状态.canStartLive ? '可以开播' : '暂不可开播'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-primary" />
                      健康度评分
                    </span>
                    <span className={`text-sm font-bold ${
                      账号状态.healthScore >= 90 ? 'text-success' :
                      账号状态.healthScore >= 70 ? 'text-warning' : 'text-danger'
                    }`}>
                      {账号状态.healthScore} 分
                    </span>
                  </div>
                  <Progress
                    value={账号状态.healthScore}
                    color={获取健康度颜色(账号状态.healthScore)}
                    size="lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">违规次数</p>
                    <p className={`text-lg font-bold ${
                      账号状态.violationCount === 0 ? 'text-success' : 'text-warning'
                    }`}>
                      {账号状态.violationCount} 次
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">警告数量</p>
                    <p className={`text-lg font-bold ${
                      账号状态.warnings.length === 0 ? 'text-success' : 'text-warning'
                    }`}>
                      {账号状态.warnings.length} 条
                    </p>
                  </div>
                </div>

                {账号状态.warnings.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-sm font-medium text-warning">警告列表</span>
                    </div>
                    <ul className="space-y-2">
                      {账号状态.warnings.map((警告, 索引) => (
                        <li
                          key={索引}
                          className="flex items-start gap-2 p-2.5 bg-warning/10 border border-warning/20 rounded-lg"
                        >
                          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300">{警告}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default AccountCheck;
