import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

function DashboardLayout({ user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar user={user} onLogout={onLogout} />

      {/* This is the main scrollable content area.
        We've added 'text-gray-200' here. This sets the default
        text color for this entire section and all its children
        (like the dashboard page, admin page, etc.) to a light gray.
      */}
      <div className="flex flex-col flex-grow ml-64 overflow-y-auto text-gray-200">
        
        <main className="flex-grow p-8">
          {/* Outlet renders the active page component */}
          <Outlet />
        </main>

        {/* The Footer will now also inherit the light text color */}
        <Footer />
        
      </div>
    </div>
  );
}

export default DashboardLayout;