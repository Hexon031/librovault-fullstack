import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function MyLibraryPage() {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBookmarks = async () => {
            const token = (await supabase.auth.getSession())?.data?.session?.access_token;
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Call the backend endpoint that runs our custom SQL function
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/my-bookmarks`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setBookmarks(data);
                } else {
                    console.error("Failed to fetch bookmarks.");
                }
            } catch (error) {
                console.error("Error fetching bookmarks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookmarks();
    }, [navigate]);

    // Reusable styles
    const cardStyle = "bg-gray-800 p-4 rounded-lg shadow-lg";
    const buttonStyle = "py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-white transition duration-300";

    if (loading) {
        return <p className="text-gray-400 p-8">Loading your library...</p>;
    }

    return (
        <>
            <h1 className="text-3xl font-bold mb-6 text-gray-100">My Library</h1>
            
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-200">My Bookmarks</h2>
                {bookmarks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {bookmarks.map(bookmark => (
                            <div key={bookmark.bookmark_id} className={`${cardStyle} flex flex-col group overflow-hidden`}>
                                <img 
                                    src={bookmark.book_cover_url || 'https://via.placeholder.com/150x220.png?text=No+Cover'} 
                                    alt={`${bookmark.book_title} cover`} 
                                    className="w-full h-64 object-cover mb-4 rounded-md transform group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="flex-grow flex flex-col">
                                    <h3 className="text-lg font-semibold mb-1 truncate">{bookmark.book_title}</h3>
                                    <p className="text-xs text-gray-400 mb-2">by {bookmark.book_author}</p>
                                    <p className="text-sm font-semibold text-cyan-400 mb-4">
                                        Bookmarked at page {bookmark.page_number}
                                    </p>
                                    <button 
                                        onClick={() => navigate(`/reader/${bookmark.book_id}?page=${bookmark.page_number}`)} 
                                        className={`${buttonStyle} mt-auto`}
                                    >
                                        Jump to Page
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`${cardStyle} border-l-4 border-cyan-400`}>
                        <p className="text-gray-400">You haven't bookmarked any books yet.</p>
                        <p className="text-gray-500 text-sm mt-2">Go to a book's reader page and click the bookmark icon in the footer to save your spot!</p>
                    </div>
                )}
            </section>
        </>
    );
}

export default MyLibraryPage;