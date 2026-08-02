import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import AdminLayout from '../components/AdminLayout';
import './AdminPages.css';
import './AdminVerificationPage.css';

// Presentation helper — initials derived from the farmer name.
const getInitials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

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
      setError(getErrorMessage(err, 'Failed to load the pending farmers. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (profileId) => {
    if (!window.confirm('Verify this farmer profile?')) {
      return;
    }

    setVerifying(profileId);
    setError('');
    setSuccess('');

    try {
      await adminAPI.verifyFarmer(profileId);
      setFarmers((prev) => prev.filter((f) => f.profileId !== profileId));
      setSuccess('Farmer profile verified successfully');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to verify the farmer. Please try again.'));
    } finally {
      setVerifying(null);
    }
  };

  return (
    <AdminLayout title="Farmer Verification" subtitle="Review and verify farmer identities">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="av-list" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="av-skeleton-card">
              <div className="av-skeleton-avatar" />
              <div className="av-skeleton-lines">
                <div className="av-skeleton-line av-skeleton-line--lg" />
                <div className="av-skeleton-line av-skeleton-line--sm" />
              </div>
              <div className="av-skeleton-btn" />
            </div>
          ))}
        </div>
      ) : farmers.length === 0 ? (
        <div className="adm-table-card">
          <div className="adm-empty">
            <span className="adm-empty-icon">
              <Icon name="badgeCheck" size={28} />
            </span>
            <h2>All caught up!</h2>
            <p>There are no farmers awaiting verification.</p>
          </div>
        </div>
      ) : (
        <div className="av-list">
          {farmers.map((farmer) => (
            <div key={farmer.profileId} className="av-card">
              <span className="av-avatar">
                {getInitials(farmer.farmerName || farmer.farmName)}
              </span>

              <div className="av-info">
                <div className="av-name">
                  {farmer.farmName}
                  <span className="av-farmer">{farmer.farmerName}</span>
                </div>
                <div className="av-meta">
                  <span>
                    <Icon name="mail" size={13} />
                    {farmer.email}
                  </span>
                  {farmer.location && (
                    <span>
                      <Icon name="mapPin" size={13} />
                      {farmer.location}
                    </span>
                  )}
                </div>
              </div>

              <button
                className="av-approve"
                onClick={() => handleVerify(farmer.profileId)}
                disabled={verifying === farmer.profileId}
              >
                <Icon name="shieldCheck" size={15} />
                {verifying === farmer.profileId ? 'Verifying...' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminVerificationPage;
