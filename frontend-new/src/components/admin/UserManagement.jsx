import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// A small component to display role badges with colors
const RoleBadge = ({ role }) => {
    const roleColors = {
        admin: 'bg-red-200 text-red-800',
        user: 'bg-blue-200 text-blue-800',
    };
    const normalizedRole = role.toLowerCase();
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[normalizedRole] || 'bg-gray-200 text-gray-800'}`}>
            {role}
        </span>
    );
};

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const token = (await supabase.auth.getSession())?.data?.session?.access_token;
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                } else {
                    console.error("Failed to fetch user list.");
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) {
        return <p className="text-gray-400">Loading user data...</p>;
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">User Management</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">User</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Joined</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-700 flex items-center justify-center font-bold flex-shrink-0">
                                        {/* Display first letter of username or email */}
                                        {(user.user_metadata?.username || user.email).charAt(0).toUpperCase()}
                                    </div>
                                    {user.user_metadata?.username || user.email.split('@')[0]}
                                </th>
                                <td className="px-6 py-4">
                                    <RoleBadge role={user.user_metadata?.role || 'User'} />
                                </td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="font-medium text-cyan-400 hover:underline">...</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserManagement;