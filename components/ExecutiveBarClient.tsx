// frontend-dashboard/components/ExecutiveBarClient.tsx
import dynamic from 'next/dynamic';

// O dynamic import garante que o componente ExecutiveBar 
// (que acessa 'window.echarts') só seja executado no lado do cliente (browser).
const ExecutiveBarClient = dynamic(() => import('./ExecutiveBar'), {
  ssr: false, // ESSENCIAL: Desabilita a renderização no servidor Node.js
});

export default ExecutiveBarClient;