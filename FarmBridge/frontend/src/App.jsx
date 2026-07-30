import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerProfilePage from './pages/FarmerProfilePage';
import ProductsPage from './pages/ProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import './App.css';

function App() {
  const { token } = useAuth();

  return (
    <div className="app">
      {token && <Navbar />}
      <main className={token ? 'main-content' : 'main-content public'}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={token ? <Navigate to={getDefaultRoute()} /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={token ? <Navigate to={getDefaultRoute()} /> : <RegisterPage />}
          />

          {/* Farmer routes */}
          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute role="FARMER">
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/profile"
            element={
              <ProtectedRoute role="FARMER">
                <FarmerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/products"
            element={
              <ProtectedRoute role="FARMER">
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/products/add"
            element={
              <ProtectedRoute role="FARMER">
                <AddProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/products/edit/:id"
            element={
              <ProtectedRoute role="FARMER">
                <EditProductPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to={token ? getDefaultRoute() : '/login'} />} />
          <Route path="*" element={<Navigate to={token ? getDefaultRoute() : '/login'} />} />
        </Routes>
      </main>
    </div>
  );
}

function getDefaultRoute() {
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');
  if (role === 'FARMER') return '/farmer/dashboard';
  if (role === 'BUYER') return '/buyer/products';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/login';
}

export default App;
