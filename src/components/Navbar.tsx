import React from 'react';
import {
  Zap,
  BookOpen,
  Sliders,
  BarChart3,
  Smartphone,
  Volume2,
  VolumeX,
  Settings,
  Flame,
  Award
} from 'lucide-react';
import { StudentProfile } from '../types/math';
import { formatGradeLabel } from '../utils/storage';

interface NavbarProps {
  currentTab: 'practice' | 'banks' | 'mistakes' | 'parent' | 'mobile';
  onSelectTab: (tab: 'practice' | 'banks' | 'mistakes' | 'parent' | 'mobile') => void;
  activeStudent: StudentProfile;
  mistakeCount: number;
  onOpenProfileModal: () => void;
  onOpenStudentSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeStudent,
  mistakeCount,
  onOpenProfileModal,
  onOpenStudentSettings,
  isMuted,
  onToggleMute
}) => {
  const navItems = [
    { id: 'practice' as const, label: '口算训练', icon: Zap },
    { id: 'mistakes' as const, label: '智能错题集', icon: Sliders, badge: mistakeCount },
    { id: 'banks' as const, label: '题库组卷', icon: BookOpen },
    { id: 'parent' as const, label: '家长学情看板', icon: BarChart3 },
    { id: 'mobile' as const, label: '手机随身练', icon: Smartphone }
  ];

  return (
    <>
      {/* 顶部主导航栏 (桌面端与移动端顶部通用) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* 1. 左侧：品牌 Logo 与产品标语 */}
          <div
            onClick={() => onSelectTab('practice')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            title="返回口算主页"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-display font-black text-xl shadow-sm group-hover:scale-105 transition-transform">
              象
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-base sm:text-lg tracking-tight text-slate-900 leading-tight flex items-center gap-1.5">
                小象速算
                <span className="hidden sm:inline-block text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
                  思维挑战
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                小学生口算思维训练
              </span>
            </div>
          </div>

          {/* 2. 中间：桌面端导航菜单 (清晰大方，带活动指示条与未掌握错题角标) */}
          <nav className="hidden lg:flex items-center gap-1 sm:gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                    isActive
                      ? 'bg-amber-50 text-amber-950 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-amber-600 scale-110' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white shadow-2xs animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. 右侧：学生档案切换胶囊 + 学生专属设置 + 静音控制 */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* 当前学生登录卡片胶囊 (点击直接切换 Hanna / Danna 或添加学生) */}
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 text-amber-950 transition-all shadow-2xs hover:shadow-xs group cursor-pointer active:scale-95"
              title="点击切换正在练习的学生档案"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform leading-none">
                {activeStudent.avatar}
              </span>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="font-bold text-xs text-slate-900 max-w-[70px] sm:max-w-[100px] truncate">
                    {activeStudent.name}
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-200/90 px-1.5 py-0.2 rounded-md font-bold">
                    {formatGradeLabel(activeStudent.grade)}
                  </span>
                </div>
                <div className="text-[10px] text-amber-600 font-semibold leading-tight flex items-center gap-1 mt-0.5">
                  <span>⭐ {activeStudent.currentStars} 颗星</span>
                  <span className="text-amber-500 text-[9px]">▾ 切换</span>
                </div>
              </div>
            </button>

            {/* 学生专属个人设置按钮 */}
            <button
              type="button"
              onClick={onOpenStudentSettings}
              className="px-2.5 sm:px-3 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-700 hover:text-slate-950 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="调整学生的口算难度、每组题量、立式排版与心愿奖励"
            >
              <Settings className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold hidden sm:inline text-slate-800">设置</span>
            </button>

            {/* 静音快捷控制 */}
            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? '点击开启声音' : '点击静音'}
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 移动端底部固定导航栏 (屏幕小于 lg 时显示，符合触屏人体工学) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg flex items-center justify-around py-1.5 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-amber-500' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-bold font-mono px-1 py-0.1 rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
