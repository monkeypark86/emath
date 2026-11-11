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
  X
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
      studentName: formName.trim() || '宝贝',
      dailyTargetCount: Number(formDailyTarget) || 20,
      targetAccuracyRate: Number(formTargetAcc) || 90,
      rewardGoalTitle: formRewardGoal.trim() || '游乐园门票',
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              家长学情监控看板
            </h1>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              {settings.studentName} 同学专属报告
            </span>
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="text-xs font-semibold text-amber-700 bg-amber-100/70 hover:bg-amber-200/80 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3 h-3 text-amber-700" />
                <span>切换学生</span>
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            实时汇总每日口算打卡量、准确率曲线、5秒限时作答均速及薄弱知识点诊断。
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditingSettings(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>设定目标与奖励</span>
          </button>

          <button
            type="button"
            onClick={onPrintReport}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>打印学情周报</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* Today's Target Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>今日练习量</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-1">
            {todayQuestions} <span className="text-sm font-normal text-slate-400">/ {settings.dailyTargetCount} 题</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((todayQuestions / settings.dailyTargetCount) * 100))}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
            <span>今日准确率: {todayAcc}%</span>
            <span>{todayQuestions >= settings.dailyTargetCount ? '✅ 已达标' : '加油冲刺'}</span>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>总体准确率</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-1">
            {overallAcc}%
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            累计答对 {totalCorrect} / 共 {totalSolved} 题
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            目标目标: ≥{settings.targetAccuracyRate}%
          </div>
        </div>

        {/* Average Speed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>5秒限时平均速度</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 mt-1">
            {overallAvgSpeed}s
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            单题倒计时上限: 5.0 秒
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            反应速度评级: 极度敏捷
          </div>
        </div>

        {/* Star Bank Reward */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
            <span>家庭心愿奖励库</span>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-900 mt-1">
            {settings.currentStars} <span className="text-sm font-normal text-amber-700">/ {settings.rewardGoalStarsNeeded} 星</span>
          </div>
          <div className="mt-2 w-full bg-amber-100 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all"
              style={{ width: `${rewardProgress}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1.5 truncate">
            心愿: {settings.rewardGoalTitle}
          </div>
        </div>
      </div>

      {/* Main Analysis Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-Day Trend Activity Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">近7天练习趋势与速度变化</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">柱高代表每日题量，折线代表单题平均耗时</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              近一周累计: {dailyStats.reduce((acc, d) => acc + d.questionCount, 0)} 题
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
                      {day.questionCount}题 · {day.accuracyRate}% · {day.avgSpeedSec}s
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

            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                <span>达到每日目标 (≥{settings.dailyTargetCount}题)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-300 inline-block"></span>
                <span>已练习未达标</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Weak Point Diagnostic (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>薄弱知识点智能诊断</span>
              </h2>
              <button
                type="button"
                onClick={onViewMistakes}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                查看错题集 ({mistakes.length})
              </button>
            </div>

            <div className="space-y-3">
              {weaknesses.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900">{item.category}</span>
                    <span className="font-mono text-amber-700">准确率 {item.accuracy}%</span>
                  </div>
                  <p className="text-slate-600">{item.description}</p>
                  <div className="pt-1 text-[11px] text-amber-800 font-medium bg-amber-50/60 p-2 rounded-lg">
                    💡 家长辅导建议：{item.recommendation}
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
              <span>陪孩子立即开启 5 秒专项挑战</span>
            </button>
          </div>
        </div>
      </div>

      {/* Learning Badges & Achievements Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs my-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Medal className="w-5 h-5 text-amber-500" />
                <span>数学达人学习勋章殿堂</span>
              </h2>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                已解锁 {badges.filter(b => b.unlocked).length} / {badges.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              根据打卡天数与答对题量自动解锁成就徽章，家长可为孩子一键打印官方纸质荣誉证书！
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              {[
                { id: 'all', label: '全部勋章' },
                { id: 'days', label: '天数勋章' },
                { id: 'correct', label: '题量勋章' },
                { id: 'special', label: '专项成就' }
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
                <span>打印荣誉证书</span>
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
                progressText = `已坚持 ${badgeStats.distinctDays} / ${badge.targetValue} 天`;
              } else if (badge.requirementType === 'correct') {
                progressPercent = Math.min(100, Math.round((badgeStats.totalCorrect / badge.targetValue) * 100));
                progressText = `已答对 ${badgeStats.totalCorrect} / ${badge.targetValue} 题`;
              } else if (badge.requirementType === 'speed') {
                progressPercent = badge.unlocked ? 100 : badgeStats.bestSpeed > 0 ? 70 : 30;
                progressText = badge.unlocked ? `最快 ${badgeStats.bestSpeed}s 达成` : `当前最快 ${badgeStats.bestSpeed}s (目标 ≤${badge.targetValue}s)`;
              } else if (badge.requirementType === 'mistakes') {
                progressPercent = Math.min(100, Math.round((badgeStats.masteredMistakesCount / badge.targetValue) * 100));
                progressText = `已攻克 ${badgeStats.masteredMistakesCount} / ${badge.targetValue} 题`;
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">{badge.title}</span>
                            {badge.unlocked ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                已解锁
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                                <Lock className="w-2.5 h-2.5" />
                                未解锁
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {badge.rarity === 'diamond' ? '💎 钻石' : badge.rarity === 'gold' ? '👑 黄金' : '🌟 进阶'} · {badge.category === 'days' ? '天数打卡' : badge.category === 'correct' ? '答对题量' : '专项技能'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-3">{badge.description}</p>
                  </div>

                  {/* Bottom Progress & Certificate Print CTA */}
                  <div>
                    <div className="mb-2">
                      <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                        <span>{progressText}</span>
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
                        <span>打印奖励证书</span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-center text-slate-400 mt-2 py-1">
                        还需冲刺即可解锁
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
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>近期口算挑战记录与每题用时明细</span>
              <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                点击任意挑战可查看每道题对错与用时
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">保留历次速算闯关成绩，每题用时与准确率已完整归档</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400">共记录 {sessions.length} 轮次</span>
            {onOpenMobileSync && (
              <button
                type="button"
                onClick={onOpenMobileSync}
                className="py-1 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>同步至手机</span>
              </button>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">暂无测试记录</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-2">
                  <th className="py-2 font-medium">练习时间</th>
                  <th className="py-2 font-medium">挑战模式</th>
                  <th className="py-2 font-medium">题量</th>
                  <th className="py-2 font-medium">正确率</th>
                  <th className="py-2 font-medium">平均速度</th>
                  <th className="py-2 font-medium">错题/超时</th>
                  <th className="py-2 font-medium">获得奖励</th>
                  <th className="py-2 font-medium text-right pr-2">每题明细</th>
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
                        {s.challengeMode || '每日练习'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-800">{s.totalQuestions} 题</td>
                    <td className="py-2.5">
                      <span className={`font-semibold ${s.accuracyRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {s.accuracyRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600">{s.averageTimeSec}s / 题</td>
                    <td className="py-2.5 text-rose-600 font-medium">
                      {s.wrongCount + s.timeoutCount} 题
                    </td>
                    <td className="py-2.5 text-amber-600 font-sans">
                      +{s.starsEarned} 颗星 ⭐
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
                        <span>查看明细</span>
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
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">📊</span>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {selectedSessionForDetail.studentName || settings.studentName} 的挑战答题记录与用时
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedSessionForDetail.challengeMode || '每日练习'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                测试时间：{new Date(selectedSessionForDetail.timestamp).toLocaleString('zh-CN')} · 详细记录每道题的做题准确率、孩子实际填写与精确用时
              </p>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-4 gap-2.5 my-4 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="text-[10px] text-slate-500">做题总数</div>
                <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                  {selectedSessionForDetail.totalQuestions} 题
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                <div className="text-[10px] text-emerald-700 font-medium">准确率</div>
                <div className="text-lg font-mono font-bold text-emerald-600 mt-0.5">
                  {selectedSessionForDetail.accuracyRate}%
                </div>
              </div>
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
                <div className="text-[10px] text-blue-700 font-medium">平均用时</div>
                <div className="text-lg font-mono font-bold text-blue-700 mt-0.5">
                  {selectedSessionForDetail.averageTimeSec}s
                </div>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-2xl">
                <div className="text-[10px] text-amber-700 font-medium">获得奖励</div>
                <div className="text-lg font-mono font-bold text-amber-600 mt-0.5">
                  +{selectedSessionForDetail.starsEarned} ⭐
                </div>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="my-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>每道题答题详情 ({selectedSessionForDetail.attempts.length} 题)</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  对 {selectedSessionForDetail.correctCount} / 错 {selectedSessionForDetail.wrongCount} / 超时 {selectedSessionForDetail.timeoutCount}
                </span>
              </div>

              {selectedSessionForDetail.attempts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  暂未记录该轮具体每题答题流水
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
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>
                              {att.isCorrect ? (
                                <strong className="text-emerald-600 font-normal">孩子作答：{att.userAnswer}</strong>
                              ) : att.isTimeout ? (
                                <strong className="text-amber-700 font-normal">倒计时超时未提交</strong>
                              ) : (
                                <strong className="text-rose-600 font-normal">错填为：{att.userAnswer} (正确答案 {att.question.correctAnswer})</strong>
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
                            {att.timeSpentSec <= 2 ? '⚡ 极速心算' : att.timeSpentSec <= 4 ? '稳健作答' : '稍有迟疑'}
                          </div>
                        </div>

                        <div>
                          {att.isCorrect ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> 正确
                            </span>
                          ) : att.isTimeout ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> 超时
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" /> 算错
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
                    <span>同步到家长手机</span>
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
                    {copiedWeChatId === selectedSessionForDetail.id ? '已复制战报！' : '复制微信播报战报'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSessionForDetail(null)}
                className="w-full sm:w-auto py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isEditingSettings && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">家长设定学习目标与心愿奖励</h2>
            <p className="text-xs text-slate-500 mb-4">
              设置合理的每日目标与正向激励，激发孩子的数学口算自信心。
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">孩子昵称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">每日目标题量</label>
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
                  <label className="block text-slate-700 font-medium mb-1">达标正确率要求 (%)</label>
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
                <label className="block text-slate-700 font-medium mb-1">心愿奖励名称</label>
                <input
                  type="text"
                  placeholder="如：去游乐园 / 挑选一本新绘本"
                  value={formRewardGoal}
                  onChange={e => setFormRewardGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">兑换心愿所需小星星数</label>
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
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors font-bold shadow-xs"
                >
                  保存设置
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
