function OrderStatusBadge({ status }) {
  const className = `order-badge order-badge-${(status || '').toLowerCase()}`;

  return <span className={className}>{status}</span>;
}

export default OrderStatusBadge;
