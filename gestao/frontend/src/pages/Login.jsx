import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensagem('');
    setCarregando(true);

    try {
      // Conexão dinâmica: funciona automaticamente no PC (localhost) e no Celular (IP da rede)
      const urlLogin = `https://paidegua-api.onrender.com/api/login`;
      
      const response = await fetch(urlLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, senha }),
      });

      const data = await response.json();

      if (response.ok && data.sucesso) {
        // Quando der certo, pula direto pro Dashboard
        navigate('/dashboard'); 
      } else {
        setMensagem(data.mensagem || 'Usuário ou senha incorretos.');
      }
    } catch (error) {
      setMensagem('Erro de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {/* Imagem da logo importada da pasta assets */}
          <img src={logo} alt="Logo Pai D'Égua Gestão" className="login-logo" />
          <p>Excelência em Eficiência é Gestão</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </div>

          {mensagem && (
            <div className="login-message">
              {mensagem}
            </div>
          )}

          <button type="submit" disabled={carregando} className="btn-login">
            {carregando ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
}