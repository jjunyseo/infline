'use client';

import { useLines } from '@/store/useLines';
import { Line, Zone, CreationScope } from '@/types';
import { getRandomLineColor, offsetToDisplayRadius } from '@/lib/lineGenerator';

const SCOPE_INFO: Record<CreationScope, { icon: string; label: string; description: string }> = {
  nearby: { icon: '📍', label: '근처', description: '반경 1km 내 주변 지역' },
  city: { icon: '🏙️', label: '도시', description: '내가 있는 도시 전체' },
  country: { icon: '🏳️', label: '국가', description: '내가 있는 국가 전체' },
  globe: { icon: '🌍', label: '지구', description: '지구 전체를 대상으로' },
};

export default function LineCreator() {
  const {
    creationStep,
    creationConfig,
    userLocation,
    previewGeometry,
    previewCenter,
    offset,
    setCreationStep,
    setScope,
    setCreationType,
    setLineMode,
    setMaxRiders,
    setOffset,
    goBack,
    resetCreation,
    removeSelectedPoint,
    removeLineZone,
    updateLineZone,
    removeCreationZone,
    updateCreationZone,
    addLine,
    addStandaloneZone,
  } = useLines();

  // 슬라이더 변경 시
  const handleSliderChange = (value: number) => {
    const newOffset = (value - 50) / 50;
    setOffset(newOffset);
  };

  const sliderValue = 50 + offset * 50;
  const displayRadius = offsetToDisplayRadius(offset);

  // 스코프 선택
  const handleSelectScope = (scope: CreationScope) => {
    setScope(scope);
    setCreationStep('select-type');
  };

  // 유형 선택 (선/구역)
  const handleSelectType = (type: 'line' | 'zone') => {
    setCreationType(type);
    if (type === 'line') {
      setCreationStep('select-mode');
    } else {
      setCreationStep('zone-place');
    }
  };

  // 선 만들기 모드 선택
  const handleSelectLineMode = (mode: 'direction' | 'points') => {
    setLineMode(mode);
    setCreationStep(mode === 'direction' ? 'select-direction' : 'select-points');
  };

  // 선 저장
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
      radius: displayRadius,
      bearing: creationConfig.bearing,
      zones: [...creationConfig.lineZones],
    };

    addLine(newLine);
    resetCreation();
  };

  // 구역 저장
  const handleSaveZones = () => {
    if (!userLocation) return;

    creationConfig.zones.forEach((zone) => {
      const newZone: Zone = {
        ...zone,
        creatorId: 'user-1',
        createdAt: new Date().toISOString(),
      };
      addStandaloneZone(newZone);
    });

    resetCreation();
  };

  // 1. 스코프 선택 화면
  if (creationStep === 'select-scope') {
    return (
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">어디서 시작할까요?</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SCOPE_INFO) as CreationScope[]).map((scope) => {
            const info = SCOPE_INFO[scope];
            return (
              <button
                key={scope}
                onClick={() => handleSelectScope(scope)}
                disabled={!userLocation}
                className="p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl hover:border-[#4264fb]/50 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-3xl mb-2">{info.icon}</div>
                <h4 className="text-white font-medium text-sm">{info.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{info.description}</p>
              </button>
            );
          })}
        </div>
        {!userLocation && (
          <p className="text-xs text-yellow-500 text-center">⚠️ 위치 정보를 가져오는 중...</p>
        )}
      </div>
    );
  }

  // 2. 유형 선택 화면 (선/구역)
  if (creationStep === 'select-type') {
    const scopeInfo = SCOPE_INFO[creationConfig.scope];
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[#4264fb]">
            <span className="text-xl">{scopeInfo.icon}</span>
            <span className="font-medium">{scopeInfo.label}</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-400">무엇을 만들까요?</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => handleSelectType('line')}
            className="w-full p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl hover:border-[#4264fb]/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#4264fb]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#4264fb]/30 transition-colors">
                <span className="text-xl">〰️</span>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">선 만들기</h4>
                <p className="text-xs text-gray-500">지구를 가로지르는 대원 또는 원을 만듭니다.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelectType('zone')}
            className="w-full p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl hover:border-[#00d4aa]/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00d4aa]/30 transition-colors">
                <span className="text-xl">⭕</span>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">구역 만들기</h4>
                <p className="text-xs text-gray-500">특정 위치에 원형 구역을 만듭니다.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 3. 선 만들기 - 모드 선택
  if (creationStep === 'select-mode') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[#4264fb]">
            <span className="text-xl">〰️</span>
            <span className="font-medium">선 만들기</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-400">어떻게 만들까요?</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => handleSelectLineMode('direction')}
            className="w-full p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl hover:border-[#4264fb]/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#4264fb]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#4264fb]/30 transition-colors">
                <span className="text-xl">🧭</span>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">방향 선택</h4>
                <p className="text-xs text-gray-500">내 위치에서 방향을 선택하여 선을 만듭니다.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelectLineMode('points')}
            className="w-full p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl hover:border-[#00d4aa]/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#00d4aa]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00d4aa]/30 transition-colors">
                <span className="text-xl">📍</span>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">위치 선택</h4>
                <p className="text-xs text-gray-500">2개의 위치를 선택하면, 3점을 지나는 원이 생성됩니다.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 4a. 방향 선택
  if (creationStep === 'select-direction') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors">
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
          <p className="text-sm text-gray-300 mb-2">지도에서 선이 나아갈 방향을 클릭하세요.</p>
          <p className="text-xs text-gray-500">클릭하면 다음 단계로 이동합니다.</p>
        </div>
      </div>
    );
  }

  // 4b. 위치 선택
  if (creationStep === 'select-points') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors">
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
          <p className="text-sm text-gray-300 mb-2">지도에서 2개의 위치를 선택하세요.</p>
          <p className="text-xs text-gray-500">내 위치 + 선택한 2점이 하나의 원 위에 놓입니다.</p>
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
            <div key={index} className="flex items-center gap-2 p-3 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg">
              <div className="w-6 h-6 bg-[#00d4aa] rounded-full flex items-center justify-center">
                <span className="text-white text-xs">{index + 1}</span>
              </div>
              <span className="text-sm text-white truncate flex-1">{point[1].toFixed(4)}, {point[0].toFixed(4)}</span>
              <button onClick={() => removeSelectedPoint(index)} className="text-gray-500 hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {Array.from({ length: 2 - creationConfig.selectedPoints.length }).map((_, index) => (
            <div key={`empty-${index}`} className="flex items-center gap-2 p-3 bg-[#1a1a24]/50 border border-dashed border-[#3a3a4a] rounded-lg">
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

  // 5. 커스터마이징 (선)
  if (creationStep === 'customize' && creationConfig.type === 'line') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors">
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
            <li>• 지도에서 <span className="text-white">선을 드래그</span>하여 원 크기 조절</li>
            <li>• 지도에서 <span className="text-white">선 위를 클릭</span>하여 구역 추가</li>
          </ul>
        </div>

        <div className="space-y-3">
          {creationConfig.lineMode === 'direction' && (
            <div className="p-3 bg-[#1a1a24] rounded-lg border border-[#3a3a4a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">원 크기</span>
                <span className="text-sm text-white font-medium">
                  {Math.abs(offset) < 0.02 ? '대원' : `${Math.round(displayRadius).toLocaleString()} km`}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>S 반구 (점)</span>
                <span>대원</span>
                <span>N 반구 (점)</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full h-2 bg-[#2a2a3a] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#4264fb] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-4 bg-[#ffe66d] rounded pointer-events-none" />
              </div>
            </div>
          )}

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
              className="w-full h-2 bg-[#2a2a3a] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#4264fb] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-400">탑승 구역</h4>
            <button onClick={() => setCreationStep('add-zone')} className="text-xs text-[#ff6b6b] hover:text-[#ff8787] transition-colors">+ 구역 추가</button>
          </div>
          {creationConfig.lineZones.length === 0 ? (
            <p className="text-xs text-gray-600 p-3 bg-[#1a1a24] rounded-lg border border-dashed border-[#3a3a4a]">구역이 없으면 선 전체에서 탑승 가능합니다.</p>
          ) : (
            creationConfig.lineZones.map((zone, index) => (
              <div key={zone.id} className="p-3 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-[#ff6b6b] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">{index + 1}</span>
                  </div>
                  <span className="text-sm text-white flex-1">구역 {index + 1}</span>
                  <button onClick={() => removeLineZone(zone.id)} className="text-gray-500 hover:text-red-400 transition-colors">
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
                    onChange={(e) => updateLineZone(zone.id, { radius: Number(e.target.value) })}
                    className="flex-1 h-1.5 bg-[#2a2a3a] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#ff6b6b] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-xs text-white w-16 text-right">{Math.round(zone.radius)} km</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 space-y-2">
          <button onClick={handleSaveLine} disabled={!previewGeometry} className="w-full py-3 bg-[#4264fb] hover:bg-[#5a7bfc] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">✓ 선 저장하기</button>
          <button onClick={resetCreation} className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 font-medium rounded-lg transition-colors">취소</button>
        </div>
      </div>
    );
  }

  // 구역 추가 모드 (선에 구역 추가)
  if (creationStep === 'add-zone') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors">
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
          <p className="text-sm text-gray-300 mb-2">선 위의 위치를 클릭하세요.</p>
          <p className="text-xs text-gray-500">선에 가까이 가면 커서가 바뀝니다.</p>
        </div>
        <button onClick={goBack} className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 font-medium rounded-lg transition-colors">뒤로</button>
      </div>
    );
  }

  // 구역 만들기 - 위치 선택
  if (creationStep === 'zone-place') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[#00d4aa]">
            <span className="text-xl">⭕</span>
            <span className="font-medium">구역 만들기</span>
          </div>
        </div>
        
        <div className="p-4 bg-[#1a1a24] rounded-xl border border-[#3a3a4a]">
          <p className="text-sm text-gray-300 mb-2">지도에서 구역을 만들 위치를 클릭하세요.</p>
          <p className="text-xs text-gray-500">여러 개의 구역을 만들 수 있습니다.</p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400">생성된 구역 ({creationConfig.zones.length}개)</h4>
          {creationConfig.zones.length === 0 ? (
            <p className="text-xs text-gray-600 p-3 bg-[#1a1a24] rounded-lg border border-dashed border-[#3a3a4a]">아직 구역이 없습니다. 지도를 클릭하세요.</p>
          ) : (
            creationConfig.zones.map((zone, index) => {
              // 근처 스코프: 10m ~ 1km, 그 외: 0.1km ~ 50km
              const isNearby = creationConfig.scope === 'nearby';
              const minRadius = isNearby ? 0.01 : 0.1;
              const maxRadius = isNearby ? 1 : 50;
              const stepRadius = isNearby ? 0.01 : 0.1;
              
              // 반경 표시 (미터 또는 킬로미터)
              const displayRadius = zone.radius < 1 
                ? `${Math.round(zone.radius * 1000)} m` 
                : `${zone.radius.toFixed(1)} km`;
              
              return (
                <div key={zone.id} className="p-3 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: zone.color }}>
                      <span className="text-white text-xs">{index + 1}</span>
                    </div>
                    <span className="text-sm text-white flex-1">구역 {index + 1}</span>
                    <button onClick={() => removeCreationZone(zone.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">반경</span>
                    <input
                      type="range"
                      min={minRadius}
                      max={maxRadius}
                      step={stepRadius}
                      value={Math.min(Math.max(zone.radius, minRadius), maxRadius)}
                      onChange={(e) => updateCreationZone(zone.id, { radius: Number(e.target.value) })}
                      className="flex-1 h-1.5 bg-[#2a2a3a] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00d4aa] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="text-xs text-white w-16 text-right">{displayRadius}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {creationConfig.zones.length > 0 && (
          <div className="pt-4 space-y-2">
            <button onClick={handleSaveZones} className="w-full py-3 bg-[#00d4aa] hover:bg-[#00e4bb] text-white font-semibold rounded-lg transition-colors">✓ 구역 저장하기</button>
            <button onClick={resetCreation} className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 font-medium rounded-lg transition-colors">취소</button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
