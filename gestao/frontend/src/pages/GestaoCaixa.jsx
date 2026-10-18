import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './GestaoCaixa.css';

const GestaoCaixa = () => {
  // ==========================================
  // ESTADOS PRINCIPAIS
  // ==========================================
  const [caixinhas, setCaixinhas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Estados do Formulário de Nova Caixinha
  const [exibirFormulario, setExibirFormulario] = useState(false);
  const [formData, setFormData] = useState({ nome: '', banco: '', valorAtual: '', meta: '' });

  // Estados do Modal de Movimentação (Adicionar / Retirar)
  const [caixinhaSelecionada, setCaixinhaSelecionada] = useState(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState(''); // 'entrada' ou 'saida'
  const [valorMovimentacao, setValorMovimentacao] = useState('');

  // ==========================================
  // INTEGRAÇÃO COM O BACKEND (API)
  // ==========================================
  const API_URL = 'https://paidegua-api.onrender.com/api/caixinhas';

  const buscarDados = async () => {
    setCarregando(true);
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setCaixinhas(data.caixinhas);
        setHistorico(data.historico);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  // ==========================================
  // FUNÇÕES UTILITÁRIAS & CÁLCULOS
  // ==========================================
  const valorTotal = caixinhas.reduce((acc, curr) => acc + Number(curr.valorAtual), 0);

  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calcularProgresso = (atual, meta) => {
    if (!meta || meta === 0) return 0;
    const porcentagem = (atual / meta) * 100;
    return porcentagem > 100 ? 100 : porcentagem.toFixed(1);
  };

  const formatarDataHora = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Conversor inteligente de moeda (resolve o problema dos 50.000 vs 50,00)
  const parseMoeda = (valorStr) => {
    if (!valorStr) return 0;
    let limpo = String(valorStr).trim().replace(/[^\d.,]/g, '');
    
    if (limpo.includes('.') && limpo.includes(',')) {
      limpo = limpo.replace(/\./g, '').replace(',', '.');
    } else if (limpo.includes(',')) {
      limpo = limpo.replace(',', '.');
    } else if (limpo.includes('.')) {
      const partes = limpo.split('.');
      if (partes[partes.length - 1].length === 3) {
        limpo = limpo.replace(/\./g, '');
      }
    }
    return parseFloat(limpo) || 0;
  };

  // ==========================================
  // FUNÇÕES DE CADASTRO E EXCLUSÃO
  // ==========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const valorInicialValidado = parseMoeda(formData.valorAtual);
    const metaValidada = parseMoeda(formData.meta);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          banco: formData.banco,
          valorAtual: valorInicialValidado,
          meta: metaValidada,
          usuario: 'Admin',
          user_id: 1 // <--- SOLUÇÃO: Agora envia o ID para não ser bloqueado pelo backend!
        })
      });

      if (response.ok) {
        setExibirFormulario(false);
        setFormData({ nome: '', banco: '', valorAtual: '', meta: '' });
        buscarDados();
      } else {
        alert('Erro ao criar a caixinha no servidor.');
      }
    } catch (error) {
      alert('Erro de conexão com o banco de dados.');
    }
  };

  const excluirCaixinha = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o cofre "${nome}" e todo o seu histórico permanentemente?`)) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          buscarDados();
        } else {
          alert('Erro ao excluir o cofre.');
        }
      } catch (error) {
        alert('Erro de conexão com a API.');
      }
    }
  };

  // ==========================================
  // FUNÇÕES DE MOVIMENTAÇÃO (ADICIONAR/RETIRAR)
  // ==========================================
  const abrirModalMovimentacao = (caixinha, tipo) => {
    setCaixinhaSelecionada(caixinha);
    setTipoMovimentacao(tipo); // 'entrada' ou 'saida'
    setValorMovimentacao('');
  };

  const confirmarMovimentacao = async (e) => {
    e.preventDefault();
    
    const valorValidado = parseMoeda(valorMovimentacao);

    if (valorValidado <= 0) {
      alert("Digite um valor numérico válido maior que zero.");
      return;
    }

    if (tipoMovimentacao === 'saida' && valorValidado > caixinhaSelecionada.valorAtual) {
      alert("Saldo insuficiente neste cofre para realizar esta retirada.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${caixinhaSelecionada.id}/movimentar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoMovimentacao,
          valor: valorValidado,
          usuario: 'Admin'
        })
      });

      if (response.ok) {
        setCaixinhaSelecionada(null);
        setValorMovimentacao('');
        buscarDados(); // Atualiza os saldos e o histórico na mesma hora
      } else {
        alert('Erro ao processar a movimentação.');
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* =========================================
          MENU LATERAL (SIDEBAR)
      ========================================= */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Pai D'Égua Gestão" className="sidebar-logo" />
          <p>PDV & GESTÃO EMPRESARIAL</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link className="nav-item" to="/dashboard">Dashboard</Link>
          <Link className="nav-item" to="/pdv">Caixa (PDV)</Link>
          <Link className="nav-item" to="/produtos">Produtos</Link>
          <Link className="nav-item" to="/financeiro">Financeiro</Link>
          <Link className="nav-item active" to="/gestaocaixa">Gestão de Caixa</Link>
          <Link to="/usuarios" className="nav-item">Novos Usuários</Link>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout">Sair</button>
        </div>
      </aside>

      {/* =========================================
          CONTEÚDO PRINCIPAL
      ========================================= */}
      <main className="main-content">
        
        {/* CABEÇALHO */}
        <div className="produtos-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="content-header" style={{ marginBottom: 0 }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <circle cx="12" cy="12" r="2"></circle>
                <path d="M6 12h.01M18 12h.01"></path>
              </svg>
              Gestão de Cofres e Reservas
            </h1>
            <p>Acompanhe, injete e retire fundos das suas metas financeiras.</p>
          </div>
          <button className="btn-novo-produto" onClick={() => setExibirFormulario(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nova Caixinha
          </button>
        </div>

        {/* CARD DE RESUMO GERAL */}
        <div className="cards-grid">
          <div className="card" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', color: 'white', border: 'none' }}>
            <h3 style={{ color: '#ccfbf1' }}>PATRIMÔNIO TOTAL ACUMULADO (TODAS AS CAIXINHAS)</h3>
            <div className="card-value" style={{ color: 'white', fontSize: '2.5rem' }}>
              {formatarMoeda(valorTotal)}
            </div>
          </div>
        </div>

        {/* LOADING & GRID DE CAIXINHAS */}
        {carregando ? (
          <p className="loading-message" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Sincronizando com o banco de dados...</p>
        ) : (
          <div className="caixinhas-grid">
            {caixinhas.map((caixinha) => (
              <div key={caixinha.id} className="card caixinha-card" style={{ position: 'relative', overflow: 'hidden' }}>
                
                {/* Cabeçalho do Card e Botão de Excluir */}
                <div className="caixinha-header" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 className="caixinha-titulo">{caixinha.nome}</h3>
                    <span className="badge px-badge" style={{ width: 'fit-content' }}>{caixinha.banco}</span>
                  </div>
                  <button 
                    className="btn-acao-excluir" 
                    onClick={() => excluirCaixinha(caixinha.id, caixinha.nome)}
                    title="Excluir Caixinha"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', padding: 0 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
                
                {/* Saldo Atual */}
                <div className="caixinha-saldo" style={{ margin: '1.5rem 0' }}>
                  <span className="card-subtitle" style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Saldo Atual</span>
                  <div className="card-value cash" style={{ fontSize: '2rem', color: '#0f766e', fontWeight: '800' }}>
                    {formatarMoeda(caixinha.valorAtual)}
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="progresso-area" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.2rem' }}>
                  <div className="progresso-textos" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b' }}>Meta: <strong>{formatarMoeda(caixinha.meta)}</strong></span>
                    <strong style={{ color: '#0f766e' }}>{calcularProgresso(caixinha.valorAtual, caixinha.meta)}%</strong>
                  </div>
                  <div className="progresso-barra-fundo" style={{ backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      className="progresso-barra-preenchimento" 
                      style={{ 
                        width: `${calcularProgresso(caixinha.valorAtual, caixinha.meta)}%`, 
                        backgroundColor: '#10b981', 
                        height: '100%', 
                        transition: 'width 0.6s ease' 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Botões de Ação (Depositar e Retirar) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn-novo-usuario" 
                    onClick={() => abrirModalMovimentacao(caixinha, 'entrada')}
                    style={{ flex: 1, backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', boxShadow: 'none', padding: '0.6rem', fontSize: '0.9rem' }}
                  >
                    + Depositar
                  </button>
                  <button 
                    className="btn-novo-usuario" 
                    onClick={() => abrirModalMovimentacao(caixinha, 'saida')}
                    style={{ flex: 1, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', boxShadow: 'none', padding: '0.6rem', fontSize: '0.9rem' }}
                  >
                    - Retirar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ESTADO VAZIO DAS CAIXINHAS */}
        {!carregando && caixinhas.length === 0 && !exibirFormulario && (
          <div className="empty-table" style={{ backgroundColor: 'white', borderRadius: '12px', border: '2px dashed #cbd5e1', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
            <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>Nenhum cofre cadastrado. Comece a planejar o seu futuro financeiro agora!</p>
          </div>
        )}

        {/* =========================================
            HISTÓRICO DE MOVIMENTAÇÕES
        ========================================= */}
        <div className="recent-sales" style={{ marginTop: '3rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Histórico de Movimentações
          </h2>
          
          <div className="table-container">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Operação</th>
                  <th>Cofre / Reserva</th>
                  <th>Valor</th>
                  <th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {!carregando && historico.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table">
                      Nenhuma movimentação registrada no histórico.
                    </td>
                  </tr>
                ) : (
                  historico.map((mov) => (
                    <tr key={mov.id}>
                      <td style={{ color: '#64748b' }}>{formatarDataHora(mov.data)}</td>
                      <td>
                        {mov.tipo === 'entrada' ? (
                          <span className="badge px-badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: 'none' }}>+ Depósito</span>
                        ) : (
                          <span className="badge px-badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: 'none' }}>- Retirada</span>
                        )}
                      </td>
                      <td style={{ fontWeight: '600' }}>{mov.caixinhaNome}</td>
                      <td style={{ fontWeight: '700', color: mov.tipo === 'entrada' ? '#15803d' : '#b91c1c' }}>
                        {formatarMoeda(mov.valor)}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{mov.usuario}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================
            MODAL 1: CADASTRAR NOVA CAIXINHA
        ========================================= */}
        {exibirFormulario && (
          <div className="modal-overlay">
            <div className="modal-form-produto">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                Criar Nova Caixinha
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Qual o objetivo ou nome da reserva?</label>
                  <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} required placeholder="Ex: Férias, Reforma da Loja..." />
                </div>

                <div className="form-group">
                  <label>Onde esse dinheiro vai ficar?</label>
                  <input type="text" name="banco" value={formData.banco} onChange={handleInputChange} required placeholder="Ex: Caixinha Nubank, Tesouro Direto" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Valor Inicial (R$)</label>
                    <input type="text" name="valorAtual" value={formData.valorAtual} onChange={handleInputChange} required placeholder="Ex: 50.000,00" />
                  </div>

                  <div className="form-group">
                    <label>Meta Desejada (R$)</label>
                    <input type="text" name="meta" value={formData.meta} onChange={handleInputChange} required placeholder="Ex: 100.000,00" />
                  </div>
                </div>

                <div className="modal-acoes">
                  <button type="button" className="btn-cancelar" onClick={() => setExibirFormulario(false)}>Cancelar</button>
                  <button type="submit" className="btn-salvar">Criar Caixinha</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================
            MODAL 2: MOVIMENTAÇÃO (ADICIONAR/RETIRAR)
        ========================================= */}
        {caixinhaSelecionada && (
          <div className="modal-overlay">
            <div className="modal-form-produto" style={{ maxWidth: '400px' }}>
              <h2 style={{ 
                color: tipoMovimentacao === 'entrada' ? '#0f766e' : '#b91c1c', 
                borderBottom: 'none', 
                paddingBottom: 0 
              }}>
                {tipoMovimentacao === 'entrada' ? 'Depositar Fundos' : 'Retirar Fundos'}
              </h2>
              
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {tipoMovimentacao === 'entrada' ? 'Destino: ' : 'Origem: '} 
                <strong style={{ color: '#1e293b' }}>{caixinhaSelecionada.nome}</strong>
                <br/>
                <span style={{ fontSize: '0.8rem' }}>Saldo Atual: {formatarMoeda(caixinhaSelecionada.valorAtual)}</span>
              </p>
              
              <form onSubmit={confirmarMovimentacao}>
                <div className="form-group">
                  <label>Valor da Movimentação (R$)</label>
                  <input 
                    type="text" 
                    value={valorMovimentacao} 
                    onChange={(e) => setValorMovimentacao(e.target.value)} 
                    required 
                    placeholder="Ex: 1.500,00"
                    autoFocus
                    style={{ 
                      fontSize: '1.2rem', 
                      padding: '1rem', 
                      color: tipoMovimentacao === 'entrada' ? '#0f766e' : '#b91c1c', 
                      fontWeight: 'bold',
                      borderColor: tipoMovimentacao === 'entrada' ? '#5eead4' : '#fecaca'
                    }}
                  />
                </div>

                <div className="modal-acoes">
                  <button type="button" className="btn-cancelar" onClick={() => setCaixinhaSelecionada(null)}>Cancelar</button>
                  <button 
                    type="submit" 
                    className="btn-salvar" 
                    style={{ backgroundColor: tipoMovimentacao === 'entrada' ? '#10b981' : '#ef4444' }}
                  >
                    {tipoMovimentacao === 'entrada' ? 'Confirmar Depósito' : 'Confirmar Retirada'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default GestaoCaixa;