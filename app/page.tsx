// frontend-dashboard/app/page.tsx
"use client";

import { db } from "../utils/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";
import React from "react";

import DashboardChart from "../components/DashboardChart";
import FlowMap from "../components/FlowMap";
import ExecutiveDashboard from "../components/ExecutiveDashboard";

// ===========================
// INTERFACES
// ===========================
interface Anomalia extends DocumentData {
  timestamp: string;
  metricName: string;
  value: number;
  host: string;
  causaRaiz: string;
  status: "PENDENTE" | "CORRIGIDO" | "FALHA_CORRECAO";
  logID: string;
  data_type: string;
  client_id: string;
}

const ALL_CLIENTS = "TODOS_CLIENTES";
const FILTER_TYPES = [
  "TODOS",
  "FLUXO_ONBOARDING",
  "APLICACAO_AUTH",
  "INFRA_TRANSACAO",
  "FLUXO_SINISTRO",
  "INFRA_DB_LOCKS",
];

// KPIs Card
const Card: React.FC<{ title: string; value: number }> = ({
  title,
  value,
}) => (
  <div className="bg-gray-900 p-6 rounded-lg border border-cyan-500/30 shadow-sm shadow-cyan-500/20 transition hover:shadow-cyan-500/50">
    <p className="text-sm font-medium text-gray-400">{title}</p>
    <p className="text-4xl font-extrabold mt-2 text-cyan-400">{value}</p>
  </div>
);

