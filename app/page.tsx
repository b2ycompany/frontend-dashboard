// frontend-dashboard/app/page.tsx
"use client"; // Esta diretiva é OBRIGATÓRIA para usar hooks do React (useState, useEffect)

import { db } from '../utils/firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot, DocumentData } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import React from 'react';

// Interface para os dados de anomalia (deve corresponder ao que a IA salva)
interface Anomalia extends DocumentData {
  timestamp: string;
  metricName: string;
  value: number;
  host: string;
  causaRaiz: string;
  status: 'PENDENTE' | 'CORRIGIDO' | 'FALHA_CORRECAO';
  logID: string; 
}

export default function Home() {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);

  useEffect(() => {
    // 1. Cria a consulta: Coleção 'anomalias', ordenada por timestamp, as 20 mais recentes
    const q = query(collection(db, "anomalias"), orderBy("timestamp", "desc"), limit(20));
    
    // 2. Listener em tempo real (Real-time update)
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const anomaliasData: Anomalia[] = [];
      querySnapshot.forEach((doc) => {
        anomaliasData.push(doc.data() as Anomalia);
      });
      setAnomalias(anomaliasData);
    });

    // Limpa o listener ao desmontar o componente
    return () => unsubscribe();
  }, []);

  // Função para buscar o log completo da automação
  const viewAutomationLog = (logID: string) => {
    alert(`Visualizando o log de automação para a execução: ${logID}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* O componente Head foi substituído pelos metadados no layout.tsx no App Router */}
      <h1 className="text-4xl font-bold text-gray-800 mb-8">
        Painel de Controle Centralizado (AIOps)
      </h1>
      
      {/* Cards de KPIs simplificados para visualização rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card title="Total de Anomalias" value={anomalias.length} color="blue" />
        <Card title="Pendentes de Correção" value={anomalias.filter(a => a.status === 'PENDENTE').length} color="red" />
        <Card title="Corrigidas (Robô)" value={anomalias.filter(a => a.status === 'CORRIGIDO').length} color="green" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Últimas Anomalias e Status do Robô</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 text-left">Timestamp</th>
              <th className="py-2 px-4 text-left">Métrica</th>
              <th className="py-2 px-4 text-left">Host</th>
              <th className="py-2 px-4 text-left">Causa Raiz (IA)</th>
              <th className="py-2 px-4 text-left">Status Robô</th>
              <th className="py-2 px-4 text-left">Log</th>
            </tr>
          </thead>
          <tbody>
            {anomalias.map((a) => (
              <tr key={a.timestamp} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{new Date(a.timestamp).toLocaleTimeString()}</td>
                <td className="py-2 px-4">{a.metricName}</td>
                <td className="py-2 px-4">{a.host}</td>
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

// Componente simples de Card para KPIs
const Card: React.FC<{ title: string, value: number, color: string }> = ({ title, value, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow-lg border-t-4 border-${color}-500`}>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="text-3xl font-bold mt-1 text-gray-800">{value}</p>
  </div>
);