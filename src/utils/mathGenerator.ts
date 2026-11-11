import { GradeLevel, MathQuestion, OperationType } from '../types/math';
import { getLang, tr } from '../i18n';

// 题目技巧/难度标签的中英对照 (zh, en)。生成题目时按当前语言写入，
// 展示时可通过 localizeMethodTip / localizeDifficultyGrade 按当前语言重新翻译（兼容已存储的数据）。
const LABEL_PAIRS: [string, string][] = [
  // method tips
  ['凑十法速算', 'Make-10 trick'],
  ['10以内不进位', 'No carrying'],
  ['破十法巧算', 'Break-10 trick'],
  ['10以内不退位', 'No borrowing'],
  ['九九乘法口诀', 'Times tables'],
  ['表内除法逆向思维', 'Think multiply'],
  ['整十拆分法', 'Split the tens'],
  ['退位减法思维', 'Borrowing'],
  ['拆分乘法', 'Split & multiply'],
  ['整除试商法', 'Trial division'],
  ['百位数连加', '3-digit adding'],
  ['三位数减法', '3-digit subtracting'],
  ['乘25巧算法 (÷4×100)', '×25 trick (÷4×100)'],
  ['乘11口诀 (两头一拉中间相加)', '×11 trick'],
  ['因数分解巧算', 'Factor trick'],
  ['乘法竖式心算', 'Mental column ×'],
  ['商不变巧算除法', 'Division trick'],
  ['凑整巧算加法', 'Round & add'],
  ['高位减法与凑整', 'Round & subtract'],
  ['乘法口诀', 'Times table'],
  ['表内除法', 'Basic division'],
  ['加法心算', 'Mental adding'],
  ['减法心算', 'Mental subtracting'],
  ['口算技巧', 'Mental math'],
  ['家长精选练习题', "Parent's pick"],
  ['手动录入题', 'Custom question'],
  // difficulty grades
  ['二年级基础', 'Grade 2 basics'],
  ['一年级(20以内)', 'Grade 1 (to 20)'],
  ['二年级(100以内&九九乘除)', 'Grade 2 (to 100, × ÷)'],
  ['三年级(多位数速算)', 'Grade 3 (multi-digit)'],
  ['四年级(简便巧算)', 'Grade 4 (tricks)'],
  ['五六年级(综合速算)', 'Grade 5-6 (mixed)'],
  ['自定义测试', 'Custom'],
  ['精选题', 'Picked'],
  ['口算', 'Mental math'],
  ['口算题', 'Mental math'],
  ['grade1', 'Grade 1'],
  ['grade2', 'Grade 2'],
  ['grade3', 'Grade 3'],
  ['grade4', 'Grade 4'],
  ['grade5_6', 'Grade 5-6'],
  ['custom', 'Custom']
];

const ZH_DIGIT_OPS: Record<string, string> = { 加法: '+', 减法: '-', 乘法: '×', 整除除法: '÷' };
const SYMBOL_TO_ZH_OP: Record<string, string> = { '+': '加法', '-': '减法', '×': '乘法', '÷': '整除除法' };

/** 生成“n位数与m位数X法”技巧标签 */
function digitMethodTip(n1: number, n2: number, symbol: '+' | '-' | '×' | '÷'): string {
  return tr(`${n1}位数与${n2}位数${SYMBOL_TO_ZH_OP[symbol]}`, `${n1}-digit ${symbol} ${n2}-digit`);
}

/** 按当前语言翻译一个已知标签（中英双向查找），未知则原样返回 */
function localizeLabel(text: string | undefined | null): string {
  if (!text) return text || '';
  const pair = LABEL_PAIRS.find(([zh, en]) => zh === text || en === text);
  if (pair) return tr(pair[0], pair[1]);
  // n位数与m位数X法  <->  n-digit X m-digit
  let m = text.match(/^(\d+)位数与(\d+)位数(加法|减法|乘法|整除除法)$/);
  if (m) return tr(text, `${m[1]}-digit ${ZH_DIGIT_OPS[m[3]]} ${m[2]}-digit`);
  m = text.match(/^(\d+)-digit ([+\-×÷]) (\d+)-digit$/);
  if (m) return tr(`${m[1]}位数与${m[3]}位数${SYMBOL_TO_ZH_OP[m[2]]}`, text);
  // n位×m位专项  <->  n-digit × m-digit drill
  m = text.match(/^(\d+)位×(\d+)位专项$/);
  if (m) return tr(text, `${m[1]}×${m[2]}-digit drill`);
  m = text.match(/^(\d+)×(\d+)-digit drill$/);
  if (m) return tr(`${m[1]}位×${m[2]}位专项`, text);
  return text;
}

