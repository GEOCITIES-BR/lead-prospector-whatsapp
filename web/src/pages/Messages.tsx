import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Message {
  id: string;
  conteudo: string;
  status: string;
  enviadaEm: string | null;
}

export function Messages() {
  const [msgs, setMsgs] = useState<Message[]>([]);

  useEffect(() => {
    api.get('/dashboard/messages/timeline?days=30').then((r) => setMsgs(r.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mensagens</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Conteúdo</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Enviada em</th>
            </tr>
          </thead>
          <tbody>
            {msgs.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 max-w-xs truncate">{m.conteudo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    m.status === 'sent' ? 'bg-green-100 text-green-800' :
                    m.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3">{m.enviadaEm ? new Date(m.enviadaEm).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
