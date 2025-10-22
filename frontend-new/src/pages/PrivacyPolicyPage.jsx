import React from 'react';
import { Link } from 'react-router-dom';

function PrivacyPolicy() {
  const cardStyle = "bg-gray-800 p-6 rounded-lg shadow-lg";

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-100">Privacy Policy</h1>
      
      <section className={`${cardStyle} text-gray-300 leading-relaxed space-y-4`}>
        <p><strong>Last updated:</strong> October 21, 2025</p>
        <p>
          Welcome to LibroVault ("us", "we", or "our"). We operate the LibroVault web application (hereinafter referred to as the "Service").
          This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
        </p>

        <h2 className="text-2xl font-semibold text-white pt-4">Information Collection and Use</h2>
        <p>
          We collect several different types of information for various purposes to provide and improve our Service to you.
        </p>
        <h3 className="text-xl font-semibold text-white">Personal Data</h3>
        <p>
          While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This includes, but is not limited to:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Email address</li>
          <li>Username</li>
          <li>Purchase history</li>
          <li>Reading history and bookmarks</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white pt-4">Use of Data</h2>
        <p>LibroVault uses the collected data for various purposes:</p>
        <ul className="list-disc list-inside ml-4">
          <li>To provide and maintain the Service</li>
          <li>To manage your account and book submissions</li>
          <li>To provide customer support</li>
          <li>To process your payments for PRO books</li>
          <li>To provide you with AI-powered recommendations</li>
          <li>To monitor the usage of the Service</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white pt-4">Security of Data</h2>
        <p>
          The security of your data is important to us. We use Supabase and other industry-standard measures to protect your information, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.
        </p>

        <h2 className="text-2xl font-semibold text-white pt-4">Links to Other Sites</h2>
        <p>
          Our Service may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third-party's site. We strongly advise you to review the Privacy Policy of every site you visit.
        </p>

        <h2 className="text-2xl font-semibold text-white pt-4">Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </p>
        
        <Link to="/about" className="text-cyan-400 hover:underline pt-6 inline-block">← Back to About Us</Link>
      </section>
    </>
  );
}

export default PrivacyPolicy;