import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- Clickable Star Rater Component ---
const StarRater = ({ rating, onRate }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    onClick={() => onRate(star)}
                    className={`w-8 h-8 cursor-pointer ${star <= rating ? 'text-amber-400' : 'text-gray-600'} hover:text-amber-300 transition-colors`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.446a1 1 0 00-1.175 0l-3.368 2.446c-.784.57-1.838-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                </svg>
            ))}
        </div>
    );
};

// --- Read-only Star Display Component ---
const StarRating = ({ rating, count }) => (
    <div className="flex items-center gap-1 text-sm text-amber-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.446a1 1 0 00-1.175 0l-3.368 2.446c-.784.57-1.838-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" /></svg>
        <span>{rating ? rating.toFixed(1) : 'N/A'}</span>
        <span className="text-gray-500 text-xs">({count} ratings)</span>
    </div>
);

function BookDetailPage() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasedBookIds, setPurchasedBookIds] = useState(new Set());
    const [user, setUser] = useState(null);
    const [myRating, setMyRating] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [token, setToken] = useState(null); // Store token in state

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const session = (await supabase.auth.getSession())?.data?.session;
            const sessionToken = session?.access_token;

            if (!sessionToken) {
                navigate('/login');
                return;
            }
            setUser(session.user);
            setToken(sessionToken); // Save token to state

            try {
                // Fetch book details, purchase status, and user's rating all at once
                const [bookRes, purchaseRes, ratingRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/books/${bookId}`, { headers: { 'Authorization': `Bearer ${sessionToken}` } }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/my-purchases`, { headers: { 'Authorization': `Bearer ${sessionToken}` } }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/books/${bookId}/my-rating`, { headers: { 'Authorization': `Bearer ${sessionToken}` } })
                ]);

                if (!bookRes.ok) {
                    throw new Error("Book not found or you do not have access.");
                }
                const bookData = await bookRes.json();
                setBook(bookData);

                if (purchaseRes.ok) {
                    const ids = await purchaseRes.json();
                    setPurchasedBookIds(new Set(ids));
                }

                if (ratingRes.ok) {
                    const data = await ratingRes.json();
                    if (data) setMyRating(data.rating);
                }
            } catch (error) {
                console.error("Failed to fetch book details:", error);
                alert(error.message);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [bookId, navigate]);

    const handlePurchase = async (bookToBuy) => {
        if (!token) return; // Ensure token exists
        
        const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ book_id: bookToBuy.id }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
            alert(orderData.error || "Could not create payment order.");
            return;
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use environment variable
            amount: orderData.amount,
            currency: orderData.currency,
            name: "LibroVault",
            description: `Purchase: ${bookToBuy.title}`,
            order_id: orderData.id,
            handler: async function (response) {
                const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                        book_id: bookToBuy.id
                    }),
                });
                const verifyData = await verifyRes.json();
                alert(verifyData.message || verifyData.error);
                if (verifyRes.ok) {
                    setPurchasedBookIds(prev => new Set(prev).add(bookToBuy.id));
                }
            },
            prefill: {
                name: user.user_metadata?.username || user.email.split('@')[0],
                email: user.email,
            },
            theme: {
                color: "#0891B2"
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handleRateBook = async (newRating) => {
        if (!token) return;
        const oldRating = myRating;
        setMyRating(newRating);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/books/${bookId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rating: newRating })
            });
            if (!response.ok) {
                throw new Error("Failed to save rating.");
            }
            // Refetch book data to get new average rating
            const bookRes = await fetch(`${import.meta.env.VITE_API_URL}/api/books/${bookId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            setBook(await bookRes.json());

        } catch (error) {
            alert(error.message);
            setMyRating(oldRating); // Revert on failure
        }
    };

    const handleDownload = async () => {
        if (!token) return;
        setIsDownloading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/books/download/${bookId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Download failed.');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = book.title ? `${book.title}.pdf` : 'book.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            alert(error.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const buttonStyle = "py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-white transition duration-300 disabled:opacity-50";
    
    if (loading) {
        return <div className="p-8 text-center text-gray-400">Loading book details...</div>;
    }

    if (!book) {
        return <div className="p-8 text-center text-red-400">Could not load book details. It may have been removed or is no longer available.</div>;
    }

    const hasAccess = !book.is_pro || purchasedBookIds.has(book.id) || user?.user_metadata?.role === 'admin';

    return (
        <div className="p-4 md:p-8 text-gray-200">
            <button onClick={() => navigate(-1)} className="mb-6 text-cyan-400 hover:underline font-semibold">
                ← Back to Previous Page
            </button>
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                
                {/* Left Column: Cover Image */}
                <div className="md:w-1/3 flex-shrink-0">
                    <img
                        src={book.cover_image_url || 'https://via.placeholder.com/300x450.png?text=No+Cover'}
                        alt={`${book.title} cover`}
                        className="w-full h-auto object-cover rounded-lg shadow-2xl aspect-[2/3]"
                    />
                </div>
                
                {/* Right Column: Book Details */}
                <div className="md:w-2/3">
                    {book.is_pro && (
                        <div className="mb-4 bg-amber-400 text-amber-900 text-sm font-bold inline-block px-3 py-1 rounded-full shadow-lg">PRO BOOK</div>
                    )}
                    <h1 className="text-4xl lg:text-5xl font-bold mb-2 text-white">{book.title}</h1>
                    <p className="text-xl text-gray-400 mb-4">by {book.author}</p>
                    
                    <div className="mb-4">
                        <StarRating rating={book.average_rating} count={book.rating_count} />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {book.genre?.map(g => (
                            <span key={g} className="text-sm font-semibold bg-gray-700 text-cyan-300 px-3 py-1 rounded-full">{g}</span>
                        ))}
                    </div>
                    
                    <h2 className="text-2xl font-semibold mb-2 text-gray-100">Summary</h2>
                    <p className="text-gray-300 mb-8 leading-relaxed">{book.summary || 'No summary has been provided for this book yet.'}</p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4">
                        {hasAccess ? (
                            <>
                                <button onClick={() => navigate(`/reader/${book.id}`)} className={`${buttonStyle} text-lg px-8 py-3`}>Read Now</button>
                                <button onClick={handleDownload} disabled={isDownloading} className="py-3 px-6 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold text-white transition duration-300 disabled:opacity-50">
                                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => handlePurchase(book)} className={`${buttonStyle} text-lg px-8 py-3`}>Buy for ₹{book.price}</button>
                        )}
                    </div>

                    {/* Rating Section */}
                    {hasAccess && (
                        <div className="mt-10 pt-6 border-t border-gray-700">
                            <h3 className="text-xl font-semibold mb-3">Your Rating</h3>
                            <StarRater rating={myRating} onRate={handleRateBook} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookDetailPage;