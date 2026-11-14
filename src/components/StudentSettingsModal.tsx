import React, { useState, useEffect } from 'react';
import { StudentProfile, StudentPreferences, GradeLevel, OperationType } from '../types/math';
import {
  updateStudentProfile,
  DEFAULT_STUDENT_PREFERENCES,
  formatGradeLabel,
  formatGradeDetail,
  getStudentProfiles
} from '../utils/storage';
import { sound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Settings,
  X,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  Clock,
  Target,
  Award,
  Zap,
  AlignVerticalJustifyCenter,
  Layers,
  Heart,
  Palette,
  ShieldCheck,
  Flame,
  BookOpen,
  User,
  Sliders,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useLang } from '../i18n';

interface StudentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onSave: (updatedStudent: StudentProfile) => void;
}

const AVATAR_OPTIONS = ['🐰', '🦁', '🐼', '🦊', '🐯', '🐻', '🐨', '🚀', '🦄', '🌟', '🐶', '🐱'];

type TFn = (zh: string, en: string) => string;

// 在渲染时解析文案，保证切换语言后即时更新
const getMottoPresets = (t: TFn) => [
  t('每天坚持口算，我是速算小达人！', 'Daily practice makes me a math star!'),
  t('乘除口诀记得牢，立式计算快又准！', 'Know my tables, solve fast and right!'),
  t('凑十破十法，每天进步一点点！', 'Make ten, break ten, better every day!'),
  t('做错不害怕，多练会变强！', 'Mistakes are OK, practice makes strong!'),
  t('细心第一，速度第二！', 'Accuracy first, speed second!'),
  t('挑战自我，向着心愿大奖冲刺！', 'Challenge myself, go for the big reward!')
];

