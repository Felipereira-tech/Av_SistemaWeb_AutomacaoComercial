from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False) # Senha em texto puro
    data_criacao = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {"id": self.id, "username": self.username}

class Produto(db.Model):
    __tablename__ = 'produtos'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    preco = db.Column(db.Float, nullable=False)
    quantidade = db.Column(db.Integer, nullable=False, default=0)
    
    # A SOLUÇÃO: Coluna adicionada para garantir o funcionamento do Soft Delete
    ativo = db.Column(db.Boolean, default=True) 
    
    data_criacao = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id, 
            "nome": self.nome, 
            "preco": self.preco, 
            "quantidade": self.quantidade,
            "ativo": self.ativo
        }

class Venda(db.Model):
    __tablename__ = 'vendas'
    id = db.Column(db.Integer, primary_key=True)
    total = db.Column(db.Float, nullable=False)
    pagamento = db.Column(db.String(50), nullable=False)
    data = db.Column(db.DateTime, default=datetime.now)
    
    # NOVOS CAMPOS PARA A INFINITEPAY
    transacao_id = db.Column(db.String(255), nullable=True)
    status_pagamento = db.Column(db.String(50), default='Concluído')
    metodo_infinitepay = db.Column(db.String(50), nullable=True)
    qr_code_pix = db.Column(db.Text, nullable=True)

    itens = db.relationship('ItemVenda', backref='venda', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "total": self.total,
            "pagamento": self.pagamento,
            "data": self.data.isoformat() if self.data else None,
            "transacao_id": self.transacao_id,
            "status_pagamento": self.status_pagamento,
            "metodo_infinitepay": self.metodo_infinitepay,
            "qr_code_pix": self.qr_code_pix,
            "itens": [item.to_dict() for item in self.itens]
        }

class ItemVenda(db.Model):
    __tablename__ = 'itens_venda'
    id = db.Column(db.Integer, primary_key=True)
    venda_id = db.Column(db.Integer, db.ForeignKey('vendas.id'), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Float, nullable=False)
    produto = db.relationship('Produto')

    def to_dict(self):
        return {
            "id": self.id,
            "produto_id": self.produto_id,
            "produto_nome": self.produto.nome if self.produto else "Excluído",
            "quantidade": self.quantidade,
            "preco_unitario": self.preco_unitario,
            "subtotal": round(self.quantidade * self.preco_unitario, 2)
        }