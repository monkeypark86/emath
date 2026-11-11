import React, { useState, useEffect } from 'react';
import { StudentProfile, StudentPreferences, GradeLevel, OperationType } from '../types/math';
import { updateStudentProfile, DEFAULT_STUDENT_PREFERENCES, formatGradeLabel } from '../utils/storage';
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
  Flame
} from 'lucide-react';

interface StudentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onSave: (updatedStudent: StudentProfile) => void;
}

const AVATAR_OPTIONS = ['🦁', '🐰', '🐼', '🦊', '🐯', '🐻', '🐨', '🚀', '🦄', '🌟', '🐶', '🐱'];

const MOTTO_PRESETS = [
  '每天坚持口算，我是速算小达人！',
  '乘除口诀记得牢，立式计算快又准！',
  '凑十破十法，每天进步一点点！',
  '做错不害怕，多练会变强！',
  '细心第一，速度第二！',
  '挑战自我，向着心愿大奖冲刺！'
];

const THEME_OPTIONS: { id: StudentPreferences['themeColor']; label: string; colorClass: string; bgClass: string }[] = [
  { id: 'amber', label: '活力橙', colorClass: 'text-amber-600', bgClass: 'bg-amber-500' },
  { id: 'blue', label: '天空蓝', colorClass: 'text-blue-600', bgClass: 'bg-blue-500' },
  { id: 'emerald', label: '翡翠绿', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-500' },
  { id: 'purple', label: '星空紫', colorClass: 'text-purple-600', bgClass: 'bg-purple-500' },
  { id: 'rose', label: '草莓粉', colorClass: 'text-rose-600', bgClass: 'bg-rose-500' }
];

export const StudentSettingsModal: React.FC<StudentSettingsModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'display' | 'practice' | 'reward' | 'profile'>('display');

  // Form states initialized with student data
  const [name, setName] = useState<string>(student.name);
  const [avatar, setAvatar] = useState<string>(student.avatar);
  const [grade, setGrade] = useState<GradeLevel>(student.grade);
  const [dailyTargetCount, setDailyTargetCount] = useState<number>(student.dailyTargetCount);
  const [targetAccuracyRate, setTargetAccuracyRate] = useState<number>(student.targetAccuracyRate);
  const [rewardGoalTitle, setRewardGoalTitle] = useState<string>(student.rewardGoalTitle);
  const [rewardGoalStarsNeeded, setRewardGoalStarsNeeded] = useState<number>(student.rewardGoalStarsNeeded);

  // Preferences
  const studentPrefs = student.preferences || DEFAULT_STUDENT_PREFERENCES;
  const [equationLayout, setEquationLayout] = useState<StudentPreferences['equationLayout']>(studentPrefs.equationLayout || 'vertical');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(studentPrefs.soundEnabled !== false);
  const [celebrationConfetti, setCelebrationConfetti] = useState<boolean>(studentPrefs.celebrationConfetti !== false);
  const [autoSubmitWhenComplete, setAutoSubmitWhenComplete] = useState<boolean>(!!studentPrefs.autoSubmitWhenComplete);
  const [fontSizeScale, setFontSizeScale] = useState<StudentPreferences['fontSizeScale']>(studentPrefs.fontSizeScale || 'normal');
  const [perQuestionSeconds, setPerQuestionSeconds] = useState<number>(studentPrefs.perQuestionSeconds ?? 5);
  const [selectedOps, setSelectedOps] = useState<OperationType[]>(studentPrefs.selectedOps || ['add', 'subtract', 'multiply', 'divide']);
  const [questionCount, setQuestionCount] = useState<number>(studentPrefs.questionCount || 10);
  const [motto, setMotto] = useState<string>(studentPrefs.motto || '每天坚持口算，我是速算小达人！');
  const [themeColor, setThemeColor] = useState<StudentPreferences['themeColor']>(studentPrefs.themeColor || 'amber');

  // Reset when modal opens with new student
  useEffect(() => {
    if (isOpen) {
      setName(student.name);
      setAvatar(student.avatar);
      setGrade(student.grade);
      setDailyTargetCount(student.dailyTargetCount);
      setTargetAccuracyRate(student.targetAccuracyRate);
      setRewardGoalTitle(student.rewardGoalTitle);
      setRewardGoalStarsNeeded(student.rewardGoalStarsNeeded);

      const prefs = student.preferences || DEFAULT_STUDENT_PREFERENCES;
      setEquationLayout(prefs.equationLayout || 'vertical');
      setSoundEnabled(prefs.soundEnabled !== false);
      setCelebrationConfetti(prefs.celebrationConfetti !== false);
      setAutoSubmitWhenComplete(!!prefs.autoSubmitWhenComplete);
      setFontSizeScale(prefs.fontSizeScale || 'normal');
      setPerQuestionSeconds(prefs.perQuestionSeconds ?? 5);
      setSelectedOps(prefs.selectedOps || ['add', 'subtract', 'multiply', 'divide']);
      setQuestionCount(prefs.questionCount || 10);
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
      preferences: updatedPreferences
    };

    updateStudentProfile(updatedStudent);
    onSave(updatedStudent);

    // Play feedback
    if (soundEnabled) {
      sound.playCorrect();
    }
    if (celebrationConfetti) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 } });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl shadow-inner">
              {avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display">{name} 的专属个人设置</h2>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  {formatGradeLabel(grade)}
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>自定义算式立式偏好、答题节奏、护眼字号与激励心愿</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'display'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlignVerticalJustifyCenter className="w-4 h-4 text-amber-500" />
            <span>算式与显示习惯</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'practice'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>答题节奏与音效</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reward')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'reward'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>心愿目标与打卡</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'profile'
                ? 'bg-white border-amber-500 text-amber-950 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-500" />
            <span>基础档案</span>
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: 算式与显示习惯 */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* 算式排列格式 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>算式显示格式偏好</span>
                  <span className="text-xs text-amber-600 font-medium">推荐立式(竖式)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setEquationLayout('vertical')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                      equationLayout === 'vertical'
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">立式 (竖式)</span>
                      {equationLayout === 'vertical' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    {/* Visual mini-preview */}
                    <div className="my-3 py-2 px-3 bg-white rounded-xl border border-slate-100 flex flex-col items-end font-mono text-xs text-slate-700 w-24 mx-auto">
                      <div>38</div>
                      <div className="flex items-center justify-between w-full border-b-2 border-slate-800">
                        <span>+</span>
                        <span>25</span>
                      </div>
                      <div className="text-amber-600 font-bold">63</div>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">规范对齐数位，进位退位清晰可查</p>
                  </div>

                  <div
                    onClick={() => setEquationLayout('horizontal')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                      equationLayout === 'horizontal'
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">横式优先</span>
                      {equationLayout === 'horizontal' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    {/* Visual mini-preview */}
                    <div className="my-3 py-3 px-3 bg-white rounded-xl border border-slate-100 flex items-center justify-center font-mono text-xs text-slate-700 mx-auto">
                      <span>38 + 25 = </span>
                      <span className="text-amber-600 font-bold ml-1">63</span>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">经典横式排版，适合快速心算视读</p>
                  </div>

                  <div
                    onClick={() => setEquationLayout('auto')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                      equationLayout === 'auto'
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">智能推荐</span>
                      {equationLayout === 'auto' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    {/* Visual mini-preview */}
                    <div className="my-3 py-3 px-3 bg-white rounded-xl border border-slate-100 flex items-center justify-center font-mono text-xs text-slate-700 mx-auto">
                      <span>两位数立式 · 乘除横立自适应</span>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">单数字简单口算横式，复杂两位数立式</p>
                  </div>
                </div>
              </div>

              {/* 护眼字号放大 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  题目字号与护眼缩放
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'normal', label: '标准字号', desc: '100% 紧凑舒适', sample: 'text-lg' },
                    { id: 'large', label: '放大护眼', desc: '120% 清晰防疲劳', sample: 'text-xl font-bold' },
                    { id: 'xl', label: '超大字号', desc: '140% 一年级专享', sample: 'text-2xl font-extrabold' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFontSizeScale(item.id as StudentPreferences['fontSizeScale'])}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                        fontSizeScale === item.id
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs'
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

              {/* 励志座右铭 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  口算专属励志座右铭（展示在练习页上方）
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
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 答题节奏与音效 */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              {/* 学段难度选择 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  选择适合的学段难度
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'grade1', label: '一年级', desc: '20以内进退位·凑十破十' },
                    { id: 'grade2', label: '二年级', desc: '100以内加减·表内乘除' },
                    { id: 'grade3', label: '三年级', desc: '多位数乘除·万以内速算' },
                    { id: 'grade4', label: '四年级', desc: '简便巧算·两三位数速算' },
                    { id: 'grade5_6', label: '五/六年级', desc: '四则混合极限速算' },
                    { id: 'custom', label: '自定义模式', desc: '自由搭配题目类型' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGrade(item.id as GradeLevel)}
                      className={`p-3 rounded-2xl text-left border-2 transition-all ${
                        grade === item.id
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-sm text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 包含的运算类型 (可多选) */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  包含的运算类型 (可多选)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { op: 'add' as OperationType, sym: '+', name: '加法' },
                    { op: 'subtract' as OperationType, sym: '-', name: '减法' },
                    { op: 'multiply' as OperationType, sym: '×', name: '乘法' },
                    { op: 'divide' as OperationType, sym: '÷', name: '除法' }
                  ].map(item => {
                    const active = selectedOps.includes(item.op);
                    return (
                      <button
                        key={item.op}
                        type="button"
                        onClick={() => toggleOp(item.op)}
                        className={`py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 font-medium text-sm transition-all ${
                          active
                            ? 'border-amber-500 bg-amber-500 text-white shadow-xs font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <span className="font-mono font-bold text-base">{item.sym}</span>
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 每轮挑战题量 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  每轮挑战题量
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[10, 20, 30].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-3 px-3 rounded-2xl border-2 text-center transition-all ${
                        questionCount === cnt
                          ? 'border-amber-500 bg-amber-50 font-bold text-amber-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-base font-mono">{cnt} 题</div>
                      <div className="text-[10px] text-slate-400">
                        {cnt === 10 ? '轻松打卡' : cnt === 20 ? '高效巩固' : '强化速算'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 单题限时节奏 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>单题作答建议时限（后台均速评测基准）</span>
                  <span className="text-xs text-slate-400">练习中隐藏倒计时数字，避免焦虑</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { sec: 3, label: '3 秒', title: '极速挑战', desc: '强化直觉闪电口算' },
                    { sec: 5, label: '5 秒', title: '标准推荐', desc: '学校标准心算节奏' },
                    { sec: 8, label: '8 秒', title: '从容思考', desc: '适合复杂多位进位' },
                    { sec: 0, label: '不限时', title: '稳扎稳打', desc: '完全专注正确率' }
                  ].map(pace => (
                    <button
                      key={pace.sec}
                      type="button"
                      onClick={() => setPerQuestionSeconds(pace.sec)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        perQuestionSeconds === pace.sec
                          ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-base text-slate-900">{pace.label}</span>
                        {perQuestionSeconds === pace.sec && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-0.5">{pace.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{pace.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 极速自动提交开关 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>输入满位数自动提交判分</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">极速口算专用</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    当输入答案位数与正确答案一致时自动判分，无需每次手动按“确定”键。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSubmitWhenComplete(!autoSubmitWhenComplete)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    autoSubmitWhenComplete ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      autoSubmitWhenComplete ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 答题音效开关 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-500" />
                    <span>答题交互提示音效</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    答对清脆叮咚声、答错温和提醒声，提升专注度与练习沉浸感。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    soundEnabled ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 礼花彩带庆祝特效 */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>连击突破与答对满分礼花</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    每连续答对 5 题或练习获满分时，屏幕绽放绚丽彩色礼花彩带。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCelebrationConfetti(!celebrationConfetti)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    celebrationConfetti ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      celebrationConfetti ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 心愿目标与打卡 */}
          {activeTab === 'reward' && (
            <div className="space-y-6">
              {/* 心愿奖励 */}
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-950">我的心愿大奖设置</span>
                  </div>
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                    当前拥有: ⭐ {student.currentStars} 颗星
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
                      placeholder="如：买一套乐高积木、去游乐园..."
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

                {/* Progress preview */}
                <div className="mt-4 pt-3 border-t border-amber-200/60">
                  <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
                    <span>心愿达成进度</span>
                    <span>{Math.min(100, Math.round((student.currentStars / rewardGoalStarsNeeded) * 100))}%</span>
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (student.currentStars / rewardGoalStarsNeeded) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 每日练习打卡目标题量 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  每日口算打卡目标题量
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[10, 15, 20, 30].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setDailyTargetCount(count)}
                      className={`py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                        dailyTargetCount === count
                          ? 'border-amber-500 bg-amber-50 font-bold text-amber-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-base font-mono">{count} 题</div>
                      <div className="text-[10px] text-slate-400">
                        {count === 10 ? '轻松打卡' : count === 20 ? '高效巩固' : '强化速算'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 目标准确率 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  目标达标正确率要求
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[80, 85, 90, 95].map(acc => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setTargetAccuracyRate(acc)}
                      className={`py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                        targetAccuracyRate === acc
                          ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-base font-mono">≥ {acc}%</div>
                      <div className="text-[10px] text-slate-400">
                        {acc === 80 ? '基础扎实' : acc === 90 ? '优良水准' : '卓越精通'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 基础档案 */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* 姓名与年级 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    学生姓名 / 昵称
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    就读年级阶段
                  </label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold bg-white"
                  >
                    <option value="grade1">一年级 (20以内进退位加减)</option>
                    <option value="grade2">二年级 (100以内&九九乘除)</option>
                    <option value="grade3">三年级 (千以内乘除速算)</option>
                    <option value="grade4">四年级 (多位数巧算简算)</option>
                    <option value="grade5_6">五/六年级 (四则混合运算)</option>
                    <option value="custom">自定义自选</option>
                  </select>
                </div>
              </div>

              {/* 头像挑选 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  选择生肖/卡通吉祥物头像
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {AVATAR_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAvatar(opt)}
                      className={`h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
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

              {/* 专属主题色调 */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  个人专属界面主题色
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {THEME_OPTIONS.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`py-2 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${
                        themeColor === theme.id
                          ? 'border-slate-800 bg-slate-900 text-white font-bold shadow-xs'
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
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            设置将自动保存在当前设备，即刻在练习与错题集中生效
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>保存个人设置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
