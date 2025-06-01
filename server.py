from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import hashlib
import sqlite3
import os
import jwt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Configuração do JWT
SECRET_KEY = 'seu_secret_key_aqui'

# Configuração do banco de dados
def get_db():
    db = sqlite3.connect('database.db')
    db.row_factory = sqlite3.Row
    return db

# Criar tabelas se não existirem
def init_db():
    with get_db() as db:
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        
        # Inserir usuários padrão
        try:
            admin_password = hashlib.sha256('admin123'.encode()).hexdigest()
            user_password = hashlib.sha256('12qw!@QW'.encode()).hexdigest()
            
            db.execute('INSERT INTO users (email, password) VALUES (?, ?)', ('admin', admin_password))
            db.execute('INSERT INTO users (email, password) VALUES (?, ?)', ('gabrielsilvadis@outlook.com', user_password))
            db.commit()
        except sqlite3.IntegrityError:
            pass  # Usuários já existem

# Inicializar banco de dados
init_db()

# Servir arquivos estáticos
@app.route('/')
def serve_index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('public', path)

# Rotas da API
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email e senha são obrigatórios'})
    
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    
    with get_db() as db:
        user = db.execute('SELECT * FROM users WHERE email = ? AND password = ?', 
                         (email, hashed_password)).fetchone()
        
        if user:
            token = jwt.encode({
                'user_id': user['id'],
                'email': user['email'],
                'exp': datetime.utcnow() + timedelta(days=1)
            }, SECRET_KEY, algorithm='HS256')
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email']
                }
            })
        
        return jsonify({'success': False, 'message': 'Email ou senha inválidos'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email e senha são obrigatórios'})
    
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    
    try:
        with get_db() as db:
            db.execute('INSERT INTO users (email, password) VALUES (?, ?)', 
                      (email, hashed_password))
            db.commit()
            
            user_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
            token = jwt.encode({
                'user_id': user_id,
                'email': email,
                'exp': datetime.utcnow() + timedelta(days=1)
            }, SECRET_KEY, algorithm='HS256')
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user_id,
                    'email': email
                }
            })
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Email já cadastrado'})

if __name__ == '__main__':
    app.run(port=8000, debug=True) 