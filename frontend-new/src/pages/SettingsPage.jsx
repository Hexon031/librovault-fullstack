import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SettingsPage({ user, onUserUpdate }) {
    const [username, setUsername] = useState(user.username || '');
    const [dob, setDob] = useState(user.dob || '');
    const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Fetch user profile on load to ensure we have the latest data
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await fetch($`{import.meta.env.VITE_API_URL}api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsername(data.username || '');
                setDob(data.dob || '');
                setPhoneNumber(data.phone_number || '');
            } else {
                alert("Failed to fetch user profile.");
            }
        };
        fetchUserProfile();
    }, [token, navigate]);


    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const response = await fetch($`{import.meta.env.VITE_API_URL}/api/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, dob, phone_number: phoneNumber })
        });
        const data = await response.json();
        alert(data.message || data.error);
        if (response.ok) {
            // Trigger a full app state update if username changed
            onUserUpdate();
        }
    };

    return (
        <div className="App">
            <h1>User Settings for {user.username}</h1>
            <button onClick={() => navigate('/')}>Back to Dashboard</button>
            <hr />
            <form onSubmit={handleProfileUpdate}>
                <h2>Update Profile</h2>
                <label>Username:</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /> <br />
                <label>Date of Birth:</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /> <br />
                <label>Phone Number:</label>
                <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /> <br />
                <button type="submit">Save Changes</button>
            </form>
        </div>
    );
}

export default SettingsPage;