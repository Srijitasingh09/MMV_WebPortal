import React from 'react';
import Navbar from './Navbar';
import Footer from "./Footer";
const Layout = ({ children , hideFooter = false }) => {
  return (
    <div className=" bg-gray-50">
      <Navbar />
      <main className="p-0">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;