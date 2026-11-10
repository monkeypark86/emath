import React, { useState } from 'react';
import { MathQuestion } from '../types/math';
import { Printer, X, Eye, EyeOff } from 'lucide-react';
import { getParentSettings } from '../utils/storage';

interface PrintWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: MathQuestion[];
  title?: string;
}

export const PrintWorksheetModal: React.FC<PrintWorksheetModalProps> = ({
  isOpen,
  onClose,
  questions,
  title = '小学生口算特训练习纸'
}) => {
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);
  const [isVerticalPaper, setIsVerticalPaper] = useState<boolean>(true); // 试卷公式立着 / 竖式计算卷
  const settings = getParentSettings();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Modal Controls - Hidden during print */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">打印练习纸预览</h2>
            <p className="text-xs text-slate-500">
              专为纸笔书写排版设计，支持立式（竖式）与横式无缝切换。
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Vertical vs Horizontal */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setIsVerticalPaper(true)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  isVerticalPaper ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                立式 (竖式卷)
              </button>
              <button
                type="button"
                onClick={() => setIsVerticalPaper(false)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  !isVerticalPaper ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                横式卷
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
            >
              {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showAnswerKey ? '隐藏答案' : '显示答案'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>立即打印 / 存为PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="bg-white p-6 sm:p-8 border border-slate-100 print:border-none print:p-0">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <h1 className="text-2xl font-bold font-serif tracking-wider text-slate-900">
              {title} {isVerticalPaper ? '(竖式计算专练)' : '(口算专练)'}
            </h1>
            <div className="flex justify-between items-center text-xs text-slate-600 mt-4 px-2 font-mono">
              <span>姓名：<span className="inline-block border-b border-slate-400 min-w-[80px] text-center font-bold">{settings.studentName}</span></span>
              <span>日期：<span className="inline-block border-b border-slate-400 min-w-[100px] text-center">{new Date().toLocaleDateString()}</span></span>
              <span>限时：<span className="inline-block border-b border-slate-400 min-w-[60px] text-center">5分钟</span></span>
              <span>得分：<span className="inline-block border-b border-slate-400 min-w-[60px] text-center">_____ 分</span></span>
            </div>
          </div>

          {/* Questions Grid */}
          {isVerticalPaper ? (
            /* Vertical Column Calculation Sheet (立着显示) */
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-8 gap-x-6 py-8 font-mono text-base">
              {questions.map((q, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="text-xs text-slate-400 mb-1 w-full text-left font-sans">
                    ({idx + 1})
                  </div>
                  <div className="inline-flex flex-col items-end min-w-[80px]">
                    {/* Num 1 */}
                    <div className="font-bold text-slate-900 tracking-widest text-lg pr-1">
                      {q.num1}
                    </div>
                    {/* Operator + Num 2 */}
                    <div className="flex items-center justify-between w-full font-bold text-slate-900 tracking-widest text-lg pr-1">
                      <span className="text-sm font-sans mr-2">{q.operatorSymbol}</span>
                      <span>{q.num2}</span>
                    </div>
                    {/* Divider line */}
                    <div className="w-full h-0.5 bg-slate-900 my-1"></div>
                    {/* Blank space for answer */}
                    <div className="h-6 w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Horizontal Math Sheet (横式) */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-8 py-8 font-mono text-base">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between pb-1 border-b border-slate-300">
                  <span className="text-xs text-slate-400 w-6">({idx + 1})</span>
                  <span className="font-bold text-slate-900 tracking-wide">
                    {q.num1} {q.operatorSymbol} {q.num2} =
                  </span>
                  <span className="text-slate-300 min-w-[40px] text-right font-normal">
                    ( &nbsp; &nbsp; )
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Encouraging Footer Note */}
          <div className="text-center text-xs text-slate-400 pt-4 border-t border-dashed border-slate-300">
            💡 小贴士：认真审题，看清符号，运算时注意进位与退位。
          </div>

          {/* Optional Answer Key Section */}
          {showAnswerKey && (
            <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-400 text-xs">
              <div className="font-bold text-slate-800 mb-2 font-serif">参考答案栏：</div>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 font-mono text-slate-600">
                {questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400">({idx + 1})</span> {q.correctAnswer}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
