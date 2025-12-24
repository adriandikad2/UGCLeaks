'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '@/lib/auth';
import { ToastContainer, useToast } from '@/app/Toast';

// Lazy load theme to avoid SSG issues
const useThemeLocal = () => {
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [buttonText, setButtonText] = useState('SWITCH TO B&W');
  const [toggleTheme] = useState(() => () => {});
  return { isGrayscale, toggleTheme, buttonText };
};

export default function SignupPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const { isGrayscale, toggleTheme, buttonText } = useThemeLocal();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.username || !formData.email || !formData.password) {
      addToast('Please fill in all fields', 'error');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      setLoading(false);
      return;
    }

    try {
      await signup(formData.username, formData.email, formData.password);
      addToast('Account created successfully! Redirecting to signin...', 'success');
      setTimeout(() => router.push('/auth/signin'), 1500);
    } catch (error) {
      addToast(
        `${error instanceof Error ? error.message : 'Signup failed'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 flex items-center justify-center p-4 transition-all duration-700 ${isGrayscale ? 'grayscale' : ''}`}>
      {/* --- THEME TOGGLE BUTTON --- */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 px-6 py-2 rounded-full border-2 border-white/50 text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300 group"
      >
        <span className="animate-pulse group-hover:animate-none">
          {buttonText}
        </span>
      </button>

      {/* --- HOME LINK --- */}
      <Link href="/" className="absolute top-6 left-6 z-50">
        <button className="px-6 py-2 rounded-full border-2 border-white/50 text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300">
          ← Home
        </button>
      </Link>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">
            🎮 Join UGC Leaks
          </h1>
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose your username"
              className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600 text-gray-800"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600 text-gray-800"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600 text-gray-800"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600 text-gray-800"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Creating Account...' : '✨ Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">Already have an account?</p>
          <Link href="/auth/signin" className="text-blue-600 font-bold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
