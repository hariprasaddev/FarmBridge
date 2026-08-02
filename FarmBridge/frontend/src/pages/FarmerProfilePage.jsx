import { useState, useEffect } from 'react';
import { farmerProfileAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import './FarmerProfilePage.css';

const emptyForm = {
  farmName: '',
  location: '',
  landSize: '',
  cultivationMethod: '',
  cropsCultivated: '',
  farmingType: '',
};

// Presentation helper — initials derived from the farm name (the profile
// response has no separate farmer/user name field).
const getInitials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FB';
  return parts
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

function FarmerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [mode, setMode] = useState('loading'); // loading | view | create | edit
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

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
        // No profile exists — show create state
        setMode('create');
        setShowCreateForm(false);
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

  // ==========================================
  // LOADING STATE — shimmer skeletons
  // ==========================================
  if (mode === 'loading') {
    return (
      <div className="fp-root">
        <div className="fp-inner">
          <div className="fp-grid">
            <div className="fp-card fp-skel-card" aria-hidden="true">
              <div className="fp-skel-avatar" />
              <div className="fp-skel-line fp-skel-line--title" />
              <div className="fp-skel-line fp-skel-line--sub" />
              <div className="fp-skel-line" />
              <div className="fp-skel-line" />
              <div className="fp-skel-line" />
            </div>
            <div className="fp-card fp-skel-card" aria-hidden="true">
              <div className="fp-skel-line fp-skel-line--title" />
              <div className="fp-skel-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="fp-skel-field" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================
  if (error && !profile && mode === 'view') {
    return (
      <div className="page-container">
        <div className="profile-error">
          <h2>We couldn&apos;t load your profile</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadProfile}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY PROFILE STATE
  // ==========================================
  if (mode === 'create' && !showCreateForm) {
    return (
      <div className="fp-root">
        <div className="fp-inner">
          <div className="fp-empty">
            <div className="fp-empty-icon">
              <Icon name="store" size={34} />
            </div>
            <h2>Complete Your Farmer Profile</h2>
            <p>Complete your profile to begin selling on FarmBridge.</p>
            <button
              type="button"
              className="fp-btn-primary"
              onClick={() => {
                startCreate();
                setShowCreateForm(true);
              }}
            >
              <Icon name="plus" size={16} />
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW MODE
  // ==========================================
  if (mode === 'view' && profile) {
    // Only fields with real values are shown — never invented data.
    const infoFields = [
      { label: 'Farm Name', value: profile.farmName },
      { label: 'Location', value: profile.location },
      { label: 'Land Size', value: profile.landSize ? `${profile.landSize} acres` : '' },
      { label: 'Cultivation Method', value: profile.cultivationMethod },
      { label: 'Crops Cultivated', value: profile.cropsCultivated },
      { label: 'Farming Type', value: profile.farmingType },
    ].filter((f) => f.value && String(f.value).trim() !== '');

    const metaItems = [
      { icon: 'mapPin', label: 'Location', value: profile.location },
      {
        icon: 'package',
        label: 'Farm Size',
        value: profile.landSize ? `${profile.landSize} acres` : '',
      },
      { icon: 'sprout', label: 'Cultivation', value: profile.cultivationMethod },
      { icon: 'leaf', label: 'Crops', value: profile.cropsCultivated },
      { icon: 'flag', label: 'Farming Type', value: profile.farmingType },
    ].filter((m) => m.value && String(m.value).trim() !== '');

    return (
      <div className="fp-root">
        <div className="fp-inner">
          <div className="fp-grid">
            {/* ============ Left profile card ============ */}
            <aside className="fp-card fp-profile-card">
              <div className="fp-avatar" aria-hidden="true">
                {getInitials(profile.farmName)}
              </div>
              <h2 className="fp-farm-name">{profile.farmName}</h2>
              {profile.location && (
                <p className="fp-farm-loc">
                  <Icon name="mapPin" size={14} />
                  {profile.location}
                </p>
              )}
              <span className="fp-chip">
                <Icon name="sprout" size={14} />
                Profile Active
              </span>

              <div className="fp-meta">
                {metaItems.map((item) => (
                  <div key={item.label} className="fp-meta-item">
                    <span className="fp-meta-icon">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <div>
                      <span className="fp-meta-label">{item.label}</span>
                      <span className="fp-meta-value">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* ============ Right information card ============ */}
            <section className="fp-card fp-info-card">
              <div className="fp-card-head">
                <div>
                  <h2>Farm Information</h2>
                  <p className="fp-card-sub">Your registered farm details</p>
                </div>
                <button type="button" className="fp-edit-btn" onClick={startEdit}>
                  <Icon name="edit" size={15} />
                  Edit
                </button>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="fp-fields">
                {infoFields.map((field) => (
                  <div key={field.label} className="fp-field">
                    <span className="fp-field-label">{field.label}</span>
                    <span className="fp-field-value">{field.value}</span>
                  </div>
                ))}
              </div>
            </section>
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
    <div className="fp-root">
      <div className="fp-inner">
        <div className="fp-card fp-form-card">
          <div className="fp-card-head">
            <div>
              <h2>{title}</h2>
              <p className="fp-card-sub">{subTitle}</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="fp-form">
            <div className="fp-form-row">
              <div className="fp-form-group">
                <label htmlFor="farmName">Farm Name</label>
                <input
                  id="farmName"
                  className="fp-form-input"
                  type="text"
                  name="farmName"
                  placeholder="e.g. Green Valley Farm"
                  value={form.farmName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="fp-form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  className="fp-form-input"
                  type="text"
                  name="location"
                  placeholder="e.g. Karnataka, India"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="fp-form-row">
              <div className="fp-form-group">
                <label htmlFor="landSize">Land Size (acres)</label>
                <input
                  id="landSize"
                  className="fp-form-input"
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

              <div className="fp-form-group">
                <label htmlFor="cultivationMethod">Cultivation Method</label>
                <input
                  id="cultivationMethod"
                  className="fp-form-input"
                  type="text"
                  name="cultivationMethod"
                  placeholder="e.g. Organic, Traditional"
                  value={form.cultivationMethod}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="fp-form-row">
              <div className="fp-form-group">
                <label htmlFor="cropsCultivated">Crops Cultivated</label>
                <input
                  id="cropsCultivated"
                  className="fp-form-input"
                  type="text"
                  name="cropsCultivated"
                  placeholder="e.g. Rice, Wheat, Vegetables"
                  value={form.cropsCultivated}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="fp-form-group">
                <label htmlFor="farmingType">Farming Type</label>
                <input
                  id="farmingType"
                  className="fp-form-input"
                  type="text"
                  name="farmingType"
                  placeholder="e.g. Subsistence, Commercial"
                  value={form.farmingType}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="fp-form-actions">
              <button
                type="button"
                className="fp-btn-outline"
                onClick={() => {
                  cancelEdit();
                  setShowCreateForm(false);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="fp-btn-primary" disabled={saving}>
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
    </div>
  );
}

export default FarmerProfilePage;