/** 展示题目技巧标签 (methodTip) 时调用，按当前语言翻译（兼容旧存储数据） */
export function localizeMethodTip(tip: string | undefined | null): string {
  return localizeLabel(tip);
}

/** 展示题目难度标签 (difficultyGrade) 时调用，按当前语言翻译（兼容旧存储数据） */
export function localizeDifficultyGrade(grade: string | undefined | null): string {
  return localizeLabel(grade);
}

/**
 * 展示题目解析 (explanation) 时调用。解析在生成时按当时语言写入；
 * 若当前为英文而解析是中文，则回退为简单算式 “a op b = c”。
 */
export function localizeExplanation(
  explanation: string | undefined | null,
  q?: Pick<MathQuestion, 'num1' | 'num2' | 'operatorSymbol' | 'correctAnswer'>
): string {
  const text = explanation || '';
  if (getLang() === 'en' && /[\u4e00-\u9fff]/.test(text) && q) {
    return `${q.num1} ${q.operatorSymbol} ${q.num2} = ${q.correctAnswer}`;
  }
  return text;
}

// Chinese Multiplication table rhymes map for explanations
const MULTIPLY_TABLE: Record<string, string> = {
  '1x1': '一一得一', '1x2': '一二得二', '1x3': '一三得三', '1x4': '一四得四', '1x5': '一五得五', '1x6': '一六得六', '1x7': '一七得七', '1x8': '一八得八', '1x9': '一九得九',
  '2x2': '二二得四', '2x3': '二三得六', '2x4': '二四得八', '2x5': '二五一十', '2x6': '二六十二', '2x7': '二七十四', '2x8': '二八十六', '2x9': '二九十八',
  '3x3': '三三得九', '3x4': '三四十二', '3x5': '三五十五', '3x6': '三六十八', '3x7': '三七二十一', '3x8': '三八二十四', '3x9': '三九二十七',
  '4x4': '四四十六', '4x5': '四五二十', '4x6': '四六二十四', '4x7': '四七二十八', '4x8': '四八三十二', '4x9': '四九三十六',
  '5x5': '五五二十五', '5x6': '五六三十', '5x7': '五七三十五', '5x8': '五八四十', '5x9': '五九四十五',
  '6x6': '六六三十六', '6x7': '六七四十二', '6x8': '六八四十八', '6x9': '六九五十四',
  '7x7': '七七四十九', '7x8': '七八五十六', '7x9': '七九六十三',
  '8x8': '八八六十四', '8x9': '八九七十二',
  '9x9': '九九八十一',
};

function getMultiplyRhyme(a: number, b: number): string {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  if (getLang() === 'en') return `${min} × ${max} = ${a * b}`;
  return MULTIPLY_TABLE[`${min}x${max}`] || `${a} × ${b} = ${a * b}`;
}

