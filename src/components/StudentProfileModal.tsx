import React, { useState } from 'react';
import { StudentProfile, GradeLevel } from '../types/math';
import {
  getStudentProfiles,
  saveStudentProfiles,
  setActiveStudentId,
  createStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
  getMistakes
} from '../utils/storage';
import { sound } from '../utils/soundEffects';
import {
  Users,
  UserPlus,
  Edit2,
  Check,
  Star,
  Trophy,
  Target,
  Trash2,
  X,
  ArrowRight,
  Sparkles,
  Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudentId: string;
  onSelectStudent: (student: StudentProfile) => void;
  canDismiss?: boolean;
  onOpenSettings?: (student: StudentProfile) => void;
}

const AVATAR_OPTIONS = ['🦁', '🐰', '🐼', '🦊', '🐯', '🐻', '🐨', '🚀', '🦄', '🌟', '🐶', '🐱'];

const GRADE_MAP: Record<GradeLevel, string> = {
  grade1: '一年级 (20以内进退位)',
  grade2: '二年级 (100以内&九九乘除)',
  grade3: '三年级 (千以内乘除速算)',
  grade4: '四年级 (多位数巧算简算)',
  grade5_6: '五/六年级 (四则混合运算)',
  custom: '自定义练习'
};

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  currentStudentId,
  onSelectStudent,
  canDismiss = true,
  onOpenSettings
}) => {
  const [profiles, setProfiles] = useState<StudentProfile[]>(getStudentProfiles());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<StudentProfile | null>(null);

  // Form states
  const [nameInput, setNameInput] = useState<string>('');
  const [avatarInput, setAvatarInput] = useState<string>('🦁');
  const [gradeInput, setGradeInput] = useState<GradeLevel>('grade2');
  const [dailyTargetInput, setDailyTargetInput] = useState<number>(20);
  const [rewardTitleInput, setRewardTitleInput] = useState<string>('去游乐园玩');
  const [rewardStarsInput, setRewardStarsInput] = useState<number>(50);

  // 每次打开弹窗或设置发生变更时，确保从 localStorage 重新载入最新所有学生列表
  React.useEffect(() => {
    if (isOpen) {
      setProfiles(getStudentProfiles());
      setIsEditing(false);
      setEditingProfile(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleSync = () => {
      setProfiles(getStudentProfiles());
    };
    window.addEventListener('emath_student_profile_updated', handleSync);
    return () => window.removeEventListener('emath_student_profile_updated', handleSync);
  }, []);

  if (!isOpen) return null;

  const refreshList = () => {
    setProfiles(getStudentProfiles());
  };

  const handleChooseStudent = (student: StudentProfile) => {
    sound.playCorrect();
    setActiveStudentId(student.id);
    onSelectStudent(student);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setNameInput('');
    setAvatarInput('🐼');
    setGradeInput('grade2');
    setDailyTargetInput(20);
    setRewardTitleInput('看电影吃爆米花');
    setRewardStarsInput(50);
    setIsEditing(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, profile: StudentProfile) => {
    e.stopPropagation();
    setEditingProfile(profile);
    setNameInput(profile.name);
    setAvatarInput(profile.avatar);
    setGradeInput(profile.grade);
    setDailyTargetInput(profile.dailyTargetCount);
    setRewardTitleInput(profile.rewardGoalTitle);
    setRewardStarsInput(profile.rewardGoalStarsNeeded);
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (editingProfile) {
      // Update
      const updated: StudentProfile = {
        ...editingProfile,
        name: nameInput.trim(),
        avatar: avatarInput,
        grade: gradeInput,
        dailyTargetCount: dailyTargetInput,
        rewardGoalTitle: rewardTitleInput.trim() || '奖励愿望',
        rewardGoalStarsNeeded: rewardStarsInput
      };
      updateStudentProfile(updated);
      if (editingProfile.id === currentStudentId) {
        setActiveStudentId(updated.id);
        onSelectStudent(updated);
      }
    } else {
      // Create new
      const created = createStudentProfile({
        name: nameInput.trim(),
        avatar: avatarInput,
        grade: gradeInput,
        dailyTargetCount: dailyTargetInput,
        targetAccuracyRate: 90,
        rewardGoalTitle: rewardTitleInput.trim() || '奖励愿望',
        rewardGoalStarsNeeded: rewardStarsInput,
        currentStars: 0
      });
      setActiveStudentId(created.id);
      onSelectStudent(created);
    }

    refreshList();
    setIsEditing(false);
  };

  const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      alert('至少需要保留一名学生档案哦！');
      return;
    }
    if (confirm('确定要删除该学生档案吗？')) {
      deleteStudentProfile(id);
      refreshList();
      if (id === currentStudentId) {
        const remaining = getStudentProfiles();
        if (remaining.length > 0) {
          setActiveStudentId(remaining[0].id);
          onSelectStudent(remaining[0]);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-scale-in">
        {canDismiss && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {!isEditing ? (
          <div>
            {/* Header */}
            <div className="text-center pb-6 border-b border-slate-100">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
                🎒
              </div>
              <h2 className="text-2xl font-display font-extrabold text-slate-900">
                请选择正在练习的小朋友
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                支持多名学生独立登录，各自拥有独立的错题集、学习星级勋章与学情档案。
              </p>
            </div>

            {/* Student Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {profiles.map(student => {
                const isSelected = student.id === currentStudentId;
                const unmasteredCount = getMistakes(student.id).filter(m => !m.mastered).length;

                return (
                  <div
                    key={student.id}
                    onClick={() => handleChooseStudent(student)}
                    className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between hover:scale-[1.02] active:scale-[0.99] shadow-xs ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 ring-4 ring-amber-500/10'
                        : 'border-slate-200 hover:border-amber-300 bg-white'
                    }`}
                  >
                    {/* Top Row: Avatar & Actions */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-3xl">
                          {student.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-lg text-slate-900">
                              {student.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                当前登录
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-amber-700 font-medium mt-0.5">
                            {GRADE_MAP[student.grade] || student.grade}
                          </div>
                        </div>
                      </div>

                      {/* Edit & Settings Buttons */}
                      <div className="flex items-center gap-1">
                        {onOpenSettings && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenSettings(student);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="学生专属个人设置 (算式立式、节奏、护眼字号)"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {profiles.length > 1 && (
                          <button
                            type="button"
                            onClick={e => handleDeleteProfile(e, student.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="删除档案"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle Stats Info */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-white rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>星星: <strong className="text-slate-900 font-bold">{student.currentStars}</strong> 颗</span>
                      </div>
                      <div className="text-right text-slate-600">
                        待攻克: <strong className="text-rose-600 font-bold">{unmasteredCount}</strong> 题
                      </div>
                    </div>

                    {/* Goal & CTA */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate max-w-[150px]">
                        🎯 {student.rewardGoalTitle}
                      </span>
                      <button
                        type="button"
                        className="py-1 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>进入练习</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add New Student Card */}
              <div
                onClick={handleOpenCreate}
                className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all group min-h-[160px]"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-amber-100 text-slate-500 group-hover:text-amber-600 flex items-center justify-center mb-2 transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-700 group-hover:text-amber-800 text-sm">
                  + 添加新学生档案
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  为二胎宝贝或新同学创建专属档案
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Create / Edit Form */
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="font-display font-bold text-xl text-slate-900">
                {editingProfile ? `修改 ${editingProfile.name} 的学生档案` : '添加新学生档案'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                返回选择
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  学生姓名 / 昵称
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：天天、乐乐、阳阳"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-sm font-medium"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  选择萌宠专属头像
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarInput(emoji)}
                      className={`h-11 rounded-xl text-2xl flex items-center justify-center border transition-all ${
                        avatarInput === emoji
                          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  当前在读年级
                </label>
                <select
                  value={gradeInput}
                  onChange={e => setGradeInput(e.target.value as GradeLevel)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-sm font-medium bg-white"
                >
                  <option value="grade1">一年级 (20以内凑十破十)</option>
                  <option value="grade2">二年级 (100以内加减·表内乘除)</option>
                  <option value="grade3">三年级 (多位数乘除·万以内速算)</option>
                  <option value="grade4">四年级 (简便巧算·两三位数速算)</option>
                  <option value="grade5_6">五/六年级 (四则混合极限速算)</option>
                </select>
              </div>

              {/* Daily Target & Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    每日口算目标 (题/天)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={dailyTargetInput}
                    onChange={e => setDailyTargetInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    心愿所需星星数
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={rewardStarsInput}
                    onChange={e => setRewardStarsInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  学习激励愿望 (家长承诺给孩子的奖励)
                </label>
                <input
                  type="text"
                  placeholder="如：去游乐园玩旋转木马、买一套乐高"
                  value={rewardTitleInput}
                  onChange={e => setRewardTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 text-sm hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-colors"
                >
                  保存档案
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
