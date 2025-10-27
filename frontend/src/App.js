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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Card className="w-full max-w-md shadow-lg" data-testid="login-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center" data-testid="login-title">
            Fabrika Yönetim Sistemi
          </CardTitle>
          <CardDescription className="text-center" data-testid="login-description">
            {isRegister ? 'Yeni hesap oluştur' : 'Hesabınıza giriş yapın'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  data-testid="fullname-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                data-testid="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" data-testid="submit-button">
              {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/', label: 'Ana Sayfa', icon: Factory },
    { path: '/kur', label: 'Döviz Kuru', icon: DollarSign },
    { path: '/hammadde', label: 'Hammadde', icon: Package },
    { path: '/uretim', label: 'Üretim', icon: Factory },
    { path: '/maliyet', label: 'Maliyet', icon: BarChart3 },
    { path: '/stok', label: 'Stok', icon: Warehouse },
    ...(user?.role === 'admin' ? [{ path: '/users', label: 'Kullanıcılar', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Factory className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Fabrika Yönetim</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 hidden sm:block">
                {user?.full_name} ({user?.role === 'admin' ? 'Admin' : 'Görüntüleyici'})
              </span>
              <Button
                variant="outline"
                size="sm"
                data-testid="logout-button"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
              
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
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
      <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">Ana Sayfa</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="stat-materials">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hammadde Kayıtları</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-production">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Üretim (Adet)</CardTitle>
            <Factory className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProduction}</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-stock">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stok (Adet)</CardTitle>
            <Warehouse className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoş Geldiniz</CardTitle>
          <CardDescription>
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
        <h1 className="text-3xl font-bold text-gray-900" data-testid="exchange-rates-title">Döviz Kuru</h1>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-exchange-rate-button">Kur Güncelle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Döviz Kuru Güncelle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Döviz</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger data-testid="currency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rate">Kur (TL)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    data-testid="rate-input"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="save-exchange-rate-button">Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Döviz</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Kur (TL)</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Güncellenme</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Güncelleyen</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {rates.map((r) => (
                  <tr key={r.id} data-testid={`exchange-rate-${r.currency}`} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">{r.currency}</td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{r.rate.toFixed(2)}</td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{new Date(r.updated_at).toLocaleString('tr-TR')}</td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{r.updated_by}</td>
                  </tr>
                ))}
                {rates.length === 0 && (
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td colSpan={4} className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center text-gray-500">
                      Henüz kur girilmemiş
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
        <h1 className="text-3xl font-bold text-gray-900" data-testid="raw-materials-title">Hammadde Yönetimi</h1>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-raw-material-button">Yeni Hammadde</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'Hammadde Düzenle' : 'Yeni Hammadde Ekle'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hammadde Adı</Label>
                    <Select value={formData.name} onValueChange={(v) => setFormData({ ...formData, name: v })}>
                      <SelectTrigger data-testid="material-name-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PETKİM">PETKİM</SelectItem>
                        <SelectItem value="ESTOL">ESTOL</SelectItem>
                        <SelectItem value="TALK">TALK</SelectItem>
                        <SelectItem value="MASURA 100">MASURA 100</SelectItem>
                        <SelectItem value="MASURA 120">MASURA 120</SelectItem>
                        <SelectItem value="MASURA 150">MASURA 150</SelectItem>
                        <SelectItem value="MASURA 200">MASURA 200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entry_date">Giriş Tarihi</Label>
                    <Input
                      id="entry_date"
                      type="date"
                      data-testid="entry-date-input"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Miktar</Label>
                    <Input
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
                      <SelectTrigger data-testid="unit-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="adet">Adet</SelectItem>
                        <SelectItem value="litre">Litre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Birim Fiyat</Label>
                    <Input
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
                      <SelectTrigger data-testid="currency-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TL">TL</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="save-raw-material-button">Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hammadde Adı</TableHead>
                  <TableHead>Giriş Tarihi</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead>Toplam Değer</TableHead>
                  {user?.role === 'admin' && <TableHead>İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id} data-testid={`material-row-${material.id}`}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{new Date(material.entry_date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell>{material.quantity.toFixed(2)}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>{material.price.toFixed(2)}</TableCell>
                    <TableCell>{material.currency}</TableCell>
                    <TableCell className="font-medium">{material.total_value.toFixed(2)} {material.currency}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(material)} data-testid={`edit-material-${material.id}`}>
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
                    <TableCell colSpan={user?.role === 'admin' ? 8 : 7} className="text-center text-gray-500">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
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
  });

  useEffect(() => {
    fetchProductions();
  }, []);

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
        <h1 className="text-3xl font-bold text-gray-900" data-testid="production-title">Üretim Takibi</h1>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-production-button">Yeni Üretim</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingProduction ? 'Üretim Düzenle' : 'Yeni Üretim Ekle'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Tarih</Label>
                    <Input
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
                      <SelectTrigger data-testid="machine-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Makine 1">Makine 1</SelectItem>
                        <SelectItem value="Makine 2">Makine 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="thickness">Kalınlık (mm)</Label>
                    <Input
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
                    <Label htmlFor="width">En (cm)</Label>
                    <Input
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
                    <Label htmlFor="length">Metre Sarımı (m)</Label>
                    <Input
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
                    <Input
                      value={calculateSquareMeters()}
                      data-testid="square-meters-display"
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Adet</Label>
                    <Input
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
                      <SelectTrigger data-testid="masura-model-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="120">120</SelectItem>
                        <SelectItem value="150">150</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="save-production-button">Kaydet</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Makine</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Metrekare</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead>Masura</TableHead>
                  {user?.role === 'admin' && <TableHead>İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {productions.map((prod) => (
                  <TableRow key={prod.id} data-testid={`production-row-${prod.id}`}>
                    <TableCell>{new Date(prod.date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell>{prod.machine}</TableCell>
                    <TableCell className="text-sm">
                      {prod.thickness_mm}mm x {prod.width_cm}cm x {prod.length_m}m
                    </TableCell>
                    <TableCell>{prod.square_meters.toFixed(2)} m²</TableCell>
                    <TableCell>{prod.quantity}</TableCell>
                    <TableCell>{prod.masura_model}</TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(prod)} data-testid={`edit-production-${prod.id}`}>
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
                    <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="text-center text-gray-500">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
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
      <h1 className="text-3xl font-bold text-gray-900" data-testid="cost-title">Maliyet Hesaplama</h1>
      
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
      <h1 className="text-3xl font-bold text-gray-900" data-testid="stock-title">Stok Durumu</h1>
      
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Adı</TableHead>
                  <TableHead>Kalınlık (mm)</TableHead>
                  <TableHead>En (cm)</TableHead>
                  <TableHead>Uzunluk (m)</TableHead>
                  <TableHead>Metrekare (m²)</TableHead>
                  <TableHead>Stok Adedi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.id} data-testid={`stock-row-${stock.id}`}>
                    <TableCell className="font-medium">{stock.model_name}</TableCell>
                    <TableCell>{stock.thickness_mm}</TableCell>
                    <TableCell>{stock.width_cm}</TableCell>
                    <TableCell>{stock.length_m}</TableCell>
                    <TableCell>{stock.square_meters.toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-lg">{stock.quantity}</TableCell>
                  </TableRow>
                ))}
                {stocks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
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
        <h1 className="text-3xl font-bold text-gray-900" data-testid="users-title">Kullanıcı Yönetimi</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-user-button">Yeni Kullanıcı</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user_full_name">Ad Soyad</Label>
                <Input
                  id="user_full_name"
                  data-testid="user-fullname-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="user_email">E-posta</Label>
                <Input
                  id="user_email"
                  type="email"
                  data-testid="user-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="user_password">Şifre</Label>
                <Input
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
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Görüntüleyici</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" data-testid="save-user-button">Kaydet</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Görüntüleyici'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('tr-TR')}</TableCell>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
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