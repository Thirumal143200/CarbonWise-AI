import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { AICoachPage } from './pages/ai-coach/AICoachPage';
import { LoginPage, SignupPage } from './pages/auth/AuthPages';
import { CarbonPage } from './pages/carbon/CarbonPage';
import { ChallengesPage } from './pages/challenges/ChallengesPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EducationPage } from './pages/education/EducationPage';
import { GoalsPage } from './pages/goals/GoalsPage';
import { PredictionsPage } from './pages/predictions/PredictionsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SimulatorPage } from './pages/simulator/SimulatorPage';
import { TwinPage } from './pages/twin/TwinPage';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
