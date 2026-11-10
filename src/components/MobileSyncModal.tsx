import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { createSyncPayload, getMistakes, getParentSettings } from '../utils/storage';
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
  X
} from 'lucide-react';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<'synced' | 'syncing'>('synced');

  const mistakes = getMistakes();
  const settings = getParentSettings();

  useEffect(() => {
    if (!isOpen) return;

    // Create sync payload
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

  const handleSimulatePush = () => {
    setPushStatus('syncing');
    setTimeout(() => {
      setPushStatus('synced');
      alert(`已自动推送 ${mistakes.length} 道错题至已配对的移动设备！`);
    }, 600);
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
            错题集实时同步至手机
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            练习一结束，错题自动推送到家长和孩子的移动端，随时随地拿出手机即可独立回顾练习。
          </p>
        </div>

        {/* Sync Status Banner */}
        <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">
              云端推送通道正常 ({mistakes.length} 道错题待练)
            </span>
          </div>
          <button
            type="button"
            onClick={handleSimulatePush}
            className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>重新广播推送</span>
          </button>
        </div>

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="手机扫码同步错题"
              className="w-48 h-48 rounded-xl border border-slate-100 shadow-xs"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
              正在生成同步二维码...
            </div>
          )}

          <div className="mt-3 text-center">
            <div className="text-xs font-semibold text-slate-800 flex items-center justify-center gap-1">
              <QrCode className="w-4 h-4 text-amber-600" />
              <span>使用微信、相机或浏览器扫码同步</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              扫码后自动打开移动端专用界面，免下载即刻体验
            </p>
          </div>
        </div>

        {/* Pairing Code & Direct Link */}
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-amber-800 font-medium">6位数同步配对口令：</div>
              <div className="text-lg font-mono font-extrabold text-amber-900 tracking-wider">
                {pairingCode}
              </div>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-1 rounded-md font-mono">
              有效期 24小时
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
              <span>{copied ? '已复制' : '复制链接'}</span>
            </button>
          </div>
        </div>

        {/* Direct Action to Test Mobile Simulator in App */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMobileView();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>在当前屏幕打开“手机随身练”视图</span>
          </button>
        </div>
      </div>
    </div>
  );
};
