import React, { useState, useEffect } from 'react';
import {
  OperationType,
  QuestionBankRule,
  MathQuestion,
  CustomManualQuestion
} from '../types/math';
import {
  generateQuestionBatchByRule,
  PRESET_QUESTION_BANKS
} from '../utils/mathGenerator';
import {
  getQuestionBanks,
  saveCustomBank,
  deleteCustomBank,
  getCustomManualQuestions,
  addCustomManualQuestion,
  removeCustomManualQuestion
} from '../utils/storage';
import {
  Layers,
  Plus,
  Play,
  Trash2,
  BookmarkCheck,
  Printer,
  RefreshCw,
  Sparkles,
  Sliders,
  Check,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { useLang } from '../i18n';

interface QuestionBankManagerProps {
  onStartPracticeWithRule: (rule: QuestionBankRule, count: number) => void;
  onPrintQuestions: (questions: MathQuestion[], title: string) => void;
  onBackToPractice?: () => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  onStartPracticeWithRule,
  onPrintQuestions,
  onBackToPractice
}) => {
  const { t } = useLang();
  // Current Editing Rule
  const [selectedOps, setSelectedOps] = useState<OperationType[]>(['add', 'subtract']);
  const [num1Digits, setNum1Digits] = useState<number>(2); // 2位数
  const [num2Digits, setNum2Digits] = useState<number>(1); // 1位数
  const [allowCarry, setAllowCarry] = useState<boolean>(true);
  const [allowBorrow, setAllowBorrow] = useState<boolean>(true);
  const [mustDivideClean, setMustDivideClean] = useState<boolean>(true);
  const [customBankName, setCustomBankName] = useState<string>('');
  const [previewCount, setPreviewCount] = useState<number>(6);

  // Live Preview Questions
  const [previewQuestions, setPreviewQuestions] = useState<MathQuestion[]>([]);

  // Bank List
  const [banks, setBanks] = useState<QuestionBankRule[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'manual'>('create');

  // Manual Question entry
  const [manualList, setManualList] = useState<CustomManualQuestion[]>([]);
  const [manualNum1, setManualNum1] = useState<string>('');
  const [manualNum2, setManualNum2] = useState<string>('');
  const [manualOp, setManualOp] = useState<'+' | '-' | '×' | '÷'>('+');
  const [manualNote, setManualNote] = useState<string>('');

  // Reload bank list
  const refreshBanks = () => {
    setBanks(getQuestionBanks());
    setManualList(getCustomManualQuestions());
  };

  useEffect(() => {
    refreshBanks();
  }, []);

  // Update preview whenever rule changes
  const updatePreview = () => {
    const activeOps: OperationType[] = selectedOps.length > 0 ? selectedOps : ['add'];
    const generated = generateQuestionBatchByRule(previewCount, {
      operations: activeOps,
      num1Digits,
      num2Digits,
      allowCarry,
      allowBorrow,
      mustDivideClean
    });
    setPreviewQuestions(generated);
  };

  useEffect(() => {
    updatePreview();
  }, [selectedOps, num1Digits, num2Digits, allowCarry, allowBorrow, mustDivideClean, previewCount]);

  // Toggle operation
  const toggleOp = (op: OperationType) => {
    if (selectedOps.includes(op)) {
      if (selectedOps.length > 1) {
        setSelectedOps(selectedOps.filter(o => o !== op));
      }
    } else {
      setSelectedOps([...selectedOps, op]);
    }
  };

  // Quick preset apply
  const applyPresetRule = (bank: QuestionBankRule) => {
    setSelectedOps(bank.operations);
    setNum1Digits(bank.num1Digits);
    setNum2Digits(bank.num2Digits);
    if (bank.allowCarry !== undefined) setAllowCarry(bank.allowCarry);
    if (bank.allowBorrow !== undefined) setAllowBorrow(bank.allowBorrow);
    if (bank.mustDivideClean !== undefined) setMustDivideClean(bank.mustDivideClean);
    setCustomBankName(bank.name);
    setActiveTab('create');
  };

  // Save custom bank
  const handleSaveBank = () => {
    const name = customBankName.trim() || t(`${num1Digits}位数与${num2Digits}位数综合训练`, `${num1Digits}-digit & ${num2Digits}-digit Mixed Practice`);
    const newBank: QuestionBankRule = {
      id: 'custom_bank_' + Date.now(),
      name,
      description: t(
        `包含 ${selectedOps.map(o => o === 'add' ? '加' : o === 'subtract' ? '减' : o === 'multiply' ? '乘' : '除').join('、')}，${num1Digits}位与${num2Digits}位`,
        `Includes ${selectedOps.map(o => o === 'add' ? 'addition' : o === 'subtract' ? 'subtraction' : o === 'multiply' ? 'multiplication' : 'division').join(', ')}; ${num1Digits}-digit & ${num2Digits}-digit`
      ),
      operations: selectedOps,
      num1Digits,
      num2Digits,
      allowCarry,
      allowBorrow,
      mustDivideClean,
      isPreset: false,
      createdAt: Date.now()
    };
    saveCustomBank(newBank);
    refreshBanks();
    alert(t(`成功保存题库：“${name}”！可随时在题库中心调用。`, `Saved question bank "${name}"! You can use it anytime from the Library.`));
  };

  // Delete custom bank
  const handleDeleteBank = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('确定要删除这个自定义题库吗？', 'Delete this custom question bank?'))) {
      deleteCustomBank(id);
      refreshBanks();
    }
  };

  // Add manual question
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const n1 = parseInt(manualNum1, 10);
    const n2 = parseInt(manualNum2, 10);
    if (isNaN(n1) || isNaN(n2)) return;

    let ans = 0;
    if (manualOp === '+') ans = n1 + n2;
    else if (manualOp === '-') ans = n1 - n2;
    else if (manualOp === '×') ans = n1 * n2;
    else ans = Math.floor(n1 / (n2 || 1));

    const item: CustomManualQuestion = {
      id: 'mq_' + Date.now(),
      num1: n1,
      num2: n2,
      operatorSymbol: manualOp,
      correctAnswer: ans,
      methodTip: manualNote.trim() || t('家长精选练习题', 'Parent-picked question')
    };
    addCustomManualQuestion(item);
    setManualNum1('');
    setManualNum2('');
    setManualNote('');
    refreshBanks();
  };

  const handleStartManualBatch = () => {
    if (manualList.length === 0) return;
    const questions: MathQuestion[] = manualList.map(m => {
      const opType: OperationType =
        m.operatorSymbol === '+' ? 'add' :
        m.operatorSymbol === '-' ? 'subtract' :
        m.operatorSymbol === '×' ? 'multiply' : 'divide';
      return {
        id: m.id,
        num1: m.num1,
        num2: m.num2,
        operator: opType,
        operatorSymbol: m.operatorSymbol,
        correctAnswer: m.correctAnswer,
        explanation: `${m.num1} ${m.operatorSymbol} ${m.num2} = ${m.correctAnswer}。`,
        methodTip: m.methodTip || t('手动录入题', 'Manually added'),
        difficultyGrade: t('精选题', 'Picked')
      };
    });
    // Wrap as a rule and start
    const fakeRule: QuestionBankRule = {
      id: 'manual_active',
      name: t('家长精选专属特训题库', 'Parent-Picked Practice Set'),
      description: t('手动录入的题目', 'Manually entered questions'),
      operations: ['add'],
      num1Digits: 2,
      num2Digits: 1,
      createdAt: Date.now()
    };
    onStartPracticeWithRule(fakeRule, questions.length);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {onBackToPractice && (
        <button
          type="button"
          onClick={onBackToPractice}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
        >
          <span>{t('← 返回口算训练首页', '← Back to Practice')}</span>
        </button>
      )}
      {/* Title & Tab Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            {t('题库管理与精准出题系统', 'Question Bank Manager')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('自由组合加、减、乘、除运算与数字位数，一键生成针对性口算题库，支持一键开练与打印。', 'Mix +, −, ×, ÷ and digit counts to build targeted question banks. Practice or print in one click.')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('自定义参数出题', 'Custom')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t('题库中心', 'Library')}</span>
            <span className="text-[11px] font-mono text-slate-400">({banks.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t('手动录题', 'Manual')}</span>
            {manualList.length > 0 && (
              <span className="text-[11px] font-mono text-amber-600">({manualList.length})</span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left Config Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: Independent Operators */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {t('1. 单独选择运算类型 (加减乘除自由组合)', '1. Choose operations (mix freely)')}
                </span>
                <span className="text-[11px] text-slate-400">{t(`已选 ${selectedOps.length} 种`, `${selectedOps.length} selected`)}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { op: 'add' as OperationType, sym: '+', name: t('加法运算', 'Addition'), hint: t('进位/不进位', 'Carry / no carry') },
                  { op: 'subtract' as OperationType, sym: '-', name: t('减法运算', 'Subtraction'), hint: t('退位/不退位', 'Borrow / no borrow') },
                  { op: 'multiply' as OperationType, sym: '×', name: t('乘法运算', 'Multiplication'), hint: t('表内乘/多位数', 'Times tables / multi-digit') },
                  { op: 'divide' as OperationType, sym: '÷', name: t('除法运算', 'Division'), hint: t('整除/逆算', 'Exact / inverse') }
                ].map(item => {
                  const active = selectedOps.includes(item.op);
                  return (
                    <button
                      key={item.op}
                      type="button"
                      onClick={() => toggleOp(item.op)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xl font-bold text-slate-900">{item.sym}</span>
                        {active && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
                      </div>
                      <div className="font-semibold text-xs text-slate-800 mt-1">{item.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Independent Digits Selection */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {t('2. 精确设置数值位数 (几位数)', '2. Set number of digits')}
              </div>

              {/* Quick Digit Pair Presets */}
              <div className="mb-4">
                <span className="text-[11px] text-slate-500 block mb-1.5">{t('常用学段位数推荐：', 'Common presets:')}</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { n1: 1, n2: 1, label: t('一位数与一位数 (1位×1位)', '1-digit & 1-digit') },
                    { n1: 2, n2: 1, label: t('两位数与一位数 (2位×1位)', '2-digit & 1-digit') },
                    { n1: 2, n2: 2, label: t('两位数与两位数 (2位×2位)', '2-digit & 2-digit') },
                    { n1: 3, n2: 2, label: t('三位数与两位数 (3位×2位)', '3-digit & 2-digit') }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setNum1Digits(preset.n1);
                        setNum2Digits(preset.n2);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        num1Digits === preset.n1 && num2Digits === preset.n2
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Num 1 Digits */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                    <span>{t('第一个数字位数 (被操作数)', 'First number digits')}</span>
                    <span className="font-mono font-bold text-amber-600 text-sm">{t(`${num1Digits} 位数`, `${num1Digits}-digit`)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNum1Digits(d)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                          num1Digits === d
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {t(`${d} 位数`, `${d}-digit`)}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {t('数值范围: ', 'Range: ')}{num1Digits === 1 ? '1 ~ 9' : `${Math.pow(10, num1Digits - 1)} ~ ${Math.pow(10, num1Digits) - 1}`}
                  </div>
                </div>

                {/* Num 2 Digits */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                    <span>{t('第二个数字位数 (操作数)', 'Second number digits')}</span>
                    <span className="font-mono font-bold text-amber-600 text-sm">{t(`${num2Digits} 位数`, `${num2Digits}-digit`)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNum2Digits(d)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                          num2Digits === d
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {t(`${d} 位数`, `${d}-digit`)}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {t('数值范围: ', 'Range: ')}{num2Digits === 1 ? '1 ~ 9' : `${Math.pow(10, num2Digits - 1)} ~ ${Math.pow(10, num2Digits) - 1}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Fine Mathematical Constraints */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {t('3. 口算思维约束规则', '3. Constraint rules')}
              </div>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-medium text-slate-800">{t('加法允许进位', 'Allow carrying in addition')}</span>
                    <p className="text-[11px] text-slate-400">{t('关闭后生成不进位加法（如 23+4=27，适合初学口算）', 'When off, generates no-carry addition (e.g. 23+4=27), great for beginners')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowCarry}
                    onChange={e => setAllowCarry(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-medium text-slate-800">{t('减法允许退位借位', 'Allow borrowing in subtraction')}</span>
                    <p className="text-[11px] text-slate-400">{t('开启后生成含破十法题型，确保被减数大于减数（无负数）', 'When on, includes borrowing questions; results are never negative')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowBorrow}
                    onChange={e => setAllowBorrow(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-medium text-slate-800">{t('除法保证整除 (口算整商)', 'Exact division only')}</span>
                    <p className="text-[11px] text-slate-400">{t('开启后严格整除无余数，强化想乘算除表内口诀逆运算', 'When on, no remainders — reinforces division as inverse multiplication')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={mustDivideClean}
                    onChange={e => setMustDivideClean(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                </label>
              </div>
            </div>

            {/* Save Template Input */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder={t('为这套出题规则命名（如：三年级乘法拔高）', 'Name this rule set (e.g. Grade 3 Multiplication)')}
                value={customBankName}
                onChange={e => setCustomBankName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveBank}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5"
              >
                <BookmarkCheck className="w-4 h-4 text-amber-600" />
                <span>{t('保存到题库模板', 'Save as Template')}</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview & Action Deck (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('出题效果实时预览', 'Live Preview')}</h3>
                  <div className="text-[11px] text-slate-400">
                    {t(`${num1Digits}位数 × ${num2Digits}位数 · 运算`, `${num1Digits}-digit × ${num2Digits}-digit · Ops`)} [{selectedOps.map(o => o === 'add' ? '+' : o === 'subtract' ? '-' : o === 'multiply' ? '×' : '÷').join(' ')}]
                  </div>
                </div>
                <button
                  type="button"
                  onClick={updatePreview}
                  title={t('刷新预览题目', 'Refresh preview')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Sample Questions List */}
              <div className="my-4 space-y-2">
                {previewQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 w-4">{idx + 1}.</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {q.num1} {q.operatorSymbol} {q.num2} =
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        {q.correctAnswer}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {q.methodTip}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Big Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const rule: QuestionBankRule = {
                      id: 'active_rule_' + Date.now(),
                      name: customBankName || t(`${num1Digits}位与${num2Digits}位速算`, `${num1Digits}-digit & ${num2Digits}-digit Speed Math`),
                      description: t('即时配置题库', 'Instant custom bank'),
                      operations: selectedOps,
                      num1Digits,
                      num2Digits,
                      allowCarry,
                      allowBorrow,
                      mustDivideClean,
                      createdAt: Date.now()
                    };
                    onStartPracticeWithRule(rule, 10);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t('以此题库开启 5 秒口算挑战', 'Start 5-Second Challenge')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fullBatch = generateQuestionBatchByRule(20, {
                      operations: selectedOps,
                      num1Digits,
                      num2Digits,
                      allowCarry,
                      allowBorrow,
                      mustDivideClean
                    });
                    onPrintQuestions(fullBatch, customBankName || t(`${num1Digits}位数与${num2Digits}位数综合口算题卷`, `${num1Digits}-digit & ${num2Digits}-digit Mental Math Worksheet`));
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>{t('生成20题练习纸并打印/导出', 'Print / Export 20-Question Worksheet')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">{t('预设经典题库', 'Preset Banks')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {banks.filter(b => b.isPreset).map(b => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-900">{b.name}</span>
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        {t(`${b.num1Digits}位×${b.num2Digits}位`, `${b.num1Digits}d×${b.num2Digits}d`)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{b.description}</p>
                    <div className="flex gap-1 mb-4">
                      {b.operations.map(op => (
                        <span key={op} className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {op === 'add' ? '+' : op === 'subtract' ? '-' : op === 'multiply' ? '×' : '÷'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onStartPracticeWithRule(b, 10)}
                      className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t('开练此题库', 'Practice')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetRule(b)}
                      className="py-2 px-3 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {t('编辑参数', 'Edit')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Saved Banks */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">{t('我的自定义题库', 'My Custom Banks')}</h2>
            {banks.filter(b => !b.isPreset).length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                {t('暂无保存的自定义题库。您可以在“自定义参数出题”中配置并点击“保存到题库模板”。', 'No custom banks yet. Configure one under "Custom" and click "Save as Template".')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {banks.filter(b => !b.isPreset).map(b => (
                  <div
                    key={b.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-900">{b.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteBank(b.id, e)}
                          title={t('删除题库', 'Delete bank')}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{b.description}</p>
                      <div className="flex gap-1 mb-4">
                        {b.operations.map(op => (
                          <span key={op} className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {op === 'add' ? '+' : op === 'subtract' ? '-' : op === 'multiply' ? '×' : '÷'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onStartPracticeWithRule(b, 10)}
                        className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t('开始挑战', 'Start')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetRule(b)}
                        className="py-2 px-3 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        {t('载入出题', 'Load')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Manual Entry Form */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">{t('手动录入课本易错题', 'Add Tricky Questions Manually')}</h2>
            <p className="text-xs text-slate-500 mb-4">{t('家长可将学校作业或试卷上的典型题录入，进入专属特训。', 'Enter typical questions from homework or tests for focused practice.')}</p>

            <form onSubmit={handleAddManual} className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={t('数字1', 'Num 1')}
                  required
                  value={manualNum1}
                  onChange={e => setManualNum1(e.target.value)}
                  className="flex-1 px-3 py-2 text-center text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                />

                <select
                  value={manualOp}
                  onChange={e => setManualOp(e.target.value as '+' | '-' | '×' | '÷')}
                  className="w-16 px-2 py-2 text-center text-base font-mono font-bold bg-amber-50 border border-amber-200 rounded-xl text-amber-900 focus:outline-none"
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="×">×</option>
                  <option value="÷">÷</option>
                </select>

                <input
                  type="number"
                  placeholder={t('数字2', 'Num 2')}
                  required
                  value={manualNum2}
                  onChange={e => setManualNum2(e.target.value)}
                  className="flex-1 px-3 py-2 text-center text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder={t('解题提示或口诀（选填，如：七八五十六）', 'Hint or rhyme (optional, e.g. 7×8=56)')}
                  value={manualNote}
                  onChange={e => setManualNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t('加入题库', 'Add to Bank')}</span>
              </button>
            </form>
          </div>

          {/* Manual Questions Table */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t('精选题库清单', 'Picked Questions')}</h3>
                <span className="text-xs text-slate-400">{t(`共 ${manualList.length} 道题目`, `${manualList.length} questions`)}</span>
              </div>

              {manualList.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartManualBatch}
                  className="py-1.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t('挑战这套精选题', 'Practice Set')}</span>
                </button>
              )}
            </div>

            {manualList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {t('暂未录入精选题。在左侧输入数字和符号后点击“加入题库”。', 'No questions yet. Enter numbers and an operator, then click "Add to Bank".')}
              </div>
            ) : (
              <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {manualList.map((m, idx) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">{idx + 1}.</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {m.num1} {m.operatorSymbol} {m.num2} = {m.correctAnswer}
                      </span>
                      {m.methodTip && (
                        <span className="text-[11px] text-slate-400">({m.methodTip})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeCustomManualQuestion(m.id);
                        refreshBanks();
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
