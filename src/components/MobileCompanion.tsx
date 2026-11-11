import React, { useState, useEffect, useRef } from 'react';
import {
  MistakeItem,
  MathQuestion,
  PracticeSessionResult
} from '../types/math';
import {
  getMistakes,
  markMistakeMastered,
  getParentSettings,
  getPracticeSessions,
  importSyncPayload,
  generateWeChatReport,
  getActiveStudent
} from '../utils/storage';
import { sound } from '../utils/soundEffects';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Zap,
  Flame,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  BookOpen,
  QrCode,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLang } from '../i18n';

interface MobileCompanionProps {
  onBackToMain: () => void;
}

export const MobileCompanion: React.FC<MobileCompanionProps> = ({ onBackToMain }) => {
  const { t } = useLang();
  const [mobileTab, setMobileTab] = useState<'flashcard' | 'speed_practice' | 'parent_sync'>('flashcard');
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [syncCodeInput, setSyncCodeInput] = useState<string>('');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [isVertical, setIsVertical] = useState<boolean>(true); // 公式立式 (竖式) / 横式

  // Speed practice state
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceQIndex, setPracticeQIndex] = useState<number>(0);
  const [practiceQuestions, setPracticeQuestions] = useState<MathQuestion[]>([]);
  const [practiceElapsedTime, setPracticeElapsedTime] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const [practiceInput, setPracticeInput] = useState<string>('');
  const [practiceStreak, setPracticeStreak] = useState<number>(0);
  const [practiceRevealed, setPracticeRevealed] = useState<boolean>(false);
  const [practiceFeedback, setPracticeFeedback] = useState<'correct' | 'wrong' | null>(null);

  const [settings, setSettings] = useState(getParentSettings());
  const [sessions, setSessions] = useState<PracticeSessionResult[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [copiedWeChatId, setCopiedWeChatId] = useState<string | null>(null);
  const activeStudent = getActiveStudent();

  const loadData = () => {
    const list = getMistakes();
    setMistakes(list);
    setSessions(getPracticeSessions());
    setSettings(getParentSettings());
  };

  const handleCopySessionReport = (s: PracticeSessionResult) => {
    const text = generateWeChatReport(s, s.studentName || settings.studentName);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedWeChatId(s.id);
      setTimeout(() => setCopiedWeChatId(null), 2500);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Flashcard items: prioritize unmastered mistakes
  const activeMistakes = mistakes.filter(m => !m.mastered);
  const currentMistake = activeMistakes[currentIndex] || mistakes[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentIndex + 1 < activeMistakes.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(Math.max(0, activeMistakes.length - 1));
    }
  };

  const handleMarkMastered = () => {
    if (!currentMistake) return;
    sound.playCorrect();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    markMistakeMastered(currentMistake.id, true);
    loadData();
    setIsFlipped(false);
    if (currentIndex >= activeMistakes.length - 1) {
      setCurrentIndex(Math.max(0, activeMistakes.length - 2));
    }
  };

  // Start mobile independent practice
  const startMobilePractice = () => {
    const pool = activeMistakes.length > 0 ? activeMistakes : mistakes;
    if (pool.length === 0) {
      alert(t('错题本空空如也，太厉害啦！', 'No mistakes left — awesome!'));
      return;
    }
    const qList = pool.map(m => m.question).slice(0, 10);
    setPracticeQuestions(qList);
    setPracticeQIndex(0);
    setPracticeElapsedTime(0);
    startTimeRef.current = Date.now();
    setPracticeInput('');
    setPracticeStreak(0);
    setPracticeRevealed(false);
    setPracticeFeedback(null);
    setIsPracticing(true);
  };

  // Elapsed Timer during practice
  useEffect(() => {
    if (!isPracticing || practiceRevealed) return;

    const timer = setInterval(() => {
      setPracticeElapsedTime(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
    }, 100);

    return () => clearInterval(timer);
  }, [isPracticing, practiceRevealed, practiceQIndex]);

  const handleMobileSubmit = (val?: string) => {
    const raw = val !== undefined ? val : practiceInput;
    if (!raw || practiceRevealed || !practiceQuestions[practiceQIndex]) return;

    const currentQ = practiceQuestions[practiceQIndex];
    const isCorrect = parseInt(raw, 10) === currentQ.correctAnswer;

    if (isCorrect) {
      sound.playCorrect();
      setPracticeFeedback('correct');
      setPracticeStreak(prev => prev + 1);
      setPracticeRevealed(true);
      setTimeout(() => {
        advanceMobileNext();
      }, 550);
    } else {
      sound.playWrong();
      setPracticeFeedback('wrong');
      setPracticeStreak(0);
      setPracticeInput('');
    }
  };

  const advanceMobileNext = () => {
    if (practiceQIndex + 1 >= practiceQuestions.length) {
      setIsPracticing(false);
      sound.playFanfare();
      confetti({ particleCount: 50, spread: 60 });
      alert(t('错题回顾重测挑战完成！继续保持！', 'Review retest complete! Keep it up!'));
    } else {
      setPracticeQIndex(prev => prev + 1);
      setPracticeElapsedTime(0);
      startTimeRef.current = Date.now();
      setPracticeInput('');
      setPracticeRevealed(false);
      setPracticeFeedback(null);
    }
  };

  // Keypad press handler
  const handleKeypadPress = (num: string) => {
    if (practiceRevealed) return;
    if (num === 'C') setPracticeInput('');
    else if (num === '⌫') setPracticeInput(prev => prev.slice(0, -1));
    else if (num === 'OK') handleMobileSubmit();
    else {
      if (practiceInput.length < 5) setPracticeInput(prev => prev + num);
    }
  };

  // Physical keyboard support for desktop users
  useEffect(() => {
    if (mobileTab !== 'speed_practice' || !isPracticing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadPress('⌫');
      } else if (e.key === 'Enter') {
        handleMobileSubmit();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleKeypadPress('C');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileTab, isPracticing, practiceInput, practiceRevealed, practiceQIndex]);

  // Import via pairing code
  const handlePairingCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedCode = localStorage.getItem('math_latest_pairing_code');
    const storedPayload = localStorage.getItem('math_latest_pairing_payload');
    if (syncCodeInput.trim() === storedCode && storedPayload) {
      const ok = importSyncPayload(storedPayload);
      if (ok) {
        loadData();
        setSyncMessage(t('✅ 配对成功！已同步最新错题与学情数据。', '✅ Paired! Latest mistakes & stats synced.'));
      } else {
        setSyncMessage(t('❌ 同步数据解析失败', '❌ Sync data parse failed'));
      }
    } else {
      setSyncMessage(t('⚠️ 配对口令不存在或已过期，请在电脑端重新生成。', '⚠️ Code invalid or expired. Regenerate on PC.'));
    }
  };

  const currentQ = practiceQuestions[practiceQIndex];
  const totalMastered = mistakes.filter(m => m.mastered).length;
  const masterPercent = mistakes.length > 0 ? Math.round((totalMastered / mistakes.length) * 100) : 100;

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Back button */}
      {onBackToMain && (
        <button
          type="button"
          onClick={onBackToMain}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
        >
          <span>{t('← 返回口算训练首页', '← Back to Practice')}</span>
        </button>
      )}

      {/* Header Banner & Tab Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
            <span>{t('小象随身练与移动同步系统', 'Elephant Pocket & Mobile Sync')}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t('实时互通', 'Live Sync')}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              '支持错题极速闪卡复习、独立快速重测与家长手机端扫码查收同步，随时随地攻克薄弱环节。',
              'Flashcard review, standalone timed retest, and parent sync reports — master weak points anytime.'
            )}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileTab('flashcard');
              setIsPracticing(false);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              mobileTab === 'flashcard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t('错题极速闪卡', 'Flashcards')}</span>
            {activeMistakes.length > 0 && (
              <span className="text-[11px] font-mono text-rose-600 font-bold">({activeMistakes.length})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('speed_practice');
              if (!isPracticing) startMobilePractice();
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              mobileTab === 'speed_practice'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t('错题独立重测', 'Retest')}</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">5s</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('parent_sync');
              setIsPracticing(false);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              mobileTab === 'parent_sync'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t('家长查收与同步', 'Sync & Reports')}</span>
            {sessions.length > 0 && (
              <span className="text-[11px] font-mono text-slate-400">({sessions.length})</span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Flashcard Mode (错题极速闪卡) */}
      {mobileTab === 'flashcard' && (
        <div className="pt-6">
          {activeMistakes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                {t('太棒啦！没有待练错题', 'Awesome! No Mistakes Left')}
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                {t(
                  '所有错题均已在闪卡中攻克完毕，可开启错题独立重测检验成效，或返回首页开启新一轮口算训练。',
                  'All mistakes mastered! Test your skills with retest or practice on the main arena.'
                )}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab('speed_practice');
                    startMobilePractice();
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{t('开启独立重测', 'Start Retest')}</span>
                </button>
                <button
                  type="button"
                  onClick={onBackToMain}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  <span>{t('返回口算首页', 'Back to Main')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Flashcard Workbench */}
              <div className="lg:col-span-7 space-y-4">
                {/* Flashcard Header Controls */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {t('当前卡片', 'Card')} <strong className="text-slate-900 font-mono text-sm">{currentIndex + 1}</strong> / {activeMistakes.length}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {currentMistake?.question.difficultyGrade} · {currentMistake?.question.methodTip}
                    </span>
                  </div>

                  {/* Vertical / Horizontal Formula Toggle */}
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setIsVertical(true)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        isVertical ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t('立式 (竖式)', 'Vertical')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVertical(false)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        !isVertical ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t('横式', 'Horizontal')}
                    </button>
                  </div>
                </div>

                {/* The Flashcard itself */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[360px] bg-white border border-slate-200 hover:border-amber-400 rounded-3xl p-8 shadow-xs flex flex-col items-center justify-center text-center cursor-pointer transition-all relative select-none"
                >
                  {!isFlipped ? (
                    /* Card Front: Problem */
                    <div className="animate-fade-in flex flex-col items-center w-full">
                      {isVertical ? (
                        /* Vertical Column Equation (立式) */
                        <div className="inline-flex flex-col items-end font-mono text-slate-900 my-2 px-8 py-5 bg-slate-50 rounded-2xl border border-slate-200 min-w-[180px]">
                          <div className="text-4xl sm:text-5xl font-bold tracking-widest text-right w-full pr-2 font-mono">
                            {currentMistake?.question.num1}
                          </div>
                          <div className="text-4xl sm:text-5xl font-bold tracking-widest flex items-center justify-between w-full mt-2 pr-2 font-mono">
                            <span className="text-amber-500 font-bold text-3xl mr-4 font-mono">
                              {currentMistake?.question.operatorSymbol}
                            </span>
                            <span>{currentMistake?.question.num2}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-800 my-3"></div>
                          <div className="w-full text-right text-4xl sm:text-5xl font-bold text-amber-500 font-mono tracking-widest pr-2">
                            ?
                          </div>
                        </div>
                      ) : (
                        /* Horizontal Equation */
                        <div className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight my-6">
                          {currentMistake?.question.num1} {currentMistake?.question.operatorSymbol} {currentMistake?.question.num2} = ?
                        </div>
                      )}

                      {/* Error Context Badge */}
                      <div className="text-xs font-medium text-rose-500 mt-3 inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                        {currentMistake?.isTimeout ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('上次答题 5 秒倒计时超时', 'Timed out in 5s')}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>{t(`上次误填为 ${currentMistake?.wrongAnswer}`, `Answered ${currentMistake?.wrongAnswer} previously`)}</span>
                          </>
                        )}
                      </div>

                      {/* Flip Hint */}
                      <div className="text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-500" />
                        <span>{t('轻触卡片任意处翻面查看口算解析与答案', 'Click card to flip for steps & answer')}</span>
                      </div>
                    </div>
                  ) : (
                    /* Card Back: Answer & Logic */
                    <div className="animate-fade-in w-full max-w-md flex flex-col items-center">
                      <div className="text-xs font-bold text-emerald-600 mb-1 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('正确答案', 'Correct Answer')}</span>
                      </div>
                      <div className="text-5xl font-mono font-extrabold text-emerald-600 mb-4 tracking-tight">
                        {currentMistake?.question.correctAnswer}
                      </div>

                      <div className="text-xs text-slate-700 bg-amber-50/80 p-4 rounded-2xl border border-amber-200/60 text-left leading-relaxed w-full">
                        <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('口算思路与技巧解析：', 'Solution & Trick:')}</span>
                        </div>
                        <p className="text-slate-700 mt-1">{currentMistake?.question.explanation}</p>
                      </div>

                      <div className="text-xs text-slate-400 mt-5">
                        {t('轻触卡片翻回题目正面', 'Click card to flip back to question')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Flashcard Action Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrevCard}
                    className="h-11 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('上一题', 'Previous')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextCard}
                    className="h-11 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('还没懂·下一题', 'Skip · Next')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMarkMastered}
                    className="h-11 px-3 sm:col-span-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t('掌握了！从错题本移出', 'Mastered! Remove from Notebook')}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Progress & Navigator */}
              <div className="lg:col-span-5 space-y-6">
                {/* Stats Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="font-display font-bold text-base text-slate-900 flex items-center justify-between">
                    <span>{t('闪卡攻克进度', 'Flashcard Progress')}</span>
                    <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                      {t(`掌握率 ${masterPercent}%`, `${masterPercent}% Mastered`)}
                    </span>
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-center mt-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="text-slate-400 text-[11px]">{t('待攻克', 'Pending')}</div>
                      <div className="font-mono font-bold text-rose-600 text-xl mt-0.5">{activeMistakes.length}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="text-slate-400 text-[11px]">{t('已攻克', 'Mastered')}</div>
                      <div className="font-mono font-bold text-emerald-600 text-xl mt-0.5">{totalMastered}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="text-slate-400 text-[11px]">{t('总错题', 'Total')}</div>
                      <div className="font-mono font-bold text-slate-800 text-xl mt-0.5">{mistakes.length}</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <div className="font-semibold flex items-center gap-1 text-amber-800 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('极速闪卡学习法：', 'Flashcard Method:')}</span>
                    </div>
                    {t(
                      '通过翻卡闪记法则强化条件反射。先在大脑中快速心算，再翻看背面的口算技巧与正确答案，牢固建立口算直觉。',
                      'Build rapid reflex through active recall. Form the answer in mind, then flip to check logic and solidify intuition.'
                    )}
                  </div>
                </div>

                {/* Quick Mistake Navigator List */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-base text-slate-900">
                      {t('待攻克错题清单', 'Active Mistakes')}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {activeMistakes.length} {t('题', 'items')}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {activeMistakes.map((m, idx) => {
                      const isSelected = idx === currentIndex;
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setIsFlipped(false);
                          }}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 text-[11px] w-5">#{idx + 1}</span>
                            <span className="font-mono font-bold text-slate-900">
                              {m.question.num1} {m.question.operatorSymbol} {m.question.num2} = ?
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-rose-500 font-medium">
                              {m.isTimeout ? t('超时', 'Timeout') : t(`错填 ${m.wrongAnswer}`, `Ans: ${m.wrongAnswer}`)}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded">
                                {t('当前', 'Now')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Speed Practice Mode (错题独立重测) */}
      {mobileTab === 'speed_practice' && (
        <div className="pt-6">
          {!isPracticing || practiceQuestions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                {t('错题独立重测竞技场', 'Mistake Retest Arena')}
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                {t(
                  '从待攻克错题中随机抽取题目，按5秒极速反应机制进行即时重测检验，攻克薄弱环节！',
                  'Draws random questions from your unmastered mistakes for a fast-paced 5s retest.'
                )}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={startMobilePractice}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{t('开始 10 题快速重测', 'Start 10-Question Retest')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('flashcard')}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  <span>{t('返回闪卡复习', 'Back to Flashcards')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Practice Card & Input */}
              <div className="lg:col-span-7 space-y-4">
                {/* Status Bar */}
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {t(`第 ${practiceQIndex + 1} / ${practiceQuestions.length} 题`, `Question ${practiceQIndex + 1} of ${practiceQuestions.length}`)}
                    </span>
                    {practiceStreak > 1 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {t(`连对 ${practiceStreak}`, `Streak ${practiceStreak}`)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('本题用时:', 'Time:')} <strong>{practiceElapsedTime.toFixed(1)}s</strong></span>
                    </div>

                    {/* Formula Toggle */}
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setIsVertical(true)}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          isVertical ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {t('立式', 'Vert.')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsVertical(false)}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          !isVertical ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {t('横式', 'Horiz.')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Question Formula Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center justify-center text-center min-h-[260px]">
                  {currentQ && (
                    <div className="w-full flex flex-col items-center">
                      {isVertical ? (
                        /* 立式 (竖式) */
                        <div className="inline-flex flex-col items-end font-mono text-slate-900 my-2 px-8 py-4 bg-slate-50 rounded-2xl border border-slate-200 min-w-[170px]">
                          <div className="text-4xl font-bold tracking-widest text-right w-full pr-2 font-mono">
                            {currentQ.num1}
                          </div>
                          <div className="text-4xl font-bold tracking-widest flex items-center justify-between w-full mt-2 pr-2 font-mono">
                            <span className="text-amber-500 font-bold text-3xl mr-3 font-mono">
                              {currentQ.operatorSymbol}
                            </span>
                            <span>{currentQ.num2}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-800 my-2.5"></div>
                          <div className="w-full text-right text-4xl font-bold text-amber-900 font-mono tracking-widest pr-2 min-h-[44px]">
                            {practiceInput || <span className="text-amber-300 animate-pulse">?</span>}
                          </div>
                        </div>
                      ) : (
                        /* 横式 */
                        <div className="text-4xl sm:text-5xl font-display font-bold text-slate-900 tracking-tight flex items-center justify-center gap-3 my-6">
                          <span>{currentQ.num1}</span>
                          <span className="text-amber-500 font-mono">{currentQ.operatorSymbol}</span>
                          <span>{currentQ.num2}</span>
                          <span className="text-slate-400">=</span>
                          <span className="min-w-[80px] border-b-3 border-amber-500 font-mono text-amber-900 px-3 py-0.5">
                            {practiceInput || '?'}
                          </span>
                        </div>
                      )}

                      {/* Feedback Status */}
                      <div className="min-h-7 mt-3 flex items-center justify-center text-xs">
                        {practiceFeedback === 'correct' && (
                          <span className="text-emerald-600 font-bold flex items-center gap-1.5 animate-bounce">
                            <Check className="w-4 h-4 stroke-[3]" />
                            {t(`答对啦！用时 ${practiceElapsedTime.toFixed(1)}s，即将进入下一题...`, `Correct in ${practiceElapsedTime.toFixed(1)}s! Advancing...`)}
                          </span>
                        )}
                        {practiceFeedback === 'wrong' && (
                          <span className="text-rose-600 font-bold flex items-center gap-1.5">
                            <X className="w-4 h-4" />
                            {t('答案不对，请再仔细算算！（答对后自动进入下一题）', 'Incorrect, try again! (Advances when correct)')}
                          </span>
                        )}
                        {!practiceFeedback && (
                          <span className="text-slate-400">
                            {t('可直接使用键盘数字键或点击下方数字键盘输入', 'Use physical number keys or keypad below')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Keypad */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleKeypadPress(n.toString())}
                        className="h-12 rounded-xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 font-mono font-bold text-xl text-slate-800 transition-all shadow-2xs"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('C')}
                      className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors"
                    >
                      {t('清空', 'Clear')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="h-12 rounded-xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 border border-slate-200 font-mono font-bold text-xl text-slate-800 transition-all shadow-2xs"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('⌫')}
                      className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors"
                    >
                      ⌫
                    </button>
                  </div>

                  <div className="mt-3 max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={() => handleMobileSubmit()}
                      disabled={!practiceInput || practiceRevealed}
                      className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>{t('确认 (提交答案)', 'Submit Answer')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Question Queue & Actions */}
              <div className="lg:col-span-5 space-y-6">
                {/* Retest Info Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>{t('重测规则与要领', 'Retest Rules')}</span>
                  </h3>
                  <div className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
                    <p className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{t('答对自动进入下一题，答错可即时修改重试，直到算对为止。', 'Auto-advances on correct. Retry immediately if wrong.')}</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{t('鼓励在 5 秒内心算作答，培养对高频错题的快速直觉反应。', 'Aim for sub-5-second answers to solidify calculation reflexes.')}</span>
                    </p>
                  </div>
                </div>

                {/* Questions in Current Run */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="font-display font-bold text-base text-slate-900 mb-3 flex items-center justify-between">
                    <span>{t('本轮重测题单', 'Batch Progress')}</span>
                    <span className="text-xs font-mono text-slate-400">
                      {practiceQIndex} / {practiceQuestions.length} {t('完成', 'done')}
                    </span>
                  </h3>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {practiceQuestions.map((q, idx) => {
                      const isPast = idx < practiceQIndex;
                      const isCurrent = idx === practiceQIndex;
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                            isCurrent
                              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300 font-bold'
                              : isPast
                              ? 'bg-emerald-50/60 border-emerald-100 text-slate-700'
                              : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[11px] text-slate-400 w-5">#{idx + 1}</span>
                            <span>{q.num1} {q.operatorSymbol} {q.num2} = {isPast ? q.correctAnswer : '?'}</span>
                          </div>

                          <div>
                            {isPast && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                            {isCurrent && <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">{t('答题中', 'Active')}</span>}
                            {!isPast && !isCurrent && <span className="text-[10px] text-slate-300">{t('待答', 'Pending')}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Practice Controls */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={startMobilePractice}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('重新开始本轮', 'Restart')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPracticing(false);
                      setMobileTab('flashcard');
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    <span>{t('退出重测', 'Exit Retest')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Parent Sync & Review (家长查收与同步) */}
      {mobileTab === 'parent_sync' && (
        <div className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Student Status & Pairing */}
            <div className="lg:col-span-5 space-y-6">
              {/* Student Overview Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeStudent.avatar}</span>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-sm">
                        {t(`${settings.studentName} 今日学情看板`, `${settings.studentName}'s Today Stats`)}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {t('支持手机端即时扫码互通', 'Instant cross-device sync supported')}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                    {t('实时同步就绪', 'Sync Ready')}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                    <div className="text-slate-400 text-[10px]">{t('挑战轮次', 'Rounds')}</div>
                    <div className="font-mono font-bold text-slate-800 text-base mt-0.5">{sessions.length}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                    <div className="text-slate-400 text-[10px]">{t('待练错题', 'Mistakes')}</div>
                    <div className="font-mono font-bold text-rose-600 text-base mt-0.5">{activeMistakes.length}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                    <div className="text-slate-400 text-[10px]">{t('已攻克题', 'Mastered')}</div>
                    <div className="font-mono font-bold text-emerald-600 text-base mt-0.5">{totalMastered}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                    <div className="text-slate-400 text-[10px]">{t('小星星', 'Stars')}</div>
                    <div className="font-mono font-bold text-amber-600 text-base mt-0.5">{settings.currentStars} ⭐</div>
                  </div>
                </div>
              </div>

              {/* Pairing Code Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h3 className="font-display font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-500" />
                  <span>{t('手动同步配对口令', 'Manual Pairing Code')}</span>
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  {t('输入电脑端生成的 6 位同步配对码，拉取最新挑战成绩：', 'Enter 6-digit code from PC to pull latest results:')}
                </p>

                <form onSubmit={handlePairingCodeSubmit} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder={t('6位配对码', '6-digit')}
                    value={syncCodeInput}
                    onChange={e => setSyncCodeInput(e.target.value)}
                    className="w-32 px-3 py-2 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
                  >
                    {t('拉取同步数据', 'Pull Sync Data')}
                  </button>
                </form>

                {syncMessage && (
                  <div className="text-xs mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700">
                    {syncMessage}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="font-display font-bold text-base text-slate-900">
                  {t('快捷训练入口', 'Quick Actions')}
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileTab('flashcard')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t('开启错题极速闪卡复习 🚀', 'Start Flashcard Practice 🚀')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab('speed_practice');
                    startMobilePractice();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>{t('开启 5 秒错题独立重测 ⚡', 'Start 5s Timed Retest ⚡')}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Challenge History & Item-by-item Logs */}
            <div className="lg:col-span-7 space-y-6">
              {/* History List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900">
                      {t('历次挑战记录与单题流水', 'Challenge History & Item Logs')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('点击卡片即可展开查看每道题的做题准确率与耗时流水', 'Click any session to view per-question details')}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {t(`共 ${sessions.length} 轮`, `${sessions.length} rounds`)}
                  </span>
                </div>

                {sessions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    {t('暂无挑战记录，请在首页开练或在左侧扫码同步挑战数据', 'No records yet. Practice or sync data from left card.')}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {sessions.slice(0, 10).map(s => {
                      const isExpanded = expandedSessionId === s.id;
                      return (
                        <div
                          key={s.id}
                          className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40 transition-all text-xs"
                        >
                          {/* Session Header Card */}
                          <div
                            onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                                  {s.challengeMode || t('每日口算训练', 'Daily Practice')}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                  {new Date(s.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}{' '}
                                  {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 mt-1.5 text-xs">
                                <span className={`font-mono font-bold ${s.accuracyRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {t(`正确率 ${s.accuracyRate}%`, `Acc ${s.accuracyRate}%`)}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-600 font-mono">{t(`均速 ${s.averageTimeSec}s`, `Avg ${s.averageTimeSec}s`)}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-amber-600 font-mono font-bold">+{s.starsEarned}⭐</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                              <span>{isExpanded ? t('收起', 'Hide') : t('每题流水', 'Details')}</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>

                          {/* Expanded Question Attempts */}
                          {isExpanded && (
                            <div className="p-3.5 bg-white border-t border-slate-200/80 space-y-2">
                              <div className="text-xs font-semibold text-slate-600 flex items-center justify-between pb-1.5 border-b border-slate-100">
                                <span>{t(`单题答题详情 (${s.attempts.length} 题)`, `Attempt Details (${s.attempts.length} questions)`)}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopySessionReport(s);
                                  }}
                                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                                >
                                  {copiedWeChatId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedWeChatId === s.id ? t('已复制', 'Copied') : t('复制微信战报', 'Copy Report')}</span>
                                </button>
                              </div>

                              {s.attempts.length === 0 ? (
                                <div className="text-center py-4 text-slate-400 text-xs">
                                  {t('暂无单题流水明细', 'No per-question logs available')}
                                </div>
                              ) : (
                                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                  {s.attempts.map((att, aIdx) => (
                                    <div
                                      key={aIdx}
                                      className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                                        att.isCorrect
                                          ? 'bg-slate-50/70 border-slate-200/70'
                                          : att.isTimeout
                                          ? 'bg-amber-50/70 border-amber-200'
                                          : 'bg-rose-50/70 border-rose-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-slate-400 text-[11px]">#{aIdx + 1}</span>
                                        <span className="font-mono font-bold text-slate-900">
                                          {att.question.num1} {att.question.operatorSymbol} {att.question.num2} = {att.question.correctAnswer}
                                        </span>
                                        <span>
                                          {att.isCorrect ? (
                                            <span className="text-emerald-600 font-medium">({att.userAnswer} ✅)</span>
                                          ) : att.isTimeout ? (
                                            <span className="text-amber-700 font-medium">{t('(5s 超时 ⏰)', '(5s Timeout ⏰)')}</span>
                                          ) : (
                                            <span className="text-rose-600 font-medium">{t(`(填 ${att.userAnswer} ❌)`, `(${att.userAnswer} ❌)`)}</span>
                                          )}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
                                        <span>⏱️ {att.timeSpentSec}s</span>
                                        {att.isCorrect ? (
                                          <span className="text-emerald-600 font-bold">{t('正确', 'Pass')}</span>
                                        ) : (
                                          <span className="text-rose-600 font-bold">{t('错误', 'Fail')}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
