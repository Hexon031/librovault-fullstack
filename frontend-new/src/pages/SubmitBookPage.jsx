import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function SubmitBookPage({ user }) {
    // --- STATE MANAGEMENT ---
    const [newTitle, setNewTitle] = useState('');
    const [newAuthor, setNewAuthor] = useState('');
    const [newSummary, setNewSummary] = useState('');
    const [newFile, setNewFile] = useState(null);
    const [newCoverImage, setNewCoverImage] = useState(null);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [customGenre, setCustomGenre] = useState(''); // State for the 'Other' input
    const [isPro, setIsPro] = useState(false);
    const [price, setPrice] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    const navigate = useNavigate();
    // New, expanded list of genres
    const genres = ["Fiction", "Sci-Fi", "Mystery", "Horror", "Comedy", "Romance", "Thriller", "Biography", "Sad", "Murder", "Psychology", "Politics"];

    // --- EVENT HANDLERS ---
    const handleGenreChange = (genre) => {
        setSelectedGenres(prev => 
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const handleAddBook = async (e) => {
        e.preventDefault();
        
        // Combine predefined genres with the custom one if provided
        let finalGenres = selectedGenres.filter(g => g !== 'Other');
        if (selectedGenres.includes('Other') && customGenre.trim()) {
            finalGenres.push(customGenre.trim());
        }

        if (finalGenres.length === 0) { alert("Please select or specify at least one genre."); return; }
        if (!newFile || !newCoverImage) { alert("Please select a book file and a cover image."); return; }
        if (isPro && (!price || parseFloat(price) <= 0)) { alert("Please enter a valid price for a PRO book."); return; }
        
        setIsUploading(true);
        try {
            const token = (await supabase.auth.getSession()).data.session.access_token;
            
            // 1. Upload Cover Image
            const coverFileName = `${Date.now()}_cover_${newCoverImage.name}`;
            const { error: coverError } = await supabase.storage.from('covers').upload(coverFileName, newCoverImage);
            if (coverError) throw coverError;
            const { data: coverUrlData } = supabase.storage.from('covers').getPublicUrl(coverFileName);

            // 2. Upload Book File
            const bookFileName = `${Date.now()}_book_${newFile.name}`;
            const { error: bookError } = await supabase.storage.from('ebooks').upload(bookFileName, newFile);
            if (bookError) throw bookError;
            const { data: bookUrlData } = supabase.storage.from('ebooks').getPublicUrl(bookFileName);

            // 3. Send all data to backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: newTitle,
                    author: newAuthor,
                    summary: newSummary,
                    file_url: bookUrlData.publicUrl,
                    cover_image_url: coverUrlData.publicUrl, 
                    genre: finalGenres, // Send the final array of genres
                    is_pro: isPro,
                    price: isPro ? parseFloat(price) : 0
                })
            });
            
            const backendData = await response.json();
            alert(backendData.message || backendData.error);
            
            if (response.ok) {
                navigate('/'); // Navigate back to dashboard on success
            }
        } catch (error) {
            alert(`An error occurred: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    // --- STYLES ---
    const inputStyle = "w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 text-white placeholder-gray-400";
    const buttonStyle = "py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold text-white transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
    const cardStyle = "bg-gray-800 p-6 rounded-lg shadow-lg";

    return (
        <>
            <h1 className="text-3xl font-bold mb-6 text-gray-100">Submit a New Book</h1>
            <section className={cardStyle}>
                <form onSubmit={handleAddBook} className="space-y-6">
                    {/* --- Text Inputs --- */}
                    <input type="text" placeholder="Book Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={inputStyle} required />
                    <input type="text" placeholder="Author Name" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} className={inputStyle} required />
                    <textarea placeholder="Short Description / Summary (Optional)" value={newSummary} onChange={(e) => setNewSummary(e.target.value)} className={`${inputStyle} h-24 resize-none`}></textarea>
                    
                    {/* --- Genre Selection --- */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Genre(s) (Select at least one)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-700/50 rounded-lg">
                            {genres.map(genre => (
                                <label key={genre} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-600 transition-colors">
                                    <input 
                                        type="checkbox"
                                        checked={selectedGenres.includes(genre)}
                                        onChange={() => handleGenreChange(genre)}
                                        className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <span>{genre}</span>
                                </label>
                            ))}
                            {/* "Other" checkbox */}
                            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-600 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={selectedGenres.includes('Other')} 
                                    onChange={() => handleGenreChange('Other')} 
                                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-600 focus:ring-cyan-500" 
                                />
                                <span>Other</span>
                            </label>
                        </div>
                        {/* Conditional input for "Other" genre */}
                        {selectedGenres.includes('Other') && (
                            <input 
                                type="text" 
                                placeholder="Please specify other genre" 
                                value={customGenre} 
                                onChange={(e) => setCustomGenre(e.target.value)} 
                                className={`${inputStyle} mt-2`} 
                                required 
                            />
                        )}
                    </div>

                    {/* --- Admin-Only PRO Book Section --- */}
                    {user?.user_metadata?.role === 'admin' && (
                        <div className="bg-gray-700/50 p-4 rounded-lg space-y-4 border border-gray-600">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isPro} 
                                    onChange={(e) => setIsPro(e.target.checked)} 
                                    className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-500" 
                                />
                                <span className="font-semibold text-cyan-400">Mark as PRO Book (Paid)</span>
                            </label>
                            {isPro && (
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-400">Price (INR)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="e.g., 199" 
                                        value={price} 
                                        onChange={(e) => setPrice(e.target.value)} 
                                        className={inputStyle} 
                                        required 
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* --- File Inputs --- */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">Cover Image</label>
                        <input id="cover-input" type="file" accept="image/*" onChange={(e) => setNewCoverImage(e.target.files[0])} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-700" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">eBook File (PDF)</label>
                        <input id="file-input" type="file" accept=".pdf" onChange={(e) => setNewFile(e.target.files[0])} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-700" required />
                    </div>

                    {/* --- Submit Button --- */}
                    <button type="submit" disabled={isUploading} className={`${buttonStyle} w-auto`}>
                        {isUploading 
                            ? 'Uploading...' 
                            : (user?.user_metadata?.role === 'admin' ? 'Publish Book' : 'Submit for Approval')}
                    </button>
                </form>
            </section>
        </>
    );
}

export default SubmitBookPage;