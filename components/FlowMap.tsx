// frontend-dashboard/components/FlowMap.tsx
"use client";

import React, { useEffect, useState } from "react";
import { db } from "../utils/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { motion } from "framer-motion";
import LogModal from "./LogModal";

// =========================
// Tipos
// =========================
interface FlowStep {
  id: string;
  label: string;
  host: string;
  order: number;
  description?: string;
}

interface FlowMapProps {
  client: string;
  flowType: string;
  anomalies: {
    host: string;
    status: "PENDENTE" | "CORRIGIDO" | "FALHA_CORRECAO";
  }[];
}

// =========================
// Componente Principal
// =========================
export default function FlowMap({ client, flowType, anomalies }: FlowMapProps) {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [selectedLogID, setSelectedLogID] = useState<string | null>(null); 

  // =========================
  // Carregar Fluxo do Firestore (Seu fluxo de passos da jornada)
  // =========================
  useEffect(() => {
    const path = `flow_steps/${flowType}`; 

    const q = query(collection(db, path), orderBy("order", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: FlowStep[] = [];
        snapshot.forEach((doc) => list.push(doc.data() as FlowStep));
        setSteps(list);
      },
      (err) => console.error("Erro ao carregar fluxo:", err)
    );

    return () => unsubscribe();
  }, [flowType]);

  // =========================
  // Status visual baseado nas anomalias
  // =========================
  const statusMap = anomalies.reduce((acc, anomaly) => {
    if (anomaly.status === "PENDENTE" || anomaly.status === "FALHA_CORRECAO") {
      acc[anomaly.host] = "red";
    } else if (anomaly.status === "CORRIGIDO") {
      acc[anomaly.host] = "green"; 
    }
    return acc;
  }, {} as Record<string, "red" | "green">);

  return (
    <div className="bg-gray-900/80 p-8 rounded-xl border-neon shadow-xl shadow-cyan-500/20">

      {/* Modal de Logs */}
      {selectedLogID && (
        <LogModal logID={selectedLogID} onClose={() => setSelectedLogID(null)} />
      )}

      <h3 className="text-2xl font-bold text-cyan-400 mb-8 tracking-wide">
        Fluxo Operacional – {client.replace("_", " ")} / {flowType.replace("_", " ")}
      </h3>

      <div className="flex flex-row items-center justify-center space-x-10 overflow-x-auto py-6">

        {steps.length === 0 && (
             <p className="text-gray-400">Carregando mapa ou passos de fluxo n&atilde;o encontrados na cole&ccedil;&atilde;o &apos;flow_steps/{flowType}&apos;.</p>
        )}

        {steps.map((step, index) => (
          <React.Fragment key={step.id}>

            {/* ========== BOX DO PASSO ========== */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`
                relative p-5 rounded-lg text-center cursor-pointer shadow-lg 
                w-64 border transition duration-300 hover:scale-105
                ${
                  statusMap[step.host] === "red"
                    ? "bg-red-700/40 border-red-500 shadow-red-500/40 animate-pulse"
                    : "bg-gray-800 border-cyan-700 shadow-cyan-500/30"
                }
              `}
              onClick={() => setSelectedLogID(step.host)} 
            >
              <h4 className="text-lg font-bold text-white">
                {step.label}
              </h4>
              <p className="text-sm text-gray-400 mt-1">{step.host}</p>

              {step.description && (
                <p className="text-xs text-gray-500 mt-2">{step.description}</p>
              )}

              <p className="mt-3 text-cyan-400 text-xs underline">
                Ver Log do Robô
              </p>
            </motion.div>

            {/* ========== SETA ENTRE AS CAIXAS ========== */}
            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.15 }}
                className="flex items-center"
              >
                <svg
                  className="w-12 h-12 text-cyan-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}