export function generateQuestion(
  grade: GradeLevel = 'grade2',
  allowedOps: OperationType[] = ['add', 'subtract', 'multiply', 'divide'],
  maxNumberCustom: number = 100
): MathQuestion {
  const id = 'q_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  
  // Decide active operations based on grade if not custom
  let ops = allowedOps;
  if (grade === 'grade1') {
    ops = allowedOps.filter(o => o === 'add' || o === 'subtract');
    if (ops.length === 0) ops = ['add', 'subtract'];
  } else if (grade === 'grade2') {
    ops = allowedOps.length > 0 ? allowedOps : ['add', 'subtract', 'multiply'];
  }

  const selectedOp = ops[Math.floor(Math.random() * ops.length)] || 'add';

  let num1 = 0;
  let num2 = 0;
  let correctAnswer = 0;
  let operatorSymbol: '+' | '-' | '×' | '÷' = '+';
  let explanation = '';
  let methodTip = '';
  let difficultyGrade = tr('二年级基础', 'Grade 2 basics');

  switch (grade) {
    case 'grade1': {
      difficultyGrade = tr('一年级(20以内)', 'Grade 1 (to 20)');
      if (selectedOp === 'add') {
        operatorSymbol = '+';
        // 20以内加法，部分进位
        const isCarry = Math.random() > 0.4;
        if (isCarry) {
          num1 = Math.floor(Math.random() * 5) + 6; // 6 - 10
          num2 = Math.floor(Math.random() * 8) + 3; // 3 - 10
          correctAnswer = num1 + num2;
          const makeTen = 10 - num1;
          const remaining = num2 - makeTen;
          methodTip = tr('凑十法速算', 'Make-10 trick');
          explanation = tr(`【凑十法】把 ${num2} 分成 ${makeTen} 和 ${remaining}，${num1} + ${makeTen} = 10，10 + ${remaining} = ${correctAnswer}。`, `[Make 10] Split ${num2} into ${makeTen} and ${remaining}: ${num1} + ${makeTen} = 10, then 10 + ${remaining} = ${correctAnswer}.`);
        } else {
          num1 = Math.floor(Math.random() * 9) + 1;
          num2 = Math.floor(Math.random() * (10 - num1)) + 1;
          correctAnswer = num1 + num2;
          methodTip = tr('10以内不进位', 'No carrying');
          explanation = tr(`直接相加：${num1} + ${num2} = ${correctAnswer}。`, `Add directly: ${num1} + ${num2} = ${correctAnswer}.`);
        }
      } else {
        operatorSymbol = '-';
        // 20以内退位减法 (如 15 - 8)
        const isBorrow = Math.random() > 0.35;
        if (isBorrow) {
          correctAnswer = Math.floor(Math.random() * 8) + 2; // 2 - 9
          num2 = Math.floor(Math.random() * 8) + 2; // 2 - 9
          num1 = correctAnswer + num2;
          if (num1 <= 10) num1 += 10;
          correctAnswer = num1 - num2;
          methodTip = tr('破十法巧算', 'Break-10 trick');
          explanation = tr(`【破十法】把 ${num1} 分成 10 和 ${num1 - 10}，先算 10 - ${num2} = ${10 - num2}，再算 ${10 - num2} + ${num1 - 10} = ${correctAnswer}。`, `[Break 10] Split ${num1} into 10 and ${num1 - 10}: 10 - ${num2} = ${10 - num2}, then ${10 - num2} + ${num1 - 10} = ${correctAnswer}.`);
        } else {
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * num1) + 1;
          correctAnswer = num1 - num2;
          methodTip = tr('10以内不退位', 'No borrowing');
          explanation = tr(`倒数相减：${num1} - ${num2} = ${correctAnswer}。`, `Count back: ${num1} - ${num2} = ${correctAnswer}.`);
        }
      }
      break;
    }

    case 'grade2': {
      difficultyGrade = tr('二年级(100以内&九九乘除)', 'Grade 2 (to 100, × ÷)');
      if (selectedOp === 'multiply') {
        operatorSymbol = '×';
        num1 = Math.floor(Math.random() * 8) + 2; // 2 - 9
        num2 = Math.floor(Math.random() * 8) + 2; // 2 - 9
        correctAnswer = num1 * num2;
        const rhyme = getMultiplyRhyme(num1, num2);
        methodTip = tr('九九乘法口诀', 'Times tables');
        explanation = tr(`【口诀记心间】乘法口诀：“${rhyme}”，因此 ${num1} × ${num2} = ${correctAnswer}。`, `[Times Table] ${rhyme}, so ${num1} × ${num2} = ${correctAnswer}.`);
      } else if (selectedOp === 'divide') {
        operatorSymbol = '÷';
        num2 = Math.floor(Math.random() * 8) + 2; // 2 - 9
        correctAnswer = Math.floor(Math.random() * 8) + 2; // 2 - 9
        num1 = num2 * correctAnswer;
        const rhyme = getMultiplyRhyme(num2, correctAnswer);
        methodTip = tr('表内除法逆向思维', 'Think multiply');
        explanation = tr(`【想乘算除】想乘法口诀：“${rhyme}”，所以 ${num1} ÷ ${num2} = ${correctAnswer}。`, `[Think Multiply] Since ${rhyme}, ${num1} ÷ ${num2} = ${correctAnswer}.`);
      } else if (selectedOp === 'add') {
        operatorSymbol = '+';
        num1 = Math.floor(Math.random() * 60) + 12;
        num2 = Math.floor(Math.random() * (99 - num1)) + 5;
        correctAnswer = num1 + num2;
        methodTip = tr('整十拆分法', 'Split the tens');
        explanation = tr(`【拆分相加】先加十位 (${Math.floor(num1/10)*10} + ${Math.floor(num2/10)*10} = ${(Math.floor(num1/10) + Math.floor(num2/10))*10})，再加个位 (${num1%10} + ${num2%10} = ${(num1%10) + (num2%10)})，得 ${correctAnswer}。`, `[Split Tens] Tens: ${Math.floor(num1/10)*10} + ${Math.floor(num2/10)*10} = ${(Math.floor(num1/10) + Math.floor(num2/10))*10}; Ones: ${num1%10} + ${num2%10} = ${(num1%10) + (num2%10)}; Total = ${correctAnswer}.`);
      } else {
        operatorSymbol = '-';
        num1 = Math.floor(Math.random() * 70) + 25;
        num2 = Math.floor(Math.random() * (num1 - 10)) + 8;
        correctAnswer = num1 - num2;
        methodTip = tr('退位减法思维', 'Borrowing');
        explanation = tr(`【先减整十再减个位】${num1} - ${Math.floor(num2/10)*10} = ${num1 - Math.floor(num2/10)*10}，再减 ${num2%10} = ${correctAnswer}。`, `[Subtract Tens First] ${num1} - ${Math.floor(num2/10)*10} = ${num1 - Math.floor(num2/10)*10}, then - ${num2%10} = ${correctAnswer}.`);
      }
      break;
    }

    case 'grade3': {
      difficultyGrade = tr('三年级(多位数速算)', 'Grade 3 (multi-digit)');
      if (selectedOp === 'multiply') {
        operatorSymbol = '×';
        num1 = Math.floor(Math.random() * 60) + 12; // 两位数
        num2 = Math.floor(Math.random() * 7) + 2; // 一位数
        correctAnswer = num1 * num2;
        methodTip = tr('拆分乘法', 'Split & multiply');
        explanation = tr(`【拆分法】${num1} × ${num2} = (${Math.floor(num1/10)*10} × ${num2}) + (${num1%10} × ${num2}) = ${Math.floor(num1/10)*10*num2} + ${num1%10*num2} = ${correctAnswer}。`, `[Split] ${num1} × ${num2} = (${Math.floor(num1/10)*10} × ${num2}) + (${num1%10} × ${num2}) = ${Math.floor(num1/10)*10*num2} + ${num1%10*num2} = ${correctAnswer}.`);
      } else if (selectedOp === 'divide') {
        operatorSymbol = '÷';
        num2 = Math.floor(Math.random() * 7) + 3; // 3 - 9
        correctAnswer = Math.floor(Math.random() * 25) + 11; // 两位数商
        num1 = num2 * correctAnswer;
        methodTip = tr('整除试商法', 'Trial division');
        explanation = tr(`【逐步除法】${num1} 先除以 ${num2}：${Math.floor(num1/10)*10} ÷ ${num2} + 余数继续除，商为 ${correctAnswer}。`, `[Step Division] Divide ${num1} by ${num2} step by step to get ${correctAnswer}.`);
      } else if (selectedOp === 'add') {
        operatorSymbol = '+';
        num1 = Math.floor(Math.random() * 300) + 150;
        num2 = Math.floor(Math.random() * 400) + 80;
        correctAnswer = num1 + num2;
        methodTip = tr('百位数连加', '3-digit adding');
        explanation = tr(`【百十个分别相加】${num1} + ${num2} = ${correctAnswer}。`, `[Add by Place Value] ${num1} + ${num2} = ${correctAnswer}.`);
      } else {
        operatorSymbol = '-';
        num1 = Math.floor(Math.random() * 500) + 200;
        num2 = Math.floor(Math.random() * (num1 - 50)) + 60;
        correctAnswer = num1 - num2;
        methodTip = tr('三位数减法', '3-digit subtracting');
        explanation = tr(`【高位减法】${num1} - ${num2} = ${correctAnswer}。`, `[Subtract by Place Value] ${num1} - ${num2} = ${correctAnswer}.`);
      }
      break;
    }

    case 'grade4':
    case 'grade5_6': {
      difficultyGrade = grade === 'grade4' ? tr('四年级(简便巧算)', 'Grade 4 (tricks)') : tr('五六年级(综合速算)', 'Grade 5-6 (mixed)');
      if (selectedOp === 'multiply') {
        operatorSymbol = '×';
        // 特殊速算技巧：如乘以 11, 25, 15, 或两位数乘两位数
        const isTrick = Math.random() > 0.4;
        if (isTrick) {
          num2 = [11, 15, 25, 5][Math.floor(Math.random() * 4)];
          num1 = num2 === 25 ? (Math.floor(Math.random() * 8) + 2) * 4 : Math.floor(Math.random() * 20) + 12;
          correctAnswer = num1 * num2;
          if (num2 === 25) {
            methodTip = tr('乘25巧算法 (÷4×100)', '×25 trick (÷4×100)');
            explanation = tr(`【巧算25】${num1} × 25 = (${num1} ÷ 4) × 100 = ${num1/4} × 100 = ${correctAnswer}。`, `[×25 Trick] ${num1} × 25 = (${num1} ÷ 4) × 100 = ${num1/4} × 100 = ${correctAnswer}.`);
          } else if (num2 === 11) {
            methodTip = tr('乘11口诀 (两头一拉中间相加)', '×11 trick');
            explanation = tr(`【巧算11】两头一拉，中间相加：${num1} × 11 = ${correctAnswer}。`, `[×11 Trick] Split outer digits and sum the middle: ${num1} × 11 = ${correctAnswer}.`);
          } else {
            methodTip = tr('因数分解巧算', 'Factor trick');
            explanation = tr(`【分解法】${num1} × ${num2} = ${correctAnswer}。`, `[Factoring] ${num1} × ${num2} = ${correctAnswer}.`);
          }
        } else {
          num1 = Math.floor(Math.random() * 30) + 12;
          num2 = Math.floor(Math.random() * 15) + 11;
          correctAnswer = num1 * num2;
          methodTip = tr('乘法竖式心算', 'Mental column ×');
          explanation = tr(`【心算竖式】${num1} × ${num2} = ${num1 * 10} + ${num1 * (num2 - 10)} = ${correctAnswer}。`, `[Mental Column] ${num1} × ${num2} = ${num1 * 10} + ${num1 * (num2 - 10)} = ${correctAnswer}.`);
        }
      } else if (selectedOp === 'divide') {
        operatorSymbol = '÷';
        num2 = [12, 15, 16, 20, 25][Math.floor(Math.random() * 5)];
        correctAnswer = Math.floor(Math.random() * 20) + 12;
        num1 = num2 * correctAnswer;
        methodTip = tr('商不变巧算除法', 'Division trick');
        explanation = tr(`【巧算除法】${num1} ÷ ${num2} = ${correctAnswer}。`, `[Division Trick] ${num1} ÷ ${num2} = ${correctAnswer}.`);
      } else if (selectedOp === 'add') {
        operatorSymbol = '+';
        num1 = Math.floor(Math.random() * 600) + 200;
        num2 = Math.floor(Math.random() * 400) + 150;
        correctAnswer = num1 + num2;
        methodTip = tr('凑整巧算加法', 'Round & add');
        explanation = tr(`【凑整法】${num1} + ${num2} = ${correctAnswer}。`, `[Round & Add] ${num1} + ${num2} = ${correctAnswer}.`);
      } else {
        operatorSymbol = '-';
        num1 = Math.floor(Math.random() * 800) + 300;
        num2 = Math.floor(Math.random() * (num1 - 100)) + 90;
        correctAnswer = num1 - num2;
        methodTip = tr('高位减法与凑整', 'Round & subtract');
        explanation = tr(`【减整加零】${num1} - ${num2} = ${correctAnswer}。`, `[Round & Subtract] ${num1} - ${num2} = ${correctAnswer}.`);
      }
      break;
    }

    case 'custom':
    default: {
      difficultyGrade = tr('自定义测试', 'Custom');
      if (selectedOp === 'multiply') {
        operatorSymbol = '×';
        num1 = Math.floor(Math.random() * 9) + 2;
        num2 = Math.floor(Math.random() * 9) + 2;
        correctAnswer = num1 * num2;
        methodTip = tr('乘法口诀', 'Times table');
        explanation = `${num1} × ${num2} = ${correctAnswer} (${getMultiplyRhyme(num1, num2)})`;
      } else if (selectedOp === 'divide') {
        operatorSymbol = '÷';
        num2 = Math.floor(Math.random() * 8) + 2;
        correctAnswer = Math.floor(Math.random() * 9) + 2;
        num1 = num2 * correctAnswer;
        methodTip = tr('表内除法', 'Basic division');
        explanation = `${num1} ÷ ${num2} = ${correctAnswer}`;
      } else if (selectedOp === 'add') {
        operatorSymbol = '+';
        const limit = Math.max(20, maxNumberCustom);
        num1 = Math.floor(Math.random() * (limit / 2)) + 1;
        num2 = Math.floor(Math.random() * (limit / 2)) + 1;
        correctAnswer = num1 + num2;
        methodTip = tr('加法心算', 'Mental adding');
        explanation = `${num1} + ${num2} = ${correctAnswer}`;
      } else {
        operatorSymbol = '-';
        const limit = Math.max(20, maxNumberCustom);
        num1 = Math.floor(Math.random() * limit) + 2;
        num2 = Math.floor(Math.random() * num1) + 1;
        correctAnswer = num1 - num2;
        methodTip = tr('减法心算', 'Mental subtracting');
        explanation = `${num1} - ${num2} = ${correctAnswer}`;
      }
      break;
    }
  }

  return {
    id,
    num1,
    num2,
    operator: selectedOp,
    operatorSymbol,
    correctAnswer,
    explanation,
    methodTip,
    difficultyGrade,
  };
}

