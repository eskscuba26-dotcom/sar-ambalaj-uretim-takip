import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Package, Users } from 'lucide-react';

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="https://customer-assets.emergentagent.com/job_b0c3057f-51cd-4963-921c-361851f497e2/artifacts/om8t0b3b_sar%20ambalaj.PNG"
              alt="SAR Ambalaj"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                SAR Ambalaj
              </h1>
              <p className="text-xs text-zinc-400">Üretim Takip Sistemi</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-white font-medium">{user.username}</p>
              <p className="text-xs text-zinc-400">
                {user.role === 'admin' ? 'Yönetici' : 'Görüntüleyici'}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Hoş Geldiniz
          </h2>
          <p className="text-zinc-400">Üretim takip sistemine giriş yaptınız</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/hammadde')}
            className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-8 hover:border-green-500/50 transition-all duration-300 text-left"
            data-testid="hammadde-card"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-green-500/10 p-3 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <Package className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Hammadde
              </h3>
            </div>
            <p className="text-zinc-400 text-sm">
              Hammadde kayıtlarını görüntüleyin ve yönetin
            </p>
            <div className="mt-4 text-green-500 text-sm font-medium group-hover:translate-x-2 transition-transform inline-block">
              Görüntüle →
            </div>
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/kullanicilar')}
              className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-8 hover:border-green-500/50 transition-all duration-300 text-left"
              data-testid="users-card"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-green-500/10 p-3 rounded-lg group-hover:bg-green-500/20 transition-colors">
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Kullanıcılar
                </h3>
              </div>
              <p className="text-zinc-400 text-sm">
                Kullanıcıları ekleyin ve yönetin
              </p>
              <div className="mt-4 text-green-500 text-sm font-medium group-hover:translate-x-2 transition-transform inline-block">
                Yönet →
              </div>
            </button>
          )}

          {/* Placeholder for future modules */}
          <div className="bg-zinc-900/30 border border-zinc-800 border-dashed rounded-xl p-8 flex items-center justify-center">
            <p className="text-zinc-600 text-sm text-center">
              Yakında yeni modüller eklenecek
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 border-dashed rounded-xl p-8 flex items-center justify-center">
            <p className="text-zinc-600 text-sm text-center">
              Yakında yeni modüller eklenecek
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;