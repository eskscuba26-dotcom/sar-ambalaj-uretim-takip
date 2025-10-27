import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Package, DollarSign, Users, LayoutDashboard, Factory, Scissors, Archive } from 'lucide-react';

const MainLayout = ({ user, setUser, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Ana Sayfa', show: true },
    { path: '/hammadde', icon: Package, label: 'Hammadde', show: true },
    { path: '/kurlar', icon: DollarSign, label: 'Döviz Kurları', show: true },
    { path: '/uretim', icon: Factory, label: 'Üretim', show: true },
    { path: '/ebatlama', icon: Scissors, label: 'Ebatlama', show: true },
    { path: '/kullanicilar', icon: Users, label: 'Kullanıcılar', show: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <img
              src="https://customer-assets.emergentagent.com/job_b0c3057f-51cd-4963-921c-361851f497e2/artifacts/om8t0b3b_sar%20ambalaj.PNG"
              alt="SAR Ambalaj"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                SAR Ambalaj
              </h1>
              <p className="text-xs text-zinc-400">Üretim Takip</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) =>
            item.show ? (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                data-testid={`menu-${item.path.replace('/', '') || 'home'}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ) : null
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-white font-medium">{user.username}</p>
              <p className="text-xs text-zinc-400">
                {user.role === 'admin' ? 'Yönetici' : 'Gözlemci'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Çıkış
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;