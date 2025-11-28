'use client';

import { useLines } from '@/store/useLines';

export default function LineCreator() {
  const {
    creationMode,
    creationConfig,
    userLocation,
    setCreationMode,
    setCreationConfigMode,
    setMaxRiders,
    setCustomRadius,
    clearSelectedPoints,
    removeSelectedPoint,
    resetCreation,
  } = useLines();

  const isCreating = creationMode !== 'idle';

  const handleStartDirectionMode = () => {
    setCreationConfigMode('direction');
    setCreationMode('direction');
  };

  const handleStartPointsMode = () => {
    setCreationConfigMode('points');
    clearSelectedPoints();
    setCreationMode('points');
  };

  const handleCancel = () => {
    resetCreation();
  };

  return (
    <div className="p-4 space-y-6">
      {/* 생성 모드 선택 */}
      {!isCreating && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">생성 방식 선택</h3>
            <div className="space-y-2">
              {/* 방향 선택 방식 */}
              <button
                onClick={handleStartDirectionMode}
                disabled={!userLocation}
                className="w-full p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl 
                           hover:border-[#4264fb]/50 transition-all text-left group
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#4264fb]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#4264fb]/30 transition-colors">
                    <span className="text-xl">🧭</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">방향 선택</h4>
                    <p className="text-xs text-gray-500">
                      내 위치에서 방향을 선택하여 지구를 한 바퀴 도는 선을 만듭니다.
                    </p>
                  </div>
                </div>
              </button>

              {/* 2점 선택 방식 */}
              <button
                onClick={handleStartPointsMode}
                disabled={!userLocation}
                className="w-full p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl 
                           hover:border-[#00d4aa]/50 transition-all text-left group
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00d4aa]/30 transition-colors">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">위치 선택</h4>
                    <p className="text-xs text-gray-500">
                      2개의 위치를 선택하면, 내 위치와 함께 3점을 지나는 원이 생성됩니다.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {!userLocation && (
            <p className="text-xs text-yellow-500 text-center">
              ⚠️ 위치 정보를 가져오는 중...
            </p>
          )}
        </>
      )}

      {/* 방향 선택 모드 */}
      {creationMode === 'direction' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#4264fb]">
            <span className="text-xl">🧭</span>
            <span className="font-medium">방향 선택 모드</span>
          </div>
          
          <div className="p-4 bg-[#1a1a24] rounded-xl border border-[#3a3a4a]">
            <p className="text-sm text-gray-300 mb-2">
              지구를 클릭하여 선의 방향을 선택하세요.
            </p>
            <p className="text-xs text-gray-500">
              선이 나아갈 방향을 가리키는 곳을 클릭하면 됩니다.
            </p>
          </div>

          {/* 설정 옵션 */}
          <LineSettings />

          <button
            onClick={handleCancel}
            className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 
                       font-medium rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      )}

      {/* 2점 선택 모드 */}
      {creationMode === 'points' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#00d4aa]">
            <span className="text-xl">📍</span>
            <span className="font-medium">위치 선택 모드</span>
          </div>

          <div className="p-4 bg-[#1a1a24] rounded-xl border border-[#3a3a4a]">
            <p className="text-sm text-gray-300 mb-2">
              지구에서 2개의 위치를 선택하세요.
            </p>
            <p className="text-xs text-gray-500">
              내 위치 + 선택한 2점이 하나의 원 위에 놓이게 됩니다.
            </p>
          </div>

          {/* 선택된 점 표시 */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400">선택된 위치</h4>
            
            {/* 내 위치 (고정) */}
            <div className="flex items-center gap-2 p-3 bg-[#4264fb]/10 border border-[#4264fb]/30 rounded-lg">
              <div className="w-6 h-6 bg-[#4264fb] rounded-full flex items-center justify-center">
                <span className="text-white text-xs">나</span>
              </div>
              <span className="text-sm text-white">내 위치</span>
              <span className="text-xs text-gray-500 ml-auto">고정</span>
            </div>

            {/* 선택한 점들 */}
            {creationConfig.selectedPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg"
              >
                <div className="w-6 h-6 bg-[#00d4aa] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">{index + 1}</span>
                </div>
                <span className="text-sm text-white truncate flex-1">
                  {point[1].toFixed(4)}, {point[0].toFixed(4)}
                </span>
                <button
                  onClick={() => removeSelectedPoint(index)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* 빈 슬롯 */}
            {Array.from({ length: 2 - creationConfig.selectedPoints.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center gap-2 p-3 bg-[#1a1a24]/50 border border-dashed border-[#3a3a4a] rounded-lg"
              >
                <div className="w-6 h-6 bg-[#2a2a3a] rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-xs">{creationConfig.selectedPoints.length + index + 1}</span>
                </div>
                <span className="text-sm text-gray-500">지도에서 선택...</span>
              </div>
            ))}
          </div>

          {/* 설정 옵션 */}
          {creationConfig.selectedPoints.length === 2 && <LineSettings />}

          <button
            onClick={handleCancel}
            className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 
                       font-medium rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      )}

      {/* 구역 설정 모드 */}
      {creationMode === 'zone-select' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#ff6b6b]">
            <span className="text-xl">🎯</span>
            <span className="font-medium">구역 설정 모드</span>
          </div>

          <div className="p-4 bg-[#1a1a24] rounded-xl border border-[#3a3a4a]">
            <p className="text-sm text-gray-300 mb-2">
              선 위의 한 점을 선택하세요.
            </p>
            <p className="text-xs text-gray-500">
              그 점을 중심으로 반경 5km 이내의 구역이 설정됩니다.
            </p>
          </div>

          <button
            onClick={() => setCreationMode('configuring')}
            className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 
                       font-medium rounded-lg transition-colors"
          >
            뒤로
          </button>
        </div>
      )}
    </div>
  );
}

