import os
import requests
import fitz  # PyMuPDF
import io
import google.generativeai as genai
import random
import razorpay
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from functools import wraps

# --- 1. Initialization ---
load_dotenv()
app = Flask(__name__)
# Configure CORS to allow requests from your frontend's origin
CORS(app, origins=["http://localhost:5173", "https://librovault031.vercel.app"])  # Adjust port if needed

# Supabase initialization
url: str = os.environ.get("SUPABASE_URL")
service_key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, service_key)

# Gemini AI initialization
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# Razorpay initialization
razorpay_client = razorpay.Client(
    auth=(os.environ.get("RAZORPAY_KEY_ID"), os.environ.get("RAZORPAY_KEY_SECRET"))
)

# Email Config
SENDER_EMAIL = os.environ.get("SENDER_EMAIL")
SENDER_PASSWORD = os.environ.get("SENDER_PASSWORD")
SMTP_SERVER = os.environ.get("SMTP_SERVER")
SMTP_PORT = os.environ.get("SMTP_PORT", 587)

# --- 2. Decorator for Authentication ---
def token_required(f):
    """Decorator to verify Supabase JWT token from Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({'message': 'Authorization token is missing!'}), 401
        try:
            # Verify token using Supabase Auth
            user_response = supabase.auth.get_user(token)
            # supabase-python sometimes returns an object with .user or a dict; handle both
            user = None
            if hasattr(user_response, "user"):
                user = user_response.user
            elif isinstance(user_response, dict):
                user = user_response.get("user")
            if not user:
                raise Exception("Invalid token or user not found")
            # Pass the authenticated user object to the route function
            return f(user, *args, **kwargs)
        except Exception as e:
            print(f"[Auth Error] {e}")
            return jsonify({'message': f'Token verification failed: {str(e)}'}), 401
    return decorated

# --- 3. Utility: Safe Gemini Call ---
def safe_generate_content(prompt: str) -> str:
    """Safely calls Gemini and extracts text, handling potential errors/empty responses."""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)

        # Try common accessors in order of likelihood
        # 1) response.text
        if hasattr(response, "text") and response.text:
            return response.text.strip()

        # 2) response.candidates[0].content.parts[0].text (if present)
        if hasattr(response, "candidates") and response.candidates:
            first = response.candidates[0]
            # many SDKs expose content -> parts -> text
            if hasattr(first, "content") and getattr(first.content, "parts", None):
                part0 = first.content.parts[0]
                # the part may have .text or .content depending on SDK
                if hasattr(part0, "text") and part0.text:
                    return part0.text.strip()
                if hasattr(part0, "content") and isinstance(part0.content, str) and part0.content:
                    return part0.content.strip()

        # 3) response.parts (older SDK)
        if hasattr(response, "parts") and response.parts:
            first_part = response.parts[0]
            if hasattr(first_part, "text") and first_part.text:
                return first_part.text.strip()

        # If no usable text, log reason if available
        try:
            finish_reason = None
            if hasattr(response, "candidates") and response.candidates:
                finish_reason = getattr(response.candidates[0], "finish_reason", None)
            print(f"[Gemini Warning] No content generated. Finish Reason: {finish_reason}")
        except Exception:
            pass

        return ""
    except Exception as e:
        print(f"[Gemini Error] {e}")
        return ""

# --- 4. Utility: Send Email ---
def send_approval_email(recipient_email, book_title):
    """Sends an email notification when a book is approved."""
    if not all([SENDER_EMAIL, SENDER_PASSWORD, SMTP_SERVER]):
        print("[Warning] Email credentials not configured in .env file. Skipping email notification.")
        return False

    msg = EmailMessage()
    msg.set_content(f"Congratulations!\n\nYour book '{book_title}' has been approved by the Admin and is now available on LibroVault.\n\nYou can check it on the website.\n\nThank you for your contribution!")
    msg['Subject'] = f"Your LibroVault Book '{book_title}' has been Approved!"
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email

    try:
        with smtplib.SMTP(SMTP_SERVER, int(SMTP_PORT)) as server:
            server.starttls()  # Secure the connection
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        print(f"Approval email sent successfully to {recipient_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        print(f"[Error] Failed to send email: Authentication failed. Check SENDER_EMAIL/SENDER_PASSWORD.")
        return False
    except Exception as e:
        print(f"[Error] Failed to send approval email to {recipient_email}: {e}")
        return False

# --- 5. Application Routes ---

# --- Book Routes ---
@app.route("/api/books", methods=['GET'])
@token_required
def get_books(current_user):
    """Fetches approved books, optionally filtered by search term and genre, with pagination."""
    try:
        search_term = request.args.get('q', '')
        genre_filter = request.args.get('genre', '')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit

        query = supabase.table('books').select("*", count='exact').eq('status', 'approved')
        if genre_filter:
            # support both string and list stored genre
            query = query.or_(f"genre.eq.{genre_filter}") if False else query.eq('genre', genre_filter)
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.or_(f"title.ilike.{search_pattern},author.ilike.{search_pattern}")

        query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
        response = query.execute()

        # response.count is available when count='exact', but fallback defensively
        total_count = getattr(response, "count", None)
        return jsonify({'books': response.data or [], 'totalCount': total_count if total_count is not None else len(response.data or [])}), 200
    except Exception as e:
        print(f"[Error] get_books: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/books/<book_id>", methods=['GET'])
@token_required
def get_book_details(current_user, book_id):
    """Fetches details for a single approved book and logs reading history."""
    try:
        response = supabase.table('books').select("*").eq('id', book_id).eq('status', 'approved').single().execute()
        if not response.data:
            return jsonify({'error': 'Book not found or not approved'}), 404
        try:
            profile_check = supabase.table('users').select('id').eq('id', current_user.id).maybe_single().execute()
            if profile_check.data:
                supabase.table('reading_history').insert({'user_id': current_user.id, 'book_id': book_id}).execute()
            else:
                print(f"[Warning] Cannot log reading history: User {current_user.id} not found in public.users.")
        except Exception as e:
            print(f"Error logging reading history: {e}")
        return jsonify(response.data), 200
    except Exception as e:
        print(f"[Error] get_book_details: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/books/proxy/<book_id>", methods=['GET'])
@token_required
def proxy_book_file(current_user, book_id):
    """Securely streams the book PDF file content."""
    try:
        book_meta_res = supabase.table('books').select("file_url").eq('id', book_id).eq('status', 'approved').single().execute()
        if not book_meta_res.data:
            return jsonify({'error': 'Book file not found or not accessible'}), 404
        file_url = book_meta_res.data['file_url']
        file_response = requests.get(file_url, stream=True, timeout=30)
        file_response.raise_for_status()
        return Response(
            file_response.iter_content(chunk_size=1024 * 1024),
            content_type=file_response.headers.get('Content-Type', 'application/pdf')
        )
    except Exception as e:
        print(f"[Error] proxy_book_file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/books/download/<book_id>", methods=['GET'])
@token_required
def download_book_file(current_user, book_id):
    """Securely streams the book file with a download header."""
    try:
        user_id = current_user.id
        role = current_user.user_metadata.get('role', 'user')
        book_res = supabase.table('books').select('file_url, title, is_pro, user_id').eq('id', book_id).single().execute()

        if not book_res.data:
            return jsonify({'error': 'Book not found'}), 404

        book = book_res.data
        has_access = not book.get('is_pro') or role == 'admin' or book.get('user_id') == user_id

        if not has_access:
            purchase_res = supabase.table('purchases').select('id').eq('user_id', user_id).eq('book_id', book_id).limit(1).execute()
            if not purchase_res.data:
                return jsonify({'error': 'You do not have permission to download this book.'}), 403

        file_url = book.get('file_url')
        file_response = requests.get(file_url, stream=True, timeout=30)
        file_response.raise_for_status()

        filename = "".join(c for c in book.get('title', '') if c.isalnum() or c in (' ', '_')).rstrip() + ".pdf"
        headers = {
            'Content-Type': file_response.headers.get('Content-Type', 'application/pdf'),
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        return Response(file_response.iter_content(chunk_size=1024 * 1024), headers=headers)
    except Exception as e:
        print(f"[Error] download_book_file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/books", methods=['POST'])
@token_required
def add_book(current_user):
    """Adds a new book, setting status based on user role and optionally generating AI summary."""
    try:
        data = request.get_json()
        user_role = current_user.user_metadata.get('role', 'user')
        status = 'approved' if user_role == 'admin' else 'pending'

        required_fields = ['title', 'author', 'file_url', 'cover_image_url', 'genre']
        if not all(field in data for field in required_fields) or not data.get('genre'):
            return jsonify({'error': 'Missing required book information or genre.'}), 400

        new_book = {
            'title': data['title'], 'author': data['author'], 'user_id': current_user.id,
            'status': status, 'file_url': data['file_url'],
            'cover_image_url': data['cover_image_url'], 'genre': data['genre'],
            'summary': data.get('summary'),
            'is_pro': data.get('is_pro', False),
            'price': float(data.get('price', 0)) if data.get('is_pro') else 0
        }
        response = supabase.table('books').insert(new_book).execute()
        if not response.data:
            return jsonify({'error': 'Failed to add book to database'}), 500

        message = 'Book published successfully!' if status == 'approved' else 'Book submitted for approval!'
        book_data = response.data[0]

        if status == 'approved' and not new_book.get('summary'):
            try:
                file_url = book_data.get('file_url')
                pdf_response = requests.get(file_url, timeout=30)
                pdf_response.raise_for_status()
                doc = fitz.open(stream=io.BytesIO(pdf_response.content), filetype="pdf")
                text = "".join(page.get_text() for i, page in enumerate(doc) if i < 5)
                doc.close()
                if text.strip():
                    ai_summary = safe_generate_content(f"Generate a concise, one-line summary for a library catalog based on this text: {text[:4000]}")
                    if ai_summary:
                        supabase.table('books').update({'summary': ai_summary}).eq('id', book_data['id']).execute()
            except Exception as e:
                print(f"AI summary failed for direct admin upload (Book ID: {book_data.get('id')}): {e}")

        return jsonify({'message': message, 'book': book_data}), 201
    except Exception as e:
        print(f"[Error] add_book: {e}")
        return jsonify({'error': str(e)}), 500

# --- Bookmark Routes ---
@app.route("/api/my-bookmarks", methods=['GET'])
@token_required
def get_all_my_bookmarks(current_user):
    """Fetches the latest unique bookmarks for the current user using a DB function."""
    try:
        # Get an optional limit from the query string, default to None
        limit = request.args.get('limit', None)
        
        rpc_params = {'p_user_id': current_user.id}
        query = supabase.rpc('get_user_bookmarks', rpc_params)
        
        # Apply the limit if it was provided
        if limit and limit.isdigit():
            query = query.limit(int(limit))
            
        response = query.execute()
        return jsonify(response.data), 200
    except Exception as e:
        print(f"Error fetching all bookmarks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/bookmarks/<book_id>", methods=['PUT'])
@token_required
def save_bookmark(current_user, book_id):
    """Saves a new bookmark entry for the user and book."""
    try:
        data = request.get_json()
        page_number = data.get('page_number')
        if not page_number or not isinstance(page_number, int) or page_number < 1:
            return jsonify({'error': 'Valid page number is required'}), 400
        response = supabase.table('bookmarks').insert({
            'user_id': current_user.id,
            'book_id': book_id,
            'page_number': page_number
        }).execute()
        if not response.data:
            return jsonify({'error': 'Failed to save bookmark'}), 500
        return jsonify({'message': 'Bookmark saved!', 'bookmark': response.data[0]}), 200
    except Exception as e:
        print(f"[Error] save_bookmark: {e}")
        return jsonify({'error': str(e)}), 500


# --- Rating Routes ---
@app.route("/api/books/<book_id>/my-rating", methods=['GET'])
@token_required
def get_my_rating(current_user, book_id):
    """Fetches the current user's specific rating for a book."""
    try:
        response = supabase.table('ratings').select('rating').eq('user_id', current_user.id).eq('book_id', book_id).maybe_single().execute()
        return jsonify(response.data), 200
    except Exception as e:
        print(f"[Error] get_my_rating: {e}")
        return jsonify(None), 200

