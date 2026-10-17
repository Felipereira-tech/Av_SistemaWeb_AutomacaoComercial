import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Usuarios.css';

export default function Usuarios() {
  const navigate = useNavigate();

  // Estados da Tela
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Estados do Modal de Cadastro (Agora apenas com username e senha)
  const [modalAberto, setModalAberto] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ username: '', senha: '' });

  // Estados do Modal de Troca de Senha
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  // Busca os usuários cadastrados no banco de dados
  const buscarUsuarios = async () => {
    setCarregando(true);
    try {
      const response = await fetch(`https://paidegua-api.onrender.com/api/usuarios`);
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const handleLogout = () => {
    navigate('/login');
  };

  // ==========================================
  // FUNÇÕES DE CADASTRO DE USUÁRIO
  // ==========================================
  const abrirModalNovo = () => {
    setNovoUsuario({ username: '', senha: '' });
    setModalAberto(true);
  };

  const fecharModalNovo = () => {
    setModalAberto(false);
    setNovoUsuario({ username: '', senha: '' });
  };

  const salvarUsuario = async (e) => {
    e.preventDefault();
    setProcessando(true);

    try {
      const response = await fetch(`https://paidegua-api.onrender.com/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUsuario) // Envia apenas username e senha
      });

      if (response.ok) {
        fecharModalNovo();
        buscarUsuarios(); // Atualiza a tabela com o novo usuário
      } else {
        const erro = await response.json();
        alert(erro.mensagem || 'Erro ao cadastrar usuário.');
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setProcessando(false);
    }
  };

  // ==========================================
  // FUNÇÕES DE EXCLUSÃO
  // ==========================================
  const excluirUsuario = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover o acesso deste usuário permanentemente?')) return;

    try {
      const response = await fetch(`https://paidegua-api.onrender.com/api/usuarios/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        buscarUsuarios();
      } else {
        alert('Erro ao tentar remover o usuário.');
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    }
  };

  // ==========================================
  // FUNÇÕES DE TROCA DE SENHA
  // ==========================================
  const abrirModalSenha = (usuario) => {
    setUsuarioSelecionado(usuario);
    setNovaSenha('');
    setModalSenhaAberto(true);
  };

  const fecharModalSenha = () => {
    setModalSenhaAberto(false);
    setUsuarioSelecionado(null);
    setNovaSenha('');
  };

  const salvarNovaSenha = async (e) => {
    e.preventDefault();
    setProcessando(true);

    try {
      const response = await fetch(`https://paidegua-api.onrender.com/api/usuarios/${usuarioSelecionado.id}/senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: novaSenha })
      });

      if (response.ok) {
        alert(`Senha do usuário atualizada com sucesso!`);
        fecharModalSenha();
      } else {
        alert('Erro ao tentar atualizar a senha.');
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* MENU LATERAL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Logo Pai D'Égua" className="sidebar-logo" />
          <p>PDV & Gestão</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/pdv" className="nav-item">Caixa (PDV)</Link>
          <Link to="/produtos" className="nav-item">Produtos</Link>
          <Link to="/financeiro" className="nav-item">Financeiro</Link>
          <Link to="/usuarios" className="nav-item active">Usuários</Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Gestão de Usuários</h1>
            <p>Gerencie quem tem acesso ao sistema da sua loja.</p>
          </div>
          <button onClick={abrirModalNovo} className="btn-novo-usuario">
            Novo Usuário
          </button>
        </header>

        {/* TABELA DE USUÁRIOS */}
        <div className="table-container" style={{ marginTop: '2rem' }}>
          {carregando ? (
            <p className="loading-message">Carregando usuários do banco de dados...</p>
          ) : (
            <table className="sales-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Nome de Login</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td style={{ color: '#64748b', fontWeight: 'bold' }}>#{usuario.id}</td>
                      {/* Suporta tanto o backend enviando "username" quanto "nome" */}
                      <td style={{ fontWeight: '500', color: '#0f172a' }}>{usuario.username || usuario.nome}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-acao-editar"
                          onClick={() => abrirModalSenha(usuario)}
                        >
                          Trocar Senha
                        </button>
                        <button 
                          className="btn-acao-excluir"
                          onClick={() => excluirUsuario(usuario.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="empty-table">
                      Nenhum usuário encontrado no banco de dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL DE CADASTRO DE USUÁRIO (Apenas Login e Senha) */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-form-produto">
            <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem', color: '#0f172a' }}>
              Cadastrar Novo Usuário
            </h2>
            
            <form onSubmit={salvarUsuario}>
              <div className="form-group">
                <label>Nome de Login:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: admin, caixa1, joao"
                  value={novoUsuario.username}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Senha de Acesso:</label>
                <input
                  type="password"
                  required
                  minLength="4"
                  placeholder="Digite a senha (mín. 4 caracteres)"
                  value={novoUsuario.senha}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                />
              </div>

              <div className="modal-acoes">
                <button type="button" className="btn-cancelar" onClick={fecharModalNovo}>
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar" disabled={processando}>
                  {processando ? 'Cadastrando...' : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE TROCA DE SENHA */}
      {modalSenhaAberto && (
        <div className="modal-overlay">
          <div className="modal-form-produto">
            <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem', color: '#0f172a' }}>
              Trocar Senha
            </h2>
            
            <form onSubmit={salvarNovaSenha}>
              <div className="form-group">
                <label>Usuário selecionado:</label>
                <input
                  type="text"
                  disabled
                  value={usuarioSelecionado?.username || usuarioSelecionado?.nome || ''}
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}
                />
              </div>

              <div className="form-group">
                <label>Nova Senha:</label>
                <input
                  type="password"
                  required
                  minLength="4"
                  placeholder="Digite a nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
              </div>

              <div className="modal-acoes">
                <button type="button" className="btn-cancelar" onClick={fecharModalSenha}>
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar" disabled={processando}>
                  {processando ? 'Salvando...' : 'Confirmar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}