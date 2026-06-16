import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';

// Lazy load pages to optimize initial bundle sizes (code-splitting)
const DashboardPage = lazy(() =>
  import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CarbonPage = lazy(() =>
  import('./pages/carbon/CarbonPage').then((m) => ({ default: m.CarbonPage })),
);
const PredictionsPage = lazy(() =>
  import('./pages/predictions/PredictionsPage').then((m) => ({ default: m.PredictionsPage })),
);
const TwinPage = lazy(() => import('./pages/twin/TwinPage').then((m) => ({ default: m.TwinPage })));
const SimulatorPage = lazy(() =>
  import('./pages/simulator/SimulatorPage').then((m) => ({ default: m.SimulatorPage })),
);
const GoalsPage = lazy(() =>
  import('./pages/goals/GoalsPage').then((m) => ({ default: m.GoalsPage })),
);
const ChallengesPage = lazy(() =>
  import('./pages/challenges/ChallengesPage').then((m) => ({ default: m.ChallengesPage })),
);
const AICoachPage = lazy(() =>
  import('./pages/ai-coach/AICoachPage').then((m) => ({ default: m.AICoachPage })),
);
const EducationPage = lazy(() =>
  import('./pages/education/EducationPage').then((m) => ({ default: m.EducationPage })),
);
const ReportsPage = lazy(() =>
  import('./pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);

const LoginPage = lazy(() =>
  import('./pages/auth/AuthPages').then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import('./pages/auth/AuthPages').then((m) => ({ default: m.SignupPage })),
);

const LoadingFallback = () => (
  <div
    className="flex items-center justify-center min-h-[60vh]"
    role="status"
    aria-label="Loading page"
  >
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    <span className="sr-only">Loading page...</span>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes inside App Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/carbon" element={<CarbonPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/twin" element={<TwinPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/ai-coach" element={<AICoachPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
