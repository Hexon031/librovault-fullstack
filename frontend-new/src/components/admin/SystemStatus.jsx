import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// --- ProgressBar Component ---
// A small, reusable component to display the status bars
const ProgressBar = ({ title, value, description }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="font-semibold text-white">{title}</span>
      <span className="text-sm font-medium text-blue-300">{value}%</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-4 my-2">
      <div 
        className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${value}%` }}
      ></div>
    </div>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

// --- Main SystemStatus Component ---
function SystemStatus() {
    const [stats, setStats] = useState({ serverLoad: 0, dbConnections: 0, storageCapacity: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const token = (await supabase.auth.getSession())?.data?.session?.access_token;
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats/system`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                } else {
                    console.error("Failed to fetch system stats.");
                }
            } catch (error) {
                console.error("Error fetching system stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <p className="text-gray-400">Loading system status...</p>;
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6 text-white">System Performance</h2>
            <div className="space-y-8">
                <ProgressBar 
                    title="Server Load (Simulated)" 
                    value={stats.serverLoad}
                    description={`${stats.serverLoad}% CPU utilization.`}
                />
                <ProgressBar 
                    title="Database Connections (Simulated)" 
                    value={stats.dbConnections}
                    description={`${stats.dbConnections}% of connection pool used.`}
                />
                <ProgressBar 
                    title="Storage Capacity" 
                    value={stats.storageCapacity}
                    description={`${stats.storageCapacity.toFixed(2)}% of total storage used.`}
                />
            </div>
        </div>
    );
}

export default SystemStatus;