// 선 설정 컴포넌트
function LineSettings() {
  const {
    creationConfig,
    setMaxRiders,
    setCustomRadius,
    setCreationMode,
    addZone,
    removeZone,
  } = useLines();

  return (
    <div className="space-y-4 pt-4 border-t border-[#3a3a4a]">
      <h4 className="text-sm font-semibold text-gray-400">선 설정</h4>

      {/* 최대 인원 */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">최대 탑승 인원</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="1"
            max="100"
            value={creationConfig.maxRiders}
            onChange={(e) => setMaxRiders(Number(e.target.value))}
            className="flex-1 h-2 bg-[#2a2a3a] rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#4264fb] 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-white font-medium w-10 text-right">
            {creationConfig.maxRiders}
          </span>
        </div>
      </div>

      {/* 커스텀 반경 */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">
          원 반경 (km) - 선택사항
        </label>
        <input
          type="number"
          min="100"
          max="20000"
          placeholder="기본값: 지구 둘레 (대원)"
          value={creationConfig.customRadius || ''}
          onChange={(e) => setCustomRadius(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full px-3 py-2 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg 
                     text-white placeholder-gray-600 focus:outline-none focus:border-[#4264fb]
                     text-sm"
        />
      </div>

      {/* 구역 설정 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">탑승 구역 (선택사항)</label>
          <button
            onClick={() => setCreationMode('zone-select')}
            className="text-xs text-[#4264fb] hover:text-[#5a7bfc] transition-colors"
          >
            + 구역 추가
          </button>
        </div>
        
        {creationConfig.zones.length === 0 ? (
          <p className="text-xs text-gray-600 p-3 bg-[#1a1a24] rounded-lg border border-dashed border-[#3a3a4a]">
            구역을 설정하지 않으면 선 전체에서 탑승 가능합니다.
          </p>
        ) : (
          <div className="space-y-2">
            {creationConfig.zones.map((zone, index) => (
              <div
                key={zone.id}
                className="flex items-center gap-2 p-3 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg"
              >
                <div className="w-6 h-6 bg-[#ff6b6b] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <span className="text-sm text-white">반경 {zone.radius.toFixed(1)}km</span>
                </div>
                <button
                  onClick={() => removeZone(zone.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

