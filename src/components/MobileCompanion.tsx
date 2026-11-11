import React, { useState, useEffect, useRef } from 'react';
import {
  MistakeItem,
  MathQuestion,
  PracticeSessionResult,
  QuestionAttempt
} from '../types/math';
import {
  getMistakes,
  saveMistakes,
  markMistakeMastered,
  getParentSettings,
  getPracticeSessions,
  savePracticeSession,
  importSyncPayload,
  addStars,
  generateWeChatReport,
  getActiveStudent
} from '../utils/storage';
import { sound } from '../utils/soundEffects';
import {
  Smartphone,
  BookOpen,
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
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  XCircle
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
  const [isMobileVertical, setIsMobileVertical] = useState<boolean>(true); // 公式立着 / 竖式显示

  // Mobile speed practice state
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceQIndex, setPracticeQIndex] = useState<number>(0);
  const [practiceQuestions, setPracticeQuestions] = useState<MathQuestion[]>([]);
  const [practiceElapsedTime, setPracticeElapsedTime] = useState<number>(0);
  const mobileStartTimeRef = useRef<number>(Date.now());
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

  const handleCopyMobileSessionReport = (s: PracticeSessionResult) => {
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

  // Start mobile independent 5-second practice
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
    mobileStartTimeRef.current = Date.now();
    setPracticeInput('');
    setPracticeStreak(0);
    setPracticeRevealed(false);
    setPracticeFeedback(null);
    setIsPracticing(true);
  };

  // Mobile Elapsed Timer (隐藏倒计时，记录用时)
  useEffect(() => {
    if (!isPracticing || practiceRevealed) return;

    const timer = setInterval(() => {
      setPracticeElapsedTime(Number(((Date.now() - mobileStartTimeRef.current) / 1000).toFixed(1)));
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
      setPracticeInput(''); // 答错不清退题目，清空输入框让孩子继续重试算对
    }
  };

  const advanceMobileNext = () => {
    if (practiceQIndex + 1 >= practiceQuestions.length) {
      setIsPracticing(false);
      sound.playFanfare();
      confetti({ particleCount: 50, spread: 60 });
      alert(t('移动端错题回顾挑战完成！继续加油！', 'Mobile review complete! Keep it up!'));
    } else {
      setPracticeQIndex(prev => prev + 1);
      setPracticeElapsedTime(0);
      mobileStartTimeRef.current = Date.now();
      setPracticeInput('');
      setPracticeRevealed(false);
      setPracticeFeedback(null);
    }
  };

  // Keypad press in mobile practice
  const handleMobileKeypad = (num: string) => {
    if (practiceRevealed) return;
    if (num === 'C') setPracticeInput('');
    else if (num === '⌫') setPracticeInput(prev => prev.slice(0, -1));
    else if (num === 'OK') handleMobileSubmit();
    else {
      if (practiceInput.length < 5) setPracticeInput(prev => prev + num);
    }
  };

  // Import via pairing code
  const handlePairingCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedCode = localStorage.getItem('math_latest_pairing_code');
    const storedPayload = localStorage.getItem('math_latest_pairing_payload');
    if (syncCodeInput.trim() === storedCode && storedPayload) {
      const ok = importSyncPayload(storedPayload);
      if (ok) {
        loadData();
        setSyncMessage(t('✅ 配对成功！已同步最新错题数据。', '✅ Paired! Latest mistakes synced.'));
      } else {
        setSyncMessage(t('❌ 同步数据解析失败', '❌ Sync data parse failed'));
      }
    } else {
      setSyncMessage(t('⚠️ 配对口令不存在或已过期，请在电脑端重新生成。', '⚠️ Code invalid or expired. Regenerate on PC.'));
    }
  };

  const currentQ = practiceQuestions[practiceQIndex];

  return (
    <div className="w-full max-w-md mx-auto py-4 px-2 sm:px-4">
      {/* Top Mobile Device Shell */}
      <div className="bg-slate-900 rounded-[38px] p-3 sm:p-4 shadow-2xl border-4 border-slate-800">
        {/* Speaker / Camera Notch */}
        <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-900 mr-2"></div>
          <div className="w-8 h-1 rounded-full bg-slate-900"></div>
        </div>

        {/* Screen Content Container */}
        <div className="bg-slate-50 rounded-[28px] overflow-hidden min-h-[620px] flex flex-col justify-between border border-slate-200 text-slate-800 relative">
          {/* Mobile Top Header */}
          <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToMain}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('返回大屏', 'Back')}</span>
            </button>

            <div className="text-center">
              <div className="text-xs font-bold text-slate-900">{t('小象随身练 (手机版)', 'Elephant Pocket (Mobile)')}</div>
              <div className="text-[10px] text-emerald-600 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t('错题实时同步', 'Live Sync')}</span>
              </div>
            </div>

            <div className="w-12 text-right">
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                {t(`${activeMistakes.length} 待练`, `${activeMistakes.length} left`)}
              </span>
            </div>
          </div>

          {/* Subheader Mobile Nav Tabs */}
          <div className="grid grid-cols-3 bg-white border-b border-slate-100 text-xs font-medium text-slate-500">
            <button
              type="button"
              onClick={() => {
                setMobileTab('flashcard');
                setIsPracticing(false);
              }}
              className={`py-2 text-center border-b-2 transition-all ${
                mobileTab === 'flashcard'
                  ? 'border-amber-500 text-amber-700 font-bold bg-amber-50/40'
                  : 'border-transparent'
              }`}
            >
              {t('错题极速闪卡', 'Flashcards')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileTab('speed_practice');
                startMobilePractice();
              }}
              className={`py-2 text-center border-b-2 transition-all ${
                mobileTab === 'speed_practice'
                  ? 'border-amber-500 text-amber-700 font-bold bg-amber-50/40'
                  : 'border-transparent'
              }`}
            >
              {t('错题独立重测', 'Retest')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileTab('parent_sync');
                setIsPracticing(false);
              }}
              className={`py-2 text-center border-b-2 transition-all ${
                mobileTab === 'parent_sync'
                  ? 'border-amber-500 text-amber-700 font-bold bg-amber-50/40'
                  : 'border-transparent'
              }`}
            >
              {t('家长手机查收', 'Parent Sync')}
            </button>
          </div>

          {/* Tab 1: Flashcard Mode (Card flipping) */}
          {mobileTab === 'flashcard' && (
            <div className="p-4 flex-1 flex flex-col justify-between">
              {activeMistakes.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{t('太棒啦！没有待练错题', 'Awesome! No Mistakes Left')}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('所有错题均已在移动端攻克完毕，可去电脑端开启新一轮挑战。', 'All mistakes mastered on mobile! Start a new round on PC.')}
                  </p>
                </div>
              ) : (
                <>
                  {/* Progress Indicator & Vertical toggle */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>
                      {t('卡片', 'Card')} <strong className="text-slate-700">{currentIndex + 1}</strong> / {activeMistakes.length}
                    </span>

                    {/* Quick Layout Toggle */}
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-[10px] font-medium">
                      <button
                        type="button"
                        onClick={() => setIsMobileVertical(true)}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          isMobileVertical ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        {t('立式 (竖式)', 'Vertical')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMobileVertical(false)}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          !isMobileVertical ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        {t('横式', 'Horiz.')}
                      </button>
                    </div>
                  </div>

                  {/* Flippable Flashcard */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative cursor-pointer min-h-[260px] bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:border-amber-300"
                  >
                    {!isFlipped ? (
                      /* Card Front: Problem (Supports 立式 / 竖式) */
                      <div className="animate-fade-in flex flex-col items-center">
                        <div className="inline-block text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-md mb-2">
                          {currentMistake?.question.difficultyGrade} · {currentMistake?.question.methodTip}
                        </div>

                        {isMobileVertical ? (
                          /* Vertical Column Equation (立式) */
                          <div className="inline-flex flex-col items-end font-mono text-slate-900 my-1 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-200 min-w-[150px]">
                            <div className="text-3xl font-bold tracking-widest text-right w-full pr-1 font-mono">
                              {currentMistake?.question.num1}
                            </div>
                            <div className="text-3xl font-bold tracking-widest flex items-center justify-between w-full mt-1 pr-1 font-mono">
                              <span className="text-amber-500 font-bold text-2xl mr-2 font-mono">
                                {currentMistake?.question.operatorSymbol}
                              </span>
                              <span>{currentMistake?.question.num2}</span>
                            </div>
                            <div className="w-full h-0.5 bg-slate-800 my-1.5"></div>
                            <div className="w-full text-right text-3xl font-bold text-amber-500 font-mono tracking-widest pr-1">
                              ?
                            </div>
                          </div>
                        ) : (
                          /* Horizontal Equation */
                          <div className="text-3xl font-display font-extrabold text-slate-900 tracking-tight my-2">
                            {currentMistake?.question.num1} {currentMistake?.question.operatorSymbol} {currentMistake?.question.num2} = ?
                          </div>
                        )}

                        <div className="text-xs text-rose-500 mt-2 flex items-center justify-center gap-1">
                          {currentMistake?.isTimeout ? (
                            <>
                              <Clock className="w-3.5 h-3.5" /> {t('5秒倒计时超时', '5s Timeout')}
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" /> {t(`上次填了 ${currentMistake?.wrongAnswer}`, `Last: ${currentMistake?.wrongAnswer}`)}
                            </>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('轻触翻面查看思路与答案', 'Tap to flip for steps & answer')}</span>
                        </div>
                      </div>
                    ) : (
                      /* Card Back: Answer & Step-by-Step Logic */
                      <div className="animate-fade-in">
                        <div className="text-[11px] text-emerald-600 font-semibold mb-1">
                          {t('正确答案', 'Correct Answer')}
                        </div>
                        <div className="text-4xl font-mono font-extrabold text-emerald-600 mb-3">
                          {currentMistake?.question.correctAnswer}
                        </div>

                        <div className="text-xs text-slate-700 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/60 text-left leading-relaxed">
                          <div className="font-bold text-amber-900 mb-1">{t('口算思路解析：', 'Solution Steps:')}</div>
                          {currentMistake?.question.explanation}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-3">
                          {t('轻触再次翻转', 'Tap to flip back')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumb Zone Ergonomic Controls (Bottom Reach) */}
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleNextCard}
                        className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('还没懂·换下一题', 'Skip · Next')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleMarkMastered}
                        className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{t('掌握了·移出租本', 'Mastered · Remove')}</span>
                      </button>
                    </div>

                    <div className="flex justify-between px-2 pt-1">
                      <button
                        type="button"
                        onClick={handlePrevCard}
                        className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> {t('上一题', 'Prev')}
                      </button>
                      <button
                        type="button"
                        onClick={handleNextCard}
                        className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                      >
                        {t('下一题', 'Next')} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Mobile 5-Second Speed Practice */}
          {mobileTab === 'speed_practice' && (
            <div className="p-3 flex-1 flex flex-col justify-between">
              {currentQ && (
                <div>
                  {/* Timer & Question */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">
                      {t(`第 ${practiceQIndex + 1} / ${practiceQuestions.length} 题`, `Q ${practiceQIndex + 1} / ${practiceQuestions.length}`)}
                    </span>
                    <span className="font-mono font-medium text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      ⏱️ {t('本题用时:', 'Time:')} <strong className="text-slate-800 font-bold">{practiceElapsedTime.toFixed(1)}s</strong>
                    </span>
                  </div>

                  {/* Math Formula Card (Supports 立式 / 竖式) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs flex flex-col items-center">
                    {isMobileVertical ? (
                      /* 立式 (竖式) */
                      <div className="inline-flex flex-col items-end font-mono text-slate-900 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 min-w-[130px]">
                        <div className="text-2xl font-bold tracking-widest text-right w-full pr-1 font-mono">
                          {currentQ.num1}
                        </div>
                        <div className="text-2xl font-bold tracking-widest flex items-center justify-between w-full mt-1 pr-1 font-mono">
                          <span className="text-amber-500 font-bold text-xl mr-2 font-mono">
                            {currentQ.operatorSymbol}
                          </span>
                          <span>{currentQ.num2}</span>
                        </div>
                        <div className="w-full h-0.5 bg-slate-800 my-1"></div>
                        <div className="w-full text-right text-2xl font-bold text-amber-900 font-mono tracking-widest pr-1 min-h-[32px]">
                          {practiceInput || <span className="text-amber-300 animate-pulse">?</span>}
                        </div>
                      </div>
                    ) : (
                      /* 横式 */
                      <div className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
                        <span>{currentQ.num1}</span>
                        <span className="text-amber-500 font-mono">{currentQ.operatorSymbol}</span>
                        <span>{currentQ.num2}</span>
                        <span className="text-slate-400">=</span>
                        <span className="min-w-[60px] border-b-2 border-amber-500 font-mono text-amber-900">
                          {practiceInput || '?'}
                        </span>
                      </div>
                    )}

                    {/* Feedback Notice */}
                    <div className="min-h-6 mt-1 flex items-center justify-center text-xs">
                      {practiceFeedback === 'correct' && (
                        <span className="text-emerald-600 font-bold">{t(`✅ 答对啦！用时 ${practiceElapsedTime.toFixed(1)}s，即将进入下一题...`, `✅ Correct in ${practiceElapsedTime.toFixed(1)}s! Next up...`)}</span>
                      )}
                      {practiceFeedback === 'wrong' && (
                        <span className="text-rose-600 font-bold">{t('❌ 答案不对，请再仔细算算！（答对后自动进入下一题）', '❌ Try again! (Auto-advances when right)')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Thumb Numpad */}
              <div className="mt-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleMobileKeypad(n.toString())}
                      className="h-11 rounded-xl bg-white active:bg-amber-100 border border-slate-200 font-mono font-bold text-lg text-slate-800 shadow-xs"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleMobileKeypad('C')}
                    className="h-11 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs"
                  >
                    {t('清空', 'Clear')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMobileKeypad('0')}
                    className="h-11 rounded-xl bg-white active:bg-amber-100 border border-slate-200 font-mono font-bold text-lg text-slate-800 shadow-xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMobileKeypad('⌫')}
                    className="h-11 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm"
                  >
                    ⌫
                  </button>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => handleMobileSubmit()}
                    disabled={!practiceInput || practiceRevealed}
                    className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors"
                  >
                    {t('确认 (提交答案)', 'Submit Answer')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Parent Mobile Sync & Review */}
          {mobileTab === 'parent_sync' && (
            <div className="p-3.5 flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-3.5">
                {/* Child Status Summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{activeStudent.avatar}</span>
                      <span>{t(`${settings.studentName} 今日学情看板`, `${settings.studentName}'s Today Stats`)}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
                      {t('手机端已同步', 'Synced')}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-1.5">
                      <div className="text-slate-400 text-[10px]">{t('挑战轮次', 'Rounds')}</div>
                      <div className="font-mono font-bold text-slate-800 text-sm">{t(`${sessions.length} 轮`, `${sessions.length}`)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-1.5">
                      <div className="text-slate-400 text-[10px]">{t('待练错题', 'Mistakes')}</div>
                      <div className="font-mono font-bold text-rose-600 text-sm">{activeMistakes.length}</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-1.5">
                      <div className="text-slate-400 text-[10px]">{t('已攻克题', 'Mastered')}</div>
                      <div className="font-mono font-bold text-emerald-600 text-sm">
                        {mistakes.filter(m => m.mastered).length}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-1.5">
                      <div className="text-slate-400 text-[10px]">{t('小星星', 'Stars')}</div>
                      <div className="font-mono font-bold text-amber-600 text-sm">{settings.currentStars} ⭐</div>
                    </div>
                  </div>
                </div>

                {/* Challenge History & Question-by-Question Details */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <span>{t('📊 历次挑战记录', '📊 History')}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-normal">
                        {t('含每题准确率与耗时', 'Accuracy & time per Q')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{t(`共 ${sessions.length} 轮`, `${sessions.length} rounds`)}</span>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      {t('暂无挑战记录，请在电脑端或扫码同步挑战数据', 'No records yet. Practice on PC or sync via code.')}
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                      {sessions.slice(0, 8).map(s => {
                        const isExpanded = expandedSessionId === s.id;
                        return (
                          <div
                            key={s.id}
                            className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 transition-all text-xs"
                          >
                            {/* Session Header Card */}
                            <div
                              onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                              className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-700">
                                    {s.challengeMode || t('每日练习', 'Daily')}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    {new Date(s.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}{' '}
                                    {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px]">
                                  <span className={`font-mono font-bold ${s.accuracyRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {t(`正确率 ${s.accuracyRate}%`, `Acc ${s.accuracyRate}%`)}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-600 font-mono">{t(`均速 ${s.averageTimeSec}s`, `Avg ${s.averageTimeSec}s`)}</span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-amber-600 font-mono">+{s.starsEarned}⭐</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                                <span>{isExpanded ? t('收起', 'Hide') : t('每题明细', 'Details')}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                            </div>

                            {/* Expanded Question Attempts */}
                            {isExpanded && (
                              <div className="p-2.5 bg-white border-t border-slate-100 space-y-1.5">
                                <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between pb-1">
                                  <span>{t(`每道题答题详情 (${s.attempts.length} 题)`, `Question Details (${s.attempts.length})`)}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyMobileSessionReport(s);
                                    }}
                                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                  >
                                    {copiedWeChatId === s.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedWeChatId === s.id ? t('已复制', 'Copied') : t('复制微信播报', 'Copy Report')}</span>
                                  </button>
                                </div>

                                {s.attempts.length === 0 ? (
                                  <div className="text-center py-3 text-slate-400 text-[11px]">
                                    {t('暂无单题流水记录', 'No per-question records')}
                                  </div>
                                ) : (
                                  <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {s.attempts.map((att, aIdx) => (
                                      <div
                                        key={aIdx}
                                        className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                                          att.isCorrect
                                            ? 'bg-slate-50/70 border-slate-100'
                                            : att.isTimeout
                                            ? 'bg-amber-50/70 border-amber-200'
                                            : 'bg-rose-50/70 border-rose-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-slate-400 text-[10px]">#{aIdx + 1}</span>
                                          <span className="font-mono font-bold text-slate-900">
                                            {att.question.num1} {att.question.operatorSymbol} {att.question.num2} = {att.question.correctAnswer}
                                          </span>
                                          <span className="text-[10px]">
                                            {att.isCorrect ? (
                                              <span className="text-emerald-600">({att.userAnswer} ✅)</span>
                                            ) : att.isTimeout ? (
                                              <span className="text-amber-700">{t('(超时 ⏰)', '(Timeout ⏰)')}</span>
                                            ) : (
                                              <span className="text-rose-600">{t(`(填 ${att.userAnswer} ❌)`, `(${att.userAnswer} ❌)`)}</span>
                                            )}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
                                          <span>⏱️ {att.timeSpentSec}s</span>
                                          {att.isCorrect ? (
                                            <span className="text-emerald-600 font-bold">{t('对', 'OK')}</span>
                                          ) : (
                                            <span className="text-rose-600 font-bold">{t('错', 'No')}</span>
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

                {/* Pairing Code Input */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
                  <div className="text-xs font-bold text-slate-900 mb-1">{t('手动同步配对口令', 'Manual Pairing Code')}</div>
                  <p className="text-[11px] text-slate-400 mb-2.5">{t('输入电脑端生成的6位同步配对码，拉取最新挑战成绩：', 'Enter 6-digit code from PC to pull latest results:')}</p>
                  <form onSubmit={handlePairingCodeSubmit} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder={t('6位配对码', '6-digit')}
                      value={syncCodeInput}
                      onChange={e => setSyncCodeInput(e.target.value)}
                      className="w-28 px-3 py-1.5 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="flex-1 py-1.5 px-3 bg-slate-900 text-white font-semibold rounded-xl text-xs"
                    >
                      {t('拉取同步数据', 'Pull Sync Data')}
                    </button>
                  </form>
                  {syncMessage && (
                    <div className="text-[11px] mt-2 font-medium text-slate-600">
                      {syncMessage}
                    </div>
                  )}
                </div>

                {/* Latest Pushed Mistakes list */}
                {activeMistakes.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
                    <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                      <span>{t('待攻克错题集', 'Mistakes to Master')}</span>
                      <span className="text-[10px] text-rose-600 font-mono font-bold">{t(`${activeMistakes.length} 道`, `${activeMistakes.length}`)}</span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {activeMistakes.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs flex items-center justify-between"
                        >
                          <span className="font-mono font-bold text-slate-900">
                            {m.question.num1} {m.question.operatorSymbol} {m.question.num2} = {m.question.correctAnswer}
                          </span>
                          <span className="text-[10px] text-rose-500 font-medium">
                            {m.isTimeout ? t('5秒超时', '5s Timeout') : t(`错填了 ${m.wrongAnswer}`, `Ans: ${m.wrongAnswer}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('flashcard')}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  {t('去给孩子递手机做闪卡练习 🚀', 'Start Kids Flashcard Practice 🚀')}
                </button>
              </div>
            </div>
          )}

          {/* Bottom App Safe Area */}
          <div className="bg-white py-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
            {t('小象速算移动端 · 支持离线缓存与即时练习', 'Elephant Math Mobile · Offline Cache & Instant Practice')}
          </div>
        </div>
      </div>
    </div>
  );
};
