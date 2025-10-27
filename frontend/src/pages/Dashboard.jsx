import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '@/components/MainLayout';
import { Package, Factory, TrendingUp, Boxes } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, setUser }) => {
  const [materials, setMaterials] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, productionsRes] = await Promise.all([
        axios.get(`${API}/hammadde`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/uretim`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMaterials(materialsRes.data);
      setProductions(productionsRes.data);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hammaddeleri gruplara ayır ve topla
  const getMaterialStock = () => {
    const stockMap = {};
    materials.forEach((mat) => {
      if (stockMap[mat.malzeme]) {
        stockMap[mat.malzeme] += mat.miktar;
      } else {
        stockMap[mat.malzeme] = mat.miktar;
      }
    });
    return Object.entries(stockMap).map(([name, quantity]) => ({
      name,
      quantity,
    }));
  };

  const materialStock = getMaterialStock();

  return (
    <MainLayout user={user} setUser={setUser}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Hoş Geldiniz
          </h2>
          <p className="text-zinc-400">
            Genel durum özeti ve stok bilgileri
          </p>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400 py-12">Yükleniyor...</div>
        ) : (
          <div className="space-y-8">
            {/* Hammadde Stokları */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Package className="h-6 w-6 text-green-500" />
                <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Hammadde Stokları
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {materialStock.length === 0 ? (
                  <div className="col-span-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
                    Henüz hammadde kaydı bulunmamaktadır.
                  </div>
                ) : (
                  materialStock.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300"
                      data-testid={`stock-card-${item.name}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Boxes className="h-5 w-5 text-green-500" />
                      </div>
                      <h4 className="text-white font-semibold text-lg mb-2">{item.name}</h4>
                      <p className="text-3xl font-bold text-green-400">
                        {item.quantity.toLocaleString('tr-TR')}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">kg</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Üretim İstatistikleri */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Factory className="h-6 w-6 text-blue-500" />
                <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Üretim İstatistikleri
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <h4 className="text-zinc-300 text-sm mb-2">Toplam Üretim</h4>
                  <p className="text-3xl font-bold text-blue-400">
                    {productions.length}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">kayıt</p>
                </div>

                <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Package className="h-5 w-5 text-green-400" />
                  </div>
                  <h4 className="text-zinc-300 text-sm mb-2">Toplam Adet</h4>
                  <p className="text-3xl font-bold text-green-400">
                    {productions.reduce((sum, prod) => sum + prod.adet, 0).toLocaleString('tr-TR')}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">adet</p>
                </div>

                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Factory className="h-5 w-5 text-purple-400" />
                  </div>
                  <h4 className="text-zinc-300 text-sm mb-2">Toplam m²</h4>
                  <p className="text-3xl font-bold text-purple-400">
                    {productions.reduce((sum, prod) => sum + prod.metrekare, 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">metrekare</p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 border-dashed rounded-xl p-6 flex items-center justify-center">
                  <p className="text-zinc-600 text-sm text-center">
                    Stok bilgileri<br />yakında eklenecek
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;