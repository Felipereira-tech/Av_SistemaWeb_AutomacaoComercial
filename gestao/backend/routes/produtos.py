from flask import Blueprint, request, jsonify
from models import db, Produto

produtos_bp = Blueprint('produtos', __name__)

@produtos_bp.route('/produtos', methods=['GET'])
def listar():
    try:
        # Filtra apenas os produtos ativos para o PDV e Gestão
        produtos = Produto.query.filter_by(ativo=True).order_by(Produto.nome).all()
        return jsonify([p.to_dict() for p in produtos]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@produtos_bp.route('/produtos', methods=['POST'])
def criar():
    try:
        dados = request.get_json()
        novo = Produto(
            nome=dados['nome'],
            preco=float(dados['preco']),
            quantidade=int(dados.get('quantidade', 0)),
            ativo=True
        )
        db.session.add(novo)
        db.session.commit()
        return jsonify(novo.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@produtos_bp.route('/produtos/<int:id>', methods=['PUT'])
def editar(id):
    try:
        produto = Produto.query.get(id)
        if not produto:
            return jsonify({"erro": "Produto não encontrado"}), 404
            
        dados = request.get_json()
        if 'nome' in dados: produto.nome = dados['nome']
        if 'preco' in dados: produto.preco = float(dados['preco'])
        if 'quantidade' in dados: produto.quantidade = int(dados['quantidade'])
        
        db.session.commit()
        return jsonify(produto.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@produtos_bp.route('/produtos/<int:id>', methods=['DELETE'])
def excluir(id):
    try:
        produto = Produto.query.get(id)
        if not produto:
            return jsonify({"erro": "Produto não encontrado"}), 404
            
        # AQUI ESTÁ A CHAVE DE TUDO: Soft Delete (Inativação) em vez de DELETE físico
        produto.ativo = False
        
        db.session.commit()
        return jsonify({"mensagem": "Produto inativado com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500