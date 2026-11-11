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
  updateStudentProfile,
  formatGradeLabel
} from './utils/storage';
import { generateQuestionBatchByRule } from './utils/mathGenerator';
import { sound } from './utils/soundEffects';
import { useLang } from './i18n';
import { Smartphone, CheckCircle, Bell, Users, Settings } from 'lucide-react';

export default function App() {
  const { t, lang } = useLang();
  const [currentTab, setCurrentTab] = useState<'practice' | 'banks' | 'mistakes' | 'parent' | 'mobile'>('practice');
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPracticingActive, setIsPracticingActive] = useState<boolean>(false); // 免干扰专注模式状态

  // Multi-Student Profile State (严格从 localStorage 载入并保持选中的学生)
  const [activeStudent, setActiveStudent] = useState<StudentProfile>(() => {
    seedSampleDataIfEmpty();
    return getActiveStudent();
  });

  useEffect(() => {
    setActiveStudent(getActiveStudent());
  }, [lang]);
  // 首页首次进入让用户选择学生登录，确认后记录在 localStorage，下次刷新自动保持该学生登录！
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem('math_chosen_student_confirmed_v1');
  });

  // Student Settings Modal State
  const [isStudentSettingsOpen, setIsStudentSettingsOpen] = useState<boolean>(false);
  const [settingsTargetStudent, setSettingsTargetStudent] = useState<StudentProfile | null>(null);
  const [profileVersion, setProfileVersion] = useState<number>(0);

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
    setActiveStudent({ ...fresh });
    setProfileVersion(prev => prev + 1);
    refreshMistakeCount();
    showToast(t(`🎉 已成功登录：${fresh.avatar} ${fresh.name} 同学的口算专属档案！`, `🎉 Welcome, ${fresh.avatar} ${fresh.name}! Profile loaded.`));
  };

  const handleOpenStudentSettings = (student?: StudentProfile) => {
    setSettingsTargetStudent(student || activeStudent);
    setIsStudentSettingsOpen(true);
  };

  const handleSaveStudentSettings = (updated: StudentProfile) => {
    updateStudentProfile(updated);
    if (updated.id === activeStudent.id) {
      setActiveStudentId(updated.id);
      const fresh = getActiveStudent();
      setActiveStudent({ ...fresh });
    }
    setProfileVersion(prev => prev + 1);
    showToast(t(`✅ 已更新 ${updated.name} 的专属个人设置！`, `✅ Settings saved for ${updated.name}!`));
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
        showToast(t('📱 已成功从扫码同步错题数据至移动端！', '📱 Mistakes synced to mobile via QR code!'));
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
      showToast(t(`📱 已自动将 ${totalMistakes} 道新错题推送到移动端！随时可拿出手机回顾练习。`, `📱 ${totalMistakes} new mistake${totalMistakes === 1 ? '' : 's'} sent to mobile for review anytime.`));
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-16 lg:pb-0">
      {/* 重新规划整理的主导航菜单栏 (含桌面端导航 + 移动端底部菜单) */}
      {!isPracticingActive && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={tab => {
            setPracticeQuestions(undefined);
            setCurrentTab(tab);
          }}
          activeStudent={activeStudent}
          mistakeCount={mistakeCount}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenStudentSettings={() => handleOpenStudentSettings(activeStudent)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
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
            {t('立即查看', 'View')}
          </button>
        </div>
      )}

      {/* Main Content Arena */}
      <main className={`flex-1 ${isPracticingActive ? 'py-0 flex flex-col items-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' : ''}`}>
        {currentTab === 'practice' && (
          <PracticeArena
            key={`${activeStudent.id}_${activeStudent.lastActiveAt || 0}_${activeStudent.grade}_${JSON.stringify(activeStudent.preferences || {})}`}
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
            onPrintWorksheet={qList => handlePrintQuestions(qList, t(`${activeStudent.name}的智能错题重练卷`, `${activeStudent.name}'s Mistake Review Sheet`))}
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
              handlePrintQuestions(mistakes.slice(0, 15), t(`小象速算·${activeStudent.name}数学学情周报与薄弱专项卷`, `Elephant Math · ${activeStudent.name}'s Weekly Report & Focus Practice`));
            }}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onStudentUpdated={() => setActiveStudent(getActiveStudent())}
            onOpenMobileSync={() => setIsSyncModalOpen(true)}
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
            <div className="flex flex-wrap items-center justify-center gap-2 text-center">
              <span className="font-display font-bold text-slate-800">{t('小象速算', 'Elephant Math')}</span>
              <span>·</span>
              <span>{t('小学生口算思维训练 & 智能错题同步系统', 'Mental math training & smart mistake sync')}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-slate-400">
              <span>{t('自主口算训练', 'Self-paced practice')}</span>
              <span>·</span>
              <span>{t('加减乘除精准题库', '+ − × ÷ question banks')}</span>
              <span>·</span>
              <span>{t('多端实时同步', 'Multi-device sync')}</span>
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
            handlePrintQuestions(qList, t('本轮口算速练错题试卷', 'This Round: Mistake Worksheet'));
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
        key={`${activeStudent.id}_${profileVersion}`}
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
