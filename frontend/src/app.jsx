import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
// import Recommendations from './pages/Recommendations';
import Notices from './pages/Notices';
// import Facilities from './pages/Facilities';
// import CollegeInfo from './pages/CollegeInfo';
import LoginPage from './pages/LoginPage';
// import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
// import CalendarPage from './pages/CalendarPage';
// import AdministrationPage from './pages/AdministrationPage';
// import AcademicNEP from './pages/academics/AcademicNEP';
// import AcademicSyllabus from './pages/academics/AcademicSyllabus';
// import AcademicElectives from './pages/academics/AcademicElectives';
// import AcademicSectionIncharge from './pages/academics/AcademicSectionIncharge';
// import AcademicSwayam from './pages/academics/AcademicSwayam';
// import AcademicsHub from './pages/academics/AcademicsHub';
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
        {/* <Route 
       <Route path="/About" element={<LayoutWrapper><About/></LayoutWrapper>} />
        <Route 
          path="/profile" 
          element={
           
              <LayoutWrapper><Profile /></LayoutWrapper>
            
          } 
        /> */}
        {/* <Route 
          path="/recommendations" 
          element={
          
              <LayoutWrapper><Recommendations /></LayoutWrapper>
           
          } 
        /> */}
        <Route 
          path="/notices" 
          element={
      
              <LayoutWrapper><Notices /></LayoutWrapper>
           
          } 
        />
        {/* <Route 
          path="/facilities" 
          element={
            
              <LayoutWrapper><Facilities /></LayoutWrapper>
          
          } 
        />
        <Route 
          path="/facilities/:section" 
          element={
            
              <LayoutWrapper><Facilities /></LayoutWrapper>
            
          } 
        />
        <Route 
          path="/facilities/:section/:category" 
          element={
            
              <LayoutWrapper><Facilities /></LayoutWrapper>
           
          } 
        />
        <Route 
          path="/facilities/:section/:category/:subcategory" 
          element={
            
              <LayoutWrapper><Facilities /></LayoutWrapper>
     
          } 
        /> */}
        {/* <Route
          path="/college-info"
          element={
    
              <LayoutWrapper><CollegeInfo /></LayoutWrapper>
           
          }
        />
        <Route
          path="/calendar"
          element={
           
              <LayoutWrapper><CalendarPage /></LayoutWrapper>
          
          }
        />n */}
        {/* <Route
          path="/administration"
          element={
       
              <LayoutWrapper><AdministrationPage /></LayoutWrapper>
           
          }
        />
        <Route
          path="/administration/:section"
          element={
      
              <LayoutWrapper><AdministrationPage /></LayoutWrapper>
          
          }
        />
        <Route
          path="/administration/:section/:subsection"
          element={
        
              <LayoutWrapper><AdministrationPage /></LayoutWrapper>
   
          }
        /> */}

        {/* Academics Routes */}
        {/* <Route path="/academics" element={<LayoutWrapper><AcademicsHub /></LayoutWrapper>} />
        <Route path="/academics/nep" element={<LayoutWrapper><AcademicNEP /></LayoutWrapper>} />
        <Route path="/academics/syllabus" element={<LayoutWrapper><AcademicSyllabus /></LayoutWrapper>} />
        <Route path="/academics/syllabus/:category" element={<LayoutWrapper><AcademicSyllabus /></LayoutWrapper>} />
        <Route path="/academics/electives" element={<LayoutWrapper><AcademicElectives /></LayoutWrapper>} />
        <Route path="/academics/electives/:category" element={<LayoutWrapper><AcademicElectives /></LayoutWrapper>} />
        <Route path="/academics/section-incharge" element={<LayoutWrapper><AcademicSectionIncharge /></LayoutWrapper>} />
        <Route path="/academics/section-incharge/:category" element={<LayoutWrapper><AcademicSectionIncharge /></LayoutWrapper>} />
        <Route path="/academics/swayam" element={<LayoutWrapper><AcademicSwayam /></LayoutWrapper>} /> */}

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