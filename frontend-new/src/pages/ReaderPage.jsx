import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { supabase } from '../supabaseClient';

// Use Vite's special import syntax to get the correct worker path automatically
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// --- Icon Components ---
const BookmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
    </svg>
);
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);
const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
    </svg>
);
const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v2a1 1 0 001 1h4a1 1 0 001-1v-2a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);
// --- End Icon Components ---

function ReaderPage() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Page State
    const [bookTitle, setBookTitle] = useState('');
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);
    
    // Bookmark State
    const [bookmarkStatus, setBookmarkStatus] = useState('');

    // Text-to-Speech State
    const [pageText, setPageText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // --- DATA FETCHING ---
    useEffect(() => {
        const initializeReader = async () => {
            const sessionToken = (await supabase.auth.getSession())?.data?.session?.access_token;
            if (!sessionToken) { navigate('/login'); return; }
            setToken(sessionToken);

            try {
                const queryParams = new URLSearchParams(location.search);
                const startPage = parseInt(queryParams.get('page'), 10);

                const bookRes = await fetch(`${import.meta.env.VITE_API_URL}/api/books/${bookId}`, { headers: { 'Authorization': `Bearer ${sessionToken}` } });
                if (!bookRes.ok) throw new Error("Failed to load book.");
                const data = await bookRes.json();
                setBookTitle(data.title);

                if (startPage && !isNaN(startPage)) {
                    setPageNumber(startPage);
                } else {
                    const bookmarkRes = await fetch(`${import.meta.env.VITE_API_URL}/api/bookmarks/${bookId}`, { headers: { 'Authorization': `Bearer ${sessionToken}` } });
                    if (bookmarkRes.ok) {
                        const bookmarkData = await bookmarkRes.json();
                        if (bookmarkData && bookmarkData.page_number) {
                            setPageNumber(bookmarkData.page_number);
                        }
                    }
                }
            } catch (error) {
                alert(error.message);
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };
        initializeReader();
        
        // Cleanup function to stop speech when component unmounts or page changes
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [bookId, navigate, location.search]);

    // Memoize the request options for the PDF viewer to prevent re-renders
    const options = useMemo(() => ({
        httpHeaders: { Authorization: `Bearer ${token}` },
    }), [token]);

    // Called when the PDF document successfully loads
    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    // Called when a new page is successfully rendered
    const onPageLoadSuccess = (page) => {
        // Stop any previous speech when the page changes
        handleStop(); 
        // Extract text from the new page for the TTS
        page.getTextContent().then(textContent => {
            const text = textContent.items.map(item => item.str).join(' ');
            setPageText(text);
        });
    };
    
    // --- EVENT HANDLERS ---
    const handleBookmark = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookmarks/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ page_number: pageNumber })
            });
            if (response.ok) {
                setBookmarkStatus('Bookmark saved!');
                setTimeout(() => setBookmarkStatus(''), 2000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save bookmark.");
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const goToPrevPage = () => {
        if (pageNumber > 1) setPageNumber(pageNumber - 1);
    };
    const goToNextPage = () => {
        if (numPages && pageNumber < numPages) setPageNumber(pageNumber + 1);
    };
    
    // --- TEXT-TO-SPEECH CONTROLS ---
    const handlePlayPause = () => {
        if (!('speechSynthesis' in window)) {
            alert('Sorry, your browser does not support text-to-speech.');
            return;
        }

        if (isSpeaking && !isPaused) {
            // Is currently speaking -> PAUSE
            window.speechSynthesis.pause();
            setIsPaused(true);
        } else if (isSpeaking && isPaused) {
            // Is paused -> RESUME
            window.speechSynthesis.resume();
            setIsPaused(false);
        } else {
            // Is not speaking -> PLAY
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(pageText);
            
            utterance.onend = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };
            utterance.onerror = (event) => {
                console.error("An error occurred during speech synthesis:", event.error);
                setIsSpeaking(false);
                setIsPaused(false);
            };
            
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
            setIsPaused(false);
        }
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
    };
    
    // --- RENDER LOGIC ---
    if (isLoading) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading Book...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
            {/* Header */}
            <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-xl font-bold text-white truncate">
                    Reading: {bookTitle}
                </h2>
                <button 
                    onClick={() => navigate('/')} 
                    className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-white transition"
                >
                    Back to Dashboard
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center p-4 md:p-8 overflow-y-auto">
                <div className="pdf-viewer shadow-2xl rounded-lg overflow-hidden">
                    {token && (
                        <Document
                            file={`${import.meta.env.VITE_API_URL}/api/books/proxy/${bookId}`}
                            onLoadSuccess={onDocumentLoadSuccess}
                            options={options}
                            loading={<p className="p-4">Loading PDF...</p>}
                            onLoadError={(error) => alert(`Error while loading document: ${error.message}`)}
                        >
                            <Page 
                                pageNumber={pageNumber} 
                                onLoadSuccess={onPageLoadSuccess}
                                renderTextLayer={true} // Important for text extraction
                                renderAnnotationLayer={false} // Can disable if not needed
                            />
                        </Document>
                    )}
                </div>
            </main>

            {/* Footer / Controls */}
            <footer className="bg-gray-800 shadow-inner p-4 flex justify-center items-center sticky bottom-0 z-10 gap-4">
                {/* TTS Controls */}
                <button onClick={handlePlayPause} className="p-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white transition" title={isSpeaking && !isPaused ? "Pause" : "Play"}>
                    {isSpeaking && !isPaused ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button onClick={handleStop} disabled={!isSpeaking} className="p-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white transition disabled:opacity-50" title="Stop">
                    <StopIcon />
                </button>
                
                {/* Page Navigation */}
                <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold text-white transition disabled:opacity-50">
                    Prev
                </button>
                <span className="font-semibold text-lg">
                    Page {pageNumber} of {numPages || '--'}
                </span>
                <button onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold text-white transition disabled:opacity-50">
                    Next
                </button>
                
                {/* Bookmark Button */}
                <div className="absolute right-4 flex items-center gap-2">
                    {bookmarkStatus && <span className="text-cyan-400 text-sm italic">{bookmarkStatus}</span>}
                    <button onClick={handleBookmark} className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded-full text-white transition" title="Save Bookmark">
                        <BookmarkIcon />
                    </button>
                </div>
            </footer>
        </div>
    );
}

export default ReaderPage;