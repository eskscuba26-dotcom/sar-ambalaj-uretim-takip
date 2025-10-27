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
import { Plus, Edit, Trash2, LogOut, ArrowLeft, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserManagement = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
  });

  const token = localStorage.getItem('token');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingUser && !formData.password) {
      toast.error('Şifre gerekli');
      return;
    }

    try {
      const payload = {
        username: formData.username,
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUser) {
        await axios.put(`${API}/users/${editingUser.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kullanıcı güncellendi');
      } else {
        await axios.post(`${API}/users`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kullanıcı oluşturuldu');
      }

      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Kullanıcı silindi');
      fetchUsers();
      setDeleteDialogOpen(false);
      setDeletingUserId(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    }
  };

  const confirmDelete = (id) => {
    setDeletingUserId(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (usr) => {
    setEditingUser(usr);
    setFormData({
      username: usr.username,
      password: '',
      role: usr.role,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'viewer',
    });
    setEditingUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
          Yönetici
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
        Gözlemci
      </span>
    );
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
              <p className="text-xs text-zinc-400">Kullanıcı Yönetimi</p>
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
                Kullanıcı Yönetimi
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                {users.length} kullanıcı bulunuyor
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="add-user-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kullanıcı
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-zinc-200">Kullanıcı Adı</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                    placeholder="Kullanıcı adını giriniz"
                    required
                    data-testid="username-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-200">
                    {editingUser ? 'Yeni Şifre (boş bırakılabilir)' : 'Şifre'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                    placeholder="Şifre giriniz"
                    required={!editingUser}
                    data-testid="password-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-zinc-200">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white" data-testid="role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="admin">Yönetici (Admin)</SelectItem>
                      <SelectItem value="viewer">Gözlemci (Viewer)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500">
                    {formData.role === 'admin' 
                      ? 'Tüm yetkilere sahip olur (ekleme, düzenleme, silme)' 
                      : 'Sadece görüntüleme yetkisi olur'}
                  </p>
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
                    {editingUser ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-400">
              Yükleniyor...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">
              Henüz kullanıcı bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableHead className="text-zinc-300">Kullanıcı Adı</TableHead>
                  <TableHead className="text-zinc-300">Rol</TableHead>
                  <TableHead className="text-zinc-300 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((usr) => (
                  <TableRow key={usr.id} className="border-zinc-800 hover:bg-zinc-800/30" data-testid={`user-row-${usr.id}`}>
                    <TableCell className="text-white font-medium">{usr.username}</TableCell>
                    <TableCell className="text-white">
                      {getRoleBadge(usr.role)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(usr)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          data-testid={`edit-button-${usr.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => confirmDelete(usr.id)}
                          className="border-red-900/50 text-red-400 hover:bg-red-900/20"
                          disabled={usr.id === user.id}
                          data-testid={`delete-button-${usr.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
                Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" data-testid="delete-cancel-button">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingUserId)}
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

export default UserManagement;