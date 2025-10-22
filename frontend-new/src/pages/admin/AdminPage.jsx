import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function AdminPage() {
  const tabStyle = "px-6 py-3 font-semibold text-gray-300 rounded-t-lg transition-colors";
  const activeTabStyle = "bg-gray-800 text-white";

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex border-b border-gray-700 mb-6">
        <NavLink to="users" className={({ isActive }) => isActive ? `${tabStyle} ${activeTabStyle}` : tabStyle}>
          Overview & Users
        </NavLink>
        <NavLink to="analytics" className={({ isActive }) => isActive ? `${tabStyle} ${activeTabStyle}` : tabStyle}>
          Analytics
        </NavLink>
        <NavLink to="status" className={({ isActive }) => isActive ? `${tabStyle} ${activeTabStyle}` : tabStyle}>
          System Status
        </NavLink>
      </div>
      {/* Outlet renders the active admin component (UserManagement, Analytics, etc.) */}
      <Outlet />
    </>
  );
}

export default AdminPage;