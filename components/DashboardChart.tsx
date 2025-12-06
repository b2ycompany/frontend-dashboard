"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

// Tipos baseados nos seus dados
interface AnomaliaData {
  timestamp: string;
  value: number;
  metricName: string;
  data_type: string;
}

interface DashboardChartProps {
  data: AnomaliaData[];
  title: string;
}

// Formata os dados para o Recharts
const formatChartData = (anomalias: AnomaliaData[]) => {
  const map: { [key: string]: number } = {};

  anomalias.forEach((item) => {
    const timeKey = new Date(item.timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    map[timeKey] = Math.max(map[timeKey] || 0, item.value);
  });

  return Object.keys(map)
    .sort()
    .map((key) => ({
      time: key,
      value: map[key],
    }));
};

export default function DashboardChart({ data, title }: DashboardChartProps) {
  const chartData = formatChartData(data);

  if (!chartData.length)
    return (
      <div className="bg-gray-900/70 p-6 rounded-xl border-neon text-gray-400 text-center shadow-cyan-500/20 shadow-md">
        Nenhuma métrica registrada para este filtro.
      </div>
    );

  const metricUnit = data[0].metricName.includes("ms")
    ? "ms (Latência)"
    : data[0].metricName.includes("percent")
    ? "%"
    : "Valor";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gray-900/60 backdrop-blur-xl border border-cyan-700/40 rounded-xl p-6 shadow-xl shadow-cyan-900/40"
    >
      <h3 className="text-xl font-bold text-cyan-400 mb-4 tracking-wider">
        {title} – Tendência de Anomalias
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
        >
          {/* Grade futurista */}
          <CartesianGrid strokeDasharray="3 3" stroke="#233" opacity={0.5} />

          <XAxis
            dataKey="time"
            tick={{ fill: "#7dd3fc", fontSize: 12 }}
            stroke="#0891b2"
          />

          <YAxis
            stroke="#0891b2"
            tick={{ fill: "#7dd3fc", fontSize: 12 }}
            label={{
              value: metricUnit,
              angle: -90,
              position: "insideLeft",
              fill: "#67e8f9",
            }}
          />

          {/* Tooltip neon */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #0891b2",
              borderRadius: "8px",
              color: "#e0faff",
            }}
            labelStyle={{ color: "#7dd3fc" }}
            formatter={(v: number) => [`${v.toFixed(2)} ${metricUnit}`]}
          />

          {/* LINHA NEON */}
          <defs>
            <linearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#neonGradient)"
            strokeWidth={3}
            dot={false}
            animationDuration={800}
            className="drop-shadow-[0_0_6px_rgba(0,255,255,0.8)]"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
