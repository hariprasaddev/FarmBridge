import { useState, useEffect } from 'react';
import { farmerProfileAPI, getErrorMessage } from '../services/api';

const emptyForm = {
  farmName: '',
  location: '',
  landSize: '',
  cultivationMethod: '',
  cropsCultivated: '',
  farmingType: '',
};

function FarmerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [mode, setMode] = useState('loading'); // loading | view | create | edit
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setMode('loading');
    try {
      const response = await farmerProfileAPI.getProfile();
      setProfile(response.data);
      setMode('view');
    } catch (err) {
      if (err.response?.status === 404) {
        // No profile exists — show create form
        setMode('create');
      } else {
        setError(getErrorMessage(err, 'Failed to load your profile. Please try again.'));
        setMode('view');
      }
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startCreate = () => {
    setForm({ ...emptyForm });
    setMode('create');
    setError('');
  };

  const startEdit = () => {
    if (!profile) return;
    setForm({
      farmName: profile.farmName || '',
      location: profile.location || '',
      landSize: profile.landSize?.toString() || '',
      cultivationMethod: profile.cultivationMethod || '',
      cropsCultivated: profile.cropsCultivated || '',
      farmingType: profile.farmingType || '',
    });
    setMode('edit');
    setError('');
  };

  const cancelEdit = () => {
    if (profile) {
      setMode('view');
    } else {
      setMode('create');
    }
    setError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        landSize: parseFloat(form.landSize),
      };
      const response = await farmerProfileAPI.createProfile(payload);
      setProfile(response.data);
      setMode('view');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        landSize: parseFloat(form.landSize),
      };
      const response = await farmerProfileAPI.updateProfile(payload);
      setProfile(response.data);
      setMode('view');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (mode === 'loading') {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profile && mode === 'view') {
    return (
      <div className="page-container">
        <div className="profile-error">
          <h2>We couldn't load your profile</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadProfile}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW MODE
  // ==========================================
  if (mode === 'view' && profile) {
    return (
      <div className="page-container">
        <div className="profile-page">
          <div className="profile-header">
            <div className="profile-header-left">
              <div className="profile-avatar">🏠</div>
              <div>
                <h1>{profile.farmName}</h1>
                <p className="profile-location">{profile.location}</p>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={startEdit}>
              ✏️ Edit Profile
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="profile-details">
            <div className="detail-card">
              <div className="detail-item">
                <span className="detail-label">Farm Name</span>
                <span className="detail-value">{profile.farmName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">{profile.location}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Land Size</span>
                <span className="detail-value">{profile.landSize} acres</span>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-item">
                <span className="detail-label">Cultivation Method</span>
                <span className="detail-value">{profile.cultivationMethod}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Crops Cultivated</span>
                <span className="detail-value">{profile.cropsCultivated}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Farming Type</span>
                <span className="detail-value">{profile.farmingType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CREATE / EDIT FORM
  // ==========================================
  const isEdit = mode === 'edit';
  const handleSubmit = isEdit ? handleUpdate : handleCreate;
  const title = isEdit ? 'Edit Your Farm Profile' : 'Create Your Farm Profile';
  const subTitle = isEdit
    ? 'Update your farm details'
    : 'Set up your farm profile to start selling products';

  return (
    <div className="page-container">
      <div className="profile-page">
        <div className="profile-header">
          <div>
            <h1>{title}</h1>
            <p className="profile-subtitle">{subTitle}</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="farmName">Farm Name</label>
              <input
                id="farmName"
                type="text"
                name="farmName"
                placeholder="e.g. Green Valley Farm"
                value={form.farmName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                name="location"
                placeholder="e.g. Karnataka, India"
                value={form.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="landSize">Land Size (acres)</label>
              <input
                id="landSize"
                type="number"
                name="landSize"
                placeholder="e.g. 5.5"
                min="0"
                step="0.1"
                value={form.landSize}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cultivationMethod">Cultivation Method</label>
              <input
                id="cultivationMethod"
                type="text"
                name="cultivationMethod"
                placeholder="e.g. Organic, Traditional"
                value={form.cultivationMethod}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cropsCultivated">Crops Cultivated</label>
              <input
                id="cropsCultivated"
                type="text"
                name="cropsCultivated"
                placeholder="e.g. Rice, Wheat, Vegetables"
                value={form.cropsCultivated}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="farmingType">Farming Type</label>
              <input
                id="farmingType"
                type="text"
                name="farmingType"
                placeholder="e.g. Subsistence, Commercial"
                value={form.farmingType}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? isEdit
                  ? 'Updating...'
                  : 'Creating...'
                : isEdit
                ? 'Update Profile'
                : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FarmerProfilePage;
