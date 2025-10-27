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
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Stok = ({ user, setUser }) => {
  const [stocks, setStocks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStockId, setDeletingStockId] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    tip: 'kesilmemis',
    model_adi: '',
    kalinlik: '',
    en: '',
    boy: '',
    renk: 'Renksiz',
    adet: '',
  });

  const token = localStorage.getItem('token');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchStocks();
    fetchMaterials();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API}/stok`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStocks(response.data);
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
    if (formData.tip === 'kesilmemis') {
      // boy in meters
      return ((en / 100) * boy).toFixed(2);
    } else {
      // boy in cm
      return ((en / 100) * (boy / 100)).toFixed(4);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        tarih: formData.tarih,
        tip: formData.tip,
        model_adi: formData.tip === 'kesilmemis' ? formData.model_adi : null,
        kalinlik: parseFloat(formData.kalinlik),
        en: parseFloat(formData.en),
        boy: parseFloat(formData.boy),
        renk: formData.tip === 'kesilmemis' ? formData.renk : null,
        adet: parseInt(formData.adet),
      };

      if (editingStock) {
        await axios.put(`${API}/stok/${editingStock.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Stok kaydı güncellendi');
      } else {
        await axios.post(`${API}/stok`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Stok kaydı eklendi');
      }

      setDialogOpen(false);
      resetForm();
      fetchStocks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/stok/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Stok kaydı silindi');
      fetchStocks();
      setDeleteDialogOpen(false);
      setDeletingStockId(null);
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const confirmDelete = (id) => {
    setDeletingStockId(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      tarih: stock.tarih,
      tip: stock.tip,
      model_adi: stock.model_adi || '',
      kalinlik: stock.kalinlik.toString(),
      en: stock.en.toString(),
      boy: stock.boy.toString(),
      renk: stock.renk || 'Renksiz',
      adet: stock.adet.toString(),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      tip: 'kesilmemis',
      model_adi: '',
      kalinlik: '',
      en: '',
      boy: '',
      renk: 'Renksiz',
      adet: '',
    });
    setEditingStock(null);
  };

  const kesilmemisStocks = stocks.filter(s => s.tip === 'kesilmemis');
  const kesilmisStocks = stocks.filter(s => s.tip === 'kesilmis');

  return (
    <MainLayout user={user} setUser={setUser}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Stok Yönetimi
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {stocks.length} stok kaydı bulunuyor
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
                  data-testid="add-stock-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Stok
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {editingStock ? 'Stok Düzenle' : 'Yeni Stok Ekle'}
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
                      <Label htmlFor="tip" className="text-zinc-200">Tip</Label>
                      <Select
                        value={formData.tip}
                        onValueChange={(value) => setFormData({ ...formData, tip: value })}
                      >
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="tip-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="kesilmemis">Kesilmemiş (Ana Ürün)</SelectItem>
                          <SelectItem value="kesilmis">Kesilmiş (Ebatlama)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.tip === 'kesilmemis' && (
                    <div className="space-y-2">
                      <Label htmlFor="model_adi" className="text-zinc-200">Model Adı</Label>
                      <Input
                        id="model_adi"
                        value={formData.model_adi}
                        onChange={(e) => setFormData({ ...formData, model_adi: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="Model adını giriniz"
                        required
                        data-testid="model-adi-input"
                      />
                    </div>
                  )}

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
                      <Label htmlFor="boy" className="text-zinc-200">
                        Boy ({formData.tip === 'kesilmemis' ? 'm' : 'cm'})
                      </Label>
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

                  {formData.tip === 'kesilmemis' && (
                    <div className="space-y-2">
                      <Label htmlFor="renk" className="text-zinc-200">Renk</Label>
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
                  )}

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

                  {formData.en && formData.boy && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-400 text-sm font-medium">
                        Metrekare: {calculateMetrekare()} m²
                      </p>
                    </div>
                  )}

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
                      {editingStock ? 'Güncelle' : 'Kaydet'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-8">
          {/* Kesilmemiş Stok */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Kesilmemiş Stok (Ana Ürün)
            </h3>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-zinc-400">Yükleniyor...</div>
              ) : kesilmemisStocks.length === 0 ? (
                <div className="p-8 text-center text-zinc-400">Henüz kesilmemiş stok kaydı bulunmamaktadır.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
                      <TableHead className="text-zinc-300">Tarih</TableHead>
                      <TableHead className="text-zinc-300">Model Adı</TableHead>
                      <TableHead className="text-zinc-300">Boyut</TableHead>
                      <TableHead className="text-zinc-300">m²</TableHead>
                      <TableHead className="text-zinc-300">Renk</TableHead>
                      <TableHead className="text-zinc-300">Adet</TableHead>
                      {isAdmin && <TableHead className="text-zinc-300 text-right">İşlemler</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kesilmemisStocks.map((stock) => (
                      <TableRow key={stock.id} className="border-zinc-800 hover:bg-zinc-800/30">
                        <TableCell className="text-white">{new Date(stock.tarih).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell className="text-white font-semibold">{stock.model_adi}</TableCell>
                        <TableCell className="text-zinc-400 text-sm">{stock.kalinlik}mm x {stock.en}cm x {stock.boy}m</TableCell>
                        <TableCell className="text-blue-400 font-semibold">{stock.metrekare.toFixed(2)} m²</TableCell>
                        <TableCell className="text-white">
                          <span className={`px-2 py-1 rounded text-xs ${stock.renk === 'Renksiz' ? 'bg-zinc-700 text-zinc-300' : 'bg-blue-500/20 text-blue-400'}`}>
                            {stock.renk}
                          </span>
                        </TableCell>
                        <TableCell className="text-green-500 font-bold text-lg">{stock.adet} adet</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(stock)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => confirmDelete(stock.id)} className="border-red-900/50 text-red-400 hover:bg-red-900/20">
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
          </div>

          {/* Kesilmiş Stok */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Kesilmiş Stok (Ebatlama)
            </h3>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-zinc-400">Yükleniyor...</div>
              ) : kesilmisStocks.length === 0 ? (
                <div className="p-8 text-center text-zinc-400">Henüz kesilmiş stok kaydı bulunmamaktadır.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
                      <TableHead className="text-zinc-300">Tarih</TableHead>
                      <TableHead className="text-zinc-300">Boyut</TableHead>
                      <TableHead className="text-zinc-300">m²</TableHead>
                      <TableHead className="text-zinc-300">Adet</TableHead>
                      {isAdmin && <TableHead className="text-zinc-300 text-right">İşlemler</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kesilmisStocks.map((stock) => (
                      <TableRow key={stock.id} className="border-zinc-800 hover:bg-zinc-800/30">
                        <TableCell className="text-white">{new Date(stock.tarih).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell className="text-zinc-400 text-sm">{stock.kalinlik}mm x {stock.en}cm x {stock.boy}cm</TableCell>
                        <TableCell className="text-purple-400 font-semibold">{stock.metrekare.toFixed(4)} m²</TableCell>
                        <TableCell className="text-orange-500 font-bold text-lg">{stock.adet} adet</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(stock)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => confirmDelete(stock.id)} className="border-red-900/50 text-red-400 hover:bg-red-900/20">
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
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Silme Onayı
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Bu stok kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" data-testid="delete-cancel-button">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingStockId)}
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

export default Stok;
