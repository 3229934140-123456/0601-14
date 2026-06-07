import type { TitleCheckResult, CoverCheckResult, AccountStatus } from '@/types';

const SENSITIVE_WORDS = [
  '最高级', '国家级', '第一', '唯一', '绝对',
  '最好', '最强', '极致', '完美', '顶级'
];

const GOOD_KEYWORDS = [
  '限时', '优惠', '福利', '秒杀', '爆款',
  '新品', '首发', '专属', '特惠', '直降'
];

export const checkTitle = (title: string): TitleCheckResult => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!title.trim()) {
    return {
      score: 0,
      issues: ['标题不能为空'],
      suggestions: ['请输入直播标题']
    };
  }

  if (title.length < 5) {
    score -= 20;
    issues.push('标题过短');
    suggestions.push('建议标题长度在10-20字之间');
  } else if (title.length > 30) {
    score -= 10;
    issues.push('标题过长');
    suggestions.push('建议标题控制在30字以内');
  }

  const foundSensitive = SENSITIVE_WORDS.filter(word => title.includes(word));
  if (foundSensitive.length > 0) {
    score -= foundSensitive.length * 15;
    issues.push(`包含敏感词: ${foundSensitive.join('、')}`);
    suggestions.push('请替换敏感词，使用合规的表述方式');
  }

  const foundGood = GOOD_KEYWORDS.filter(word => title.includes(word));
  if (foundGood.length === 0) {
    score -= 10;
    suggestions.push('可添加营销词汇提升吸引力，如"限时"、"福利"、"爆款"等');
  } else if (foundGood.length >= 3) {
    score += 5;
  }

  if (!/[0-9]/.test(title)) {
    suggestions.push('可加入数字增强说服力，如"99元"、"3折"等');
  }

  score = Math.max(0, Math.min(100, score));

  return { score, issues, suggestions };
};

export const checkCover = (file: File, width: number, height: number): CoverCheckResult => {
  const issues: string[] = [];
  const ratio = (width / height).toFixed(2);
  const sizeKB = Math.round(file.size / 1024);

  const targetRatios = [{ name: '1:1', value: 1 }, { name: '16:9', value: 16 / 9 }, { name: '9:16', value: 9 / 16 }];
  const isRatioValid = targetRatios.some(r => Math.abs(width / height - r.value) < 0.05);

  if (!isRatioValid) {
    issues.push(`图片比例 ${ratio} 不推荐，建议使用 1:1、16:9 或 9:16`);
  }

  if (width < 720 || height < 720) {
    issues.push('图片分辨率过低，建议最低 720x720');
  }

  if (sizeKB > 2048) {
    issues.push(`图片大小 ${sizeKB}KB 超过限制，建议 2MB 以内`);
  }

  return {
    width,
    height,
    ratio,
    sizeKB,
    isValid: issues.length === 0,
    issues
  };
};

export const getAccountStatus = (): AccountStatus => {
  return {
    healthScore: 92,
    canStartLive: true,
    violationCount: 1,
    warnings: [
      '上次直播有1次轻微违规，请遵守平台规则',
      '建议开播前检查商品资质是否齐全'
    ]
  };
};
