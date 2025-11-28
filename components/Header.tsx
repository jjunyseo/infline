'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4264fb] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">∞</span>
          </div>
          <span className="text-xl font-bold text-white">infline</span>
        </Link>

        {/* 네비게이션 */}
        <div className="flex items-center gap-6">
          <a
            href="#about"
            className="text-gray-400 hover:text-white transition-colors hidden md:block"
          >
            About
          </a>
          <a
            href="#how"
            className="text-gray-400 hover:text-white transition-colors hidden md:block"
          >
            How it works
          </a>

          {loading ? (
            // 로딩 중
            <div className="w-8 h-8 border-2 border-[#4264fb] border-t-transparent rounded-full animate-spin" />
          ) : user ? (
            // 로그인 상태
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-[#1a1a24] border border-[#3a3a4a] 
                           rounded-lg hover:bg-[#2a2a3a] transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-[#4264fb] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-white text-sm hidden md:block">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#3a3a4a]">
                    <p className="text-sm text-white font-medium truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/globe"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#2a2a3a] transition-colors"
                  >
                    🌍 지구 보기
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#2a2a3a] transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 비로그인 상태
            <>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                로그인
              </button>
              <Link
                href="/globe"
                className="px-4 py-2 bg-[#4264fb] hover:bg-[#5a7bfc] text-white rounded-lg transition-colors"
              >
                Enter
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* 인증 모달 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}

