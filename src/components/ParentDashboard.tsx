import React, { useState, useEffect } from 'react';
import {
  ParentSettings,
  PracticeSessionResult,
  MistakeItem,
  DailyActivityStat,
  WeakPointAnalysis,
  BadgeItem
} from '../types/math';
import {
  getParentSettings,
  saveParentSettings,
  getPracticeSessions,
  getMistakes,
  getDailyActivityStats,
  getWeakPointAnalysis,
  seedSampleDataIfEmpty,
  generateWeChatReport,
  getActiveStudent
} from '../utils/storage';
import { evaluateBadges, calculateBadgeStats } from '../utils/badgeSystem';
import { PrintCertificateModal } from './PrintCertificateModal';
import { useLang } from '../i18n';
import { generateAiDiagnosis } from '../utils/aiDiagnosis';
import {
  Users,
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Settings,
  FileText,
  RotateCcw,
  Zap,
  Printer,
  Medal,
  Check,
  Lock,
  Eye,
  Smartphone,
  Copy,
  XCircle,
  ChevronRight,
  X,
  Brain,
  Lightbulb
} from 'lucide-react';

interface ParentDashboardProps {
  onStartPractice: () => void;
  onViewMistakes: () => void;
  onPrintReport: () => void;
  onOpenProfileModal?: () => void;
  onStudentUpdated?: () => void;
  onOpenMobileSync?: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onStartPractice,
  onViewMistakes,
  onPrintReport,
  onOpenProfileModal,
  onStudentUpdated,
  onOpenMobileSync
}) => {
  const { t, lang } = useLang();
  const [settings, setSettings] = useState<ParentSettings>(getParentSettings());
  const [sessions, setSessions] = useState<PracticeSessionResult[]>([]);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyActivityStat[]>([]);
  const [weaknesses, setWeaknesses] = useState<WeakPointAnalysis[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'days' | 'correct' | 'special'>('all');
  const [selectedBadgeForCert, setSelectedBadgeForCert] = useState<BadgeItem | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);
  const [isEditingSettings, setIsEditingSettings] = useState<boolean>(false);
  const [selectedSessionForDetail, setSelectedSessionForDetail] = useState<PracticeSessionResult | null>(null);
  const [copiedWeChatId, setCopiedWeChatId] = useState<string | null>(null);

  const handleCopySessionWeChat = (session: PracticeSessionResult) => {
    const text = generateWeChatReport(session, session.studentName || settings.studentName);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedWeChatId(session.id);
      setTimeout(() => setCopiedWeChatId(null), 2500);
    });
  };

  // Form State for editing
  const [formName, setFormName] = useState<string>(settings.studentName);
  const [formDailyTarget, setFormDailyTarget] = useState<number>(settings.dailyTargetCount);
  const [formTargetAcc, setFormTargetAcc] = useState<number>(settings.targetAccuracyRate);
  const [formRewardGoal, setFormRewardGoal] = useState<string>(settings.rewardGoalTitle);
  const [formRewardStars, setFormRewardStars] = useState<number>(settings.rewardGoalStarsNeeded);

  const reloadData = () => {
    seedSampleDataIfEmpty();
    const currSettings = getParentSettings();
    setSettings(currSettings);
    const currSessions = getPracticeSessions();
    setSessions(currSessions);
    const currMistakes = getMistakes();
    setMistakes(currMistakes);
    setDailyStats(getDailyActivityStats(currSessions, 7));
    setWeaknesses(getWeakPointAnalysis(currMistakes, currSessions));
    setBadges(evaluateBadges(currSessions, currMistakes));
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ParentSettings = {
      ...settings,
      studentName: formName.trim() || t('宝贝', 'Kiddo'),
      dailyTargetCount: Number(formDailyTarget) || 20,
      targetAccuracyRate: Number(formTargetAcc) || 90,
      rewardGoalTitle: formRewardGoal.trim() || t('游乐园门票', 'Theme park tickets'),
      rewardGoalStarsNeeded: Number(formRewardStars) || 50
    };
    saveParentSettings(updated);
    setSettings(updated);
    setIsEditingSettings(false);
    onStudentUpdated?.();
  };

  // Today's summary
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.dateStr === todayStr);
  const todayQuestions = todaySessions.reduce((acc, s) => acc + s.totalQuestions, 0);
  const todayCorrect = todaySessions.reduce((acc, s) => acc + s.correctCount, 0);
  const todayAcc = todayQuestions > 0 ? Math.round((todayCorrect / todayQuestions) * 100) : 0;

  // Total summary
  const totalSolved = sessions.reduce((acc, s) => acc + s.totalQuestions, 0);
  const totalCorrect = sessions.reduce((acc, s) => acc + s.correctCount, 0);
  const overallAcc = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
  const overallAvgSpeed = sessions.length > 0
    ? Number((sessions.reduce((acc, s) => acc + s.averageTimeSec, 0) / sessions.length).toFixed(1))
    : 3.2;

  const rewardProgress = Math.min(100, Math.round((settings.currentStars / settings.rewardGoalStarsNeeded) * 100));

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              {t('家长学情监控看板', 'Parent Dashboard')}
            </h1>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              {t(`${settings.studentName} 同学专属报告`, `${settings.studentName}'s Report`)}
            </span>
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="text-xs font-semibold text-amber-700 bg-amber-100/70 hover:bg-amber-200/80 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3 h-3 text-amber-700" />
                <span>{t('切换学生', 'Switch')}</span>
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('实时汇总每日口算打卡量、准确率曲线、5秒限时作答均速及薄弱知识点诊断。', 'Live summary of daily practice, accuracy trends, average speed in 5-second rounds and weak-spot diagnosis.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditingSettings(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('设定目标与奖励', 'Goals & Rewards')}</span>
          </button>

          <button
            type="button"
            onClick={onPrintReport}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('打印学情周报', 'Print Weekly Report')}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* Today's Target Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">{t('今日练习量', "Today's Practice")}</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-1">
            {todayQuestions} <span className="text-sm font-normal text-slate-400">/ {settings.dailyTargetCount}{t(' 题', '')}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((todayQuestions / settings.dailyTargetCount) * 100))}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between gap-1">
            <span className="truncate">{t('今日准确率', 'Acc')}: {todayAcc}%</span>
            <span className="shrink-0">{todayQuestions >= settings.dailyTargetCount ? t('✅ 已达标', '✅ Met') : t('加油冲刺', 'Keep going')}</span>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">{t('总体准确率', 'Overall Accuracy')}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-1">
            {overallAcc}%
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {t(`累计答对 ${totalCorrect} / 共 ${totalSolved} 题`, `${totalCorrect} / ${totalSolved} correct`)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {t('目标目标', 'Target')}: ≥{settings.targetAccuracyRate}%
          </div>
        </div>

        {/* Average Speed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">{t('5秒限时平均速度', 'Avg Speed (5s)')}</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-1">
            {overallAvgSpeed}s
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {t('单题倒计时上限: 5.0 秒', 'Time limit: 5.0s / Q')}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            {t('反应速度评级: 极度敏捷', 'Rating: Lightning fast')}
          </div>
        </div>

        {/* Star Bank Reward */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
            <span className="truncate">{t('家庭心愿奖励库', 'Wish Rewards')}</span>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-900 mt-1">
            {settings.currentStars} <span className="text-sm font-normal text-amber-700">/ {settings.rewardGoalStarsNeeded} {t('星', '★')}</span>
          </div>
          <div className="mt-2 w-full bg-amber-100 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all"
              style={{ width: `${rewardProgress}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1.5 truncate">
            {t('心愿', 'Wish')}: {settings.rewardGoalTitle}
          </div>
        </div>
      </div>

      {/* Main Analysis Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-Day Trend Activity Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">{t('近7天练习趋势与速度变化', '7-Day Practice & Speed Trend')}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('柱高代表每日题量，折线代表单题平均耗时', 'Bar height = daily questions; tooltip shows avg time per question')}</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 shrink-0">
              {t(`近一周累计: ${dailyStats.reduce((acc, d) => acc + d.questionCount, 0)} 题`, `Week: ${dailyStats.reduce((acc, d) => acc + d.questionCount, 0)} Qs`)}
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {dailyStats.map((day, idx) => {
                const maxQ = Math.max(...dailyStats.map(d => d.questionCount), 25);
                const heightPercent = Math.max(12, Math.round((day.questionCount / maxQ) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded mb-1 whitespace-nowrap">
                      {t(`${day.questionCount}题`, `${day.questionCount} Qs`)} · {day.accuracyRate}% · {day.avgSpeedSec}s
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                        day.questionCount >= settings.dailyTargetCount
                          ? 'bg-amber-500 group-hover:bg-amber-600'
                          : day.questionCount > 0
                          ? 'bg-slate-300 group-hover:bg-slate-400'
                          : 'bg-slate-100'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>

                    <div className="mt-2 text-[11px] font-mono text-slate-500">
                      {day.date}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                <span>{t(`达到每日目标 (≥${settings.dailyTargetCount}题)`, `Goal met (≥${settings.dailyTargetCount} Qs)`)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-300 inline-block"></span>
                <span>{t('已练习未达标', 'Below goal')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Weak Point Diagnostic (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{t('薄弱知识点智能诊断', 'Weak Spot Diagnosis')}</span>
              </h2>
              <button
                type="button"
                onClick={onViewMistakes}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 shrink-0"
              >
                {t('查看错题集', 'Mistakes')} ({mistakes.length})
              </button>
            </div>

            <div className="space-y-3">
              {weaknesses.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 font-semibold">
                    <span className="text-slate-900 min-w-0">{item.category}</span>
                    <span className="font-mono text-amber-700 shrink-0">{t('准确率', 'Acc')} {item.accuracy}%</span>
                  </div>
                  <p className="text-slate-600">{item.description}</p>
                  <div className="pt-1 text-[11px] text-amber-800 font-medium bg-amber-50/60 p-2 rounded-lg">
                    💡 {t('家长辅导建议：', 'Tip for parents: ')}{item.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onStartPractice}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{t('陪孩子立即开启 5 秒专项挑战', 'Start a 5-Second Challenge Together')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Learning Badges & Achievements Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs my-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Medal className="w-5 h-5 text-amber-500" />
                <span>{t('数学达人学习勋章殿堂', 'Math Badge Hall')}</span>
              </h2>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {t('已解锁', 'Unlocked')} {badges.filter(b => b.unlocked).length} / {badges.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('根据打卡天数与答对题量自动解锁成就徽章，家长可为孩子一键打印官方纸质荣誉证书！', 'Badges unlock automatically based on practice days and correct answers. Print a certificate for your child in one click!')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              {[
                { id: 'all', label: t('全部勋章', 'All') },
                { id: 'days', label: t('天数勋章', 'Days') },
                { id: 'correct', label: t('题量勋章', 'Solved') },
                { id: 'special', label: t('专项成就', 'Special') }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBadgeFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    badgeFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {badges.some(b => b.unlocked) && (
              <button
                type="button"
                onClick={() => {
                  const unlockedList = badges.filter(b => b.unlocked);
                  setSelectedBadgeForCert(unlockedList[0] || null);
                  setIsCertModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors shrink-0 flex items-center gap-1"
              >
                <Award className="w-4 h-4" />
                <span>{t('打印荣誉证书', 'Print Certificate')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
          {badges
            .filter(b => badgeFilter === 'all' || b.category === badgeFilter)
            .map(badge => {
              const badgeStats = calculateBadgeStats(sessions, mistakes);
              let progressPercent = 0;
              let progressText = '';

              if (badge.requirementType === 'days') {
                progressPercent = Math.min(100, Math.round((badgeStats.distinctDays / badge.targetValue) * 100));
                progressText = t(`已坚持 ${badgeStats.distinctDays} / ${badge.targetValue} 天`, `${badgeStats.distinctDays} / ${badge.targetValue} days`);
              } else if (badge.requirementType === 'correct') {
                progressPercent = Math.min(100, Math.round((badgeStats.totalCorrect / badge.targetValue) * 100));
                progressText = t(`已答对 ${badgeStats.totalCorrect} / ${badge.targetValue} 题`, `${badgeStats.totalCorrect} / ${badge.targetValue} correct`);
              } else if (badge.requirementType === 'speed') {
                progressPercent = badge.unlocked ? 100 : badgeStats.bestSpeed > 0 ? 70 : 30;
                progressText = badge.unlocked ? t(`最快 ${badgeStats.bestSpeed}s 达成`, `Best ${badgeStats.bestSpeed}s`) : t(`当前最快 ${badgeStats.bestSpeed}s (目标 ≤${badge.targetValue}s)`, `Best ${badgeStats.bestSpeed}s (goal ≤${badge.targetValue}s)`);
              } else if (badge.requirementType === 'mistakes') {
                progressPercent = Math.min(100, Math.round((badgeStats.masteredMistakesCount / badge.targetValue) * 100));
                progressText = t(`已攻克 ${badgeStats.masteredMistakesCount} / ${badge.targetValue} 题`, `${badgeStats.masteredMistakesCount} / ${badge.targetValue} fixed`);
              }

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 border-amber-300 shadow-xs ring-1 ring-amber-300/30'
                      : 'bg-slate-50/60 border-slate-200/80 opacity-75'
                  }`}
                >
                  <div>
                    {/* Badge Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0 ${
                            badge.unlocked
                              ? 'bg-amber-500 text-white shadow-amber-500/20'
                              : 'bg-slate-200 text-slate-400 grayscale'
                          }`}
                        >
                          {badge.iconEmoji}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">{badge.title}</span>
                            {badge.unlocked ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                {t('已解锁', 'Unlocked')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                                <Lock className="w-2.5 h-2.5" />
                                {t('未解锁', 'Locked')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {badge.rarity === 'diamond' ? t('💎 钻石', '💎 Diamond') : badge.rarity === 'gold' ? t('👑 黄金', '👑 Gold') : t('🌟 进阶', '🌟 Rising')} · {badge.category === 'days' ? t('天数打卡', 'Days') : badge.category === 'correct' ? t('答对题量', 'Correct') : t('专项技能', 'Skill')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-3">{badge.description}</p>
                  </div>

                  {/* Bottom Progress & Certificate Print CTA */}
                  <div>
                    <div className="mb-2">
                      <div className="flex justify-between gap-2 text-[11px] font-mono text-slate-500 mb-1">
                        <span className="min-w-0 truncate">{progressText}</span>
                        <span className="font-semibold">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            badge.unlocked ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {badge.unlocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBadgeForCert(badge);
                          setIsCertModalOpen(true);
                        }}
                        className="w-full mt-2 py-1.5 px-3 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{t('打印奖励证书', 'Print Certificate')}</span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-center text-slate-400 mt-2 py-1">
                        {t('还需冲刺即可解锁', 'Keep going to unlock')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs my-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <span>{t('近期口算挑战记录与每题用时明细', 'Recent Challenges & Per-Question Times')}</span>
              <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                {t('点击任意挑战可查看每道题对错与用时', 'Click a round for per-question details')}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">{t('保留历次速算闯关成绩，每题用时与准确率已完整归档', 'All past rounds are saved with per-question time and accuracy')}</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400">{t(`共记录 ${sessions.length} 轮次`, `${sessions.length} rounds`)}</span>
            {onOpenMobileSync && (
              <button
                type="button"
                onClick={onOpenMobileSync}
                className="py-1 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t('同步至手机', 'Sync to Phone')}</span>
              </button>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">{t('暂无测试记录', 'No records yet')}</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-2">
                  <th className="py-2 font-medium">{t('练习时间', 'Time')}</th>
                  <th className="py-2 font-medium">{t('挑战模式', 'Mode')}</th>
                  <th className="py-2 font-medium">{t('题量', 'Qs')}</th>
                  <th className="py-2 font-medium">{t('正确率', 'Accuracy')}</th>
                  <th className="py-2 font-medium">{t('平均速度', 'Avg Speed')}</th>
                  <th className="py-2 font-medium">{t('错题/超时', 'Wrong/Late')}</th>
                  <th className="py-2 font-medium">{t('获得奖励', 'Reward')}</th>
                  <th className="py-2 font-medium text-right pr-2">{t('每题明细', 'Details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sessions.slice(0, 10).map(s => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSessionForDetail(s)}
                    className="hover:bg-amber-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 text-slate-600 font-sans">
                      {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 font-sans">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {s.challengeMode || t('每日练习', 'Daily Practice')}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-800">{s.totalQuestions}{t(' 题', '')}</td>
                    <td className="py-2.5">
                      <span className={`font-semibold ${s.accuracyRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {s.accuracyRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600">{s.averageTimeSec}s{t(' / 题', '')}</td>
                    <td className="py-2.5 text-rose-600 font-medium">
                      {s.wrongCount + s.timeoutCount}{t(' 题', '')}
                    </td>
                    <td className="py-2.5 text-amber-600 font-sans">
                      +{s.starsEarned}{t(' 颗星', '')} ⭐
                    </td>
                    <td className="py-2.5 text-right pr-2 font-sans">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSessionForDetail(s);
                        }}
                        className="py-1 px-2.5 rounded-lg bg-slate-100 group-hover:bg-amber-500 group-hover:text-white text-slate-700 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{t('查看明细', 'View')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Challenge Question-by-Question Detail Modal */}
      {selectedSessionForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative my-6">
            <button
              type="button"
              onClick={() => setSelectedSessionForDetail(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2 mb-1.5 pr-8">
                <span className="text-xl">📊</span>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {t(`${selectedSessionForDetail.studentName || settings.studentName} 的挑战答题记录与用时`, `${selectedSessionForDetail.studentName || settings.studentName}'s Challenge Details`)}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedSessionForDetail.challengeMode || t('每日练习', 'Daily Practice')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t('测试时间：', 'Time: ')}{new Date(selectedSessionForDetail.timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN')} · {t('详细记录每道题的做题准确率、孩子实际填写与精确用时', 'Each question with result, child\'s answer and exact time')}
              </p>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-4 gap-2.5 my-4 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="text-[10px] text-slate-500">{t('做题总数', 'Total')}</div>
                <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                  {selectedSessionForDetail.totalQuestions}{t(' 题', '')}
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                <div className="text-[10px] text-emerald-700 font-medium">{t('准确率', 'Accuracy')}</div>
                <div className="text-lg font-mono font-bold text-emerald-600 mt-0.5">
                  {selectedSessionForDetail.accuracyRate}%
                </div>
              </div>
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
                <div className="text-[10px] text-blue-700 font-medium">{t('平均用时', 'Avg Time')}</div>
                <div className="text-lg font-mono font-bold text-blue-700 mt-0.5">
                  {selectedSessionForDetail.averageTimeSec}s
                </div>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-2xl">
                <div className="text-[10px] text-amber-700 font-medium">{t('获得奖励', 'Stars')}</div>
                <div className="text-lg font-mono font-bold text-amber-600 mt-0.5">
                  +{selectedSessionForDetail.starsEarned} ⭐
                </div>
              </div>
            </div>

            {/* AI Diagnosis Summary Card in Parent Detail Modal */}
            {(() => {
              const sessionAi = generateAiDiagnosis(selectedSessionForDetail);
              return (
                <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-amber-50/40 to-emerald-50/40 border border-indigo-200/70 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Brain className="w-4 h-4 text-indigo-600" />
                      <span>{t('AI 智能学情诊断总结', 'AI Learning Insights')}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded">
                      {t('心算流畅度', 'Fluency')} {sessionAi.fluencyScore}/100
                    </span>
                  </div>
                  <div className="mt-2 text-slate-800 font-semibold flex items-start gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{sessionAi.headline}</span>
                  </div>
                  <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">
                    {sessionAi.summary}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-indigo-100/60 text-[11px]">
                    <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                      <div className="font-bold text-emerald-800 mb-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{t('核心闪光点', 'Key Strengths')}</span>
                      </div>
                      <div className="text-slate-600">{sessionAi.strengths[0]}</div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                      <div className="font-bold text-indigo-800 mb-0.5 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-indigo-600" />
                        <span>{t('专属突破建议', 'Action Plan')}</span>
                      </div>
                      <div className="text-slate-600">{sessionAi.recommendations[0]}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Question Breakdown List */}
            <div className="my-4">
              <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs font-semibold text-slate-700 mb-2">
                <span>{t(`每道题答题详情 (${selectedSessionForDetail.attempts.length} 题)`, `Question Details (${selectedSessionForDetail.attempts.length})`)}</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {t('对', 'Correct')} {selectedSessionForDetail.correctCount} / {t('错', 'Wrong')} {selectedSessionForDetail.wrongCount} / {t('超时', 'Timeout')} {selectedSessionForDetail.timeoutCount}
                </span>
              </div>

              {selectedSessionForDetail.attempts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  {t('暂未记录该轮具体每题答题流水', 'No per-question log for this round')}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {selectedSessionForDetail.attempts.map((att, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                        att.isCorrect
                          ? 'bg-slate-50/60 border-slate-200'
                          : att.isTimeout
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-rose-50/70 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900">
                            {att.question.num1} {att.question.operatorSymbol} {att.question.num2} = {att.question.correctAnswer}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>
                              {att.isCorrect ? (
                                <strong className="text-emerald-600 font-normal">{t('孩子作答：', 'Answered: ')}{att.userAnswer}</strong>
                              ) : att.isTimeout ? (
                                <strong className="text-amber-700 font-normal">{t('倒计时超时未提交', 'Timed out')}</strong>
                              ) : (
                                <strong className="text-rose-600 font-normal">{t('错填为：', 'Wrong: ')}{att.userAnswer} ({t('正确答案', 'answer')} {att.question.correctAnswer})</strong>
                              )}
                            </span>
                            {att.question.methodTip && (
                              <span className="text-slate-400 bg-white/80 px-1.5 py-0.2 rounded border border-slate-200/50">
                                {att.question.methodTip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <div className="text-right">
                          <div className="font-semibold text-slate-700">
                            ⏱️ {att.timeSpentSec}s
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {att.timeSpentSec <= 2 ? t('⚡ 极速心算', '⚡ Super fast') : att.timeSpentSec <= 4 ? t('稳健作答', 'Steady') : t('稍有迟疑', 'Hesitant')}
                          </div>
                        </div>

                        <div>
                          {att.isCorrect ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> {t('正确', 'Right')}
                            </span>
                          ) : att.isTimeout ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> {t('超时', 'Late')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" /> {t('算错', 'Wrong')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer action buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onOpenMobileSync && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSessionForDetail(null);
                      onOpenMobileSync();
                    }}
                    className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{t('同步到家长手机', 'Sync to Phone')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleCopySessionWeChat(selectedSessionForDetail)}
                  className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedWeChatId === selectedSessionForDetail.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedWeChatId === selectedSessionForDetail.id ? t('已复制战报！', 'Copied!') : t('复制微信播报战报', 'Copy WeChat Report')}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSessionForDetail(null)}
                className="w-full sm:w-auto py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
              >
                {t('关闭', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isEditingSettings && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-xl max-h-full overflow-y-auto">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">{t('家长设定学习目标与心愿奖励', 'Set Goals & Wish Rewards')}</h2>
            <p className="text-xs text-slate-500 mb-4">
              {t('设置合理的每日目标与正向激励，激发孩子的数学口算自信心。', 'Set realistic daily goals and positive rewards to build your child\'s math confidence.')}
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('孩子昵称', 'Nickname')}</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">{t('每日目标题量', 'Daily Goal (Qs)')}</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={formDailyTarget}
                    onChange={e => setFormDailyTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">{t('达标正确率要求 (%)', 'Target Accuracy (%)')}</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formTargetAcc}
                    onChange={e => setFormTargetAcc(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('心愿奖励名称', 'Wish Reward')}</label>
                <input
                  type="text"
                  placeholder={t('如：去游乐园 / 挑选一本新绘本', 'e.g. Theme park / A new picture book')}
                  value={formRewardGoal}
                  onChange={e => setFormRewardGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('兑换心愿所需小星星数', 'Stars Needed')}</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={formRewardStars}
                  onChange={e => setFormRewardStars(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                >
                  {t('取消', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors font-bold shadow-xs"
                >
                  {t('保存设置', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Honorary Certificate Print Modal */}
      <PrintCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        badge={selectedBadgeForCert}
        allUnlockedBadges={badges.filter(b => b.unlocked)}
        stats={calculateBadgeStats(sessions, mistakes)}
      />
    </div>
  );
};
