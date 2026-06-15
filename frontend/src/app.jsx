import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import AcademicsRouted from './pages/AcademicsRouted';
import AdministrationRouted from './pages/AdministrationRouted';
import FacilitiesRouted from './pages/FacilitiesRouted';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';

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

// Layout Wrapper to conditionally show Layout
const LayoutWrapper = ({ children }) => {
    return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Student Routes */}
       <Route path="/" element={<LayoutWrapper><Home /></LayoutWrapper>} />
       <Route path="/About" element={<LayoutWrapper><About/></LayoutWrapper>} />
        
       <Route path="/facilities/:sub" element={<LayoutWrapper><FacilitiesRouted /></LayoutWrapper>} />
       <Route path="/facilities/:sub/:subsub" element={<LayoutWrapper><FacilitiesRouted /></LayoutWrapper>} />
        <Route path="/administration/:sub" element={<LayoutWrapper><AdministrationRouted /></LayoutWrapper>} />
       <Route path="/administration/:sub/:subsub" element={<LayoutWrapper><AdministrationRouted /></LayoutWrapper>} />


        {/* Academics Routes */}
       <Route path="/academics/:sub" element={<LayoutWrapper><AcademicsRouted /></LayoutWrapper>} />
       <Route path="/academics/:sub/:subsub" element={<LayoutWrapper><AcademicsRouted /></LayoutWrapper>} />
       <Route path="/academics/:sub/:subsub/:subsubsub" element={<LayoutWrapper><AcademicsRouted /></LayoutWrapper>} />
       {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <LayoutWrapper><AdminDashboard /></LayoutWrapper>
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