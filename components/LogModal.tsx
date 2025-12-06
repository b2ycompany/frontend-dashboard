// frontend-dashboard/components/LogModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { db } from "../utils/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

interface AutomationLogData {
  output?: string; 
  steps?: string[]; 
  timestamp?: string;
  error?: string; 
}

interface LogModalProps {
  logID: string;
  onClose: () => void;
}

export default function LogModal({ logID, onClose }: LogModalProps) {
  const [log, setLog] = useState<AutomationLogData | null>(null);
  const [loading, setLoading] = useState(true);

  // =============================
  // Carrega o Log no Firestore
  // =============================
  useEffect(() => {
    async function fetchLog() {
      try {
        const ref = doc(db, "automacao_logs", logID); 
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          setLog(snapshot.data() as AutomationLogData); 
        } else {
          setLog({ error: "Nenhum log de automação encontrado." });
        }
      } catch (error: unknown) { // CORRIGIDO: Usando 'unknown'
        let errorMessage = "Erro desconhecido ao conectar.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        setLog({ error: `Erro ao carregar log: ${errorMessage}` });
      } finally {
        setLoading(false);
      }
    }

    fetchLog();
  }, [logID]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-cyan-600 shadow-xl shadow-cyan-500/30 rounded-xl p-6 w-[90%] md:w-[60%] lg:w-[45%] max-h-[85%] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
          📄 Log do Robô – Execução {logID}
        </h2>

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : log?.error ? (
          <p className="text-red-400">{log.error}</p>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {log?.output || "Sem dados de saída detalhados (output)."}
            </p>

            {log?.steps && (
              <div className="bg-gray-800 p-4 rounded-lg border border-cyan-700">
                <h3 className="text-cyan-400 font-bold mb-2">Passos do Robô</h3>
                <ul className="space-y-2">
                  {log.steps.map((s, i: number) => (
                    <li key={i} className="text-gray-300 text-sm">
                      <span className="text-cyan-400 mr-2">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {log?.timestamp && (
              <p className="text-gray-500 text-sm mt-2">
                Timestamp: {new Date(log.timestamp).toLocaleString("pt-BR", { timeZone: 'America/Sao_Paulo' })}
              </p>
            )}
          </div>
        )}

        <button
          className="mt-6 w-full py-2 bg-cyan-600 hover:bg-cyan-500 transition rounded-lg text-white font-bold"
          onClick={onClose}
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>
  );
}