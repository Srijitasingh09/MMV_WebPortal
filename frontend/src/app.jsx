import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/home';
import About from './pages/about';
import AboutSarthi from './pages/AboutSarthi';
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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { getToken, isAdmin as isAdminSession, verifySessionWithServer } from './utils/auth';


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
      return <Navigate to="/home" replace />;
    }
    if (checking) {
      return null; // brief pause while /user/me confirms the role server-side
    }
    if (!serverConfirmsAdmin) {
      return <Navigate to="/home" replace />;
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Gate page: About Us, shown first with a link into the main site */}
        <Route path="/" element={<AboutSarthi />} />

        {/* Student Routes */}
        <Route path="/home" element={<LayoutWrapper><Home /></LayoutWrapper>} />
        <Route path="/about" element={<LayoutWrapper><About/></LayoutWrapper>} />
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
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;