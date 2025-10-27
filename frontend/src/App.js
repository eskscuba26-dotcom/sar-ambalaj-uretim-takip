import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LogOut, Users, DollarSign, Package, Factory, BarChart3, Warehouse, Menu, X } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('token', response.data.access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post(`${API}/auth/register`, { email, password, full_name: fullName });
        toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');
        setIsRegister(false);
      } else {
        await login(email, password);
        toast.success('Giriş başarılı!');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Card className="w-full max-w-md shadow-2xl bg-gray-950 border-gray-800" data-testid="login-card">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_fabrika-stok/artifacts/owuei44z_sar%20ambalaj.PNG" 
              alt="SAR Ambalaj Logo" 
              className="w-40 h-40 object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-white" data-testid="login-title">
            Fabrika Yönetim Sistemi
          </CardTitle>
          <CardDescription className="text-gray-400" data-testid="login-description">
            {isRegister ? 'Yeni hesap oluştur' : 'Hesabınıza giriş yapın'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <Label className="text-gray-300" htmlFor="fullName" className="text-gray-300">Ad Soyad</Label>
                <Input className="bg-gray-900 border-gray-700 text-white"
                  id="fullName"
                  data-testid="fullname-input"
                  className="bg-gray-900 border-gray-700 text-white"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label className="text-gray-300" htmlFor="email" className="text-gray-300">E-posta</Label>
              <Input className="bg-gray-900 border-gray-700 text-white"
                id="email"
                type="email"
                data-testid="email-input"
                className="bg-gray-900 border-gray-700 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-gray-300" htmlFor="password" className="text-gray-300">Şifre</Label>
              <Input className="bg-gray-900 border-gray-700 text-white"
                id="password"
                type="password"
                data-testid="password-input"
                className="bg-gray-900 border-gray-700 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" data-testid="submit-button">
              {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
              data-testid="toggle-auth-button"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Zaten hesabım var' : 'Hesap oluştur'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Layout Component
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/', label: 'Ana Sayfa', icon: Factory },
    { path: '/kur', label: 'Döviz Kuru', icon: DollarSign },
    { path: '/hammadde', label: 'Hammadde', icon: Package },
    { path: '/uretim', label: 'Üretim', icon: Factory },
    { path: '/maliyet', label: 'Maliyet', icon: BarChart3 },
    { path: '/stok', label: 'Stok', icon: Warehouse },
    { path: '/sevkiyat', label: 'Sevkiyat', icon: Package },
    ...(user?.role === 'admin' ? [{ path: '/users', label: 'Kullanıcılar', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 border-r border-gray-800 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          {/* Logo/Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div className="flex items-center">
              <Factory className="h-8 w-8 text-blue-500" />
              <span className="ml-3 text-lg font-bold text-white">SAR Ambalaj</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="text-sm text-gray-400">Hoş geldiniz</div>
            <div className="text-white font-medium mt-1">{user?.full_name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {user?.role === 'admin' ? 'Admin' : 'Görüntüleyici'}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout Button */}
          <div className="px-3 py-4 border-t border-gray-800">
            <Button
              variant="outline"
              className="w-full bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              data-testid="logout-button"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-gray-950 border-b border-gray-800 px-6 py-4 lg:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white"
            data-testid="mobile-menu-button"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalProduction: 0,
    totalStock: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [materials, production, stock] = await Promise.all([
        axios.get(`${API}/raw-materials`),
        axios.get(`${API}/production`),
        axios.get(`${API}/stock`),
      ]);

      setStats({
        totalMaterials: materials.data.length,
        totalProduction: production.data.reduce((sum, p) => sum + p.quantity, 0),
        totalStock: stock.data.reduce((sum, s) => sum + s.quantity, 0),
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white" data-testid="dashboard-title">Ana Sayfa</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-950 border-gray-800" data-testid="stat-materials">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Hammadde Kayıtları</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalMaterials}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-950 border-gray-800" data-testid="stat-production">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Toplam Üretim (Adet)</CardTitle>
            <Factory className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProduction}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-950 border-gray-800" data-testid="stat-stock">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Stok (Adet)</CardTitle>
            <Warehouse className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalStock}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-950 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Hoş Geldiniz</CardTitle>
          <CardDescription className="text-gray-400">
            Fabrika yönetim sistemine hoş geldiniz. Yan menüden ilgili sayfalara erişebilirsiniz.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

// Exchange Rates Page
const ExchangeRatesPage = () => {
  const { user } = useAuth();
  const [rates, setRates] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [rate, setRate] = useState('');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await axios.get(`${API}/exchange-rates`);
      setRates(response.data);
    } catch (error) {
      toast.error('Kurlar yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/exchange-rates`, {
        currency,
        rate: parseFloat(rate),
      });
      toast.success('Kur güncellendi');
      setDialogOpen(false);
      setRate('');
      fetchRates();
    } catch (error) {
      toast.error('Kur güncellenemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white" data-testid="exchange-rates-title">Döviz Kuru</h1>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-exchange-rate-button">Kur Güncelle</Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-950 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Döviz Kuru Güncelle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-gray-300" className="text-gray-300">Döviz</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="currency-select" className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem className="text-white" value="USD">USD</SelectItem>
                      <SelectItem className="text-white" value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300" htmlFor="rate" className="text-gray-300">Kur (TL)</Label>
                  <Input className="bg-gray-900 border-gray-700 text-white"
                    id="rate"
                    type="number"
                    step="0.01"
                    data-testid="rate-input"
                    className="bg-gray-900 border-gray-700 text-white"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="save-exchange-rate-button">Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-gray-950 rounded-lg border border-gray-800 shadow-sm">
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-900" className="border-gray-800 hover:bg-gray-900">
                <TableHead className="text-gray-400">Döviz</TableHead>
                <TableHead className="text-gray-400">Kur (TL)</TableHead>
                <TableHead className="text-gray-400">Güncellenme</TableHead>
                <TableHead className="text-gray-400">Güncelleyen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((r) => (
                <TableRow className="border-gray-800 hover:bg-gray-900" key={r.id} data-testid={`exchange-rate-${r.currency}`} className="border-gray-800 hover:bg-gray-900">
                  <TableCell className="font-medium text-white">{r.currency}</TableCell>
                  <TableCell className="text-gray-300">{r.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-gray-400">{new Date(r.updated_at).toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-gray-400">{r.updated_by}</TableCell>
                </TableRow>
              ))}
              {rates.length === 0 && (
                <TableRow className="border-gray-800 hover:bg-gray-900" className="border-gray-800">
                  <TableCell colSpan={4} className="text-center text-gray-400">
                    Henüz kur girilmemiş
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

// Raw Materials Page
const RawMaterialsPage = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: 'PETKİM',
    entry_date: new Date().toISOString().split('T')[0],
    quantity: '',
    unit: 'kg',
    price: '',
    currency: 'TL',
  });
  const [customMaterialName, setCustomMaterialName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API}/raw-materials`);
      setMaterials(response.data);
    } catch (error) {
      toast.error('Hammaddeler yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await axios.put(`${API}/raw-materials/${editingMaterial.id}`, formData);
        toast.success('Hammadde güncellendi');
      } else {
        await axios.post(`${API}/raw-materials`, formData);
        toast.success('Hammadde eklendi');
      }
      setDialogOpen(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/raw-materials/${deleteId}`);
      toast.success('Hammadde silindi');
      setDeleteId(null);
      fetchMaterials();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      name: 'PETKİM',
      entry_date: new Date().toISOString().split('T')[0],
      quantity: '',
      unit: 'kg',
      price: '',
      currency: 'TL',
    });
    setEditingMaterial(null);
  };

  const openEditDialog = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      entry_date: material.entry_date,
      quantity: material.quantity.toString(),
      unit: material.unit,
      price: material.price.toString(),
      currency: material.currency,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white" data-testid="raw-materials-title">Hammadde Yönetimi</h1>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-raw-material-button">Yeni Hammadde</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">{editingMaterial ? 'Hammadde Düzenle' : 'Yeni Hammadde Ekle'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Hammadde Adı</Label>
                    {!showCustomInput ? (
                      <Select value={formData.name} onValueChange={(v) => {
                        if (v === 'CUSTOM') {
                          setShowCustomInput(true);
                          setFormData({ ...formData, name: '' });
                        } else {
                          setFormData({ ...formData, name: v });
                        }
                      }}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="material-name-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem className="text-white" value="PETKİM">PETKİM</SelectItem>
                          <SelectItem className="text-white" value="ESTOL">ESTOL</SelectItem>
                          <SelectItem className="text-white" value="TALK">TALK</SelectItem>
                          <SelectItem className="text-white" value="GAZ">GAZ</SelectItem>
                          <SelectItem className="text-white" value="MASURA 100">MASURA 100</SelectItem>
                          <SelectItem className="text-white" value="MASURA 120">MASURA 120</SelectItem>
                          <SelectItem className="text-white" value="MASURA 150">MASURA 150</SelectItem>
                          <SelectItem className="text-white" value="MASURA 200">MASURA 200</SelectItem>
                          <SelectItem className="text-white" value="CUSTOM">+ Yeni Hammadde Ekle</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Yeni hammadde adı"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          variant="outline"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          onClick={() => {
                            setShowCustomInput(false);
                            setFormData({ ...formData, name: 'PETKİM' });
                          }}
                        >
                          İptal
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="entry_date">Giriş Tarihi</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="entry_date"
                      type="date"
                      data-testid="entry-date-input"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="quantity">Miktar</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="quantity"
                      type="number"
                      step="0.01"
                      data-testid="quantity-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Birim</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="unit-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem className="text-white" value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem className="text-white" value="adet">Adet</SelectItem>
                        <SelectItem className="text-white" value="litre">Litre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="price">Birim Fiyat</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="price"
                      type="number"
                      step="0.01"
                      data-testid="price-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Para Birimi</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="currency-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem className="text-white" value="TL">TL</SelectItem>
                        <SelectItem className="text-white" value="USD">USD</SelectItem>
                        <SelectItem className="text-white" value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="save-raw-material-button">Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-gray-950 rounded-lg border border-gray-800 shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">Hammadde Adı</TableHead>
                  <TableHead className="text-gray-400">Giriş Tarihi</TableHead>
                  <TableHead className="text-gray-400">Miktar</TableHead>
                  <TableHead className="text-gray-400">Birim</TableHead>
                  <TableHead className="text-gray-400">Birim Fiyat</TableHead>
                  <TableHead className="text-gray-400">Para Birimi</TableHead>
                  <TableHead className="text-gray-400">Toplam Değer</TableHead>
                  {user?.role === 'admin' && <TableHead className="text-gray-400">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow className="border-gray-800 hover:bg-gray-900" key={material.id} data-testid={`material-row-${material.id}`}>
                    <TableCell className="font-medium text-white">{material.name}</TableCell>
                    <TableCell className="text-gray-300">{new Date(material.entry_date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell className="text-gray-300">{material.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">{material.unit}</TableCell>
                    <TableCell className="text-gray-300">{material.price.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">{material.currency}</TableCell>
                    <TableCell className="font-medium text-white">{material.total_value.toFixed(2)} {material.currency}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => openEditDialog(material)} data-testid={`edit-material-${material.id}`}>
                            Düzenle
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteId(material.id)} data-testid={`delete-material-${material.id}`}>
                            Sil
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {materials.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={user?.role === 'admin' ? 8 : 7} className="text-center text-gray-400">
                      Henüz hammadde eklenmemiş
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-950 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Bu hammadde kaydı silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-material">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="confirm-delete-material">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Production Page
const ProductionPage = () => {
  const { user } = useAuth();
  const [productions, setProductions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    machine: 'Makine 1',
    thickness_mm: '',
    width_cm: '',
    length_m: '',
    quantity: '',
    masura_model: '100',
    color: '',
  });
  const [colorOptions, setColorOptions] = useState([]);

  useEffect(() => {
    fetchProductions();
    fetchColorOptions();
  }, []);

  const fetchColorOptions = async () => {
    try {
      const response = await axios.get(`${API}/raw-materials/colors`);
      setColorOptions(response.data);
    } catch (error) {
      console.error('Renk seçenekleri yüklenemedi');
    }
  };

  const fetchProductions = async () => {
    try {
      const response = await axios.get(`${API}/production`);
      setProductions(response.data);
    } catch (error) {
      toast.error('Üretim kayıtları yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        thickness_mm: parseFloat(formData.thickness_mm),
        width_cm: parseFloat(formData.width_cm),
        length_m: parseFloat(formData.length_m),
        quantity: parseInt(formData.quantity),
      };

      if (editingProduction) {
        await axios.put(`${API}/production/${editingProduction.id}`, data);
        toast.success('Üretim kaydı güncellendi');
      } else {
        await axios.post(`${API}/production`, data);
        toast.success('Üretim kaydı eklendi');
      }
      setDialogOpen(false);
      resetForm();
      fetchProductions();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/production/${deleteId}`);
      toast.success('Üretim kaydı silindi');
      setDeleteId(null);
      fetchProductions();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      machine: 'Makine 1',
      thickness_mm: '',
      width_cm: '',
      length_m: '',
      quantity: '',
      masura_model: '100',
    });
    setEditingProduction(null);
  };

  const openEditDialog = (production) => {
    setEditingProduction(production);
    setFormData({
      date: production.date,
      machine: production.machine,
      thickness_mm: production.thickness_mm.toString(),
      width_cm: production.width_cm.toString(),
      length_m: production.length_m.toString(),
      quantity: production.quantity.toString(),
      masura_model: production.masura_model,
    });
    setDialogOpen(true);
  };

  const calculateSquareMeters = () => {
    const width = parseFloat(formData.width_cm);
    const length = parseFloat(formData.length_m);
    if (width && length) {
      return ((width / 100) * length).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white" data-testid="production-title">Üretim Takibi</h1>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-production-button">Yeni Üretim</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-white">{editingProduction ? 'Üretim Düzenle' : 'Yeni Üretim Ekle'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300" htmlFor="date">Tarih</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="date"
                      type="date"
                      data-testid="production-date-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Makine</Label>
                    <Select value={formData.machine} onValueChange={(v) => setFormData({ ...formData, machine: v })}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="machine-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem className="text-white" value="Makine 1">Makine 1</SelectItem>
                        <SelectItem className="text-white" value="Makine 2">Makine 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="thickness">Kalınlık (mm)</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="thickness"
                      type="number"
                      step="0.01"
                      data-testid="thickness-input"
                      value={formData.thickness_mm}
                      onChange={(e) => setFormData({ ...formData, thickness_mm: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="width">En (cm)</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="width"
                      type="number"
                      step="0.01"
                      data-testid="width-input"
                      value={formData.width_cm}
                      onChange={(e) => setFormData({ ...formData, width_cm: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="length">Metre Sarımı (m)</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="length"
                      type="number"
                      step="0.01"
                      data-testid="length-input"
                      value={formData.length_m}
                      onChange={(e) => setFormData({ ...formData, length_m: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Metrekare (otomatik)</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      value={calculateSquareMeters()}
                      data-testid="square-meters-display"
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="quantity">Adet</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="quantity"
                      type="number"
                      data-testid="production-quantity-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Masura Modeli</Label>
                    <Select value={formData.masura_model} onValueChange={(v) => setFormData({ ...formData, masura_model: v })}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="masura-model-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem className="text-white" value="100">100</SelectItem>
                        <SelectItem className="text-white" value="120">120</SelectItem>
                        <SelectItem className="text-white" value="150">150</SelectItem>
                        <SelectItem className="text-white" value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="save-production-button">Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-gray-950 rounded-lg border border-gray-800 shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">Tarih</TableHead>
                  <TableHead className="text-gray-400">Makine</TableHead>
                  <TableHead className="text-gray-400">Model</TableHead>
                  <TableHead className="text-gray-400">Metrekare</TableHead>
                  <TableHead className="text-gray-400">Adet</TableHead>
                  <TableHead className="text-gray-400">Masura</TableHead>
                  {user?.role === 'admin' && <TableHead className="text-gray-400">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {productions.map((prod) => (
                  <TableRow className="border-gray-800 hover:bg-gray-900" key={prod.id} data-testid={`production-row-${prod.id}`}>
                    <TableCell className="text-gray-300">{new Date(prod.date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell className="text-gray-300">{prod.machine}</TableCell>
                    <TableCell className="text-sm text-gray-300">
                      {prod.thickness_mm}mm x {prod.width_cm}cm x {prod.length_m}m
                    </TableCell>
                    <TableCell className="text-gray-300">{prod.square_meters.toFixed(2)} m²</TableCell>
                    <TableCell className="text-gray-300">{prod.quantity}</TableCell>
                    <TableCell className="text-gray-300">{prod.masura_model}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => openEditDialog(prod)} data-testid={`edit-production-${prod.id}`}>
                            Düzenle
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteId(prod.id)} data-testid={`delete-production-${prod.id}`}>
                            Sil
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {productions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="text-center text-gray-400">
                      Henüz üretim kaydı eklenmemiş
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-950 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Bu üretim kaydı silinecektir. Bu işlem geri alınamaz ve stok miktarları yeniden hesaplanacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-production">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="confirm-delete-production">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Cost Calculation Page
const CostCalculationPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white" data-testid="cost-title">Maliyet Hesaplama</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Yakında</CardTitle>
          <CardDescription>
            Maliyet hesaplama özelliği geliştirilme aşamasındadır.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

// Stock Page
const StockPage = () => {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API}/stock`);
      setStocks(response.data);
    } catch (error) {
      toast.error('Stok bilgileri yüklenemedi');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white" data-testid="stock-title">Stok Durumu</h1>
      
      <div className="bg-gray-950 rounded-lg border border-gray-800 shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">Model Adı</TableHead>
                  <TableHead className="text-gray-400">Kalınlık (mm)</TableHead>
                  <TableHead className="text-gray-400">En (cm)</TableHead>
                  <TableHead className="text-gray-400">Uzunluk (m)</TableHead>
                  <TableHead className="text-gray-400">Metrekare (m²)</TableHead>
                  <TableHead className="text-gray-400">Stok Adedi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow className="border-gray-800 hover:bg-gray-900" key={stock.id} data-testid={`stock-row-${stock.id}`}>
                    <TableCell className="font-medium text-white">{stock.model_name}</TableCell>
                    <TableCell className="text-gray-300">{stock.thickness_mm}</TableCell>
                    <TableCell className="text-gray-300">{stock.width_cm}</TableCell>
                    <TableCell className="text-gray-300">{stock.length_m}</TableCell>
                    <TableCell className="text-gray-300">{stock.square_meters.toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-lg text-white">{stock.quantity}</TableCell>
                  </TableRow>
                ))}
                {stocks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400">
                      Henüz stok bulunmuyor
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Shipment Page
const ShipmentPage = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    thickness_mm: '',
    width_cm: '',
    length_m: '',
    quantity: '',
    customer_name: '',
    vehicle_plate: '',
    driver_name: '',
    departure_time: '',
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await axios.get(`${API}/shipments`);
      setShipments(response.data);
    } catch (error) {
      toast.error('Sevkiyat kayıtları yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        thickness_mm: parseFloat(formData.thickness_mm),
        width_cm: parseFloat(formData.width_cm),
        length_m: parseFloat(formData.length_m),
        quantity: parseInt(formData.quantity),
      };

      if (editingShipment) {
        await axios.put(`${API}/shipments/${editingShipment.id}`, data);
        toast.success('Sevkiyat kaydı güncellendi');
      } else {
        await axios.post(`${API}/shipments`, data);
        toast.success('Sevkiyat kaydı eklendi');
      }
      setDialogOpen(false);
      resetForm();
      fetchShipments();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/shipments/${deleteId}`);
      toast.success('Sevkiyat kaydı silindi');
      setDeleteId(null);
      fetchShipments();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      thickness_mm: '',
      width_cm: '',
      length_m: '',
      quantity: '',
      customer_name: '',
      vehicle_plate: '',
      driver_name: '',
      departure_time: '',
    });
    setEditingShipment(null);
  };

  const openEditDialog = (shipment) => {
    setEditingShipment(shipment);
    setFormData({
      date: shipment.date,
      thickness_mm: shipment.thickness_mm.toString(),
      width_cm: shipment.width_cm.toString(),
      length_m: shipment.length_m.toString(),
      quantity: shipment.quantity.toString(),
      customer_name: shipment.customer_name,
      vehicle_plate: shipment.vehicle_plate,
      driver_name: shipment.driver_name,
      departure_time: shipment.departure_time,
    });
    setDialogOpen(true);
  };

  const calculateSquareMeters = () => {
    const width = parseFloat(formData.width_cm);
    const length = parseFloat(formData.length_m);
    if (width && length) {
      return ((width / 100) * length).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white" data-testid="shipment-title">Sevkiyat</h1>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-shipment-button">Yeni Sevkiyat</Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-950 border-gray-800 max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-white">{editingShipment ? 'Sevkiyat Düzenle' : 'Yeni Sevkiyat Ekle'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300" htmlFor="shipment_date">Tarih</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="shipment_date"
                      type="date"
                      data-testid="shipment-date-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="customer">Alıcı Firma</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="customer"
                      data-testid="customer-input"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="thickness">Kalınlık (mm)</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="thickness"
                      type="number"
                      step="0.01"
                      data-testid="shipment-thickness-input"
                      value={formData.thickness_mm}
                      onChange={(e) => setFormData({ ...formData, thickness_mm: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="width">En (cm)</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="width"
                      type="number"
                      step="0.01"
                      data-testid="shipment-width-input"
                      value={formData.width_cm}
                      onChange={(e) => setFormData({ ...formData, width_cm: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="length">Uzunluk (m)</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="length"
                      type="number"
                      step="0.01"
                      data-testid="shipment-length-input"
                      value={formData.length_m}
                      onChange={(e) => setFormData({ ...formData, length_m: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Metrekare (otomatik)</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      value={calculateSquareMeters()}
                      data-testid="shipment-square-meters-display"
                      disabled
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="shipment_quantity">Adet</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="shipment_quantity"
                      type="number"
                      data-testid="shipment-quantity-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="vehicle">Araç Plakası</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="vehicle"
                      data-testid="vehicle-input"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="driver">Şoför</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="driver"
                      data-testid="driver-input"
                      value={formData.driver_name}
                      onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300" htmlFor="departure_time">Çıkış Saati</Label>
                    <Input className="bg-gray-900 border-gray-700 text-white"
                      id="departure_time"
                      type="time"
                      data-testid="departure-time-input"
                      value={formData.departure_time}
                      onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="save-shipment-button">Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-gray-950 rounded-lg border border-gray-800 shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-gray-900">
                  <TableHead className="text-gray-400">Tarih</TableHead>
                  <TableHead className="text-gray-400">Model</TableHead>
                  <TableHead className="text-gray-400">Metrekare</TableHead>
                  <TableHead className="text-gray-400">Adet</TableHead>
                  <TableHead className="text-gray-400">Alıcı Firma</TableHead>
                  <TableHead className="text-gray-400">Araç Plakası</TableHead>
                  <TableHead className="text-gray-400">Şoför</TableHead>
                  <TableHead className="text-gray-400">Çıkış Saati</TableHead>
                  {user?.role === 'admin' && <TableHead className="text-gray-400">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow className="border-gray-800 hover:bg-gray-900" key={shipment.id} data-testid={`shipment-row-${shipment.id}`}>
                    <TableCell className="text-gray-300">{new Date(shipment.date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell className="text-sm text-gray-300">
                      {shipment.thickness_mm}mm x {shipment.width_cm}cm x {shipment.length_m}m
                    </TableCell>
                    <TableCell className="text-gray-300">{shipment.square_meters.toFixed(2)} m²</TableCell>
                    <TableCell className="text-gray-300">{shipment.quantity}</TableCell>
                    <TableCell className="text-gray-300">{shipment.customer_name}</TableCell>
                    <TableCell className="text-gray-300">{shipment.vehicle_plate}</TableCell>
                    <TableCell className="text-gray-300">{shipment.driver_name}</TableCell>
                    <TableCell className="text-gray-300">{shipment.departure_time}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => openEditDialog(shipment)} data-testid={`edit-shipment-${shipment.id}`}>
                            Düzenle
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteId(shipment.id)} data-testid={`delete-shipment-${shipment.id}`}>
                            Sil
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {shipments.length === 0 && (
                  <TableRow className="border-gray-800">
                    <TableCell colSpan={user?.role === 'admin' ? 9 : 8} className="text-center text-gray-400">
                      Henüz sevkiyat kaydı eklenmemiş
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-950 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Bu sevkiyat kaydı silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-shipment">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="confirm-delete-shipment">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Users Management Page
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Kullanıcılar yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/users`, formData);
      toast.success('Kullanıcı eklendi');
      setDialogOpen(false);
      setFormData({ email: '', password: '', full_name: '', role: 'viewer' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı eklenemedi');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/users/${deleteId}`);
      toast.success('Kullanıcı silindi');
      setDeleteId(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white" data-testid="users-title">Kullanıcı Yönetimi</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-user-button">Yeni Kullanıcı</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-950 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Kullanıcı Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300" htmlFor="user_full_name">Ad Soyad</Label>
                <Input className="bg-gray-900 border-gray-700 text-white"
                  id="user_full_name"
                  data-testid="user-fullname-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300" htmlFor="user_email">E-posta</Label>
                <Input className="bg-gray-900 border-gray-700 text-white"
                  id="user_email"
                  type="email"
                  data-testid="user-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300" htmlFor="user_password">Şifre</Label>
                <Input className="bg-gray-900 border-gray-700 text-white"
                  id="user_password"
                  type="password"
                  data-testid="user-password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem className="text-white" value="admin">Admin</SelectItem>
                    <SelectItem className="text-white" value="viewer">Görüntüleyici</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="save-user-button">Kaydet</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-gray-950 rounded-lg border border-gray-800 shadow-sm">
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-400">Ad Soyad</TableHead>
                <TableHead className="text-gray-400">E-posta</TableHead>
                <TableHead className="text-gray-400">Rol</TableHead>
                <TableHead className="text-gray-400">Kayıt Tarihi</TableHead>
                <TableHead className="text-gray-400">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow className="border-gray-800 hover:bg-gray-900" key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell className="font-medium text-white">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-300'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Görüntüleyici'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">{new Date(user.created_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteId(user.id)} data-testid={`delete-user-${user.id}`}>
                      Sil
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-950 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Bu kullanıcı silinecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-user">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="confirm-delete-user">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/kur" element={<ExchangeRatesPage />} />
                    <Route path="/hammadde" element={<RawMaterialsPage />} />
                    <Route path="/uretim" element={<ProductionPage />} />
                    <Route path="/maliyet" element={<CostCalculationPage />} />
                    <Route path="/stok" element={<StockPage />} />
                    <Route path="/sevkiyat" element={<ShipmentPage />} />
                    <Route path="/users" element={<UsersPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;