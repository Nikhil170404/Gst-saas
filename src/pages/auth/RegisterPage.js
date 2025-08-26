// src/pages/auth/RegisterPage.js
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const { register: registerUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const watchPassword = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await registerUser(
        data.email, 
        data.password, 
        data.fullName, 
        data.businessName
      );
      
      if (error) {
        toast.error(error);
      } else {
        toast.success('Account created successfully! Welcome to GST SaaS!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error);
      } else {
        toast.success('Welcome to GST SaaS!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Illustration */}
      <div className="hidden lg-flex lg-flex-1 lg-flex-col lg-justify-center lg-items-center bg-success-600">
        <div className="max-w-md text-center text-white px-8">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">
            Start Your GST Journey Today
          </h2>
          <p className="text-success-100">
            Join thousands of small businesses who trust GST SaaS for their 
            compliance needs. Get started for free!
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm-px-6 lg-px-20 xl-px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-gray-600">
              Get started with your free GST SaaS account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                {...register('fullName', { 
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                type="text"
                className={`form-input ${errors.fullName ? 'error' : ''}`}
                placeholder="Your full name"
                autoComplete="name"
              />
              {errors.fullName && <div className="form-error">{errors.fullName.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                {...register('businessName', { 
                  required: 'Business name is required'
                })}
                type="text"
                className={`form-input ${errors.businessName ? 'error' : ''}`}
                placeholder="Your business name"
                autoComplete="organization"
              />
              {errors.businessName && <div className="form-error">{errors.businessName.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && <div className="form-error">{errors.email.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                  }
                })}
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
              {errors.password && <div className="form-error">{errors.password.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value =>
                    value === watchPassword || 'Passwords do not match'
                })}
                type="password"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <div className="form-error">{errors.confirmPassword.message}</div>}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  {...register('acceptTerms', {
                    required: 'You must accept the terms and conditions'
                  })}
                  id="accept-terms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="accept-terms" className="text-gray-700">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
            {errors.acceptTerms && <div className="form-error">{errors.acceptTerms.message}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary btn-lg"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 border-2 mr-2"></div>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full btn btn-outline btn-lg flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
