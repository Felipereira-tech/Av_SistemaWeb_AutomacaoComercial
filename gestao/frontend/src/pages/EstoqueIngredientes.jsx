import React, { useState } from 'react';
import './EstoqueIngredientes.css';


export default function GerenciamentoEstoque() {
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
      quantidade: parseInt(novaQtd),
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

  // Calcula o valor total já gasto com todos os itens do estoque
  const totalGastoGeral = ingredientes.reduce((acumulador, item) => acumulador + item.precoTotal, 0);

  return (
    <div className="estoque-container">
      <header>
        <h1>Gestão de Estoque e Ingredientes</h1>
        <div>
          <span>Total Investido em Estoque: </span>
          <strong>R$ {totalGastoGeral.toFixed(2)}</strong>
        </div>
      </header>

      {/* FORMULÁRIO DE CADASTRO DE COMPRA */}
      <section className="formulario-cadastro">
        <h3>Cadastrar Nova Compra / Produto</h3>
        <form onSubmit={adicionarIngrediente}>
          <div>
            <label>Nome do Produto/Ingrediente:</label>
            <input 
              type="text" 
              placeholder="Ex: Caixa de Leite Condensado" 
              value={novoNome} 
              onChange={e => setNovoNome(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label>Quantidade Comprada:</label>
            <input 
              type="number" 
              placeholder="Ex: 30" 
              value={novaQtd} 
              onChange={e => setNovaQtd(e.target.value)}
              required
            />
          </div>

          <div>
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

          <div>
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

          <button type="submit">Cadastrar no Estoque</button>
        </form>
      </section>

      {/* TABELA DE ESTOQUE */}
      <section className="tabela-estoque">
        <h3>Itens em Estoque</h3>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade Atual</th>
              <th>Custo Total Pago</th>
              <th>Valor Unitário / Fracionado</th>
              <th>Entrada / Saída</th>
              <th>Remover</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map(item => {
              // Calcula o valor fracionado (Estimativa de cada unidade)
              const valorUnitario = item.quantidade > 0 ? (item.precoTotal / item.quantidade) : 0;
              
              return (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>{item.quantidade} {item.unidadeMedida}</td>
                  <td>R$ {item.precoTotal.toFixed(2)}</td>
                  <td>R$ {valorUnitario.toFixed(2)} /cada</td>
                  <td>
                    <button onClick={() => alterarQuantidade(item.id, 'remover')} title="Retirar 1">-</button>
                    <button onClick={() => alterarQuantidade(item.id, 'adicionar')} title="Adicionar 1">+</button>
                  </td>
                  <td>
                    <button onClick={() => excluirIngrediente(item.id)} title="Excluir Produto">Excluir</button>
                  </td>
                </tr>
              );
            })}
            
            {/* Mensagem caso o estoque esteja vazio */}
            {ingredientes.length === 0 && (
              <tr>
                <td colSpan="6">Nenhum produto cadastrado no momento.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}