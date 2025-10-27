import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://sar-ambalaj-takip.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password,
      });

      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toast.success('Giriş başarılı!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-sm bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="https://customer-assets.emergentagent.com/job_b0c3057f-51cd-4963-921c-361851f497e2/artifacts/om8t0b3b_sar%20ambalaj.PNG"
              alt="SAR Ambalaj"
              className="h-32 w-auto"
              data-testid="login-logo"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Üretim Takip Sistemi
            </h1>
            <p className="text-zinc-400 text-sm">Lütfen giriş yapınız</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-200">
                Kullanıcı Adı
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-green-500 focus:ring-green-500/20"
                placeholder="Kullanıcı adınızı giriniz"
                required
                data-testid="username-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-200">
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-green-500 focus:ring-green-500/20"
                placeholder="Şifrenizi giriniz"
                required
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
              data-testid="login-submit-button"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          {/* ACİL GİRİŞ BUTONU */}
          <div className="mt-4">
            <Button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await axios.post(`${API}/auth/emergency-login?username=admin`);
                  const { access_token, user } = response.data;
                  localStorage.setItem('token', access_token);
                  localStorage.setItem('user', JSON.stringify(user));
                  setUser(user);
                  toast.success('Acil giriş başarılı!');
                  navigate('/');
                } catch (error) {
                  toast.error('Acil giriş başarısız');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              {loading ? 'Giriş yapılıyor...' : '🚨 ACİL GİRİŞ (Şifresiz)'}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-zinc-500">
            <p>© 2025 SAR Ambalaj - Tüm hakları saklıdır</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;