import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Logo from '../assets/logo.png'; // Correct path to your new logo

function LoginPage() {
    // State to toggle between Login and Sign Up views
    const [isLoginView, setIsLoginView] = useState(true);

    // States for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // For signup form
    
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Handler for email/password login
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert(error.error_description || error.message);
        } else {
            navigate('/'); // Redirect on success
        }
        setLoading(false);
    };
    
    // Handler for email/password signup
    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username, // Save username to Supabase Auth metadata
                    role: 'user'      // Set a default role on signup
                }
            }
        });
        if (error) {
            alert(error.error_description || error.message);
        } else {
            alert('Signup successful! Please check your email to verify your account.');
            setIsLoginView(true); // Switch back to login view after successful signup
            // Clear fields after signup attempt
            setEmail('');
            setPassword('');
            setUsername('');
        }
        setLoading(false);
    };

    // Handler for password reset request
    const handlePasswordReset = async () => {
        const emailToReset = prompt("Please enter the email address for your account to receive a password reset link:");
        if (!emailToReset) return; // User cancelled

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
            // URL to redirect user to after they successfully reset password in the email
            redirectTo: window.location.origin, 
        });
        setLoading(false);

        if (error) {
            alert(`Error sending reset email: ${error.message}`);
        } else {
            alert('Password reset email sent! Please check your inbox (and spam folder).');
        }
    };

    // Handler for Google OAuth login
    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // URL to redirect user back to after successful Google login
                redirectTo: window.location.origin
            }
        });
        if (error) {
            alert(`Google login failed: ${error.message}`);
            setLoading(false);
        }
        // No setLoading(false) on success, page will redirect
    };

    // --- Reusable Tailwind CSS Styles ---
    const inputStyle = "w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 text-white placeholder-gray-400";
    const buttonStyle = "w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-white transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    const googleButtonStyle = "w-full py-2 px-4 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-md font-semibold transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-2xl">
                
                {/* Logo and Animated Title */}
                <div className="flex justify-center items-center gap-4">
                    <img src={Logo} alt="LibroVault Logo" className="w-12 h-12" />
                    <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 animate-text-gradient bg-[200%_auto]">
                        LibroVault
                    </h1>
                </div>
                
                {/* Conditional Rendering of Login or Signup Form */}
                {isLoginView ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <h2 className="text-2xl text-center text-gray-300">Login</h2>
                        <div>
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} required />
                        </div>
                        <div>
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} required />
                        </div>
                        <div className="text-right">
                           <button type="button" onClick={handlePasswordReset} disabled={loading} className="text-sm text-cyan-400 hover:underline focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                                Forgot Password?
                           </button>
                        </div>
                        <button type="submit" disabled={loading} className={buttonStyle}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        
                        {/* Separator and Google Button */}
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-600"></div>
                            <span className="flex-shrink mx-4 text-gray-400">Or continue with</span>
                            <div className="flex-grow border-t border-gray-600"></div>
                        </div>
                        <button type="button" onClick={handleGoogleLogin} disabled={loading} className={googleButtonStyle}>
                           <svg className="w-5 h-5" viewBox="0 0 48 48"> {/* Google SVG */}
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.8c-.57 2.73-2.18 4.96-4.52 6.51l7.87 6.09c4.63-4.27 7.23-10.43 7.23-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.87-6.09c-2.16 1.45-4.92 2.3-8.02 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                <path fill="none" d="M0 0h48v48H0z"></path>
                            </svg>
                            Sign in with Google
                        </button>
                        
                        <p className="text-center text-gray-400">
                            Don't have an account?{' '}
                            <button type="button" onClick={() => { setIsLoginView(false); setEmail(''); setPassword(''); }} className="link-button">
                                Sign Up
                            </button>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleSignup} className="space-y-6">
                        <h2 className="text-2xl text-center text-gray-300">Create Account</h2>
                         <div>
                            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputStyle} required />
                        </div>
                        <div>
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} required />
                        </div>
                        <div>
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} required />
                        </div>
                        <button type="submit" disabled={loading} className={buttonStyle}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                        <p className="text-center text-gray-400">
                            Already have an account?{' '}
                            <button type="button" onClick={() => { setIsLoginView(true); setEmail(''); setPassword(''); setUsername(''); }} className="link-button">
                                Login
                            </button>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}

export default LoginPage;