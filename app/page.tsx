'use client';

import React, { JSX, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Anomalia = { id: number; status: 'TICKET_ABERTO' | 'CORRIGIDO_FALHA' | string };

const Icon = ({ children }: { children: React.ReactNode }) => (
  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-700 to-cyan-500 flex items-center justify-center text-white">
    {children}
  </div>
);

const KPI = ({ title, value, trend }: { title: string; value: number | string; trend?: string }) => (
  <motion.div whileHover={{ y: -6 }} className="card-neon">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-300 kpi-sub">{title}</div>
        <div className="kpi-number text-white mt-2">{value}</div>
      </div>
      <div>
        <div className="text-sm text-gray-300">{trend || '—'}</div>
      </div>
    </div>
  </motion.div>
);

export default function Home(): JSX.Element {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);

  useEffect(() => {
    // Simula carregamento (substituir pelo seu Firebase/consulta real)
    const t = setTimeout(() => {
      setAnomalias([1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ id: i, status: i % 3 === 0 ? 'CORRIGIDO_FALHA' : 'TICKET_ABERTO' })));
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const total = anomalias.length;
  const tickets = anomalias.filter(a => a.status === 'TICKET_ABERTO').length;
  const failures = anomalias.filter(a => a.status === 'CORRIGIDO_FALHA').length;

  return (
    <div className="max-w-7xl mx-auto px-6 pb-12">
      {/* Top cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPI title="Anomalias Ativas" value={total} trend="+3% last 24h" />
        <KPI title="Tickets Abertos" value={tickets} trend="—" />
        <KPI title="Falhas Reabertas" value={failures} trend="-2%" />
      </section>

      {/* Executive strip */}
      <section className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="card-neon lg:w-1/3">
          <h3 className="text-cyan-300 font-bold">Visão Rápida</h3>
          <p className="text-sm text-gray-300 mt-2">Resumo das operações e integridade dos fluxos monitorados.</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="text-xs text-gray-300">SLA Global</div>
              <div className="text-xl font-bold text-white mt-1">99.92%</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="text-xs text-gray-300">MTTR</div>
              <div className="text-xl font-bold text-white mt-1">12m</div>
            </div>
          </div>
        </div>

        <div className="card-neon flex-1">
          <h3 className="text-cyan-300 font-bold">Mapa de Topologia</h3>
          <div className="mt-4 h-40 flex items-center justify-center text-gray-400">[Canvas / FlowMap — carregue o seu componente aqui]</div>
        </div>
      </section>

      {/* Table of incidents */}
      <section className="card-neon">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cyan-300">Fila de Incidentes</h3>
          <div className="text-sm text-gray-400">Últimas 24 horas</div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-neon">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Hora</th>
                <th>IA - Causa</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {anomalias.map(a => (
                <tr key={a.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="text-cyan-300 font-medium">T-{String(a.id).padStart(4, '0')}</td>
                  <td>Cliente_{a.id}</td>
                  <td>AUTH</td>
                  <td>{new Date().toLocaleTimeString()}</td>
                  <td>Erro de timeout em serviço X</td>
                  <td>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 border border-gray-700">
                      <span className={`status-dot ${a.status === 'TICKET_ABERTO' ? 'bg-cyan-400' : 'bg-red-400'}`} />
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button className="text-sm text-cyan-300 underline">Ver</button>
                      <button className="text-sm text-red-400 underline">Escalonar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {anomalias.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">Carregando dados...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
