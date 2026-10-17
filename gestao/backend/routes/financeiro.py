from flask import Blueprint, request, jsonify, send_file
from models import Venda
from datetime import datetime
import pandas as pd
from io import BytesIO

financeiro_bp = Blueprint('financeiro', __name__)

@financeiro_bp.route('/financeiro', methods=['GET'])
def relatorio():
    inicio = request.args.get('inicio')
    fim = request.args.get('fim')
    
    query = Venda.query
    
    if inicio:
        query = query.filter(Venda.data >= datetime.strptime(inicio, '%Y-%m-%d'))
    if fim:
        fim_dt = datetime.strptime(fim, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
        query = query.filter(Venda.data <= fim_dt)
        
    vendas = query.order_by(Venda.data.desc()).all()
    return jsonify([v.to_dict() for v in vendas]), 200

@financeiro_bp.route('/financeiro/exportar', methods=['GET'])
def exportar_excel():
    vendas = Venda.query.order_by(Venda.data.desc()).all()
    
    # Prepara os dados para a planilha
    dados = []
    for v in vendas:
        for item in v.itens:
            dados.append({
                "ID Venda": v.id,
                "Data": v.data.strftime("%d/%m/%Y %H:%M"),
                "Pagamento": v.pagamento,
                "Produto": item.produto.nome if item.produto else "Excluído",
                "Qtd": item.quantidade,
                "Preço Unitário": item.preco_unitario,
                "Subtotal Item": round(item.quantidade * item.preco_unitario, 2),
                "Total da Venda": v.total
            })
            
    df = pd.DataFrame(dados)
    output = BytesIO()
    
    # Usando engine openpyxl para gerar o XLSX
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Relatório de Vendas')
        
    output.seek(0)
    return send_file(output, download_name="relatorio_vendas.xlsx", as_attachment=True)