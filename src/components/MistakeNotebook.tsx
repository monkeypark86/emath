import React, { useState, useEffect } from 'react';
import { MistakeItem, MathQuestion, OperationType } from '../types/math';
import {
  getMistakes,
  saveMistakes,
  markMistakeMastered,
  removeMistake
} from '../utils/storage';
import { sound } from '../utils/soundEffects';
import { useLang } from '../i18n';
import {
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Trash2,
  Printer,
  Share2,
  Search,
  Filter,
  Flame,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MistakeNotebookProps {
  onPracticeMistakes: (questions: MathQuestion[]) => void;
  onOpenMobileSync: () => void;
  onPrintWorksheet: (questions: MathQuestion[]) => void;
  onBackToPractice?: () => void;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  onPracticeMistakes,
  onOpenMobileSync,
  onPrintWorksheet,
  onBackToPractice
}) => {
  const { t } = useLang();
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unmastered' | 'mastered' | 'frequent'>('unmastered');
  const [filterOp, setFilterOp] = useState<'all' | OperationType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Single Question Quick Quiz in-place
  const [quizzingId, setQuizzingId] = useState<string | null>(null);
  const [quizInput, setQuizInput] = useState<string>('');
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);

  const loadMistakes = () => {
    setMistakes(getMistakes());
  };

  useEffect(() => {
    loadMistakes();
  }, []);

  const handleToggleMastered = (id: string, current: boolean) => {
    markMistakeMastered(id, !current);
    loadMistakes();
  };

  const handleDelete = (id: string) => {
    removeMistake(id);
    loadMistakes();
  };

  // Filter items
  const filtered = mistakes.filter(item => {
    if (filterStatus === 'unmastered' && item.mastered) return false;
    if (filterStatus === 'mastered' && !item.mastered) return false;
    if (filterStatus === 'frequent' && item.wrongCount < 2) return false;

    if (filterOp !== 'all' && item.question.operator !== filterOp) return false;

    if (searchQuery.trim()) {
      const qText = `${item.question.num1}${item.question.operatorSymbol}${item.question.num2}=${item.question.correctAnswer}`;
      if (!qText.includes(searchQuery.trim())) return false;
    }

    return true;
  });

  // Start dedicated round with filtered unmastered mistakes
  const handleStartMistakesChallenge = () => {
    const unmastered = filtered.filter(m => !m.mastered).map(m => m.question);
    if (unmastered.length === 0) {
      alert(t('当前筛选分类下没有未掌握的错题，太棒了！', 'No unmastered mistakes in this filter. Great job!'));
      return;
    }
    onPracticeMistakes(unmastered);
  };

  // Quick single retake submit
  const handleSingleQuizSubmit = (item: MistakeItem) => {
    const num = parseInt(quizInput, 10);
    if (isNaN(num)) return;

    if (num === item.question.correctAnswer) {
      sound.playCorrect();
      setQuizFeedback('correct');
      // Mark as mastered
      markMistakeMastered(item.id, true);
      setTimeout(() => {
        setQuizzingId(null);
        setQuizInput('');
        setQuizFeedback(null);
        loadMistakes();
      }, 1000);
    } else {
      sound.playWrong();
      setQuizFeedback('wrong');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4">
      {onBackToPractice && (
        <button
          type="button"
          onClick={onBackToPractice}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
        >
          <span>{t('← 返回口算训练首页', '← Back to Practice')}</span>
        </button>
      )}
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              {t('智能错题集与突破本', 'Smart Mistake Notebook')}
            </h1>
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              {t(`共 ${mistakes.length} 题`, `${mistakes.length} total`)}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('5秒挑战中做错或超时的题目均已自动汇入，提供口诀解析、单题重练及移动端扫码随身练。', 'Wrong or timed-out questions from the 5-second challenge are collected here automatically, with tips, single-question retries and mobile practice via QR code.')}
          </p>
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileSync}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('同步至手机', 'Sync to Phone')}</span>
          </button>

          <button
            type="button"
            onClick={() => onPrintWorksheet(filtered.map(m => m.question))}
            disabled={filtered.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('打印错题练习纸', 'Print Worksheet')}</span>
          </button>

          <button
            type="button"
            onClick={handleStartMistakesChallenge}
            disabled={filtered.filter(m => !m.mastered).length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('错题专项闯关', 'Mistake Challenge')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 my-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
          {[
            { id: 'unmastered', label: t('待攻克', 'To Fix') },
            { id: 'frequent', label: t('高频易错', 'Frequent') },
            { id: 'mastered', label: t('已掌握', 'Mastered') },
            { id: 'all', label: t('全部', 'All') }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id as any)}
              className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterStatus === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Operation Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', sym: t('全部', 'All') },
            { id: 'add', sym: '+' },
            { id: 'subtract', sym: '-' },
            { id: 'multiply', sym: '×' },
            { id: 'divide', sym: '÷' }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterOp(item.id as any)}
              className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                filterOp === item.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {item.sym}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-48">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t('搜索数字或算式...', 'Search numbers...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Mistake Items List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900">{t('太棒了！暂无对应错题', 'Great! No mistakes here')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {t('当前分类下没有需要练习的题目。继续参加 5 秒口算挑战，系统会自动捕获薄弱考点。', 'Nothing to practice in this category. Keep taking the 5-second challenge and weak spots will be captured automatically.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const isExpanded = expandedId === item.id;
            const isQuizzing = quizzingId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl transition-all shadow-xs ${
                  item.mastered
                    ? 'border-slate-200/80 opacity-80'
                    : item.wrongCount >= 2
                    ? 'border-rose-200 ring-1 ring-rose-200/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Main Card Header Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Operation Icon Badge */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-lg text-slate-800 shrink-0">
                      {item.question.operatorSymbol}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xl sm:text-2xl text-slate-900">
                          {item.question.num1} {item.question.operatorSymbol} {item.question.num2} = ?
                        </span>

                        {item.wrongCount >= 2 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            <Flame className="w-3 h-3 fill-rose-500" />
                            {t(`${item.wrongCount}次做错`, `Wrong ${item.wrongCount}×`)}
                          </span>
                        )}

                        {item.mastered && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                            {t('已攻克', 'Mastered')}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>{item.question.difficultyGrade}</span>
                        <span>·</span>
                        <span>{item.question.methodTip}</span>
                        <span>·</span>
                        <span className="text-slate-400">
                          {t('上次答题', 'Last answer')}: {item.isTimeout ? t('5秒超时未答', 'Timed out (5s)') : t(`填了 ${item.wrongAnswer}`, `${item.wrongAnswer}`)} ({item.timeSpentSec}s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setQuizzingId(isQuizzing ? null : item.id);
                        setQuizInput('');
                        setQuizFeedback(null);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors"
                    >
                      {isQuizzing ? t('收起重做', 'Close Retry') : t('单题重练', 'Retry')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleMastered(item.id, item.mastered)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        item.mastered
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100'
                      }`}
                    >
                      {item.mastered ? t('标记未掌握', 'Mark Unmastered') : t('标记已掌握', 'Mark Mastered')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title={t('查看解题思路', 'View solution')}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title={t('移出租本', 'Remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* In-Place Single Quiz Input */}
                {isQuizzing && (
                  <div className="px-4 py-3 bg-amber-50/70 border-t border-amber-100 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-amber-900 font-medium">
                      <span>{t('即刻重练：', 'Retry now:')}</span>
                      <span className="font-mono font-bold text-sm">
                        {item.question.num1} {item.question.operatorSymbol} {item.question.num2} =
                      </span>
                      <input
                        type="number"
                        autoFocus
                        placeholder={t('输入答案', 'Answer')}
                        value={quizInput}
                        onChange={e => setQuizInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSingleQuizSubmit(item)}
                        className="w-24 px-2.5 py-1 text-sm font-mono font-bold bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleSingleQuizSubmit(item)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors"
                      >
                        {t('提交验证', 'Submit')}
                      </button>
                    </div>

                    {quizFeedback === 'correct' && (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> {t('答对啦！已自动标记为“已掌握”！', 'Correct! Marked as mastered!')}
                      </div>
                    )}
                    {quizFeedback === 'wrong' && (
                      <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <XCircle className="w-4 h-4 shrink-0" /> {t('不对哦，正确答案是', 'Not quite, the answer is')} {item.question.correctAnswer}
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded Pedagogical Explanation */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl text-xs space-y-2">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('规范解法与口诀引导：', 'Solution & tips:')}</span>
                    </div>
                    <div className="text-slate-600 leading-relaxed pl-5">
                      {item.question.explanation}
                    </div>
                    <div className="pl-5 text-[11px] text-slate-400">
                      {t('正确答案：', 'Answer: ')}<span className="font-mono font-bold text-emerald-600">{item.question.correctAnswer}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
