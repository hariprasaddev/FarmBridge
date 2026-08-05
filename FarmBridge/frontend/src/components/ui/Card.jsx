import './Card.css';

/**
 * Design-system card. Export helper sub-components: CardHeader, CardBody,
 * CardFooter.
 *
 * @example
 * <Card hover>
 *   <Card.Header title="Latest orders" subtitle="Newest first" />
 *   <Card.Body>…</Card.Body>
 *   <Card.Footer><Button>View all</Button></Card.Footer>
 * </Card>
 */
function Card({ hover = false, className = '', children, ...rest }) {
  return (
    <div className={`fb-card${hover ? ' fb-card-hover' : ''}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </div>
  );
}

function Header({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`fb-card-header${className ? ` ${className}` : ''}`}>
      <div>
        {title && <div className="fb-card-header-title">{title}</div>}
        {subtitle && <div className="fb-card-header-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="fb-card-header-actions">{actions}</div>}
    </div>
  );
}

function Body({ flush = false, className = '', children }) {
  return (
    <div className={`fb-card-body${flush ? ' fb-card-body-flush' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

function Footer({ className = '', children }) {
  return <div className={`fb-card-footer${className ? ` ${className}` : ''}`}>{children}</div>;
}

Card.Header = Header;
Card.Body = Body;
Card.Footer = Footer;

export default Card;
