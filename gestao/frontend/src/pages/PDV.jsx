import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PDV.css';

export default function PDV() {
  // Estados do PDV (Iniciam 100% vazios, aguardando o banco de dados)
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  
  // Estados do Pagamento
  const [modalAberto, setModalAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');
  const [processando, setProcessando] = useState(false);

  // Estado para a mensagem de sucesso visual (substitui o alert do navegador com IP)
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Busca EXCLUSIVAMENTE os produtos reais no banco de dados Python
  useEffect(() => {
    const buscarProdutos = async () => {
      try {
        const response = await fetch('https://paidegua-api.onrender.com/api/produtos');
        if (response.ok) {
          const data = await response.json();
          
          // REGRA NOVA: Filtra e guarda no estado APENAS produtos com quantidade maior que zero
          const produtosComEstoque = data.filter(produto => produto.quantidade > 0);
          setProdutos(produtosComEstoque); 
        }
      } catch (error) {
        console.error('Erro de conexão com o banco ao buscar produtos:', error);
      }
    };
    buscarProdutos();
  }, []);

  // Filtro de pesquisa real (já vai pesquisar apenas nos que têm estoque)
  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Lógica de adição ao carrinho
  const adicionarAoCarrinho = (produto) => {
    setCarrinho((carrinhoAtual) => {
      const itemJaExiste = carrinhoAtual.find((item) => item.id === produto.id);
      
      if (itemJaExiste) {
        // Trava para não permitir adicionar no carrinho mais do que tem no estoque
        if (itemJaExiste.quantidade >= produto.quantidade) {
          alert(`Você só tem ${produto.quantidade} unidades de ${produto.nome} no estoque!`);
          return carrinhoAtual;
        }

        return carrinhoAtual.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...carrinhoAtual, { ...produto, quantidade: 1 }];
      }
    });
  };

  const removerDoCarrinho = (idProduto) => {
    setCarrinho(carrinho.filter((item) => item.id !== idProduto));
  };

  // Cálculos matemáticos reais
  const valorTotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  const troco = valorRecebido ? parseFloat(valorRecebido) - valorTotal : 0;

  // Envio da venda real para o banco de dados
  const finalizarVenda = async () => {
    if (!formaPagamento) {
      alert("Selecione uma forma de pagamento!");
      return;
    }

    setProcessando(true);

    const dadosVenda = {
      itens: carrinho,
      total: valorTotal,
      pagamento: formaPagamento,
      data: new Date().toISOString()
    };

    try {
      const response = await fetch('https://paidegua-api.onrender.com/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosVenda)
      });

      if (response.ok) {
        // Exibe a mensagem limpa, didática e sem o IP do navegador informando o método utilizado
        setMensagemSucesso(`✅ Venda concluída com sucesso no ${formaPagamento}!`);
        
        // Remove a mensagem sozinha após 4 segundos
        setTimeout(() => {
          setMensagemSucesso('');
        }, 4000);

        setCarrinho([]);
        setModalAberto(false);
        setFormaPagamento('');
        setValorRecebido('');
        
        // Atualiza a lista de produtos após a venda para bater o estoque novo
        const atualizaProdutos = await fetch('https://paidegua-api.onrender.com/api/produtos');
        if(atualizaProdutos.ok){
            const dataAtualizada = await atualizaProdutos.json();
            setProdutos(dataAtualizada.filter(p => p.quantidade > 0));
        }

      } else {
        alert("Erro retornado pelo servidor ao finalizar a venda.");
      }
    } catch (error) {
      alert("Erro de conexão com o servidor.");
    } finally {
      setProcessando(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="pdv-container">
      {/* AVISO DE SUCESSO FLUTUANTE (Substitui o alerta padrão feio com IP) */}
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
          fontSize: '1.25rem', // Fonte aumentada para facilitar a leitura rápida
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          border: '2px solid #14b8a6'
        }}>
          {mensagemSucesso}
        </div>
      )}

      <header className="pdv-header">
        <div className="pdv-logo">
          <h2>CAIXA ABERTO</h2>
          <p>Pai D'Égua Gestão</p>
        </div>
        <Link to="/dashboard" className="btn-voltar">🏠 Voltar ao Dashboard</Link>
      </header>

      <main className="pdv-main">
        {/* LADO ESQUERDO: LISTA DE PRODUTOS REAIS */}
        <section className="pdv-produtos">
          <div className="busca-container">
            <input
              type="text"
              placeholder="🔍 Buscar produto..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="input-busca"
            />
          </div>

          <div className="produtos-grid">
            {produtosFiltrados.length > 0 ? (
              produtosFiltrados.map((produto) => (
                <div 
                  key={produto.id} 
                  className="produto-card"
                  onClick={() => adicionarAoCarrinho(produto)}
                >
                  <span className="produto-nome">{produto.nome}</span>
                  <span className="produto-preco">{formatarMoeda(produto.preco)}</span>
                  <span className="produto-estoque">Estoque: {produto.quantidade}</span>
                </div>
              ))
            ) : (
              <p className="msg-vazio">Nenhum produto em estoque ou encontrado.</p>
            )}
          </div>
        </section>

        {/* LADO DIREITO: CARRINHO */}
        <section className="pdv-carrinho-area">
          <div className="carrinho-lista">
            <h3>🛒 Cupom Atual</h3>
            {carrinho.length === 0 ? (
              <p className="carrinho-vazio">Adicione produtos para iniciar a venda.</p>
            ) : (
              <ul className="lista-itens">
                {carrinho.map((item) => (
                  <li key={item.id} className="carrinho-item">
                    <div className="item-info">
                      <span className="item-nome">{item.nome}</span>
                      <span className="item-detalhe">
                        {item.quantidade}x {formatarMoeda(item.preco)}
                      </span>
                    </div>
                    <div className="item-acoes">
                      <span className="item-subtotal">
                        {formatarMoeda(item.quantidade * item.preco)}
                      </span>
                      <button 
                        onClick={() => removerDoCarrinho(item.id)}
                        className="btn-remover"
                        title="Remover item"
                      >
                        ❌
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="carrinho-resumo">
            <div className="total-display">
              <span>TOTAL:</span>
              <span className="valor-gigante">{formatarMoeda(valorTotal)}</span>
            </div>
            
            <button 
              className="btn-cobrar"
              disabled={carrinho.length === 0}
              onClick={() => setModalAberto(true)}
            >
              💵 COBRAR
            </button>
          </div>
        </section>
      </main>

      {/* MODAL DE PAGAMENTO */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-pagamento">
            <h2>Finalizar Venda</h2>
            <div className="modal-total">{formatarMoeda(valorTotal)}</div>
            
            <div className="opcoes-pagamento">
              <button 
                className={`btn-pgto ${formaPagamento === 'Pix' ? 'ativo' : ''}`}
                onClick={() => setFormaPagamento('Pix')}
              >💠 Pix</button>
              
              <button 
                className={`btn-pgto ${formaPagamento === 'Dinheiro' ? 'ativo' : ''}`}
                onClick={() => setFormaPagamento('Dinheiro')}
              >💵 Dinheiro</button>
              
              <button 
                className={`btn-pgto ${formaPagamento === 'Débito' ? 'ativo' : ''}`}
                onClick={() => setFormaPagamento('Débito')}
              >💳 Débito</button>
              
              <button 
                className={`btn-pgto ${formaPagamento === 'Crédito' ? 'ativo' : ''}`}
                onClick={() => setFormaPagamento('Crédito')}
              >💳 Crédito</button>
            </div>

            {formaPagamento === 'Dinheiro' && (
              <div className="area-troco">
                <label>Valor Recebido (R$):</label>
                <input 
                  type="number" 
                  min={valorTotal}
                  step="0.01"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                />
                {valorRecebido && troco >= 0 && (
                  <div className="troco-display">
                    Troco: <strong>{formatarMoeda(troco)}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="modal-acoes">
              <button className="btn-cancelar" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button 
                className="btn-confirmar" 
                onClick={finalizarVenda}
                disabled={processando || !formaPagamento || (formaPagamento === 'Dinheiro' && (parseFloat(valorRecebido) < valorTotal || !valorRecebido))}
              >
                {processando ? 'Registrando...' : 'Confirmar Venda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}