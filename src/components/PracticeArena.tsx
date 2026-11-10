import React, { useState, useEffect, useRef } from 'react';
import {
  GradeLevel,
  MathQuestion,
  OperationType,
  PracticeSessionResult,
  QuestionAttempt,
  StudentProfile
} from '../types/math';
import { generateQuestionBatch } from '../utils/mathGenerator';
import { recordMistake, savePracticeSession, addStars, getMistakes, DEFAULT_STUDENT_PREFERENCES } from '../utils/storage';
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
import confetti from 'canvas-confetti';

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

  useEffect(() => {
    if (studentPrefs?.equationLayout === 'auto' && questions[currentIndex]) {
      setIsVerticalFormula(getPreferredLayout(questions[currentIndex]));
    }
  }, [currentIndex, questions]);

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
    const prefs = student?.preferences || DEFAULT_STUDENT_PREFERENCES;
    const g = student?.grade || defaultGrade;
    const ops = prefs.selectedOps && prefs.selectedOps.length > 0 ? prefs.selectedOps : (['add', 'subtract', 'multiply', 'divide'] as OperationType[]);
    const cnt = prefs.questionCount || 30;
    const newQuestions = generateQuestionBatch(cnt, g, ops);
    setupAndStartSession(newQuestions, prefs.perQuestionSeconds ?? 5, g, ops);
  };

  // 2. ⚡ 每日挑战 (极速闪电3秒)
  const startDailyChallenge = () => {
    const prefs = student?.preferences || DEFAULT_STUDENT_PREFERENCES;
    const g = student?.grade || defaultGrade;
    const ops = prefs.selectedOps && prefs.selectedOps.length > 0 ? prefs.selectedOps : (['add', 'subtract', 'multiply', 'divide'] as OperationType[]);
    const newQuestions = generateQuestionBatch(10, g, ops);
    setupAndStartSession(newQuestions, 3, g, ops);
  };

  // 3. 📝 错题练习
  const startMistakePractice = () => {
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

      if (!hasFailedBefore && newStreak > 0 && newStreak % 5 === 0) {
        if (studentPrefs?.celebrationConfetti !== false) {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
        }
      }

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
      setIsAnswerRevealed(true);

      setTimeout(() => {
        advanceNextQuestion(updatedAttempts);
      }, 550);
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

    savePracticeSession(result);

    if (accuracyRate >= 80 && studentPrefs?.celebrationConfetti !== false) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 }
      });
    }

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
            setTimeout(() => {
              handleSubmitAnswer(nextVal);
            }, 60);
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
              setTimeout(() => {
                handleSubmitAnswer(nextVal);
              }, 60);
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
    <div className="w-full max-w-4xl mx-auto py-6 px-4 relative">
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
                  基于你当前的学段难度（{student?.grade === 'grade1' ? '一年级' : student?.grade === 'grade2' ? '二年级' : '三年级+'}）与运算配置，轻松打卡练习。
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold">
                <span className="bg-white/25 px-2.5 py-1 rounded-xl">
                  {student?.preferences?.questionCount || 30} 题 · 智能算式
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

          {/* 学习中心与功能导航 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div
              onClick={() => onSelectTab?.('banks')}
              className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">
                📚
              </div>
              <h4 className="font-bold text-xs text-slate-800">题库管理与组卷</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">自定义出题与打印试卷</p>
            </div>

            <div
              onClick={() => onSelectTab?.('mistakes')}
              className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col items-center text-center group relative"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">
                📝
              </div>
              <h4 className="font-bold text-xs text-slate-800">智能错题集</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">攻克薄弱点与重练</p>
              {unmasteredMistakeCount > 0 && (
                <span className="absolute top-2 right-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full font-mono">
                  {unmasteredMistakeCount}
                </span>
              )}
            </div>

            <div
              onClick={() => onSelectTab?.('parent')}
              className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h4 className="font-bold text-xs text-slate-800">家长学情看板</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">周报、统计与成长勋章</p>
            </div>

            <div
              onClick={() => onSelectTab?.('mobile')}
              className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">
                📱
              </div>
              <h4 className="font-bold text-xs text-slate-800">手机随身练</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">扫码多端同步错题</p>
            </div>
          </div>
        </div>
      ) : (
        /* Active Practice Arena (极致纯净免干扰) */
        <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
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
                        ? 'text-5xl sm:text-6xl md:text-7xl'
                        : studentPrefs?.fontSizeScale === 'large'
                        ? 'text-4xl sm:text-6xl'
                        : 'text-4xl sm:text-5xl'
                    } font-bold tracking-widest text-right w-full pr-1 font-mono`}>
                      {currentQ.num1}
                    </div>

                    {/* Bottom Row: Operator + Num 2 */}
                    <div className={`${
                      studentPrefs?.fontSizeScale === 'xl'
                        ? 'text-5xl sm:text-6xl md:text-7xl'
                        : studentPrefs?.fontSizeScale === 'large'
                        ? 'text-4xl sm:text-6xl'
                        : 'text-4xl sm:text-5xl'
                    } font-bold tracking-widest flex items-center justify-between w-full mt-1.5 pr-1 font-mono`}>
                      <span className="text-amber-500 font-bold text-3xl sm:text-4xl mr-3 font-mono">
                        {currentQ.operatorSymbol}
                      </span>
                      <span>{currentQ.num2}</span>
                    </div>

                    {/* Solid Calculation Divider Line */}
                    <div className="w-full h-1 bg-slate-900 my-2.5 rounded-full"></div>

                    {/* Answer Input Box directly under the line (Right-aligned) */}
                    <div className="w-full flex justify-end">
                      <div className="min-w-[130px] sm:min-w-[150px] h-14 sm:h-16 bg-white border-2 border-amber-400 rounded-2xl flex items-center justify-end px-3 font-mono font-bold text-3xl sm:text-4xl text-amber-900 tracking-widest shadow-inner">
                        {inputVal || <span className="text-amber-300 animate-pulse">?</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Horizontal Layout (横式) */
                  <div className={`${
                    studentPrefs?.fontSizeScale === 'xl'
                      ? 'text-5xl sm:text-6xl md:text-7xl'
                      : studentPrefs?.fontSizeScale === 'large'
                      ? 'text-4xl sm:text-6xl'
                      : 'text-4xl sm:text-5xl'
                  } font-display font-bold text-slate-900 tracking-tight my-4 flex items-center justify-center gap-3`}>
                    <span>{currentQ.num1}</span>
                    <span className="text-amber-500 font-mono">{currentQ.operatorSymbol}</span>
                    <span>{currentQ.num2}</span>
                    <span className="text-slate-400">=</span>
                    <div className="min-w-[80px] sm:min-w-[100px] h-14 sm:h-16 border-b-4 border-amber-500 bg-amber-50/40 rounded-t-lg flex items-center justify-center font-mono font-bold text-3xl sm:text-4xl text-amber-900">
                      {inputVal || <span className="text-amber-300 animate-pulse">?</span>}
                    </div>
                  </div>
                )}

                {/* Instant Feedback Notice */}
                <div className="min-h-8 flex flex-col items-center justify-center my-1">
                  {lastFeedback === 'correct' && (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm animate-pulse">
                      <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                      <span>太棒了！回答正确，用时 {attempts[attempts.length - 1]?.timeSpentSec ?? elapsedTime} 秒！正在进入下一题...</span>
                    </div>
                  )}
                  {lastFeedback === 'wrong' && (
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                      <XCircle className="w-5 h-5 fill-rose-100" />
                      <span>❌ 答案不对，已自动记入错题集！请再仔细算算（算对后自动进入下一题）</span>
                    </div>
                  )}
                </div>

                {/* Pedagogical Hint when user makes a mistake */}
                {lastFeedback === 'wrong' && (currentQ.methodTip || currentQ.explanation) && (
                  <div className="mt-2 text-xs text-left bg-amber-50/90 border border-amber-200 p-3 rounded-2xl text-amber-950 w-full shadow-2xs">
                    <div className="font-bold flex items-center gap-1 text-amber-900 text-xs mb-1">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>💡 巧算口诀与思路点拨：</span>
                    </div>
                    <p className="leading-relaxed text-slate-700">
                      {currentQ.methodTip || currentQ.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Large Kid-Friendly Touch & Keyboard On-Screen NumPad */}
          <div className="max-w-xs sm:max-w-sm mx-auto mt-2">
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  disabled={isAnswerRevealed}
                  className="h-12 sm:h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-amber-100 text-slate-800 font-display font-bold text-xl sm:text-2xl border border-slate-200 transition-colors shadow-xs"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                disabled={isAnswerRevealed}
                className="h-12 sm:h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-semibold text-sm border border-slate-200 transition-colors"
              >
                清空
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={isAnswerRevealed}
                className="h-12 sm:h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-amber-100 text-slate-800 font-display font-bold text-xl sm:text-2xl border border-slate-200 transition-colors shadow-xs"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                disabled={isAnswerRevealed}
                className="h-12 sm:h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-semibold text-lg border border-slate-200 transition-colors"
              >
                ⌫
              </button>
            </div>

            {/* Big Action / Submit Button */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => handleSubmitAnswer()}
                disabled={isAnswerRevealed || !inputVal}
                className={`w-full h-12 sm:h-14 rounded-2xl font-display font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-sm transition-all ${
                  inputVal && !isAnswerRevealed
                    ? 'bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-amber-500/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>确定提交 (Enter)</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="text-[11px] text-center text-slate-400 mt-2">
              💡 提示：无需焦虑时间，答对后将自动进入下一题，系统会精准记录你的做题用时
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
