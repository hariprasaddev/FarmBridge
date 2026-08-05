import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { farmerVerificationAPI, farmerProfileAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import './FarmerVerificationPage.css';

const CULTIVATION_METHODS = ['ORGANIC', 'NATURAL', 'CHEMICAL', 'MIXED'];

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyForm = {
  fullName: '',
  mobileNumber: '',
  aadhaarNumber: '',
  village: '',
  mandal: '',
  district: '',
  state: '',
  farmName: '',
  farmAddress: '',
  farmSize: '',
  surveyNumber: '',
  cultivationMethod: '',
  mainCrops: '',
  farmingExperience: '',
};

const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ============================================================
// STATUS SCREENS
// ============================================================

function PendingScreen({ submittedAt }) {
  return (
    <div className="fv-status fv-status-pending">
      <span className="fv-status-icon">
        <Icon name="clock" size={34} />
      </span>
      <h2>Your verification request is under review</h2>
      <p>
        An admin will review your farm details and documents. Once approved,
        you&apos;ll be able to create products and receive buyer orders.
      </p>
      {submittedAt && (
        <span className="fv-status-date">Submitted on {formatDate(submittedAt)}</span>
      )}
      <div className="fv-status-note">
        <Icon name="info" size={15} />
        Product creation stays locked until your account is verified.
      </div>
    </div>
  );
}

function RejectedScreen({ verification, onResubmit }) {
  return (
    <div className="fv-status fv-status-rejected">
      <span className="fv-status-icon">
        <Icon name="xCircle" size={34} />
      </span>
      <h2>Verification rejected</h2>
      <div className="fv-reason-box">
        <span className="fv-reason-label">Reason</span>
        <p>{verification.rejectionReason || 'No reason provided.'}</p>
      </div>
      <p className="fv-rejected-hint">
        Please update your information and resubmit.
      </p>
      <button type="button" className="fv-btn-primary" onClick={onResubmit}>
        <Icon name="refreshCw" size={16} />
        Update &amp; Resubmit
      </button>
    </div>
  );
}

function ApprovedScreen({ verification }) {
  return (
    <div className="fv-status fv-status-approved">
      <span className="fv-status-icon">
        <Icon name="badgeCheck" size={34} />
      </span>
      <h2>Verified Farmer</h2>
      <p>
        Your account is verified. You can now create products, list them on the
        marketplace, and receive buyer orders.
      </p>
      {verification.submittedAt && (
        <span className="fv-status-date">Approved on {formatDate(verification.submittedAt)}</span>
      )}
      <div className="fv-status-actions">
        <Link to="/farmer/products/add" className="fv-btn-primary">
          <Icon name="packagePlus" size={16} />
          Add your first product
        </Link>
        <Link to="/farmer/dashboard" className="fv-btn-outline">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// VERIFICATION FORM
// ============================================================

function VerificationForm({ initial, existingDocuments = {}, onSubmit, submitting }) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...initial,
  });
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, WEBP or GIF image.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large. Maximum size is 5 MB.');
      e.target.value = '';
      return;
    }

    setError('');
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side guard for the required documents on a fresh submission
    if (!existingDocuments.farmerPhotoUrl && !files.farmerPhoto) {
      setError('Farmer photo is required.');
      return;
    }
    if (!existingDocuments.landCertificateUrl && !files.landCertificate) {
      setError('Land ownership certificate is required.');
      return;
    }
    if (!existingDocuments.farmPhotoUrl && !files.farmPhoto) {
      setError('Farm photo is required.');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value != null) formData.append(key, value);
    });
    ['farmerPhoto', 'landCertificate', 'farmPhoto', 'organicCertificate'].forEach(
      (key) => {
        if (files[key]) formData.append(key, files[key]);
      }
    );

    await onSubmit(formData);
  };

  const documentRows = [
    { key: 'farmerPhoto', label: 'Farmer Photo', required: !existingDocuments.farmerPhotoUrl, hint: 'A clear photo of you' },
    { key: 'landCertificate', label: 'Land Ownership Certificate', required: !existingDocuments.landCertificateUrl, hint: 'Proof of land ownership' },
    { key: 'farmPhoto', label: 'Farm Photo', required: !existingDocuments.farmPhotoUrl, hint: 'A photo of your farm' },
    { key: 'organicCertificate', label: 'Organic Certificate', required: false, hint: 'Optional — for organic/natural farmers' },
  ];

  return (
    <form className="fv-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      {/* ============ Personal Information ============ */}
      <section className="fv-card">
        <div className="fv-card-head">
          <span className="fv-card-icon">
            <Icon name="profile" size={18} />
          </span>
          <div>
            <h3>Personal Information</h3>
            <p className="fv-card-sub">Your identity details</p>
          </div>
        </div>

        <div className="fv-grid">
          <div className="fv-field">
            <label htmlFor="fullName">Full Name *</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="e.g. Ravi Kumar"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field">
            <label htmlFor="mobileNumber">Mobile Number *</label>
            <input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength={10}
              value={form.mobileNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field">
            <label htmlFor="aadhaarNumber">Aadhaar Number (optional)</label>
            <input
              id="aadhaarNumber"
              name="aadhaarNumber"
              type="text"
              placeholder="e.g. 1234 5678 9012"
              value={form.aadhaarNumber}
              onChange={handleChange}
            />
          </div>
          <div className="fv-field">
            <label htmlFor="village">Village *</label>
            <input
              id="village"
              name="village"
              type="text"
              placeholder="e.g. Peddapalli"
              value={form.village}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field">
            <label htmlFor="mandal">Mandal *</label>
            <input
              id="mandal"
              name="mandal"
              type="text"
              placeholder="e.g. Nizamabad Mandal"
              value={form.mandal}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field">
            <label htmlFor="district">District *</label>
            <input
              id="district"
              name="district"
              type="text"
              placeholder="e.g. Nizamabad"
              value={form.district}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field">
            <label htmlFor="state">State *</label>
            <input
              id="state"
              name="state"
              type="text"
              placeholder="e.g. Telangana"
              value={form.state}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </section>

      {/* ============ Farm Information ============ */}
      <section className="fv-card">
        <div className="fv-card-head">
          <span className="fv-card-icon">
            <Icon name="store" size={18} />
          </span>
          <div>
            <h3>Farm Information</h3>
            <p className="fv-card-sub">Details of your farmland</p>
          </div>
        </div>

        <div className="fv-grid">
          <div className="fv-field">
            <label htmlFor="farmName">Farm Name *</label>
            <input
              id="farmName"
              name="farmName"
              type="text"
              placeholder="e.g. Green Valley Farm"
              value={form.farmName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field">
            <label htmlFor="farmSize">Farm Size (Acres) *</label>
            <input
              id="farmSize"
              name="farmSize"
              type="number"
              placeholder="e.g. 5.5"
              min="0.1"
              step="0.1"
              value={form.farmSize}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field fv-field-full">
            <label htmlFor="farmAddress">Farm Address *</label>
            <input
              id="farmAddress"
              name="farmAddress"
              type="text"
              placeholder="Complete farm address"
              value={form.farmAddress}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field">
            <label htmlFor="surveyNumber">Survey Number (optional)</label>
            <input
              id="surveyNumber"
              name="surveyNumber"
              type="text"
              placeholder="e.g. 452/1A"
              value={form.surveyNumber}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* ============ Cultivation Information ============ */}
      <section className="fv-card">
        <div className="fv-card-head">
          <span className="fv-card-icon">
            <Icon name="sprout" size={18} />
          </span>
          <div>
            <h3>Cultivation Information</h3>
            <p className="fv-card-sub">How you grow your produce</p>
          </div>
        </div>

        <div className="fv-grid">
          <div className="fv-field">
            <label htmlFor="cultivationMethod">Cultivation Method *</label>
            <select
              id="cultivationMethod"
              name="cultivationMethod"
              value={form.cultivationMethod}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="" disabled>
                Select a method
              </option>
              {CULTIVATION_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="fv-field">
            <label htmlFor="mainCrops">Main Crops *</label>
            <input
              id="mainCrops"
              name="mainCrops"
              type="text"
              placeholder="e.g. Rice, Cotton, Chillies"
              value={form.mainCrops}
              onChange={handleChange}
              required
            />
          </div>
          <div className="fv-field">
            <label htmlFor="farmingExperience">Farming Experience *</label>
            <input
              id="farmingExperience"
              name="farmingExperience"
              type="text"
              placeholder="e.g. 12 years"
              value={form.farmingExperience}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </section>

      {/* ============ Documents ============ */}
      <section className="fv-card">
        <div className="fv-card-head">
          <span className="fv-card-icon">
            <Icon name="download" size={18} />
          </span>
          <div>
            <h3>Documents</h3>
            <p className="fv-card-sub">
              Upload the required documents (JPG, PNG, WEBP or GIF, up to 5 MB)
            </p>
          </div>
        </div>

        <div className="fv-docs">
          {documentRows.map((doc) => {
            const hasExisting = Boolean(existingDocuments[`${doc.key}Url`]);
            const chosen = files[doc.key];
            return (
              <div key={doc.key} className={`fv-doc${hasExisting ? ' fv-doc-has' : ''}`}>
                <div className="fv-doc-info">
                  <span className="fv-doc-name">
                    {doc.label}
                    {doc.required && <span className="fv-doc-required">*</span>}
                  </span>
                  <span className="fv-doc-hint">
                    {chosen
                      ? chosen.name
                      : hasExisting
                      ? 'Existing document kept — upload a new one to replace'
                      : doc.hint}
                  </span>
                </div>
                <label className="fv-doc-btn">
                  <Icon name={chosen ? 'refreshCw' : 'plus'} size={15} />
                  {chosen ? 'Replace' : hasExisting ? 'Replace' : 'Choose'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => handleFile(e, doc.key)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <div className="fv-form-actions">
        <Link to="/farmer/dashboard" className="fv-btn-outline">
          Cancel
        </Link>
        <button type="submit" className="fv-btn-primary" disabled={submitting}>
          <Icon name="shieldCheck" size={16} />
          {submitting ? 'Submitting...' : 'Submit Verification'}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// PAGE
// ============================================================

function FarmerVerificationPage() {
  const [verification, setVerification] = useState(null);
  const [mode, setMode] = useState('loading'); // loading | form | pending | rejected | approved
  const [resubmitting, setResubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadVerification = async () => {
    setMode('loading');
    try {
      const response = await farmerVerificationAPI.getVerification();
      setVerification(response.data);
      const status = response.data.verificationStatus;
      setMode(status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'pending');
    } catch (err) {
      if (err.response?.status === 404) {
        // No profile / no submission yet — show the form
        setVerification(null);
        setMode('form');
      } else {
        setError(getErrorMessage(err, 'Failed to load your verification status.'));
        setMode('form');
      }
    }
  };

  useEffect(() => {
    loadVerification();
  }, []);

  // Prefill for a rejected farmer resubmitting (documents stay on the server)
  const startResubmit = () => {
    setResubmitting(true);
    setMode('form');
    setError('');
  };

  const buildInitial = () => {
    if (!verification) return {};
    return {
      fullName: verification.fullName || '',
      mobileNumber: verification.mobileNumber || '',
      aadhaarNumber: verification.aadhaarNumber || '',
      village: verification.village || '',
      mandal: verification.mandal || '',
      district: verification.district || '',
      state: verification.state || '',
      farmName: verification.farmName || '',
      farmAddress: verification.farmAddress || '',
      farmSize: verification.farmSize?.toString() || '',
      surveyNumber: verification.surveyNumber || '',
      cultivationMethod: verification.cultivationMethod || '',
      mainCrops: verification.mainCrops || '',
      farmingExperience: verification.farmingExperience || '',
    };
  };

  const existingDocuments = verification
    ? {
        farmerPhotoUrl: verification.farmerPhotoUrl,
        landCertificateUrl: verification.landCertificateUrl,
        farmPhotoUrl: verification.farmPhotoUrl,
        organicCertificateUrl: verification.organicCertificateUrl,
      }
    : {};

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      const response = await farmerVerificationAPI.submitVerification(formData);
      setVerification(response.data);
      setResubmitting(false);
      setMode('pending');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit your verification. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (mode === 'loading') {
    return (
      <div className="fv-root">
        <div className="fv-inner">
          <div className="fv-loading">
            <div className="spinner" />
            <p>Loading verification status...</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // HEADER (shared)
  // ==========================================
  const header = (
    <header className="fv-head">
      <div>
        <h1>Farmer Verification</h1>
        <p className="fv-sub">
          {mode === 'form'
            ? resubmitting
              ? 'Update your information and resubmit for review'
              : 'Complete your verification to start selling on FarmBridge'
            : 'Verification status of your farm account'}
        </p>
      </div>
      {mode !== 'form' && (
        <span className="fv-status-chip">
          <Icon name={mode === 'approved' ? 'badgeCheck' : mode === 'pending' ? 'clock' : 'xCircle'} size={15} />
          {mode === 'approved' ? 'APPROVED' : mode === 'pending' ? 'PENDING' : 'REJECTED'}
        </span>
      )}
    </header>
  );

  return (
    <div className="fv-root">
      <div className="fv-inner">
        {header}
        {error && <div className="alert alert-error">{error}</div>}

        {mode === 'form' && (
          <>
            {!resubmitting && (
              <p className="fv-form-intro">
                Fill in your details and upload the required documents. Once submitted,
                an admin will review your request — this usually takes one to two
                working days.
              </p>
            )}
            <VerificationForm
              initial={buildInitial()}
              existingDocuments={existingDocuments}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </>
        )}

        {mode === 'pending' && <PendingScreen submittedAt={verification?.submittedAt} />}
        {mode === 'rejected' && (
          <RejectedScreen verification={verification} onResubmit={startResubmit} />
        )}
        {mode === 'approved' && <ApprovedScreen verification={verification} />}
      </div>
    </div>
  );
}

export default FarmerVerificationPage;
