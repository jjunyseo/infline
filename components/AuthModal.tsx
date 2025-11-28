'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          setError('이름을 입력해주세요.');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
      }
      onClose();
      resetForm();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.';
      if (errorMessage.includes('email-already-in-use')) {
        setError('이미 사용 중인 이메일입니다.');
      } else if (errorMessage.includes('invalid-email')) {
        setError('유효하지 않은 이메일 형식입니다.');
      } else if (errorMessage.includes('weak-password')) {
        setError('비밀번호는 6자 이상이어야 합니다.');
      } else if (errorMessage.includes('user-not-found') || errorMessage.includes('wrong-password')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      onClose();
      resetForm();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.';
      if (errorMessage.includes('popup-closed-by-user')) {
        // 사용자가 팝업을 닫은 경우 - 에러 표시 안함
      } else {
        setError('Google 로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-[#1a1a24] border border-[#3a3a4a] rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#4264fb] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">∞</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'signin' ? '로그인' : '회원가입'}
          </h2>
          <p className="text-gray-400 mt-2">
            {mode === 'signin'
              ? 'Infline에 오신 것을 환영합니다'
              : '새 계정을 만들어보세요'}
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">이름</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#3a3a4a] rounded-lg 
                           text-white placeholder-gray-500 focus:outline-none focus:border-[#4264fb]
                           transition-colors"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#3a3a4a] rounded-lg 
                         text-white placeholder-gray-500 focus:outline-none focus:border-[#4264fb]
                         transition-colors"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#3a3a4a] rounded-lg 
                         text-white placeholder-gray-500 focus:outline-none focus:border-[#4264fb]
                         transition-colors"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4264fb] hover:bg-[#5a7bfc] text-white font-semibold 
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                처리 중...
              </span>
            ) : mode === 'signin' ? (
              '로그인'
            ) : (
              '회원가입'
            )}
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-[#3a3a4a]" />
          <span className="px-4 text-sm text-gray-500">또는</span>
          <div className="flex-1 h-px bg-[#3a3a4a]" />
        </div>

        {/* Google 로그인 */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-white font-medium 
                     rounded-lg transition-colors flex items-center justify-center gap-3
                     disabled:opacity-50 disabled:cursor-not-allowed border border-[#3a3a4a]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 계속하기
        </button>

        {/* 모드 전환 */}
        <p className="text-center text-gray-400 mt-6">
          {mode === 'signin' ? (
            <>
              계정이 없으신가요?{' '}
              <button
                onClick={switchMode}
                className="text-[#4264fb] hover:text-[#5a7bfc] font-medium transition-colors"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button
                onClick={switchMode}
                className="text-[#4264fb] hover:text-[#5a7bfc] font-medium transition-colors"
              >
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

