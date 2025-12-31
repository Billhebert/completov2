import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyDomain: '',
  });

  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        companyDomain: formData.companyDomain,
      });
      toast.success('Registration successful! Welcome to Completo V2');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || error || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      console.error('Registration failed:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg border border-border">
        <div>
          <h2 className="text-center text-3xl font-bold text-foreground">
            Completo V2
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Create your company account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}

          <div className="space-y-4">
            {/* Personal Information */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="••••••••"
                minLength={8}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            {/* Company Information */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">Company Information</h3>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-foreground">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Acme Corporation"
              />
            </div>

            <div>
              <label htmlFor="companyDomain" className="block text-sm font-medium text-foreground">
                Company Domain
              </label>
              <input
                id="companyDomain"
                name="companyDomain"
                type="text"
                required
                value={formData.companyDomain}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="acme"
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens allowed"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens. This will be your unique company identifier.
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
