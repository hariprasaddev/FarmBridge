import { useEffect, useRef, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import './SearchBar.css';

/**
 * Controlled search input with a debounced callback and clear button.
 * @example <SearchBar placeholder="Search products…" value={q} onChange={setQ} debounceMs={300} />
 */
function SearchBar({
  value = '',
  onChange = () => {},
  placeholder = 'Search…',
  debounceMs = 250,
  compact = false,
  className = '',
  ...rest
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef(null);

  // Keep local state in sync when the parent resets the value.
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (e) => {
    const next = e.target.value;
    setLocal(next);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onChange(next), debounceMs);
  };

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const clear = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setLocal('');
    onChange('');
  };

  return (
    <div className={`fb-searchbar${compact ? ' fb-searchbar-compact' : ''}${className ? ` ${className}` : ''}`}>
      <span className="fb-searchbar-icon" aria-hidden="true">
        <FaSearch size={15} />
      </span>
      <input
        type="search"
        className="fb-searchbar-input"
        placeholder={placeholder}
        value={local}
        onChange={handleChange}
        aria-label={placeholder}
        {...rest}
      />
      {local && (
        <button type="button" className="fb-searchbar-clear" onClick={clear} aria-label="Clear search">
          <FaTimes size={13} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
