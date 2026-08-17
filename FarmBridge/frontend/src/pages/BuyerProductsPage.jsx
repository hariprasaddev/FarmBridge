import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buyerProductsAPI, buyerOrdersAPI, getErrorMessage } from '../services/api';
import Icon from '../components/Icon';
import ProductImage from '../components/ProductImage';
import WishlistButton from '../components/WishlistButton';
import { getStock } from '../utils/stock';
import { Modal, Pagination } from '../components/ui';
import './BuyerProductsPage.css';

// Server-side page size for the product catalog grid.
const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'id,desc', label: 'Newest first' },
  { value: 'price,asc', label: 'Price: low to high' },
  { value: 'price,desc', label: 'Price: high to low' },
  { value: 'name,asc', label: 'Name A–Z' },
];

function BuyerProductsPage() {
  // Browse mode: the grid shows one server-side page of the catalog
  // (`products` = current page content; page/totalPages/totalElements come
  // from the Page payload). Search mode: the grid shows the full backend
  // search results, with the category pills applied client-side on top.
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [paging, setPaging] = useState(false);
  const [error, setError] = useState('');

  // Pagination state (page is 0-based to match the Spring Page API).
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);

  // Search & category filter state.
  // The category can be pre-selected from the URL (?category=...),
  // e.g. the "View all" link on the product details page.
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(
    () => searchParams.get('category') || 'ALL'
  );

  // Guards against out-of-order responses: searchRef protects the debounced
  // search; fetchSeq bumps on every page fetch so stale pages are ignored.
  const searchRef = useRef('');
  const fetchSeq = useRef(0);

  // Place-order modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');

  const navigate = useNavigate();

  // Fetches one server-side page of the catalog. `category` is applied on
  // the server (exact totalElements), `sort` is a Spring sort expression.
  const fetchPage = async (pageIndex, cat, sortBy) => {
    const seq = ++fetchSeq.current;
    setPaging(true);
    setError('');
    try {
      const response = await buyerProductsAPI.getAllProducts({
        page: pageIndex,
        size: PAGE_SIZE,
        ...(cat && cat !== 'ALL' ? { category: cat } : {}),
        sort: sortBy,
      });
      if (seq !== fetchSeq.current) return; // stale response — ignore
      const data = response.data || {};
      setProducts(data.content || []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setPage(data.number ?? pageIndex);
    } catch (err) {
      if (seq !== fetchSeq.current) return;
      setError(getErrorMessage(err, 'Failed to load available products. Please try again.'));
    } finally {
      if (seq === fetchSeq.current) setPaging(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Category pills come from a lightweight metadata endpoint so the
    // catalog itself can stay fully paginated.
    buyerProductsAPI
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
    fetchPage(0, category, sort).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced backend search. Typing is delayed ~300ms so the search API
  // is called once per pause, not once per keystroke. Clearing the box
  // restores the paginated catalog. A failed search keeps the current grid
  // and surfaces the error alert instead of emptying the page.
  useEffect(() => {
    const query = search.trim();
    searchRef.current = query;

    if (!query) {
      // Back to browse mode — refetch the current page (fresh content,
      // e.g. after a new order deducted stock).
      fetchPage(page, category, sort);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setError('');
      try {
        const response = await buyerProductsAPI.searchProducts(query);
        if (searchRef.current !== query) return; // stale response — ignore
        setProducts(response.data || []);
      } catch (err) {
        if (searchRef.current !== query) return;
        setError(getErrorMessage(err, 'Failed to search products. Please try again.'));
      } finally {
        if (searchRef.current === query) setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasQuery = search.trim() !== '';

  // In search mode the pills filter the (complete) search results
  // client-side; in browse mode the server already applied the category.
  const filteredProducts = hasQuery
    ? products.filter((p) => category === 'ALL' || p.category === category)
    : products;

  const handleCategory = (cat) => {
    setCategory(cat);
    if (hasQuery) return; // searching: pills filter results client-side
    setPage(0);
    fetchPage(0, cat, sort);
  };

  const handleSort = (e) => {
    const value = e.target.value;
    setSort(value);
    if (hasQuery) return;
    setPage(0);
    fetchPage(0, category, value);
  };

  // The Pagination component is 1-based; the API is 0-based.
  const handlePage = (oneBased) => {
    const next = oneBased - 1;
    if (next === page) return;
    setPage(next);
    fetchPage(next, category, sort);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('ALL');
  };

  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOrderError('');
  };

  const closeOrderModal = () => {
    setSelectedProduct(null);
    setOrderError('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    setOrderError('');

    try {
      await buyerOrdersAPI.placeOrder({
        productId: selectedProduct.id,
        quantity: parseInt(quantity, 10),
      });
      closeOrderModal();
      navigate('/buyer/orders');
    } catch (err) {
      setOrderError(getErrorMessage(err, 'Failed to place your order. Please try again.'));
    } finally {
      setPlacing(false);
    }
  };

  const renderSkeletons = () =>
    Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="bp-skeleton" aria-hidden="true">
        <div className="bp-skeleton-media" />
        <div className="bp-skeleton-body">
          <div className="bp-skeleton-line bp-skeleton-line--lg" />
          <div className="bp-skeleton-line bp-skeleton-line--sm" />
          <div className="bp-skeleton-line bp-skeleton-line--price" />
        </div>
        <div className="bp-skeleton-actions" />
      </div>
    ));

  const renderCard = (product) => {
    const stock = getStock(product.quantity);

    return (
      <div
        key={product.id}
        className="bp-card"
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name}`}
        onClick={() => navigate(`/buyer/products/${product.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/buyer/products/${product.id}`);
          }
        }}
      >
        <div className="bp-card-media">
          <ProductImage product={product} className="bp-image" />
          <WishlistButton product={product} />
          <span className={`bp-stock bp-stock-${stock.tone}`}>{stock.label}</span>
        </div>

        <div className="bp-card-body">
          <h3 className="bp-card-name" title={product.name}>
            {product.name}
          </h3>
          <p className="bp-card-farmer">
            <Icon name="profile" size={13} />
            by {product.farmerName}
            {product.farmerVerified && (
              <span className="bp-verified" title="Verified Farmer">
                <Icon name="badgeCheck" size={13} />
                Verified Farmer
              </span>
            )}
          </p>
          <div className="bp-card-foot">
            <span className="bp-card-price">₹{product.price?.toLocaleString()}</span>
          </div>
        </div>

        <div className="bp-card-actions">
          <button
            className="bp-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              openOrderModal(product);
            }}
            disabled={product.quantity <= 0}
          >
            <Icon name="cart" size={16} />
            {product.quantity > 0 ? 'Add to Order' : 'Out of Stock'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bp-root">
      <div className="bp-inner">
        <header className="bp-head">
          <h1>Browse Products</h1>
          <p className="bp-sub">Fresh produce straight from farmers</p>
        </header>

        <div className="bp-toolbar">
          <div className="bp-search">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="bp-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {!hasQuery && (
            <select
              className="bp-sort"
              value={sort}
              onChange={handleSort}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <div className="bp-pills">
            {['ALL', ...categories].map((cat) => (
              <button
                key={cat}
                className={`bp-pill ${category === cat ? 'active' : ''}`}
                onClick={() => handleCategory(cat)}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {(searching || paging) && (
          <div className="bp-search-status" role="status">
            <span className="spinner" aria-hidden="true" />
            {searching ? 'Searching…' : 'Loading…'}
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="bp-grid">{renderSkeletons()}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="bp-empty">
            <span className="bp-empty-icon">
              <Icon name="search" size={28} />
            </span>
            <h2>
              {hasQuery || totalElements > 0 ? 'No products found' : 'No products available'}
            </h2>
            <p>
              {hasQuery
                ? 'Try a different search term or category.'
                : totalElements === 0
                  ? 'Check back soon — farmers are adding new listings.'
                  : 'Try another category.'}
            </p>
            {(hasQuery || category !== 'ALL') && (
              <button type="button" className="bp-empty-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="bp-grid">{filteredProducts.map(renderCard)}</div>
        )}

        {!hasQuery && (
          <Pagination
            page={page + 1}
            totalPages={totalPages}
            onPageChange={handlePage}
            totalItems={totalElements}
            pageSize={PAGE_SIZE}
          />
        )}
      </div>

      {/* ==========================================
          PLACE ORDER MODAL (design system)
          ========================================== */}
      <Modal
        open={!!selectedProduct}
        onClose={closeOrderModal}
        title="Place Order"
        subtitle={selectedProduct ? `₹${selectedProduct.price?.toLocaleString()} per unit` : ''}
        icon={<Icon name="cart" size={18} />}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={closeOrderModal}>
              Cancel
            </button>
            <button
              type="submit"
              form="bp-order-form"
              className="btn btn-primary"
              disabled={placing}
            >
              {placing ? 'Placing...' : 'Confirm Order'}
            </button>
          </>
        }
      >
        {selectedProduct && (
          <>
            <div className="order-summary">
              <div className="order-summary-item">
                <span className="detail-label">Product</span>
                <span className="detail-value">{selectedProduct.name}</span>
              </div>
              <div className="order-summary-item">
                <span className="detail-label">Farmer</span>
                <span className="detail-value">{selectedProduct.farmerName}</span>
              </div>
              <div className="order-summary-item">
                <span className="detail-label">Price</span>
                <span className="detail-value">₹{selectedProduct.price?.toLocaleString()}</span>
              </div>
              <div className="order-summary-item">
                <span className="detail-label">Available</span>
                <span className="detail-value">{selectedProduct.quantity}</span>
              </div>
            </div>

            {orderError && <div className="alert alert-error">{orderError}</div>}

            <form id="bp-order-form" onSubmit={handlePlaceOrder} className="order-form">
              <div className="form-group">
                <label htmlFor="order-quantity">Quantity</label>
                <input
                  id="order-quantity"
                  type="number"
                  min="1"
                  max={selectedProduct.quantity}
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="order-total">
                <span>Total</span>
                <span className="order-total-amount">
                  ₹
                  {((selectedProduct.price || 0) * (parseInt(quantity, 10) || 0)).toLocaleString()}
                </span>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}

export default BuyerProductsPage;