@app.route("/api/books/<book_id>/rate", methods=['POST'])
@token_required
def rate_book(current_user, book_id):
    """Creates or updates a user's rating for a book."""
    try:
        data = request.get_json()
        rating = data.get('rating')
        if not rating or not (1 <= rating <= 5):
            return jsonify({'error': 'A rating between 1 and 5 is required.'}), 400
        response = supabase.table('ratings').upsert({
            'user_id': current_user.id,
            'book_id': book_id,
            'rating': rating
        }, on_conflict='user_id,book_id').execute()
        if not response.data:
            return jsonify({'error': 'Failed to save rating'}), 500
        return jsonify({'message': 'Rating saved!', 'rating': response.data[0]}), 200
    except Exception as e:
        print(f"[Error] rate_book: {e}")
        return jsonify({'error': str(e)}), 500

# --- Payment Routes ---
@app.route("/api/payment/order", methods=['POST'])
@token_required
def create_payment_order(current_user):
    """Creates a Razorpay payment order for a specific book."""
    try:
        data = request.get_json()
        book_id = data.get('book_id')
        if not book_id:
            return jsonify({'error': 'Book ID is required'}), 400
        book_res = supabase.table('books').select('price').eq('id', book_id).single().execute()
        if not book_res.data:
            return jsonify({'error': 'Book not found'}), 404
        price = book_res.data.get('price', 0)
        if not price or float(price) <= 0:
            return jsonify({'error': 'This book is not for sale.'}), 400

        order_amount_paise = int(float(price) * 100)
        order_currency = 'INR'
        # Make receipt <= 40 chars to satisfy Razorpay requirement
        raw_receipt = f"receipt_{str(book_id)}_{random.randint(1000,9999)}"
        receipt_trimmed = raw_receipt[:40]

        try:
            order = razorpay_client.order.create({
                'amount': order_amount_paise,
                'currency': order_currency,
                'receipt': receipt_trimmed,
                'notes': {'user_id': current_user.id, 'book_id': book_id}
            })
            return jsonify(order), 200
        except Exception as rp_err:
            print(f"[Razorpay Error] {rp_err}")
            return jsonify({'error': 'Failed to create payment order', 'details': str(rp_err)}), 500

    except Exception as e:
        print(f"[Error] create_payment_order: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/payment/verify", methods=['POST'])
