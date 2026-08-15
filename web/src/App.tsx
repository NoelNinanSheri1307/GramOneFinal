import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { PanchayatGuard } from "./components/PanchayatGuard";
import { CSRGuard } from "./components/CSRGuard";

// Auth & Citizen Pages
import { LoginPage }       from "./pages/LoginPage";
import { SignUpPage }      from "./pages/SignUpPage";
import { DashboardPage }   from "./pages/DashboardPage";
import { ReportIssuePage } from "./pages/ReportIssuePage";
import { IssuesListPage }  from "./pages/IssuesListPage";
import { IssueDetailPage } from "./pages/IssueDetailPage";
import { CommunityHubPage }      from "./pages/CommunityHubPage";
import { SchemesListPage }       from "./pages/SchemesListPage";
import { SchemeDetailPage }      from "./pages/SchemeDetailPage";
import { NewsListPage }          from "./pages/NewsListPage";
import { NewsDetailPage }        from "./pages/NewsDetailPage";
import { SafetyPage }            from "./pages/SafetyPage";
import { WomensSafetyPage }      from "./pages/WomensSafetyPage";
import { NotificationsPage }    from "./pages/NotificationsPage";

// Panchayat & Employee Pages
import { PanchayatDashboardPage }  from "./pages/PanchayatDashboardPage";
import { PanchayatIssueReviewPage } from "./pages/PanchayatIssueReviewPage";
import { CreateImpactCasePage }    from "./pages/CreateImpactCasePage";
import { ImpactCasesListPage }     from "./pages/ImpactCasesListPage";
import { ImpactCaseDetailPage }    from "./pages/ImpactCaseDetailPage";
import { PanchayatCommunityPage }  from "./pages/PanchayatCommunityPage";
import { EmployeeDashboardPage }   from "./pages/EmployeeDashboardPage";
import { EmployeeIssueDetailPage }  from "./pages/EmployeeIssueDetailPage";

// CSR Pages
import { CSRDashboardPage }        from "./pages/CSRDashboardPage";
import { CSROpportunitiesPage }    from "./pages/CSROpportunitiesPage";
import { CSROpportunityDetailPage } from "./pages/CSROpportunityDetailPage";
import { CSRSponsorshipsPage }     from "./pages/CSRSponsorshipsPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="skeleton" style={{ width: "120px", height: "40px" }} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "panchayat_employee") return <Navigate to="/employee" replace />;
  if (user?.role === "csr") return <Navigate to="/csr" replace />;
  return <Navigate to={user?.role === "panchayat" ? "/panchayat" : "/dashboard"} replace />;
};

/** Inner router component — needs to be inside BrowserRouter to call useLocation */
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"        element={<RootRedirect />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignUpPage />} />

        {/* Citizen Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/report"    element={<ProtectedRoute><ReportIssuePage /></ProtectedRoute>} />
        <Route path="/issues"    element={<ProtectedRoute><IssuesListPage /></ProtectedRoute>} />
        <Route path="/issues/:id" element={<ProtectedRoute><IssueDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Community Information & Safety (Citizen) Routes */}
        <Route path="/community"                 element={<ProtectedRoute><CommunityHubPage /></ProtectedRoute>} />
        <Route path="/community/schemes"         element={<ProtectedRoute><SchemesListPage /></ProtectedRoute>} />
        <Route path="/community/schemes/:id"     element={<ProtectedRoute><SchemeDetailPage /></ProtectedRoute>} />
        <Route path="/community/news"            element={<ProtectedRoute><NewsListPage /></ProtectedRoute>} />
        <Route path="/community/news/:id"        element={<ProtectedRoute><NewsDetailPage /></ProtectedRoute>} />
        <Route path="/community/safety"          element={<ProtectedRoute><SafetyPage /></ProtectedRoute>} />
        <Route path="/community/womens-safety"   element={<ProtectedRoute><WomensSafetyPage /></ProtectedRoute>} />

        {/* Field Worker / Employee Routes */}
        <Route path="/employee"            element={<ProtectedRoute><EmployeeDashboardPage /></ProtectedRoute>} />
        <Route path="/employee/issues/:id" element={<ProtectedRoute><EmployeeIssueDetailPage /></ProtectedRoute>} />

        {/* CSR Partner Routes */}
        <Route path="/csr"                 element={<CSRGuard><CSRDashboardPage /></CSRGuard>} />
        <Route path="/csr/opportunities"   element={<CSRGuard><CSROpportunitiesPage /></CSRGuard>} />
        <Route path="/csr/opportunities/:id" element={<CSRGuard><CSROpportunityDetailPage /></CSRGuard>} />
        <Route path="/csr/sponsorships"    element={<CSRGuard><CSRSponsorshipsPage /></CSRGuard>} />

        {/* Panchayat Admin Routes */}
        <Route path="/panchayat"                      element={<PanchayatGuard><PanchayatDashboardPage /></PanchayatGuard>} />
        <Route path="/panchayat/issues/:id"           element={<PanchayatGuard><PanchayatIssueReviewPage /></PanchayatGuard>} />
        <Route path="/panchayat/create-impact-case"   element={<PanchayatGuard><CreateImpactCasePage /></PanchayatGuard>} />
        <Route path="/panchayat/impact-cases"         element={<PanchayatGuard><ImpactCasesListPage /></PanchayatGuard>} />
        <Route path="/panchayat/impact-cases/:id"     element={<PanchayatGuard><ImpactCaseDetailPage /></PanchayatGuard>} />
        <Route path="/panchayat/community"            element={<PanchayatGuard><PanchayatCommunityPage /></PanchayatGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-container">
            <Header />
            <main className="main-content page-shell">
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}