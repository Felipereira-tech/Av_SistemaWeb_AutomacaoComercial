import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './EstoqueIngredientes.css';

export default function EstoqueIngredientes() {
  const navigate = useNavigate();

  // Começa vazio, sem dados fictícios
  const [ingredientes, setIngredientes] = useState([]);

  // Estados do formulário
  const [novoNome, setNovoNome] = useState('');
  const [novaQtd, setNovaQtd] = useState('');
  const [novoPrecoTotal, setNovoPrecoTotal] = useState('');
  const [novaUnidade, setNovaUnidade] = useState('unidades');

  // Função para cadastrar o item no estoque
  const adicionarIngrediente = (e) => {
    e.preventDefault();
    if (!novoNome || !novaQtd || !novoPrecoTotal) return;

    const item = {
      id: Date.now(),
      nome: novoNome,
      quantidade: parseInt(novaQtd, 10),
      precoTotal: parseFloat(novoPrecoTotal),
      unidadeMedida: novaUnidade,
    };

    setIngredientes([...ingredientes, item]);
    
    // Limpa o formulário após cadastrar
    setNovoNome('');
    setNovaQtd('');
    setNovoPrecoTotal('');
  };

  // Função para dar entrada (+) ou saída (-) fracionada
  const alterarQuantidade = (id, tipo) => {
    setIngredientes(ingredientes.map(item => {
      if (item.id === id) {
        let novaQuantidade = tipo === 'adicionar' ? item.quantidade + 1 : item.quantidade - 1;
        if (novaQuantidade < 0) novaQuantidade = 0; // Não permite estoque negativo
        return { ...item, quantidade: novaQuantidade };
      }
      return item;
    }));
  };

  // Função para deletar o item da lista
  const excluirIngrediente = (id) => {
    setIngredientes(ingredientes.filter(item => item.id !== id));
  };

  const handleLogout = () => {
    navigate('/login');
  };

  // Calcula o valor total já gasto com todos os itens do estoque
  const totalGastoGeral = ingredientes.reduce((acumulador, item) => acumulador + item.precoTotal, 0);

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
          <Link to="/estoque" className="nav-item active">Estoque</Link>
          <Link to="/financeiro" className="nav-item">Financeiro</Link>
          <Link to="/gestaocaixa" className="nav-item">Gestão de Caixa</Link>
          <Link to="/usuarios" className="nav-item">Usuários</Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        <header className="content-header estoque-header">
          <div>
            <h1>Gestão de Estoque e Ingredientes</h1>
          </div>
          <div className="box-total-investido">
            <span>Total Investido em Estoque: </span>
            <strong>R$ {totalGastoGeral.toFixed(2)}</strong>
          </div>
        </header>

        {/* FORMULÁRIO DE CADASTRO DE COMPRA */}
        <section className="formulario-cadastro">
          <h3>Cadastrar Nova Compra / Produto</h3>
          <form onSubmit={adicionarIngrediente}>
            <div className="input-group">
              <label>Nome do Produto/Ingrediente:</label>
              <input 
                type="text" 
                placeholder="Ex: Caixa de Leite Condensado" 
                value={novoNome} 
                onChange={e => setNovoNome(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label>Quantidade Comprada:</label>
              <input 
                type="number" 
                placeholder="Ex: 30" 
                value={novaQtd} 
                onChange={e => setNovaQtd(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Valor Total Pago (R$):</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 30.00" 
                value={novoPrecoTotal} 
                onChange={e => setNovoPrecoTotal(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Unidade de Medida:</label>
              <select 
                value={novaUnidade} 
                onChange={e => setNovaUnidade(e.target.value)}
              >
                <option value="unidades">Unidades</option>
                <option value="kg">Quilos (kg)</option>
                <option value="gramas">Gramas (g)</option>
                <option value="litros">Litros (L)</option>
                <option value="pct">Pacotes</option>
              </select>
            </div>

            <button type="submit" className="btn-cadastrar-estoque">Cadastrar no Estoque</button>
          </form>
        </section>

        {/* TABELA DE ESTOQUE */}
        <section className="tabela-estoque-container">
          <h3>Itens em Estoque</h3>
          <div className="table-responsive">
            <table className="tabela-estoque">
              <thead>
                <tr>
                  <th>PRODUTO</th>
                  <th>QUANTIDADE ATUAL</th>
                  <th>CUSTO TOTAL PAGO</th>
                  <th>VALOR UNITÁRIO / FRACIONADO</th>
                  <th style={{ textAlign: 'center' }}>ENTRADA / SAÍDA</th>
                  <th style={{ textAlign: 'center' }}>REMOVER</th>
                </tr>
              </thead>
              <tbody>
                {ingredientes.map(item => {
                  // Calcula o valor fracionado (Estimativa de cada unidade)
                  const valorUnitario = item.quantidade > 0 ? (item.precoTotal / item.quantidade) : 0;
                  
                  return (
                    <tr key={item.id}>
                      <td className="item-nome">{item.nome}</td>
                      <td>{item.quantidade} {item.unidadeMedida}</td>
                      <td className="item-custo">R$ {item.precoTotal.toFixed(2)}</td>
                      <td className="item-fracionado">R$ {valorUnitario.toFixed(2)} <small>/cada</small></td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" className="btn-qtd btn-menos" onClick={() => alterarQuantidade(item.id, 'remover')} title="Retirar 1">-</button>
                        <button type="button" className="btn-qtd btn-mais" onClick={() => alterarQuantidade(item.id, 'adicionar')} title="Adicionar 1">+</button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" className="btn-remover-item" onClick={() => excluirIngrediente(item.id)} title="Excluir Produto">Excluir</button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Mensagem caso o estoque esteja vazio */}
                {ingredientes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-message">Nenhum produto cadastrado no momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}