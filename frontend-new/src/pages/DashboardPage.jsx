import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- Read-only Star Display Component ---
const StarRating = ({ rating, count }) => (
    <div className="flex items-center gap-1 text-sm text-amber-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.446a1 1 0 00-1.175 0l-3.368 2.446c-.784.57-1.838-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" /></svg>
        <span>{rating ? rating.toFixed(1) : 'N/A'}</span>
        <span className="text-gray-500 text-xs">({count} ratings)</span>
    </div>
);

function DashboardPage({ user }) {
    // --- STATE MANAGEMENT ---
    const [books, setBooks] = useState([]);
    const [pendingBooks, setPendingBooks] = useState([]);
    const [historyRecommendations, setHistoryRecommendations] = useState([]);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [genreFilter, setGenreFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalBooks, setTotalBooks] = useState(0);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const booksPerPage = 10;

    // States for "Discover" section
    const [discoverTopic, setDiscoverTopic] = useState('');
    const [discoverStyle, setDiscoverStyle] = useState('similar');
    const [discoverRecommendations, setDiscoverRecommendations] = useState([]);
    const [discoverLoading, setDiscoverLoading] = useState(false);

    const navigate = useNavigate();
    const genres = ["Fiction", "Sci-Fi", "Mystery", "Horror", "Comedy", "Romance", "Thriller", "Biography", "Sad", "Murder", "Psychology", "Politics", "Other"];

    // --- API HELPER FUNCTIONS ---
    const fetchBooks = useCallback(async (token, query, genre, page, loadMore = false) => {
        setLoadingBooks(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/books?q=${query}&genre=${genre}&page=${page}&limit=${booksPerPage}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBooks(prevBooks => loadMore ? [...prevBooks, ...data.books] : data.books);
                setTotalBooks(data.totalCount);
            } else {
                console.error("Failed to fetch books");
                setBooks([]); setTotalBooks(0);
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoadingBooks(false);
        }
    }, []); 

    const fetchPendingBooks = async (token) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pending-books`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) setPendingBooks(await response.json());
    };

    const fetchHistoryRecommendations = async (token) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/recommendations`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                if (data && Array.isArray(data.recommendations)) {
                    setHistoryRecommendations(data.recommendations);
                }
            } else {
                console.error("Failed to fetch history recommendations. Backend may be down or returning an error.");
            }
        } catch (error) {
             console.error("Error fetching history recommendations:", error);
        }
    };

    const fetchPurchases = async (token) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/my-purchases`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const ids = await response.json();
            setPurchasedBookIds(new Set(ids));
        }
    };

    // --- DATA FETCHING EFFECT ---
    useEffect(() => {
        const initializeDashboard = async () => {
            const token = (await supabase.auth.getSession())?.data?.session?.access_token;
            if (!token) { navigate('/login'); return; }
            setCurrentPage(1);
            fetchBooks(token, searchTerm, genreFilter, 1, false);
            fetchPurchases(token);
            fetchHistoryRecommendations(token);
            if (user?.user_metadata?.role === 'admin') {
                fetchPendingBooks(token);
            }
        };
        initializeDashboard();
    }, [user, navigate, searchTerm, genreFilter, fetchBooks]);

    // --- EVENT HANDLERS ---
    const handleUpdateStatus = async (bookId, status) => {
        const token = (await supabase.auth.getSession()).data.session.access_token;
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/books/${bookId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: status })
        });
        const data = await response.json();
        alert(data.message || data.error);
        if (response.ok) {
            fetchPendingBooks(token);
            fetchBooks(token, searchTerm, genreFilter, 1, false);
        }
    };

    const handlePurchase = async (e, book) => {
        e.stopPropagation(); // Stop the click from bubbling up to the card
        const token = (await supabase.auth.getSession()).data.session.access_token;
        const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ book_id: book.id }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) { alert(orderData.error); return; }

        const options = {
            key: "YOUR_PUBLIC_RAZORPAY_KEY_ID", // IMPORTANT: Replace this
            amount: orderData.amount,
            currency: orderData.currency,
            name: "LibroVault",
            description: `Purchase: ${book.title}`,
            order_id: orderData.id,
            handler: async function (response) {
                const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        book_id: book.id
                    }),
                });
                const verifyData = await verifyRes.json();
                alert(verifyData.message || verifyData.error);
                if (verifyRes.ok) {
                    setPurchasedBookIds(prev => new Set(prev).add(book.id));
                }
            },
            prefill: { name: user.user_metadata?.username, email: user.email },
            theme: { color: "#0891B2" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };
    
    const handleDiscoverRecommendations = async (e) => {
        e.preventDefault();
        setDiscoverLoading(true);
        setDiscoverRecommendations([]);
        const token = (await supabase.auth.getSession())?.data?.session?.access_token;
        if (!token) { setDiscoverLoading(false); return; }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/discover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ topic_or_author: discoverTopic, style: discoverStyle })
            });
            if (response.ok) {
                const data = await response.json();
                setDiscoverRecommendations(data.recommendations || []);
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to get recommendations.'}`);
            }
        } catch (error) {
            alert(`An error occurred: ${error.message}`);
        } finally {
            setDiscoverLoading(false);
        }
    };

    const handleLoadMore = async () => {
        const nextPage = currentPage + 1;
        const token = (await supabase.auth.getSession())?.data?.session?.access_token;
        if (token) {
            fetchBooks(token, searchTerm, genreFilter, nextPage, true);
            setCurrentPage(nextPage);
        }
    };

    // --- STYLES ---
    const inputStyle = "w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500";
    const buttonStyle = "py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-white transition duration-300 disabled:opacity-50";
    const cardStyle = "bg-gray-800 p-6 rounded-lg shadow-lg";
    const hasMoreBooks = books.length < totalBooks;

    return (
        <>
            <h1 className="text-3xl font-bold mb-6 text-gray-100">Dashboard</h1>
            
            {user?.user_metadata?.role === 'admin' && (
                <section className={`${cardStyle} mb-8 border-l-4 border-cyan-400`}>
                    <h2 className="text-2xl font-bold mb-4">Admin Panel: Pending Approvals</h2>
                    <div className="space-y-4">
                        {pendingBooks.length > 0 ? pendingBooks.map(book => (
                            <div key={book.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                                <div><h3 className="font-semibold">{book.title}</h3><p className="text-sm text-gray-400">by {book.author}</p></div>
                                <div className="flex gap-2"><button onClick={() => handleUpdateStatus(book.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded">Approve</button><button onClick={() => handleUpdateStatus(book.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">Reject</button></div>
                            </div>
                        )) : <p className="text-gray-400">No books are pending approval.</p>}
                    </div>
                </section>
            )}

            {historyRecommendations && historyRecommendations.length > 0 && (
                <section className={`${cardStyle} mb-8`}>
                    <h2 className="text-2xl font-bold mb-4">Recommended for You (Based on History) 🧠</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {historyRecommendations.map(book => (
                            <div key={book.id} className="bg-gray-700 p-4 rounded-md flex flex-col">
                                <div className="flex-grow"><h3 className="font-semibold">{book.title}</h3><p className="text-sm text-gray-400">by {book.author}</p></div>
                                <button onClick={() => navigate(`/reader/${book.id}`)} className={`${buttonStyle} mt-4 text-sm`}>Read Now</button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="mb-8">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">Available Books</h2>
                    <div className="flex gap-4">
                        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className={`${inputStyle} max-w-xs`}><option value="">All Genres</option>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select>
                        <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputStyle} max-w-xs`} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {books.map(book => {
                        const hasAccess = !book.is_pro || purchasedBookIds.has(book.id) || user?.user_metadata?.role === 'admin';
                        return (
                            <div 
                                key={book.id} 
                                className={`${cardStyle} flex flex-col group overflow-hidden relative cursor-pointer`}
                                onClick={() => navigate(`/book/${book.id}`)}
                            >
                                
                                <div className="relative">
                                    <img src={book.cover_image_url || 'https://via.placeholder.com/150x220.png?text=No+Cover'} alt={`${book.title} cover`} className="w-full h-64 object-cover mb-4 rounded-md transform group-hover:scale-105 transition-transform duration-300"/>
                                    {book.is_pro && (<div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">PRO</div>)}
                                </div>
                                <div className="flex-grow flex flex-col">
                                    <h3 className="text-lg font-semibold mb-1 truncate">{book.title}</h3>
                                    <p className="text-xs text-gray-400 mb-2">by {book.author}</p>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {book.genre?.map(g => (<span key={g} className="text-xs font-semibold bg-cyan-800 text-cyan-200 self-start px-2 py-1 rounded-full">{g}</span>))}
                                    </div>
                                </div>
                                
                                <div className="absolute inset-0 bg-gray-900 bg-opacity-95 p-4 rounded-lg
                                              opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                              transition-all duration-300 ease-in-out scale-90 group-hover:scale-100
                                              flex flex-col">
                                    <h3 className="text-lg font-semibold mb-1 truncate text-white">{book.title}</h3>
                                    <p className="text-xs text-gray-400 mb-2">by {book.author}</p>
                                    
                                    <StarRating rating={book.average_rating} count={book.rating_count} />

                                    <p className="text-sm text-gray-300 italic flex-grow my-4 overflow-y-auto">
                                        {book.summary || 'No summary available.'}
                                    </p>
                                    
                                    {hasAccess ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/reader/${book.id}`); }} 
                                            className={`${buttonStyle} mt-auto`}
                                        >
                                            Read Now
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handlePurchase(e, book); }} 
                                            className={`${buttonStyle} mt-auto`}
                                        >
                                            Buy for ₹{book.price}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {loadingBooks && <p className="text-center text-gray-400 mt-6">Loading books...</p>}
                {!loadingBooks && books.length === 0 && <p className="text-gray-400 mt-4">No books match your filters.</p>}
                {!loadingBooks && hasMoreBooks && (
                    <div className="text-center mt-8">
                        <button onClick={handleLoadMore} className={buttonStyle} disabled={loadingBooks}>
                            Load More Books
                        </button>
                    </div>
                )}
            </section>
            
            <section className={`${cardStyle} mt-8`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">✏️</span>
                    <h2 className="text-2xl font-bold">Discover Your Next Read</h2>
                </div>
                <p className="text-gray-400 mb-6">Let our AI engine suggest books based on your interests.</p>
                <form onSubmit={handleDiscoverRecommendations} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-1">Topic or Author</label>
                            <input id="topic" type="text" placeholder="e.g., 'Dystopian futures' or 'Haruki Murakami'" value={discoverTopic} onChange={(e) => setDiscoverTopic(e.target.value)} className={inputStyle} required />
                            <p className="text-xs text-gray-500 mt-1">Enter a subject or a writer you like.</p>
                        </div>
                        <fieldset>
                            <legend className="block text-sm font-medium text-gray-300 mb-2">Recommendation Style</legend>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="recStyle" value="similar" checked={discoverStyle === 'similar'} onChange={(e) => setDiscoverStyle(e.target.value)} className="text-cyan-600 focus:ring-cyan-500" />Similar to my taste</label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="recStyle" value="surprise" checked={discoverStyle === 'surprise'} onChange={(e) => setDiscoverStyle(e.target.value)} className="text-cyan-600 focus:ring-cyan-500" />Surprise me</label>
                            </div>
                        </fieldset>
                        <button type="submit" disabled={discoverLoading} className={`${buttonStyle} bg-orange-600 hover:bg-orange-700 w-auto`}>
                            {discoverLoading ? 'Generating...' : '✨ Generate Recommendations'}
                        </button>
                    </div>
                    <div className="bg-gray-700/50 p-6 rounded-lg min-h-[200px] flex flex-col">
                        <h3 className="text-lg font-semibold mb-4">AI Suggestions</h3>
                        {discoverLoading ? (
                            <p className="text-gray-400">Thinking...</p>
                        ) : discoverRecommendations.length === 0 ? (
                            <p className="text-gray-500">Your book recommendations will appear here.</p>
                        ) : (
                            <div className="space-y-3">
                                {discoverRecommendations.map(book => (
                                    <div key={book.id} className="bg-gray-800 p-3 rounded-md flex items-center justify-between gap-2">
                                        <div className="flex-grow"><p className="font-semibold truncate">{book.title}</p><p className="text-xs text-gray-400">{book.author}</p></div>
                                        <button onClick={() => navigate(`/reader/${book.id}`)} className={`${buttonStyle} text-xs px-3 py-1`}>Read</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </section>
        </>
    );
}

export default DashboardPage;
