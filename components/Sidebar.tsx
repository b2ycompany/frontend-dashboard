// frontend-dashboard/components/Sidebar.tsx
import React from 'react';
import Image from 'next/image';
import { FiGrid, FiUsers, FiHardDrive, FiBarChart2 } from 'react-icons/fi'; // Garante que estes ícones estejam disponíveis

const navItems = [
    { name: 'Dashboard', icon: FiGrid, link: '/' },
    { name: 'Clientes', icon: FiUsers, link: '/clients' },
    { name: 'Infraestrutura', icon: FiHardDrive, link: '/infra' },
    { name: 'Relatórios', icon: FiBarChart2, link: '/reports' },
];

const Sidebar = () => {
    return (
        // Sidebar: Layout Dark Mode Profissional
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-20">
            
            {/* Logo e Título */}
            <div className="p-6 flex items-center space-x-2 border-b border-gray-800">
                {/* CORREÇÃO: Usando a extensão .jpeg */}
                <Image src="/logo_lr_monitor.jpeg" alt="LR Monitor Logo" width={32} height={32} priority={true} /> 
                <h1 className="text-xl font-extrabold text-cyan-400">LR MONITOR</h1>
            </div>

            {/* Navegação Principal */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map((item) => (
                    <a
                        key={item.name}
                        href={item.link}
                        className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition duration-150"
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                    </a>
                ))}
            </nav>

            {/* Rodapé Opcional */}
            <div className="p-4 border-t border-gray-800">
                <p className="text-xs text-gray-500">
                    AIOps Engine v2.0
                </p>
            </div>
        </div>
    );
};

export default Sidebar;