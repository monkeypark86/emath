/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PracticeArena } from './components/PracticeArena';
import { QuestionBankManager } from './components/QuestionBankManager';
import { MistakeNotebook } from './components/MistakeNotebook';
import { ParentDashboard } from './components/ParentDashboard';
import { MobileCompanion } from './components/MobileCompanion';
import { ReportModal } from './components/ReportModal';
import { MobileSyncModal } from './components/MobileSyncModal';
import { PrintWorksheetModal } from './components/PrintWorksheetModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { StudentSettingsModal } from './components/StudentSettingsModal';
import {
  MathQuestion,
  PracticeSessionResult,
  QuestionBankRule,
  GradeLevel,
  StudentProfile
} from './types/math';
import {
  getMistakes,
  getParentSettings,
  importSyncPayload,
  seedSampleDataIfEmpty,
  getActiveStudent,
  setActiveStudentId,
  updateStudentProfile
} from './utils/storage';
import { generateQuestionBatchByRule } from './utils/mathGenerator';
import { sound } from './utils/soundEffects';
import { Smartphone, CheckCircle, Bell, Users, Settings } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'practice' | 'banks' | 'mistakes' | 'parent' | 'mobile'>('practice');
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPracticingActive, setIsPracticingActive] = useState<boolean>(false); // 免干扰专注模式状态

  // Multi-Student Profile State (严格从 localStorage 载入并保持选中的学生)
  const [activeStudent, setActiveStudent] = useState<StudentProfile>(() => {
    seedSampleDataIfEmpty();
    return getActiveStudent();
  });
  // 首页首次进入让用户选择学生登录，确认后记录在 localStorage，下次刷新自动保持该学生登录！
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem('math_chosen_student_confirmed_v1');
  });

  // Student Settings Modal State
  const [isStudentSettingsOpen, setIsStudentSettingsOpen] = useState<boolean>(false);
  const [settingsTargetStudent, setSettingsTargetStudent] = useState<StudentProfile | null>(null);

  // Practice state
  const [practiceQuestions, setPracticeQuestions] = useState<MathQuestion[] | undefined>(undefined);
  const [sessionReport, setSessionReport] = useState<PracticeSessionResult | null>(null);

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [printModalData, setPrintModalData] = useState<{
    isOpen: boolean;
    questions: MathQuestion[];
    title: string;
  }>({
    isOpen: false,
    questions: [],
    title: ''
  });

  // Auto push banner notification state
  const [pushToast, setPushToast] = useState<string | null>(null);

  const refreshMistakeCount = () => {
    const list = getMistakes();
    setMistakeCount(list.filter(m => !m.mastered).length);
  };

  const handleSelectStudent = (student: StudentProfile) => {
    setActiveStudentId(student.id);
    localStorage.setItem('math_chosen_student_confirmed_v1', 'true');
    const fresh = getActiveStudent();
    setActiveStudent(fresh);
    refreshMistakeCount();
    showToast(`🎉 已成功登录：${fresh.avatar} ${fresh.name} 同学的口算专属档案！`);
  };

  const handleOpenStudentSettings = (student?: StudentProfile) => {
    setSettingsTargetStudent(student || activeStudent);
    setIsStudentSettingsOpen(true);
  };

  const handleSaveStudentSettings = (updated: StudentProfile) => {
    updateStudentProfile(updated);
    if (updated.id === activeStudent.id) {
      setActiveStudentId(updated.id);
      setActiveStudent(getActiveStudent());
    }
    showToast(`✅ 已更新 ${updated.name} 的专属个人设置！`);
  };

  useEffect(() => {
    seedSampleDataIfEmpty();
    refreshMistakeCount();

    // Check if URL has sync payload (from QR code scan on mobile)
    const urlParams = new URLSearchParams(window.location.search);
    const syncParam = urlParams.get('sync');
    if (syncParam) {
      const ok = importSyncPayload(syncParam);
      if (ok) {
        refreshMistakeCount();
        setCurrentTab('mobile');
        showToast('📱 已成功从扫码同步错题数据至移动端！');
      }
    } else if (window.location.hash === '#mobile') {
      setCurrentTab('mobile');
    }
  }, []);

  const showToast = (msg: string) => {
    setPushToast(msg);
    setTimeout(() => {
      setPushToast(null);
    }, 4000);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  // When practice round completes
  const handleSessionComplete = (result: PracticeSessionResult) => {
    setIsPracticingActive(false);
    setSessionReport(result);
    refreshMistakeCount();
    // 练习结算后，重新读取并保持当前学生的最新星星数与统计
    setActiveStudent(getActiveStudent());

    // If mistakes occurred, automatically push to mobile
    const totalMistakes = result.wrongCount + result.timeoutCount;
    if (totalMistakes > 0) {
      showToast(`📱 已自动将 ${totalMistakes} 道新错题推送到移动端！随时可拿出手机回顾练习。`);
    }
  };

  // Start dedicated round from mistakes
  const handlePracticeMistakes = (questions: MathQuestion[]) => {
    setPracticeQuestions(questions);
    setCurrentTab('practice');
  };

  // Start practice from Question Bank rule
  const handleStartPracticeWithRule = (rule: QuestionBankRule, count: number) => {
    const questions = generateQuestionBatchByRule(count, {
      operations: rule.operations,
      num1Digits: rule.num1Digits,
      num2Digits: rule.num2Digits,
      allowCarry: rule.allowCarry,
      allowBorrow: rule.allowBorrow,
      mustDivideClean: rule.mustDivideClean
    });
    setPracticeQuestions(questions);
    setCurrentTab('practice');
  };

  const handlePrintQuestions = (questions: MathQuestion[], title: string) => {
    setPrintModalData({
      isOpen: true,
      questions,
      title
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 极简顶部菜单栏：仅保留学生头像跟设置 */}
      {!isPracticingActive && (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* 左侧：品牌Logo (点击返回口算训练首页) */}
            <div
              onClick={() => {
                setPracticeQuestions(undefined);
                setCurrentTab('practice');
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-display font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                象
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base tracking-tight text-slate-900 leading-tight">
                  小象速算
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none">
                  小学生口算思维训练
                </span>
              </div>
            </div>

            {/* 右侧：学生头像档案 + 学生个人设置（极简设计，无重复设置，无冗余导航） */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Student Profile Quick Switcher */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-950 transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                title="点击切换正在练习的学生档案"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform leading-none">{activeStudent.avatar}</span>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="font-bold text-xs text-slate-900">{activeStudent.name}</span>
                    <span className="text-[10px] text-amber-700 bg-amber-200/80 px-1 py-0.2 rounded font-medium">
                      {activeStudent.grade === 'grade1' ? '一年级' : activeStudent.grade === 'grade2' ? '二年级' : '三年级+'}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold leading-tight flex items-center gap-0.5 mt-0.5">
                    <span>⭐ {activeStudent.currentStars} 颗星</span>
                    <span className="text-amber-500">▾ 切换</span>
                  </span>
                </div>
              </button>

              {/* Student Personal Settings Quick Button */}
              <button
                type="button"
                onClick={() => handleOpenStudentSettings(activeStudent)}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                title="打开学生个人设置 (算式立式、节奏、护眼字号、心愿奖励)"
              >
                <Settings className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:inline text-xs font-semibold text-slate-700">设置</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Floating Auto-Push Notification Toast */}
      {pushToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-bounce">
          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="flex-1 font-medium">{pushToast}</span>
          <button
            type="button"
            onClick={() => setCurrentTab('mobile')}
            className="text-[11px] font-bold text-amber-400 underline shrink-0"
          >
            立即查看
          </button>
        </div>
      )}

      {/* Main Content Arena */}
      <main className={`flex-1 ${isPracticingActive ? 'py-0 flex flex-col items-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' : ''}`}>
        {currentTab === 'practice' && (
          <PracticeArena
            key={activeStudent.id + '_' + (activeStudent.preferences?.equationLayout || '') + '_' + (activeStudent.preferences?.fontSizeScale || '')}
            defaultGrade={activeStudent.grade}
            student={activeStudent}
            onOpenSettings={() => handleOpenStudentSettings(activeStudent)}
            onSessionComplete={handleSessionComplete}
            initialQuestions={practiceQuestions}
            onPlayStateChange={setIsPracticingActive}
            onMistakeRecorded={refreshMistakeCount}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'banks' && (
          <QuestionBankManager
            onStartPracticeWithRule={handleStartPracticeWithRule}
            onPrintQuestions={(qList, title) => handlePrintQuestions(qList, title)}
            onBackToPractice={() => {
              setPracticeQuestions(undefined);
              setCurrentTab('practice');
            }}
          />
        )}

        {currentTab === 'mistakes' && (
          <MistakeNotebook
            key={activeStudent.id}
            onPracticeMistakes={handlePracticeMistakes}
            onOpenMobileSync={() => setIsSyncModalOpen(true)}
            onPrintWorksheet={qList => handlePrintQuestions(qList, `${activeStudent.name}的智能错题重练卷`)}
            onBackToPractice={() => {
              setPracticeQuestions(undefined);
              setCurrentTab('practice');
            }}
          />
        )}

        {currentTab === 'parent' && (
          <ParentDashboard
            key={activeStudent.id}
            onStartPractice={() => {
              setPracticeQuestions(undefined);
              setCurrentTab('practice');
            }}
            onViewMistakes={() => {
              refreshMistakeCount();
              setCurrentTab('mistakes');
            }}
            onPrintReport={() => {
              const mistakes = getMistakes().map(m => m.question);
              handlePrintQuestions(mistakes.slice(0, 15), `小象速算·${activeStudent.name}数学学情周报与薄弱专项卷`);
            }}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onStudentUpdated={() => setActiveStudent(getActiveStudent())}
          />
        )}

        {currentTab === 'mobile' && (
          <MobileCompanion
            key={activeStudent.id}
            onBackToMain={() => {
              setPracticeQuestions(undefined);
              setCurrentTab('practice');
            }}
          />
        )}
      </main>

      {/* Footer (免干扰模式下隐藏) */}
      {!isPracticingActive && (
        <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-slate-800">小象速算</span>
              <span>·</span>
              <span>小学生口算思维训练 & 智能错题同步系统</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>自主口算训练</span>
              <span>·</span>
              <span>加减乘除精准题库</span>
              <span>·</span>
              <span>多端实时同步</span>
            </div>
          </div>
        </footer>
      )}

      {/* Post-Session Statistical Report Modal */}
      {sessionReport && (
        <ReportModal
          result={sessionReport}
          onClose={() => setSessionReport(null)}
          onRetakeMistakes={mistakeQuestions => {
            setSessionReport(null);
            handlePracticeMistakes(mistakeQuestions);
          }}
          onViewMistakeBook={() => {
            setSessionReport(null);
            setCurrentTab('mistakes');
          }}
          onPlayAgain={() => {
            setSessionReport(null);
            setPracticeQuestions(undefined);
            setCurrentTab('practice');
          }}
          onOpenMobileSync={() => {
            setSessionReport(null);
            setIsSyncModalOpen(true);
          }}
          onPrintWorksheet={qList => {
            setSessionReport(null);
            handlePrintQuestions(qList, '本轮口算速练错题试卷');
          }}
        />
      )}

      {/* Mobile QR Code Sync Modal */}
      <MobileSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onOpenMobileView={() => setCurrentTab('mobile')}
      />

      {/* Print Worksheet Modal */}
      <PrintWorksheetModal
        isOpen={printModalData.isOpen}
        onClose={() => setPrintModalData({ ...printModalData, isOpen: false })}
        questions={printModalData.questions}
        title={printModalData.title}
      />

      {/* Student Profile Switcher & Login Modal (首页先让用户选择2学生/多学生登录) */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentStudentId={activeStudent.id}
        onSelectStudent={handleSelectStudent}
        canDismiss={!!localStorage.getItem('math_chosen_student_confirmed_v1')}
        onOpenSettings={st => handleOpenStudentSettings(st)}
      />

      {/* Student Personal Settings Modal (学生专属个人偏好与设置) */}
      {isStudentSettingsOpen && (
        <StudentSettingsModal
          isOpen={isStudentSettingsOpen}
          onClose={() => setIsStudentSettingsOpen(false)}
          student={settingsTargetStudent || activeStudent}
          onSave={handleSaveStudentSettings}
        />
      )}
    </div>
  );
}
