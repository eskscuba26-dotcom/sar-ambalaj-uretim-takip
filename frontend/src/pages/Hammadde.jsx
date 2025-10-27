import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Edit, Trash2, LogOut, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Hammadde = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({ usd: 1, eur: 1 });
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    malzeme: '',
    birim: 'kg',
    miktar: '',
    para_birimi: 'TL',
    birim_fiyat: '',
  });

  const token = localStorage.getItem('token');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchMaterials();
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await axios.get(`${API}/kurlar/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExchangeRates(response.data);
    } catch (error) {
      console.error('Kurlar yüklenirken hata:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API}/hammadde`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials(response.data);
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
        miktar: parseFloat(formData.miktar),
        birim_fiyat: parseFloat(formData.birim_fiyat),
      };

      if (editingMaterial) {
        await axios.put(`${API}/hammadde/${editingMaterial.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Hammadde güncellendi');
      } else {
        await axios.post(`${API}/hammadde`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Hammadde eklendi');
      }

      setDialogOpen(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/hammadde/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Hammadde silindi');
      fetchMaterials();
      setDeleteDialogOpen(false);
      setDeletingMaterialId(null);
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const confirmDelete = (id) => {
    setDeletingMaterialId(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      tarih: material.tarih,
      malzeme: material.malzeme,
      birim: material.birim,
      miktar: material.miktar.toString(),
      para_birimi: material.para_birimi,
      birim_fiyat: material.birim_fiyat.toString(),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      malzeme: '',
      birim: 'kg',
      miktar: '',
      para_birimi: 'TL',
      birim_fiyat: '',
    });
    setEditingMaterial(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const calculateTotalInTL = (material) => {
    const total = material.miktar * material.birim_fiyat;
    if (material.para_birimi === 'USD') {
      return total * exchangeRates.usd;
    } else if (material.para_birimi === 'EUR') {
      return total * exchangeRates.eur;
    }
    return total;
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
              <p className="text-xs text-zinc-400">Hammadde Takip</p>
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
                Hammadde Yönetimi
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                {materials.length} kayıt bulunuyor
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
                  data-testid="add-material-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Hammadde
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {editingMaterial ? 'Hammadde Düzenle' : 'Yeni Hammadde Ekle'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="malzeme" className="text-zinc-200">Malzeme Adı</Label>
                      <Input
                        id="malzeme"
                        value={formData.malzeme}
                        onChange={(e) => setFormData({ ...formData, malzeme: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="Malzeme adını giriniz"
                        required
                        data-testid="malzeme-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birim" className="text-zinc-200">Birim</Label>
                      <Select
                        value={formData.birim}
                        onValueChange={(value) => setFormData({ ...formData, birim: value })}
                      >
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="birim-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="kg">Kilogram (kg)</SelectItem>
                          <SelectItem value="adet">Adet</SelectItem>
                          <SelectItem value="litre">Litre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="miktar" className="text-zinc-200">Miktar</Label>
                      <Input
                        id="miktar"
                        type="number"
                        step="0.01"
                        value={formData.miktar}
                        onChange={(e) => setFormData({ ...formData, miktar: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="0.00"
                        required
                        data-testid="miktar-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="para_birimi" className="text-zinc-200">Para Birimi</Label>
                      <Select
                        value={formData.para_birimi}
                        onValueChange={(value) => setFormData({ ...formData, para_birimi: value })}
                      >
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="para-birimi-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="TL">Türk Lirası (TL)</SelectItem>
                          <SelectItem value="USD">Dolar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birim_fiyat" className="text-zinc-200">Birim Fiyat</Label>
                      <Input
                        id="birim_fiyat"
                        type="number"
                        step="0.01"
                        value={formData.birim_fiyat}
                        onChange={(e) => setFormData({ ...formData, birim_fiyat: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="0.00"
                        required
                        data-testid="birim-fiyat-input"
                      />
                    </div>
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
                      {editingMaterial ? 'Güncelle' : 'Kaydet'}
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
          ) : materials.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">
              Henüz hammadde kaydı bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableHead className="text-zinc-300">Tarih</TableHead>
                  <TableHead className="text-zinc-300">Malzeme</TableHead>
                  <TableHead className="text-zinc-300">Miktar</TableHead>
                  <TableHead className="text-zinc-300">Birim</TableHead>
                  <TableHead className="text-zinc-300">Birim Fiyat</TableHead>
                  <TableHead className="text-zinc-300">Para Birimi</TableHead>
                  <TableHead className="text-zinc-300">Toplam</TableHead>
                  {isAdmin && <TableHead className="text-zinc-300 text-right">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id} className="border-zinc-800 hover:bg-zinc-800/30" data-testid={`material-row-${material.id}`}>
                    <TableCell className="text-white">
                      {new Date(material.tarih).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-white font-medium">{material.malzeme}</TableCell>
                    <TableCell className="text-white">{material.miktar}</TableCell>
                    <TableCell className="text-zinc-400">{material.birim}</TableCell>
                    <TableCell className="text-white">
                      {material.birim_fiyat.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-zinc-400">{material.para_birimi}</TableCell>
                    <TableCell className="text-green-500 font-semibold">
                      {(material.miktar * material.birim_fiyat).toFixed(2)} {material.para_birimi}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(material)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            data-testid={`edit-button-${material.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => confirmDelete(material.id)}
                            className="border-red-900/50 text-red-400 hover:bg-red-900/20"
                            data-testid={`delete-button-${material.id}`}
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
                Bu hammadde kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" data-testid="delete-cancel-button">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingMaterialId)}
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

export default Hammadde;