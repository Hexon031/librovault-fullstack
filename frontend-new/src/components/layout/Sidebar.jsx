import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../../assets/logo.png';

// Icon placeholders
const DashboardIcon = () => <span>🏠</span>;
const LibraryIcon = () => <span>📚</span>;
const SubmitIcon = () => <span>➕</span>;
const AdminIcon = () => <span>⚙️</span>;
const AboutIcon = () => <span>ℹ️</span>; // New icon for About
const LogoutIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

function Sidebar({ user, onLogout }) {
  const linkStyle = "flex items-center p-3 my-1 rounded-lg text-gray-300 hover:bg-cyan-800 transition-colors";
  const activeLinkStyle = "bg-cyan-700 text-white font-semibold";

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg fixed h-full z-20">
      
      <div className="flex items-center gap-2 mb-10 px-2">
        <img src={Logo} alt="LibroVault Logo" className="w-10 h-10" />
        <span className="text-2xl font-bold">LibroVault</span>
      </div>

      <nav className="flex-grow">
        <NavLink to="/" end className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
          <DashboardIcon /> <span className="ml-3">Dashboard</span>
        </NavLink>
        <NavLink to="/my-library" className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
          <LibraryIcon /> <span className="ml-3">My Library</span>
        </NavLink>
        <NavLink to="/submit" className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
          <SubmitIcon /> <span className="ml-3">Submit Book</span>
        </NavLink>
        {user?.user_metadata?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
            <AdminIcon /> <span className="ml-3">Admin</span>
          </NavLink>
        )}
        {/* --- NEW LINK FOR ABOUT PAGE --- */}
        <NavLink to="/about" className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}>
          <AboutIcon /> <span className="ml-3">About Us</span>
        </NavLink>
      </nav>

      {/* User Profile & Logout Section */}
      <div className="mt-auto">
        <div className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-gray-900 flex-shrink-0">
              {user?.user_metadata?.username ? user.user_metadata.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user?.user_metadata?.username || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0" title="Logout">
            <LogoutIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;