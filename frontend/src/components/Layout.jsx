import React from 'react';
import Navbar from './Navbar';
import Footer from "./Footer";
const Layout = ({ children }) => {
  return (
    <div className="max-h-screen bg-gray-50">
      <Navbar />
      <main className="p-0">
        {children}
      </main>
      <Footer/>
    </div>
  );
};

export default Layout;