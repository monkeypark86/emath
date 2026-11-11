import {
  DailyActivityStat,
  GradeLevel,
  MathQuestion,
  MistakeItem,
  ParentSettings,
  PracticeSessionResult,
  QuestionBankRule,
  CustomManualQuestion,
  WeakPointAnalysis,
  StudentProfile,
  StudentPreferences
} from '../types/math';
import { PRESET_QUESTION_BANKS } from './mathGenerator';

const MISTAKES_KEY = 'math_mistakes_v1';
const SESSIONS_KEY = 'math_sessions_v1';
const SETTINGS_KEY = 'math_parent_settings_v1';
const BANKS_KEY = 'math_custom_banks_v1';
const MANUAL_QUESTIONS_KEY = 'math_manual_questions_v1';
const PROFILES_KEY = 'math_student_profiles_v1';
const ACTIVE_STUDENT_ID_KEY = 'math_active_student_id_v1';

export function getQuestionBanks(): QuestionBankRule[] {
  try {
    const raw = localStorage.getItem(BANKS_KEY);
    const custom: QuestionBankRule[] = raw ? JSON.parse(raw) : [];
    return [...PRESET_QUESTION_BANKS, ...custom];
  } catch {
    return PRESET_QUESTION_BANKS;
  }
}

export function saveCustomBank(bank: QuestionBankRule): void {
  try {
    const raw = localStorage.getItem(BANKS_KEY);
    const custom: QuestionBankRule[] = raw ? JSON.parse(raw) : [];
    const index = custom.findIndex(b => b.id === bank.id);
    if (index >= 0) {
      custom[index] = bank;
    } else {
      custom.push(bank);
    }
    localStorage.setItem(BANKS_KEY, JSON.stringify(custom));
  } catch (e) {
    console.error('Failed to save bank', e);
  }
}

