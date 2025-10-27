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
import { Plus, Edit, Trash2, Scissors } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Ebatlama = ({ user, setUser }) => {
  const [cuttings, setCuttings] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCuttingId, setDeletingCuttingId] = useState(null);
  const [editingCutting, setEditingCutting] = useState(null);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    production_id: '',
    ebat_kalinlik: '',
    ebat_en: '',
    ebat_boy: '',
    istenen_adet: '',
  });

  const token = localStorage.getItem('token');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchCuttings();
    fetchProductions();
  }, []);

  const fetchCuttings = async () => {
    try {
      const response = await axios.get(`${API}/ebatlama`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCuttings(response.data);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductions = async () => {
    try {
      const response = await axios.get(`${API}/uretim`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductions(response.data);
    } catch (error) {
      console.error('Üretimler yüklenirken hata:', error);
    }
  };

  const handleProductionChange = (productionId) => {
    const production = productions.find(p => p.id === productionId);
    setSelectedProduction(production);
    setFormData({ ...formData, production_id: productionId, ebat_kalinlik: production?.kalinlik.toString() || '' });
  };

  const calculateEbatMetrekare = () => {
    const en = parseFloat(formData.ebat_en) || 0;
    const boy = parseFloat(formData.ebat_boy) || 0;
    return ((en / 100) * (boy / 100)).toFixed(4);
  };

  const calculateCikanAdet = () => {
    if (!selectedProduction) return 0;
    const anaMetrekare = selectedProduction.metrekare;
    const ebatMetrekare = parseFloat(calculateEbatMetrekare());
    if (ebatMetrekare === 0) return 0;
    return Math.floor(anaMetrekare / ebatMetrekare);
  };

  const calculateTuketilenAnaUrun = () => {
    const cikanAdet = calculateCikanAdet();
    const istenenAdet = parseInt(formData.istenen_adet) || 0;
    if (cikanAdet === 0) return 0;
    return (istenenAdet / cikanAdet).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        tarih: formData.tarih,
        production_id: formData.production_id,
        ebat_kalinlik: parseFloat(formData.ebat_kalinlik),
        ebat_en: parseFloat(formData.ebat_en),
        ebat_boy: parseFloat(formData.ebat_boy),
        istenen_adet: parseInt(formData.istenen_adet),
      };

      if (editingCutting) {
        await axios.put(`${API}/ebatlama/${editingCutting.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Ebatlama kaydı güncellendi');
      } else {
        await axios.post(`${API}/ebatlama`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Ebatlama kaydı eklendi');
      }

      setDialogOpen(false);
      resetForm();
      fetchCuttings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/ebatlama/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Ebatlama kaydı silindi');
      fetchCuttings();
      setDeleteDialogOpen(false);
      setDeletingCuttingId(null);
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const confirmDelete = (id) => {
    setDeletingCuttingId(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (cutting) => {
    setEditingCutting(cutting);
    const production = productions.find(p => p.id === cutting.production_id);
    setSelectedProduction(production);
    setFormData({
      tarih: cutting.tarih,
      production_id: cutting.production_id,
      ebat_kalinlik: cutting.ebat_kalinlik.toString(),
      ebat_en: cutting.ebat_en.toString(),
      ebat_boy: cutting.ebat_boy.toString(),
      istenen_adet: cutting.istenen_adet.toString(),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      production_id: '',
      ebat_kalinlik: '',
      ebat_en: '',
      ebat_boy: '',
      istenen_adet: '',
    });
    setSelectedProduction(null);
    setEditingCutting(null);
  };

  return (
    <MainLayout user={user} setUser={setUser}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Ebatlama Yönetimi
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {cuttings.length} ebatlama kaydı bulunuyor
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
                  data-testid="add-cutting-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Ebatlama
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {editingCutting ? 'Ebatlama Düzenle' : 'Yeni Ebatlama Ekle'}
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

                  {/* Ana Üretim Malzemesi */}
                  <div className="space-y-2">
                    <Label className="text-zinc-200">Ana Üretim Malzemesi</Label>
                    <Select
                      value={formData.production_id}
                      onValueChange={handleProductionChange}
                    >
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="production-select">
                        <SelectValue placeholder="Üretim seçiniz" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                        {productions.map((prod) => (
                          <SelectItem key={prod.id} value={prod.id}>
                            {prod.kalinlik}mm x {prod.en}cm x {prod.boy}m = {prod.metrekare.toFixed(2)}m²
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProduction && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-semibold mb-2">Ana Ürün Bilgileri</h4>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-zinc-500">Kalınlık</p>
                          <p className="text-white font-medium">{selectedProduction.kalinlik} mm</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">En</p>
                          <p className="text-white font-medium">{selectedProduction.en} cm</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Boy</p>
                          <p className="text-white font-medium">{selectedProduction.boy} m</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Metrekare</p>
                          <p className="text-white font-medium">{selectedProduction.metrekare.toFixed(2)} m²</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ebatlanacak Ürün */}
                  <div className="border-t border-zinc-700 pt-4">
                    <h4 className="text-white font-semibold mb-3">Ebatlanacak Ürün</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ebat_kalinlik" className="text-zinc-200">Kalınlık (mm)</Label>
                        <Input
                          id="ebat_kalinlik"
                          type="number"
                          step="0.01"
                          value={formData.ebat_kalinlik}
                          onChange={(e) => setFormData({ ...formData, ebat_kalinlik: e.target.value })}
                          className="bg-zinc-800/50 border-zinc-700 text-white"
                          placeholder="0.00"
                          required
                          data-testid="ebat-kalinlik-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ebat_en" className="text-zinc-200">En (cm)</Label>
                        <Input
                          id="ebat_en"
                          type="number"
                          step="0.01"
                          value={formData.ebat_en}
                          onChange={(e) => setFormData({ ...formData, ebat_en: e.target.value })}
                          className="bg-zinc-800/50 border-zinc-700 text-white"
                          placeholder="0.00"
                          required
                          data-testid="ebat-en-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ebat_boy" className="text-zinc-200">Boy (cm)</Label>
                        <Input
                          id="ebat_boy"
                          type="number"
                          step="0.01"
                          value={formData.ebat_boy}
                          onChange={(e) => setFormData({ ...formData, ebat_boy: e.target.value })}
                          className="bg-zinc-800/50 border-zinc-700 text-white"
                          placeholder="0.00"
                          required
                          data-testid="ebat-boy-input"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor="istenen_adet" className="text-zinc-200">İstenen Adet</Label>
                      <Input
                        id="istenen_adet"
                        type="number"
                        value={formData.istenen_adet}
                        onChange={(e) => setFormData({ ...formData, istenen_adet: e.target.value })}
                        className="bg-zinc-800/50 border-zinc-700 text-white"
                        placeholder="Kaç adet istiyorsunuz?"
                        required
                        data-testid="istenen-adet-input"
                      />
                    </div>
                  </div>

                  {formData.ebat_en && formData.ebat_boy && formData.istenen_adet && selectedProduction && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Tek Parça m²</p>
                          <p className="text-green-400 text-xl font-bold">{calculateEbatMetrekare()} m²</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Tek Ana Üründen</p>
                          <p className="text-blue-400 text-xl font-bold">{calculateCikanAdet()} adet</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Tüketilecek Ana Ürün</p>
                          <p className="text-orange-400 text-xl font-bold">{calculateTuketilenAnaUrun()} adet</p>
                        </div>
                      </div>
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
                      {editingCutting ? 'Güncelle' : 'Kaydet'}
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
          ) : cuttings.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">
              Henüz ebatlama kaydı bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableHead className="text-zinc-300">Tarih</TableHead>
                  <TableHead className="text-zinc-300">Ana Ürün</TableHead>
                  <TableHead className="text-zinc-300">Ebat</TableHead>
                  <TableHead className="text-zinc-300">Ebat m²</TableHead>
                  <TableHead className="text-zinc-300">İstenen Adet</TableHead>
                  <TableHead className="text-zinc-300">Tek Ana Üründen</TableHead>
                  <TableHead className="text-zinc-300">Tüketilen Ana Ürün</TableHead>
                  {isAdmin && <TableHead className="text-zinc-300 text-right">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuttings.map((cutting) => (
                  <TableRow key={cutting.id} className="border-zinc-800 hover:bg-zinc-800/30" data-testid={`cutting-row-${cutting.id}`}>
                    <TableCell className="text-white">
                      {new Date(cutting.tarih).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-blue-400 font-semibold text-sm">
                      {cutting.production_name}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {cutting.ebat_kalinlik}mm x {cutting.ebat_en}cm x {cutting.ebat_boy}cm
                    </TableCell>
                    <TableCell className="text-purple-400 font-semibold">{cutting.ebat_metrekare.toFixed(4)} m²</TableCell>
                    <TableCell className="text-white font-bold">{cutting.istenen_adet} adet</TableCell>
                    <TableCell className="text-green-500 font-semibold">{cutting.tek_parça_cikan_adet} adet</TableCell>
                    <TableCell className="text-orange-500 font-bold text-lg">{cutting.tuketilen_ana_urun.toFixed(2)} adet</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(cutting)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            data-testid={`edit-button-${cutting.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => confirmDelete(cutting.id)}
                            className="border-red-900/50 text-red-400 hover:bg-red-900/20"
                            data-testid={`delete-button-${cutting.id}`}
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
                Bu ebatlama kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" data-testid="delete-cancel-button">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingCuttingId)}
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

export default Ebatlama;
