import Link from 'next/link';
import Header from '@/components/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#4264fb]/5 via-transparent to-[#00d4aa]/5" />

      {/* 배경 원형 효과 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4264fb]/10 rounded-full blur-3xl" />

      {/* 헤더 */}
      <Header />

      {/* 히어로 섹션 */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-8 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Lines that connect
          <br />
          <span className="gradient-text">the world</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mb-10">
          지구 위에 선을 그리고, 그 선 위에 있는 사람들과 연결되세요.
          <br />
          하루 동안 서로의 일상을 공유합니다.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/globe"
            className="px-8 py-4 bg-[#4264fb] hover:bg-[#5a7bfc] text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-[#4264fb]/30 btn-glow"
          >
            지구로 들어가기
          </Link>
          <a
            href="#how"
            className="px-8 py-4 bg-[#1a1a24] border border-[#3a3a4a] text-white rounded-xl hover:bg-[#2a2a3a] transition-colors"
          >
            더 알아보기
          </a>
        </div>

        {/* 지구 미리보기 */}
        <div className="mt-16 relative">
          <div className="w-80 h-80 rounded-full bg-gradient-to-br from-[#4264fb]/20 to-[#00d4aa]/20 flex items-center justify-center border border-[#3a3a4a] shadow-2xl shadow-[#4264fb]/20">
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-[#1a1a24] to-[#2a2a3a] flex items-center justify-center border border-[#3a3a4a]">
              <div className="text-6xl">🌍</div>
            </div>
          </div>
          {/* 선 효과 */}
          <div className="absolute top-10 -left-20 w-40 h-0.5 bg-gradient-to-r from-transparent to-[#00d4aa] rotate-45" />
          <div className="absolute bottom-20 -right-16 w-32 h-0.5 bg-gradient-to-l from-transparent to-[#4264fb] -rotate-12" />
          <div className="absolute top-32 -right-24 w-48 h-0.5 bg-gradient-to-l from-transparent to-[#ff6b6b] rotate-30" />
        </div>
      </section>

      {/* 특징 섹션 */}
      <section id="how" className="relative z-10 py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* 카드 1 */}
            <div className="bg-[#1a1a24] border border-[#3a3a4a] rounded-2xl p-8 hover:border-[#4264fb]/50 transition-colors">
              <div className="w-12 h-12 bg-[#4264fb]/20 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                위치에서 시작
              </h3>
              <p className="text-gray-400">
                당신의 현재 위치에서 선이 시작됩니다. 지구 어디서든 시작할 수
                있어요.
              </p>
            </div>

            {/* 카드 2 */}
            <div className="bg-[#1a1a24] border border-[#3a3a4a] rounded-2xl p-8 hover:border-[#00d4aa]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00d4aa]/20 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🧵</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                방향을 선택
              </h3>
              <p className="text-gray-400">
                선이 나아갈 방향을 선택하면, 지구를 한 바퀴 감싸는 선이
                생성됩니다.
              </p>
            </div>

            {/* 카드 3 */}
            <div className="bg-[#1a1a24] border border-[#3a3a4a] rounded-2xl p-8 hover:border-[#ff6b6b]/50 transition-colors">
              <div className="w-12 h-12 bg-[#ff6b6b]/20 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                일상을 공유
              </h3>
              <p className="text-gray-400">
                그 선 위에 있는 사람들과 24시간 동안 일상을 공유하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="relative z-10 border-t border-[#3a3a4a] py-8 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4264fb] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">∞</span>
            </div>
            <span className="text-sm text-gray-400">© 2024 infline</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms
            </a>
            <a
              href="https://github.com/jjunyseo/infline"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