export function deleteCustomBank(bankId: string): void {
  try {
    const raw = localStorage.getItem(BANKS_KEY);
    const custom: QuestionBankRule[] = raw ? JSON.parse(raw) : [];
    const filtered = custom.filter(b => b.id !== bankId);
    localStorage.setItem(BANKS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete bank', e);
  }
}

export function getCustomManualQuestions(): CustomManualQuestion[] {
  try {
    const raw = localStorage.getItem(MANUAL_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomManualQuestion(q: CustomManualQuestion): void {
  try {
    const list = getCustomManualQuestions();
    list.unshift(q);
    localStorage.setItem(MANUAL_QUESTIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to add manual question', e);
  }
}

export function removeCustomManualQuestion(id: string): void {
  try {
    const list = getCustomManualQuestions().filter(q => q.id !== id);
    localStorage.setItem(MANUAL_QUESTIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to remove manual question', e);
  }
}

export function formatGradeLabel(grade?: GradeLevel): string {
  switch (grade) {
    case 'grade1': return '一年级';
    case 'grade2': return '二年级';
    case 'grade3': return '三年级';
    case 'grade4': return '四年级';
    case 'grade5_6': return '五/六年级';
    case 'custom': return '自定义练习';
    default: return '二年级';
  }
}

export function formatGradeDetail(grade?: GradeLevel): string {
  switch (grade) {
    case 'grade1': return '20以内进退位加减';
    case 'grade2': return '100以内&九九乘除';
    case 'grade3': return '千以内乘除速算';
    case 'grade4': return '多位数巧算简算';
    case 'grade5_6': return '四则混合运算';
    case 'custom': return '自选综合难度';
    default: return '100以内&九九乘除';
  }
}

export const DEFAULT_STUDENT_PREFERENCES: StudentPreferences = {
  equationLayout: 'vertical', // 算式默认立式(竖式)优先
  soundEnabled: true,
  celebrationConfetti: true,
  autoSubmitWhenComplete: false, // 稳扎稳打手动确定
  fontSizeScale: 'normal',
  perQuestionSeconds: 5,
  selectedOps: ['add', 'subtract', 'multiply', 'divide'],
  questionCount: 30,
  motto: '每天坚持口算，我是速算小达人！',
  themeColor: 'amber'
};

export const DEFAULT_STUDENTS: StudentProfile[] = [
  {
    id: 'student_hanna',
    name: 'Hanna',
    avatar: '🐰',
    grade: 'grade1',
    dailyTargetCount: 15,
    targetAccuracyRate: 90,
    rewardGoalTitle: '挑选一本喜欢的科普绘本',
    rewardGoalStarsNeeded: 40,
    currentStars: 0,
    preferences: {
      ...DEFAULT_STUDENT_PREFERENCES,
      equationLayout: 'vertical',
      fontSizeScale: 'large', // 一年级护眼大字
      selectedOps: ['add', 'subtract'],
      questionCount: 15,
      perQuestionSeconds: 5,
      motto: '凑十破十法，每天进步一点点！',
      themeColor: 'rose'
    },
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  },
  {
    id: 'student_danna',
    name: 'Danna',
    avatar: '🦁',
    grade: 'grade2',
    dailyTargetCount: 20,
    targetAccuracyRate: 90,
    rewardGoalTitle: '去游乐园玩旋转木马',
    rewardGoalStarsNeeded: 50,
    currentStars: 0,
    preferences: {
      ...DEFAULT_STUDENT_PREFERENCES,
      equationLayout: 'vertical',
      fontSizeScale: 'normal',
      selectedOps: ['add', 'subtract', 'multiply', 'divide'],
      questionCount: 20,
      perQuestionSeconds: 5,
      motto: '乘除口诀记得牢，立式计算快又准！',
      themeColor: 'blue'
    },
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  }
];

export function getStudentProfiles(): StudentProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list.map(p => ({
          ...p,
          preferences: p.preferences
            ? { ...DEFAULT_STUDENT_PREFERENCES, ...p.preferences }
            : { ...DEFAULT_STUDENT_PREFERENCES }
        }));
      }
    }
  } catch {}
  return DEFAULT_STUDENTS;
}

export function saveStudentProfiles(profiles: StudentProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save student profiles', e);
  }
}

export function getActiveStudentId(): string {
  try {
    const id = localStorage.getItem(ACTIVE_STUDENT_ID_KEY);
    if (id) {
      const profiles = getStudentProfiles();
      if (profiles.some(p => p.id === id)) return id;
    }
  } catch {}
  return DEFAULT_STUDENTS[0].id;
}

export function setActiveStudentId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_STUDENT_ID_KEY, id);
    const profiles = getStudentProfiles();
    const target = profiles.find(p => p.id === id);
    if (target) {
      target.lastActiveAt = Date.now();
      saveStudentProfiles(profiles);
    }
  } catch (e) {
    console.error('Failed to set active student', e);
  }
}

export function getActiveStudent(): StudentProfile {
  const activeId = getActiveStudentId();
  const profiles = getStudentProfiles();
  const student = profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_STUDENTS[0];
  if (!student.preferences) {
    student.preferences = { ...DEFAULT_STUDENT_PREFERENCES };
  }
  return student;
}

export function getStudentPreferences(studentId?: string): StudentPreferences {
  const profiles = getStudentProfiles();
  const targetId = studentId || getActiveStudentId();
  const student = profiles.find(p => p.id === targetId);
  return student?.preferences || { ...DEFAULT_STUDENT_PREFERENCES };
}

export function saveStudentPreferences(preferences: StudentPreferences, studentId?: string): void {
  const profiles = getStudentProfiles();
  const targetId = studentId || getActiveStudentId();
  const student = profiles.find(p => p.id === targetId);
  if (student) {
    student.preferences = preferences;
    saveStudentProfiles(profiles);
  }
}

