import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import Modal from './Modal';
import Button from './Button';

const ICONS = {
  danger: <FaExclamationTriangle size={26} />,
  warning: <FaExclamationTriangle size={26} />,
  success: <FaCheckCircle size={26} />,
  info: <FaInfoCircle size={26} />,
};

/**
 * Confirm dialog with an icon, message and explicit confirm/cancel actions.
 * `onConfirm` returning a promise shows a loading state on the confirm button.
 *
 * @example
 * <ConfirmDialog
 *   open={open} onCancel={() => setOpen(false)}
 *   onConfirm={handleDelete} title="Delete product?"
 *   message="This action cannot be undone."
 *   confirmLabel="Delete" variant="danger" loading={deleting}
 * />
 */
function ConfirmDialog({
  open = false,
  onCancel = () => {},
  onConfirm = async () => {},
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  icon = null,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      icon={icon || ICONS[variant] || ICONS.info}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && (
        <p
          style={{
            color: 'var(--fb-gray-600)',
            fontSize: 'var(--fb-text-md)',
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      )}
    </Modal>
  );
}

export default ConfirmDialog;
