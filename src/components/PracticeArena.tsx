import React, { useState, useEffect, useRef } from 'react';
import {
  GradeLevel,
  MathQuestion,
  OperationType,
  PracticeSessionResult,
  QuestionAttempt,
  StudentProfile
} from '../types/math';
import {
  recordMistake,
  savePracticeSession,
  addStars,
  getMistakes,
  DEFAULT_STUDENT_PREFERENCES,
  formatGradeLabel,
  formatGradeDetail
} from '../utils/storage';
import { generateQuestionBatch } from '../utils/mathGenerator';
import { sound } from '../utils/soundEffects';
import {
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Sliders,
  ChevronRight,
  HelpCircle,
  Flame,
  Settings,
  BookOpen,
  Target
} from 'lucide-react';

interface PracticeArenaProps {
  onSessionComplete: (result: PracticeSessionResult) => void;
  defaultGrade?: GradeLevel;
  initialQuestions?: MathQuestion[]; // If retaking mistake set
  initialGrade?: GradeLevel;
  perQuestionSec?: number; // 5s default
  onPlayStateChange?: (isPlaying: boolean) => void;
  onMistakeRecorded?: () => void;
  student?: StudentProfile;
  onOpenSettings?: () => void;
  onSelectTab?: (tab: 'practice' | 'banks' | 'mistakes' | 'parent' | 'mobile') => void;
}

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  onSessionComplete,
  defaultGrade = 'grade2',
  initialQuestions,
  perQuestionSec = 5,
  onPlayStateChange,
  onMistakeRecorded,
  student,
  onOpenSettings,
  onSelectTab
}) => {
  const studentPrefs = student?.preferences;

  const getPreferredLayout = (q?: MathQuestion): boolean => {
    if (!studentPrefs || studentPrefs.equationLayout === 'vertical') return true;
    if (studentPrefs.equationLayout === 'horizontal') return false;
    if (q) {
      if (q.num1 >= 10 || q.num2 >= 10 || q.operator === 'multiply' || q.operator === 'divide') {
        return true;
      }
      return false;
    }
    return true;
  };

  // Practice Configuration State
  const [grade, setGrade] = useState<GradeLevel>(defaultGrade);
  const [selectedOps, setSelectedOps] = useState<OperationType[]>(studentPrefs?.selectedOps || ['add', 'subtract', 'multiply', 'divide']);
  const [questionCount, setQuestionCount] = useState<number>(studentPrefs?.questionCount ?? student?.dailyTargetCount ?? 30);
  const [countdownDuration, setCountdownDuration] = useState<number>(studentPrefs?.perQuestionSeconds ?? perQuestionSec);

  // Active Session State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0); // 隐藏倒计时，记录做题用时
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isVerticalFormula, setIsVerticalFormula] = useState<boolean>(() => getPreferredLayout());
  const [countdownAnim, setCountdownAnim] = useState<string | null>(null);
  const [hasTimedOutCurrentQ, setHasTimedOutCurrentQ] = useState<boolean>(false);
  const [currentModeTitle, setCurrentModeTitle] = useState<string>('每日练习');

  useEffect(() => {
    if (studentPrefs?.equationLayout === 'auto' && questions[currentIndex]) {
      setIsVerticalFormula(getPreferredLayout(questions[currentIndex]));
    }
  }, [currentIndex, questions]);

  // 保持学生设置实时双向同步（当学生切换或修改个人设置时，即刻更新口算竞技场状态）
  useEffect(() => {
    if (student) {
      setGrade(student.grade || defaultGrade);
      if (student.preferences) {
        if (student.preferences.selectedOps && student.preferences.selectedOps.length > 0) {
          setSelectedOps(student.preferences.selectedOps);
        }
        if (student.preferences.questionCount) {
          setQuestionCount(student.preferences.questionCount);
        }
        if (student.preferences.perQuestionSeconds !== undefined) {
          setCountdownDuration(student.preferences.perQuestionSeconds);
        }
      }
      setIsVerticalFormula(getPreferredLayout());
    }
  }, [student, defaultGrade]);

  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<StudentProfile>;
      if (customEvt.detail && (!student || customEvt.detail.id === student.id)) {
        const updated = customEvt.detail;
        setGrade(updated.grade);
        if (updated.preferences) {
          if (updated.preferences.selectedOps && updated.preferences.selectedOps.length > 0) {
            setSelectedOps(updated.preferences.selectedOps);
          }
          if (updated.preferences.questionCount) {
            setQuestionCount(updated.preferences.questionCount);
          }
          if (updated.preferences.perQuestionSeconds !== undefined) {
            setCountdownDuration(updated.preferences.perQuestionSeconds);
          }
          setIsVerticalFormula(getPreferredLayout());
        }
      }
    };
    window.addEventListener('emath_student_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('emath_student_profile_updated', handleProfileUpdate);
  }, [student]);

  // 本题错答追踪（记录第一次算错的状态与填写的错误答案）
  const [currentQWrongTries, setCurrentQWrongTries] = useState<number>(0);
  const [firstWrongAnswer, setFirstWrongAnswer] = useState<number | null>(null);

  // Timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically
  useEffect(() => {
    if (isPlaying && !isAnswerRevealed) {
      inputRef.current?.focus();
    }
  }, [isPlaying, currentIndex, isAnswerRevealed]);

  // If initialQuestions provided (e.g. retaking mistakes), auto start with Ready Go animation
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      setCurrentModeTitle('错题重测');
      setQuestions(initialQuestions);
      setQuestionCount(initialQuestions.length);
      setCurrentIndex(0);
      setAttempts([]);
      setStreak(0);
      setScore(0);
      setInputVal('');
      setElapsedTime(0);
      setIsAnswerRevealed(false);
      setLastFeedback(null);
      setCurrentQWrongTries(0);
      setFirstWrongAnswer(null);

      // Ready... Go! Animation sequence
      setCountdownAnim('READY...');
      if (studentPrefs?.soundEnabled !== false) {
        sound.playCorrect();
      }

      setTimeout(() => {
        setCountdownAnim('3');
        if (studentPrefs?.soundEnabled !== false) sound.playCorrect();
      }, 550);

      setTimeout(() => {
        setCountdownAnim('2');
        if (studentPrefs?.soundEnabled !== false) sound.playCorrect();
      }, 1100);

      setTimeout(() => {
        setCountdownAnim('1');
        if (studentPrefs?.soundEnabled !== false) sound.playCorrect();
      }, 1650);

      setTimeout(() => {
        setCountdownAnim('GO! 🚀');
        if (studentPrefs?.soundEnabled !== false) sound.playFanfare();
      }, 2200);

      setTimeout(() => {
        setCountdownAnim(null);
        setIsPlaying(true);
        onPlayStateChange?.(true);
        startTimeRef.current = Date.now();
      }, 2800);
    }
  }, [initialQuestions]);

  // 静默记录当前题目的用时并检测超时（若超过配置时限未完成，自动记入错题集/专项攻克）
  useEffect(() => {
    if (!isPlaying || isAnswerRevealed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const currentElapsed = Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
      setElapsedTime(currentElapsed);

      if (countdownDuration > 0 && currentElapsed >= countdownDuration && !hasTimedOutCurrentQ) {
        setHasTimedOutCurrentQ(true);
        const currentQ = questions[currentIndex];
        if (currentQ) {
          recordMistake(currentQ, null, true, currentElapsed, student?.id);
          onMistakeRecorded?.();
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isAnswerRevealed, currentIndex, countdownDuration, hasTimedOutCurrentQ, questions, student?.id, onMistakeRecorded]);

  const setupAndStartSession = (newQuestions: MathQuestion[], sec: number, g: GradeLevel, ops: OperationType[]) => {
    setGrade(g);
    setSelectedOps(ops);
    setQuestions(newQuestions);
    setQuestionCount(newQuestions.length);
    setCurrentIndex(0);
    setAttempts([]);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    setInputVal('');
    setElapsedTime(0);
    setIsAnswerRevealed(false);
    setLastFeedback(null);
    setCurrentQWrongTries(0);
    setFirstWrongAnswer(null);
    setHasTimedOutCurrentQ(false);

    // Ready... Go! Animation sequence
    setCountdownAnim('READY...');
    if (studentPrefs?.soundEnabled !== false) {
      sound.playCorrect();
    }

    setTimeout(() => {
      setCountdownAnim('3');
      if (studentPrefs?.soundEnabled !== false) sound.playCorrect();
    }, 550);

    setTimeout(() => {
      setCountdownAnim('2');
      if (studentPrefs?.soundEnabled !== false) sound.playCorrect();
    }, 1100);

    setTimeout(() => {
      setCountdownAnim('1');
      if (studentPrefs?.soundEnabled !== false) sound.playCorrect();
    }, 1650);

    setTimeout(() => {
      setCountdownAnim('GO! 🚀');
      if (studentPrefs?.soundEnabled !== false) sound.playFanfare();
    }, 2200);

    setTimeout(() => {
      setCountdownAnim(null);
      setIsPlaying(true);
      onPlayStateChange?.(true);
      startTimeRef.current = Date.now();
    }, 2800);
  };

  // 1. 🌟 每日练习
  const startDailyPractice = () => {
    setCurrentModeTitle('每日练习');
    const prefs = student?.preferences || DEFAULT_STUDENT_PREFERENCES;
    const g = student?.grade || defaultGrade;
    const ops = prefs.selectedOps && prefs.selectedOps.length > 0 ? prefs.selectedOps : (['add', 'subtract', 'multiply', 'divide'] as OperationType[]);
    const cnt = prefs.questionCount || 30;
    const newQuestions = generateQuestionBatch(cnt, g, ops);
    setupAndStartSession(newQuestions, prefs.perQuestionSeconds ?? 5, g, ops);
  };

  // 2. ⚡ 每日挑战 (极速闪电3秒)
  const startDailyChallenge = () => {
    setCurrentModeTitle('每日挑战 (3s极速)');
    const prefs = student?.preferences || DEFAULT_STUDENT_PREFERENCES;
    const g = student?.grade || defaultGrade;
    const ops = prefs.selectedOps && prefs.selectedOps.length > 0 ? prefs.selectedOps : (['add', 'subtract', 'multiply', 'divide'] as OperationType[]);
    const newQuestions = generateQuestionBatch(10, g, ops);
    setupAndStartSession(newQuestions, 3, g, ops);
  };

  // 3. 📝 错题练习
  const startMistakePractice = () => {
    setCurrentModeTitle('错题专练');
    const unmastered = getMistakes(student?.id).filter(m => !m.mastered);
    if (unmastered.length === 0) {
      sound.playCorrect();
      alert('太棒了！当前没有未掌握的错题，去进行每日练习吧！');
      return;
    }
    const qList = unmastered.map(m => m.question);
    const prefs = student?.preferences || DEFAULT_STUDENT_PREFERENCES;
    const g = student?.grade || defaultGrade;
    const ops = prefs.selectedOps && prefs.selectedOps.length > 0 ? prefs.selectedOps : (['add', 'subtract', 'multiply', 'divide'] as OperationType[]);
    setupAndStartSession(qList, prefs.perQuestionSeconds ?? 5, g, ops);
  };

  // 4. 🎯 今日推荐个性化练习
  const startRecommendedPractice = () => {
    setCurrentModeTitle('智能推荐练习');
    const unmastered = getMistakes(student?.id).filter(m => !m.mastered);
    const mistakeQuestions = unmastered.slice(0, 5).map(m => m.question);
    const needed = Math.max(0, 10 - mistakeQuestions.length);
    const prefs = student?.preferences || DEFAULT_STUDENT_PREFERENCES;
    const g = student?.grade || defaultGrade;
    const ops = prefs.selectedOps && prefs.selectedOps.length > 0 ? prefs.selectedOps : (['add', 'subtract', 'multiply', 'divide'] as OperationType[]);
    const batch = needed > 0 ? generateQuestionBatch(needed, g, ops) : [];
    const recommendedQuestions = [...mistakeQuestions, ...batch];

    if (recommendedQuestions.length === 0) {
      startDailyPractice();
      return;
    }
    setupAndStartSession(recommendedQuestions, prefs.perQuestionSeconds ?? 5, g, ops);
  };

  // 退出练习，恢复全部菜单
  const handleExitPractice = () => {
    setIsPlaying(false);
    onPlayStateChange?.(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Handle user submit answer
  const handleSubmitAnswer = (submittedStr?: string) => {
    const rawAnswer = submittedStr !== undefined ? submittedStr : inputVal;
    if (rawAnswer === '' || !questions[currentIndex]) return;

    const numAnswer = parseInt(rawAnswer, 10);
    const currentQ = questions[currentIndex];
    const timeSpent = Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
    const isCorrect = numAnswer === currentQ.correctAnswer;

    if (isCorrect) {
      if (studentPrefs?.soundEnabled !== false) {
        sound.playCorrect();
      }
      const hasFailedBefore = currentQWrongTries > 0;
      const newStreak = hasFailedBefore ? 0 : streak + 1;
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));

      const baseScore = hasFailedBefore ? 5 : 10;
      const speedBonus = (!hasFailedBefore && timeSpent <= 3) ? 5 : (!hasFailedBefore && timeSpent <= 6) ? 2 : 0;
      const streakBonus = Math.min(newStreak, 5) * 2;
      setScore(prev => prev + baseScore + speedBonus + streakBonus);
      setLastFeedback('correct');

      const attempt: QuestionAttempt = {
        question: currentQ,
        userAnswer: hasFailedBefore ? firstWrongAnswer : numAnswer,
        isCorrect: !hasFailedBefore,
        timeSpentSec: timeSpent,
        isTimeout: false,
        timestamp: Date.now()
      };

      const updatedAttempts = [...attempts, attempt];
      setAttempts(updatedAttempts);
      setIsAnswerRevealed(false);
      advanceNextQuestion(updatedAttempts);
    } else {
      if (studentPrefs?.soundEnabled !== false) {
        sound.playWrong();
      }
      setStreak(0);
      setLastFeedback('wrong');

      const nextTries = currentQWrongTries + 1;
      setCurrentQWrongTries(nextTries);
      if (firstWrongAnswer === null) {
        setFirstWrongAnswer(numAnswer);
      }

      recordMistake(currentQ, numAnswer, false, timeSpent, student?.id);
      onMistakeRecorded?.();

      setInputVal('');
    }
  };

  const advanceNextQuestion = (currentAttempts: QuestionAttempt[]) => {
    if (currentIndex + 1 >= questions.length) {
      finishRound(currentAttempts);
    } else {
      setCurrentIndex(prev => prev + 1);
      setInputVal('');
      setElapsedTime(0);
      setIsAnswerRevealed(false);
      setLastFeedback(null);
      setCurrentQWrongTries(0);
      setFirstWrongAnswer(null);
      setHasTimedOutCurrentQ(false);
      startTimeRef.current = Date.now();
    }
  };

  const finishRound = (finalAttempts: QuestionAttempt[]) => {
    setIsPlaying(false);
    onPlayStateChange?.(false);
    if (timerRef.current) clearInterval(timerRef.current);

    sound.playFanfare();

    const total = finalAttempts.length;
    const correctCount = finalAttempts.filter(a => a.isCorrect).length;
    const wrongCount = finalAttempts.filter(a => !a.isCorrect && !a.isTimeout).length;
    const timeoutCount = finalAttempts.filter(a => a.isTimeout).length;
    const accuracyRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const totalTime = finalAttempts.reduce((acc, cur) => acc + cur.timeSpentSec, 0);
    const averageTimeSec = total > 0 ? Number((totalTime / total).toFixed(1)) : 0;

    let starsEarned = 1;
    if (accuracyRate >= 95) starsEarned = 5;
    else if (accuracyRate >= 80) starsEarned = 3;
    else if (accuracyRate >= 60) starsEarned = 2;

    addStars(starsEarned, student?.id);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const result: PracticeSessionResult = {
      id: 'sess_' + Date.now(),
      studentId: student?.id,
      studentName: student?.name,
      challengeMode: currentModeTitle,
      timestamp: Date.now(),
      dateStr,
      totalQuestions: total,
      correctCount,
      wrongCount,
      timeoutCount,
      accuracyRate,
      averageTimeSec,
      attempts: finalAttempts,
      gradeLevel: grade,
      operations: selectedOps,
      score,
      starsEarned
    };

    savePracticeSession(result, student?.id);

    onSessionComplete(result);
  };

  const handleKeypadPress = (val: string) => {
    if (isAnswerRevealed) return;
    if (val === 'clear') {
      setInputVal('');
    } else if (val === 'backspace') {
      setInputVal(prev => prev.slice(0, -1));
    } else if (val === 'enter') {
      handleSubmitAnswer();
    } else {
      if (inputVal.length < 5) {
        const nextVal = inputVal + val;
        setInputVal(nextVal);
        if (studentPrefs?.autoSubmitWhenComplete && questions[currentIndex]) {
          const expectedLen = Math.abs(questions[currentIndex].correctAnswer).toString().length;
          if (nextVal.length === expectedLen) {
            handleSubmitAnswer(nextVal);
          }
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isAnswerRevealed) return;
      if (e.key >= '0' && e.key <= '9') {
        if (inputVal.length < 5) {
          const nextVal = inputVal + e.key;
          setInputVal(nextVal);
          if (studentPrefs?.autoSubmitWhenComplete && questions[currentIndex]) {
            const expectedLen = Math.abs(questions[currentIndex].correctAnswer).toString().length;
            if (nextVal.length === expectedLen) {
              handleSubmitAnswer(nextVal);
            }
          }
        }
      } else if (e.key === 'Backspace') {
        setInputVal(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleSubmitAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isAnswerRevealed, inputVal, currentIndex, questions, studentPrefs]);

  const currentQ = questions[currentIndex];
  const unmasteredMistakeCount = getMistakes(student?.id).filter(m => !m.mastered).length;

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 relative ${isPlaying ? 'py-1' : 'py-6'}`}>
      {/* Ready... Go! Countdown Animation Overlay */}
      {countdownAnim && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
          <div className="text-amber-400 font-display font-black text-7xl sm:text-9xl tracking-wider animate-bounce drop-shadow-2xl">
            {countdownAnim}
          </div>
          <p className="text-slate-200 text-base sm:text-lg mt-6 font-bold tracking-widest">
            {countdownAnim === 'READY...' ? '准备迎接口算挑战！' : countdownAnim === 'GO! 🚀' ? '全速冲刺！' : '保持专注，算得又快又准'}
          </p>
        </div>
      )}

      {!isPlaying ? (
        /* Clean Main Practice Home: 每日练习、每日挑战、错题练习 选项 */
        <div className="space-y-6">
          {/* 学生专属口算档案与设置概览卡片 (直观同步设置与一键修改) */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white border border-amber-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  {student?.avatar || '🦁'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-lg text-slate-900">{student?.name || '同学'}</span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-200/90 px-2.5 py-0.5 rounded-full">
                      {formatGradeLabel(student?.grade || grade)}
                    </span>
                    <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                      {formatGradeDetail(student?.grade || grade)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium italic">
                    <span>💬</span>
                    <span>“{student?.preferences?.motto || '每天坚持口算，我是速算小达人！'}”</span>
                  </p>
                </div>
              </div>

              {/* 快速设置按钮 */}
              {onOpenSettings && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="px-3.5 py-2 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 border border-amber-300 text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="调整我的专属个人口算设置"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-600" />
                    <span>修改口算设置</span>
                  </button>
                </div>
              )}
            </div>

            {/* 当前口算配置标签栏 (实时同步显示：题量、运算、节奏、立式偏好、心愿奖励) */}
            <div className="mt-4 pt-3.5 border-t border-amber-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/80 rounded-xl px-3 py-2 border border-amber-100 flex items-center gap-2">
                <span className="text-base">🔢</span>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">每组练习题量</div>
                  <div className="font-bold text-slate-800 font-mono">
                    {student?.preferences?.questionCount || questionCount || 30} 题 / 组
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl px-3 py-2 border border-amber-100 flex items-center gap-2">
                <span className="text-base">📐</span>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">算式排版格式</div>
                  <div className="font-bold text-slate-800">
                    {student?.preferences?.equationLayout === 'horizontal'
                      ? '横式优先'
                      : student?.preferences?.equationLayout === 'auto'
                      ? '智能自适应'
                      : '竖式(立式)优先'}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl px-3 py-2 border border-amber-100 flex items-center gap-2">
                <span className="text-base">⏱️</span>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">单题建议节奏</div>
                  <div className="font-bold text-slate-800">
                    {student?.preferences?.perQuestionSeconds && student.preferences.perQuestionSeconds > 0
                      ? `${student.preferences.perQuestionSeconds} 秒标准`
                      : countdownDuration > 0
                      ? `${countdownDuration} 秒标准`
                      : '稳扎稳打 (不限时)'}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl px-3 py-2 border border-amber-100 flex items-center gap-2">
                <span className="text-base">🎯</span>
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-medium">心愿大奖进度</div>
                  <div className="font-bold text-amber-700 truncate" title={student?.rewardGoalTitle || '心愿大奖'}>
                    ⭐ {student?.currentStars || 0}/{student?.rewardGoalStarsNeeded || 50}
                  </div>
                </div>
              </div>
            </div>

            {/* 包含的运算类型小标 */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
              <span className="font-medium text-slate-400">当前激活运算:</span>
              {(student?.preferences?.selectedOps || selectedOps || ['add', 'subtract', 'multiply', 'divide']).map(op => (
                <span
                  key={op}
                  className="bg-amber-100/80 text-amber-900 font-bold px-2 py-0.5 rounded-lg border border-amber-200/50"
                >
                  {op === 'add' ? '➕ 加法' : op === 'subtract' ? '➖ 减法' : op === 'multiply' ? '✖️ 乘法' : '➗ 除法'}
                </span>
              ))}
            </div>
          </div>

          {/* 3 Primary Practice Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. 每日练习 */}
            <div
              onClick={startDailyPractice}
              className="group cursor-pointer bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl mb-4 shadow-inner">
                  🌟
                </div>
                <h3 className="text-xl font-display font-bold">每日练习</h3>
                <p className="text-xs text-amber-100 mt-1.5 leading-relaxed">
                  基于你当前的学段难度（{formatGradeLabel(student?.grade || grade)} · {formatGradeDetail(student?.grade || grade)}）与运算配置，轻松打卡练习。
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold">
                <span className="bg-white/25 px-2.5 py-1 rounded-xl">
                  {student?.preferences?.questionCount || questionCount || 30} 题 · 智能算式
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  立即开始 <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* 2. 每日挑战 */}
            <div
              onClick={startDailyChallenge}
              className="group cursor-pointer bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl mb-4 shadow-inner">
                  ⚡
                </div>
                <h3 className="text-xl font-display font-bold">每日挑战</h3>
                <p className="text-xs text-indigo-100 mt-1.5 leading-relaxed">
                  3秒极速闪电冲刺，挑战思维极限，连击点燃激情，双倍积分与星星奖励！
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold">
                <span className="bg-white/25 px-2.5 py-1 rounded-xl">
                  3秒疾速 · 挑战双倍星
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  极速冲刺 <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* 3. 错题练习 */}
            <div
              onClick={startMistakePractice}
              className="group cursor-pointer bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-500/20 hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl mb-4 shadow-inner">
                  📝
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold">错题练习</h3>
                  {unmasteredMistakeCount > 0 && (
                    <span className="bg-white text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      {unmasteredMistakeCount} 题待攻克
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-100 mt-1.5 leading-relaxed">
                  精准提取智能错题集中的未掌握薄弱题目，温故知新，逐个彻底攻克。
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold">
                <span className="bg-white/25 px-2.5 py-1 rounded-xl">
                  专项错题特训
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  开始特训 <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* 今日推荐练习 (智能个性化定制) */}
          <div
            onClick={startRecommendedPractice}
            className="group cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl shadow-teal-500/20 hover:shadow-2xl hover:scale-[1.01] transition-all flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl shadow-inner shrink-0">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-display font-bold">今日推荐个性化突破特训</h3>
                  <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold">AI 智能推荐</span>
                </div>
                <p className="text-xs text-teal-100 mt-1">
                  {unmasteredMistakeCount > 0 
                    ? `已融合你的 ${unmasteredMistakeCount} 道错题集薄弱点与近期训练数据，一键开启靶向攻坚！`
                    : '根据你的学段难度智能生成的 10 道综合口算突破题，助你稳步进阶！'}
                </p>
              </div>
            </div>
            <div className="relative z-10 shrink-0">
              <span className="px-5 py-2.5 rounded-2xl bg-white text-teal-900 text-xs font-bold shadow-sm group-hover:bg-teal-50 transition-colors flex items-center gap-1.5">
                <span>立即开始推荐特训</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Active Practice Arena (极致纯净免干扰) */
        <div className="relative bg-white border border-slate-200 rounded-3xl p-2 sm:p-3 shadow-sm">
          {/* 轻量退出按钮 */}
          <button
            type="button"
            onClick={handleExitPractice}
            className="absolute top-4 right-4 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors px-2.5 py-1 rounded-lg"
            title="退出练习"
          >
            ✕ 退出
          </button>

          {/* Central Question Arena */}
          <div className="py-2 flex flex-col items-center justify-center">
            {/* Big Math Question Display */}
            {currentQ && (
              <div className="text-center w-full max-w-md flex flex-col items-center pt-2">

                {isVerticalFormula ? (
                  /* Vertical Column Formula Layout (立着显示 / 竖式) */
                  <div className="inline-flex flex-col items-end font-mono text-slate-900 my-2 px-6 py-4 bg-slate-50/90 border-2 border-slate-200 rounded-3xl shadow-xs min-w-[200px] sm:min-w-[240px]">
                    {/* Top Row: Num 1 (Right-aligned) */}
                    <div className={`${
                      studentPrefs?.fontSizeScale === 'xl'
                        ? 'text-7xl sm:text-8xl md:text-9xl'
                        : studentPrefs?.fontSizeScale === 'large'
                        ? 'text-6xl sm:text-7xl md:text-8xl'
                        : 'text-6xl sm:text-7xl md:text-8xl'
                    } font-bold tracking-widest text-right w-full pr-1 font-mono`}>
                      {currentQ.num1}
                    </div>

                    {/* Bottom Row: Operator + Num 2 */}
                    <div className={`${
                      studentPrefs?.fontSizeScale === 'xl'
                        ? 'text-7xl sm:text-8xl md:text-9xl'
                        : studentPrefs?.fontSizeScale === 'large'
                        ? 'text-6xl sm:text-7xl md:text-8xl'
                        : 'text-6xl sm:text-7xl md:text-8xl'
                    } font-bold tracking-widest flex items-center justify-between w-full mt-1.5 pr-1 font-mono`}>
                      <span className="text-amber-500 font-bold text-7xl sm:text-8xl md:text-9xl mr-3 font-mono">
                        {currentQ.operatorSymbol}
                      </span>
                      <span>{currentQ.num2}</span>
                    </div>

                    {/* Solid Calculation Divider Line */}
                    <div className="w-full h-1.5 bg-slate-900 my-2.5 rounded-full"></div>

                    {/* Answer Input Box directly under the line (Right-aligned) */}
                    <div className="w-full flex justify-end">
                      <div className="min-w-[150px] sm:min-w-[180px] h-16 sm:h-20 bg-white border-2 border-amber-400 rounded-2xl flex items-center justify-end px-3 font-mono font-bold text-4xl sm:text-5xl text-amber-900 tracking-widest shadow-inner">
                        {inputVal || <span className="text-amber-300 animate-pulse">?</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Horizontal Layout (横式) */
                  <div className={`${
                    studentPrefs?.fontSizeScale === 'xl'
                      ? 'text-7xl sm:text-8xl md:text-9xl'
                      : studentPrefs?.fontSizeScale === 'large'
                      ? 'text-6xl sm:text-7xl md:text-8xl'
                      : 'text-6xl sm:text-7xl md:text-8xl'
                  } font-display font-bold text-slate-900 tracking-tight my-4 flex items-center justify-center gap-3`}>
                    <span>{currentQ.num1}</span>
                    <span className="text-amber-500 font-mono text-7xl sm:text-8xl md:text-9xl">{currentQ.operatorSymbol}</span>
                    <span>{currentQ.num2}</span>
                    <span className="text-slate-400">=</span>
                    <div className="min-w-[100px] sm:min-w-[130px] h-16 sm:h-20 border-b-4 border-amber-500 bg-amber-50/40 rounded-t-lg flex items-center justify-center font-mono font-bold text-4xl sm:text-5xl text-amber-900">
                      {inputVal || <span className="text-amber-300 animate-pulse">?</span>}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Large Kid-Friendly Touch & Keyboard On-Screen NumPad */}
          <div className="max-w-xl sm:max-w-3xl w-full mx-auto mt-4 px-2">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  disabled={isAnswerRevealed}
                  className="h-16 sm:h-20 md:h-24 rounded-3xl bg-slate-50 hover:bg-slate-100 active:bg-amber-100 text-slate-900 font-display font-black text-3xl sm:text-4xl md:text-5xl border-2 border-slate-200/80 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                disabled={isAnswerRevealed}
                className="h-16 sm:h-20 md:h-24 rounded-3xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xl sm:text-2xl border-2 border-slate-200/80 transition-all active:scale-95 cursor-pointer"
              >
                清空
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={isAnswerRevealed}
                className="h-16 sm:h-20 md:h-24 rounded-3xl bg-slate-50 hover:bg-slate-100 active:bg-amber-100 text-slate-900 font-display font-black text-3xl sm:text-4xl md:text-5xl border-2 border-slate-200/80 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                disabled={isAnswerRevealed}
                className="h-16 sm:h-20 md:h-24 rounded-3xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-2xl sm:text-3xl border-2 border-slate-200/80 transition-all active:scale-95 cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Big Action / Submit Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleSubmitAnswer()}
                disabled={isAnswerRevealed || !inputVal}
                className={`w-full h-20 sm:h-24 md:h-28 rounded-3xl font-display font-black text-2xl sm:text-3xl md:text-4xl flex items-center justify-center gap-3 shadow-lg transition-all cursor-pointer ${
                  inputVal && !isAnswerRevealed
                    ? 'bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-amber-500/40'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>确定提交 (Enter)</span>
                <ChevronRight className="w-9 h-9 sm:w-10 sm:h-10" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
