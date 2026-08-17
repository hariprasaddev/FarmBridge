import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above the imports, so the stub instance must be
// created with vi.hoisted to be available inside the factory.
const { mockInstance } = vi.hoisted(() => {
  const mockInstance = {
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { mockInstance };
});

// Mock the axios module so `api` is a stub instance whose calls we can
// assert without making real network requests.
vi.mock('axios', () => ({
  default: { create: vi.fn(() => mockInstance) },
}));

import {
  authAPI,
  buyerProductsAPI,
  getErrorMessage,
} from './api';

// The request interceptor is registered when api.js is imported. Capture
// the function reference once (before any beforeEach clears call history)
// so the JWT-header behaviour can be asserted directly.
const [requestInterceptor] = mockInstance.interceptors.request.use.mock.calls[0];

describe('api instance wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('attaches the JWT from storage to every request (request interceptor)', () => {
    localStorage.setItem('token', 'jwt-token-123');

    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer jwt-token-123');
  });

  it('buyerProductsAPI.searchProducts hits the search endpoint with the name param', () => {
    buyerProductsAPI.searchProducts('rice');

    expect(mockInstance.get).toHaveBeenCalledWith('/buyer/products/search', {
      params: { name: 'rice' },
    });
  });

  it('buyerProductsAPI.getAllProducts forwards page/size/sort params', () => {
    buyerProductsAPI.getAllProducts({ page: 2, size: 12, sort: 'price,desc' });

    expect(mockInstance.get).toHaveBeenCalledWith('/buyer/products', {
      params: { page: 2, size: 12, sort: 'price,desc' },
    });
  });

  it('buyerProductsAPI.getCategories hits the categories endpoint', () => {
    buyerProductsAPI.getCategories();

    expect(mockInstance.get).toHaveBeenCalledWith('/buyer/products/categories');
  });

  it('authAPI.login posts to /auth/login', () => {
    authAPI.login({ email: 'a@b.com', password: 'pw' });

    expect(mockInstance.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: 'pw',
    });
  });
});

describe('getErrorMessage', () => {
  it('returns a plain-string server body verbatim', () => {
    const err = { response: { data: 'Email already exists' } };
    expect(getErrorMessage(err, 'fallback')).toBe('Email already exists');
  });

  it('returns the server-provided message field', () => {
    const err = { response: { data: { message: 'Product not found' } } };
    expect(getErrorMessage(err, 'fallback')).toBe('Product not found');
  });

  it('returns the first bean-validation error from an array', () => {
    const err = {
      response: {
        data: { errors: [{ defaultMessage: 'Name is required' }] },
      },
    };
    expect(getErrorMessage(err, 'fallback')).toBe('Name is required');
  });

  it('returns the first field error from a map', () => {
    const err = {
      response: {
        data: { errors: { price: 'Price must be greater than 0' } },
      },
    };
    expect(getErrorMessage(err, 'fallback')).toBe('Price must be greater than 0');
  });

  it('returns a friendly message for 5xx responses', () => {
    const err = { response: { status: 500, data: {} } };
    expect(getErrorMessage(err, 'fallback')).toContain(
      'The server is having trouble right now'
    );
  });

  it('returns a connection message when there is no response', () => {
    const err = { request: {} };
    expect(getErrorMessage(err, 'fallback')).toContain(
      'Unable to reach the server'
    );
  });

  it('falls back to the provided message when the response shape is unknown', () => {
    // A response exists but carries neither a message nor errors and is
    // not a 5xx — the caller's fallback is the last resort.
    const err = { response: { status: 400, data: {} } };
    expect(getErrorMessage(err, 'Something went wrong')).toBe(
      'Something went wrong'
    );
  });
});
