import React, { useState } from 'react';
import { PracticeSessionResult, MathQuestion } from '../types/math';
import { generateWeChatReport } from '../utils/storage';
import { localizeMethodTip } from '../utils/mathGenerator';
import { generateAiDiagnosis } from '../utils/aiDiagnosis';
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
  Check,
  Zap,
  TrendingUp,
  Brain,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowRight
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
  const [filterMode, setFilterMode] = useState<'all' | 'mistakes'>('all');
  const [expandedExplanationIdx, setExpandedExplanationIdx] = useState<number | null>(null);

  // Generate AI Smart Learning Diagnosis
  const aiDiag = generateAiDiagnosis(result);

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

  const displayedAttempts =
    filterMode === 'mistakes' ? result.attempts.filter(a => !a.isCorrect) : result.attempts;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl my-6 relative max-h-[92vh] overflow-y-auto">
        {/* Top Header Card */}
        <div className="text-center pb-5 border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-2.5 shadow-inner">
            <Trophy className="w-8 h-8 fill-amber-500" />
          </div>

          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-2 ${badgeColor}`}>
              {titleBadge}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
            {t('本轮口算速测统计报告', 'Round Summary Report')}
          </h2>

          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
            {evaluationText}
          </p>

          <div className="flex items-center justify-center gap-2 mt-2.5 text-xs text-amber-700 bg-amber-50/80 py-1.5 px-4 rounded-xl inline-flex font-medium border border-amber-200/50">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>
              {t(
                `家长奖励库已入账 +${result.starsEarned} 颗小星星 ⭐`,
                `+${result.starsEarned} star${result.starsEarned === 1 ? '' : 's'} added to reward bank ⭐`
              )}
            </span>
          </div>
        </div>

        {/* 1. Core KPI Metrics Board (5 Blocks) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-5">
          {/* Accuracy */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('正确率', 'Accuracy')}</div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-0.5">
              {result.accuracyRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t(`对 ${result.correctCount} / 共 ${result.totalQuestions}`, `${result.correctCount} / ${result.totalQuestions} right`)}
            </div>
          </div>

          {/* Average Speed */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('平均答题速度', 'Avg Speed')}</div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-0.5">
              {result.averageTimeSec}s
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t('目标 5.0s/题', 'Target 5.0s/Q')}</div>
          </div>

          {/* 5-Second Master Rate */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('5s极速达标率', 'Sub-5s Rate')}</div>
            <div className={`text-2xl sm:text-3xl font-mono font-extrabold mt-0.5 ${aiDiag.sub5SecRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {aiDiag.sub5SecRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t('限时内心算', 'Within 5s limit')}
            </div>
          </div>

          {/* Fastest Response */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('最快心算极速', 'Fastest')}</div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-600 mt-0.5">
              {aiDiag.fastestTime > 0 ? `${aiDiag.fastestTime.toFixed(1)}s` : '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t('思维火花', 'Best time')}</div>
          </div>

          {/* Mistakes Saved */}
          <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
            <div className="text-xs text-slate-500 font-medium">{t('错题入本', 'Mistakes Saved')}</div>
            <div className={`text-2xl sm:text-3xl font-mono font-extrabold mt-0.5 ${result.wrongCount + result.timeoutCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {result.wrongCount + result.timeoutCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {result.wrongCount + result.timeoutCount > 0 ? t('自动归档', 'Auto-saved') : t('全对无错题', 'None')}
            </div>
          </div>
        </div>

        {/* 2. 🤖 AI 智能学情诊断总结 (AI Smart Learning Diagnostic Card) */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-amber-50/50 to-emerald-50/50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 mb-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                  <span>{t('AI 智能学情诊断总结', 'AI Learning Insights & Diagnosis')}</span>
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.2 rounded-full">
                    AI Insights
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{t('心算流畅度指数:', 'Fluency Score:')}</span>
              <span className="font-mono font-bold text-sm text-indigo-700 bg-white border border-indigo-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                {aiDiag.fluencyScore} / 100
              </span>
            </div>
          </div>

          {/* Headline & Overview */}
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900 flex items-start gap-1.5 leading-snug">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{aiDiag.headline}</span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-indigo-100/60">
              {aiDiag.summary}
            </p>
          </div>

          {/* 3-Part Detailed Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-3 text-xs">
            {/* Strengths */}
            <div className="bg-white/80 border border-emerald-200/70 rounded-xl p-3">
              <div className="font-bold text-emerald-800 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('核心闪光点', 'Key Strengths')}</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                {aiDiag.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses & Causes */}
            <div className="bg-white/80 border border-amber-200/70 rounded-xl p-3">
              <div className="font-bold text-amber-900 mb-1.5 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('诊断与归因', 'Diagnosis & Causes')}</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                {aiDiag.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-white/80 border border-indigo-200/70 rounded-xl p-3">
              <div className="font-bold text-indigo-900 mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('专属突破建议', 'Action Plan')}</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                {aiDiag.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 3. 分项能力诊断 (Breakdown by Operation) */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 mb-5">
          <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('四则运算分项能力诊断', 'Breakdown by Operation')}</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              {t('准确率、均速与掌握度评级', 'Accuracy, avg speed & mastery rating')}
            </span>
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

              let levelTag = t('熟练掌握', 'Mastered');
              let levelColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
              if (acc < 70) {
                levelTag = t('重点攻克', 'Needs Focus');
                levelColor = 'text-rose-700 bg-rose-50 border-rose-200';
              } else if (acc < 90 || avg > 4.5) {
                levelTag = t('稳步进阶', 'Steady');
                levelColor = 'text-amber-700 bg-amber-50 border-amber-200';
              }

              return (
                <div key={sym} className="bg-white border border-slate-200 rounded-xl p-2.5">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-800 font-bold">{sym} {nameMap[sym]}</span>
                    <span className={`font-mono font-semibold text-xs ${acc >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {acc}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
                    <span>{stat.correct}/{stat.total} {t('题', 'Qs')}</span>
                    <span>{t(`均速 ${avg}s`, `Avg ${avg}s`)}</span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">{t('掌握度', 'Status')}</span>
                    <span className={`px-1.5 py-0.2 rounded font-medium border ${levelColor}`}>
                      {levelTag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. 单题流水明细追踪 (Question-by-Question Trace) */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>{t('单题流水明细追踪', 'Question Breakdown & Trace')}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                ({result.attempts.length} {t('题', 'questions')})
              </span>
            </div>

            {/* Filter Toggle */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('全部', 'All')} ({result.attempts.length})
              </button>
              {mistakesInSession.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode('mistakes')}
                  className={`px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                    filterMode === 'mistakes'
                      ? 'bg-white text-rose-600 font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{t('仅看错题/超时', 'Mistakes Only')}</span>
                  <span className="font-mono text-rose-500">({mistakesInSession.length})</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-200/80 rounded-2xl divide-y divide-slate-100 text-xs bg-white">
            {displayedAttempts.map((att, idx) => {
              const isWrong = !att.isCorrect;
              const isExpanded = expandedExplanationIdx === idx;
              return (
                <div key={idx} className="p-2.5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-slate-400 text-[11px] w-5">#{idx + 1}</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {att.question.num1} {att.question.operatorSymbol} {att.question.num2} = {att.question.correctAnswer}
                      </span>
                      {att.question.methodTip && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded hidden sm:inline truncate">
                          {localizeMethodTip(att.question.methodTip)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Speed Badge */}
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        ⏱️ {att.timeSpentSec}s
                      </span>

                      {/* Result Chip */}
                      {att.isCorrect ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('正确', 'Correct')}</span>
                        </span>
                      ) : att.isTimeout ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('5s超时', 'Timeout')}</span>
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{t(`错填 ${att.userAnswer}`, `Ans: ${att.userAnswer}`)}</span>
                        </span>
                      )}

                      {/* Solution Step Toggle for mistakes */}
                      {isWrong && att.question.explanation && (
                        <button
                          type="button"
                          onClick={() => setExpandedExplanationIdx(isExpanded ? null : idx)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
                        >
                          <span>{isExpanded ? t('收起', 'Hide') : t('解析', 'Steps')}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Explanation Box */}
                  {isWrong && isExpanded && att.question.explanation && (
                    <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-slate-700 leading-relaxed animate-fade-in">
                      <div className="font-bold text-amber-900 mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>{t('口算思路拆解：', 'Calculation Steps:')}</span>
                      </div>
                      <p>{att.question.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. 闭环链路非常完善 (Complete Action Loop) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          {/* Primary Action Button: 专项攻克本轮错题 */}
          {mistakesInSession.length > 0 ? (
            <button
              type="button"
              onClick={() => onRetakeMistakes(mistakesInSession)}
              className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>
                {t(
                  `闭环攻克：立即重练本轮 ${mistakesInSession.length} 道错题`,
                  `Close the Loop: Retry ${mistakesInSession.length} Mistake${mistakesInSession.length === 1 ? '' : 's'} from This Round`
                )}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlayAgain}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('太棒啦！全对开启新一轮口算挑战 🚀', 'Awesome! Start a New Round 🚀')}</span>
            </button>
          )}

          {/* Secondary Action Bar (4 Balanced Actions) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={onViewMistakeBook}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="truncate">{t('智能错题本', 'Mistake Book')}</span>
            </button>

            <button
              type="button"
              onClick={() => onPrintWorksheet(result.attempts.map(a => a.question))}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="truncate">{t('打印练习纸', 'Print Worksheet')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMobileSync}
              className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">{t('同步至家长手机', 'Sync to Phone')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWeChat}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedWeChat ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{copiedWeChat ? t('已复制战报！', 'Copied!') : t('复制含AI战报', 'Copy AI Report')}</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t('返回口算训练首页', 'Back to Main Arena')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
