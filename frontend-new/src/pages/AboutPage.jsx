import React from 'react';
import Logo from '../assets/logo.png'; // Import your official logo

function AboutPage() {
  const cardStyle = "bg-gray-800 p-6 rounded-lg shadow-lg";

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-100">About Us</h1>

      <section className={cardStyle}>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8 p-6 bg-gray-700/50 rounded-lg">
          <img src={Logo} alt="LibroVault Logo" className="w-24 h-24" />
          <div>
            <h2 className="text-5xl font-bold text-white text-center md:text-left">LibroVault</h2>
            <p className="text-xl text-gray-300 text-center md:text-left">Your Smart Digital Library</p>
          </div>
        </div>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <h3 className="text-2xl font-semibold text-white">Our Story</h3>
          <p>
            Welcome to LibroVault, your new home for digital reading.
          </p>
          <p>
            Founded in 2025 by Sayan Hazra, LibroVault was born from a simple idea: in an age of digital clutter, our libraries should be smarter, more personal, and accessible from anywhere. We set out to create a single, beautiful, and intelligent platform for readers and creators alike—not just a place to store eBooks, but a true "vault" that enriches your knowledge and helps you discover your next great read.
          </p>
          <p>
            Our mission is to seamlessly blend technology with the timeless joy of reading, creating a personalized experience that's both powerful and easy to use.
          </p>

          <h3 className="text-2xl font-semibold text-white pt-4 border-t border-gray-700">What is LibroVault?</h3>
          <p>
            LibroVault is a smart eBook management system where you can build, browse, and read your digital collection. It's a community-driven platform where users can contribute to an ever-expanding library, with an administrative team ensuring quality and organization.
          </p>
          <p>
            Using powerful AI, LibroVault goes beyond simple storage. It learns from your reading habits to suggest new titles you'll love, automatically summarizes books, and even provides a voice assistant to read to you.
          </p>

          <h3 className="text-2xl font-semibold text-white pt-4 border-t border-gray-700">Key Features: What You Can Do</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Discover a Rich Library:</strong> Browse, search, and filter a wide catalog of books by title, author, or genre. Our library features both free and premium "PRO" books, available for purchase through a secure payment system.</li>
            <li><strong>Read in Our Modern Reader:</strong> Open any book directly in your browser. Our reader features pagination, a download option, and a Text-to-Speech (TTS) voice assistant to read the content to you.</li>
            <li><strong>Never Lose Your Spot:</strong> With our built-in bookmarking system, you can save your progress at any page. All your bookmarks are collected in your "My Library" page.</li>
            <li><strong>AI-Powered Recommendations:</strong> Get automatic recommendations on your dashboard based on your reading history, or use our "Discover" engine to find books based on any topic or author you love.</li>
            <li><strong>Dynamic Admin Dashboard:</strong> For our admin team, a powerful dashboard provides live analytics on user signups, reading activity, and system status. Admins can manage all users and approve new book submissions.</li>
          </ul>

          <h3 className="text-2xl font-semibold text-white pt-4 border-t border-gray-700">How to Share Your Book</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Navigate</strong> to the "Submit Book" page from the sidebar.</li>
            <li><strong>Fill in the Details:</strong> Provide the book's title, author, a short description, and select one or more genres.</li>
            <li><strong>Upload Your Files:</strong> Upload an attractive cover image and the book's PDF file.</li>
            <li><strong>Submit for Review:</strong> Your submission is sent to our admin team.</li>
          </ol>
          <p>
            If you are a registered user, your book will be reviewed and approved by an admin. If you are an admin, your book will be published instantly, and our AI will even generate a summary for it automatically.
          </p>
        </div>
      </section>
    </>
  );
}

export default AboutPage;