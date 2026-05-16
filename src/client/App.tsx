import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { NAV_ITEMS } from './config/navigation';
import { AutoModerationModule } from '../modules/auto-moderation';
import { AutoResponderModule } from '../modules/auto-responder';
import { DemoModeModule } from '../modules/demo-mode';
import { HistoryModule } from '../modules/history';
import { LogsModule } from '../modules/logs';
import { ModerationsPanelModule } from '../modules/moderations-panel';
import { ModeratorRecommendationsModule } from '../modules/moderator-recommendations';
import { ReportReviewModule } from '../modules/report-review';
import { SpamDetectorModule } from '../modules/spam-detector';
import { ToxicityAnalyzerModule } from '../modules/toxicity-analyzer';

const defaultPath = NAV_ITEMS[0]?.path ?? '/toxicity-analyzer';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to={defaultPath} replace />} />
          <Route path="/toxicity-analyzer" element={<ToxicityAnalyzerModule />} />
          <Route path="/spam-detector" element={<SpamDetectorModule />} />
          <Route path="/report-review" element={<ReportReviewModule />} />
          <Route path="/moderations-panel" element={<ModerationsPanelModule />} />
          <Route path="/auto-moderation" element={<AutoModerationModule />} />
          <Route path="/demo-mode" element={<DemoModeModule />} />
          <Route path="/auto-responder" element={<AutoResponderModule />} />
          <Route
            path="/moderator-recommendations"
            element={<ModeratorRecommendationsModule />}
          />
          <Route path="/logs" element={<LogsModule />} />
          <Route path="/history" element={<HistoryModule />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
