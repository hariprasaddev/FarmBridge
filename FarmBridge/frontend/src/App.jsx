import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/ui/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerProfilePage from './pages/FarmerProfilePage';
import FarmerVerificationPage from './pages/FarmerVerificationPage';
import ProductsPage from './pages/ProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import BuyerProductsPage from './pages/BuyerProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import BuyerWishlistPage from './pages/BuyerWishlistPage';
import BuyerOrdersPage from './pages/BuyerOrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import FarmerOrdersPage from './pages/FarmerOrdersPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminVerificationPage from './pages/AdminVerificationPage';
import './App.css';

function App() {
  const { token, loading } = useAuth();

  // Wait for the auth session to hydrate from storage before choosing which
  // route tree to render — otherwise a full reload on a protected URL (e.g.
  // /buyer/products) hits the public catch-all and bounces to /login.
  if (loading) {
    return (
      <div className="app">
        <main className="main-content public">
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading FarmBridge…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {token ? (
        <AppLayout>
          <Routes>
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
            path="/farmer/verification"
            element={
              <ProtectedRoute role="FARMER">
                <FarmerVerificationPage />
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
          <Route
            path="/farmer/orders"
            element={
              <ProtectedRoute role="FARMER">
                <FarmerOrdersPage />
              </ProtectedRoute>
            }
          />

          {/* Buyer routes */}
          <Route
            path="/buyer/dashboard"
            element={
              <ProtectedRoute role="BUYER">
                <BuyerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/products"
            element={
              <ProtectedRoute role="BUYER">
                <BuyerProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/products/:id"
            element={
              <ProtectedRoute role="BUYER">
                <ProductDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/wishlist"
            element={
              <ProtectedRoute role="BUYER">
                <BuyerWishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/orders"
            element={
              <ProtectedRoute role="BUYER">
                <BuyerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verification"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminVerificationPage />
              </ProtectedRoute>
            }
          />
          {/* Default redirect */}
          <Route path="/" element={<Navigate to={token ? getDefaultRoute() : '/login'} />} />
          <Route path="*" element={<Navigate to={token ? getDefaultRoute() : '/login'} />} />
          </Routes>
        </AppLayout>
      ) : (
        <main className="main-content public">
          <Routes>
            <Route
              path="/login"
              element={token ? <Navigate to={getDefaultRoute()} /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={token ? <Navigate to={getDefaultRoute()} /> : <RegisterPage />}
            />
            <Route
              path="/forgot-password"
              element={
                token ? <Navigate to={getDefaultRoute()} /> : <ForgotPasswordPage />
              }
            />
            <Route
              path="/reset-password"
              element={
                token ? <Navigate to={getDefaultRoute()} /> : <ResetPasswordPage />
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      )}
    </div>
  );
}

function getDefaultRoute() {
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');
  if (role === 'FARMER') return '/farmer/dashboard';
  if (role === 'BUYER') return '/buyer/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/login';
}

export default App;
