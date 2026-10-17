from flask import Flask

def register_routes(app: Flask):
    from .auth import auth_bp
    from .usuarios import usuarios_bp
    from .produtos import produtos_bp
    from .pdv import pdv_bp
    from .financeiro import financeiro_bp
    from .gestaocaixa import gestaocaixa_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(usuarios_bp, url_prefix='/api')
    app.register_blueprint(produtos_bp, url_prefix='/api')
    app.register_blueprint(pdv_bp, url_prefix='/api')
    app.register_blueprint(financeiro_bp, url_prefix='/api')
    app.register_blueprint(gestaocaixa_bp, url_prefix='/api/caixinhas')