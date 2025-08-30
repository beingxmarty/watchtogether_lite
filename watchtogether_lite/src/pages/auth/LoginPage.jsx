import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, signIn, signUp } = useAuth();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const validateForm = () => {
    // Clear previous error
    setError('');

    // Validate email
    if (!email || !email?.trim()) {
      setError('Email is required');
      return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex?.test(email?.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate password
    if (!password || !password?.trim()) {
      setError('Password is required');
      return false;
    }

    if (password?.trim()?.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Additional validation for sign up
    if (isSignUp) {
      if (!displayName || !displayName?.trim()) {
        setError('Display name is required');
        return false;
      }
      if (displayName?.trim()?.length < 2) {
        setError('Display name must be at least 2 characters long');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email?.trim(), password?.trim(), displayName?.trim());
      } else {
        result = await signIn(email?.trim(), password?.trim());
      }

      if (result?.error) {
        // Handle specific Supabase error messages
        const errorMessage = result?.error?.message;
        if (errorMessage?.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (errorMessage?.includes('missing email or phone')) {
          setError('Email address is required. Please enter your email.');
        } else if (errorMessage?.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link to verify your account.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Icon name="Video" size={48} className="text-blue-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Watch videos together in real-time
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <div className="mt-1">
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required={isSignUp}
                    value={displayName}
                    onChange={(e) => setDisplayName(e?.target?.value || '')}
                    placeholder="Your display name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e?.target?.value || '')}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e?.target?.value || '')}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <Icon name="AlertCircle" size={16} className="text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </div>
                ) : (
                  isSignUp ? 'Create account' : 'Sign in'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isSignUp ? 'Already have an account?' : 'New to WatchTogether?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
              >
                {isSignUp ? 'Sign in instead' : 'Create an account'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;