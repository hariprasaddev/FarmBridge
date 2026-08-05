import { useState, useEffect } from 'react';
import { adminAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import './AdminAnnouncementPage.css';

const AUDIENCES = [
  { value: 'ALL', label: 'All Users', icon: 'users', hint: 'Every registered user' },
  { value: 'BUYERS', label: 'Only Buyers', icon: 'cart', hint: 'Buyer accounts only' },
  { value: 'FARMERS', label: 'Only Farmers', icon: 'sprout', hint: 'Farmer accounts only' },
];

const MAX_MESSAGE = 5000;

const emptyForm = {
  audience: 'ALL',
  subject: '',
  message: '',
  buttonText: '',
  buttonUrl: '',
};

function AdminAnnouncementPage() {
  const [form, setForm] = useState({ ...emptyForm });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(''); // compose/send errors only
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(''); // history-load errors only
  const { showToast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const response = await adminAPI.getAnnouncements();
      setHistory(response.data);
    } catch (err) {
      // History is secondary — a failure here must not block composing.
      setHistoryError(
        getErrorMessage(err, 'Failed to load announcement history.')
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      setError('Please enter a subject.');
      return;
    }
    if (!form.message.trim()) {
      setError('Please enter a message.');
      return;
    }
    if (form.buttonText.trim() && !form.buttonUrl.trim()) {
      setError('Please enter a button URL when adding a button.');
      return;
    }
    if (form.buttonUrl.trim() && !/^https?:\/\//i.test(form.buttonUrl.trim())) {
      setError('Button URL must start with http:// or https://');
      return;
    }

    setSending(true);
    setError('');
    try {
      const payload = {
        audience: form.audience,
        subject: form.subject.trim(),
        message: form.message.trim(),
        buttonText: form.buttonText.trim() || null,
        buttonUrl: form.buttonUrl.trim() || null,
      };
      const response = await adminAPI.sendAnnouncement(payload);
      const recipients = response.data?.recipientCount ?? 0;
      showToast(`Announcement sent to ${recipients} recipient${recipients === 1 ? '' : 's'}.`);
      setForm({ ...emptyForm, audience: form.audience });
      await loadHistory();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to send the announcement.');
      setError(message);
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  // Live preview mirroring the email body (green FarmBridge branding).
  const previewMessage = (form.message || '').trim()
    ? form.message.split('\n').filter(Boolean).map((line, i) => (
        <p key={i}>{line}</p>
      ))
    : <p className="aa-preview-placeholder">Your message will appear here…</p>;

  const previewButton =
    form.buttonText.trim() && form.buttonUrl.trim() ? (
      <a
        href={form.buttonUrl.trim()}
        className="aa-preview-btn"
        onClick={(e) => e.preventDefault()}
      >
        {form.buttonText.trim()}
      </a>
    ) : null;

  const selectedAudience =
    AUDIENCES.find((a) => a.value === form.audience) || AUDIENCES[0];

  const formatDate = (iso) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout
      title="Email Announcements"
      subtitle="Send branded email announcements to your users"
      actions={
        <button type="button" className="av-refresh" onClick={loadHistory}>
          <Icon name="refreshCw" size={16} />
          Refresh
        </button>
      }
    >
      <div className="aa-grid">
        {/* ================= Compose ================= */}
        <form className="aa-compose" onSubmit={handleSubmit}>
          <div className="aa-card">
            <div className="aa-card-head">
              <span className="aa-card-icon">
                <Icon name="mail" size={18} />
              </span>
              <div>
                <h3>Compose Announcement</h3>
                <p className="aa-card-sub">
                  Every matching user receives a branded HTML email.
                </p>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="aa-audience">Audience</label>
              <div className="aa-audience">
                {AUDIENCES.map((audience) => (
                  <button
                    key={audience.value}
                    type="button"
                    className={`aa-audience-option${
                      form.audience === audience.value ? ' active' : ''
                    }`}
                    onClick={() => setForm({ ...form, audience: audience.value })}
                    aria-pressed={form.audience === audience.value}
                  >
                    <span className="aa-audience-icon">
                      <Icon name={audience.icon} size={16} />
                    </span>
                    <span className="aa-audience-label">{audience.label}</span>
                    <span className="aa-audience-hint">{audience.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="aa-subject">Subject</label>
              <input
                id="aa-subject"
                type="text"
                name="subject"
                placeholder="e.g. New organic harvest is live!"
                maxLength={200}
                value={form.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="aa-message">Message</label>
              <textarea
                id="aa-message"
                name="message"
                rows={6}
                maxLength={MAX_MESSAGE}
                placeholder="Write your announcement message…"
                value={form.message}
                onChange={handleChange}
                required
              />
              <span className="aa-counter">
                {form.message.length}/{MAX_MESSAGE}
              </span>
            </div>

            <div className="aa-button-fields">
              <div className="form-group">
                <label htmlFor="aa-btn-text">Button Text (optional)</label>
                <input
                  id="aa-btn-text"
                  type="text"
                  name="buttonText"
                  placeholder="e.g. Shop the Harvest"
                  maxLength={80}
                  value={form.buttonText}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="aa-btn-url">Button URL (optional)</label>
                <input
                  id="aa-btn-url"
                  type="text"
                  name="buttonUrl"
                  placeholder="e.g. https://farmbridge.com/buyer/products"
                  maxLength={1000}
                  value={form.buttonUrl}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="aa-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setForm({ ...emptyForm, audience: form.audience })}
                disabled={sending}
              >
                Clear
              </button>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                <Icon name="mail" size={15} />
                {sending ? 'Sending…' : 'Send Announcement'}
              </button>
            </div>
          </div>
        </form>

        {/* ================= Live preview ================= */}
        <div className="aa-preview">
          <div className="aa-preview-label">
            <Icon name="eye" size={15} />
            Live preview
            <span className="aa-preview-tag">{selectedAudience.label}</span>
          </div>
          <div className="aa-preview-shell">
            <div className="aa-preview-header">
              <span className="aa-preview-logo">🌱 FarmBridge</span>
              <span className="aa-preview-tagline">FRESH FROM THE FARM</span>
            </div>
            <div className="aa-preview-body">
              <h4>
                {form.subject.trim() || 'Your announcement subject'}
              </h4>
              {previewMessage}
              {previewButton}
            </div>
            <div className="aa-preview-footer">
              © {new Date().getFullYear()} FarmBridge · Fresh produce from
              verified farmers
            </div>
          </div>
        </div>
      </div>

      {/* ================= History ================= */}
      <div className="aa-history">
        <div className="aa-history-head">
          <h3>Announcement History</h3>
          <span className="aa-history-count">
            {history.length} sent
          </span>
        </div>

        {historyError && (
          <div className="alert alert-error aa-history-error">
            {historyError}
            <button
              type="button"
              className="aa-history-retry"
              onClick={loadHistory}
            >
              Retry
            </button>
          </div>
        )}

        {historyLoading ? (
          <div className="adm-skeleton-table" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="adm-skeleton-row">
                <div className="adm-skeleton-cell adm-skeleton-cell--flex" />
                <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
                <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
                <div className="adm-skeleton-cell adm-skeleton-cell--sm" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="adm-table-card">
            <div className="adm-empty">
              <span className="adm-empty-icon">
                <Icon name="mail" size={28} />
              </span>
              <h2>No announcements yet</h2>
              <p>Compose your first announcement above to email your users.</p>
            </div>
          </div>
        ) : (
          <div className="adm-table-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Audience</th>
                    <th>Recipients</th>
                    <th>Sent By</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="adm-entity-cell">
                          <span className="adm-avatar adm-avatar-square">
                            <Icon name="mail" size={15} />
                          </span>
                          <span className="adm-entity-name adm-entity-name--tight">
                            {item.subject}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="aa-aud-badge">{item.audience}</span>
                      </td>
                      <td className="adm-qty">{item.recipientCount}</td>
                      <td>{item.sentBy}</td>
                      <td className="aa-date">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminAnnouncementPage;