export function generateQuestionBatch(
  count: number = 10,
  grade: GradeLevel = 'grade2',
  allowedOps: OperationType[] = ['add', 'subtract', 'multiply', 'divide'],
  maxNumberCustom: number = 100
): MathQuestion[] {
  const result: MathQuestion[] = [];
  const seenSignatures = new Set<string>();

  let attempts = 0;
  while (result.length < count && attempts < count * 5) {
    attempts++;
    const q = generateQuestion(grade, allowedOps, maxNumberCustom);
    const sig = `${q.num1}${q.operatorSymbol}${q.num2}`;
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      result.push(q);
    }
  }

  // Fallback in case of duplicate rejection
  while (result.length < count) {
    result.push(generateQuestion(grade, allowedOps, maxNumberCustom));
  }

  return result;
}

export function generateQuestionByDigits(
  operator: OperationType,
  num1Digits: number = 2,
  num2Digits: number = 1,
  options: {
    allowCarry?: boolean;
    allowBorrow?: boolean;
    mustDivideClean?: boolean;
  } = {}
): MathQuestion {
  const id = 'q_dig_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const { allowCarry = true, allowBorrow = true, mustDivideClean = true } = options;

  const min1 = num1Digits === 1 ? 1 : Math.pow(10, num1Digits - 1);
  const max1 = Math.pow(10, num1Digits) - 1;

  const min2 = num2Digits === 1 ? 1 : Math.pow(10, num2Digits - 1);
  const max2 = Math.pow(10, num2Digits) - 1;

  let num1 = Math.floor(Math.random() * (max1 - min1 + 1)) + min1;
  let num2 = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
  let correctAnswer = 0;
  let operatorSymbol: '+' | '-' | '×' | '÷' = '+';
  let explanation = '';
  let methodTip = '';

  if (operator === 'add') {
    operatorSymbol = '+';
    if (!allowCarry) {
      // Generate numbers where no digit column exceeds 9
      const digits1 = String(num1).split('').map(Number);
      const digits2 = digits1.map(d => Math.floor(Math.random() * (10 - d)));
      num2 = Number(digits2.slice(-num2Digits).join('')) || 1;
    }
    correctAnswer = num1 + num2;
    methodTip = digitMethodTip(num1Digits, num2Digits, '+');
    explanation = tr(`${num1} + ${num2} = ${correctAnswer}。先算个位相加，注意进位规则。`, `${num1} + ${num2} = ${correctAnswer}. Add from ones place and watch for carrying.`);
  } else if (operator === 'subtract') {
    operatorSymbol = '-';
    // Ensure num1 >= num2
    if (num1 < num2) {
      const temp = num1;
      num1 = num2;
      num2 = temp;
    }
    if (!allowBorrow && num1Digits >= num2Digits) {
      // Ensure each digit of num1 >= digit of num2
      const digits1 = String(num1).split('').map(Number);
      const digits2 = digits1.map(d => Math.floor(Math.random() * (d + 1)));
      num2 = Number(digits2.slice(-num2Digits).join('')) || 0;
    }
    correctAnswer = num1 - num2;
    methodTip = digitMethodTip(num1Digits, num2Digits, '-');
    explanation = tr(`${num1} - ${num2} = ${correctAnswer}。先对齐数位，由低位到高位依次相减。`, `${num1} - ${num2} = ${correctAnswer}. Align place values and subtract from right to left.`);
  } else if (operator === 'multiply') {
    operatorSymbol = '×';
    correctAnswer = num1 * num2;
    methodTip = digitMethodTip(num1Digits, num2Digits, '×');
    if (num1Digits === 1 && num2Digits === 1) {
      const rhyme = getMultiplyRhyme(num1, num2);
      explanation = tr(`乘法口诀：“${rhyme}”，所以 ${num1} × ${num2} = ${correctAnswer}。`, `Times table: ${rhyme}, so ${num1} × ${num2} = ${correctAnswer}.`);
    } else {
      explanation = tr(`${num1} × ${num2} = ${correctAnswer}。可将 ${num2} 按数位拆分后分别相乘再相加。`, `${num1} × ${num2} = ${correctAnswer}. Split ${num2} by place value, multiply, and add.`);
    }
  } else {
    operatorSymbol = '÷';
    if (mustDivideClean) {
      // Ensure clean integer division: num1 = num2 * quotient
      // divisor is num2, quotient has approx num1Digits - num2Digits
      num2 = Math.max(1, num2);
      const quotientMin = num1Digits > num2Digits ? Math.pow(10, num1Digits - num2Digits - 1) : 1;
      const quotientMax = Math.max(quotientMin + 1, Math.floor(max1 / num2));
      const quotient = Math.floor(Math.random() * (quotientMax - quotientMin + 1)) + quotientMin;
      correctAnswer = Math.max(1, quotient);
      num1 = num2 * correctAnswer;
    } else {
      num2 = Math.max(1, num2);
      correctAnswer = Math.floor(num1 / num2);
    }
    methodTip = digitMethodTip(num1Digits, num2Digits, '÷');
    if (num2 <= 9 && correctAnswer <= 9) {
      const rhyme = getMultiplyRhyme(num2, correctAnswer);
      explanation = tr(`【想乘算除】口诀：“${rhyme}”，所以 ${num1} ÷ ${num2} = ${correctAnswer}。`, `[Think Multiply] ${rhyme}, so ${num1} ÷ ${num2} = ${correctAnswer}.`);
    } else {
      explanation = tr(`${num1} ÷ ${num2} = ${correctAnswer}。试商后高位向低位逐级整除。`, `${num1} ÷ ${num2} = ${correctAnswer}. Divide step by step from highest place.`);
    }
  }

  return {
    id,
    num1,
    num2,
    operator,
    operatorSymbol,
    correctAnswer,
    explanation,
    methodTip,
    difficultyGrade: tr(`${num1Digits}位×${num2Digits}位专项`, `${num1Digits}×${num2Digits}-digit drill`)
  };
}

