// src/pages/auth/LoginPage.js - Enhanced version
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';


const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await login(data.email, data.password);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Welcome back! 🎉');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error);
      } else {
        toast.success('Welcome to GST SaaS! 🚀');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text-primary mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your GST SaaS account
            </p>
          </div>

          {/* Form */}
          <div className="card-modern p-8 animate-slide-up">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    }
                  })}
                  type="password"
                  className={`form-input-modern ${errors.password ? 'border-red-500' : ''}`}
                  placeholder=" "
                  autoComplete="current-password"
                />
                <label className="form-label-floating">Password</label>
                {errors.password && <div className="form-error mt-2 text-red-600 text-sm">{errors.password.message}</div>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link 
                    to="/forgot-password" 
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary btn-modern btn-lg"
              >
                {loading ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
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
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full btn btn-outline btn-modern btn-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:items-center bg-gradient-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.1'%3E%3Cpath d='m40 40c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm-20.001-2.5c-9.661 0-17.5-7.839-17.5-17.5s7.839-17.5 17.5-17.5 17.5 7.839 17.5 17.5-7.839 17.5-17.5 17.5z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 max-w-md text-center text-white px-8">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6 backdrop-filter backdrop-blur-lg glass">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-6">
            Streamline Your GST Management
          </h2>
          <p className="text-lg text-white/90 leading-relaxed">
            Join thousands of businesses using GST SaaS to simplify their tax compliance, 
            generate professional invoices, and track expenses effortlessly.
          </p>
          
          <div className="mt-8 flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-sm text-white/80">Active Users</div>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-sm text-white/80">Uptime</div>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">4.9★</div>
              <div className="text-sm text-white/80">Rating</div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-8 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/3 right-12 w-6 h-6 bg-white/15 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 left-16 w-3 h-3 bg-white/25 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 right-8 w-5 h-5 bg-white/10 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
      </div>
    </div>
  );
};

export default LoginPage;