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

interface StudentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onSave: (updatedStudent: StudentProfile) => void;
}

const AVATAR_OPTIONS = ['🐰', '🦁', '🐼', '🦊', '🐯', '🐻', '🐨', '🚀', '🦄', '🌟', '🐶', '🐱'];

const MOTTO_PRESETS = [
  '每天坚持口算，我是速算小达人！',
  '乘除口诀记得牢，立式计算快又准！',
  '凑十破十法，每天进步一点点！',
  '做错不害怕，多练会变强！',
  '细心第一，速度第二！',
  '挑战自我，向着心愿大奖冲刺！'
];

const THEME_OPTIONS: { id: StudentPreferences['themeColor']; label: string; colorClass: string; bgClass: string; borderClass: string }[] = [
  { id: 'amber', label: '活力橙', colorClass: 'text-amber-600', bgClass: 'bg-amber-500', borderClass: 'border-amber-500' },
  { id: 'blue', label: '天空蓝', colorClass: 'text-blue-600', bgClass: 'bg-blue-500', borderClass: 'border-blue-500' },
  { id: 'rose', label: '草莓粉', colorClass: 'text-rose-600', bgClass: 'bg-rose-500', borderClass: 'border-rose-500' },
  { id: 'emerald', label: '翡翠绿', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500' },
  { id: 'purple', label: '星空紫', colorClass: 'text-purple-600', bgClass: 'bg-purple-500', borderClass: 'border-purple-500' }
];

export const StudentSettingsModal: React.FC<StudentSettingsModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave
}) => {
  // 3 大核心分类：口算题目定制 | 视听界面偏好 | 档案激励心愿
  const [activeTab, setActiveTab] = useState<'rules' | 'display' | 'profile'>('rules');

  // Form states initialized with student data
  const [name, setName] = useState<string>(student.name);
  const [avatar, setAvatar] = useState<string>(student.avatar);
  const [grade, setGrade] = useState<GradeLevel>(student.grade);
  const [dailyTargetCount, setDailyTargetCount] = useState<number>(student.dailyTargetCount || 20);
  const [targetAccuracyRate, setTargetAccuracyRate] = useState<number>(student.targetAccuracyRate || 90);
  const [rewardGoalTitle, setRewardGoalTitle] = useState<string>(student.rewardGoalTitle || '心愿大奖');
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
  const [motto, setMotto] = useState<string>(studentPrefs.motto || '每天坚持口算，我是速算小达人！');
  const [themeColor, setThemeColor] = useState<StudentPreferences['themeColor']>(studentPrefs.themeColor || 'amber');

  // Reset when modal opens with new student
  useEffect(() => {
    if (isOpen) {
      setName(student.name);
      setAvatar(student.avatar);
      setGrade(student.grade);
      setDailyTargetCount(student.dailyTargetCount || 20);
      setTargetAccuracyRate(student.targetAccuracyRate || 90);
      setRewardGoalTitle(student.rewardGoalTitle || '心愿大奖');
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
      setMotto(prefs.motto || '每天坚持口算，我是速算小达人！');
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
      motto: motto.trim() || '每天坚持口算，我是速算小达人！',
      themeColor
    };

    const updatedStudent: StudentProfile = {
      ...student,
      name: name.trim() || student.name,
      avatar,
      grade,
      dailyTargetCount,
      targetAccuracyRate,
      rewardGoalTitle: rewardGoalTitle.trim() || '心愿大奖',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl shadow-inner shrink-0">
              {avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-display">{name} 的口算专属设置</h2>
                <span className="text-xs bg-white/25 px-2.5 py-0.5 rounded-full font-bold">
                  {formatGradeLabel(grade)}
                </span>
                <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-full font-medium">
                  {formatGradeDetail(grade)}
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5 flex items-center gap-1.5 line-clamp-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span>自定义学段难度、立式竖式格式、答题节奏与激励心愿</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="关闭设置"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 重新规划的三大逻辑 Menu 选项卡 */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/90 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>口算模式与规则</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'display'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-500" />
            <span>视听与界面偏好</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>档案与心愿激励</span>
          </button>
        </div>

        {/* Tab 内容区 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: 📘 口算模式与规则 */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* 1. 学段难度选择 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>就读年级与学段难度</span>
                  <span className="text-xs text-amber-600 font-semibold">
                    当前选择：{formatGradeLabel(grade)}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'grade1' as const, label: '一年级', desc: '20以内进退位·凑十破十' },
                    { id: 'grade2' as const, label: '二年级', desc: '100以内加减·表内九九乘除' },
                    { id: 'grade3' as const, label: '三年级', desc: '多位数乘除·千以内速算' },
                    { id: 'grade4' as const, label: '四年级', desc: '简便巧算·两三位数速算' },
                    { id: 'grade5_6' as const, label: '五/六年级', desc: '四则混合极限速算' },
                    { id: 'custom' as const, label: '自定义难度', desc: '自选出题范围与规则' }
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
                <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>包含的运算类型（多选）</span>
                  <span className="text-xs text-slate-400">已激活 {selectedOps.length} 种运算</span>
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { op: 'add' as OperationType, sym: '+', name: '加法', desc: '正向聚合' },
                    { op: 'subtract' as OperationType, sym: '-', name: '减法', desc: '退位反向' },
                    { op: 'multiply' as OperationType, sym: '×', name: '乘法', desc: '口诀倍数' },
                    { op: 'divide' as OperationType, sym: '÷', name: '除法', desc: '平均均分' }
                  ].map(item => {
                    const active = selectedOps.includes(item.op);
                    return (
                      <button
                        key={item.op}
                        type="button"
                        onClick={() => toggleOp(item.op)}
                        className={`py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          active
                            ? 'border-amber-500 bg-amber-500 text-white shadow-xs font-bold scale-[1.02]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <span className="font-mono font-black text-xl mb-0.5">{item.sym}</span>
                        <span className="text-xs">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. 每轮挑战题量 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  每轮挑战练习题量
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { cnt: 10, label: '10 题', desc: '轻松快练' },
                    { cnt: 15, label: '15 题', desc: '课标推荐' },
                    { cnt: 20, label: '20 题', desc: '高效巩固' },
                    { cnt: 30, label: '30 题', desc: '耐力冲刺' }
                  ].map(item => (
                    <button
                      key={item.cnt}
                      type="button"
                      onClick={() => setQuestionCount(item.cnt)}
                      className={`py-2.5 px-2 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        questionCount === item.cnt
                          ? 'border-amber-500 bg-amber-50 font-bold text-amber-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm sm:text-base font-bold font-mono">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. 算式排版格式偏好 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>算式显示格式偏好</span>
                  <span className="text-xs text-amber-600 font-semibold">强烈推荐竖式立式</span>
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
                      <span className="font-bold text-sm text-slate-900">立式 (竖式优先)</span>
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
                      贴合小学课本笔算竖式规范，数位借进位清晰可查
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
                      <span className="font-bold text-sm text-slate-900">横式优先</span>
                      {equationLayout === 'horizontal' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    {/* Visual mini-preview */}
                    <div className="my-2.5 py-4 px-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center font-mono text-xs text-slate-800 mx-auto shadow-2xs">
                      <span>38 + 25 = </span>
                      <span className="text-amber-600 font-bold ml-1">63</span>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center leading-tight">
                      传统经典单行横式，适合快速视读心算
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
                      <span className="font-bold text-sm text-slate-900">智能推荐模式</span>
                      {equationLayout === 'auto' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    {/* Visual mini-preview */}
                    <div className="my-2.5 py-3 px-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center font-mono text-[11px] text-slate-700 mx-auto text-center shadow-2xs">
                      两位数立式 · 简单乘除横式
                    </div>
                    <p className="text-[11px] text-slate-500 text-center leading-tight">
                      单数自动横式，大数进位进阶题自动立式
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. 单题建议时限节奏 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>单题作答建议时限（均速基准）</span>
                  <span className="text-xs text-slate-400">训练中隐藏倒计时数字，避免孩子焦虑</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { sec: 3, label: '3 秒', title: '极速挑战', desc: '强化直觉闪电口算' },
                    { sec: 5, label: '5 秒', title: '标准推荐', desc: '学校标准心算节奏' },
                    { sec: 8, label: '8 秒', title: '从容思考', desc: '适合复杂多位进位' },
                    { sec: 0, label: '不限时', title: '稳扎稳打', desc: '专注正确率' }
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
            <div className="space-y-6">
              {/* 1. 字号大小选择 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>护眼字号放大缩放</span>
                  <span className="text-xs text-slate-400">关爱小学生视力发育</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'normal' as const, label: '标准舒适', desc: '100% 紧凑舒适', sample: 'text-lg' },
                    { id: 'large' as const, label: '护眼放大', desc: '120% 清晰防疲劳', sample: 'text-xl font-bold' },
                    { id: 'xl' as const, label: '超大字号', desc: '140% 低年级专享', sample: 'text-2xl font-black' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFontSizeScale(item.id)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        fontSizeScale === item.id
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-800">{item.label}</span>
                        {fontSizeScale === item.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <div className={`font-mono text-slate-900 my-1 ${item.sample}`}>
                        18 + 7
                      </div>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 所见即所得实时效果预览窗 */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 mb-2">
                  👀 当前排版与字号预览效果（所见即所得）
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
                    {equationLayout === 'horizontal' ? '横式排版' : '竖式立式排版'} ·{' '}
                    {fontSizeScale === 'xl' ? '超大字号' : fontSizeScale === 'large' ? '放大护眼' : '标准字号'}
                  </div>
                </div>
              </div>

              {/* 3. 辅助功能与开关 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">输入答案位数匹配时自动提交</div>
                      <div className="text-[10px] text-slate-500">
                        无需每次点击确认按键，输满正确位数自动判定，适合触屏设备
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSubmitWhenComplete(!autoSubmitWhenComplete)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
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

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">答题正误语音与音效</div>
                      <div className="text-[10px] text-slate-500">
                        答对清脆叮咚声，答错温柔提示声
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
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

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">连击成就满分彩带礼花动效</div>
                      <div className="text-[10px] text-slate-500">
                        通关与连击达成时燃放炫彩礼花，激发学习兴趣
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCelebrationConfetti(!celebrationConfetti)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
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
                  个人专属界面主题色调
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {THEME_OPTIONS.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`py-2 px-3 rounded-2xl border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        themeColor === theme.id
                          ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${theme.bgClass}`} />
                      <span className="text-xs">{theme.label}</span>
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
                    学生姓名 / 昵称
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold bg-white"
                    placeholder="输入学生姓名..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    当前就读学段 (在口算规则中配置)
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
                  选择萌宠/吉祥物专属头像
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
                  专属口算励志座右铭（展示在首页上方）
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={e => setMotto(e.target.value)}
                  maxLength={30}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                  placeholder="输入专属鼓励语..."
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
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-950">心愿大奖激励计划</span>
                  </div>
                  <span className="text-xs text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold">
                    已积累：⭐ {student.currentStars || 0} 颗星
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      梦想心愿名称
                    </label>
                    <input
                      type="text"
                      value={rewardGoalTitle}
                      onChange={e => setRewardGoalTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      placeholder="如：去游乐园玩旋转木马、挑选一套乐高..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      达成所需学习之星 (⭐)
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
                      <span className="text-xs text-amber-800 font-semibold whitespace-nowrap">颗星</span>
                    </div>
                  </div>
                </div>

                {/* 心愿进度条 */}
                <div className="mt-4 pt-3 border-t border-amber-200/60">
                  <div className="flex justify-between text-xs text-amber-900 font-bold mb-1">
                    <span>心愿达成进度</span>
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
                    每日口算打卡目标题量
                  </label>
                  <div className="grid grid-cols-4 gap-2">
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
                        <span className="text-sm font-mono">{count}题</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    达标正确率要求
                  </label>
                  <div className="grid grid-cols-4 gap-2">
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
                        <span className="text-sm font-mono">≥{acc}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal 底部操作栏 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            设置将自动保存在当前设备，即刻在练习与错题集中生效
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>保存并应用设置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
