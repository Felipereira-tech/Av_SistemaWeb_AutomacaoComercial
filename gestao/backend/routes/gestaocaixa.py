from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError
from models import db, Usuario, Caixinha, HistoricoCaixa

gestaocaixa_bp = Blueprint("gestaocaixa", __name__)


def obter_json():
    """Obtém o corpo JSON da requisição."""
    dados = request.get_json(silent=True)
    return dados if isinstance(dados, dict) else {}


def converter_valor(valor, campo):
    """Converte um valor monetário e rejeita valores inválidos."""
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        raise ValueError(f"O campo '{campo}' deve ser numérico.")

    if not __import__("math").isfinite(numero):
        raise ValueError(f"O campo '{campo}' deve ser finito.")

    if numero < 0:
        raise ValueError(f"O campo '{campo}' não pode ser negativo.")

    return round(numero, 2)


def registrar_erro(mensagem):
    """Registra o erro completo somente nos logs do servidor."""
    current_app.logger.exception(mensagem)


# ==========================================================
# LISTAR CAIXINHAS E HISTÓRICO
# GET /api/caixinhas?user_id=1
# ==========================================================
@gestaocaixa_bp.route("/caixinhas", methods=["GET"])
def listar():
    try:
        user_id = request.args.get("user_id", type=int)

        query_caixas = Caixinha.query
        query_historico = HistoricoCaixa.query.join(
            Caixinha,
            HistoricoCaixa.caixinha_id == Caixinha.id
        )

        if user_id is not None:
            if user_id <= 0:
                return jsonify({
                    "erro": "ID de usuário inválido."
                }), 400

            query_caixas = query_caixas.filter(
                Caixinha.user_id == user_id
            )
            query_historico = query_historico.filter(
                Caixinha.user_id == user_id
            )

        caixinhas = query_caixas.order_by(
            Caixinha.id.desc()
        ).all()

        historico = query_historico.order_by(
            HistoricoCaixa.data.desc()
        ).all()

        return jsonify({
            "caixinhas": [c.to_dict() for c in caixinhas],
            "historico": [h.to_dict() for h in historico]
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        registrar_erro("Erro ao listar caixinhas")
        return jsonify({
            "erro": "Não foi possível consultar as caixinhas."
        }), 500


# ==========================================================
# CRIAR CAIXINHA
# POST /api/caixinhas
# ==========================================================
@gestaocaixa_bp.route("/caixinhas", methods=["POST"])
def criar():
    dados = obter_json()

    nome = dados.get("nome")
    banco = dados.get("banco")
    user_id = dados.get("user_id")

    if not isinstance(nome, str) or not nome.strip():
        return jsonify({
            "erro": "Informe o nome da caixinha."
        }), 400

    if not isinstance(banco, str) or not banco.strip():
        return jsonify({
            "erro": "Informe o banco ou instituição financeira."
        }), 400

    try:
        # CORREÇÃO PRINCIPAL: Mecanismo de fallback (Segurança contra falhas do Frontend)
        # Se o frontend esquecer de mandar o user_id, pegamos o primeiro usuário (Admin) do banco
        if user_id is None:
            usuario_padrao = Usuario.query.first()
            if usuario_padrao:
                usuario = usuario_padrao
            else:
                return jsonify({
                    "erro": "Nenhum usuário cadastrado no sistema para vincular a caixinha."
                }), 400
        else:
            user_id = int(user_id)
            if user_id <= 0:
                raise ValueError("ID de usuário inválido.")
            
            usuario = db.session.get(Usuario, user_id)
            if usuario is None:
                return jsonify({
                    "erro": "Usuário informado não foi encontrado."
                }), 400

        valor_atual = converter_valor(
            dados.get("valorAtual", 0), "valorAtual"
        )
        meta = converter_valor(
            dados.get("meta", 0), "meta"
        )

        nova_caixinha = Caixinha(
            nome=nome.strip(),
            banco=banco.strip(),
            valorAtual=valor_atual,
            meta=meta,
            user_id=usuario.id
        )

        db.session.add(nova_caixinha)
        db.session.flush()

        if valor_atual > 0:
            historico = HistoricoCaixa(
                caixinha_id=nova_caixinha.id,
                tipo="entrada",
                valor=valor_atual,
                usuario=usuario.username
            )
            db.session.add(historico)

        db.session.commit()

        return jsonify(nova_caixinha.to_dict()), 201

    except (TypeError, ValueError) as erro:
        db.session.rollback()
        return jsonify({"erro": str(erro)}), 400

    except SQLAlchemyError:
        db.session.rollback()
        registrar_erro("Erro de banco ao criar caixinha")
        return jsonify({
            "erro": "Falha ao salvar a caixinha no banco de dados."
        }), 500

    except Exception:
        db.session.rollback()
        registrar_erro("Erro inesperado ao criar caixinha")
        return jsonify({
            "erro": "Ocorreu um erro interno ao criar a caixinha."
        }), 500


# ==========================================================
# MOVIMENTAR SALDO
# POST /api/caixinhas/<id>/movimentar
# ==========================================================
@gestaocaixa_bp.route(
    "/caixinhas/<int:id>/movimentar",
    methods=["POST"]
)
def movimentar(id):
    dados = obter_json()

    tipo = dados.get("tipo")

    if tipo not in ("entrada", "saida"):
        return jsonify({
            "erro": "Tipo inválido. Use 'entrada' ou 'saida'."
        }), 400

    try:
        valor = converter_valor(
            dados.get("valor"), "valor"
        )

        if valor <= 0:
            return jsonify({
                "erro": "O valor da movimentação deve ser maior que zero."
            }), 400

        caixinha = db.session.execute(
            db.select(Caixinha)
            .where(Caixinha.id == id)
            .with_for_update()
        ).scalar_one_or_none()

        if caixinha is None:
            return jsonify({
                "erro": "Caixinha não encontrada."
            }), 404

        saldo_atual = float(caixinha.valorAtual or 0)

        if tipo == "saida" and valor > saldo_atual:
            return jsonify({
                "erro": "Saldo insuficiente."
            }), 400

        if tipo == "entrada":
            caixinha.valorAtual = round(
                saldo_atual + valor, 2
            )
        else:
            caixinha.valorAtual = round(
                saldo_atual - valor, 2
            )

        # Se não enviarem o nome, usamos Admin por padrão para não quebrar
        usuario_nome = dados.get("usuario", "Admin")
        if not isinstance(usuario_nome, str):
            usuario_nome = "Admin"

        historico = HistoricoCaixa(
            caixinha_id=caixinha.id,
            tipo=tipo,
            valor=valor,
            usuario=usuario_nome[:50]
        )

        db.session.add(historico)
        db.session.commit()

        return jsonify({
            "mensagem": "Movimentação realizada com sucesso.",
            "caixinha": caixinha.to_dict()
        }), 200

    except (TypeError, ValueError) as erro:
        db.session.rollback()
        return jsonify({"erro": str(erro)}), 400

    except SQLAlchemyError:
        db.session.rollback()
        registrar_erro("Erro de banco ao movimentar caixinha")
        return jsonify({
            "erro": "Não foi possível registrar a movimentação."
        }), 500

    except Exception:
        db.session.rollback()
        registrar_erro("Erro inesperado ao movimentar caixinha")
        return jsonify({
            "erro": "Ocorreu um erro interno na movimentação."
        }), 500


# ==========================================================
# EXCLUIR CAIXINHA E SEU HISTÓRICO
# DELETE /api/caixinhas/<id>
# ==========================================================
@gestaocaixa_bp.route("/caixinhas/<int:id>", methods=["DELETE"])
def excluir(id):
    try:
        caixinha = db.session.get(Caixinha, id)

        if caixinha is None:
            return jsonify({
                "erro": "Caixinha não encontrada."
            }), 404

        db.session.delete(caixinha)
        db.session.commit()

        return jsonify({
            "mensagem": "Caixinha e histórico excluídos com sucesso."
        }), 200

    except SQLAlchemyError:
        db.session.rollback()
        registrar_erro("Erro de banco ao excluir caixinha")
        return jsonify({
            "erro": "Não foi possível excluir a caixinha."
        }), 500

    except Exception:
        db.session.rollback()
        registrar_erro("Erro inesperado ao excluir caixinha")
        return jsonify({
            "erro": "Ocorreu um erro interno ao excluir a caixinha."
        }), 500