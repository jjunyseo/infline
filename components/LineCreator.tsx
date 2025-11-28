'use client';

import { useLines } from '@/store/useLines';
import { Line } from '@/types';
import { getRandomLineColor } from '@/lib/lineGenerator';

export default function LineCreator() {
  const {
    creationStep,
    creationConfig,
    userLocation,
    previewGeometry,
    previewCenter,
    setCreationStep,
    setCreationMode,
    setMaxRiders,
    setRadius,
    goBack,
    resetCreation,
    removeSelectedPoint,
    removeZone,
    updateZone,
    addLine,
  } = useLines();

  const handleStartDirectionMode = () => {
    setCreationMode('direction');
    setCreationStep('select-direction');
  };

  const handleStartPointsMode = () => {
    setCreationMode('points');
    setCreationStep('select-points');
  };

  const handleSaveLine = () => {
    if (!userLocation || !previewGeometry) return;

    const newLine: Line = {
      id: `line-${Date.now()}`,
      creatorId: 'user-1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      geometry: previewGeometry,
      color: getRandomLineColor(),
      maxRiders: creationConfig.maxRiders,
      riderCount: 0,
      center: previewCenter || [userLocation.lon, userLocation.lat],
      radius: creationConfig.radius,
      bearing: creationConfig.bearing,
      zones: [...creationConfig.zones],
    };

    addLine(newLine);
    resetCreation();
  };

  // 모드 선택 화면
  if (creationStep === 'select-mode') {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">생성 방식 선택</h3>
          <div className="space-y-2">
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
                    내 위치에서 방향을 선택하여 선을 만듭니다.
                  </p>
                </div>
              </div>
            </button>

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
                    2개의 위치를 선택하면, 3점을 지나는 원이 생성됩니다.
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
      </div>
    );
  }

  // 방향 선택 단계
  if (creationStep === 'select-direction') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[#4264fb]">
            <span className="text-xl">🧭</span>
            <span className="font-medium">방향 선택</span>
          </div>
        </div>

        <div className="p-4 bg-[#1a1a24] rounded-xl border border-[#3a3a4a]">
          <p className="text-sm text-gray-300 mb-2">
            지구에서 선이 나아갈 방향을 클릭하세요.
          </p>
          <p className="text-xs text-gray-500">
            클릭하면 다음 단계로 이동합니다.
          </p>
        </div>
      </div>
    );
  }

  // 2점 선택 단계
  if (creationStep === 'select-points') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[#00d4aa]">
            <span className="text-xl">📍</span>
            <span className="font-medium">위치 선택</span>
          </div>
        </div>

        <div className="p-4 bg-[#1a1a24] rounded-xl border border-[#3a3a4a]">
          <p className="text-sm text-gray-300 mb-2">
            지구에서 2개의 위치를 선택하세요.
          </p>
          <p className="text-xs text-gray-500">
            내 위치 + 선택한 2점이 하나의 원 위에 놓입니다.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400">선택된 위치</h4>

          <div className="flex items-center gap-2 p-3 bg-[#4264fb]/10 border border-[#4264fb]/30 rounded-lg">
            <div className="w-6 h-6 bg-[#4264fb] rounded-full flex items-center justify-center">
              <span className="text-white text-xs">나</span>
            </div>
            <span className="text-sm text-white">내 위치</span>
            <span className="text-xs text-gray-500 ml-auto">고정</span>
          </div>

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

          {Array.from({ length: 2 - creationConfig.selectedPoints.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex items-center gap-2 p-3 bg-[#1a1a24]/50 border border-dashed border-[#3a3a4a] rounded-lg"
            >
              <div className="w-6 h-6 bg-[#2a2a3a] rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-xs">{creationConfig.selectedPoints.length + index + 1}</span>
              </div>
              <span className="text-sm text-gray-500">지도에서 클릭...</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 커스터마이징 단계
  if (creationStep === 'customize') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[#ffe66d]">
            <span className="text-xl">⚙️</span>
            <span className="font-medium">선 설정</span>
          </div>
        </div>

        <div className="p-4 bg-[#1a1a24] rounded-xl border border-[#3a3a4a]">
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 지도에서 <span className="text-white">선을 드래그</span>하여 반경 조절</li>
            <li>• 지도에서 <span className="text-white">선 위를 클릭</span>하여 구역 추가</li>
          </ul>
        </div>

        <div className="space-y-3">
          {/* 반경 (방향 모드만) */}
          {creationConfig.mode === 'direction' && (
            <div className="p-3 bg-[#1a1a24] rounded-lg border border-[#3a3a4a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">반경</span>
                <span className="text-sm text-white font-medium">
                  {creationConfig.radius >= 20000 
                    ? '대원 (지구 한 바퀴)' 
                    : `${Math.round(creationConfig.radius).toLocaleString()} km`}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="20037"
                value={creationConfig.radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-[#2a2a3a] rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#4264fb] 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          )}

          {/* 최대 인원 */}
          <div className="p-3 bg-[#1a1a24] rounded-lg border border-[#3a3a4a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">최대 탑승 인원</span>
              <span className="text-sm text-white font-medium">{creationConfig.maxRiders}명</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={creationConfig.maxRiders}
              onChange={(e) => setMaxRiders(Number(e.target.value))}
              className="w-full h-2 bg-[#2a2a3a] rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#4264fb] 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>

        {/* 구역 목록 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-400">탑승 구역</h4>
            <button
              onClick={() => setCreationStep('add-zone')}
              className="text-xs text-[#ff6b6b] hover:text-[#ff8787] transition-colors"
            >
              + 구역 추가
            </button>
          </div>

          {creationConfig.zones.length === 0 ? (
            <p className="text-xs text-gray-600 p-3 bg-[#1a1a24] rounded-lg border border-dashed border-[#3a3a4a]">
              구역이 없으면 선 전체에서 탑승 가능합니다.
            </p>
          ) : (
            creationConfig.zones.map((zone, index) => (
              <div
                key={zone.id}
                className="p-3 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-[#ff6b6b] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">{index + 1}</span>
                  </div>
                  <span className="text-sm text-white flex-1">구역 {index + 1}</span>
                  <button
                    onClick={() => removeZone(zone.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">반경</span>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={zone.radius}
                    onChange={(e) => updateZone(zone.id, { radius: Number(e.target.value) })}
                    className="flex-1 h-1.5 bg-[#2a2a3a] rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                               [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#ff6b6b] 
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-xs text-white w-16 text-right">{Math.round(zone.radius)} km</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="pt-4 space-y-2">
          <button
            onClick={handleSaveLine}
            disabled={!previewGeometry}
            className="w-full py-3 bg-[#4264fb] hover:bg-[#5a7bfc] text-white font-semibold 
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ 선 저장하기
          </button>
          <button
            onClick={resetCreation}
            className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 
                       font-medium rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  // 구역 추가 단계
  if (creationStep === 'add-zone') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[#ff6b6b]">
            <span className="text-xl">📍</span>
            <span className="font-medium">구역 추가</span>
          </div>
        </div>

        <div className="p-4 bg-[#1a1a24] rounded-xl border border-[#3a3a4a]">
          <p className="text-sm text-gray-300 mb-2">
            선 위의 위치를 클릭하세요.
          </p>
          <p className="text-xs text-gray-500">
            선에 가까이 가면 커서가 바뀝니다.
            <br />클릭 후 드래그로 반경을 조절할 수 있습니다.
          </p>
        </div>

        <button
          onClick={goBack}
          className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 
                     font-medium rounded-lg transition-colors"
        >
          뒤로
        </button>
      </div>
    );
  }

  return null;
}
