from flask import Blueprint, request, jsonify
from flask import Blueprint, request, jsonify, current_app
from models import db, Caixinha, HistoricoCaixa
from datetime import datetime

gestaocaixa_bp = Blueprint('gestaocaixa', __name__)

# Listar todas as caixinhas e o histórico geral (filtrado por usuário, se enviado)
@gestaocaixa_bp.route('/caixinhas', methods=['GET'])
def listar():
    try:
        user_id = request.args.get('user_id')
        
        query_caixas = Caixinha.query
        query_hist = HistoricoCaixa.query.join(Caixinha)
        
        if user_id:
            query_caixas = query_caixas.filter_by(user_id=user_id)
            query_hist = query_hist.filter(Caixinha.user_id == user_id)
            
        caixinhas = query_caixas.order_by(Caixinha.id.desc()).all()
        historico = query_hist.order_by(HistoricoCaixa.data.desc()).all()
        
        return jsonify({
            "caixinhas": [c.to_dict() for c in caixinhas],
            "historico": [h.to_dict() for h in historico]
        }), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# Criar nova caixinha vinculada ao usuário
@gestaocaixa_bp.route('/caixinhas', methods=['POST'])
def criar():
    dados = request.get_json()
    try:
        nova_caixinha = Caixinha(
            nome=dados['nome'],
            banco=dados['banco'],
            valorAtual=float(dados.get('valorAtual', 0.0)),
            meta=float(dados.get('meta', 0.0)),
            user_id=dados.get('user_id') # Vincula ao dono da sessão
        )
        db.session.add(nova_caixinha)
        db.session.flush() # Pega o ID gerado antes de salvar tudo

        # Se a caixinha já nasceu com dinheiro, cria o histórico de entrada
        if nova_caixinha.valorAtual > 0:
            historico = HistoricoCaixa(
                caixinha_id=nova_caixinha.id,
                tipo='entrada',
                valor=nova_caixinha.valorAtual,
                usuario=dados.get('usuario', 'Admin')
            )
            db.session.add(historico)

        db.session.commit()
        return jsonify(nova_caixinha.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

# Movimentar Fundos (Adicionar ou Retirar)
@gestaocaixa_bp.route('/caixinhas/<int:id>/movimentar', methods=['POST'])
def movimentar(id):
    dados = request.get_json()
    try:
        caixinha = Caixinha.query.get(id)
        if not caixinha:
            return jsonify({"erro": "Caixinha não encontrada"}), 404

        tipo = dados['tipo'] # 'entrada' ou 'saida'
        valor = float(dados['valor'])

        if tipo == 'saida' and valor > caixinha.valorAtual:
            return jsonify({"erro": "Saldo insuficiente"}), 400

        # Atualiza o saldo da caixinha
        if tipo == 'entrada':
            caixinha.valorAtual += valor
        else:
            caixinha.valorAtual -= valor

        # Registra no histórico
        historico = HistoricoCaixa(
            caixinha_id=caixinha.id,
            tipo=tipo,
            valor=valor,
            usuario=dados.get('usuario', 'Admin')
        )
        db.session.add(historico)
        db.session.commit()
        
        return jsonify({"mensagem": "Movimentação realizada com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

# Excluir caixinha e seu histórico
@gestaocaixa_bp.route('/caixinhas/<int:id>', methods=['DELETE'])
def excluir(id):
    try:
        caixinha = Caixinha.query.get(id)
        if not caixinha:
            return jsonify({"erro": "Caixinha não encontrada"}), 404
            
        db.session.delete(caixinha)
        db.session.commit()
        return jsonify({"mensagem": "Caixinha excluída"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500