const getThemeOptions = (t: TFn): { id: StudentPreferences['themeColor']; label: string; colorClass: string; bgClass: string; borderClass: string }[] => [
  { id: 'amber', label: t('活力橙', 'Orange'), colorClass: 'text-amber-600', bgClass: 'bg-amber-500', borderClass: 'border-amber-500' },
  { id: 'blue', label: t('天空蓝', 'Blue'), colorClass: 'text-blue-600', bgClass: 'bg-blue-500', borderClass: 'border-blue-500' },
  { id: 'rose', label: t('草莓粉', 'Pink'), colorClass: 'text-rose-600', bgClass: 'bg-rose-500', borderClass: 'border-rose-500' },
  { id: 'emerald', label: t('翡翠绿', 'Green'), colorClass: 'text-emerald-600', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500' },
  { id: 'purple', label: t('星空紫', 'Purple'), colorClass: 'text-purple-600', bgClass: 'bg-purple-500', borderClass: 'border-purple-500' }
];

export const StudentSettingsModal: React.FC<StudentSettingsModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave
}) => {
  const { t } = useLang();
  const MOTTO_PRESETS = getMottoPresets(t);
  const THEME_OPTIONS = getThemeOptions(t);
  const defaultMotto = t('每天坚持口算，我是速算小达人！', 'Daily practice makes me a math star!');
  const defaultRewardTitle = t('心愿大奖', 'Big Reward');
  // 3 大核心分类：口算题目定制 | 视听界面偏好 | 档案激励心愿
  const [activeTab, setActiveTab] = useState<'rules' | 'display' | 'profile'>('rules');

  // Form states initialized with student data
  const [name, setName] = useState<string>(student.name);
  const [avatar, setAvatar] = useState<string>(student.avatar);
  const [grade, setGrade] = useState<GradeLevel>(student.grade);
  const [dailyTargetCount, setDailyTargetCount] = useState<number>(student.dailyTargetCount || 20);
  const [targetAccuracyRate, setTargetAccuracyRate] = useState<number>(student.targetAccuracyRate || 90);
  const [rewardGoalTitle, setRewardGoalTitle] = useState<string>(student.rewardGoalTitle || defaultRewardTitle);
  const [rewardGoalStarsNeeded, setRewardGoalStarsNeeded] = useState<number>(student.rewardGoalStarsNeeded || 50);

  // Preferences
  const studentPrefs = student.preferences || DEFAULT_STUDENT_PREFERENCES;
  const [equationLayout, setEquationLayout] = useState<StudentPreferences['equationLayout']>(studentPrefs.equationLayout || 'vertical');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(studentPrefs.soundEnabled !== false);
  const [celebrationConfetti, setCelebrationConfetti] = useState<boolean>(studentPrefs.celebrationConfetti !== false);
  const [autoSubmitWhenComplete, setAutoSubmitWhenComplete] = useState<boolean>(!!studentPrefs.autoSubmitWhenComplete);
  const [fontSizeScale, setFontSizeScale] = useState<StudentPreferences['fontSizeScale']>(studentPrefs.fontSizeScale || 'normal');
  const [perQuestionSeconds, setPerQuestionSeconds] = useState<number>(studentPrefs.perQuestionSeconds ?? 5);
  const [selectedOps, setSelectedOps] = useState<OperationType[]>(studentPrefs.selectedOps || ['add', 'subtract', 'multiply', 'divide']);
  const [questionCount, setQuestionCount] = useState<number>(studentPrefs.questionCount || 20);
  const [motto, setMotto] = useState<string>(studentPrefs.motto || defaultMotto);
  const [themeColor, setThemeColor] = useState<StudentPreferences['themeColor']>(studentPrefs.themeColor || 'amber');

  // Reset when modal opens with new student
  useEffect(() => {
    if (isOpen) {
      setName(student.name);
      setAvatar(student.avatar);
      setGrade(student.grade);
      setDailyTargetCount(student.dailyTargetCount || 20);
      setTargetAccuracyRate(student.targetAccuracyRate || 90);
      setRewardGoalTitle(student.rewardGoalTitle || defaultRewardTitle);
      setRewardGoalStarsNeeded(student.rewardGoalStarsNeeded || 50);

      const prefs = student.preferences || DEFAULT_STUDENT_PREFERENCES;
      setEquationLayout(prefs.equationLayout || 'vertical');
      setSoundEnabled(prefs.soundEnabled !== false);
      setCelebrationConfetti(prefs.celebrationConfetti !== false);
      setAutoSubmitWhenComplete(!!prefs.autoSubmitWhenComplete);
      setFontSizeScale(prefs.fontSizeScale || 'normal');
      setPerQuestionSeconds(prefs.perQuestionSeconds ?? 5);
      setSelectedOps(prefs.selectedOps || ['add', 'subtract', 'multiply', 'divide']);
      setQuestionCount(prefs.questionCount || 20);
      setMotto(prefs.motto || defaultMotto);
      setThemeColor(prefs.themeColor || 'amber');
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const toggleOp = (op: OperationType) => {
    if (selectedOps.includes(op)) {
      if (selectedOps.length > 1) {
        setSelectedOps(selectedOps.filter(o => o !== op));
      }
    } else {
      setSelectedOps([...selectedOps, op]);
    }
  };

  const handleSelectGrade = (selectedGrade: GradeLevel) => {
    setGrade(selectedGrade);
    // 智能联动推荐运算
    if (selectedGrade === 'grade1') {
      setSelectedOps(['add', 'subtract']);
      if (fontSizeScale === 'normal') setFontSizeScale('large');
    } else if (selectedGrade === 'grade2') {
      setSelectedOps(['add', 'subtract', 'multiply', 'divide']);
    }
  };

  const handleSaveAll = () => {
    const updatedPreferences: StudentPreferences = {
      equationLayout,
      soundEnabled,
      celebrationConfetti,
      autoSubmitWhenComplete,
      fontSizeScale,
      perQuestionSeconds,
      selectedOps,
      questionCount,
      motto: motto.trim() || defaultMotto,
      themeColor
    };

    const updatedStudent: StudentProfile = {
      ...student,
      name: name.trim() || student.name,
      avatar,
      grade,
      dailyTargetCount,
      targetAccuracyRate,
      rewardGoalTitle: rewardGoalTitle.trim() || defaultRewardTitle,
      rewardGoalStarsNeeded,
      preferences: updatedPreferences,
      lastActiveAt: Date.now()
    };

    updateStudentProfile(updatedStudent);
    onSave(updatedStudent);

    // Play feedback
    if (soundEnabled) {
      sound.playCorrect();
    }
    if (celebrationConfetti) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
    }

    onClose();
  };

  const allProfiles = getStudentProfiles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-full sm:max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0">
              {avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold font-display truncate max-w-full">{t(`${name} 的口算专属设置`, `${name}'s Settings`)}</h2>
                <span className="text-[11px] sm:text-xs bg-white/25 px-2 sm:px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                  {formatGradeLabel(grade)}
                </span>
                <span className="hidden xs:inline-block sm:inline-block text-[11px] bg-white/15 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {formatGradeDetail(grade)}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-100 mt-0.5 flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span className="truncate">{t('自定义学段难度、立式竖式格式、答题节奏与激励心愿', 'Customize grade level, equation layout, pace and rewards')}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            title={t('关闭设置', 'Close settings')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 重新规划的三大逻辑 Menu 选项卡 */}
        <div className="grid grid-cols-3 sm:flex border-b border-slate-200/80 bg-slate-50/90 px-2 sm:px-6 gap-1 sm:gap-2 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer min-w-0 ${
              activeTab === 'rules'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate max-w-full sm:whitespace-nowrap">{t('口算模式与规则', 'Practice Rules')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer min-w-0 ${
              activeTab === 'display'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate max-w-full sm:whitespace-nowrap">{t('视听与界面偏好', 'Display')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer min-w-0 ${
              activeTab === 'profile'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate max-w-full sm:whitespace-nowrap">{t('档案与心愿激励', 'Profile')}</span>
          </button>
        </div>

        {/* Tab 内容区 */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5 sm:space-y-6">
          {/* TAB 1: 📘 口算模式与规则 */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* 1. 学段难度选择 */}
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-between flex-wrap gap-1">
                  <span>{t('就读年级与学段难度', 'Grade & Difficulty')}</span>
                  <span className="text-xs text-amber-600 font-semibold">
                    {t('当前选择：', 'Selected: ')}{formatGradeLabel(grade)}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {[
                    { id: 'grade1' as const, label: t('一年级', 'Grade 1'), desc: t('20以内进退位·凑十破十', 'Within 20 · make/break ten') },
                    { id: 'grade2' as const, label: t('二年级', 'Grade 2'), desc: t('100以内加减·表内九九乘除', '± within 100 · times tables') },
                    { id: 'grade3' as const, label: t('三年级', 'Grade 3'), desc: t('多位数乘除·千以内速算', 'Multi-digit ×÷ · within 1000') },
                    { id: 'grade4' as const, label: t('四年级', 'Grade 4'), desc: t('简便巧算·两三位数速算', 'Shortcuts · 2–3 digit math') },
                    { id: 'grade5_6' as const, label: t('五/六年级', 'Grade 5/6'), desc: t('四则混合极限速算', 'Mixed operations') },
                    { id: 'custom' as const, label: t('自定义难度', 'Custom'), desc: t('自选出题范围与规则', 'Choose your own range & rules') }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectGrade(item.id)}
                      className={`p-3 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                        grade === item.id
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{item.label}</span>
                        {grade === item.id && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 包含的运算类型 (可多选) */}
              <div>
                <label className="text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between flex-wrap gap-1">
                  <span>{t('包含的运算类型（多选）', 'Operations (multi-select)')}</span>
                  <span className="text-xs text-slate-400">{t(`已激活 ${selectedOps.length} 种运算`, `${selectedOps.length} active`)}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                  {[
                    { op: 'add' as OperationType, sym: '+', name: t('加法', 'Add'), desc: t('正向聚合', 'Combine') },
                    { op: 'subtract' as OperationType, sym: '-', name: t('减法', 'Subtract'), desc: t('退位反向', 'Take away') },
                    { op: 'multiply' as OperationType, sym: '×', name: t('乘法', 'Multiply'), desc: t('口诀倍数', 'Times tables') },
                    { op: 'divide' as OperationType, sym: '÷', name: t('除法', 'Divide'), desc: t('平均均分', 'Share equally') }
                  ].map(item => {
                    const active = selectedOps.includes(item.op);
                    return (
                      <button
                        key={item.op}
                        type="button"
                        onClick={() => toggleOp(item.op)}
                        className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          active
                            ? 'border-amber-500 bg-amber-500 text-white shadow-xs font-bold scale-[1.02]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <span className="font-mono font-black text-xl mb-0.5">{item.sym}</span>
                        <span className="text-[11px] sm:text-xs truncate max-w-full">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. 每轮挑战题量 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  {t('每轮挑战练习题量', 'Questions per round')}
                </label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                  {[
                    { cnt: 10, label: t('10 题', '10 Qs'), desc: t('轻松快练', 'Quick') },
                    { cnt: 15, label: t('15 题', '15 Qs'), desc: t('课标推荐', 'Standard') },
                    { cnt: 20, label: t('20 题', '20 Qs'), desc: t('高效巩固', 'Reinforce') },
                    { cnt: 30, label: t('30 题', '30 Qs'), desc: t('耐力冲刺', 'Endurance') }
                  ].map(item => (
                    <button
                      key={item.cnt}
                      type="button"
                      onClick={() => setQuestionCount(item.cnt)}
                      className={`py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        questionCount === item.cnt
                          ? 'border-amber-500 bg-amber-50 font-bold text-amber-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs sm:text-base font-bold font-mono">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. 算式排版格式偏好 */}
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-between flex-wrap gap-1">
                  <span>{t('算式显示格式偏好', 'Equation layout')}</span>
                  <span className="text-xs text-amber-600 font-semibold">{t('强烈推荐竖式立式', 'Vertical recommended')}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setEquationLayout('vertical')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                      equationLayout === 'vertical'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{t('立式 (竖式优先)', 'Vertical')}</span>
                      {equationLayout === 'vertical' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    {/* Visual mini-preview */}
                    <div className="my-2.5 py-2 px-4 bg-white rounded-xl border border-slate-200/80 flex flex-col items-end font-mono text-xs text-slate-800 w-24 mx-auto shadow-2xs">
                      <div>38</div>
                      <div className="flex items-center justify-between w-full border-b-2 border-slate-800">
                        <span>+</span>
                        <span>25</span>
                      </div>
                      <div className="text-amber-600 font-bold">63</div>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center leading-tight">
                      {t('贴合小学课本笔算竖式规范，数位借进位清晰可查', 'Matches textbook column method; carrying and borrowing are clear')}
                    </p>
                  </div>

                  <div
                    onClick={() => setEquationLayout('horizontal')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                      equationLayout === 'horizontal'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{t('横式优先', 'Horizontal')}</span>
                      {equationLayout === 'horizontal' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    {/* Visual mini-preview */}
                    <div className="my-2.5 py-4 px-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center font-mono text-xs text-slate-800 mx-auto shadow-2xs">
                      <span>38 + 25 = </span>
                      <span className="text-amber-600 font-bold ml-1">63</span>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center leading-tight">
                      {t('传统经典单行横式，适合快速视读心算', 'Classic single line, great for quick mental math')}
                    </p>
                  </div>

                  <div
                    onClick={() => setEquationLayout('auto')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                      equationLayout === 'auto'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{t('智能推荐模式', 'Smart (Auto)')}</span>
                      {equationLayout === 'auto' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    {/* Visual mini-preview */}
                    <div className="my-2.5 py-3 px-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center font-mono text-[11px] text-slate-700 mx-auto text-center shadow-2xs">
                      {t('两位数立式 · 简单乘除横式', '2-digit vertical · simple ×÷ inline')}
                    </div>
                    <p className="text-[11px] text-slate-500 text-center leading-tight">
                      {t('单数自动横式，大数进位进阶题自动立式', 'Simple ones inline, harder carrying ones vertical')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. 单题建议时限节奏 */}
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-between flex-wrap gap-1">
                  <span>{t('单题作答建议时限（均速基准）', 'Time per question (target pace)')}</span>
                  <span className="text-xs text-slate-400">{t('训练中隐藏倒计时数字，避免孩子焦虑', 'Countdown hidden to avoid stress')}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { sec: 3, label: t('3 秒', '3 s'), title: t('极速挑战', 'Lightning'), desc: t('强化直觉闪电口算', 'Build instant recall') },
                    { sec: 5, label: t('5 秒', '5 s'), title: t('标准推荐', 'Standard'), desc: t('学校标准心算节奏', 'School standard pace') },
                    { sec: 8, label: t('8 秒', '8 s'), title: t('从容思考', 'Relaxed'), desc: t('适合复杂多位进位', 'For harder carrying') },
                    { sec: 0, label: t('不限时', 'No limit'), title: t('稳扎稳打', 'Steady'), desc: t('专注正确率', 'Focus on accuracy') }
                  ].map(pace => (
                    <button
                      key={pace.sec}
                      type="button"
                      onClick={() => setPerQuestionSeconds(pace.sec)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        perQuestionSeconds === pace.sec
                          ? 'border-amber-500 bg-amber-50 font-bold text-amber-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-mono font-bold text-sm sm:text-base text-slate-900">
                        {pace.label}
                      </div>
                      <div className="text-xs font-semibold text-amber-700 mt-0.5">{pace.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{pace.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 🎨 视听与界面偏好 */}
          {activeTab === 'display' && (
            <div className="space-y-5 sm:space-y-6">
              {/* 1. 字号大小选择 */}
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-between flex-wrap gap-1">
                  <span>{t('护眼字号放大缩放', 'Eye-friendly font size')}</span>
                  <span className="text-xs text-slate-400">{t('关爱小学生视力发育', 'Protect young eyes')}</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: 'normal' as const, label: t('标准舒适', 'Standard'), desc: t('100% 紧凑舒适', '100% compact'), sample: 'text-base sm:text-lg' },
                    { id: 'large' as const, label: t('护眼放大', 'Large'), desc: t('120% 清晰防疲劳', '120% clearer'), sample: 'text-lg sm:text-xl font-bold' },
                    { id: 'xl' as const, label: t('超大字号', 'X-Large'), desc: t('140% 低年级专享', '140% young kids'), sample: 'text-xl sm:text-2xl font-black' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFontSizeScale(item.id)}
                      className={`p-2.5 sm:p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        fontSizeScale === item.id
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-slate-800 truncate">{item.label}</span>
                        {fontSizeScale === item.id && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      </div>
                      <div className={`font-mono text-slate-900 my-1 whitespace-nowrap ${item.sample}`}>
                        18 + 7
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 所见即所得实时效果预览窗 */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 mb-2">
                  {t('👀 当前排版与字号预览效果（所见即所得）', '👀 Live preview of layout & font size')}
                </span>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col items-center min-w-[180px]">
                  {equationLayout === 'horizontal' ? (
                    <div
                      className={`font-mono font-bold text-slate-900 ${
                        fontSizeScale === 'xl' ? 'text-3xl' : fontSizeScale === 'large' ? 'text-2xl' : 'text-xl'
                      }`}
                    >
                      38 + 25 = <span className="text-amber-500 underline">？</span>
                    </div>
                  ) : (
                    <div
                      className={`inline-flex flex-col items-end font-mono font-bold text-slate-900 ${
                        fontSizeScale === 'xl' ? 'text-4xl' : fontSizeScale === 'large' ? 'text-3xl' : 'text-2xl'
                      }`}
                    >
                      <div>38</div>
                      <div className="flex items-center justify-between w-full border-b-2 border-slate-800">
                        <span className="mr-3">+</span>
                        <span>25</span>
                      </div>
                      <div className="text-amber-500 font-bold">？</div>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-medium mt-2">
                    {equationLayout === 'horizontal' ? t('横式排版', 'Horizontal') : t('竖式立式排版', 'Vertical')} ·{' '}
                    {fontSizeScale === 'xl'
                      ? t('超大字号', 'X-Large')
                      : fontSizeScale === 'large'
                        ? t('放大护眼', 'Large')
                        : t('标准字号', 'Standard')}
                  </div>
                </div>
              </div>

              {/* 3. 辅助功能与开关 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800">{t('输入答案位数匹配时自动提交', 'Auto-submit when digits are complete')}</div>
                      <div className="text-[10px] text-slate-500">
                        {t('无需每次点击确认按键，输满正确位数自动判定，适合触屏设备', 'No need to tap confirm; checks automatically. Great for touch screens')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSubmitWhenComplete(!autoSubmitWhenComplete)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      autoSubmitWhenComplete ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        autoSubmitWhenComplete ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800">{t('答题正误语音与音效', 'Answer sound effects')}</div>
                      <div className="text-[10px] text-slate-500">
                        {t('答对清脆叮咚声，答错温柔提示声', 'Cheerful chime when right, gentle tone when wrong')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      soundEnabled ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800">{t('连击成就满分彩带礼花动效', 'Confetti celebrations')}</div>
                      <div className="text-[10px] text-slate-500">
                        {t('通关与连击达成时燃放炫彩礼花，激发学习兴趣', 'Confetti on streaks and completed rounds to keep kids motivated')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCelebrationConfetti(!celebrationConfetti)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      celebrationConfetti ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        celebrationConfetti ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 4. 专属界面主题色 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  {t('个人专属界面主题色调', 'Theme color')}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
                  {THEME_OPTIONS.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`py-2 px-2 sm:px-3 rounded-2xl border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        themeColor === theme.id
                          ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full shrink-0 ${theme.bgClass}`} />
                      <span className="text-xs min-w-0 truncate">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 🌟 档案与心愿激励 */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* 1. 姓名与头像修改 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('学生姓名 / 昵称', 'Name / Nickname')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold bg-white"
                    placeholder={t('输入学生姓名...', 'Enter name...')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('当前就读学段 (在口算规则中配置)', 'Current grade (set in Practice Rules)')}
                  </label>
                  <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-sm font-semibold flex items-center justify-between">
                    <span>{formatGradeLabel(grade)}</span>
                    <span className="text-xs text-amber-700">{formatGradeDetail(grade)}</span>
                  </div>
                </div>
              </div>

              {/* 2. 选择萌宠卡通头像 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t('选择萌宠/吉祥物专属头像', 'Choose an avatar')}
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {AVATAR_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAvatar(opt)}
                      className={`h-11 rounded-2xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                        avatar === opt
                          ? 'bg-amber-100 border-2 border-amber-500 scale-105 shadow-xs'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 励志座右铭 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('专属口算励志座右铭（展示在首页上方）', 'Personal motto (shown on home page)')}
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={e => setMotto(e.target.value)}
                  maxLength={30}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                  placeholder={t('输入专属鼓励语...', 'Enter a motto...')}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {MOTTO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMotto(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. 心愿大奖设置 */}
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="text-sm font-bold text-amber-950">{t('心愿大奖激励计划', 'Reward Plan')}</span>
                  </div>
                  <span className="text-xs text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                    {t(`已积累：⭐ ${student.currentStars || 0} 颗星`, `Earned: ⭐ ${student.currentStars || 0}`)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('梦想心愿名称', 'Reward name')}
                    </label>
                    <input
                      type="text"
                      value={rewardGoalTitle}
                      onChange={e => setRewardGoalTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      placeholder={t('如：去游乐园玩旋转木马、挑选一套乐高...', 'e.g. Amusement park trip, a LEGO set...')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('达成所需学习之星 (⭐)', 'Stars needed (⭐)')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={rewardGoalStarsNeeded}
                        onChange={e => setRewardGoalStarsNeeded(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold font-mono"
                      />
                      <span className="text-xs text-amber-800 font-semibold whitespace-nowrap">{t('颗星', 'stars')}</span>
                    </div>
                  </div>
                </div>

                {/* 心愿进度条 */}
                <div className="mt-4 pt-3 border-t border-amber-200/60">
                  <div className="flex justify-between text-xs text-amber-900 font-bold mb-1">
                    <span>{t('心愿达成进度', 'Reward progress')}</span>
                    <span>
                      {Math.min(100, Math.round(((student.currentStars || 0) / (rewardGoalStarsNeeded || 50)) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-amber-200/70 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          ((student.currentStars || 0) / (rewardGoalStarsNeeded || 50)) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 5. 每日打卡目标 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t('每日口算打卡目标题量', 'Daily goal (questions)')}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {[10, 15, 20, 30].map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setDailyTargetCount(count)}
                        className={`py-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                          dailyTargetCount === count
                            ? 'border-amber-500 bg-amber-50 font-bold text-amber-950'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-mono">{t(`${count}题`, `${count}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t('达标正确率要求', 'Target accuracy')}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {[80, 85, 90, 95].map(acc => (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => setTargetAccuracyRate(acc)}
                        className={`py-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                          targetAccuracyRate === acc
                            ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-mono">≥{acc}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal 底部操作栏 */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            {t('设置将自动保存在当前设备，即刻在练习与错题集中生效', 'Saved on this device and applied instantly')}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              {t('取消', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 sm:px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span className="whitespace-nowrap">{t('保存并应用设置', 'Save & Apply')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
