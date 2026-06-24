import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Overview {
  totalLeads: number;
  totalCampanhas: number;
  totalMensagens: number;
  totalTemplates: number;
  leadsContacted: number;
  leadsPendentes: number;
  taxaConversao: number;
}

export function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api.get('/dashboard/overview').then((r) => setData(r.data));
  }, []);

  if (!data) return <p className="text-gray-500">Carregando...</p>;

  const cards = [
    { label: 'Total Leads', value: data.totalLeads, color: 'bg-blue-500' },
    { label: 'Contactados', value: data.leadsContacted, color: 'bg-green-500' },
    { label: 'Pendentes', value: data.leadsPendentes, color: 'bg-yellow-500' },
    { label: 'Taxa Conversão', value: `${data.taxaConversao}%`, color: 'bg-purple-500' },
    { label: 'Campanhas', value: data.totalCampanhas, color: 'bg-indigo-500' },
    { label: 'Mensagens', value: data.totalMensagens, color: 'bg-pink-500' },
    { label: 'Templates', value: data.totalTemplates, color: 'bg-teal-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-4">
            <div className={`w-3 h-3 rounded-full ${card.color} mb-2`} />
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
