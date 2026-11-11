import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { createSyncPayload, getMistakes, getParentSettings, getPracticeSessions, generateWeChatReport } from '../utils/storage';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Wifi,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import { useLang } from '../i18n';

interface MobileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMobileView: () => void;
}

export const MobileSyncModal: React.FC<MobileSyncModalProps> = ({
  isOpen,
  onClose,
  onOpenMobileView
}) => {
  const { t } = useLang();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedWeChat, setCopiedWeChat] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<'synced' | 'syncing'>('synced');

  const mistakes = getMistakes();
  const settings = getParentSettings();
  const sessions = getPracticeSessions();

  useEffect(() => {
    if (!isOpen) return;

    // Create sync payload (includes recent sessions with full question attempts)
    const payload = createSyncPayload();
    const baseUrl = window.location.origin + window.location.pathname;
    const fullUrl = `${baseUrl}?sync=${payload}#mobile`;
    setSyncUrl(fullUrl);

    // Generate short pairing code from hash of timestamp + count
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPairingCode(code);

    // Save pairing code to localStorage so mobile companion can also pair via code in same browser
    localStorage.setItem('math_latest_pairing_code', code);
    localStorage.setItem('math_latest_pairing_payload', payload);

    // Render QR Code
    QRCode.toDataURL(
      fullUrl,
      {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(syncUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyLatestReport = () => {
    if (sessions.length > 0) {
      const text = generateWeChatReport(sessions[0], settings.studentName);
      navigator.clipboard.writeText(text).then(() => {
        setCopiedWeChat(true);
        setTimeout(() => setCopiedWeChat(false), 2000);
      });
    }
  };

  const handleSimulatePush = () => {
    setPushStatus('syncing');
    setTimeout(() => {
      setPushStatus('synced');
      alert(
        t(
          `已成功重新广播同步包：已包含 ${sessions.length} 轮挑战的每题答题流水与 ${mistakes.length} 道错题！`,
          `Sync package re-broadcast: includes per-question logs from ${sessions.length} challenge(s) and ${mistakes.length} mistake(s)!`
        )
      );
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-4 border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mb-2.5">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            {t('挑战数据与每题用时同步至家长手机', 'Sync Challenge Data to Parent\'s Phone')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              '每次挑战完成，每道题的做题准确率与精确耗时已全部归档，手机扫码即可随时查阅。',
              'Accuracy and exact time for every question are archived after each challenge. Scan to view anytime.'
            )}
          </p>
        </div>

        {/* Sync Status Banner */}
        <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">
              {t(
                `数据包已就绪 · 已包含 ${sessions.length} 轮挑战每题流水 & ${mistakes.length} 道错题`,
                `Data ready · ${sessions.length} challenge log(s) & ${mistakes.length} mistake(s)`
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSimulatePush}
            className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 self-end sm:self-auto"
          >
            <Send className="w-3 h-3" />
            <span>{t('重新打包广播', 'Re-broadcast')}</span>
          </button>
        </div>

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={t('手机扫码同步错题', 'Scan to sync mistakes')}
              className="w-48 h-48 rounded-xl border border-slate-100 shadow-xs"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
              {t('正在生成同步二维码...', 'Generating QR code...')}
            </div>
          )}

          <div className="mt-3 text-center">
            <div className="text-xs font-semibold text-slate-800 flex items-center justify-center gap-1">
              <QrCode className="w-4 h-4 text-amber-600" />
              <span>{t('使用微信、相机或浏览器扫码同步', 'Scan with WeChat, camera or browser')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('扫码后自动打开移动端专用界面，免下载即刻体验', 'Opens the mobile view instantly — no download needed')}
            </p>
          </div>
        </div>

        {/* Pairing Code & Direct Link */}
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-amber-800 font-medium">{t('6位数同步配对口令：', '6-digit pairing code:')}</div>
              <div className="text-lg font-mono font-extrabold text-amber-900 tracking-wider">
                {pairingCode}
              </div>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-1 rounded-md font-mono">
              {t('有效期 24小时', 'Valid 24h')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={syncUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-500 truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('已复制', 'Copied') : t('复制链接', 'Copy link')}</span>
            </button>
          </div>
        </div>

        {/* Quick WeChat Broadcast Copy & Direct Mobile Simulator */}
        <div className="mt-4 space-y-2.5">
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={handleCopyLatestReport}
              className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedWeChat ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWeChat
                  ? t('已复制微信战报！可直接粘贴至群聊', 'Report copied! Paste it into your chat')
                  : t('📋 一键复制最近一次挑战的微信学情战报', '📋 Copy latest challenge report for WeChat')}</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMobileView();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>{t('在当前屏幕打开“手机随身练”视图', 'Open “Mobile Practice” view here')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
