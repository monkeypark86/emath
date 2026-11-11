import React, { useState } from 'react';
import { PracticeSessionResult, MathQuestion } from '../types/math';
import { generateWeChatReport } from '../utils/storage';
import { localizeMethodTip } from '../utils/mathGenerator';
import { useLang } from '../i18n';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Printer,
  Sparkles,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';

interface ReportModalProps {
  result: PracticeSessionResult;
  onClose: () => void;
  onRetakeMistakes: (questions: MathQuestion[]) => void;
  onViewMistakeBook: () => void;
  onPlayAgain: () => void;
  onOpenMobileSync: () => void;
  onPrintWorksheet: (questions: MathQuestion[]) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  result,
  onClose,
  onRetakeMistakes,
  onViewMistakeBook,
  onPlayAgain,
  onOpenMobileSync,
  onPrintWorksheet
}) => {
  const { t } = useLang();
  const [copiedWeChat, setCopiedWeChat] = useState<boolean>(false);

  const handleCopyWeChat = () => {
    const text = generateWeChatReport(result);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedWeChat(true);
      setTimeout(() => setCopiedWeChat(false), 2500);
    });
  };

  const mistakesInSession = result.attempts
    .filter(a => !a.isCorrect)
    .map(a => a.question);

  // Kid-friendly title evaluation
  let titleBadge = t('口算小新星', 'Rising Math Star');
  let badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
  let evaluationText = t('保持练习，熟能生巧！', 'Keep practicing — practice makes perfect!');

  if (result.accuracyRate === 100) {
    titleBadge = t('口算大满贯 · 神速小宗师', 'Perfect Score · Grand Master');
    badgeColor = 'text-amber-800 bg-amber-100 border-amber-300';
    evaluationText = t(
      '太不可思议了！全部在5秒内准确攻克，速算思维极度敏捷！',
      'Incredible! Every question solved accurately at lightning speed!'
    );
  } else if (result.accuracyRate >= 90) {
    titleBadge = t('速算达人 · 智慧之星', 'Speed Math Ace · Bright Star');
    badgeColor = 'text-emerald-800 bg-emerald-100 border-emerald-300';
    evaluationText = t(
      '表现十分优异！反应迅速且准确率极高，继续保持冲刺！',
      'Awesome job! Fast reflexes and super high accuracy — keep it up!'
    );
  } else if (result.accuracyRate >= 75) {
    titleBadge = t('口算先锋 · 稳步进阶', 'Math Pioneer · Steady Progress');
    badgeColor = 'text-blue-800 bg-blue-100 border-blue-300';
    evaluationText = t(
      '大部分题目迅速解答，个别题目稍加细心就能拿满分哦！',
      'Great work on most questions — a little extra care will make it 100%!'
    );
  } else {
    titleBadge = t('勤学小标兵 · 蓄力爆发', 'Hard Worker · Getting Stronger');
    badgeColor = 'text-purple-800 bg-purple-100 border-purple-300';
    evaluationText = t(
      '不要灰心，5秒倒计时非常有挑战性，多练两遍口诀就能飞速提升！',
      'Don’t give up! Timed rounds are tough — a few more tries and you’ll soar!'
    );
  }

  // Operator breakdown calculation
  const opStats: Record<string, { total: number; correct: number; totalTime: number }> = {};
  result.attempts.forEach(a => {
    const sym = a.question.operatorSymbol;
    if (!opStats[sym]) {
      opStats[sym] = { total: 0, correct: 0, totalTime: 0 };
    }
    opStats[sym].total++;
    if (a.isCorrect) opStats[sym].correct++;
    opStats[sym].totalTime += a.timeSpentSec;
  });

  const fastestAttempt = result.attempts.reduce(
    (min, a) => (a.isCorrect && a.timeSpentSec < min ? a.timeSpentSec : min),
    99
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl my-8 relative">
        {/* Top Header Card */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-3 shadow-inner">
            <Trophy className="w-8 h-8 fill-amber-500" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-2 uppercase tracking-wide">
            <span className={badgeColor + ' px-2.5 py-0.5 rounded-full'}>{titleBadge}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
            {t('本轮口算速测统计报告', 'Round Summary Report')}
          </h2>

          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1.5">
            {evaluationText}
          </p>

          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50/80 py-1.5 px-4 rounded-xl inline-flex font-medium">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>
              {t(
                `家长奖励库已入账 +${result.starsEarned} 颗小星星 ⭐`,
                `+${result.starsEarned} star${result.starsEarned === 1 ? '' : 's'} added to reward bank ⭐`
              )}
            </span>
          </div>
        </div>

        {/* 4 Core KPI Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('正确率', 'Accuracy')}</div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-0.5">
              {result.accuracyRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t(`对 ${result.correctCount} / 共 ${result.totalQuestions}`, `${result.correctCount} / ${result.totalQuestions} correct`)}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('平均答题速度', 'Avg Speed')}</div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-0.5">
              {result.averageTimeSec}s
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t('限制 5.0 秒/题', 'Target 5.0s/Q')}</div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('最快心算极速', 'Fastest')}</div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-600 mt-0.5">
              {fastestAttempt < 90 ? `${fastestAttempt}s` : '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t('思维火花', 'Best time')}</div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('错题/超时入本', 'Mistakes Saved')}</div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-rose-600 mt-0.5">
              {result.wrongCount + result.timeoutCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t('已自动归档', 'Auto-saved')}
            </div>
          </div>
        </div>

        {/* Operation Type Breakdown */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 mb-6">
          <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-between">
            <span>{t('四则运算分项诊断', 'Breakdown by Operation')}</span>
            <span className="text-[11px] font-normal text-slate-500">{t('准确率与平均耗时', 'Accuracy & avg time')}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.entries(opStats).map(([sym, stat]) => {
              const acc = Math.round((stat.correct / stat.total) * 100);
              const avg = Number((stat.totalTime / stat.total).toFixed(1));
              const nameMap: Record<string, string> = {
                '+': t('加法', 'Add'),
                '-': t('减法', 'Sub'),
                '×': t('乘法', 'Mul'),
                '÷': t('除法', 'Div')
              };
              return (
                <div key={sym} className="bg-white border border-slate-200 rounded-xl p-2.5">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-800 font-bold">{sym} {nameMap[sym]}</span>
                    <span className={`font-mono font-semibold ${acc >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {acc}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>{stat.correct}/{stat.total}{t(' 题', '')}</span>
                    <span>{t(`均速 ${avg}s`, `Avg ${avg}s`)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Details List (Scrollable preview) */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            {t(`答题清单回顾 (${result.attempts.length} 题)`, `Question Review (${result.attempts.length})`)}
          </div>
          <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 text-xs">
            {result.attempts.map((att, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-slate-400 w-5">{idx + 1}.</span>
                  <span className="font-semibold text-slate-800 font-mono text-sm">
                    {att.question.num1} {att.question.operatorSymbol} {att.question.num2} = {att.question.correctAnswer}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
                    ({localizeMethodTip(att.question.methodTip)})
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-slate-500">{att.timeSpentSec}s</span>
                  {att.isCorrect ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('正确', 'Correct')}
                    </span>
                  ) : att.isTimeout ? (
                    <span className="text-orange-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {t('5秒超时', 'Timeout')}
                    </span>
                  ) : (
                    <span className="text-rose-500 font-medium flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> {t(`填了 ${att.userAnswer}`, `Ans: ${att.userAnswer}`)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5">
          {mistakesInSession.length > 0 && (
            <button
              type="button"
              onClick={() => onRetakeMistakes(mistakesInSession)}
              className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {t(
                  `专项攻克：重练本轮 ${mistakesInSession.length} 道错题`,
                  `Retry ${mistakesInSession.length} Mistake${mistakesInSession.length === 1 ? '' : 's'} from This Round`
                )}
              </span>
            </button>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={onPlayAgain}
              className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('再练一轮', 'Play Again')}</span>
            </button>

            <button
              type="button"
              onClick={onViewMistakeBook}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('智能错题本', 'Mistake Book')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMobileSync}
              className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('同步到家长手机', 'Sync to Phone')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWeChat}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedWeChat ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{copiedWeChat ? t('已复制战报！', 'Copied!') : t('复制微信播报', 'Copy Report')}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => onPrintWorksheet(result.attempts.map(a => a.question))}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> {t('打印练习纸', 'Print Worksheet')}
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t('返回主界面', 'Back to Home')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
