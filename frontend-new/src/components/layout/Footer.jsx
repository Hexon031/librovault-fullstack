import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/logo.png';

// --- Icon Components ---
const FacebookIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.148 3.227-1.669 4.771-4.919 4.919-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-3.227-.148-4.771-1.669-4.919-4.919-.058-1.265-.07-1.646-.07-4.85s.012-3.584.07-4.85c.148-3.227 1.669-4.771 4.919-4.919 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.305.196-6.471 2.368-6.67 6.67-.058 1.279-.072 1.687-.072 4.947s.014 3.668.072 4.947c.196 4.305 2.368 6.471 6.67 6.67 1.279.058 1.687.072 4.947.072s3.668-.014 4.947-.072c4.305-.196 6.471-2.368 6.67-6.67.058-1.279.072-1.687.072-4.947s-.014-3.668-.072-4.947c-.196-4.305-2.368-6.471-6.67-6.67C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 110 2.88 1.44 1.44 0 010-2.88z" />
  </svg>
);
// --- End Icon Components ---

function Footer() {
  return (
    <footer className="w-full bg-gray-800 text-gray-300 py-12 px-8 mt-16 shadow-inner">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Column 1: Logo and Description */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src={Logo} alt="LibroVault Logo" className="w-10 h-10" />
            <span className="text-3xl font-bold text-white">LibroVault</span>
          </div>
          <p className="text-gray-400 mb-4">
            A modern, intelligent eBook management system. Your personal digital library, accessible anywhere.
          </p>
          <div className="flex gap-4">
            <a href="https://www.facebook.com/share/1A9sZFqtPh/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><FacebookIcon /></a>
            <a href="https://www.instagram.com/sayanhazra2003?igsh=MXdqdHkxNW8zcW00Mw==" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><InstagramIcon /></a>
            <a href="https://x.com/Sayanhazra2003?t=OnbMwIdBmkBDzHTruKEzOw&s=09" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><XIcon /></a>
          </div>
        </div>
        
        {/* Column 2: Company Links */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">COMPANY</h2>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        
        {/* Column 3: Get in Touch */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">GET IN TOUCH</h2>
          <ul className="space-y-2">
            <li>+91 8001044323</li>
            <li>librovault031@gmail.com</li>
          </ul>
        </div>
        
      </div>
      
      <hr className="border-t border-gray-700 my-8" />
      
      <p className="text-center text-gray-500">
        Copyright 2025 © LibroVault.com - All Right Reserved.
      </p>
    </footer>
  );
}

export default Footer;