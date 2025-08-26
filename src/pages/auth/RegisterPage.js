// src/pages/auth/RegisterPage.js - Enhanced version
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
        toast.success('Welcome to GST SaaS! 🎉 Your account has been created successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
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
        toast.success('Welcome to GST SaaS! 🚀 Your account is ready!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Image/Illustration */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:items-center gradient-success relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='white' fill-opacity='0.1'%3E%3Cpath d='M36 60a24 24 0 100-48 24 24 0 000 48zm0-16a8 8 0 100-16 8 8 0 000 16z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 max-w-md text-center text-white px-8">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6 backdrop-filter backdrop-blur-lg glass">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-6">
            Start Your GST Journey Today
          </h2>
          <p className="text-lg text-white/90 leading-relaxed mb-8">
            Join thousands of small businesses who trust GST SaaS for their 
            compliance needs. Get started for free and transform your business operations.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center text-white/90">
              <svg className="w-5 h-5 mr-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Free forever plan with 10 invoices/month
            </div>
            <div className="flex items-center text-white/90">
              <svg className="w-5 h-5 mr-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              AI-powered receipt scanning
            </div>
            <div className="flex items-center text-white/90">
              <svg className="w-5 h-5 mr-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              GST-compliant invoicing & reports
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-8 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/3 right-12 w-6 h-6 bg-white/15 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 left-16 w-3 h-3 bg-white/25 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 right-8 w-5 h-5 bg-white/10 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto gradient-success rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text-primary mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-600">
              Get started with your free GST SaaS account
            </p>
          </div>

          {/* Form */}
          <div className="card-modern p-8 animate-slide-up">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="form-group-modern">
                <input
                  {...register('fullName', { 
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`form-input-modern ${errors.fullName ? 'border-red-500' : ''}`}
                  placeholder=" "
                  autoComplete="name"
                />
                <label className="form-label-floating">Full Name</label>
                {errors.fullName && <div className="form-error mt-2 text-red-600 text-sm">{errors.fullName.message}</div>}
              </div>

              <div className="form-group-modern">
                <input
                  {...register('businessName', { 
                    required: 'Business name is required'
                  })}
                  type="text"
                  className={`form-input-modern ${errors.businessName ? 'border-red-500' : ''}`}
                  placeholder=" "
                  autoComplete="organization"
                />
                <label className="form-label-floating">Business Name</label>
                {errors.businessName && <div className="form-error mt-2 text-red-600 text-sm">{errors.businessName.message}</div>}
              </div>

              <div className="form-group-modern">
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`form-input-modern ${errors.email ? 'border-red-500' : ''}`}
                  placeholder=" "
                  autoComplete="email"
                />
                <label className="form-label-floating">Email Address</label>
                {errors.email && <div className="form-error mt-2 text-red-600 text-sm">{errors.email.message}</div>}
              </div>

              <div className="form-group-modern">
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
                  className={`form-input-modern ${errors.password ? 'border-red-500' : ''}`}
                  placeholder=" "
                  autoComplete="new-password"
                />
                <label className="form-label-floating">Password</label>
                {errors.password && <div className="form-error mt-2 text-red-600 text-sm">{errors.password.message}</div>}
              </div>

              <div className="form-group-modern">
                <input
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value =>
                      value === watchPassword || 'Passwords do not match'
                  })}
                  type="password"
                  className={`form-input-modern ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder=" "
                  autoComplete="new-password"
                />
                <label className="form-label-floating">Confirm Password</label>
                {errors.confirmPassword && <div className="form-error mt-2 text-red-600 text-sm">{errors.confirmPassword.message}</div>}
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
                    <a href="/terms" className="text-primary-600 hover:text-primary-500 font-semibold">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary-600 hover:text-primary-500 font-semibold">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
              {errors.acceptTerms && <div className="form-error text-red-600 text-sm">{errors.acceptTerms.message}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary btn-modern btn-lg"
              >
                {loading ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full btn btn-outline btn-modern btn-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Creating account...' : 'Sign up with Google'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;