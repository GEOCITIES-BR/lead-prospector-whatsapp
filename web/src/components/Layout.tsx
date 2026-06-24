import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/leads', label: 'Leads', icon: '👤' },
  { path: '/campaigns', label: 'Campanhas', icon: '📢' },
  { path: '/templates', label: 'Templates', icon: '📝' },
  { path: '/messages', label: 'Mensagens', icon: '💬' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-gray-800">Lead Prospector</h1>
        </div>
        <nav className="p-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded mb-1 text-sm ${
                pathname === item.path
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
