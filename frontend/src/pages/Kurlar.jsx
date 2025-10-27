import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, LogOut, ArrowLeft, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Kurlar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRateId, setDeletingRateId] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    usd: '',
    eur: '',
  });

  const token = localStorage.getItem('token');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await axios.get(`${API}/kurlar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRates(response.data);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        usd: parseFloat(formData.usd),
        eur: parseFloat(formData.eur),
      };

      if (editingRate) {
        await axios.put(`${API}/kurlar/${editingRate.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kur güncellendi');
      } else {
        await axios.post(`${API}/kurlar`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kur eklendi');
      }

      setDialogOpen(false);
      resetForm();
      fetchRates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/kurlar/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Kur silindi');
      fetchRates();
      setDeleteDialogOpen(false);
      setDeletingRateId(null);
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const confirmDelete = (id) => {
    setDeletingRateId(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      tarih: rate.tarih,
      usd: rate.usd.toString(),
      eur: rate.eur.toString(),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      usd: '',
      eur: '',
    });
    setEditingRate(null);
  };

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
              <p className="text-xs text-zinc-400">Döviz Kuru Takip</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-white font-medium">{user.username}</p>
              <p className="text-xs text-zinc-400">
                {user.role === 'admin' ? 'Yönetici' : 'Gözlemci'}
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
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div>
              <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Döviz Kuru Yönetimi
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                {rates.length} kur kaydı bulunuyor
              </p>
            </div>
          </div>

          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="add-rate-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kur
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {editingRate ? 'Kur Düzenle' : 'Yeni Kur Ekle'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="tarih" className="text-zinc-200">Tarih</Label>
                    <Input
                      id="tarih"
                      type="date"
                      value={formData.tarih}
                      onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                      className="bg-zinc-800/50 border-zinc-700 text-white"
                      required
                      data-testid="tarih-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usd" className="text-zinc-200">USD Kuru (₺)</Label>
                    <Input
                      id="usd"
                      type="number"
                      step="0.0001"
                      value={formData.usd}
                      onChange={(e) => setFormData({ ...formData, usd: e.target.value })}
                      className="bg-zinc-800/50 border-zinc-700 text-white"
                      placeholder="34.5678"
                      required
                      data-testid="usd-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eur" className="text-zinc-200">EUR Kuru (₺)</Label>
                    <Input
                      id="eur"
                      type="number"
                      step="0.0001"
                      value={formData.eur}
                      onChange={(e) => setFormData({ ...formData, eur: e.target.value })}
                      className="bg-zinc-800/50 border-zinc-700 text-white"
                      placeholder="37.1234"
                      required
                      data-testid="eur-input"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      data-testid="cancel-button"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid="submit-button"
                    >
                      {editingRate ? 'Güncelle' : 'Kaydet'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-400">
              Yükleniyor...
            </div>
          ) : rates.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">
              Henüz kur kaydı bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableHead className="text-zinc-300">Tarih</TableHead>
                  <TableHead className="text-zinc-300">USD</TableHead>
                  <TableHead className="text-zinc-300">EUR</TableHead>
                  {isAdmin && <TableHead className="text-zinc-300 text-right">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id} className="border-zinc-800 hover:bg-zinc-800/30" data-testid={`rate-row-${rate.id}`}>
                    <TableCell className="text-white font-medium">
                      {new Date(rate.tarih).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-green-500 font-semibold">
                      ₺ {rate.usd.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-blue-500 font-semibold">
                      ₺ {rate.eur.toFixed(4)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(rate)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            data-testid={`edit-button-${rate.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => confirmDelete(rate.id)}
                            className="border-red-900/50 text-red-400 hover:bg-red-900/20"
                            data-testid={`delete-button-${rate.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Silme Onayı
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Bu kur kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" data-testid="delete-cancel-button">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingRateId)}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="delete-confirm-button"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Kurlar;