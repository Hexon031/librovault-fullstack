LibroVault 
A smart eBook management system and personal digital library, powered by AI. LibroVault is a modern, full-stack web application designed for readers and creators. It provides a seamless platform to upload, manage, read, and discover eBooks, with a powerful 
admin dashboard and intelligent AI features to enhance the user experience. 
 Live Demo 
● Frontend (Vercel): https://librovault031.vercel.app/ 
● Backend API (Render): https://librovault-backend.onrender.com/ 
✨
 Core Features 
LibroVault is packed with features for both users and administrators, creating a complete 
ecosystem for a digital library. 
User & Session Management 
● Secure Authentication: Users can sign up and log in using email/password or Google OAuth. 
● Password Reset: A "Forgot Password" flow sends a secure reset link to the user's email. 
● Personalized Experience: The UI greets users by their username and adapts based on their role. 
Library & Reading 
● Dynamic Book Catalog: Browse all approved books in a modern, responsive grid. 
● Powerful Search & Filtering: Instantly search for books by title or author, and filter the entire library by genre. 
● Pagination: The book list loads quickly with a "Load More" button for infinite scrolling performance. 
● Book Details Page: Click on any book to see a dedicated page with its cover, summary, rating, and genres. 
● In-Browser PDF Reader: Read books directly in a clean, distraction-free reader with page navigation. 
● Bookmarking: Save your progress on any page. The app remembers your last read page and allows you to jump directly back in from the "My Library" section. 
● Download Option: Securely download the PDF of any book you have access to. 
● Rating System: Give books a 1-5 star rating, which contributes to its a public average. Monetization & Contributions 
● User Submissions: Any user can submit a new book, providing a title, author, description, cover image, and multi-genre tags. 
● Admin Approval Workflow: User-submitted books are held in a pending queue for an admin to review. 
● Email Notifications: Upon approval, the submitting user automatically receives an email notification. 
● PRO Books & Payments: Admins can mark books as "PRO" and set a price. Users can purchase access to these books through a secure Razorpay payment gateway. 
AI Integration (Powered by Google Gemini) 
● Automatic Summaries: When an admin approves a book that has no summary, the AI reads the first few pages and automatically generates a concise summary. 
● History-Based Recommendations: The dashboard displays a "Recommended for You" 
section based on the genres of books the user has recently read. 
● Interactive Discovery Engine: A dedicated section on the dashboard allows users to enter any topic or author and get instant AI-powered recommendations from the library. 
Admin Dashboard 
● Centralized Layout: A professional dashboard with a fixed sidebar and multiple pages. 
● User Management: Admins can view a list of all registered users in the system. 
● Live Analytics: The dashboard includes dynamic charts showing monthly new user signups and reading activity, with data fetched from the database. 
● System Status: A panel displays simulated server load and database connections, as well as the real storage capacity used. 
● Direct Publishing: Admins can bypass the approval queue; their book submissions are published instantly. 
�
�
 Tech Stack 
The project is built with a modern, full-stack architecture. 
Frontend 
● Framework: React (with Vite) 
● Styling: Tailwind CSS 
● Routing: React Router 
● UI Components: Chart.js, react-pdf 
● Deployment: Vercel 
Backend 
● Framework: Python (Flask) 
● Server: Gunicorn 
● Deployment: Render 
Database & Services 
● Database: Supabase (PostgreSQL) 
● Authentication: Supabase Auth (Email/Password, Google OAuth) 
● File Storage: Supabase Storage 
● AI: Google Gemini API (via google-generativeai) 
● Payments: Razorpay 
�
�
 Getting Started 
To run this project locally, you'll need to set up the backend and frontend separately. 
Prerequisites 
● Node.js and npm/yarn 
● Python and pip 
● A Supabase account 
● A Google AI Studio API Key 
● A Razorpay account (in Test Mode) 
Backend Setup (Flask) 
1. Navigate to the backend folder. 
2. Create and activate a virtual environment: 
python -m venv venv 
source venv/bin/activate  # On Windows: venv\Scripts\activate 
3. Install the required packages: 
pip install -r requirements.txt 
4. Create a .env file in the backend folder and populate it with your secret keys (copy from 
the .env.example or your Render setup). 
5. Run the backend server: 
python run.py 
The server will be running at http://localhost:5000. 
Frontend Setup (React) 
1. Navigate to the frontend-new folder. 
2. Install the required packages: 
npm install 
3. Create a .env file in the frontend-new folder and add your public keys: 
VITE_API_URL="http://localhost:5000" 
VITE_RAZORPAY_KEY_ID="your_public_razorpay_test_key" 
4. Run the frontend development server: 
npm run dev
Here are the previews:
<img width="1919" height="975" alt="image" src="https://github.com/user-attachments/assets/a23573b6-aaeb-467d-9f7e-17658b09f577" />
