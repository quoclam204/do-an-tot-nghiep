import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";

import {
  HomePage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AccountPage,
  FarmsPage,
  FarmDetailPage,
  FarmingLogPage,
  CropsPage,
  MaterialsPage,
  InventoryPage,
  SeasonsPage,
  ReportsPage,
  HarvestPage,
  SalesPage,
  AdminDashboardPage,
  OfflineDashboardPage,
} from "./pages";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <div className="app">
                <Header />
                <HomePage />
                <Footer />
              </div>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/crops" element={<CropsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/farms" element={<ProtectedRoute><FarmsPage /></ProtectedRoute>} />
          <Route path="/farms/:id" element={<ProtectedRoute><FarmDetailPage /></ProtectedRoute>} />
          <Route path="/seasons" element={<ProtectedRoute><SeasonsPage /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><MaterialsPage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
          <Route path="/harvest" element={<ProtectedRoute><HarvestPage /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="app">
                  <Header />
                  <main className="main container">
                    <FarmingLogPage />
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <div className="app">
                  <Header />
                  <main className="main container">
                    <FarmingLogPage />
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/offline-dashboard"
            element={
              <ProtectedRoute>
                <OfflineDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
