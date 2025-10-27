import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Hammadde from './pages/Hammadde';
import UserManagement from './pages/UserManagement';
import Kurlar from './pages/Kurlar';
import Uretim from './pages/Uretim';
import Ebatlama from './pages/Ebatlama';
import '@/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />}
        />
        <Route
          path="/hammadde"
          element={user ? <Hammadde user={user} setUser={setUser} /> : <Navigate to="/login" />}
        />
        <Route
          path="/kullanicilar"
          element={user ? <UserManagement user={user} setUser={setUser} /> : <Navigate to="/login" />}
        />
        <Route
          path="/kurlar"
          element={user ? <Kurlar user={user} setUser={setUser} /> : <Navigate to="/login" />}
        />
        <Route
          path="/uretim"
          element={user ? <Uretim user={user} setUser={setUser} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;