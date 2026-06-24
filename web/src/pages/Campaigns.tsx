import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Campaign {
  id: string;
  nome: string;
  status: string;
  createdAt: string;
}

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    api.get('/campaigns').then((r) => setCampaigns(r.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Campanhas</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{c.nome}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    c.status === 'active' ? 'bg-green-100 text-green-800' :
                    c.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    c.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