@token_required
def verify_payment(current_user):
    """Verifies a Razorpay payment signature and logs the purchase."""
    try:
        data = request.get_json()
        required_keys = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'book_id']
        if not all(key in data for key in required_keys):
            return jsonify({'error': 'Missing payment verification data'}), 400
        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': data['razorpay_order_id'],
                'razorpay_payment_id': data['razorpay_payment_id'],
                'razorpay_signature': data['razorpay_signature']
            })
        except razorpay.errors.SignatureVerificationError:
            print("[Error] Payment verification failed: Invalid signature")
            return jsonify({'error': 'Payment verification failed.'}), 400

        supabase.table('purchases').insert({
            'user_id': current_user.id, 'book_id': data['book_id'],
            'razorpay_payment_id': data['razorpay_payment_id']
        }).execute()
        return jsonify({'message': 'Payment successful! You now have access to this book.'}), 200
    except Exception as e:
        print(f"[Error] verify_payment: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/my-purchases", methods=['GET'])
@token_required
def get_my_purchases(current_user):
    """Fetches a list of book IDs purchased by the current user."""
    try:
        response = supabase.table('purchases').select('book_id').eq('user_id', current_user.id).execute()
        purchased_ids = {item['book_id'] for item in (response.data or [])}
        return jsonify(list(purchased_ids)), 200
    except Exception as e:
        print(f"[Error] get_my_purchases: {e}")
        return jsonify({'error': str(e)}), 500

