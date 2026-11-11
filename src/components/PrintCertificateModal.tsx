import React, { useState } from 'react';
import { BadgeItem } from '../types/math';
import { getParentSettings } from '../utils/storage';
import { Printer, X, Heart } from 'lucide-react';
import { useLang } from '../i18n';

interface PrintCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: BadgeItem | null;
  allUnlockedBadges: BadgeItem[];
  stats: {
    distinctDays: number;
    totalCorrect: number;
  };
}

const DEFAULT_NOTE_ZH = '愿你带着对数学的热爱与好奇心，勇敢探索，快乐成长！';
const DEFAULT_NOTE_EN = 'Keep your curiosity and love for math alive — explore boldly and grow happily!';

export const PrintCertificateModal: React.FC<PrintCertificateModalProps> = ({
  isOpen,
  onClose,
  badge,
  allUnlockedBadges,
  stats
}) => {
  const { t, lang } = useLang();
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(badge);
  const [parentNote, setParentNote] = useState<string>(DEFAULT_NOTE_ZH);
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  // Sync selected badge if prop changes
  React.useEffect(() => {
    if (badge) setSelectedBadge(badge);
    else if (allUnlockedBadges.length > 0) setSelectedBadge(allUnlockedBadges[0]);
  }, [badge, allUnlockedBadges]);

  const settings = getParentSettings();

  if (!isOpen) return null;

  const activeBadge = selectedBadge || allUnlockedBadges[0];
  const currentDate = new Date();
  const dateFormatted =
    lang === 'en'
      ? currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : `${currentDate.getFullYear()} 年 ${currentDate.getMonth() + 1} 月 ${currentDate.getDate()} 日`;

  const displayNote =
    parentNote === DEFAULT_NOTE_ZH || parentNote === DEFAULT_NOTE_EN
      ? t(DEFAULT_NOTE_ZH, DEFAULT_NOTE_EN)
      : parentNote;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Top Control Bar - Hidden on print */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">
                {t('数学达人荣誉奖励证书', 'Math Master Award Certificate')}
              </h2>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {t('家长可即刻打印颁发', 'Ready to Print')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                '为孩子解锁的每一枚学习勋章颁发纸质证书，满满仪式感与成就感。',
                'Print an award certificate for every unlocked badge to celebrate your child’s progress.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {allUnlockedBadges.length > 1 && (
              <select
                value={activeBadge?.id}
                onChange={e => {
                  const b = allUnlockedBadges.find(x => x.id === e.target.value);
                  if (b) setSelectedBadge(b);
                }}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                {allUnlockedBadges.map(b => (
                  <option key={b.id} value={b.id}>
                    {t('勋章', 'Badge')}: {b.title} ({b.iconEmoji})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t('立即打印证书', 'Print Certificate')}</span>
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

        {/* Certificate Paper Sheet (Landscape Proportion) */}
        <div className="bg-[#FFFDF7] p-8 sm:p-12 border-8 border-[#D4AF37] rounded-2xl relative shadow-md print:shadow-none print:border-8 print:border-[#B8860B] print:m-0 print:p-8">
          {/* Ornate Inner Border Line */}
          <div className="border-2 border-[#D4AF37]/60 border-dashed p-6 sm:p-8 rounded-xl relative">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 text-[#B8860B] font-serif text-lg leading-none">✦</div>
            <div className="absolute top-2 right-2 text-[#B8860B] font-serif text-lg leading-none">✦</div>
            <div className="absolute bottom-2 left-2 text-[#B8860B] font-serif text-lg leading-none">✦</div>
            <div className="absolute bottom-2 right-2 text-[#B8860B] font-serif text-lg leading-none">✦</div>

            {/* Header Badge & Title */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md mb-2">
                <span className="text-3xl">{activeBadge?.iconEmoji || '🏆'}</span>
              </div>

              <div className="text-xs uppercase tracking-widest text-[#B8860B] font-semibold">
                HONORARY AWARD CERTIFICATE
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-widest text-[#8B0000] mt-1 mb-6">
                {t('荣 誉 证 书', 'CERTIFICATE OF HONOR')}
              </h1>
            </div>

            {/* Recipient Line */}
            <div className="text-center sm:text-left text-base sm:text-lg text-slate-800 font-serif mb-4">
              {lang === 'en' && <span className="mr-2 font-medium">Presented to</span>}
              <span className="font-bold border-b-2 border-slate-700 pb-1 px-4 text-xl sm:text-2xl text-slate-900 inline-block font-sans">
                {settings.studentName}
              </span>
              <span className="ml-2 font-medium">{t('同学：', ':')}</span>
            </div>

            {/* Main Citation Paragraph */}
            {lang === 'en' ? (
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 font-serif text-justify">
                In recognition of outstanding dedication in mental math training, practicing across{' '}
                <strong className="font-bold text-[#8B0000] text-lg font-mono">{stats.distinctDays}</strong> day(s) and
                correctly solving{' '}
                <strong className="font-bold text-[#8B0000] text-lg font-mono">{stats.totalCorrect}</strong> math
                problems with speed and perseverance, we proudly present the
              </p>
            ) : (
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 font-serif indent-8 text-justify">
                鉴于你在小学数学口算思维训练中表现卓越，累计坚持练习{' '}
                <strong className="font-bold text-[#8B0000] text-lg font-mono">{stats.distinctDays}</strong> 天，
                成功答对突破{' '}
                <strong className="font-bold text-[#8B0000] text-lg font-mono">{stats.totalCorrect}</strong> 道数学口算题，
                在5秒倒计时速算挑战中思维敏捷、持之以恒，特此授予你
              </p>
            )}

            {/* Highlighted Badge Award Card */}
            <div className="my-6 py-4 px-6 bg-gradient-to-r from-amber-100/60 via-amber-50 to-amber-100/60 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-3xl shadow-sm shrink-0">
                  {activeBadge?.iconEmoji}
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    {activeBadge?.category === 'days'
                      ? t('坚持打卡里程碑荣誉', 'Streak Milestone Honor')
                      : activeBadge?.category === 'correct'
                      ? t('百题斩数学达人荣誉', 'Problem Solver Honor')
                      : t('极速心算专项成就', 'Speed Math Achievement')}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                    {t(`【 ${activeBadge?.title} 】勋章`, `"${activeBadge?.title}" Badge`)}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{activeBadge?.description}</p>
                </div>
              </div>

              <div className="shrink-0 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400 text-amber-900 text-xs font-bold font-mono">
                {activeBadge?.rarity === 'diamond'
                  ? t('💎 钻石大师级', '💎 Diamond Tier')
                  : activeBadge?.rarity === 'gold'
                  ? t('👑 黄金王者级', '👑 Gold Tier')
                  : t('🌟 标兵进阶级', '🌟 Silver/Bronze Tier')}
              </div>
            </div>

            {/* Parent Custom Encouragement Note */}
            <div className="my-4 p-3 bg-white/70 border border-amber-200/80 rounded-xl text-xs text-slate-600 italic flex items-start gap-2">
              <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 fill-rose-500" />
              <div className="flex-1">
                <span className="font-bold text-slate-800 not-italic">{t('家长寄语：', 'Parent Note: ')}</span>
                {isEditingNote ? (
                  <div className="no-print mt-1.5 flex gap-2">
                    <input
                      type="text"
                      value={displayNote}
                      onChange={e => setParentNote(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs border border-amber-400 rounded-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs"
                    >
                      {t('确定', 'OK')}
                    </button>
                  </div>
                ) : (
                  <span>
                    “{displayNote}”
                    <button
                      type="button"
                      onClick={() => {
                        setParentNote(displayNote);
                        setIsEditingNote(true);
                      }}
                      className="no-print ml-2 text-[11px] text-amber-700 not-italic hover:underline"
                    >
                      {t('(修改寄语)', '(Edit note)')}
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Certificate Signatures & Red Official Seal */}
            <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 relative font-serif text-xs text-slate-700">
              <div className="space-y-1 text-center sm:text-left">
                <div>
                  {t('发证单位：', 'Issued by: ')}
                  <strong>{t('小象速算智慧思维评定中心', 'Elephant Math Academy')}</strong>
                </div>
                <div>
                  {t('见证家长签名：', 'Parent Signature: ')}
                  <span className="inline-block border-b border-slate-400 w-36"></span>
                </div>
              </div>

              {/* Red Seal Stamp */}
              <div className="relative flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-4 border-dashed border-[#B22222] text-[#B22222] flex flex-col items-center justify-center text-center p-2 transform -rotate-12 select-none shadow-xs bg-[#B22222]/5">
                  <div className="text-[10px] font-bold tracking-widest">{t('★ 卓越成就 ★', '★ EXCELLENCE ★')}</div>
                  <div className="text-xs font-black font-serif my-0.5">{t('小象速算', 'Elephant Math')}</div>
                  <div className="text-[9px] font-bold">{t('官方认证印章', 'Official Seal')}</div>
                  <div className="text-[8px] font-mono mt-0.5">{currentDate.getFullYear()}</div>
                </div>
              </div>

              <div className="space-y-1 text-center sm:text-right font-mono">
                <div>
                  {t('发证日期：', 'Date: ')}
                  {dateFormatted}
                </div>
                <div>
                  {t('证书编号：', 'Cert ID: ')}XX-{Math.floor(100000 + Math.random() * 900000)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
