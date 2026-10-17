import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from models import db, Usuario
from routes import register_routes

# Carrega as variáveis de segurança e chaves de API do arquivo .env
load_dotenv()

app = Flask(__name__)

# ==========================================
# CONFIGURAÇÃO DO BANCO DE DADOS (NUVEM VS LOCAL)
# ==========================================
database_url = os.getenv('DATABASE_URL')

if database_url:
    # Se estiver rodando no Render, ajusta o prefixo da URL do banco
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Se estiver rodando localmente na sua máquina (Offline)
    senha_postgres = os.getenv('DB_PASSWORD', '123456')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://postgres:{senha_postgres}@localhost/paidegua_db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Habilita o CORS para o React conseguir conversar com a API
CORS(app)

# Inicializa o banco de dados com as configurações acima
db.init_app(app)

# Registra as rotas (endpoints)
register_routes(app)

# ==========================================
# CRIAÇÃO AUTOMÁTICA DAS TABELAS E USUÁRIO ADMIN
# ==========================================
with app.app_context():
    db.create_all()
    
    # CORREÇÃO: Utilizando 'username' como definido no models.py
    admin = Usuario.query.filter_by(username='felipe').first()
    
    if not admin:
        # Criando o usuário com a senha em texto puro, conforme o sistema espera
        admin = Usuario(username='felipe', senha='09Felip3@22pe') 
        db.session.add(admin)
        print("Usuário administrador criado com sucesso!")
    else:
        # Atualizando a senha para garantir o acesso
        admin.senha = '09Felip3@22pe'
        print("Senha do administrador atualizada com sucesso!")
        
    db.session.commit()

if __name__ == '__main__':
    # O Render usa portas dinâmicas, então pegamos a porta do ambiente
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)