export function createStudentProfile(data: Omit<StudentProfile, 'id' | 'createdAt'>): StudentProfile {
  const profiles = getStudentProfiles();
  const newProfile: StudentProfile = {
    ...data,
    preferences: data.preferences || { ...DEFAULT_STUDENT_PREFERENCES },
    id: 'student_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  };
  profiles.push(newProfile);
  saveStudentProfiles(profiles);
  setActiveStudentId(newProfile.id);
  return newProfile;
}

export function updateStudentProfile(profile: StudentProfile): void {
  const profiles = getStudentProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  const normalized: StudentProfile = {
    ...profile,
    preferences: profile.preferences
      ? { ...DEFAULT_STUDENT_PREFERENCES, ...profile.preferences }
      : { ...DEFAULT_STUDENT_PREFERENCES },
    lastActiveAt: Date.now()
  };
  if (idx >= 0) {
    profiles[idx] = normalized;
  } else {
    profiles.push(normalized);
  }
  saveStudentProfiles(profiles);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('emath_student_profile_updated', { detail: normalized }));
  }
}

export function deleteStudentProfile(id: string): void {
  const profiles = getStudentProfiles().filter(p => p.id !== id);
  if (profiles.length === 0) {
    saveStudentProfiles(DEFAULT_STUDENTS);
    setActiveStudentId(DEFAULT_STUDENTS[0].id);
  } else {
    saveStudentProfiles(profiles);
    if (getActiveStudentId() === id) {
      setActiveStudentId(profiles[0].id);
    }
  }
}

export const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  dailyTargetCount: 15,
  targetAccuracyRate: 90,
  perQuestionSeconds: 5,
  studentName: 'Hanna',
  grade: 'grade1',
  rewardGoalTitle: '挑选一本喜欢的科普绘本',
  rewardGoalStarsNeeded: 40,
  currentStars: 0,
  soundEnabled: true,
};

export function getParentSettings(studentId?: string): ParentSettings {
  const id = studentId || getActiveStudentId();
  const profiles = getStudentProfiles();
  const student = profiles.find(p => p.id === id) || profiles[0] || DEFAULT_STUDENTS[0];
  return {
    dailyTargetCount: student.dailyTargetCount,
    targetAccuracyRate: student.targetAccuracyRate,
    perQuestionSeconds: student.preferences?.perQuestionSeconds || 5,
    studentName: student.name,
    grade: student.grade,
    rewardGoalTitle: student.rewardGoalTitle,
    rewardGoalStarsNeeded: student.rewardGoalStarsNeeded,
    currentStars: student.currentStars,
    soundEnabled: student.preferences?.soundEnabled !== false
  };
}

