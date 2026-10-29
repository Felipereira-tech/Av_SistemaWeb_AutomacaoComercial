from flask import Blueprint, request, jsonify
from models import db, Ingrediente # Importa a base de dados e o novo modelo

# Cria o Blueprint para o estoque
estoque_bp = Blueprint('estoque', __name__)

# 1. LISTAR ESTOQUE
@estoque_bp.route('/api/estoque', methods=['GET'])
def listar_estoque():
    itens = Ingrediente.query.order_by(Ingrediente.nome).all()
    return jsonify([item.to_dict() for item in itens]), 200

# 2. CADASTRAR COMPRA / NOVO ITEM
@estoque_bp.route('/api/estoque', methods=['POST'])
def adicionar_ingrediente():
    dados = request.get_json()
    
    if not dados or not dados.get('nome') or not dados.get('precoTotal'):
        return jsonify({'erro': 'Nome e Preço Total são obrigatórios'}), 400
        
    novo_item = Ingrediente(
        nome=dados['nome'],
        quantidade=int(dados.get('quantidade', 0)),
        preco_total=float(dados['precoTotal']),
        unidade_medida=dados.get('unidadeMedida', 'unidades')
    )
    
    db.session.add(novo_item)
    db.session.commit()
    
    return jsonify(novo_item.to_dict()), 201

# 3. ATUALIZAR QUANTIDADE (Dar entrada ou saída)
@estoque_bp.route('/api/estoque/<int:id>', methods=['PUT'])
def atualizar_quantidade(id):
    dados = request.get_json()
    item = Ingrediente.query.get(id)
    
    if not item:
        return jsonify({'erro': 'Produto não encontrado'}), 404
        
    if 'quantidade' in dados:
        nova_qtd = int(dados['quantidade'])
        item.quantidade = nova_qtd if nova_qtd >= 0 else 0
        
    db.session.commit()
    
    return jsonify(item.to_dict()), 200

# 4. EXCLUIR ITEM
@estoque_bp.route('/api/estoque/<int:id>', methods=['DELETE'])
def excluir_ingrediente(id):
    item = Ingrediente.query.get(id)
    
    if not item:
        return jsonify({'erro': 'Produto não encontrado'}), 404
        
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'mensagem': 'Produto removido com sucesso'}), 200