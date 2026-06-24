import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Template {
  id: string;
  nome: string;
  conteudo: string;
  variaveis: string[];
}

export function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    api.get('/templates').then((r) => setTemplates(r.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Templates</h1>
      <div className="grid gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-4">
            <h2 className="font-medium mb-1">{t.nome}</h2>
            <p className="text-sm text-gray-600 mb-2">{t.conteudo}</p>
            {t.variaveis.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {t.variaveis.map((v) => (
                  <span key={v} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