export function saveParentSettings(settings: ParentSettings, studentId?: string): void {
  try {
    const id = studentId || getActiveStudentId();
    const profiles = getStudentProfiles();
    const student = profiles.find(p => p.id === id);
    if (student) {
      student.name = settings.studentName;
      student.grade = settings.grade;
      student.dailyTargetCount = settings.dailyTargetCount;
      student.targetAccuracyRate = settings.targetAccuracyRate;
      student.rewardGoalTitle = settings.rewardGoalTitle;
      student.rewardGoalStarsNeeded = settings.rewardGoalStarsNeeded;
      student.currentStars = settings.currentStars;
      if (!student.preferences) {
        student.preferences = { ...DEFAULT_STUDENT_PREFERENCES };
      }
      student.preferences.perQuestionSeconds = settings.perQuestionSeconds;
      student.preferences.soundEnabled = settings.soundEnabled;
      updateStudentProfile(student);
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save parent settings', e);
  }
}

export function addStars(count: number, studentId?: string): number {
  const id = studentId || getActiveStudentId();
  const profiles = getStudentProfiles();
  const student = profiles.find(p => p.id === id);
  if (student) {
    student.currentStars = Math.max(0, student.currentStars + count);
    saveStudentProfiles(profiles);
    return student.currentStars;
  }
  return 0;
}

const getMistakesKey = (studentId?: string) => {
  const id = studentId || getActiveStudentId();
  return `math_mistakes_${id}`;
};

const getSessionsKey = (studentId?: string) => {
  const id = studentId || getActiveStudentId();
  return `math_sessions_${id}`;
};

export function getMistakes(studentId?: string): MistakeItem[] {
  try {
    const key = getMistakesKey(studentId);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function saveMistakes(mistakes: MistakeItem[], studentId?: string): void {
  try {
    const key = getMistakesKey(studentId);
    localStorage.setItem(key, JSON.stringify(mistakes));
  } catch (e) {
    console.error('Failed to save mistakes', e);
  }
}

export function recordMistake(
  question: MathQuestion,
  wrongAnswer: number | null,
  isTimeout: boolean,
  timeSpentSec: number,
  studentId?: string
): MistakeItem {
  const targetId = studentId || getActiveStudentId();
  const mistakes = getMistakes(targetId);
  const existingIndex = mistakes.findIndex(
    m =>
      m.question.num1 === question.num1 &&
      m.question.num2 === question.num2 &&
      m.question.operatorSymbol === question.operatorSymbol
  );

  const now = Date.now();
  let item: MistakeItem;

  if (existingIndex >= 0) {
    item = {
      ...mistakes[existingIndex],
      wrongAnswer,
      isTimeout,
      timeSpentSec,
      wrongCount: mistakes[existingIndex].wrongCount + 1,
      mastered: false,
      lastPracticedAt: now,
      historyAttempts: [
        ...(mistakes[existingIndex].historyAttempts || []),
        { date: now, answer: wrongAnswer, isCorrect: false }
      ]
    };
    mistakes[existingIndex] = item;
  } else {
    item = {
      id: 'mistake_' + Math.random().toString(36).substring(2, 9),
      question,
      wrongAnswer,
      isTimeout,
      timeSpentSec,
      wrongCount: 1,
      mastered: false,
      firstFailedAt: now,
      lastPracticedAt: now,
      historyAttempts: [{ date: now, answer: wrongAnswer, isCorrect: false }]
    };
    mistakes.unshift(item);
  }

  saveMistakes(mistakes, targetId);
  return item;
}

export function markMistakeMastered(id: string, mastered: boolean = true, studentId?: string): void {
  const targetId = studentId || getActiveStudentId();
  const mistakes = getMistakes(targetId);
  const item = mistakes.find(m => m.id === id);
  if (item) {
    item.mastered = mastered;
    item.lastPracticedAt = Date.now();
    saveMistakes(mistakes, targetId);
  }
}

export function removeMistake(id: string, studentId?: string): void {
  const targetId = studentId || getActiveStudentId();
  const mistakes = getMistakes(targetId).filter(m => m.id !== id);
  saveMistakes(mistakes, targetId);
}

export function getPracticeSessions(studentId?: string): PracticeSessionResult[] {
  try {
    const key = getSessionsKey(studentId);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function savePracticeSession(session: PracticeSessionResult, studentId?: string): void {
  try {
    const targetId = studentId || session.studentId || getActiveStudentId();
    const profiles = getStudentProfiles();
    const student = profiles.find(p => p.id === targetId);

    const enrichedSession: PracticeSessionResult = {
      ...session,
      studentId: targetId,
      studentName: session.studentName || student?.name || 'Hanna'
    };

    const sessions = getPracticeSessions(targetId);
    const existingIndex = sessions.findIndex(s => s.id === enrichedSession.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = enrichedSession;
    } else {
      sessions.unshift(enrichedSession);
    }
    if (sessions.length > 100) sessions.length = 100;
    const key = getSessionsKey(targetId);
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

// Generate analytics diagnostics for Parent Dashboard
export function getWeakPointAnalysis(mistakes: MistakeItem[], sessions: PracticeSessionResult[]): WeakPointAnalysis[] {
  const analyses: WeakPointAnalysis[] = [];
  
  // 1. Group mistakes by operation
  const byOp: Record<string, { total: number; timeouts: number }> = {
    '+': { total: 0, timeouts: 0 },
    '-': { total: 0, timeouts: 0 },
    '×': { total: 0, timeouts: 0 },
    '÷': { total: 0, timeouts: 0 }
  };

  mistakes.forEach(m => {
    const sym = m.question.operatorSymbol;
    if (byOp[sym]) {
      byOp[sym].total++;
      if (m.isTimeout) byOp[sym].timeouts++;
    }
  });

  // Calculate stats from all attempts
  let totalAttempts = 0;
  let addAttempts = 0, addCorrect = 0, addTotalTime = 0;
  let subAttempts = 0, subCorrect = 0, subTotalTime = 0;
  let mulAttempts = 0, mulCorrect = 0, mulTotalTime = 0;
  let divAttempts = 0, divCorrect = 0, divTotalTime = 0;

  sessions.forEach(s => {
    s.attempts.forEach(a => {
      totalAttempts++;
      const sym = a.question.operatorSymbol;
      if (sym === '+') {
        addAttempts++;
        if (a.isCorrect) addCorrect++;
        addTotalTime += a.timeSpentSec;
      } else if (sym === '-') {
        subAttempts++;
        if (a.isCorrect) subCorrect++;
        subTotalTime += a.timeSpentSec;
      } else if (sym === '×') {
        mulAttempts++;
        if (a.isCorrect) mulCorrect++;
        mulTotalTime += a.timeSpentSec;
      } else if (sym === '÷') {
        divAttempts++;
        if (a.isCorrect) divCorrect++;
        divTotalTime += a.timeSpentSec;
      }
    });
  });

  if (subAttempts > 0) {
    const subAcc = Math.round((subCorrect / subAttempts) * 100);
    const subAvg = Number((subTotalTime / subAttempts).toFixed(1));
    if (subAcc < 85 || byOp['-'].total >= 3) {
      analyses.push({
        category: '减法与退位运算',
        description: `退位减法（如破十法）平均正确率 ${subAcc}%，错题累计 ${byOp['-'].total} 道。`,
        accuracy: subAcc,
        avgTime: subAvg,
        recommendation: '建议利用错题集专项练习“破十法”口诀与拆十法训练，强化 10 的减法口诀。'
      });
    }
  }

  if (mulAttempts > 0) {
    const mulAcc = Math.round((mulCorrect / mulAttempts) * 100);
    const mulAvg = Number((mulTotalTime / mulAttempts).toFixed(1));
    if (mulAcc < 90 || mulAvg > 3.8 || byOp['×'].total >= 3) {
      analyses.push({
        category: '乘法口诀熟练度',
        description: `乘法运算平均耗时 ${mulAvg} 秒，个别7、8、9大数乘法口诀反应时间偏长。`,
        accuracy: mulAcc,
        avgTime: mulAvg,
        recommendation: '每天晨读九九乘法表，重点强化“七八五十六”、“六八四十八”等大数乘积。'
      });
    }
  }

  if (divAttempts > 0) {
    const divAcc = Math.round((divCorrect / divAttempts) * 100);
    const divAvg = Number((divTotalTime / divAttempts).toFixed(1));
    if (divAcc < 85 || byOp['÷'].total >= 2) {
      analyses.push({
        category: '表内除法逆向思维',
        description: `除法平均正确率 ${divAcc}%，遇到逆向思考乘法口诀时偶有超时。`,
        accuracy: divAcc,
        avgTime: divAvg,
        recommendation: '引导孩子理解“想乘算除”的逆运算关系，多做“几乘几等于被除数”的填空题。'
      });
    }
  }

  if (addAttempts > 0) {
    const addAcc = Math.round((addCorrect / addAttempts) * 100);
    const addAvg = Number((addTotalTime / addAttempts).toFixed(1));
    if (addAcc < 88 || byOp['+'].total >= 3) {
      analyses.push({
        category: '进位加法凑十法',
        description: `进位加法中个位数跨十运算偶有粗心，累计出现 ${byOp['+'].total} 道加法错题。`,
        accuracy: addAcc,
        avgTime: addAvg,
        recommendation: '加强“凑十法”拆数练习，如“看见9想到1，看见8想到2，看见7想到3”。'
      });
    }
  }

  // Fallback diagnostic if student has practiced well or new
  if (analyses.length === 0) {
    analyses.push({
      category: '口算基础扎实',
      description: '近期各项运算表现稳定，加减乘除四项指标均达到优秀标准！',
      accuracy: 96,
      avgTime: 2.4,
      recommendation: '继续保持5秒倒计时速算挑战习惯，可逐步挑战更高年级或加深混合巧算。'
    });
  }

  return analyses;
}

// Group session stats by daily date for parent trend chart
export function getDailyActivityStats(sessions: PracticeSessionResult[], daysCount: number = 7): DailyActivityStat[] {
  const result: DailyActivityStat[] = [];
  const map: Record<string, { total: number; correct: number; totalTime: number }> = {};

  // Initialize past N days
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    map[dateStr] = { total: 0, correct: 0, totalTime: 0 };
  }

  sessions.forEach(s => {
    const dateStr = s.dateStr || new Date(s.timestamp).toISOString().split('T')[0];
    if (map[dateStr]) {
      map[dateStr].total += s.totalQuestions;
      map[dateStr].correct += s.correctCount;
      map[dateStr].totalTime += s.averageTimeSec * s.totalQuestions;
    }
  });

  Object.keys(map).sort().forEach(date => {
    const item = map[date];
    const acc = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    const avgSpeed = item.total > 0 ? Number((item.totalTime / item.total).toFixed(1)) : 0;
    result.push({
      date: date.substring(5), // MM-DD
      questionCount: item.total,
      correctCount: item.correct,
      accuracyRate: acc,
      avgSpeedSec: avgSpeed
    });
  });

  return result;
}

// Generate sample initial data so parents and teachers can see rich dashboard immediately if empty
// 初始化与清理数据：保证学生档案为 Hanna 与 Danna，清空历史模拟数据
export function seedSampleDataIfEmpty() {
  const MIGRATION_VERSION_KEY = 'math_migration_clean_hanna_danna_v3';
  try {
    if (!localStorage.getItem(MIGRATION_VERSION_KEY)) {
      // 清空所有历史旧 mock 数据与旧学生
      const keysToPurge = [
        'math_mistakes_v1',
        'math_sessions_v1',
        'math_mistakes_student_tiantian',
        'math_sessions_student_tiantian',
        'math_mistakes_student_lele',
        'math_sessions_student_lele',
        'math_mistakes_student_hanna',
        'math_sessions_student_hanna',
        'math_mistakes_student_danna',
        'math_sessions_student_danna',
        'math_custom_banks_v1',
        'math_manual_questions_v1',
        'math_parent_settings_v1'
      ];
      keysToPurge.forEach(k => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });

      // 重置学生档案为 Hanna (一年级) 与 Danna (二年级)
      saveStudentProfiles(DEFAULT_STUDENTS);
      setActiveStudentId('student_hanna');
      localStorage.setItem('math_chosen_student_confirmed_v1', 'true');
      localStorage.setItem(MIGRATION_VERSION_KEY, 'true');
      return;
    }

    if (!localStorage.getItem(PROFILES_KEY)) {
      saveStudentProfiles(DEFAULT_STUDENTS);
      setActiveStudentId('student_hanna');
    }
  } catch (e) {
    console.error('Failed to initialize clean data', e);
  }
}

// Generate formatted WeChat report text for parents to share/copy to mobile chats
export function generateWeChatReport(session: PracticeSessionResult, studentName?: string): string {
  const name = studentName || session.studentName || '同学';
  const dateText = new Date(session.timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const lines = [
    `📊【小象速算 · 挑战学情战报】`,
    `👤 学员：${name}`,
    `⏰ 时间：${dateText}`,
    `🎯 模式：${session.challengeMode || '每日挑战'}（共 ${session.totalQuestions} 题）`,
    `🏆 成绩：正确率 ${session.accuracyRate}% · 平均耗时 ${session.averageTimeSec}s/题`,
    `⭐ 奖励：+${session.starsEarned} 颗小星星 (答对 ${session.correctCount} 题 / 错题 ${session.wrongCount} 题 / 超时 ${session.timeoutCount} 题)`,
    ``,
    `📝 每题准确率与用时明细：`
  ];

  session.attempts.forEach((att, idx) => {
    const status = att.isCorrect ? '✅ 答对' : att.isTimeout ? '⏰ 5秒超时' : `❌ 错填为 ${att.userAnswer}`;
    lines.push(
      `${idx + 1}. ${att.question.num1} ${att.question.operatorSymbol} ${att.question.num2} = ${att.question.correctAnswer} ➜ ${status} | 耗时 ${att.timeSpentSec}s`
    );
  });

  lines.push('');
  lines.push(`📱 完整数据已同步至家长手机端，点击随练系统随时复习错题与用时！`);
  return lines.join('\n');
}

// Mobile Sync Payload encoding & decoding (Supports Full Sessions & Question-level Attempts)
export function createSyncPayload(studentId?: string): string {
  const targetId = studentId || getActiveStudentId();
  const profiles = getStudentProfiles();
  const student = profiles.find(p => p.id === targetId) || profiles[0] || DEFAULT_STUDENTS[0];
  const mistakes = getMistakes(targetId);
  const sessions = getPracticeSessions(targetId);

  const payload = {
    v: 2,
    time: Date.now(),
    studentId: targetId,
    student: student.name,
    avatar: student.avatar,
    grade: student.grade,
    stars: student.currentStars,
    // Pack recent 10 sessions with complete question-by-question attempts
    sessions: sessions.slice(0, 10).map(s => ({
      id: s.id,
      ts: s.timestamp,
      d: s.dateStr,
      tot: s.totalQuestions,
      cor: s.correctCount,
      wrg: s.wrongCount,
      to: s.timeoutCount,
      acc: s.accuracyRate,
      avg: s.averageTimeSec,
      star: s.starsEarned,
      mode: s.challengeMode || '每日练习',
      atts: s.attempts.map(a => ({
        n1: a.question.num1,
        n2: a.question.num2,
        op: a.question.operator,
        sym: a.question.operatorSymbol,
        ans: a.question.correctAnswer,
        ua: a.userAnswer,
        ok: a.isCorrect,
        sec: a.timeSpentSec,
        to: a.isTimeout,
        tip: a.question.methodTip,
        exp: a.question.explanation
      }))
    })),
    mistakes: mistakes.slice(0, 20).map(m => ({
      id: m.id,
      q: {
        id: m.question.id,
        num1: m.question.num1,
        num2: m.question.num2,
        op: m.question.operator,
        sym: m.question.operatorSymbol,
        ans: m.question.correctAnswer,
        exp: m.question.explanation,
        tip: m.question.methodTip,
        grd: m.question.difficultyGrade
      },
      wa: m.wrongAnswer,
      to: m.isTimeout,
      sec: m.timeSpentSec,
      cnt: m.wrongCount,
      mas: m.mastered
    }))
  };

  try {
    return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
  } catch {
    return encodeURIComponent(btoa(JSON.stringify(payload)));
  }
}

export function importSyncPayload(encoded: string): boolean {
  try {
    let jsonStr = '';
    try {
      jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
    } catch {
      jsonStr = atob(decodeURIComponent(encoded));
    }
    const data = JSON.parse(jsonStr);
    if (!data) return false;

    const studentId = data.studentId || (data.student ? 'student_' + data.student : getActiveStudentId());

    // 1. Import or update student profile
    const profiles = getStudentProfiles();
    let existingProfile = profiles.find(p => p.id === studentId || p.name === data.student);
    if (!existingProfile && data.student) {
      existingProfile = {
        id: studentId,
        name: data.student,
        avatar: data.avatar || '🦁',
        grade: data.grade || 'grade2',
        dailyTargetCount: 20,
        targetAccuracyRate: 90,
        rewardGoalTitle: '去游乐园玩',
        rewardGoalStarsNeeded: 50,
        currentStars: typeof data.stars === 'number' ? data.stars : 10,
        preferences: { ...DEFAULT_STUDENT_PREFERENCES },
        createdAt: Date.now(),
        lastActiveAt: Date.now()
      };
      profiles.push(existingProfile);
      saveStudentProfiles(profiles);
    } else if (existingProfile) {
      if (typeof data.stars === 'number') existingProfile.currentStars = Math.max(existingProfile.currentStars, data.stars);
      if (data.grade) existingProfile.grade = data.grade;
      existingProfile.lastActiveAt = Date.now();
      saveStudentProfiles(profiles);
    }
    setActiveStudentId(existingProfile ? existingProfile.id : studentId);

    // 2. Import complete challenge sessions with each question's attempts
    if (Array.isArray(data.sessions)) {
      const importedSessions: PracticeSessionResult[] = data.sessions.map((s: any) => ({
        id: s.id || 'sess_' + s.ts,
        studentId,
        studentName: data.student || '学生',
        challengeMode: s.mode || '每日挑战',
        timestamp: s.ts || Date.now(),
        dateStr: s.d || new Date(s.ts || Date.now()).toISOString().split('T')[0],
        totalQuestions: s.tot || 0,
        correctCount: s.cor || 0,
        wrongCount: s.wrg || 0,
        timeoutCount: s.to || 0,
        accuracyRate: s.acc || 0,
        averageTimeSec: s.avg || 0,
        score: (s.cor || 0) * 10,
        starsEarned: s.star || 1,
        gradeLevel: data.grade || 'grade2',
        operations: ['add', 'subtract', 'multiply', 'divide'],
        attempts: Array.isArray(s.atts) ? s.atts.map((a: any) => ({
          question: {
            id: 'q_' + Math.random().toString(36).substring(2, 7),
            num1: a.n1,
            num2: a.n2,
            operator: a.op || 'add',
            operatorSymbol: a.sym || '+',
            correctAnswer: a.ans,
            explanation: a.exp || '',
            methodTip: a.tip || '口算技巧',
            difficultyGrade: data.grade || '口算'
          },
          userAnswer: a.ua !== undefined ? a.ua : null,
          isCorrect: !!a.ok,
          timeSpentSec: a.sec || 0,
          isTimeout: !!a.to,
          timestamp: s.ts || Date.now()
        })) : []
      }));

      const currentSessions = getPracticeSessions(studentId);
      const sessionMap = new Map<string, PracticeSessionResult>();
      currentSessions.forEach(sess => sessionMap.set(sess.id, sess));
      importedSessions.forEach(sess => sessionMap.set(sess.id, sess));
      const mergedSessions = Array.from(sessionMap.values()).sort((a, b) => b.timestamp - a.timestamp);

      const key = getSessionsKey(studentId);
      localStorage.setItem(key, JSON.stringify(mergedSessions));
      if (studentId === 'student_tiantian') {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(mergedSessions));
      }
    }

    // 3. Import mistakes
    if (Array.isArray(data.mistakes)) {
      const importedMistakes: MistakeItem[] = data.mistakes.map((m: any) => ({
        id: m.id || 'm_' + Math.random().toString(36).substring(2, 8),
        question: {
          id: m.q?.id || 'q_' + Math.random(),
          num1: m.q?.num1 || 0,
          num2: m.q?.num2 || 0,
          operator: m.q?.op || 'add',
          operatorSymbol: m.q?.sym || '+',
          correctAnswer: m.q?.ans || 0,
          explanation: m.q?.exp || '',
          methodTip: m.q?.tip || '',
          difficultyGrade: m.q?.grd || '口算题'
        },
        wrongAnswer: m.wa !== undefined ? m.wa : null,
        isTimeout: !!m.to,
        timeSpentSec: m.sec || 5,
        wrongCount: m.cnt || 1,
        mastered: !!m.mas,
        lastPracticedAt: Date.now(),
        firstFailedAt: Date.now()
      }));

      const existingMistakes = getMistakes(studentId);
      const mistakeMap = new Map<string, MistakeItem>();
      existingMistakes.forEach(m => mistakeMap.set(m.id, m));
      importedMistakes.forEach(m => mistakeMap.set(m.id, m));
      saveMistakes(Array.from(mistakeMap.values()), studentId);
    }

    return true;
  } catch (err) {
    console.error('Failed to import sync payload', err);
    return false;
  }
}
