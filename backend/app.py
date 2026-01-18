import os
import shutil
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configurações
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///nordes_studio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modelo do Livro
class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    release_date = db.Column(db.String(50), nullable=True)
    stock = db.Column(db.Integer, default=0)
    category = db.Column(db.String(50), nullable=True)

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

# Modelo de Configuração (Senha)
class Config(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(255), nullable=False)

# Criar banco de dados
with app.app_context():
    db.create_all()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Rotas API
@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    return jsonify([book.to_dict() for book in books])

@app.route('/api/books/<int:id>', methods=['GET'])
def get_book(id):
    book = Book.query.get_or_404(id)
    return jsonify(book.to_dict())

@app.route('/api/books', methods=['POST'])
def add_book():
    data = request.form
    file = request.files.get('image')
    
    image_filename = "livro-default.jpg"
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        image_filename = filename

    new_book = Book(
        title=data.get('title'),
        author=data.get('author'),
        price=float(data.get('price')),
        description=data.get('description'),
        image_url=image_filename,
        release_date=data.get('release_date'),
        stock=int(data.get('stock', 0)),
        category=data.get('category')
    )
    db.session.add(new_book)
    db.session.commit()
    return jsonify({"message": "Livro adicionado com sucesso!", "book": new_book.to_dict()}), 201

@app.route('/api/books/<int:id>', methods=['PUT'])
def update_book(id):
    book = Book.query.get_or_404(id)
    data = request.form
    file = request.files.get('image')

    book.title = data.get('title', book.title)
    book.author = data.get('author', book.author)
    book.price = float(data.get('price', book.price))
    book.description = data.get('description', book.description)
    book.release_date = data.get('release_date', book.release_date)
    book.stock = int(data.get('stock', book.stock))
    book.category = data.get('category', book.category)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        book.image_url = filename

    db.session.commit()
    return jsonify({"message": "Livro atualizado com sucesso!", "book": book.to_dict()})

@app.route('/api/books/<int:id>', methods=['DELETE'])
def delete_book(id):
    book = Book.query.get_or_404(id)
    db.session.delete(book)
    db.session.commit()
    return jsonify({"message": "Livro removido com sucesso!"})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- DATABASE MANAGEMENT ROUTES ---

@app.route('/api/db/backups', methods=['GET'])
def list_backups():
    db_dir = os.path.join(app.instance_path)
    files = [f for f in os.listdir(db_dir) if f.endswith('.db')]
    backups = []
    for f in files:
        path = os.path.join(db_dir, f)
        stat = os.stat(path)
        backups.append({
            "name": f,
            "size": f"{stat.st_size / 1024:.2f} KB",
            "modified": datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
            "current": f == os.path.basename(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
        })
    return jsonify(backups)

@app.route('/api/db/backup', methods=['POST'])
def create_backup():
    try:
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if not os.path.isabs(db_path):
            db_path = os.path.join(app.instance_path, db_path)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"backup_{timestamp}.db"
        backup_path = os.path.join(app.instance_path, backup_name)
        
        shutil.copy2(db_path, backup_path)
        return jsonify({"message": f"Backup '{backup_name}' criado com sucesso!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/db/switch', methods=['POST'])
def switch_db():
    data = request.json
    target_db = data.get('name')
    if not target_db:
        return jsonify({"error": "Nome do banco não fornecido"}), 400
    
    db_path = os.path.join(app.instance_path, target_db)
    if not os.path.exists(db_path):
        return jsonify({"error": "Banco de dados não encontrado"}), 404
    
    try:
        # Atualiza a URI de configuração (isso requer reinício do app para efeito global em alguns casos, 
        # mas para SQLite simples via SQLAlchemy funciona em tempo de execução para novas sessões)
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{target_db}'
        # Força o SQLAlchemy a recriar o engine na próxima requisição
        db.engine.dispose()
        return jsonify({"message": f"Alternado para o banco '{target_db}'", "current": target_db})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/db/delete', methods=['POST'])
def delete_db_file():
    data = request.json
    target_db = data.get('name')
    current_db = os.path.basename(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    
    if target_db == current_db:
        return jsonify({"error": "Não é possível excluir o banco de dados em uso"}), 400
    
    db_path = os.path.join(app.instance_path, target_db)
    if os.path.exists(db_path):
        os.remove(db_path)
        return jsonify({"message": f"Banco '{target_db}' excluído permanentemente"})
    return jsonify({"error": "Arquivo não encontrado"}), 404

@app.route('/api/db/raw', methods=['GET'])
def get_raw_data():
    """Retorna todos os dados de todas as tabelas para visualização direta"""
    try:
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if not os.path.isabs(db_path):
            db_path = os.path.join(app.instance_path, db_path)
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Pega lista de tabelas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        result = {}
        for table in tables:
            table_name = table[0]
            if table_name == 'sqlite_sequence': continue
            
            cursor.execute(f"SELECT * FROM {table_name}")
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            
            result[table_name] = {
                "columns": columns,
                "rows": [dict(zip(columns, row)) for row in rows]
            }
        
        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/verify', methods=['POST'])
def verify_password():
    data = request.json
    password = data.get('password')
    stored_password = Config.query.filter_by(key='admin_password').first()
    
    if not stored_password:
        # Se não existir, cria a padrão
        new_config = Config(key='admin_password', value='232341')
        db.session.add(new_config)
        db.session.commit()
        stored_password = new_config

    if password == stored_password.value:
        return jsonify({"success": True, "message": "Acesso permitido"})
    return jsonify({"success": False, "message": "Senha incorreta"}), 401

@app.route('/api/auth/change-password', methods=['POST'])
def change_password():
    data = request.json
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    stored_password = Config.query.filter_by(key='admin_password').first()
    if not stored_password:
        stored_password = Config(key='admin_password', value='232341')
        db.session.add(stored_password)
        db.session.commit()

    if old_password != stored_password.value:
        return jsonify({"success": False, "message": "Senha atual incorreta"}), 401
    
    if not new_password or len(new_password) != 6 or not new_password.isdigit():
        return jsonify({"success": False, "message": "A nova senha deve ter 6 números"}), 400

    stored_password.value = new_password
    db.session.commit()
    return jsonify({"success": True, "message": "Senha alterada com sucesso"})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de health check para verificar status do backend e banco de dados"""
    try:
        # Tenta fazer uma query simples no banco
        book_count = Book.query.count()
        return jsonify({
            "status": "healthy",
            "backend": "connected",
            "database": "connected",
            "book_count": book_count,
            "timestamp": str(db.func.current_timestamp())
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "backend": "connected",
            "database": "disconnected",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True, port=5000)
