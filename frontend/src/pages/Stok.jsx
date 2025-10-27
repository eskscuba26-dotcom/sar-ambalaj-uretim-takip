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

  // Üretimden kesilmemiş stokları grupla ve ebatlamada tüketilenleri düş
  const getKesilmemisStocks = () => {
    const stockMap = {};
    
    // Önce üretimlerden topla
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
    
    // Sonra ebatlamada tüketilenleri düş
    cuttings.forEach((cut) => {
      // Ana üretimden tüketilen miktarı bul
      const anaProd = productions.find(p => p.id === cut.production_id);
      if (anaProd) {
        const key = `${anaProd.kalinlik}-${anaProd.en}-${anaProd.boy}-${anaProd.renk}`;
        if (stockMap[key]) {
          stockMap[key].adet -= cut.tuketilen_ana_urun;
        }
      }
    });
    
    return Object.values(stockMap).filter(s => s.adet > 0);
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
                      <TableHead className="text-zinc-300">Boyut</TableHead>
                      <TableHead className="text-zinc-300">m²</TableHead>
                      <TableHead className="text-zinc-300">Renk</TableHead>
                      <TableHead className="text-zinc-300">Toplam Adet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kesilmisStocks.map((stock, index) => (
                      <TableRow key={index} className="border-zinc-800 hover:bg-zinc-800/30">
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Stok;
