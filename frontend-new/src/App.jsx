import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Layouts and Pages
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MyLibraryPage from './pages/MyLibraryPage';
import SubmitBookPage from './pages/SubmitBookPage';
import AdminPage from './pages/admin/AdminPage';
import ReaderPage from './pages/ReaderPage';
import BookDetailPage from './pages/BookDetailPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'; // 1. Import the new page

// Admin Components
import UserManagement from './components/admin/UserManagement';
import Analytics from './components/admin/Analytics';
import SystemStatus from './components/admin/SystemStatus';

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };
        fetchSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/reader/:bookId" element={session ? <ReaderPage /> : <Navigate to="/login" />} />

                <Route element={session ? <DashboardLayout user={session?.user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
                    <Route path="/" element={<DashboardPage user={session?.user} />} />
                    <Route path="/my-library" element={<MyLibraryPage />} />
                    <Route path="/submit" element={<SubmitBookPage user={session?.user} />} />
                    <Route path="/book/:bookId" element={<BookDetailPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} /> {/* 2. Add the new route */}
                    
                    <Route path="/admin" element={<AdminPage />}>
                        <Route index element={<Navigate to="users" replace />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="status" element={<SystemStatus />} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}

export default App;