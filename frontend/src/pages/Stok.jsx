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
  const [productions, setProductions] = useState([]);
  const [cuttings, setCuttings] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productionsRes, cuttingsRes] = await Promise.all([
        axios.get(`${API}/uretim`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/ebatlama`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setProductions(productionsRes.data);
      setCuttings(cuttingsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Üretimden kesilmemiş stokları grupla
  const getKesilmemisStocks = () => {
    const stockMap = {};
    productions.forEach((prod) => {
      const key = `${prod.kalinlik}-${prod.en}-${prod.boy}-${prod.renk}`;
      if (stockMap[key]) {
        stockMap[key].adet += prod.adet;
      } else {
        stockMap[key] = {
          kalinlik: prod.kalinlik,
          en: prod.en,
          boy: prod.boy,
          metrekare: prod.metrekare,
          renk: prod.renk,
          adet: prod.adet,
        };
      }
    });
    return Object.values(stockMap);
  };

  // Ebatlamadan kesilmiş stokları grupla
  const getKesilmisStocks = () => {
    const stockMap = {};
    cuttings.forEach((cut) => {
      const key = `${cut.ebat_kalinlik}-${cut.ebat_en}-${cut.ebat_boy}`;
      if (stockMap[key]) {
        stockMap[key].adet += cut.istenen_adet;
      } else {
        // Ana üretimden renk bilgisini al
        const anaProd = productions.find(p => p.id === cut.production_id);
        stockMap[key] = {
          kalinlik: cut.ebat_kalinlik,
          en: cut.ebat_en,
          boy: cut.ebat_boy,
          metrekare: cut.ebat_metrekare,
          renk: anaProd?.renk || 'Renksiz',
          adet: cut.istenen_adet,
        };
      }
    });
    return Object.values(stockMap);
  };

  const kesilmemisStocks = getKesilmemisStocks();
  const kesilmisStocks = getKesilmisStocks();

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
              Üretim ve Ebatlamadan Otomatik Güncelleniyor
            </p>
          </div>
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
                      <TableHead className="text-zinc-300">Boyut</TableHead>
                      <TableHead className="text-zinc-300">m²</TableHead>
                      <TableHead className="text-zinc-300">Renk</TableHead>
                      <TableHead className="text-zinc-300">Toplam Adet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kesilmemisStocks.map((stock, index) => (
                      <TableRow key={index} className="border-zinc-800 hover:bg-zinc-800/30">
                        <TableCell className="text-zinc-400 text-sm">{stock.kalinlik}mm x {stock.en}cm x {stock.boy}m</TableCell>
                        <TableCell className="text-blue-400 font-semibold">{stock.metrekare.toFixed(2)} m²</TableCell>
                        <TableCell className="text-white">
                          <span className={`px-2 py-1 rounded text-xs ${stock.renk === 'Renksiz' ? 'bg-zinc-700 text-zinc-300' : 'bg-blue-500/20 text-blue-400'}`}>
                            {stock.renk}
                          </span>
                        </TableCell>
                        <TableCell className="text-green-500 font-bold text-lg">{stock.adet} adet</TableCell>
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
                      <TableHead className="text-zinc-300">Renk</TableHead>
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
                        <TableCell className="text-white">
                          {stock.renk ? (
                            <span className={`px-2 py-1 rounded text-xs ${stock.renk === 'Renksiz' ? 'bg-zinc-700 text-zinc-300' : 'bg-blue-500/20 text-blue-400'}`}>
                              {stock.renk}
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-xs">-</span>
                          )}
                        </TableCell>
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
