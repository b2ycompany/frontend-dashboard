// frontend-dashboard/app/page.tsx
"use client";

import { db } from '../utils/firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot, DocumentData } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';

// Importa o componente de gráfico (necessário para os gráficos)
import DashboardChart from '../components/DashboardChart'; 

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

// Componente de Card Atualizado para o Tema Dark
const Card: React.FC<{ title: string, value: number, color: string }> = ({ title, value, color }) => (
  // Usando bg-gray-800 e borda neon (cyan)
  <div className={`bg-gray-800/70 p-6 rounded-lg shadow-lg border-l-4 border-cyan-500 transition duration-300 hover:shadow-cyan-500/30`}>
    <p className="text-sm font-medium text-gray-400">{title}</p>
    <p className="text-4xl font-extrabold mt-2 text-white">
        {/* Adiciona efeito de contorno/sombra para a fonte */}
        <span className="text-shadow-md shadow-cyan-400">{value}</span>
    </p>
  </div>
);


export default function Home() {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [filterType, setFilterType] = useState<string>('TODOS'); 
  const [selectedClient, setSelectedClient] = useState<string>(ALL_CLIENTS); 

  useEffect(() => {
    if (!db) {
        console.error("ERRO CRÍTICO: Firebase DB não inicializado.");
        return;
    }

    // CORREÇÃO: Removendo o limite de 50 para trazer mais dados
    const q = query(collection(db, "anomalias"), orderBy("timestamp", "desc")); 
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const anomaliasData: Anomalia[] = [];
      querySnapshot.forEach((doc) => {
        anomaliasData.push(doc.data() as Anomalia);
      });
      setAnomalias(anomaliasData);
      
      console.log(`DEBUG: Sucesso! Documentos lidos do Firestore: ${anomaliasData.length}`);
    }, (error) => {
        console.error("DEBUG: ERRO na Leitura do Firestore:", error.code, error.message);
    });

    return () => unsubscribe();
  }, []);

  // 1. EXTRAI LISTA ÚNICA DE CLIENTES PARA O SELETOR
  const clients = useMemo(() => {
    // CORREÇÃO DO ERRO: Filtra documentos onde 'client_id' é null, undefined ou string vazia
    const clientList = anomalias
        .map(a => a.client_id)
        .filter((id): id is string => id !== undefined && id !== null && id.length > 0); 
    
    // Retorna a lista única, garantindo que todos os elementos são strings
    return [ALL_CLIENTS, ...Array.from(new Set(clientList))];
  }, [anomalias]);
  
  // 2. FILTRO BASEADO EM CLIENTE E TIPO
  const filteredAnomalias = anomalias.filter(a => 
    (selectedClient === ALL_CLIENTS || a.client_id === selectedClient) &&
    (filterType === 'TODOS' || a.data_type === filterType)
  );

  // 3. AGRUPA DADOS FILTRADOS POR MÉTRICA PARA OS GRÁFICOS
  const chartDataGrouped = useMemo(() => {
    const groups: { [key: string]: Anomalia[] } = {};
    // Garantimos que só plotamos se houver dados filtrados
    if (filteredAnomalias.length > 0) {
        filteredAnomalias.forEach(a => {
            // Filtra o documento se a métrica estiver ausente
            if (!a.metricName) return; 
            
            const key = a.metricName;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(a);
        });
    }
    return groups;
  }, [filteredAnomalias]);


  const viewAutomationLog = (logID: string) => {
    alert(`Visualizando o log de automação para a execução: ${logID}`);
  };

  return (
    // TEMA DARK: Fundo escuro
    <div className="min-h-screen bg-gray-950 p-8 text-gray-100"> 
      <h1 className="text-4xl font-extrabold text-cyan-400 mb-8 tracking-wider">
        Painel de Monitoramento Multicliente (AIOps)
      </h1>
      
      {/* SEÇÃO DE FILTROS */}
      <div className="bg-gray-900 p-4 rounded-lg shadow-xl shadow-gray-900/50 mb-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-200">Filtros Operacionais</h3>
        
        {/* SELETOR DE CLIENTE */}
        <div className="mb-4">
          <label htmlFor="client-selector" className="block text-sm font-medium text-cyan-400 mb-1">
            Selecionar Cliente:
          </label>
          <select
            id="client-selector"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            // Estilo Dark para Select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-gray-100 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
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
              className={`px-3 py-1 rounded-full text-sm font-medium transition duration-150 border 
                ${filterType === type 
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/40' // Ativo
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' // Inativo
                }`}
            >
              {type.replace('_', ' ')} ({anomalias.filter(a => a.data_type === type && (selectedClient === ALL_CLIENTS || a.client_id === selectedClient)).length})
            </button>
          ))}
        </div>
      </div>
      {/* FIM SEÇÃO DE FILTROS */}

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card title="Total Anomalias Filtradas" value={filteredAnomalias.length} color="blue" />
        <Card title="Pendentes de Correção" value={filteredAnomalias.filter(a => a.status === 'PENDENTE').length} color="red" />
        <Card title="Corrigidas (Robô)" value={filteredAnomalias.filter(a => a.status === 'CORRIGIDO').length} color="green" />
      </div>

      {/* SEÇÃO DE GRÁFICOS (Gráficos são gerados por cada métrica única) */}
      <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Análise Gráfica de Performance</h2>
      
      {Object.keys(chartDataGrouped).length === 0 ? (
        <div className="p-6 bg-gray-800/70 rounded-lg shadow-lg text-center text-gray-400 mb-8 border border-gray-700">
          Nenhuma anomalia filtrada para plotar os gráficos.
        </div>
      ) : (
        Object.keys(chartDataGrouped).map(metricKey => (
          // ATIVAÇÃO DOS GRÁFICOS
          <DashboardChart
            key={metricKey}
            title={metricKey.split('_').join(' ')}
            data={chartDataGrouped[metricKey]}
          />
        ))
      )}
      {/* FIM SEÇÃO DE GRÁFICOS */}

      <h2 className="text-2xl font-semibold text-gray-200 mt-8 mb-4 border-b border-gray-700 pb-2">Anomalias Filtradas ({filteredAnomalias.length})</h2>
      
      {/* TABELA DE ANOMALIAS */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800/70 shadow-xl rounded-lg border border-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Cliente</th> 
              <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Tipo</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Timestamp (BR)</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Métrica</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Causa Raiz (IA)</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Status Robô</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-cyan-400">Log</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnomalias.map((a, index) => (
              <tr key={a.logID || index} className="border-b border-gray-700 hover:bg-gray-700/50 transition duration-150">
                <td className="py-3 px-4 font-bold text-gray-200">{a.client_id?.replace('_', ' ') || 'N/A'}</td> 
                <td className="py-3 px-4 text-gray-300">{a.data_type?.split('_').join(' ') || 'N/A'}</td>
                <td className="py-3 px-4 text-gray-300">
                  {/* TIMESTAMP CORRIGIDO PARA BRASÍLIA */}
                  {new Date(a.timestamp).toLocaleString('pt-BR', { 
                    timeZone: 'America/Sao_Paulo', 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </td>
                <td className="py-3 px-4 text-gray-300">{a.metricName} ({a.value.toFixed(2)})</td>
                <td className="py-3 px-4 text-gray-300">{a.causaRaiz}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                    ${a.status === 'CORRIGIDO' ? 'bg-green-600 text-white' : 
                      a.status === 'PENDENTE' ? 'bg-yellow-600 text-gray-900' : 'bg-red-600 text-white'
                    } shadow-md`}>
                    {a.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button 
                    onClick={() => viewAutomationLog(a.logID)} 
                    className="text-cyan-400 hover:text-cyan-300 font-medium disabled:opacity-50"
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