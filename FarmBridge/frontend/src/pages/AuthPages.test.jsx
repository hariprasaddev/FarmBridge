import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

// Mock the API module so the pages never make real network calls.
const { authAPIMock } = vi.hoisted(() => ({
  authAPIMock: { register: vi.fn(), login: vi.fn() },
}));

vi.mock('../services/api', () => ({
  authAPI: authAPIMock,
  getErrorMessage: (err, fallback) =>
    err?.response?.data?.message ||
    (typeof err?.response?.data === 'string' ? err.response.data : '') ||
    fallback,
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/buyer/dashboard" element={<div>buyer dashboard</div>} />
          <Route path="/farmer/dashboard" element={<div>farmer dashboard</div>} />
          <Route path="/admin/dashboard" element={<div>admin dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('LoginPage — password visibility', () => {
  it('toggles the password field between hidden and visible (Test 4)', () => {
    renderLogin();
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});

describe('LoginPage — validation', () => {
  it('blocks an empty password without calling the backend (Test 3)', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(authAPIMock.login).not.toHaveBeenCalled();
  });

  it('blocks an empty email without calling the backend', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'FarmBridge@123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(authAPIMock.login).not.toHaveBeenCalled();
  });

  it('blocks an invalid email format without calling the backend', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'FarmBridge@123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(
      screen.getByText('Please enter a valid email address.')
    ).toBeInTheDocument();
    expect(authAPIMock.login).not.toHaveBeenCalled();
  });

  it('submits valid credentials to the login API and signs in (Test 1)', async () => {
    authAPIMock.login.mockResolvedValue({
      data: { token: 'jwt', email: 'a@b.com', role: 'BUYER' },
    });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'FarmBridge@123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() =>
      expect(screen.getByText('buyer dashboard')).toBeInTheDocument()
    );
    expect(authAPIMock.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'FarmBridge@123',
    });
  });

  it('shows the server error message for wrong credentials (Test 2)', async () => {
    authAPIMock.login.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'WrongPass@999' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() =>
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    );
  });
});

describe('RegisterPage — password visibility', () => {
  it('toggles password and confirm password independently (Test 9)', () => {
    renderRegister();
    const password = screen.getByLabelText('Password');
    const confirm = screen.getByLabelText('Confirm Password');
    expect(password).toHaveAttribute('type', 'password');
    expect(confirm).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(confirm).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show confirmation' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(confirm).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
    expect(confirm).toHaveAttribute('type', 'text');
  });
});

describe('RegisterPage — validation', () => {
  const fillValid = () => {
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'FarmBridge@123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'FarmBridge@123' },
    });
  };

  it('blocks mismatched passwords and never calls the backend (Test 6)', () => {
    renderRegister();
    fillValid();
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'FarmBridge@124' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(authAPIMock.register).not.toHaveBeenCalled();
  });

  it('blocks a weak password with the rules message (Test 7)', () => {
    renderRegister();
    fillValid();
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: '12345678' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: '12345678' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(
      screen.getByText(/at least 8 characters.*uppercase/i)
    ).toBeInTheDocument();
    expect(authAPIMock.register).not.toHaveBeenCalled();
  });

  it('shows the duplicate-email error from the backend (Test 8)', async () => {
    authAPIMock.register.mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });
    renderRegister();
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() =>
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    );
  });

  it('sends only name, email, password and role — never confirmPassword (Test 5)', async () => {
    authAPIMock.register.mockResolvedValue({ data: 'User Registered Successfully' });
    renderRegister();
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() =>
      expect(screen.getByText('login page')).toBeInTheDocument()
    );
    expect(authAPIMock.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'a@b.com',
      password: 'FarmBridge@123',
      role: 'FARMER',
    });
    expect(authAPIMock.register.mock.calls[0][0]).not.toHaveProperty(
      'confirmPassword'
    );
  });
});
