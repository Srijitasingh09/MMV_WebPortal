import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/home';
import OurVision from './pages/OurVision';
import AcademicsRouted from './pages/AcademicsRouted';
import AdministrationRouted from './pages/AdministrationRouted';
import FacilitiesRouted from './pages/FacilitiesRouted';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import Notices from './pages/notice';
import Contact from './pages/contact';
import AdminContentGuide from './pages/adminreadme'; 
import Feedback from './pages/Feedback';
import News from './pages/News';
import { getToken, isAdmin as isAdminSession, verifySessionWithServer } from './utils/auth';

// Protected Route Component
//
// - token/role now come from utils/auth, which reads sessionStorage
//   (per-tab, not shared across the whole browser) and decodes the role
//   out of the signed JWT rather than a separately-editable flag.
// - For adminOnly routes we additionally re-check with the backend
//   (/user/me) before rendering, so a token that *looks* admin from its
//   claims but belongs to a user who was demoted/deactivated since it was
//   issued still gets bounced. This runs once per visit to an admin
//   route, not on every click.
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = getToken();
  const claimsAdmin = isAdminSession();

  const [checking, setChecking] = useState(adminOnly);
  const [serverConfirmsAdmin, setServerConfirmsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (token && adminOnly) {
      verifySessionWithServer().then((profile) => {
        if (!cancelled) {
          setServerConfirmsAdmin(!!profile?.is_admin);
          setChecking(false);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [token, adminOnly]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    if (!claimsAdmin) {
      return <Navigate to="/" replace />;
    }
    if (checking) {
      return null; // brief pause while /user/me confirms the role server-side
    }
    if (!serverConfirmsAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

const LayoutWrapper = ({ children, hideFooter = false}) => {
  return (
    <Layout hideFooter={hideFooter} >
      {children}
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Student Routes */}
        <Route path="/" element={<LayoutWrapper><Home /></LayoutWrapper>} />
        <Route path="/OurVision" element={<LayoutWrapper><OurVision/></LayoutWrapper>} />
        <Route path="/facilities" element={<LayoutWrapper><FacilitiesRouted /></LayoutWrapper>} />
        <Route path="/facilities/:sub" element={<LayoutWrapper><FacilitiesRouted /></LayoutWrapper>} />
        <Route path="/facilities/:sub/:subsub" element={<LayoutWrapper><FacilitiesRouted /></LayoutWrapper>} />
       
        <Route path="/administration" element={<LayoutWrapper><AdministrationRouted /></LayoutWrapper>} />
        <Route path="/administration/:sub" element={<LayoutWrapper><AdministrationRouted /></LayoutWrapper>} />
        <Route path="/administration/:sub/:subsub" element={<LayoutWrapper><AdministrationRouted /></LayoutWrapper>} />

        {/* Academics Routes */}
        <Route path="/academics" element={<LayoutWrapper><AcademicsRouted /></LayoutWrapper>} />
        <Route path="/academics/:sub" element={<LayoutWrapper><AcademicsRouted /></LayoutWrapper>} />
        <Route path="/academics/:sub/:subsub" element={<LayoutWrapper><AcademicsRouted /></LayoutWrapper>} />
        <Route path="/academics/:sub/:subsub/:subsubsub" element={<LayoutWrapper><AcademicsRouted /></LayoutWrapper>} />
       
        {/* notice */}
        <Route path="/Notices" element={<LayoutWrapper><Notices/></LayoutWrapper>} />

        {/* news */}
        <Route path="/News" element={<LayoutWrapper><News/></LayoutWrapper>} />

        {/* contact */}
        <Route path="/Contact" element={<LayoutWrapper><Contact/></LayoutWrapper>} />
       

        {/* feedback */}
        <Route path="/Feedback" element={<LayoutWrapper><Feedback/></LayoutWrapper>} />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <LayoutWrapper ><AdminDashboard /></LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        {/* Content Guide (admin) */}
        <Route 
          path="/admin/content-guide" 
          element={
            <ProtectedRoute adminOnly={true}>
              <LayoutWrapper ><AdminContentGuide /></LayoutWrapper>
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;