import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CourseProvider, useCourses } from './context/CourseContext';
import { Header } from './components/Header';
import { BottomNav, TabId } from './components/BottomNav';
import { InAppAlertBanner } from './components/InAppAlertBanner';
import { PINModal } from './components/PINModal';
import { FileViewerModal } from './components/FileViewerModal';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CourseDetailView } from './views/CourseDetailView';
import { AssignmentsView } from './views/AssignmentsView';
import { OfflineDownloadsView } from './views/OfflineDownloadsView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileSettingsView } from './views/ProfileSettingsView';
import { CachedFileRecord } from './types';
import { Smartphone, Monitor } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLocked } = useAuth();
  const { activeCourse, setActiveCourseId } = useCourses();

  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [readingFile, setReadingFile] = useState<CachedFileRecord | null>(null);
  const [selectedAssignmentForModal, setSelectedAssignmentForModal] = useState<string | null>(null);
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // If not logged in, show student login view
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleTabChange = (tab: TabId) => {
    setCurrentTab(tab);
    // If navigating back to dashboard, leave course detail view open if student is studying
    if (tab !== 'dashboard') {
      setActiveCourseId(null);
    }
  };

  const handleOpenOfflineFile = (file: CachedFileRecord) => {
    setReadingFile(file);
  };

  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setCurrentTab('dashboard');
  };

  const handleViewDeadlines = () => {
    setActiveCourseId(null);
    setCurrentTab('assignments');
  };

  const handleViewDownloads = () => {
    setActiveCourseId(null);
    setCurrentTab('downloads');
  };

  const handleViewSpecificAssignment = (assignmentId: string) => {
    setSelectedAssignmentForModal(assignmentId);
    setActiveCourseId(null);
    setCurrentTab('assignments');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start">
      {/* Quick Desktop Device Frame Switcher */}
      <div className="hidden lg:flex fixed top-3 right-4 z-50 items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            !isPhoneFrame
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" /> Full Width
        </button>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            isPhoneFrame
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" /> Android Phone Preview
        </button>
      </div>

      {/* Main Container - either standard full responsive container or simulated Android chassis */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[420px] my-6 rounded-[44px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative min-h-[840px] bg-slate-950'
            : 'max-w-4xl'
        }`}
      >
        {/* Top Header */}
        <Header onOpenNotifications={() => setCurrentTab('notifications')} />

        {/* In-App Deadline Push Alert Banner */}
        <InAppAlertBanner onViewDeadlines={handleViewDeadlines} />

        {/* View Switcher */}
        <main className="w-full">
          {currentTab === 'dashboard' && (
            <>
              {activeCourse ? (
                <CourseDetailView
                  onBack={() => setActiveCourseId(null)}
                  onOpenOfflineFile={handleOpenOfflineFile}
                  onSubmitAssignmentTrigger={(assignId) => {
                    setSelectedAssignmentForModal(assignId);
                    setCurrentTab('assignments');
                  }}
                />
              ) : (
                <DashboardView
                  onSelectCourse={handleSelectCourse}
                  onOpenDeadlines={handleViewDeadlines}
                  onOpenDownloads={handleViewDownloads}
                />
              )}
            </>
          )}

          {currentTab === 'assignments' && (
            <AssignmentsView selectedAssignmentId={selectedAssignmentForModal} />
          )}

          {currentTab === 'downloads' && (
            <OfflineDownloadsView onOpenOfflineFile={handleOpenOfflineFile} />
          )}

          {currentTab === 'notifications' && (
            <NotificationsView onViewAssignment={handleViewSpecificAssignment} />
          )}

          {currentTab === 'profile' && <ProfileSettingsView />}
        </main>

        {/* Fixed Bottom Navigation Bar */}
        <BottomNav currentTab={currentTab} onSelectTab={handleTabChange} />
      </div>

      {/* Offline Document Viewer Modal */}
      <FileViewerModal file={readingFile} onClose={() => setReadingFile(null)} />

      {/* PIN Security Keypad Overlay if app is locked */}
      {isLocked && <PINModal />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <MainAppContent />
      </CourseProvider>
    </AuthProvider>
  );
}
