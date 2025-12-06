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

// Tipos das anomalias
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

/// CARD NEON
const Card: React.FC<{ title: string; value: number }> = ({
  title,
  value,
}) => (
  <div className="card-neon">
    <p className="text-sm font-medium text-cyan-300">{title}</p>
    <p className="text-4xl font-extrabold mt-2 text-cyan-400">{value}</p>
  </div>
);

export default function Home() {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [filterType, setFilterType] = useState<string>("TODOS");
  const [selectedClient, setSelectedClient] = useState<string>(ALL_CLIENTS);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(true);

  // ================================
  // FIREBASE - BUSCA DE DADOS
  // ================================
  useEffect(() => {
    if (!db) {
      console.error("ERRO: FIREBASE NÃO INICIALIZADO");
      return;
    }

    const q = query(collection(db, "anomalias"), orderBy("timestamp", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Anomalia[] = [];
        snapshot.forEach((d) => list.push(d.data() as Anomalia));

        setAnomalias(list);
      },
      (err) => console.error("Erro Firestore:", err)
    );

    return () => unsub();
  }, []);

  // ================================
  // LISTA DE CLIENTES
  // ================================
  const clients = useMemo(() => {
    const cs = anomalias
      .map((a) => a.client_id)
      .filter((x) => x !== undefined && x !== "");

    return [ALL_CLIENTS, ...new Set(cs)];
  }, [anomalias]);

  // ================================
  // FILTRO PRINCIPAL
  // ================================
  const filteredAnomalias = anomalias.filter(
    (a) =>
      (selectedClient === ALL_CLIENTS || a.client_id === selectedClient) &&
      (filterType === "TODOS" || a.data_type === filterType)
  );

  // ================================
  // DADOS PARA OS GRÁFICOS
  // ================================
  const chartDataGrouped = useMemo(() => {
    const g: Record<string, Anomalia[]> = {};

    filteredAnomalias.forEach((a) => {
      if (!a.metricName) return;

      if (!g[a.metricName]) g[a.metricName] = [];
      g[a.metricName].push(a);
    });

    return g;
  }, [filteredAnomalias]);

  // ================================
  // DADOS PARA O FLOWMAP
  // ================================
  const mapAnomalies = filteredAnomalias.map((a) => ({
    host: a.host,
    status: a.status,
  }));

  // ================================
  // HTML PRINCIPAL DO DASHBOARD
  // ================================
  return (
    <div className="min-h-screen p-6 flex bg-gray-950 text-gray-200 overflow-hidden">

      {/* =============================
          PAINEL PRINCIPAL
         ============================= */}
      <div
        className={`transition-all duration-300 ${
          isLogPanelOpen ? "w-[75%]" : "w-full"
        }`}
      >
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-cyan-400 tracking-wide drop-shadow-[0_0_6px_#00eaff]">
            Painel AIOps Multicliente
          </h1>

          <button
            className="px-4 py-2 border-neon rounded-lg hover-neon text-cyan-300"
            onClick={() => setIsLogPanelOpen(!isLogPanelOpen)}
          >
            {isLogPanelOpen ? "Fechar Logs ✕" : "Abrir Logs ☰"}
          </button>
        </header>

        {/* =============================
            FILTROS + KPI
        ============================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* FILTROS */}
          <div className="card-neon">
            <h3 className="text-xl text-cyan-400 mb-3 border-b border-cyan-700 pb-2">
              Filtros
            </h3>

            {/* CLIENTE */}
            <label className="text-sm text-cyan-300 mb-1 block">
              Cliente:
            </label>
            <select
              className="w-full p-2 bg-gray-800 border-neon rounded-lg text-gray-200 mb-4"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            {/* TIPOS */}
            <div className="flex flex-wrap gap-2">
              {FILTER_TYPES.map((type) => {
                const count = anomalias.filter(
                  (a) =>
                    a.data_type === type &&
                    (selectedClient === ALL_CLIENTS ||
                      a.client_id === selectedClient)
                ).length;

                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      filterType === type
                        ? "bg-cyan-700 text-white border-cyan-500 shadow-cyan-500/40"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
                    }`}
                  >
                    {type.replace("_", " ")} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* KPIs */}
          <div className="col-span-2 grid grid-cols-3 gap-6">
            <Card
              title="Total de Anomalias"
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

        {/* =============================
            MAPA DE FLUXO
        ============================= */}
        <h2 className="text-2xl text-cyan-300 mb-3 border-b border-cyan-800 pb-2">
          Arquitetura & Fluxo Operacional
        </h2>

        {selectedClient !== ALL_CLIENTS && filterType !== "TODOS" ? (
          <FlowMap
            client={selectedClient}
            flowType={filterType}
            anomalies={mapAnomalies}
          />
        ) : (
          <div className="bg-gray-900/50 p-6 rounded-lg border-neon text-gray-400">
            Selecione um cliente e um fluxo para visualizar o mapa.
          </div>
        )}

        {/* =============================
            GRÁFICOS
        ============================= */}
        <h2 className="text-2xl text-cyan-300 mt-10 mb-4 border-b border-cyan-800 pb-2">
          Análise Gráfica
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(chartDataGrouped).length === 0 ? (
            <div className="chart-box text-center text-gray-400 md:col-span-2">
              Nenhum dado encontrado.
            </div>
          ) : (
            Object.keys(chartDataGrouped).map((key) => (
              <DashboardChart
                key={key}
                title={key.replace("_", " ")}
                data={chartDataGrouped[key]}
              />
            ))
          )}
        </div>

        {/* =============================
            TABELA
        ============================= */}
        <h2 className="text-2xl text-cyan-300 mt-10 mb-4 border-b border-cyan-800 pb-2">
          Registros de Anomalias
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full table-neon">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left">Cliente</th>
                <th className="py-3 px-4 text-left">Tipo</th>
                <th className="py-3 px-4 text-left">Timestamp</th>
                <th className="py-3 px-4 text-left">Métrica</th>
                <th className="py-3 px-4 text-left">Causa Raiz</th>
                <th className="py-3 px-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredAnomalias.map((a, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-700 hover:bg-cyan-500/10"
                >
                  <td className="py-3 px-4 font-bold text-cyan-300">
                    {a.client_id}
                  </td>
                  <td className="py-3 px-4">{a.data_type}</td>
                  <td className="py-3 px-4">
                    {new Date(a.timestamp).toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 px-4">
                    {a.metricName} ({a.value.toFixed(2)})
                  </td>
                  <td className="py-3 px-4">{a.causaRaiz}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        a.status === "CORRIGIDO"
                          ? "badge-green"
                          : a.status === "PENDENTE"
                          ? "badge-yellow"
                          : "badge-red"
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
      </div>

      {/* =============================
          PAINEL LATERAL - LOGS
      ============================= */}
      <aside
        className={`transition-all duration-300 overflow-y-auto sidebar-neon p-4 rounded-lg ml-4 ${
          isLogPanelOpen ? "w-[25%] opacity-100" : "w-0 opacity-0"
        }`}
      >
        <h3 className="text-xl font-bold text-cyan-400 mb-3 border-b border-cyan-700 pb-2">
          Logs Operacionais
        </h3>

        <div className="space-y-2 text-sm">
          {anomalias.slice(0, 14).map((a, i) => (
            <p
              key={i}
              className={
                a.status === "CORRIGIDO" ? "text-green-400" : "text-red-400"
              }
            >
              [{new Date(a.timestamp).toLocaleTimeString()}] {a.client_id}:{" "}
              {a.causaRaiz}
            </p>
          ))}
        </div>
      </aside>
    </div>
  );
}