# --- Admin Routes ---
@app.route("/api/admin/pending-books", methods=['GET'])
@token_required
def get_pending_books(current_user):
    if current_user.user_metadata.get('role') != 'admin':
        return jsonify({'message': 'Admin access required!'}), 403
    try:
        response = supabase.table('books').select("*").eq('status', 'pending').execute()
        return jsonify(response.data or []), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/admin/books/<book_id>/status", methods=['PUT'])
@token_required
def update_book_status(current_user, book_id):
    if current_user.user_metadata.get('role') != 'admin':
        return jsonify({'message': 'Admin access required!'}), 403
    try:
        data = request.get_json()
        new_status = data.get('status')
        if new_status not in ['approved', 'rejected']:
            return jsonify({'error': 'Invalid status provided'}), 400
        book_response_before = supabase.table('books').select('user_id, title, summary, file_url').eq('id', book_id).single().execute()
        if not book_response_before.data:
            return jsonify({'error': 'Book not found'}), 404
        original_book_data = book_response_before.data
        response = supabase.table('books').update({'status': new_status}).eq('id', book_id).execute()
        if not response.data:
            return jsonify({'error': 'Failed to update book status'}), 500
        book_data = response.data[0]
        if new_status == 'approved':
            if not original_book_data.get('summary'):
                try:
                    file_url = book_data.get('file_url')
                    pdf_response = requests.get(file_url, timeout=30)
                    pdf_response.raise_for_status()
                    doc = fitz.open(stream=io.BytesIO(pdf_response.content), filetype="pdf")
                    text = "".join(page.get_text() for i, page in enumerate(doc) if i < 5)
                    doc.close()
                    if text:
                        summary = safe_generate_content(f"Generate a concise, one-line summary based on this text: {text[:4000]}")
                        if summary:
                            supabase.table('books').update({'summary': summary}).eq('id', book_data['id']).execute()
                except Exception as e:
                    print(f"AI summary failed for book {book_id}: {e}")
            try:
                uploader_id = original_book_data.get('user_id')
                if uploader_id:
                    uploader_info = supabase.auth.admin.get_user_by_id(uploader_id)
                    if uploader_info and getattr(uploader_info, "user", None) and uploader_info.user.email:
                        send_approval_email(uploader_info.user.email, book_data.get('title', 'N/A'))
            except Exception as email_err:
                print(f"[Warning] Failed to get user email or send notification for book {book_id}: {email_err}")
        return jsonify({'message': f'Status updated to {new_status}!', 'book': book_data}), 200
    except Exception as e:
        print(f"[Error] update_book_status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/admin/users", methods=['GET'])
