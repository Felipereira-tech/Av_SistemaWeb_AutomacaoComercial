import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Financeiro.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Financeiro() {
  const navigate = useNavigate();

  // Estados do Financeiro
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Filtros de Data (Inicia com o mês atual)
  const dataHoje = new Date().toISOString().split('T')[0];
  const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(dataHoje);
  
  // NOVOS ESTADOS: Filtro de Pagamento e Agrupamento do Gráfico
  const [filtroPagamento, setFiltroPagamento] = useState('Todos');
  const [agrupamentoGrafico, setAgrupamentoGrafico] = useState('dia'); // 'dia' ou 'mes'

  // Busca os dados financeiros no backend (URL Dinâmica)
  const buscarFinanceiro = async () => {
    setCarregando(true);
    try {
      const url = `https://paidegua-api.onrender.com/api/financeiro?inicio=${dataInicio}&fim=${dataFim}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setVendas(data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
    } finally {
      setCarregando(false);
    }
  };

  // Atualiza os dados sempre que as datas mudarem
  useEffect(() => {
    buscarFinanceiro();
  }, [dataInicio, dataFim]);

  const handleLogout = () => {
    navigate('/login');
  };

  // ----------------------------------------------------
  // APLICAÇÃO DO FILTRO DE PAGAMENTO
  // ----------------------------------------------------
  const vendasFiltradas = vendas.filter((v) => {
    if (filtroPagamento === 'Todos') return true;
    
    const tipo = v.pagamento.toLowerCase();
    if (filtroPagamento === 'Pix') return tipo === 'pix';
    if (filtroPagamento === 'Dinheiro') return tipo === 'dinheiro';
    if (filtroPagamento === 'Débito') return tipo === 'débito' || tipo === 'debito';
    if (filtroPagamento === 'Crédito') return tipo === 'crédito' || tipo === 'credito';
    
    return true;
  });

  // ----------------------------------------------------
  // CÁLCULOS E INTELIGÊNCIA DE DADOS (Usando as filtradas)
  // ----------------------------------------------------
  const totalGeral = vendasFiltradas.reduce((acc, venda) => acc + venda.total, 0);
  const totalPix = vendasFiltradas.filter(v => v.pagamento.toLowerCase() === 'pix').reduce((acc, v) => acc + v.total, 0);
  const totalDinheiro = vendasFiltradas.filter(v => v.pagamento.toLowerCase() === 'dinheiro').reduce((acc, v) => acc + v.total, 0);
  const totalCartao = vendasFiltradas.filter(v => 
    v.pagamento.toLowerCase() === 'débito' || 
    v.pagamento.toLowerCase() === 'debito' || 
    v.pagamento.toLowerCase() === 'crédito' || 
    v.pagamento.toLowerCase() === 'credito'
  ).reduce((acc, v) => acc + v.total, 0);

  // Formatar Moeda e Data
  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // ----------------------------------------------------
  // DADOS PARA OS GRÁFICOS (RECHARTS)
  // ----------------------------------------------------
  // 1. Gráfico de Pizza (Meios de Pagamento)
  const dadosPizza = [
    { name: 'Pix', value: totalPix, color: '#10b981' },
    { name: 'Dinheiro', value: totalDinheiro, color: '#f59e0b' },
    { name: 'Cartões', value: totalCartao, color: '#3b82f6' }
  ].filter(item => item.value > 0); 

  // 2. Gráfico de Barras (Diário ou Mensal/Anual)
  const faturamentoAgrupado = vendasFiltradas.reduce((acc, venda) => {
    const dataObj = new Date(venda.data);
    let chave = '';

    if (agrupamentoGrafico === 'dia') {
      // Ex: 15/08
      chave = `${dataObj.getDate().toString().padStart(2, '0')}/${(dataObj.getMonth() + 1).toString().padStart(2, '0')}`;
    } else {
      // Ex: Ago/2026
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      chave = `${meses[dataObj.getMonth()]}/${dataObj.getFullYear()}`;
    }

    if (!acc[chave]) acc[chave] = 0;
    acc[chave] += venda.total;
    return acc;
  }, {});

  const dadosBarras = Object.keys(faturamentoAgrupado).map(chave => ({
    periodo: chave,
    Total: faturamentoAgrupado[chave]
  }));

  // ----------------------------------------------------
  // EXPORTAR EXCEL
  // ----------------------------------------------------
  const exportarParaExcel = () => {
    if (vendas.length === 0) {
      alert("Não há dados para exportar neste período.");
      return;
    }
    window.open('https://paidegua-api.onrender.com/api/financeiro/exportar', '_blank');
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
          <Link to="/financeiro" className="nav-item active">Financeiro</Link>
          <Link to="/usuarios" className="nav-item">Usuários</Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        <header className="content-header financeiro-header">
          <div>
            <h1>Controle Financeiro</h1>
            <p>Acompanhe suas receitas e filtre por período ou pagamento.</p>
          </div>
          <button onClick={exportarParaExcel} className="btn-exportar">
            Baixar Relatório (Excel)
          </button>
        </header>

        {/* BARRA DE FILTROS APRIMORADA */}
        <div className="filtro-container" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="filtro-grupo">
            <label>Data Inicial:</label>
            <input 
              type="date" 
              value={dataInicio} 
              onChange={(e) => setDataInicio(e.target.value)}
              className="input-data"
            />
          </div>
          <div className="filtro-grupo">
            <label>Data Final:</label>
            <input 
              type="date" 
              value={dataFim} 
              onChange={(e) => setDataFim(e.target.value)}
              className="input-data"
            />
          </div>
          
          {/* NOVO FILTRO DE PAGAMENTO */}
          <div className="filtro-grupo">
            <label>Forma de Pagamento:</label>
            <select 
              value={filtroPagamento} 
              onChange={(e) => setFiltroPagamento(e.target.value)}
              className="input-data"
              style={{ minWidth: '150px', cursor: 'pointer' }}
            >
              <option value="Todos">Todos os meios</option>
              <option value="Pix">Apenas Pix</option>
              <option value="Dinheiro">Apenas Dinheiro</option>
              <option value="Débito">Apenas Débito</option>
              <option value="Crédito">Apenas Crédito</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <p className="loading-message">Carregando movimentações...</p>
        ) : (
          <>
            {/* CARDS DE RESUMO FINANCEIRO */}
            <div className="cards-grid">
              <div className="card">
                <h3>Total Filtrado</h3>
                <p className="card-value cash">{formatarMoeda(totalGeral)}</p>
              </div>
              <div className="card card-pix">
                <h3>Total em Pix</h3>
                <p className="card-value">{formatarMoeda(totalPix)}</p>
              </div>
              <div className="card card-dinheiro">
                <h3>Total em Dinheiro</h3>
                <p className="card-value">{formatarMoeda(totalDinheiro)}</p>
              </div>
              <div className="card card-cartao">
                <h3>Total em Cartões</h3>
                <p className="card-value">{formatarMoeda(totalCartao)}</p>
              </div>
            </div>

            {/* SEÇÃO DE GRÁFICOS */}
            {vendasFiltradas.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* Gráfico de Barras - Dinâmico (Diário/Mensal) */}
                <div style={{ flex: '1 1 500px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#0f172a', fontSize: '1.1rem', margin: 0 }}>Evolução do Faturamento</h3>
                    
                    {/* SELETOR DE AGRUPAMENTO (DIA OU MÊS) */}
                    <select 
                      value={agrupamentoGrafico} 
                      onChange={(e) => setAgrupamentoGrafico(e.target.value)}
                      style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      <option value="dia">Visão Diária</option>
                      <option value="mes">Visão Mensal / Anual</option>
                    </select>
                  </div>
                  
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <BarChart data={dadosBarras}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="periodo" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => formatarMoeda(value)} />
                        <Bar dataKey="Total" fill="#0f766e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico de Pizza - Meios de Pagamento */}
                <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '1.1rem' }}>Receita por Pagamento</h3>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      {dadosPizza.length > 0 ? (
                        <PieChart>
                          <Pie
                            data={dadosPizza}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {dadosPizza.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatarMoeda(value)} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '4rem' }}>
                          Nenhum dado para o filtro selecionado.
                        </p>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {/* TABELA DE MOVIMENTAÇÕES */}
            <section className="recent-sales">
              <h2>Histórico de Movimentações</h2>
              <div className="table-container">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Data e Hora</th>
                      <th>ID da Venda</th>
                      <th>Forma de Pagamento</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendasFiltradas.length > 0 ? (
                      vendasFiltradas.map((venda) => (
                        <tr key={venda.id}>
                          <td style={{ color: '#475569', fontWeight: '500' }}>{formatarData(venda.data)}</td>
                          <td style={{ color: '#94a3b8', fontWeight: 'bold' }}>#{venda.id}</td>
                          <td>
                            <span className={`badge ${venda.pagamento.toLowerCase()}`}>
                              {venda.pagamento}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatarMoeda(venda.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="empty-table">
                          Nenhuma movimentação encontrada para estes filtros.
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