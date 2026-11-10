import { BadgeItem, PracticeSessionResult, MistakeItem } from '../types/math';

export function calculateBadgeStats(
  sessions: PracticeSessionResult[],
  mistakes: MistakeItem[]
): {
  distinctDays: number;
  totalCorrect: number;
  totalSolved: number;
  bestSpeed: number;
  masteredMistakesCount: number;
} {
  const daySet = new Set<string>();
  let totalCorrect = 0;
  let totalSolved = 0;
  let bestSpeed = 99;

  sessions.forEach(s => {
    const dStr = s.dateStr || new Date(s.timestamp).toISOString().split('T')[0];
    daySet.add(dStr);
    totalSolved += s.totalQuestions;
    totalCorrect += s.correctCount;
    if (s.averageTimeSec > 0 && s.averageTimeSec < bestSpeed) {
      bestSpeed = s.averageTimeSec;
    }
  });

  const masteredMistakesCount = mistakes.filter(m => m.mastered).length;

  return {
    distinctDays: daySet.size,
    totalCorrect,
    totalSolved,
    bestSpeed: bestSpeed === 99 ? 0 : bestSpeed,
    masteredMistakesCount
  };
}

export function evaluateBadges(
  sessions: PracticeSessionResult[],
  mistakes: MistakeItem[]
): BadgeItem[] {
  const stats = calculateBadgeStats(sessions, mistakes);

  const rawBadges: Omit<BadgeItem, 'unlocked' | 'currentProgress'>[] = [
    // 1. 练习天数勋章 (Days active)
    {
      id: 'badge_days_1',
      title: '初露锋芒',
      description: '迈出口算第一步，完成首日口算打卡训练',
      category: 'days',
      requirementType: 'days',
      targetValue: 1,
      rarity: 'bronze',
      iconEmoji: '🌱'
    },
    {
      id: 'badge_days_3',
      title: '坚持不懈',
      description: '连续累积打卡 3 天，良好的口算习惯开始萌芽',
      category: 'days',
      requirementType: 'days',
      targetValue: 3,
      rarity: 'bronze',
      iconEmoji: '🔥'
    },
    {
      id: 'badge_days_7',
      title: '周冠军标兵',
      description: '累计练习满 7 天，完成一周口算全勤挑战',
      category: 'days',
      requirementType: 'days',
      targetValue: 7,
      rarity: 'silver',
      iconEmoji: '🌟'
    },
    {
      id: 'badge_days_14',
      title: '毅力双周王',
      description: '累计练习满 14 天，思维专注度与坚韧品格显著提升',
      category: 'days',
      requirementType: 'days',
      targetValue: 14,
      rarity: 'gold',
      iconEmoji: '👑'
    },
    {
      id: 'badge_days_30',
      title: '恒心大宗师',
      description: '满月累计练习达 30 天，口算思维已经化为本能',
      category: 'days',
      requirementType: 'days',
      targetValue: 30,
      rarity: 'diamond',
      iconEmoji: '🏆'
    },

    // 2. 答对题量勋章 (Total correct solved)
    {
      id: 'badge_correct_10',
      title: '口算小萌新',
      description: '在5秒倒计时挑战中累计答对 10 道题目',
      category: 'correct',
      requirementType: 'correct',
      targetValue: 10,
      rarity: 'bronze',
      iconEmoji: '🎯'
    },
    {
      id: 'badge_correct_50',
      title: '百战小英雄',
      description: '累计答对 50 道题目，口算准确率稳步进阶',
      category: 'correct',
      requirementType: 'correct',
      targetValue: 50,
      rarity: 'bronze',
      iconEmoji: '⚔️'
    },
    {
      id: 'badge_correct_100',
      title: '百题斩破关王',
      description: '成功答对 100 道题目，荣膺百题心算小达人',
      category: 'correct',
      requirementType: 'correct',
      targetValue: 100,
      rarity: 'silver',
      iconEmoji: '🥇'
    },
    {
      id: 'badge_correct_200',
      title: '速算小霸王',
      description: '累计答对 200 道数学题，心算速度与技巧炉火纯青',
      category: 'correct',
      requirementType: 'correct',
      targetValue: 200,
      rarity: 'gold',
      iconEmoji: '💎'
    },
    {
      id: 'badge_correct_500',
      title: '心算数学家',
      description: '突破 500 道答对大关，计算准确率超越 95% 的同龄人',
      category: 'correct',
      requirementType: 'correct',
      targetValue: 500,
      rarity: 'gold',
      iconEmoji: '🚀'
    },
    {
      id: 'badge_correct_1000',
      title: '千题无双宗师',
      description: '累计答对 1000 道数学题，成为令人瞩目的数学天才',
      category: 'correct',
      requirementType: 'correct',
      targetValue: 1000,
      rarity: 'diamond',
      iconEmoji: '🪐'
    },

    // 3. 专项与技巧成就 (Special skills)
    {
      id: 'badge_speed_lightning',
      title: '极速闪电侠',
      description: '单轮5秒挑战平均耗时小于 2.8 秒，心算犹如闪电',
      category: 'special',
      requirementType: 'speed',
      targetValue: 2.8,
      rarity: 'gold',
      iconEmoji: '⚡'
    },
    {
      id: 'badge_mistakes_cleaner',
      title: '错题清道夫',
      description: '在错题本中通过独立重练攻克 3 道以上顽固错题',
      category: 'special',
      requirementType: 'mistakes',
      targetValue: 3,
      rarity: 'silver',
      iconEmoji: '🛡️'
    }
  ];

  return rawBadges.map(b => {
    let currentProgress = 0;
    let unlocked = false;

    if (b.requirementType === 'days') {
      currentProgress = stats.distinctDays;
      unlocked = currentProgress >= b.targetValue;
    } else if (b.requirementType === 'correct') {
      currentProgress = stats.totalCorrect;
      unlocked = currentProgress >= b.targetValue;
    } else if (b.requirementType === 'speed') {
      currentProgress = stats.bestSpeed > 0 ? stats.bestSpeed : 0;
      unlocked = stats.bestSpeed > 0 && stats.bestSpeed <= b.targetValue;
    } else if (b.requirementType === 'mistakes') {
      currentProgress = stats.masteredMistakesCount;
      unlocked = currentProgress >= b.targetValue;
    }

    return {
      ...b,
      unlocked,
      currentProgress,
      unlockedAt: unlocked ? Date.now() : undefined
    };
  });
}
