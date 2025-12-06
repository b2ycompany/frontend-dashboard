// frontend-dashboard/app/page.tsx
"use client";

import { db } from '../utils/firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot, DocumentData } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';

// Interface ajustada para incluir client_id
interface Anomalia extends DocumentData {
  timestamp: string;
  metricName: string;
  value: number;
  host: string;
  causaRaiz: string;
  status: 'PENDENTE' | 'CORRIGIDO' | 'FALHA_CORRECAO';
  logID: string; 
  data_type: string;
  client_id: string; // CAMPO CRÍTICO PARA O FILTRO
}

const ALL_CLIENTS = 'TODOS_CLIENTES';
const FILTER_TYPES = ['TODOS', 'FLUXO_ONBOARDING', 'APLICACAO_AUTH', 'INFRA_TRANSACAO', 'FLUXO_SINISTRO', 'INFRA_DB_LOCKS'];

// Componente simples de Card para KPIs
const Card: React.FC<{ title: string, value: number, color: string }> = ({ title, value, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow-lg border-t-4 border-${color}-500`}>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="text-3xl font-bold mt-1 text-gray-800">{value}</p>
  </div>
);


export default function Home() {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [filterType, setFilterType] = useState<string>('TODOS'); 
  const [selectedClient, setSelectedClient] = useState<string>(ALL_CLIENTS); 

  useEffect(() => {
    // LOG 1: Verificar se a inicialização do Firebase foi bem-sucedida (checa se o objeto DB existe)
    console.log("DEBUG: Tentando inicializar listener do Firestore...");
    if (db) {
        // LOG 2: Verificar se as variáveis públicas foram carregadas (mostra apenas um hash da API Key)
        console.log(`DEBUG: Chave API carregada (hash): ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 5) + '...' : 'FALHA'}`);
    } else {
        console.error("DEBUG: Falha na inicialização do DB (Variáveis de ambiente ausentes ou arquivo firebaseConfig.ts com erro).");
        return;
    }


    // Escuta em tempo real a coleção 'anomalias' (limite de 50 para ver vários cenários)
    const q = query(collection(db, "anomalias"), orderBy("timestamp", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const anomaliasData: Anomalia[] = [];
      querySnapshot.forEach((doc) => {
        anomaliasData.push(doc.data() as Anomalia);
      });
      setAnomalias(anomaliasData);
      
      // LOG 3: Mostrar o número de documentos lidos do Firestore
      console.log(`DEBUG: Sucesso! Documentos lidos do Firestore: ${anomaliasData.length}`);
    }, (error) => {
        // LOG 4: Capturar qualquer erro de permissão ou conexão do Firestore
        console.error("DEBUG: ERRO na Leitura do Firestore:", error.code, error.message);
    });

    return () => unsubscribe();
  }, []);

  // 1. EXTRAI LISTA ÚNICA DE CLIENTES PARA O SELETOR
  const clients = useMemo(() => {
    const clientList = anomalias.map(a => a.client_id);
    return [ALL_CLIENTS, ...Array.from(new Set(clientList))];
  }, [anomalias]);
  
  // 2. FILTRO BASEADO EM CLIENTE E TIPO
  const filteredAnomalias = anomalias.filter(a => 
    (selectedClient === ALL_CLIENTS || a.client_id === selectedClient) &&
    (filterType === 'TODOS' || a.data_type === filterType)
  );

  const viewAutomationLog = (logID: string) => {
    alert(`Visualizando o log de automação para a execução: ${logID}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">
        Painel de Monitoramento Multicliente (AIOps)
      </h1>
      
      {/* SEÇÃO DE FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Filtros Ativos</h3>
        
        {/* SELETOR DE CLIENTE */}
        <div className="mb-4">
          <label htmlFor="client-selector" className="block text-sm font-medium text-gray-700 mb-1">
            Selecionar Cliente:
          </label>
          <select
            id="client-selector"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {clients.map(client => (
              <option key={client} value={client}>
                {client.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* BOTÕES DE FILTRO POR TIPO */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition duration-150 
                ${filterType === type 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
            >
              {type.replace('_', ' ')} ({anomalias.filter(a => a.data_type === type && (selectedClient === ALL_CLIENTS || a.client_id === selectedClient)).length})
            </button>
          ))}
        </div>
      </div>
      {/* FIM SEÇÃO DE FILTROS */}

      {/* Cards de KPIs (Adaptados para o filtro atual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card title="Total Anomalias Filtradas" value={filteredAnomalias.length} color="blue" />
        <Card title="Pendentes de Correção" value={filteredAnomalias.filter(a => a.status === 'PENDENTE').length} color="red" />
        <Card title="Corrigidas (Robô)" value={filteredAnomalias.filter(a => a.status === 'CORRIGIDO').length} color="green" />
      </div>

      {/* Placeholder de Gráficos - Você deve integrar o DashboardChart aqui */}
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Análise Gráfica de Performance (Placeholder)</h2>
      <div className="p-6 bg-white rounded-lg shadow-lg text-center text-gray-500 mb-8 border-dashed border-2">
          Para exibir gráficos, integre o componente DashboardChart.tsx aqui.
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Anomalias Filtradas ({filteredAnomalias.length})</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 text-left">Cliente</th> 
              <th className="py-2 px-4 text-left">Tipo</th>
              <th className="py-2 px-4 text-left">Timestamp</th>
              <th className="py-2 px-4 text-left">Métrica</th>
              <th className="py-2 px-4 text-left">Causa Raiz (IA)</th>
              <th className="py-2 px-4 text-left">Status Robô</th>
              <th className="py-2 px-4 text-left">Log</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnomalias.map((a, index) => (
              <tr key={a.logID || index} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-bold text-gray-900">{a.client_id.replace('_', ' ')}</td> 
                <td className="py-2 px-4">{a.data_type.split('_').join(' ')}</td>
                <td className="py-2 px-4">{new Date(a.timestamp).toLocaleTimeString()}</td>
                <td className="py-2 px-4">{a.metricName} ({a.value.toFixed(2)})</td>
                <td className="py-2 px-4">{a.causaRaiz}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                    ${a.status === 'CORRIGIDO' ? 'bg-green-100 text-green-800' : 
                      a.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {a.status}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <button 
                    onClick={() => viewAutomationLog(a.logID)} 
                    className="text-blue-500 hover:text-blue-700 font-medium disabled:opacity-50"
                    disabled={!a.logID}
                  >
                    Ver Log
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}