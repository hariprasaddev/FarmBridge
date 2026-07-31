import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function AdminVerificationPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getUnverifiedFarmers();
      setFarmers(response.data);
    } catch (err) {
      setError('Failed to load farmers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (profileId) => {
    setVerifying(profileId);
    setError('');
    setSuccess('');

    try {
      await adminAPI.verifyFarmer(profileId);
      setFarmers((prev) => prev.filter((f) => f.profileId !== profileId));
      setSuccess('Farmer profile verified successfully');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to verify farmer';
      setError(
        typeof message === 'string' ? message : 'Failed to verify farmer'
      );
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading farmers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container admin-page">
      <div className="orders-page">
        <div className="products-header">
          <div>
            <h1>Farmer Verification</h1>
            <p className="products-subtitle">
              Review and verify farmer identities
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {farmers.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">✅</div>
            <h3>All caught up!</h3>
            <p>There are no farmers awaiting verification.</p>
          </div>
        ) : (
          <div className="verification-list">
            {farmers.map((farmer) => (
              <div key={farmer.profileId} className="verification-card">
                <div className="verification-avatar">👨‍🌾</div>
                <div className="verification-info">
                  <div className="verification-name">
                    {farmer.farmName}
                    <span className="verification-farmer">
                      {farmer.farmerName}
                    </span>
                  </div>
                  <div className="verification-details">
                    <span>📧 {farmer.email}</span>
                    <span>📍 {farmer.location}</span>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleVerify(farmer.profileId)}
                  disabled={verifying === farmer.profileId}
                >
                  {verifying === farmer.profileId
                    ? 'Verifying...'
                    : '✓ Verify'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminVerificationPage;
