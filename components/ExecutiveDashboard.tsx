// frontend-dashboard/components/ExecutiveDashboard.tsx
"use client";

import ExecutiveDonut from "./ExecutiveDonut";
import ExecutivePie from "./ExecutivePie"; // Assumindo que ExecutivePie espera PieData[]
import ExecutiveBar from "./ExecutiveBar";

// 1. Definindo interfaces para tipar a entrada e as estruturas de agrupamento
interface Anomalia {
  causaRaiz: string;
  host: string;
}

interface PieData {
    name: string;
    value: number;
}

interface BarData {
    host: string;
    value: number;
}

export default function ExecutiveDashboard({ anomalias }: { anomalias: Anomalia[] }) {
  
  // 2. Agrupamento para Causas Raiz (Pie Chart)
  // CORRIGIDO: Tipagem do acumulador e do item 'a'
  const distribCausas = Object.values(
    anomalias.reduce((acc: Record<string, PieData>, a: Anomalia) => {
      acc[a.causaRaiz] = acc[a.causaRaiz] || { name: a.causaRaiz, value: 0 };
      acc[a.causaRaiz].value++;
      return acc;
    }, {})
  ) as PieData[]; // Cast final para o tipo que ExecutivePie espera

  // 3. Agrupamento por Host (Bar Chart)
  // CORRIGIDO: Tipagem do acumulador e do item 'a'
  const countPorHost = Object.values(
    anomalias.reduce((acc: Record<string, BarData>, a: Anomalia) => {
      acc[a.host] = acc[a.host] || { host: a.host, value: 0 };
      acc[a.host].value++;
      return acc;
    }, {})
  ) as BarData[]; // Cast final para o tipo que ExecutiveBar espera

  return (
    <div className="space-y-10">
      
      {/* KPIs executivo topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ExecutiveDonut title="Disponibilidade" value={99.2} />
        <ExecutiveDonut title="Sucesso de Transações" value={97.4} color="#4caf50" />
        <ExecutiveDonut title="Eficiência do Robô AIOps" value={83.1} color="#ff4081" />
      </div>

      {/* Pizza + Barra */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExecutivePie
          title="Causas Raiz"
          data={distribCausas}
        />

        <ExecutiveBar
          title="Anomalias por Host"
          labels={countPorHost.map((i) => i.host)} // 'i' é tipado como BarData, então i.host existe
          values={countPorHost.map((i) => i.value)} // 'i' é tipado como BarData, então i.value existe
        />
      </div>
    </div>
  );
}