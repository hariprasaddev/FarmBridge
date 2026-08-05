import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import AdminLayout from '../components/AdminLayout';
import { Modal, ConfirmDialog } from '../components/ui';
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

const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function AdminVerificationPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Details dialog
  const [selected, setSelected] = useState(null);

  // Reject dialog
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Approve confirmation dialog
  const [confirmApprove, setConfirmApprove] = useState(null);

  const [busy, setBusy] = useState(null); // profileId currently approving

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

  const removeFarmer = (profileId) => {
    setFarmers((prev) => prev.filter((f) => f.profileId !== profileId));
    setSelected(null);
  };

  const handleApprove = async (farmer) => {
    setConfirmApprove(null);
    setBusy(farmer.profileId);
    setError('');
    setSuccess('');

    try {
      await adminAPI.verifyFarmer(farmer.profileId);
      removeFarmer(farmer.profileId);
      setSuccess(`${farmer.farmName || farmer.farmerName} approved — they can now sell.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to approve the farmer. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  const openReject = (farmer) => {
    setRejecting(farmer);
    setRejectReason('');
    setRejectError('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Please enter a rejection reason.');
      return;
    }

    setBusy(rejecting.profileId);
    setRejectError('');

    try {
      await adminAPI.rejectFarmer(rejecting.profileId, rejectReason.trim());
      setSuccess(`${rejecting.farmName || rejecting.farmerName} rejected.`);
      removeFarmer(rejecting.profileId);
      setRejecting(null);
    } catch (err) {
      setRejectError(getErrorMessage(err, 'Failed to reject the farmer. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  const documents = (farmer) => [
    { label: 'Farmer Photo', url: farmer.farmerPhotoUrl },
    { label: 'Land Certificate', url: farmer.landCertificateUrl },
    { label: 'Farm Photo', url: farmer.farmPhotoUrl },
    { label: 'Organic Certificate', url: farmer.organicCertificateUrl },
  ].filter((d) => d.url);

  return (
    <AdminLayout
      title="Farmer Verification"
      subtitle="Review, approve or reject pending farmer requests"
      actions={
        <button className="av-refresh" onClick={loadFarmers} disabled={loading}>
          <Icon name="refreshCw" size={16} />
          Refresh
        </button>
      }
    >
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
                {getInitials(farmer.fullName || farmer.farmerName || farmer.farmName)}
              </span>

              <div className="av-info">
                <div className="av-name">
                  {farmer.farmName}
                  <span className="av-farmer">
                    {farmer.fullName || farmer.farmerName}
                  </span>
                </div>
                <div className="av-meta">
                  <span>
                    <Icon name="mail" size={13} />
                    {farmer.email}
                  </span>
                  {(farmer.village || farmer.district) && (
                    <span>
                      <Icon name="mapPin" size={13} />
                      {[farmer.village, farmer.district, farmer.state]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                  {farmer.cultivationMethod && (
                    <span className="av-chip">
                      <Icon name="sprout" size={13} />
                      {farmer.cultivationMethod}
                    </span>
                  )}
                  <span>
                    <Icon name="clock" size={13} />
                    {formatDate(farmer.submittedAt)}
                  </span>
                </div>
              </div>

              <div className="av-actions">
                <button
                  className="av-view"
                  onClick={() => setSelected(farmer)}
                >
                  <Icon name="eye" size={15} />
                  View
                </button>
                <button
                  className="av-approve"
                  onClick={() => setConfirmApprove(farmer)}
                  disabled={busy === farmer.profileId}
                >
                  <Icon name="shieldCheck" size={15} />
                  {busy === farmer.profileId ? 'Approving...' : 'Approve'}
                </button>
                <button
                  className="av-reject"
                  onClick={() => openReject(farmer)}
                  disabled={busy === farmer.profileId}
                >
                  <Icon name="xCircle" size={15} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          DETAILS DIALOG (design system)
          ========================================== */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`${selected?.farmName || 'Farm'} — Verification Details`}
        size="lg"
        icon={<Icon name="shieldCheck" size={18} />}
        footer={
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="av-approve"
              onClick={() => {
                setSelected(null);
                setConfirmApprove(selected);
              }}
              disabled={busy === selected?.profileId}
            >
              <Icon name="shieldCheck" size={15} />
              Approve
            </button>
            <button
              type="button"
              className="av-reject"
              onClick={() => {
                setSelected(null);
                openReject(selected);
              }}
            >
              <Icon name="xCircle" size={15} />
              Reject
            </button>
          </div>
        }
      >
        {selected && (
        <div className="av-details">
              <div className="av-detail-grid">
                <div className="av-detail-block">
                  <h4>
                    <Icon name="profile" size={15} /> Personal
                  </h4>
                  <dl>
                    <div><dt>Full Name</dt><dd>{selected.fullName || selected.farmerName || '—'}</dd></div>
                    <div><dt>Mobile</dt><dd>{selected.mobileNumber || '—'}</dd></div>
                    <div><dt>Aadhaar</dt><dd>{selected.aadhaarNumber || '—'}</dd></div>
                    <div><dt>Email</dt><dd>{selected.email}</dd></div>
                    <div><dt>Location</dt><dd>{[selected.village, selected.mandal, selected.district, selected.state].filter(Boolean).join(', ') || '—'}</dd></div>
                  </dl>
                </div>

                <div className="av-detail-block">
                  <h4>
                    <Icon name="store" size={15} /> Farm
                  </h4>
                  <dl>
                    <div><dt>Farm Name</dt><dd>{selected.farmName || '—'}</dd></div>
                    <div><dt>Address</dt><dd>{selected.farmAddress || '—'}</dd></div>
                    <div><dt>Size</dt><dd>{selected.farmSize ? `${selected.farmSize} acres` : '—'}</dd></div>
                    <div><dt>Survey No.</dt><dd>{selected.surveyNumber || '—'}</dd></div>
                  </dl>
                </div>

                <div className="av-detail-block">
                  <h4>
                    <Icon name="sprout" size={15} /> Cultivation
                  </h4>
                  <dl>
                    <div><dt>Method</dt><dd>{selected.cultivationMethod || '—'}</dd></div>
                    <div><dt>Main Crops</dt><dd>{selected.mainCrops || '—'}</dd></div>
                    <div><dt>Experience</dt><dd>{selected.farmingExperience || '—'}</dd></div>
                    <div><dt>Submitted</dt><dd>{formatDate(selected.submittedAt)}</dd></div>
                  </dl>
                </div>
              </div>

              {/* Documents */}
              <div className="av-docs">
                <h4>
                  <Icon name="download" size={15} /> Documents
                </h4>
                {documents(selected).length === 0 ? (
                  <p className="av-docs-empty">No documents uploaded.</p>
                ) : (
                  <div className="av-doc-grid">
                    {documents(selected).map((doc) => (
                      <a
                        key={doc.label}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="av-doc-item"
                      >
                        <img src={doc.url} alt={doc.label} />
                        <span>
                          <Icon name="eye" size={13} />
                          {doc.label}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
        )}

      </Modal>

      {/* ==========================================
          REJECT DIALOG (reason is mandatory, design system)
          ========================================== */}
      <Modal
        open={!!rejecting}
        onClose={() => !busy && setRejecting(null)}
        title="Reject Verification"
        icon={<Icon name="xCircle" size={18} />}
        footer={
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setRejecting(null)}
              disabled={busy === rejecting?.profileId}
            >
              Cancel
            </button>
            <button
              type="button"
              className="av-reject av-reject-solid"
              onClick={handleReject}
              disabled={busy === rejecting?.profileId}
            >
              <Icon name="xCircle" size={15} />
              {busy === rejecting?.profileId ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        }
      >
        {rejecting && (
          <>
            <p className="av-reject-sub">
              Rejecting <strong>{rejecting.farmName || rejecting.farmerName}</strong>{' '}
              will notify them with your reason. They can update their
              information and resubmit.
            </p>

            {rejectError && <div className="alert alert-error">{rejectError}</div>}

            <div className="form-group">
              <label htmlFor="reject-reason">Rejection Reason *</label>
              <textarea
                id="reject-reason"
                rows={4}
                maxLength={1000}
                placeholder="e.g. The land certificate is illegible — please upload a clearer copy."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <span className="av-reject-counter">{rejectReason.length}/1000</span>
            </div>
          </>
        )}
      </Modal>

      {/* ==========================================
          APPROVE CONFIRMATION (design system)
          ========================================== */}
      <ConfirmDialog
        open={!!confirmApprove}
        onCancel={() => setConfirmApprove(null)}
        onConfirm={() => handleApprove(confirmApprove)}
        title="Approve farmer?"
        message={
          confirmApprove
            ? `Approve ${confirmApprove.farmName || confirmApprove.farmerName}'s verification request? They will be able to list products and receive orders immediately.`
            : ''
        }
        confirmLabel="Approve"
        variant="success"
        loading={busy === confirmApprove?.profileId}
      />
    </AdminLayout>
  );
}

export default AdminVerificationPage;
