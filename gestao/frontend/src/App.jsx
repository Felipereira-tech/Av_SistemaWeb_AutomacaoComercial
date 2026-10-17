import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importação de todas las telas do projeto
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PDV from './pages/PDV';
import Produtos from './pages/Produtos';
import Financeiro from './pages/Financeiro';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rota inicial joga direto para o Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas / Principais */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pdv" element={<PDV />} />
        <Route path="/Produtos" element={<Produtos />} />
        <Route path="/Financeiro" element={<Financeiro />} />
        <Route path="/usuarios" element={<Usuarios />} />

        {/* Rota coringa caso digitem algo errado (joga para o login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}