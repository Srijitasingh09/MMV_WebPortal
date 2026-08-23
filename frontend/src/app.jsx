import React from 'react';
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

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const LayoutWrapper = ({ children, hideFooter = false}) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

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