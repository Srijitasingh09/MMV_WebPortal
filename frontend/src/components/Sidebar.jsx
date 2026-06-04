import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const Sidebar = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const mainLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Administration', path: '/administration' },
    { name: 'Academics', path: '/academics' },
    { name: 'Facilities', path: '/facilities' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Notices', path: '/notices' },
    { name: 'Recommendations', path: '/recommendations' },
    { name: 'Profile', path: '/profile' },
  ];

  const adminLinks = [{ name: 'Admin Hub', path: '/admin' }];
  const links = isAdmin ? [...adminLinks, ...mainLinks] : mainLinks;

  return (
    <div className="w-64 h-screen bg-[#1E3A8A] text-white flex flex-col fixed left-0 top-0 shadow-2xl z-50 overflow-y-auto custom-scrollbar">
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <img src="/backimages/mmv logo.jpeg" alt="MMV Logo" className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-md" />
          <h1 className="text-2xl font-bold tracking-tight text-white">MMV PORTAL</h1>
        </div>
        <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">Banaras Hindu University</p>
      </div>

      <nav className="flex-1 mt-6 pb-4">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => 
              `sidebar-link ${isActive && link.path !== '/' ? 'active' : ''}`
            }
          >
            <span className="font-medium tracking-wide">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10 mt-auto">
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="flex items-center text-white/70 hover:text-white transition-colors w-full"
        >
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
