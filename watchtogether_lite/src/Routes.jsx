import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import NotFound from "pages/NotFound";
import MainViewingRoom from './pages/main-viewing-room';
import LoginPage from './pages/auth/LoginPage';

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <RouterRoutes>
            <Route path="/" element={<MainViewingRoom />} />
            <Route path="/main-viewing-room" element={<MainViewingRoom />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;