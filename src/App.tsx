import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { IS_PREVIEW } from './lib/api';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';
import { ForgotPasswordPage, LoginPage, RegisterPage, RequireAuth, ResetPasswordPage } from './pages/AuthPages';
import { CareersPage, FaqPage, NotFoundPage, PrivacyPage, TermsPage } from './pages/InfoPages';

// Route-level code splitting for everything below the fold of the home page.
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'));
const TrackPage = lazy(() => import('./pages/TrackPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BookPage = lazy(() => import('./pages/BookPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

const PageFallback = () => (
  <div className="container section">
    <div className="skeleton" style={{ height: 360 }} />
  </div>
);
const S = ({ children }: { children: ReactNode }) => <Suspense fallback={<PageFallback />}>{children}</Suspense>;

// The hosted preview has no server to answer deep links, so it keeps routing in memory.
const Router = IS_PREVIEW ? MemoryRouter : BrowserRouter;

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<S><ServicesPage /></S>} />
                <Route path="/air-transport" element={<S><ServiceDetail mode="AIR" key="air" /></S>} />
                <Route path="/road-transport" element={<S><ServiceDetail mode="ROAD" key="road" /></S>} />
                <Route path="/movers-packers" element={<S><ServiceDetail mode="MOVERS" key="movers" /></S>} />
                <Route path="/pricing" element={<S><PricingPage /></S>} />
                <Route path="/calculator" element={<S><CalculatorPage /></S>} />
                <Route path="/track" element={<S><TrackPage /></S>} />
                <Route path="/about" element={<S><AboutPage /></S>} />
                <Route path="/contact" element={<S><ContactPage /></S>} />
                <Route path="/book" element={<S><BookPage /></S>} />
                <Route path="/payment" element={<RequireAuth><S><PaymentPage /></S></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><S><DashboardPage /></S></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><S><DashboardPage initialTab="profile" /></S></RequireAuth>} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
