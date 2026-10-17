from flask import Blueprint, request, jsonify
from models import db, Usuario

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/usuarios', methods=['GET'])
def listar():
    usuarios = Usuario.query.all()
    return jsonify([u.to_dict() for u in usuarios]), 200

@usuarios_bp.route('/usuarios', methods=['POST'])
def criar():
    dados = request.get_json()
    if Usuario.query.filter_by(username=dados['username']).first():
        return jsonify({"mensagem": "Este login já existe."}), 400
    
    novo = Usuario(username=dados['username'], senha=dados['senha'])
    db.session.add(novo)
    db.session.commit()
    return jsonify(novo.to_dict()), 201

@usuarios_bp.route('/usuarios/<int:id>/senha', methods=['PUT'])
def trocar_senha(id):
    usuario = Usuario.query.get(id)
    usuario.senha = request.get_json()['senha']
    db.session.commit()
    return jsonify({"mensagem": "Senha alterada!"}), 200

@usuarios_bp.route('/usuarios/<int:id>', methods=['DELETE'])
def excluir(id):
    usuario = Usuario.query.get(id)
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({"mensagem": "Excluído!"}), 200
    