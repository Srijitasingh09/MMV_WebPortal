import React from 'react';
import Navbar from './Navbar.jsx';
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
const Layout = ({ children , hideFooter = false, hideChatWidget = false }) => {
  return (
    <div className=" bg-[#EAF0F6]">
      <Navbar />
      <main className="p-0">
        {children}
      </main>
      {!hideFooter && <Footer />}
      {!hideChatWidget && <ChatWidget />}
    </div>
  );
};

export default Layout;