import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Lead {
  id: string;
  nome: string | null;
  empresa: string | null;
  cargo: string | null;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  score: number;
  status: string;
  createdAt: string;
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    api.get('/dashboard/leads/recent?limit=50').then((r) => setLeads(r.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Leads</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Empresa</th>
              <th className="text-left px-4 py-3 font-medium">Cargo</th>
              <th className="text-left px-4 py-3 font-medium">Telefone</th>
              <th className="text-left px-4 py-3 font-medium">Score</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{lead.nome || '-'}</td>
                <td className="px-4 py-3">{lead.empresa || '-'}</td>
                <td className="px-4 py-3">{lead.cargo || '-'}</td>
                <td className="px-4 py-3">{lead.telefone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.score >= 70 ? 'bg-green-100 text-green-800' :
                    lead.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'opt_out' ? 'bg-red-100 text-red-800' :
                    lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
