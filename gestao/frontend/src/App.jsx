import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importação de todas as telas do projeto
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PDV from './pages/PDV';
import Produtos from './pages/Produtos';
import Estoque from './pages/EstoqueIngredientes'; 
import Financeiro from './pages/Financeiro';
import GestaoCaixa from './pages/GestaoCaixa';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rota inicial joga direto para o Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas / Principais (TUDO EM MINÚSCULO) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pdv" element={<PDV />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/gestaocaixa" element={<GestaoCaixa />} />
        <Route path="/usuarios" element={<Usuarios />} />

        {/* Rota coringa caso digitem algo errado (joga para o login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}