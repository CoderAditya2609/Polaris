import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Shell } from './components/Shell';
import { LogoMark } from './components/Icons';
import { LockScreen } from './components/LockScreen';
import { SetupScreen } from './components/SetupScreen';
import { JournalPage } from './pages/JournalPage';
import { CalendarPage } from './pages/CalendarPage';
import { WallPage } from './pages/WallPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <img
        src="/bg.png"
        alt=""
        className="h-full w-full object-cover object-center"
        draggable={false}
      />
    </div>
  );
}

function Splash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <LogoMark className="h-14 w-14 animate-pulse text-[var(--gold)]" />
    </div>
  );
}

export default function App() {
  const { status } = useAuth();

  return (
    <>
      <Background />
      <div className="relative z-10">
        {status === 'loading' ? <Splash /> : null}
        {status === 'setup' ? <SetupScreen /> : null}
        {status === 'locked' ? <LockScreen /> : null}
        {status === 'unlocked' ? (
          <DataProvider>
            <Routes>
              <Route element={<Shell />}>
                <Route index element={<JournalPage />} />
                <Route path="/journal/:date" element={<JournalPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/wall" element={<WallPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </DataProvider>
        ) : null}
      </div>
    </>
  );
}
