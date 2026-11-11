import { PracticeSessionResult, QuestionAttempt } from '../types/math';
import { tr, getLang } from '../i18n';

export interface AiDiagnosisResult {
  overallRating: 'perfect' | 'excellent' | 'steady' | 'needs_practice';
  headline: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  fluencyScore: number;
  sub5SecRate: number;
  fastestTime: number;
}

/**
 * AI 智能学情诊断引擎
 * 针对单次练习的做题流水、用时分布、算式结构与错因模式，进行深度启发式学情诊断与教学建议生成
 */
export function generateAiDiagnosis(session: PracticeSessionResult): AiDiagnosisResult {
  const total = session.totalQuestions || session.attempts.length || 1;
  const correctCount = session.correctCount;
  const accuracy = session.accuracyRate;
  const avgTime = session.averageTimeSec;

  const mistakes = session.attempts.filter(a => !a.isCorrect);
  const correctAttempts = session.attempts.filter(a => a.isCorrect);

  // Sub-5s calculation
  const sub5SecCount = session.attempts.filter(a => a.isCorrect && a.timeSpentSec <= 5.0).length;
  const sub5SecRate = Math.round((sub5SecCount / total) * 100);

  const fastestTime = correctAttempts.reduce(
    (min, a) => (a.timeSpentSec < min ? a.timeSpentSec : min),
    correctAttempts.length > 0 ? correctAttempts[0].timeSpentSec : 0
  );

  // Operation breakdowns
  const opMap: Record<string, { total: number; correct: number; time: number; timeouts: number }> = {};
  session.attempts.forEach(a => {
    const sym = a.question.operatorSymbol;
    if (!opMap[sym]) opMap[sym] = { total: 0, correct: 0, time: 0, timeouts: 0 };
    opMap[sym].total++;
    if (a.isCorrect) opMap[sym].correct++;
    opMap[sym].time += a.timeSpentSec;
    if (a.isTimeout) opMap[sym].timeouts++;
  });

  // Method tips error analysis
  const tipErrors: Record<string, number> = {};
  mistakes.forEach(m => {
    const tip = m.question.methodTip || tr('基础口算', 'Basic Math');
    tipErrors[tip] = (tipErrors[tip] || 0) + 1;
  });

  // Error pattern heuristics:
  // 1. Off-by-one errors (进位忘记加一 / 退位忘记减一)
  let offByOneCount = 0;
  // 2. Sign confusion (加减混淆)
  let signConfusionCount = 0;
  // 3. Timeout hesitations
  const timeoutCount = session.timeoutCount;

  mistakes.forEach(m => {
    if (m.isTimeout || m.userAnswer === undefined || m.userAnswer === null) return;
    const diff = Math.abs(m.userAnswer - m.question.correctAnswer);
    if (diff === 1 || diff === 10) {
      offByOneCount++;
    }
    // Check if kid added instead of subtracted
    if (m.question.operatorSymbol === '-' && m.userAnswer === m.question.num1 + m.question.num2) {
      signConfusionCount++;
    } else if (m.question.operatorSymbol === '+' && m.userAnswer === Math.abs(m.question.num1 - m.question.num2)) {
      signConfusionCount++;
    }
  });

  // Calculate Fluency Score (0 - 100)
  // Accuracy (60% weight) + Speed consistency (40% weight)
  const speedScore = Math.max(0, Math.min(100, Math.round(((5.5 - Math.min(avgTime, 5.5)) / 4.0) * 100)));
  const fluencyScore = Math.min(100, Math.round(accuracy * 0.65 + speedScore * 0.35));

  // Determine overall rating
  let overallRating: AiDiagnosisResult['overallRating'] = 'needs_practice';
  if (accuracy === 100 && avgTime <= 4.0) {
    overallRating = 'perfect';
  } else if (accuracy >= 85) {
    overallRating = 'excellent';
  } else if (accuracy >= 70) {
    overallRating = 'steady';
  }

  // Generate Headline
  let headline = '';
  if (overallRating === 'perfect') {
    headline = tr(
      '速算神经通路高度通畅，准确率与心算节奏达到顶尖水平！',
      'Peak mental math fluency — perfect accuracy and lightning-fast rhythm!'
    );
  } else if (overallRating === 'excellent') {
    headline = tr(
      '计算基础非常扎实，心算反应灵敏，稍加专注即可冲刺大满贯！',
      'Solid math foundation and quick reflexes — close to a perfect score!'
    );
  } else if (overallRating === 'steady') {
    headline = tr(
      '具备良好心算感知，个别运算类型存在犹豫，需强化专项条件反射。',
      'Good baseline intuition; minor hesitation on specific question types.'
    );
  } else {
    headline = tr(
      '处于口算进阶蓄力期，建议通过极速闪卡与口诀拆解建立直觉信心。',
      'Building mental math skills — use flashcards and step-by-step tricks.'
    );
  }

  // Strengths
  const strengths: string[] = [];
  if (sub5SecRate >= 80) {
    strengths.push(
      tr(
        `⚡ 5秒极速达标率高达 ${sub5SecRate}%，心算提取速度极快。`,
        `⚡ ${sub5SecRate}% answered within 5.0s, showing fast retrieval reflexes.`
      )
    );
  } else if (sub5SecRate >= 50) {
    strengths.push(
      tr(
        `⏱️ 超过半数题目（${sub5SecCount}题）在5秒限时内顺利拿下。`,
        `⏱️ Over half of the questions (${sub5SecCount} Qs) solved within 5.0s.`
      )
    );
  }

  if (fastestTime > 0 && fastestTime <= 2.5) {
    strengths.push(
      tr(
        `🔥 最快答题耗时仅 ${fastestTime.toFixed(1)} 秒，展现出极强的数感火花。`,
        `🔥 Fastest answer took only ${fastestTime.toFixed(1)}s, demonstrating sharp number sense.`
      )
    );
  }

  // Operation strengths
  const opNames: Record<string, string> = {
    '+': tr('加法', 'Addition'),
    '-': tr('减法', 'Subtraction'),
    '×': tr('乘法', 'Multiplication'),
    '÷': tr('除法', 'Division')
  };

  Object.entries(opMap).forEach(([sym, stats]) => {
    if (stats.total >= 2 && stats.correct === stats.total) {
      const avg = (stats.time / stats.total).toFixed(1);
      strengths.push(
        tr(
          `✨ ${opNames[sym]}全部全对（${stats.correct}/${stats.total} 题，均速 ${avg}s），表现稳健。`,
          `✨ 100% in ${opNames[sym]} (${stats.correct}/${stats.total} Qs, avg ${avg}s), highly dependable.`
        )
      );
    }
  });

  if (strengths.length === 0) {
    strengths.push(
      tr(
        '🌟 认真完成了全部答题挑战，展现出良好的坚持与专注品质。',
        '🌟 Completed all questions with full focus and persistence.'
      )
    );
  }

  // Weaknesses & Root Causes
  const weaknesses: string[] = [];
  if (timeoutCount > 0) {
    weaknesses.push(
      tr(
        `⏳ 存在 ${timeoutCount} 道题目因超过 5 秒未作答，表明在部分高位数或进退位心算时有停顿犹豫。`,
        `⏳ ${timeoutCount} question${timeoutCount > 1 ? 's' : ''} timed out (>5.0s), indicating hesitation during carry/borrow calculations.`
      )
    );
  }

  if (offByOneCount > 0) {
    weaknesses.push(
      tr(
        `🔍 发现 ${offByOneCount} 题答案与正确值仅差 1（或差10），典型为“个位进位十位未加一”或“借位后高位忘记减一”的细心问题。`,
        `🔍 ${offByOneCount} answer${offByOneCount > 1 ? 's' : ''} differed by 1 (or 10), typically caused by carry/borrow bookkeeping slips.`
      )
    );
  }

  if (signConfusionCount > 0) {
    weaknesses.push(
      tr(
        `⚠️ 发现符号看错或加减混淆现象，答题冲刺过快时需先看清运算符号。`,
        `⚠️ Signs were mixed up during quick answers — remind the student to confirm +, − before typing.`
      )
    );
  }

  // Check weakest operation
  let weakestSym: string | null = null;
  let lowestAcc = 100;
  Object.entries(opMap).forEach(([sym, stats]) => {
    const acc = Math.round((stats.correct / stats.total) * 100);
    if (stats.total >= 2 && acc < lowestAcc) {
      lowestAcc = acc;
      weakestSym = sym;
    }
  });

  if (weakestSym && lowestAcc < 75) {
    weaknesses.push(
      tr(
        `🎯 ${opNames[weakestSym]}相对薄弱（正确率 ${lowestAcc}%），是后续提分提速的关键攻克点。`,
        `🎯 ${opNames[weakestSym]} is the current bottleneck (${lowestAcc}% accuracy) — primary target for focus.`
      )
    );
  }

  if (weaknesses.length === 0 && mistakes.length === 0) {
    weaknesses.push(
      tr('🎉 本轮零失误！各项四则运算表现均衡，未发现明显思维断层。', '🎉 Flawless round! Balanced performance with no noticeable gaps.')
    );
  }

  // Recommendations
  const recommendations: string[] = [];
  if (mistakes.length > 0) {
    recommendations.push(
      tr(
        `1. 【即时清零】：点击下方“专项攻克”，立刻重练本轮 ${mistakes.length} 道错题，趁热打铁打通思路。`,
        `1. [Immediate Retry]: Click "Retry Mistakes" to redo the ${mistakes.length} missed question${mistakes.length > 1 ? 's' : ''} right away.`
      )
    );
  }

  if (timeoutCount > 0) {
    recommendations.push(
      tr(
        '2. 【强化闪卡】：在手机随身练中使用极速闪卡翻看口算技巧，训练对进退位的直觉反射。',
        '2. [Flashcard Drill]: Use Mobile Flashcards to review trick cards and build sub-conscious recall.'
      )
    );
  } else if (offByOneCount > 0) {
    recommendations.push(
      tr(
        '2. 【双重自检】：算完个位后，默念进位小标记，养成十位数心算时“必查进借位”的良好微习惯。',
        '2. [Double Check]: Murmur the carry/borrow reminder to turn checking into an automatic second reflex.'
      )
    );
  } else {
    recommendations.push(
      tr(
        '2. 【乘胜追击】：尝试进入题库组卷或高级挑战，适当提升数字位数或混合运算难度！',
        '2. [Level Up]: Try Question Bank Manager to practice mixed operations or multi-digit challenges!'
      )
    );
  }

  // Summary Paragraph
  const summary = tr(
    `本轮测试总计 ${total} 题，学员正确率 ${accuracy}%，平均耗时 ${avgTime}s。综合流畅度得分 ${fluencyScore} 分。` +
      (mistakes.length === 0
        ? '学员展现了出色的心算敏捷度与稳定的抗压心态，5秒内完成度极高。'
        : `主要失分点集中在${Object.keys(tipErrors).slice(0, 2).join('、')}，建议结合专项针对性训练，帮助孩子跨越思维瓶颈。`),
    `Completed ${total} questions with ${accuracy}% accuracy and ${avgTime}s average time. Fluency score: ${fluencyScore}/100. ` +
      (mistakes.length === 0
        ? 'Outstanding mental math reflex and steady focus under the 5-second timer.'
        : `Areas for improvement focus on ${Object.keys(tipErrors).slice(0, 2).join(', ')}. Targeted review will close these gaps effectively.`)
  );

  return {
    overallRating,
    headline,
    summary,
    strengths,
    weaknesses,
    recommendations,
    fluencyScore,
    sub5SecRate,
    fastestTime
  };
}
