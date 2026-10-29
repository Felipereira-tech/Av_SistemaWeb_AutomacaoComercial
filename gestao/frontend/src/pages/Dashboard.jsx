import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // Estados para guardar os dados reais vindos do banco
  const [resumo, setResumo] = useState({
    faturamento: 0,
    vendasHoje: 0,
    estoqueBaixo: []
  });
  const [ultimasVendas, setUltimasVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Função isolada para poder ser chamada novamente após excluir uma venda
  const buscarDadosDashboard = async () => {
    try {
      const urlDashboard = `https://paidegua-api.onrender.com/api/dashboard`;
      const response = await fetch(urlDashboard);
      
      if (response.ok) {
        const data = await response.json();
        setResumo({
          faturamento: data.faturamento || 0,
          vendasHoje: data.vendasHoje || 0,
          estoqueBaixo: data.estoqueBaixo || []
        });
        setUltimasVendas(data.ultimasVendas || []);
      }
    } catch (error) {
      console.error("Erro ao conectar com o servidor para buscar o dashboard:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosDashboard();
  }, []);

  // FUNÇÃO NOVA: Excluir Venda
  const handleExcluirVenda = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir esta venda? O valor será removido do faturamento e os produtos devem voltar ao estoque.");
    
    if (!confirmar) return;

    try {
      // Faz a requisição DELETE para a sua API
      const response = await fetch(`https://paidegua-api.onrender.com/api/vendas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Animação visual básica removendo o item da lista imediatamente
        setUltimasVendas((vendasAnteriores) => 
          vendasAnteriores.filter((venda) => venda.id !== id)
        );
        
        // Recarrega os dados do dashboard para atualizar o faturamento total e contagem
        buscarDadosDashboard();
        alert("Venda excluída com sucesso!");
      } else {
        alert("Erro ao excluir a venda no servidor.");
      }
    } catch (error) {
      console.error("Erro ao tentar excluir a venda:", error);
      alert("Erro de conexão ao tentar excluir.");
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  // Formatar número para moeda (R$)
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="dashboard-container">
      {/* MENU LATERAL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Logo Pai D'Égua" className="sidebar-logo" />
          <p>PDV & Gestão empresarial</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">Dashboard</Link>
          <Link to="/pdv" className="nav-item">Caixa (PDV)</Link>
          <Link to="/produtos" className="nav-item">Produtos</Link>
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
        <header className="content-header">
          <h1>Resumo do Dia</h1>
          <p>Acompanhe o desempenho da sua loja em tempo real.</p>
        </header>

        {carregando ? (
          <p className="loading-message">Carregando dados do sistema...</p>
        ) : (
          <>
            {/* CARDS DE INDICADORES */}
            <div className="cards-grid">
              <div className="card">
                <h3>Faturamento Hoje</h3>
                <p className="card-value cash">{formatarMoeda(resumo.faturamento)}</p>
              </div>
              
              <div className="card">
                <h3>Vendas Realizadas</h3>
                <p className="card-value">{resumo.vendasHoje}</p>
              </div>
              
              <div className="card alert">
                <h3>Estoque Baixo</h3>
                <p className="card-value">{resumo.estoqueBaixo.length} itens</p>
                
                {resumo.estoqueBaixo.length > 0 ? (
                  <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#ef4444' }}>
                    <strong>Atenção:</strong>
                    <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                      {resumo.estoqueBaixo.map((produto, index) => (
                        <li key={index}>
                          {produto.nome} ({produto.quantidade} un)
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <span className="card-subtitle" style={{ color: '#10b981' }}>
                    Tudo certo com o estoque!
                  </span>
                )}
              </div>
            </div>

            {/* TABELA DE ÚLTIMAS VENDAS */}
            <section className="recent-sales">
              <h2>Últimas Vendas</h2>
              <div className="table-container">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Horário</th>
                      <th>Produtos</th>
                      <th>Valor Total</th>
                      <th>Pagamento</th>
                      <th>Ações</th> {/* NOVA COLUNA AQUI */}
                    </tr>
                  </thead>
                  <tbody>
                    {ultimasVendas.length > 0 ? (
                      ultimasVendas.map((venda) => (
                        <tr key={venda.id} style={{ transition: 'all 0.3s ease' }}>
                          <td>{venda.horario}</td>
                          <td>{venda.produtos}</td>
                          <td>{formatarMoeda(venda.valorTotal)}</td>
                          <td>
                            <span className={`badge ${venda.pagamento.toLowerCase()}`}>
                              {venda.pagamento}
                            </span>
                          </td>
                          <td>
                            {/* BOTÃO DE EXCLUIR */}
                            <button 
                              onClick={() => handleExcluirVenda(venda.id)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                              onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-table">
                          Nenhuma venda registrada hoje.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}