export default function Home() {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [filterType, setFilterType] = useState<string>("TODOS");
  const [selectedClient, setSelectedClient] = useState<string>(ALL_CLIENTS);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(true);

  // ===========================
  // FIRESTORE REALTIME
  // ===========================
  useEffect(() => {
    const q = query(collection(db, "anomalias"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const list: Anomalia[] = [];
        querySnapshot.forEach((d) => list.push(d.data() as Anomalia));
        setAnomalias(list);
      },
      (error) => console.error("Erro Firestore:", error)
    );

    return () => unsubscribe();
  }, []);

  // Lista de clientes
  const clients = useMemo(() => {
    return [
      ALL_CLIENTS,
      ...Array.from(
        new Set(
          anomalias
            .map((a) => a.client_id)
            .filter((v) => v !== undefined && v !== null && v.length > 0)
        )
      ),
    ];
  }, [anomalias]);

  // Filtro principal
  const filteredAnomalias = anomalias.filter(
    (a) =>
      (selectedClient === ALL_CLIENTS || a.client_id === selectedClient) &&
      (filterType === "TODOS" || a.data_type === filterType)
  );

  // Dados gráficos
  const chartDataGrouped = useMemo(() => {
    const groups: { [key: string]: Anomalia[] } = {};
    filteredAnomalias.forEach((a) => {
      if (!a.metricName) return;
      if (!groups[a.metricName]) groups[a.metricName] = [];
      groups[a.metricName].push(a);
    });
    return groups;
  }, [filteredAnomalias]);

  const mapAnomalies = filteredAnomalias.map((a) => ({
    host: a.host,
    status: a.status,
  }));

  const mainContentWidth = isLogPanelOpen ? "lg:w-3/4" : "lg:w-full";

  return (
    <div className="min-h-screen bg-gray-950 p-6 flex flex-row space-x-4">
      {/* ========================================= */}
      {/* PAINEL PRINCIPAL */}
      {/* ========================================= */}

      <div className={`${mainContentWidth} transition-all duration-300 w-full`}>
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold text-cyan-400 tracking-wider">
            Painel de Monitoramento AIOps
          </h1>

          <button
            onClick={() => setIsLogPanelOpen(!isLogPanelOpen)}
            className="p-2 bg-gray-800 rounded text-cyan-400 border border-cyan-500/40 hover:bg-gray-700"
          >
            {isLogPanelOpen ? "Fechar Logs" : "Abrir Logs"}
          </button>
        </header>

        {/* ========================================= */}
        {/* MODO EXECUTIVO */}
        {/* ========================================= */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">
            Visão Executiva
          </h2>

          <ExecutiveDashboard anomalias={filteredAnomalias} />
        </section>

        {/* ========================================= */}
        {/* FILTROS + KPIs */}
        {/* ========================================= */}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Filtros */}
          <div className="bg-gray-900 p-4 rounded-lg border border-cyan-500/20 shadow-sm shadow-cyan-500/20">
            <h3 className="text-xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">
              Filtros Operacionais
            </h3>

            <label className="block text-sm font-medium text-cyan-400 mb-1">
              Cliente:
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="mb-4 block w-full pl-3 pr-10 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded"
            >
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2">
              {FILTER_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    filterType === t
                      ? "bg-cyan-600 border-cyan-400 text-white"
                      : "bg-gray-700 border-gray-500 text-gray-300"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-6">
            <Card
              title="Total Anomalias Filtradas"
              value={filteredAnomalias.length}
            />
            <Card
              title="Pendentes"
              value={filteredAnomalias.filter((a) => a.status === "PENDENTE").length}
            />
            <Card
              title="Corrigidas"
              value={filteredAnomalias.filter((a) => a.status === "CORRIGIDO").length}
            />
          </div>
        </section>

        {/* ========================================= */}
        {/* MAPA DE FLUXO */}
        {/* ========================================= */}

        <section className="space-y-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
            Mapa de Arquitetura & Fluxo do Cliente
          </h2>

          {selectedClient !== ALL_CLIENTS &&
          filterType !== "TODOS" &&
          filteredAnomalias.length > 0 ? (
            <FlowMap
              client={selectedClient}
              flowType={filterType}
              anomalies={mapAnomalies}
            />
          ) : (
            <div className="bg-gray-900 p-6 rounded-lg text-gray-400 border border-cyan-500/20">
              Selecione um cliente e um fluxo para visualizar.
            </div>
          )}
        </section>

        {/* ========================================= */}
        {/* GRÁFICOS */}
        {/* ========================================= */}

        <section className="space-y-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
            Análise Gráfica de Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(chartDataGrouped).length === 0 ? (
              <div className="bg-gray-900 p-6 rounded-lg text-center text-gray-400 border border-cyan-500/20 md:col-span-2">
                Nenhum dado para gráficos.
              </div>
            ) : (
              Object.keys(chartDataGrouped).map((metric) => (
                <DashboardChart
                  key={metric}
                  title={metric.replace("_", " ")}
                  data={chartDataGrouped[metric]}
                />
              ))
            )}
          </div>
        </section>

        {/* ========================================= */}
        {/* TABELA */}
        {/* ========================================= */}

        <section>
          <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">
            Anomalias ({filteredAnomalias.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 border border-cyan-500/20 rounded-lg">
              <thead className="bg-gray-800">
                <tr>
                  <th className="py-3 px-4 text-left text-cyan-400">Cliente</th>
                  <th className="py-3 px-4 text-left text-cyan-400">Tipo</th>
                  <th className="py-3 px-4 text-left text-cyan-400">Horário</th>
                  <th className="py-3 px-4 text-left text-cyan-400">Métrica</th>
                  <th className="py-3 px-4 text-left text-cyan-400">Causa Raiz</th>
                  <th className="py-3 px-4 text-left text-cyan-400">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAnomalias.map((a, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-700 hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 text-gray-200">
                      {a.client_id?.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {a.data_type?.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(a.timestamp).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {a.metricName} ({a.value})
                    </td>
                    <td className="py-3 px-4 text-gray-300">{a.causaRaiz}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          a.status === "CORRIGIDO"
                            ? "bg-green-600"
                            : a.status === "PENDENTE"
                            ? "bg-yellow-600 text-black"
                            : "bg-red-600"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ========================================= */}
      {/* PAINEL DE LOGS */}
      {/* ========================================= */}

      <aside
        className={`${
          isLogPanelOpen
            ? "w-full lg:w-1/4 translate-x-0"
            : "w-0 lg:w-0 translate-x-full"
        } bg-gray-900 p-4 rounded-lg border border-cyan-500/20 shadow-xl overflow-hidden transition-all`}
      >
        <h3 className="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
          Logs Operacionais
        </h3>

        <div className="text-sm text-gray-400 h-full overflow-y-auto space-y-2">
          {anomalias.slice(0, 20).map((a, i) => (
            <p
              key={i}
              className={
                a.status === "CORRIGIDO" ? "text-green-400" : "text-red-400"
              }
            >
              [{new Date(a.timestamp).toLocaleTimeString()}] {a.client_id.replace(
                "_",
                " "
              )}{" "}
              → {a.causaRaiz}
            </p>
          ))}
        </div>
      </aside>
    </div>
  );
}
