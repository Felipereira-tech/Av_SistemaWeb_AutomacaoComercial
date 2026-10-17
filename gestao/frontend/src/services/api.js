import axios from 'axios';

// Configuração central da API
const api = axios.create({
  // Endereço onde o Python (backend) está rodando no Render
  baseURL: 'https://paidegua-api.onrender.com/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;