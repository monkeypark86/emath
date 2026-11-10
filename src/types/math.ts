export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

export type GradeLevel = 'grade1' | 'grade2' | 'grade3' | 'grade4' | 'grade5_6' | 'custom';

export interface MathQuestion {
  id: string;
  num1: number;
  num2: number;
  operator: OperationType;
  operatorSymbol: '+' | '-' | '×' | '÷';
  correctAnswer: number;
  explanation: string;
  methodTip: string; // e.g. 凑十法, 破十法, 乘法口诀
  difficultyGrade: string;
}

export interface QuestionAttempt {
  question: MathQuestion;
  userAnswer: number | null;
  isCorrect: boolean;
  timeSpentSec: number;
  isTimeout: boolean;
  timestamp: number;
}

export interface PracticeSessionResult {
  id: string;
  timestamp: number;
  dateStr: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
  accuracyRate: number; // 0 - 100
  averageTimeSec: number;
  attempts: QuestionAttempt[];
  gradeLevel: GradeLevel;
  operations: OperationType[];
  score: number;
  starsEarned: number;
}

export interface MistakeItem {
  id: string;
  question: MathQuestion;
  wrongAnswer: number | null;
  isTimeout: boolean;
  timeSpentSec: number;
  wrongCount: number;
  mastered: boolean;
  lastPracticedAt: number;
  firstFailedAt: number;
  historyAttempts?: {
    date: number;
    answer: number | null;
    isCorrect: boolean;
  }[];
}

export interface QuestionBankRule {
  id: string;
  name: string;
  description: string;
  operations: OperationType[];
  num1Digits: number; // 1, 2, 3, 4 位数
  num2Digits: number; // 1, 2, 3 位数
  allowCarry?: boolean; // 加法是否进位
  allowBorrow?: boolean; // 减法是否退位
  mustDivideClean?: boolean; // 除法是否整除
  isPreset?: boolean;
  createdAt: number;
}

export interface CustomManualQuestion {
  id: string;
  num1: number;
  num2: number;
  operatorSymbol: '+' | '-' | '×' | '÷';
  correctAnswer: number;
  methodTip?: string;
  bankId?: string;
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  category: 'days' | 'correct' | 'special';
  requirementType: 'days' | 'correct' | 'speed' | 'mistakes';
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: number;
  currentProgress: number;
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond';
  iconEmoji: string;
}

export interface ParentSettings {
  dailyTargetCount: number;
  targetAccuracyRate: number;
  perQuestionSeconds: number; // default 5s
  studentName: string;
  grade: GradeLevel;
  rewardGoalTitle: string;
  rewardGoalStarsNeeded: number;
  currentStars: number;
  soundEnabled: boolean;
  activeBankId?: string;
}

export interface DailyActivityStat {
  date: string; // YYYY-MM-DD
  questionCount: number;
  correctCount: number;
  accuracyRate: number;
  avgSpeedSec: number;
}

export interface WeakPointAnalysis {
  category: string;
  description: string;
  accuracy: number;
  avgTime: number;
  recommendation: string;
}

export interface StudentPreferences {
  equationLayout: 'vertical' | 'horizontal' | 'auto'; // 算式显示偏好: 立式(竖式)优先 | 横式优先 | 智能根据题型
  soundEnabled: boolean; // 音效开关
  celebrationConfetti: boolean; // 连击礼花彩带与成就音效
  autoSubmitWhenComplete: boolean; // 输入位数匹配时自动提交(防漏点确认)
  fontSizeScale: 'normal' | 'large' | 'xl'; // 护眼字号放大
  perQuestionSeconds: number; // 单题倒计时: 3s (疾速), 5s (标准), 8s (基础), 0(无限制)
  selectedOps: OperationType[]; // 包含的运算类型 (可多选): 加减乘除
  questionCount: number; // 每轮挑战题量: 10, 20, 30
  motto: string; // 个性励志座右铭
  themeColor: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose'; // 专属主题色调
}

export interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  grade: GradeLevel;
  dailyTargetCount: number;
  targetAccuracyRate: number;
  rewardGoalTitle: string;
  rewardGoalStarsNeeded: number;
  currentStars: number;
  preferences?: StudentPreferences;
  createdAt: number;
  lastActiveAt?: number;
}

