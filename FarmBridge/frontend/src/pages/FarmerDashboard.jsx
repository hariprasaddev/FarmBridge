import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function FarmerDashboard() {
  const { email } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {email?.split('@')[0] || 'Farmer'}!</h1>
        <p>Manage your farm and connect with buyers directly.</p>
      </div>

      <div className="dashboard-cards">
        <Link to="/farmer/profile" className="dash-card">
          <div className="dash-card-icon">👤</div>
          <div className="dash-card-content">
            <h3>My Profile</h3>
            <p>Create or update your farm profile</p>
          </div>
          <span className="dash-card-arrow">→</span>
        </Link>

        <Link to="/farmer/products" className="dash-card">
          <div className="dash-card-icon">📦</div>
          <div className="dash-card-content">
            <h3>My Products</h3>
            <p>Manage your product listings</p>
          </div>
          <span className="dash-card-arrow">→</span>
        </Link>

        <div className="dash-card disabled">
          <div className="dash-card-icon">📋</div>
          <div className="dash-card-content">
            <h3>Orders Received</h3>
            <p>View and manage buyer orders</p>
            <span className="coming-soon">Coming soon</span>
          </div>
        </div>
      </div>

      <div className="dashboard-quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-row">
          <Link to="/farmer/profile" className="btn btn-primary">
            {">"} Set Up Your Farm Profile
          </Link>
          <Link to="/farmer/products/add" className="btn btn-secondary">
            {">"} Add New Product
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;
