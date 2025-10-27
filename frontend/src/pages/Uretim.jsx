import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '@/components/MainLayout';
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
import { Plus, Edit, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Uretim = ({ user, setUser }) => {
  const [productions, setProductions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProductionId, setDeletingProductionId] = useState(null);
  const [editingProduction, setEditingProduction] = useState(null);
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    makine: 'Makine 1',
    kalinlik: '',
    en: '',
    boy: '',
    adet: '',
    masura_tipi: 'Masura 100',
    renk: 'Renksiz',
  });

  const token = localStorage.getItem('token');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProductions();
    fetchMaterials();
  }, []);

  const fetchProductions = async () => {
    try {
      const response = await axios.get(`${API}/uretim`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductions(response.data);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API}/hammadde`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials(response.data);
    } catch (error) {
      console.error('Hammaddeler yüklenirken hata:', error);
    }
  };

  const calculateMetrekare = () => {
    const en = parseFloat(formData.en) || 0;
    const boy = parseFloat(formData.boy) || 0;
    return ((en / 100) * boy).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        kalinlik: parseFloat(formData.kalinlik),
        en: parseFloat(formData.en),
        boy: parseFloat(formData.boy),
        adet: parseInt(formData.adet),
      };

      if (editingProduction) {
        await axios.put(`${API}/uretim/${editingProduction.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Üretim kaydı güncellendi');
      } else {
        await axios.post(`${API}/uretim`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Üretim kaydı eklendi');
      }

      setDialogOpen(false);
      resetForm();
      fetchProductions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/uretim/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Üretim kaydı silindi');
      fetchProductions();
      setDeleteDialogOpen(false);
      setDeletingProductionId(null);
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const confirmDelete = (id) => {
    setDeletingProductionId(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (production) => {
    setEditingProduction(production);
    setFormData({
      tarih: production.tarih,
      makine: production.makine,
      kalinlik: production.kalinlik.toString(),
      en: production.en.toString(),
      boy: production.boy.toString(),
      adet: production.adet.toString(),
      masura_tipi: production.masura_tipi,
      renk: production.renk,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      makine: 'Makine 1',
      kalinlik: '',
      en: '',
      boy: '',
      adet: '',
      masura_tipi: '',
      renk: 'Renksiz',
    });
    setEditingProduction(null);
  };

  return (
    <MainLayout user={user} setUser={setUser}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Üretim Yönetimi
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {productions.length} üretim kaydı bulunuyor
            </p>
          </div>

          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="add-production-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Üretim
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {editingProduction ? 'Üretim Düzenle' : 'Yeni Üretim Ekle'}
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
                      <Label htmlFor="makine" className="text-zinc-200">Makine</Label>
                      <Select
                        value={formData.makine}
                        onValueChange={(value) => setFormData({ ...formData, makine: value })}
                      >
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="makine-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="Makine 1">Makine 1</SelectItem>
                          <SelectItem value="Makine 2">Makine 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kalinlik" className="text-zinc-200">Kalınlık (mm)</Label>
                      <Input
                        id="kalinlik"
                        type="number"
                        step="0.01"
                        value={formData.kalinlik}
                        onChange={(e) => setFormData({ ...formData, kalinlik: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="0.00"
                        required
                        data-testid="kalinlik-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="en" className="text-zinc-200">En (cm)</Label>
                      <Input
                        id="en"
                        type="number"
                        step="0.01"
                        value={formData.en}
                        onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="0.00"
                        required
                        data-testid="en-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boy" className="text-zinc-200">Boy (m)</Label>
                      <Input
                        id="boy"
                        type="number"
                        step="0.01"
                        value={formData.boy}
                        onChange={(e) => setFormData({ ...formData, boy: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="0.00"
                        required
                        data-testid="boy-input"
                      />
                    </div>
                  </div>

                  {formData.en && formData.boy && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-400 text-sm font-medium">
                        Metrekare: {calculateMetrekare()} m²
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adet" className="text-zinc-200">Adet</Label>
                      <Input
                        id="adet"
                        type="number"
                        value={formData.adet}
                        onChange={(e) => setFormData({ ...formData, adet: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="0"
                        required
                        data-testid="adet-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="masura_tipi" className="text-zinc-200">Masura Tipi</Label>
                      <Select
                        value={formData.masura_tipi}
                        onValueChange={(value) => setFormData({ ...formData, masura_tipi: value })}
                      >
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="masura-select">
                          <SelectValue placeholder="Masura tipi seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="Masura 100">Masura 100</SelectItem>
                          <SelectItem value="Masura 120">Masura 120</SelectItem>
                          <SelectItem value="Masura 150">Masura 150</SelectItem>
                          <SelectItem value="Masura 200">Masura 200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renk" className="text-zinc-200">Renk (Hammadde)</Label>
                    <Select
                      value={formData.renk}
                      onValueChange={(value) => setFormData({ ...formData, renk: value })}
                    >
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="renk-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectItem value="Renksiz">Renksiz</SelectItem>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.malzeme}>
                            {material.malzeme}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      {editingProduction ? 'Güncelle' : 'Kaydet'}
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
          ) : productions.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">
              Henüz üretim kaydı bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableHead className="text-zinc-300">Tarih</TableHead>
                  <TableHead className="text-zinc-300">Makine</TableHead>
                  <TableHead className="text-zinc-300">Kalınlık</TableHead>
                  <TableHead className="text-zinc-300">En</TableHead>
                  <TableHead className="text-zinc-300">Boy</TableHead>
                  <TableHead className="text-zinc-300">m²</TableHead>
                  <TableHead className="text-zinc-300">Adet</TableHead>
                  <TableHead className="text-zinc-300">Masura</TableHead>
                  <TableHead className="text-zinc-300">Renk</TableHead>
                  {isAdmin && <TableHead className="text-zinc-300 text-right">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {productions.map((production) => (
                  <TableRow key={production.id} className="border-zinc-800 hover:bg-zinc-800/30" data-testid={`production-row-${production.id}`}>
                    <TableCell className="text-white">
                      {new Date(production.tarih).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-white">{production.makine}</TableCell>
                    <TableCell className="text-zinc-400">{production.kalinlik} mm</TableCell>
                    <TableCell className="text-zinc-400">{production.en} cm</TableCell>
                    <TableCell className="text-zinc-400">{production.boy} m</TableCell>
                    <TableCell className="text-green-500 font-semibold">{production.metrekare.toFixed(2)} m²</TableCell>
                    <TableCell className="text-white">{production.adet}</TableCell>
                    <TableCell className="text-zinc-400">{production.masura_tipi}</TableCell>
                    <TableCell className="text-white">
                      <span className={`px-2 py-1 rounded text-xs ${
                        production.renk === 'Renksiz' 
                          ? 'bg-zinc-700 text-zinc-300' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {production.renk}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(production)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            data-testid={`edit-button-${production.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => confirmDelete(production.id)}
                            className="border-red-900/50 text-red-400 hover:bg-red-900/20"
                            data-testid={`delete-button-${production.id}`}
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
                Bu üretim kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" data-testid="delete-cancel-button">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingProductionId)}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="delete-confirm-button"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Uretim;
