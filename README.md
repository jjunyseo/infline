# 🌍 Infline

> Lines that connect the world

지구 위에 선을 그리고, 그 선 위에 있는 사람들과 연결되세요. 하루 동안 서로의 일상을 공유합니다.

![Infline Preview](https://via.placeholder.com/800x400/0a0a0f/4264fb?text=Infline)

## ✨ Features

- 🌐 **3D Globe** - Mapbox GL JS를 사용한 인터랙티브 3D 지구본
- 🧵 **Great Circle Lines** - 지구를 한 바퀴 감싸는 대원(Great Circle) 경로 생성
- 🔍 **Location Search** - Mapbox Geocoding API를 통한 위치 검색
- 📍 **My Location** - 브라우저 Geolocation API로 현재 위치 표시
- 🎨 **Dark Theme** - Mapbox 스타일의 다크 테마 디자인

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Mapbox Access Token](https://account.mapbox.com/access-tokens/)

### Installation

```bash
# Clone the repository
git clone https://github.com/jjunyseo/infline.git
cd infline

# Install dependencies
npm install

# Create environment file
touch .env.local
```

### Environment Variables

`.env.local` 파일을 생성하고 다음 환경변수를 설정하세요:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

Mapbox 토큰은 [Mapbox Account](https://account.mapbox.com/access-tokens/)에서 발급받을 수 있습니다.

### Development

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

### Build

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Map**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Geo Calculations**: [Turf.js](https://turfjs.org/)

## 📁 Project Structure

```
infline/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx             # Landing page
│   ├── globals.css          # Global styles
│   └── globe/
│       └── page.tsx         # Globe page
├── components/
│   ├── Globe.tsx            # 3D Globe component
│   ├── SearchBox.tsx        # Location search
│   ├── ControlPanel.tsx     # Control buttons
│   └── LineList.tsx         # Created lines list
├── lib/
│   └── lineGenerator.ts     # Great Circle calculation
├── store/
│   └── useLines.ts          # Zustand store
└── types/
    └── index.ts             # TypeScript interfaces
```

## 🌐 Deployment

### Vercel

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. Environment Variables에 `NEXT_PUBLIC_MAPBOX_TOKEN` 추가
3. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jjunyseo/infline)

## 📝 License

MIT License

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

---

Made with ❤️ by [infline team](https://github.com/jjunyseo/infline)