@token_required
def get_all_users(current_user):
    if current_user.user_metadata.get('role') != 'admin':
        return jsonify({'message': 'Admin access required!'}), 403
    try:
        list_users_response = supabase.auth.admin.list_users()
        users_as_dicts = [user.to_dict() if hasattr(user, "to_dict") else user for user in list_users_response.users]
        return jsonify(users_as_dicts), 200
    except Exception as e:
        print(f"[Error] get_all_users failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/admin/stats/users", methods=['GET'])
@token_required
def get_user_stats(current_user):
    if current_user.user_metadata.get('role') != 'admin':
        return jsonify({'message': 'Admin access required!'}), 403
    try:
        data = supabase.rpc('get_monthly_signups').execute()
        return jsonify(data.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/admin/stats/activity", methods=['GET'])
@token_required
def get_activity_stats(current_user):
    if current_user.user_metadata.get('role') != 'admin':
        return jsonify({'message': 'Admin access required!'}), 403
    try:
        data = supabase.rpc('get_monthly_reading_activity').execute()
        return jsonify(data.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/admin/stats/system", methods=['GET'])
@token_required
def get_system_stats(current_user):
    if current_user.user_metadata.get('role') != 'admin':
        return jsonify({'message': 'Admin access required!'}), 403
    try:
        ebooks_files = supabase.storage.from_('ebooks').list() or []
        covers_files = supabase.storage.from_('covers').list() or []
        total_size_bytes = sum(f.get('metadata', {}).get('size', 0) for f in ebooks_files) + sum(f.get('metadata', {}).get('size', 0) for f in covers_files)
        storage_limit_bytes = 5 * 1024**3
        storage_percentage = (total_size_bytes / storage_limit_bytes) * 100 if storage_limit_bytes > 0 else 0
        stats = {
            "serverLoad": random.randint(30, 60),
            "dbConnections": random.randint(50, 80),
            "storageCapacity": round(storage_percentage, 2)
        }
        return jsonify(stats), 200
    except Exception as e:
        print(f"[Error] get_system_stats: {e}")
        return jsonify({'error': str(e)}), 500

# --- AI Routes ---
@app.route("/api/ai/recommendations", methods=['GET'])
@token_required
def get_recommendations(current_user):
    try:
        history_res = supabase.table('reading_history').select('books(title, genre)').eq('user_id', current_user.id).order('read_at', desc=True).limit(5).execute()
        read_books = [item['books'] for item in (history_res.data or []) if item.get('books')]
        if not read_books:
            return jsonify({'recommendations': []}), 200

        read_titles = [b.get('title') for b in read_books if b.get('title')]

        # normalize genres: support string or list
        read_genres = set()
        for b in read_books:
            g = b.get('genre')
            if isinstance(g, str):
                read_genres.add(g)
            elif isinstance(g, (list, tuple)):
                for s in g:
                    if isinstance(s, str):
                        read_genres.add(s)

        all_books_res = supabase.table('books').select('title, author, genre').eq('status', 'approved').execute()
        candidates = [b for b in (all_books_res.data or []) if b.get('title') and b['title'] not in read_titles]
        if not candidates:
            return jsonify({'recommendations': []}), 200

        # Limit candidates to 50 so prompt doesn't blow up
        formatted_candidates = []
        for b in candidates[:50]:
            genre_field = b.get('genre', [])
            if isinstance(genre_field, str):
                genres_list = [genre_field]
            elif isinstance(genre_field, (list, tuple)):
                genres_list = genre_field
            else:
                genres_list = []
            formatted_candidates.append(f"'{b.get('title')}' (Genres: {', '.join(genres_list)})")

        candidate_books_str = ", ".join(formatted_candidates)
        read_genres_str = ", ".join(sorted(list(read_genres))) if read_genres else "N/A"

        prompt = (
            f"A user enjoys genres: {read_genres_str}. "
            f"From this list, recommend up to 3 books they might enjoy: {candidate_books_str}. "
            "Respond with only a comma-separated list of titles."
        )

        ai_text = safe_generate_content(prompt)
        if not ai_text:
            return jsonify({'recommendations': []}), 200

        recommended_titles = [title.strip().strip("'").strip() for title in ai_text.split(',') if title.strip()]
        if not recommended_titles:
            return jsonify({'recommendations': []}), 200

        recs = supabase.table('books').select('*').in_('title', recommended_titles).execute()
        return jsonify({'recommendations': recs.data or []}), 200
    except Exception as e:
        print(f"Recommendation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/ai/discover", methods=['POST'])
@token_required
def discover_recommendations(current_user):
    try:
        data = request.get_json()
        topic_or_author = data.get('topic_or_author')
        style = data.get('style', 'similar')
        if not topic_or_author:
            return jsonify({'error': 'Topic or author is required'}), 400
        all_books_res = supabase.table('books').select('title, author').eq('status', 'approved').execute()
        available_books = [f"'{b['title']}' by {b['author']}" for b in (all_books_res.data or []) if b.get('title') and b.get('author')]
        if not available_books:
            return jsonify({'recommendations': []}), 200
        available_books_str = ", ".join(available_books[:50])
        if style == 'similar':
            prompt = (f"Recommend up to 3 books similar to '{topic_or_author}' from this list: {available_books_str}. Respond ONLY with a comma-separated list of exact book titles.")
        else:
            prompt = (f"Based on interest in '{topic_or_author}', recommend 3 surprising choices from this list: {available_books_str}. Respond ONLY with a comma-separated list of exact book titles.")
        ai_text = safe_generate_content(prompt)
        if not ai_text:
            return jsonify({'recommendations': []}), 200
        recommended_titles = [title.strip().strip("'") for title in ai_text.split(',') if title.strip()]
        if not recommended_titles:
            return jsonify({'recommendations': []}), 200
        recs = supabase.table('books').select('*').in_('title', recommended_titles).execute()
        return jsonify({'recommendations': recs.data or []}), 200
    except Exception as e:
        print(f"[Error] Discover recommendations failed: {e}")
        return jsonify({'error': str(e)}), 500
# --- Root Route for Render Health Check ---
@app.route("/", methods=["GET"])
def home():
    """Simple root route for Render health checks and manual testing."""
    return jsonify({
        "message": "📚 LibroVault Backend is running successfully on Render!",
        "status": "OK",
        "version": "1.0.0"
    }), 200

# --- 6. Run the App ---
if __name__ == "__main__":
    app.run(debug=True)
