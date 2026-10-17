from flask import Blueprint, request, jsonify
from models import Usuario

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    dados = request.get_json()
    username = dados.get('username')
    senha = dados.get('senha')
    
    # Valida direto a senha pura no banco
    user = Usuario.query.filter_by(username=username, senha=senha).first()
    
    if user:
        return jsonify({"sucesso": True, "usuario": user.to_dict()}), 200
        
    return jsonify({"sucesso": False, "mensagem": "Usuário ou senha incorretos."}), 401
