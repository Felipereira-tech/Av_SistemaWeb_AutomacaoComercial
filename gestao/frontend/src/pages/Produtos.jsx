import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Produtos.css';

export default function Produtos() {
  const navigate = useNavigate();

  // Estados para a lista e busca
  const [produtos, setProdutos] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Estados para o Modal de Cadastro/Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [produtoAtual, setProdutoAtual] = useState({
    id: null,
    nome: '',
    preco: '',
    quantidade: ''
  });

  // Estado para a mensagem de sucesso visual customizada (substitui o alert do navegador com IP)
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Estados para o Modal de Confirmação de Exclusão (substitui o window.confirm nativo)
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState({ id: null, nome: '' });

  // Função para buscar os produtos no banco de dados
  const buscarProdutos = async () => {
    setCarregando(true);
    try {
      const response = await fetch(`https://paidegua-api.onrender.com/api/produtos`);
      if (response.ok) {
        const data = await response.json();
        setProdutos(data);
      }
    } catch (error) {
      console.error('Erro de conexão ao buscar produtos:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarProdutos();
  }, []);

  const handleLogout = () => {
    navigate('/login');
  };

  // Filtro de busca de produtos
  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Abre o modal para NOVO produto
  const abrirModalNovo = () => {
    setProdutoAtual({ id: null, nome: '', preco: '', quantidade: '' });
    setModalAberto(true);
  };

  // Abre o modal para EDITAR produto
  const abrirModalEditar = (produto) => {
    setProdutoAtual({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      // Força a exibir no mínimo 0 caso no banco esteja negativo
      quantidade: Math.max(0, produto.quantidade)
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoAtual({ id: null, nome: '', preco: '', quantidade: '' });
  };

  // Salvar produto (Cadastrar ou Atualizar)
  const salvarProduto = async (e) => {
    e.preventDefault(); 
    setProcessando(true);

    const metodo = produtoAtual.id ? 'PUT' : 'POST';
    const url = produtoAtual.id 
      ? `https://paidegua-api.onrender.com/api/produtos/${produtoAtual.id}` 
      : `https://paidegua-api.onrender.com/api/produtos`;

    // TRAVA DE SEGURANÇA: Garante que a quantidade nunca será menor que 0 no banco
    const qtdDigitada = produtoAtual.quantidade ? parseInt(produtoAtual.quantidade, 10) : 0;
    const qtdFinalSegura = Math.max(0, qtdDigitada);

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: produtoAtual.nome,
          preco: parseFloat(produtoAtual.preco),
          quantidade: qtdFinalSegura
        })
      });

      if (response.ok) {
        fecharModal();
        buscarProdutos();
      } else {
        alert('Erro retornado pelo servidor ao tentar salvar o produto.');
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setProcessando(false);
    }
  };

  // Abre o modal personalizado de confirmação de exclusão
  const confirmarExclusao = (id, nomeProduto) => {
    setProdutoParaExcluir({ id, nome: nomeProduto });
    setModalExclusaoAberto(true);
  };

  // Executa a inativação real após o usuário confirmar no modal da tela
  const executarExclusao = async () => {
    const { id, nome } = produtoParaExcluir;
    setModalExclusaoAberto(false);

    try {
      const response = await fetch(`https://paidegua-api.onrender.com/api/produtos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Exibe a mensagem limpa, didática e destacada informando o nome do produto inativado
        setMensagemSucesso(`✅ Produto "${nome}" inativado com sucesso!`);
        
        // Remove a mensagem sozinha após 4 segundos
        setTimeout(() => {
          setMensagemSucesso('');
        }, 4000);

        buscarProdutos();
      } else {
        alert('Erro ao tentar excluir o produto.');
      } 
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="dashboard-container">
      {/* AVISO DE SUCESSO FLUTUANTE AUMENTADO E DESTACADO */}
      {mensagemSucesso && (
        <div style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          backgroundColor: '#0f766e',
          color: 'white',
          padding: '1.5rem 2.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 9999,
          fontWeight: '700',
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          border: '2px solid #14b8a6'
        }}>
          {mensagemSucesso}
        </div>
      )}

      {/* MENU LATERAL PADRÃO */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Logo Pai D'Égua" className="sidebar-logo" />
          <p>PDV & Gestão</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/pdv" className="nav-item">Caixa (PDV)</Link>
          <Link to="/produtos" className="nav-item active">Produtos</Link>
          <Link to="/estoque" className="nav-item">Estoque</Link>
          <Link to="/financeiro" className="nav-item">Financeiro</Link>
           <Link to="/gestaocaixa" className="nav-item">Gestão de Caixa</Link>
          <Link to="/usuarios" className="nav-item">Novos Usuários</Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Gestão de Produtos</h1>
            <p>Cadastre, edite ou remova itens do seu estoque.</p>
          </div>
          
          {/* BARRA DE PESQUISA E BOTÃO NOVO */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px' }}>
            <input
              type="text"
              placeholder="Buscar produto pelo nome..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="input-busca"
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
            <button className="btn-novo-produto" onClick={abrirModalNovo} style={{ backgroundColor: '#0f766e', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
              Novo Produto
            </button>
          </div>
        </header>

        {/* LISTA DE PRODUTOS */}
        <div className="table-container" style={{ marginTop: '1.5rem' }}>
          {carregando ? (
            <p className="loading-message">Carregando estoque...</p>
          ) : (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Nome do Produto</th>
                  <th>Preço</th>
                  <th>Estoque (Qtd)</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.length > 0 ? (
                  produtosFiltrados.map((produto) => {
                    // TRAVA DE VISUALIZAÇÃO: Se vier negativo do banco, mostra 0
                    const qtdExibicao = Math.max(0, produto.quantidade);

                    return (
                      <tr key={produto.id}>
                        <td style={{ fontWeight: '500' }}>{produto.nome}</td>
                        <td>{formatarMoeda(produto.preco)}</td>
                        <td>
                          <span className={`badge ${qtdExibicao <= 5 ? 'credito' : 'pix'}`}>
                            {qtdExibicao} un
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn-acao-editar" onClick={() => abrirModalEditar(produto)}>Editar</button>
                          <button className="btn-acao-excluir" onClick={() => confirmarExclusao(produto.id, produto.nome)}>Excluir</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-table">
                      {termoBusca ? 'Nenhum produto corresponde à busca.' : 'Nenhum produto cadastrado no banco de dados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-form-produto">
            <h2 style={{ marginBottom: '1.5rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              {produtoAtual.id ? 'Editar Produto' : 'Cadastrar Produto'}
            </h2>
            
            <form onSubmit={salvarProduto}>
              <div className="form-group">
                <label>Nome do Produto:</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do produto"
                  value={produtoAtual.nome}
                  onChange={(e) => setProdutoAtual({ ...produtoAtual, nome: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Preço de Venda (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={produtoAtual.preco}
                    onChange={(e) => setProdutoAtual({ ...produtoAtual, preco: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Quantidade:</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={produtoAtual.quantidade}
                    onChange={(e) => setProdutoAtual({ ...produtoAtual, quantidade: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-acoes" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={fecharModal} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={processando} style={{ flex: 2, padding: '0.75rem', backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'white' }}>
                  {processando ? 'Processando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZADO DE CONFIRMAÇÃO DE EXCLUSÃO (SUBSTITUI O WINDOW.CONFIRM) */}
      {modalExclusaoAberto && (
        <div className="modal-overlay">
          <div className="modal-form-produto" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: '#0f172a', fontSize: '1.25rem' }}>
              ⚠️ Confirmar Inativação
            </h2>
            <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.5' }}>
              Tem certeza que deseja inativar o produto <strong>"{produtoParaExcluir.nome}"</strong>?<br/>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Ele será removido do PDV, mas o histórico financeiro será mantido.</span>
            </p>
            <div className="modal-acoes" style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setModalExclusaoAberto(false)} 
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={executarExclusao} 
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'white' }}
              >
                Sim, Inativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}