from flask import Blueprint, request, jsonify
from models import db, Venda, ItemVenda, Produto
from datetime import datetime

pdv_bp = Blueprint('pdv', __name__)

@pdv_bp.route('/vendas', methods=['POST'])
def registrar_venda():
    dados = request.get_json()
    try:
        nova_venda = Venda(total=dados['total'], pagamento=dados['pagamento'])
        db.session.add(nova_venda)
        db.session.flush() 
        
        for item in dados['itens']:
            produto = Produto.query.get(item['id'])
            if produto:
                produto.quantidade -= item['quantidade'] # Baixa do estoque
            
            db.session.add(ItemVenda(
                venda_id=nova_venda.id, 
                produto_id=item['id'], 
                quantidade=item['quantidade'], 
                preco_unitario=item['preco']
            ))
            
        db.session.commit()
        return jsonify({"sucesso": True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# ==========================================
# NOVA ROTA: EXCLUIR VENDA E RETORNAR ESTOQUE
# ==========================================
@pdv_bp.route('/vendas/<int:id>', methods=['DELETE'])
def excluir_venda(id):
    venda = Venda.query.get(id)
    
    if not venda:
        return jsonify({"sucesso": False, "erro": "Venda não encontrada"}), 404
        
    try:
        # 1. Devolver as quantidades dos produtos ao estoque
        for item in venda.itens:
            # Verifica se o produto ainda existe no banco antes de tentar devolver o estoque
            if item.produto:
                item.produto.quantidade += item.quantidade
        
        # 2. Excluir a venda (os itens da venda são deletados juntos graças ao cascade no models.py)
        db.session.delete(venda)
        db.session.commit()
        
        return jsonify({"sucesso": True, "mensagem": "Venda excluída e estoque restaurado com sucesso!"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@pdv_bp.route('/dashboard', methods=['GET'])
def dashboard():
    hoje = datetime.now().date()
    vendas = Venda.query.filter(db.func.date(Venda.data) == hoje).all()
    
    ultimas = Venda.query.order_by(Venda.id.desc()).limit(5).all()
    lista_ultimas = [{
        "id": v.id, 
        "horario": v.data.strftime("%H:%M"), 
        "valorTotal": v.total, 
        "pagamento": v.pagamento,
        "produtos": ", ".join([f"{i.quantidade}x {i.produto.nome if i.produto else 'Excluído'}" for i in v.itens])
    } for v in ultimas]

    # REGRA CRÍTICA APLICADA: Ignorar produtos inativos no alerta de estoque baixo
    estoque_baixo = Produto.query.filter(Produto.quantidade <= 5, Produto.ativo == True).all()
    lista_estoque = [{"nome": p.nome, "quantidade": p.quantidade} for p in estoque_baixo]

    return jsonify({
        "faturamento": sum(v.total for v in vendas), 
        "vendasHoje": len(vendas), 
        "estoqueBaixo": lista_estoque, 
        "ultimasVendas": lista_ultimas
    }), 200