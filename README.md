# MinLaw 2 - Parliamentary Data Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/gongahkia/lit-hackathon-2025)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modern Next.js application for fast, verifiable access to parliamentary statements, ministerial releases, and government communications with timeline views, cross-verification, and source-attributed answers.

## 🎯 Overview

MinLaw 2 MVP solves the problem of slow, manual verification of statements across parliamentary Hansard, press releases, ministerial social posts, and news media. It provides:

- **Fast Hybrid Search** - Keyword + semantic search with exact quoted spans
- **Timeline Views** - Track policy evolution and changes over time
- **Contradiction Detection** - AI-powered detection of conflicting statements
- **LAB Calculator** - Legal Aid Bureau calculation tools
- **Source Attribution** - Always show exact sources and provenance

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── engine/        # Core processing engine
│   │   ├── scrapers/      # Data scraping endpoints
│   │   └── validation/    # Data validation endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── features/          # Feature-specific components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility functions and data
│   ├── utils.ts           # Common utilities
│   └── mockData.js        # Mock data for development
└── types/                 # TypeScript type definitions
```

## Features

- **Search & Discovery**: Advanced search capabilities for parliamentary data
- **Document Viewer**: Interactive document viewing and analysis
- **AI Assistant**: Intelligent query processing and responses
- **Timeline View**: Chronological data visualization
- **Contradiction Detection**: Automated analysis for conflicting statements
- **LAB Calculator**: Specialized calculation tools
- **Admin Dashboard**: Administrative interface for data management

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Technology Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Geist Sans (local)
- **State Management**: React Hooks
- **Forms**: React Hook Form with Zod validation
- **Analytics**: Vercel Analytics

## API Endpoints

- `GET/POST /api/scrapers` - Data scraping operations
- `GET/POST /api/validation` - Data validation services
- `GET/POST /api/engine` - Core processing engine

## 🛠️ Development

This project follows modern Next.js best practices with:
- TypeScript for type safety
- Component-based architecture
- Responsive design
- Dark/light theme support
- Optimized performance
- Hydration-safe rendering
- Accessibility compliance

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run clean        # Clean build artifacts
npm run preview      # Build and preview production
```

## 📊 Current Status

- **Frontend MVP**: ✅ Complete (85%)
- **Backend Services**: 🚧 In Development (5%)
- **Database**: 🚧 Pending
- **Data Ingestion**: 🚧 Pending
- **Search Infrastructure**: 🚧 Pending

## 🎯 Roadmap

See [PROJECT_TODO_LIST.md](PROJECT_TODO_LIST.md) for detailed development roadmap and progress tracking.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Repository**: [https://github.com/gongahkia/lit-hackathon-2025](https://github.com/gongahkia/lit-hackathon-2025)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for SMU LIT Hackathon 2025
- Inspired by the need for transparent government communication
- Special thanks to the Singapore parliamentary system for open data access

## 📞 Support

For support, email support@minlaw2.com or create an issue in this repository.