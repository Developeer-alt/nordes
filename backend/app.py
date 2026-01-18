import os
import shutil
import sqlite3
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename

# ======================================================
# APP CONFIG
# ======================================================

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Pasta persistente do Render
UPLOAD_FOLDER = os.path.join(app.instance_path, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_PATH = os.path.join(app.instance_path, "nordes_studio.db")

app.config.update(
    UPLOAD_FOLDER=UPLOAD_FOLDER,
    SQLALCHEMY_DATABASE_URI=f"sqlite:///{DB_PATH}",
    SQLALCHEMY_TRACK_MODIFICATIONS=False
)

db = SQLAlchemy(app)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

# ======================================================
# MODELS
# ======================================================

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    release_date = db.Column(db.String(50))
    stock = db.Column(db.Integer, default=0)
    category = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "price": self.price,
            "description": self.description,
            "image": self.image_url,
            "release_date": self.release_date,
            "stock": self.stock,
            "category": self.category
        }


class Config(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(255), nullable=False)


with app.app_context():
    db.create_all()

# ======================================================
# UTILS
# ======================================================

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ======================================================
# BOOK ROUTES
# ======================================================

@app.route("/api/books", methods=["GET"])
def get_books():
    books = Book.query.all()
    return jsonify([b.to_dict() for b in books])


@app.route("/api/books/<int:book_id>", methods=["GET"])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify(book.to_dict())


@app.route("/api/books", methods=["POST"])
def add_book():
    data = request.form
    file = request.files.get("image")

    image_name = "livro-default.jpg"

    if file and allowed_file(file.filename):
        image_name = secure_filename(file.filename)
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], image_name))

    book = Book(
        title=data.get("title"),
        author=data.get("author"),
        price=float(data.get("price", 0)),
        description=data.get("description"),
        image_url=image_name,
        release_date=data.get("release_date"),
        stock=int(data.get("stock", 0)),
        category=data.get("category")
    )

    db.session.add(book)
    db.session.commit()

    return jsonify(book.to_dict()), 201


@app.route("/api/books/<int:book_id>", methods=["PUT"])
def update_book(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.form
    file = request.files.get("image")

    book.title = data.get("title", book.title)
    book.author = data.get("author", book.author)
    book.price = float(data.get("price", book.price))
    book.description = data.get("description", book.description)
    book.release_date = data.get("release_date", book.release_date)
    book.stock = int(data.get("stock", book.stock))
    book.category = data.get("category", book.category)

    if file and allowed_file(file.filename):
        image_name = secure_filename(file.filename)
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], image_name))
        book.image_url = image_name

    db.session.commit()
    return jsonify(book.to_dict())


@app.route("/api/books/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    db.session.delete(book)
    db.session.commit()
    return jsonify({"message": "Livro removido"})


@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# ======================================================
# AUTH
# ======================================================

@app.route("/api/auth/verify", methods=["POST"])
def verify_password():
    password = request.json.get("password")
    config = Config.query.filter_by(key="admin_password").first()

    if not config:
        config = Config(key="admin_password", value="232341")
        db.session.add(config)
        db.session.commit()

    return jsonify({"success": password == config.value})


@app.route("/api/auth/change-password", methods=["POST"])
def change_password():
    data = request.json
    old = data.get("old_password")
    new = data.get("new_password")

    config = Config.query.filter_by(key="admin_password").first()

    if not config or config.value != old:
        return jsonify({"success": False}), 401

    if not new or len(new) != 6 or not new.isdigit():
        return jsonify({"success": False}), 400

    config.value = new
    db.session.commit()
    return jsonify({"success": True})

# ======================================================
# DB MANAGEMENT
# ======================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "books": Book.query.count(),
        "timestamp": datetime.utcnow().isoformat()
    })

# ======================================================
# RUN (RENDER)
# ======================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