export function generateQuestionBatchByRule(
  count: number,
  rule: {
    operations: OperationType[];
    num1Digits: number;
    num2Digits: number;
    allowCarry?: boolean;
    allowBorrow?: boolean;
    mustDivideClean?: boolean;
  }
): MathQuestion[] {
  const result: MathQuestion[] = [];
  const seenSignatures = new Set<string>();
  const ops: OperationType[] = rule.operations.length > 0 ? rule.operations : ['add'];

  let attempts = 0;
  while (result.length < count && attempts < count * 8) {
    attempts++;
    const op = ops[Math.floor(Math.random() * ops.length)];
    const q = generateQuestionByDigits(op, rule.num1Digits, rule.num2Digits, {
      allowCarry: rule.allowCarry,
      allowBorrow: rule.allowBorrow,
      mustDivideClean: rule.mustDivideClean
    });
    const sig = `${q.num1}${q.operatorSymbol}${q.num2}`;
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      result.push(q);
    }
  }

  while (result.length < count) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    result.push(generateQuestionByDigits(op, rule.num1Digits, rule.num2Digits));
  }

  return result;
}

// Preset standard banks
export const PRESET_QUESTION_BANKS = [
  {
    id: 'bank_preset_1',
    get name() { return tr('一位数加减心算 (20以内进退位)', '1-Digit Add & Sub (Up to 20)'); },
    get description() { return tr('1位数与1位数的加减法，强化凑十法与破十法口诀', '1-digit + / − with Make-10 and Break-10 practice'); },
    operations: ['add', 'subtract'] as OperationType[],
    num1Digits: 1,
    num2Digits: 1,
    allowCarry: true,
    allowBorrow: true,
    mustDivideClean: true,
    isPreset: true,
    createdAt: 1700000000000
  },
  {
    id: 'bank_preset_2',
    get name() { return tr('九九乘法口诀表专项', 'Times Tables (1–9)'); },
    get description() { return tr('1位数乘以1位数，全面覆盖1~9九九乘法表', '1-digit × 1-digit covering the full 1–9 times tables'); },
    operations: ['multiply'] as OperationType[],
    num1Digits: 1,
    num2Digits: 1,
    allowCarry: true,
    allowBorrow: true,
    mustDivideClean: true,
    isPreset: true,
    createdAt: 1700000001000
  },
  {
    id: 'bank_preset_3',
    get name() { return tr('表内整除除法', 'Basic Exact Division'); },
    get description() { return tr('两位数除以一位数 (商为1位数)，训练想乘算除思维', '2-digit ÷ 1-digit with 1-digit quotient (think multiply)'); },
    operations: ['divide'] as OperationType[],
    num1Digits: 2,
    num2Digits: 1,
    allowCarry: true,
    allowBorrow: true,
    mustDivideClean: true,
    isPreset: true,
    createdAt: 1700000002000
  },
  {
    id: 'bank_preset_4',
    get name() { return tr('两位数加减一位数', '2-Digit ± 1-Digit'); },
    get description() { return tr('2位数与1位数混合运算，巩固数位概念与进退位', 'Mixed 2-digit and 1-digit + / − with carrying & borrowing'); },
    operations: ['add', 'subtract'] as OperationType[],
    num1Digits: 2,
    num2Digits: 1,
    allowCarry: true,
    allowBorrow: true,
    mustDivideClean: true,
    isPreset: true,
    createdAt: 1700000003000
  },
  {
    id: 'bank_preset_5',
    get name() { return tr('两位数与两位数进阶四则', '2-Digit × 2-Digit Mixed'); },
    get description() { return tr('2位数与2位数综合训练，提升高年级速算耐力', '2-digit mixed operations to boost mental math stamina'); },
    operations: ['add', 'subtract', 'multiply'] as OperationType[],
    num1Digits: 2,
    num2Digits: 2,
    allowCarry: true,
    allowBorrow: true,
    mustDivideClean: true,
    isPreset: true,
    createdAt: 1700000004000
  },
  {
    id: 'bank_preset_6',
    get name() { return tr('三位数加减巧算特训', '3-Digit Add & Sub Tricks'); },
    get description() { return tr('3位数与2/3位数加减法，培养凑整、拆分简算技巧', '3-digit + / − building rounding and splitting shortcuts'); },
    operations: ['add', 'subtract'] as OperationType[],
    num1Digits: 3,
    num2Digits: 2,
    allowCarry: true,
    allowBorrow: true,
    mustDivideClean: true,
    isPreset: true,
    createdAt: 1700000005000
  }
];

