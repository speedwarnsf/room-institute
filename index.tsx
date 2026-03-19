import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './app.css';
import App from './App';
import { NotFound } from './components/NotFound';
import { ThemeProvider } from './components/ThemeContext';
import { I18nProvider } from './i18n/I18nContext';
import { ListingPage } from './components/ListingPage';
import { RoomPage } from './components/RoomPage';
import AgentOnboarding from './components/AgentOnboarding';
import { ListingIntake } from './components/ListingIntake';
import { ListingManage } from './components/ListingManage';
import { AgentDashboard } from './components/AgentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AgencyInterface } from './components/AgencyInterface';
import { ListingExperience } from './components/ListingExperience';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/agent/onboard" element={<AgentOnboarding />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/for/agencies" element={<AgencyInterface />} />
          <Route path="/listing/new" element={<ListingIntake />} />
          <Route path="/listing/:listingId" element={<ListingExperience />} />
          <Route path="/listing/:listingId/classic" element={<ListingPage />} />
          <Route path="/listing/:listingId/manage" element={<ListingManage />} />
          <Route path="/listing/:listingId/room/:roomId" element={<RoomPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </I18nProvider>
  </React.StrictMode>
);
