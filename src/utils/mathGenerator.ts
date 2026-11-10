import { GradeLevel, MathQuestion, OperationType } from '../types/math';

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
  let difficultyGrade = '二年级基础';

  switch (grade) {
    case 'grade1': {
      difficultyGrade = '一年级(20以内)';
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
          methodTip = '凑十法速算';
          explanation = `【凑十法】把 ${num2} 分成 ${makeTen} 和 ${remaining}，${num1} + ${makeTen} = 10，10 + ${remaining} = ${correctAnswer}。`;
        } else {
          num1 = Math.floor(Math.random() * 9) + 1;
          num2 = Math.floor(Math.random() * (10 - num1)) + 1;
          correctAnswer = num1 + num2;
          methodTip = '10以内不进位';
          explanation = `直接相加：${num1} + ${num2} = ${correctAnswer}。`;
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
          methodTip = '破十法巧算';
          explanation = `【破十法】把 ${num1} 分成 10 和 ${num1 - 10}，先算 10 - ${num2} = ${10 - num2}，再算 ${10 - num2} + ${num1 - 10} = ${correctAnswer}。`;
        } else {
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * num1) + 1;
          correctAnswer = num1 - num2;
          methodTip = '10以内不退位';
          explanation = `倒数相减：${num1} - ${num2} = ${correctAnswer}。`;
        }
      }
      break;
    }

    case 'grade2': {
      difficultyGrade = '二年级(100以内&九九乘除)';
      if (selectedOp === 'multiply') {
        operatorSymbol = '×';
        num1 = Math.floor(Math.random() * 8) + 2; // 2 - 9
        num2 = Math.floor(Math.random() * 8) + 2; // 2 - 9
        correctAnswer = num1 * num2;
        const rhyme = getMultiplyRhyme(num1, num2);
        methodTip = '九九乘法口诀';
        explanation = `【口诀记心间】乘法口诀：“${rhyme}”，因此 ${num1} × ${num2} = ${correctAnswer}。`;
      } else if (selectedOp === 'divide') {
        operatorSymbol = '÷';
        num2 = Math.floor(Math.random() * 8) + 2; // 2 - 9
        correctAnswer = Math.floor(Math.random() * 8) + 2; // 2 - 9
        num1 = num2 * correctAnswer;
        const rhyme = getMultiplyRhyme(num2, correctAnswer);
        methodTip = '表内除法逆向思维';
        explanation = `【想乘算除】想乘法口诀：“${rhyme}”，所以 ${num1} ÷ ${num2} = ${correctAnswer}。`;
      } else if (selectedOp === 'add') {
        operatorSymbol = '+';
        num1 = Math.floor(Math.random() * 60) + 12;
        num2 = Math.floor(Math.random() * (99 - num1)) + 5;
        correctAnswer = num1 + num2;
        methodTip = '整十拆分法';
        explanation = `【拆分相加】先加十位 (${Math.floor(num1/10)*10} + ${Math.floor(num2/10)*10} = ${(Math.floor(num1/10) + Math.floor(num2/10))*10})，再加个位 (${num1%10} + ${num2%10} = ${(num1%10) + (num2%10)})，得 ${correctAnswer}。`;
      } else {
        operatorSymbol = '-';
        num1 = Math.floor(Math.random() * 70) + 25;
        num2 = Math.floor(Math.random() * (num1 - 10)) + 8;
        correctAnswer = num1 - num2;
        methodTip = '退位减法思维';
        explanation = `【先减整十再减个位】${num1} - ${Math.floor(num2/10)*10} = ${num1 - Math.floor(num2/10)*10}，再减 ${num2%10} = ${correctAnswer}。`;
      }
      break;
    }

    case 'grade3': {
      difficultyGrade = '三年级(多位数速算)';
      if (selectedOp === 'multiply') {
        operatorSymbol = '×';
        num1 = Math.floor(Math.random() * 60) + 12; // 两位数
        num2 = Math.floor(Math.random() * 7) + 2; // 一位数
        correctAnswer = num1 * num2;
        methodTip = '拆分乘法';
        explanation = `【拆分法】${num1} × ${num2} = (${Math.floor(num1/10)*10} × ${num2}) + (${num1%10} × ${num2}) = ${Math.floor(num1/10)*10*num2} + ${num1%10*num2} = ${correctAnswer}。`;
      } else if (selectedOp === 'divide') {
        operatorSymbol = '÷';
        num2 = Math.floor(Math.random() * 7) + 3; // 3 - 9
        correctAnswer = Math.floor(Math.random() * 25) + 11; // 两位数商
        num1 = num2 * correctAnswer;
        methodTip = '整除试商法';
        explanation = `【逐步除法】${num1} 先除以 ${num2}：${Math.floor(num1/10)*10} ÷ ${num2} + 余数继续除，商为 ${correctAnswer}。`;
      } else if (selectedOp === 'add') {
        operatorSymbol = '+';
        num1 = Math.floor(Math.random() * 300) + 150;
        num2 = Math.floor(Math.random() * 400) + 80;
        correctAnswer = num1 + num2;
        methodTip = '百位数连加';
        explanation = `【百十个分别相加】${num1} + ${num2} = ${correctAnswer}。`;
      } else {
        operatorSymbol = '-';
        num1 = Math.floor(Math.random() * 500) + 200;
        num2 = Math.floor(Math.random() * (num1 - 50)) + 60;
        correctAnswer = num1 - num2;
        methodTip = '三位数减法';
        explanation = `【高位减法】${num1} - ${num2} = ${correctAnswer}。`;
      }
      break;
    }

    case 'grade4':
    case 'grade5_6': {
      difficultyGrade = grade === 'grade4' ? '四年级(简便巧算)' : '五六年级(综合速算)';
      if (selectedOp === 'multiply') {
        operatorSymbol = '×';
        // 特殊速算技巧：如乘以 11, 25, 15, 或两位数乘两位数
        const isTrick = Math.random() > 0.4;
        if (isTrick) {
          num2 = [11, 15, 25, 5][Math.floor(Math.random() * 4)];
          num1 = num2 === 25 ? (Math.floor(Math.random() * 8) + 2) * 4 : Math.floor(Math.random() * 20) + 12;
          correctAnswer = num1 * num2;
          if (num2 === 25) {
            methodTip = '乘25巧算法 (÷4×100)';
            explanation = `【巧算25】${num1} × 25 = (${num1} ÷ 4) × 100 = ${num1/4} × 100 = ${correctAnswer}。`;
          } else if (num2 === 11) {
            methodTip = '乘11口诀 (两头一拉中间相加)';
            explanation = `【巧算11】两头一拉，中间相加：${num1} × 11 = ${correctAnswer}。`;
          } else {
            methodTip = '因数分解巧算';
            explanation = `【分解法】${num1} × ${num2} = ${correctAnswer}。`;
          }
        } else {
          num1 = Math.floor(Math.random() * 30) + 12;
          num2 = Math.floor(Math.random() * 15) + 11;
          correctAnswer = num1 * num2;
          methodTip = '乘法竖式心算';
          explanation = `【心算竖式】${num1} × ${num2} = ${num1 * 10} + ${num1 * (num2 - 10)} = ${correctAnswer}。`;
        }
      } else if (selectedOp === 'divide') {
        operatorSymbol = '÷';
        num2 = [12, 15, 16, 20, 25][Math.floor(Math.random() * 5)];
        correctAnswer = Math.floor(Math.random() * 20) + 12;
        num1 = num2 * correctAnswer;
        methodTip = '商不变巧算除法';
        explanation = `【巧算除法】${num1} ÷ ${num2} = ${correctAnswer}。`;
      } else if (selectedOp === 'add') {
        operatorSymbol = '+';
        num1 = Math.floor(Math.random() * 600) + 200;
        num2 = Math.floor(Math.random() * 400) + 150;
        correctAnswer = num1 + num2;
        methodTip = '凑整巧算加法';
        explanation = `【凑整法】${num1} + ${num2} = ${correctAnswer}。`;
      } else {
        operatorSymbol = '-';
        num1 = Math.floor(Math.random() * 800) + 300;
        num2 = Math.floor(Math.random() * (num1 - 100)) + 90;
        correctAnswer = num1 - num2;
        methodTip = '高位减法与凑整';
        explanation = `【减整加零】${num1} - ${num2} = ${correctAnswer}。`;
      }
      break;
    }

    case 'custom':
    default: {
      difficultyGrade = '自定义测试';
      if (selectedOp === 'multiply') {
        operatorSymbol = '×';
        num1 = Math.floor(Math.random() * 9) + 2;
        num2 = Math.floor(Math.random() * 9) + 2;
        correctAnswer = num1 * num2;
        methodTip = '乘法口诀';
        explanation = `${num1} × ${num2} = ${correctAnswer} (${getMultiplyRhyme(num1, num2)})`;
      } else if (selectedOp === 'divide') {
        operatorSymbol = '÷';
        num2 = Math.floor(Math.random() * 8) + 2;
        correctAnswer = Math.floor(Math.random() * 9) + 2;
        num1 = num2 * correctAnswer;
        methodTip = '表内除法';
        explanation = `${num1} ÷ ${num2} = ${correctAnswer}`;
      } else if (selectedOp === 'add') {
        operatorSymbol = '+';
        const limit = Math.max(20, maxNumberCustom);
        num1 = Math.floor(Math.random() * (limit / 2)) + 1;
        num2 = Math.floor(Math.random() * (limit / 2)) + 1;
        correctAnswer = num1 + num2;
        methodTip = '加法心算';
        explanation = `${num1} + ${num2} = ${correctAnswer}`;
      } else {
        operatorSymbol = '-';
        const limit = Math.max(20, maxNumberCustom);
        num1 = Math.floor(Math.random() * limit) + 2;
        num2 = Math.floor(Math.random() * num1) + 1;
        correctAnswer = num1 - num2;
        methodTip = '减法心算';
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
  let methodTip = `${num1Digits}位数与${num2Digits}位数`;

  if (operator === 'add') {
    operatorSymbol = '+';
    if (!allowCarry) {
      // Generate numbers where no digit column exceeds 9
      const digits1 = String(num1).split('').map(Number);
      const digits2 = digits1.map(d => Math.floor(Math.random() * (10 - d)));
      num2 = Number(digits2.slice(-num2Digits).join('')) || 1;
    }
    correctAnswer = num1 + num2;
    methodTip += '加法';
    explanation = `${num1} + ${num2} = ${correctAnswer}。先算个位相加，注意进位规则。`;
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
    methodTip += '减法';
    explanation = `${num1} - ${num2} = ${correctAnswer}。先对齐数位，由低位到高位依次相减。`;
  } else if (operator === 'multiply') {
    operatorSymbol = '×';
    correctAnswer = num1 * num2;
    methodTip += '乘法';
    if (num1Digits === 1 && num2Digits === 1) {
      const rhyme = getMultiplyRhyme(num1, num2);
      explanation = `乘法口诀：“${rhyme}”，所以 ${num1} × ${num2} = ${correctAnswer}。`;
    } else {
      explanation = `${num1} × ${num2} = ${correctAnswer}。可将 ${num2} 按数位拆分后分别相乘再相加。`;
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
    methodTip += '整除除法';
    if (num2 <= 9 && correctAnswer <= 9) {
      const rhyme = getMultiplyRhyme(num2, correctAnswer);
      explanation = `【想乘算除】口诀：“${rhyme}”，所以 ${num1} ÷ ${num2} = ${correctAnswer}。`;
    } else {
      explanation = `${num1} ÷ ${num2} = ${correctAnswer}。试商后高位向低位逐级整除。`;
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
    difficultyGrade: `${num1Digits}位×${num2Digits}位专项`
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
    name: '一位数加减心算 (20以内进退位)',
    description: '1位数与1位数的加减法，强化凑十法与破十法口诀',
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
    name: '九九乘法口诀表专项',
    description: '1位数乘以1位数，全面覆盖1~9九九乘法表',
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
    name: '表内整除除法',
    description: '两位数除以一位数 (商为1位数)，训练想乘算除思维',
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
    name: '两位数加减一位数',
    description: '2位数与1位数混合运算，巩固数位概念与进退位',
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
    name: '两位数与两位数进阶四则',
    description: '2位数与2位数综合训练，提升高年级速算耐力',
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
    name: '三位数加减巧算特训',
    description: '3位数与2/3位数加减法，培养凑整、拆分简算技巧',
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

