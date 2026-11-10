import React from 'react';
import { Volume2, VolumeX, Smartphone } from 'lucide-react';
import { sound } from '../utils/soundEffects';

interface NavbarProps {
  currentTab: 'practice' | 'mistakes' | 'parent' | 'mobile';
  onSelectTab: (tab: 'practice' | 'mistakes' | 'parent' | 'mobile') => void;
  mistakeCount: number;
  onOpenMobileSync: () => void;
  onStartNewPractice: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  mistakeCount,
  onOpenMobileSync,
  onStartNewPractice,
  isMuted,
  onToggleMute
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div 
          onClick={() => onSelectTab('practice')} 
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-display font-bold text-lg shadow-sm">
            象
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            小象速算
          </span>
        </div>

        {/* Zone 2: 4-5 Clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('practice')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              currentTab === 'practice'
                ? 'border-amber-500 text-slate-950 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            口算训练擂台
          </button>

          <button
            onClick={() => onSelectTab('mistakes')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              currentTab === 'mistakes'
                ? 'border-amber-500 text-slate-950 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <span>智能错题集</span>
            {mistakeCount > 0 && (
              <span className="text-xs font-mono font-medium text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                {mistakeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('parent')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              currentTab === 'parent'
                ? 'border-amber-500 text-slate-950 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            家长学情看板
          </button>

          <button
            onClick={() => onSelectTab('mobile')}
            className={`flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              currentTab === 'mobile'
                ? 'border-amber-500 text-slate-950 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span>手机随身练</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Utility items */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMute}
            title={isMuted ? '开启声音' : '静音'}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
          </button>

          <button
            onClick={onOpenMobileSync}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>扫码同步手机</span>
          </button>

          <button
            onClick={onStartNewPractice}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            开始5秒挑战
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar for touch ergonomics */}
      <div className="md:hidden flex border-t border-slate-100 bg-white px-2 py-1.5 justify-around text-xs">
        <button
          onClick={() => onSelectTab('practice')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
            currentTab === 'practice' ? 'bg-amber-50 text-amber-700' : 'text-slate-600'
          }`}
        >
          口算挑战
        </button>
        <button
          onClick={() => onSelectTab('mistakes')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
            currentTab === 'mistakes' ? 'bg-amber-50 text-amber-700' : 'text-slate-600'
          }`}
        >
          <span>错题集</span>
          {mistakeCount > 0 && <span className="text-[10px] text-rose-500 font-mono">({mistakeCount})</span>}
        </button>
        <button
          onClick={() => onSelectTab('parent')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
            currentTab === 'parent' ? 'bg-amber-50 text-amber-700' : 'text-slate-600'
          }`}
        >
          家长看板
        </button>
        <button
          onClick={() => onSelectTab('mobile')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
            currentTab === 'mobile' ? 'bg-amber-50 text-amber-700' : 'text-slate-600'
          }`}
        >
          随身练
        </button>
      </div>
    </header>
  );
};
