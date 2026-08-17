import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// Exposes the context actions to the test through a tiny harness component.
function Harness({ onReady }) {
  const auth = useAuth();
  return (
    <div>
      <button type="button" onClick={() => onReady?.(auth)}>
        ready
      </button>
    </div>
  );
}

function renderApp(onReady) {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/buyer/dashboard" element={<div>buyer dashboard</div>} />
          <Route path="/farmer/dashboard" element={<div>farmer dashboard</div>} />
          <Route path="/admin/dashboard" element={<div>admin dashboard</div>} />
        </Routes>
        <Harness onReady={onReady} />
      </AuthProvider>
    </MemoryRouter>
  );
}

const clickReady = (onReady) => {
  const { getByText } = renderApp(onReady);
  act(() => {
    getByText('ready').click();
  });
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('AuthContext', () => {
  it('hydrates the session from storage on mount', () => {
    localStorage.setItem('token', 't1');
    localStorage.setItem('email', 'a@b.com');
    localStorage.setItem('role', 'BUYER');

    let auth;
    clickReady((a) => {
      auth = a;
    });

    expect(auth.token).toBe('t1');
    expect(auth.email).toBe('a@b.com');
    expect(auth.role).toBe('BUYER');
    expect(auth.isAuthenticated).toBe(true);
  });

  it('login without rememberMe stores the session in sessionStorage', () => {
    let auth;
    clickReady((a) => {
      auth = a;
    });
    act(() => {
      auth.login({ token: 't2', email: 'b@b.com', role: 'FARMER' });
    });

    expect(sessionStorage.getItem('token')).toBe('t2');
    expect(sessionStorage.getItem('email')).toBe('b@b.com');
    expect(sessionStorage.getItem('role')).toBe('FARMER');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('login with rememberMe stores the session in localStorage', () => {
    let auth;
    clickReady((a) => {
      auth = a;
    });
    act(() => {
      auth.login({ token: 't3', email: 'c@b.com', role: 'ADMIN' }, true);
    });

    expect(localStorage.getItem('token')).toBe('t3');
    expect(localStorage.getItem('role')).toBe('ADMIN');
  });

  it('login navigates to the role-specific dashboard', async () => {
    let auth;
    clickReady((a) => {
      auth = a;
    });
    act(() => {
      auth.login({ token: 't4', email: 'd@b.com', role: 'BUYER' });
    });

    await waitFor(() => expect(screen.getByText('buyer dashboard')).toBeInTheDocument());
  });

  it('logout clears both storages and navigates to /login', async () => {
    let auth;
    clickReady((a) => {
      auth = a;
    });
    act(() => {
      auth.login({ token: 't5', email: 'e@b.com', role: 'BUYER' });
    });
    await waitFor(() => expect(screen.getByText('buyer dashboard')).toBeInTheDocument());

    act(() => {
      auth.logout();
    });

    await waitFor(() => expect(screen.getByText('login page')).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
  });
});
