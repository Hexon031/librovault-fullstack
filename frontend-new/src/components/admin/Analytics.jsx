import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { supabase } from '../../supabaseClient';

// Register all the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- Chart Options ---
// Reusable options to style the charts for a dark theme
const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      labels: {
        color: '#D1D5DB', // Light gray text for legend
        font: {
          size: 14,
        },
      },
    },
    tooltip: {
      titleFont: {
        size: 14,
      },
      bodyFont: {
        size: 12,
      },
      backgroundColor: '#1F2937', // Dark background for tooltip
      titleColor: '#FFFFFF',
      bodyColor: '#E5E7EB',
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#9CA3AF', // Gray text for X-axis labels
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)', // Faint grid lines
      },
    },
    y: {
      ticks: {
        color: '#9CA3AF', // Gray text for Y-axis labels
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)', // Faint grid lines
      },
    },
  },
};
// --- End Chart Options ---

function Analytics() {
  const [loading, setLoading] = useState(true);
  
  // State for "New Users" chart
  const [userChartData, setUserChartData] = useState({
    labels: [],
    datasets: [],
  });

  // State for "Reading Activity" chart
  const [activityChartData, setActivityChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = (await supabase.auth.getSession())?.data?.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch both stats concurrently
        const [userRes, activityRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats/activity`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        // Process User Stats
        if (userRes.ok) {
          const data = await userRes.json();
          const labels = data.map(d => new Date(d.month_start).toLocaleString('default', { month: 'long' }));
          const counts = data.map(d => d.signup_count);
          setUserChartData({
            labels,
            datasets: [{
              label: 'New Users',
              data: counts,
              backgroundColor: 'rgba(56, 189, 248, 0.6)', // Cyan color
              borderColor: 'rgba(56, 189, 248, 1)',
              borderWidth: 1,
            }],
          });
        }

        // Process Activity Stats
        if (activityRes.ok) {
          const data = await activityRes.json();
          const labels = data.map(d => new Date(d.month_start).toLocaleString('default', { month: 'long' }));
          const counts = data.map(d => d.read_count);
          setActivityChartData({
            labels,
            datasets: [{
              label: 'Books Read',
              data: counts,
              fill: true,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.4,
            }],
          });
        }
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <p className="text-gray-400">Loading analytics data...</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-1 text-white">New Users</h2>
        <p className="text-sm text-gray-400 mb-4">Monthly new user sign-ups.</p>
        <Bar data={userChartData} options={chartOptions} />
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-1 text-white">Reading Activity</h2>
        <p className="text-sm text-gray-400 mb-4">Number of books read per month.</p>
        <Line data={activityChartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default Analytics;