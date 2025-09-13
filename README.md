![Vercel Deploy](https://deploy-badge.vercel.app/vercel/lit-hackathon-2025)

> [!IMPORTANT]
> The site is now live [***here***](https://lit-hackathon-2025.vercel.app)!

# MinLaw 2 - Parliamentary Data Platform

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/gongahkia/lit-hackathon-2025)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Sending you fast, verifiable access to parliamentary statements, ministerial releases, and government communications with timeline views, cross-verification, and source-attributed answers.

Made for the ... problem statement for the [SMU LIT Hackathon 2025](https://www.smulit.org/lit-hackathon-2025).

## Team members

<table>
	<tbody>
        <tr>
            <td align="center">
                <a href="https://github.com/richardleii58">
                    <img src="https://avatars.githubusercontent.com/u/174111738?v=4" width="100;" alt=""/>
                    <br />
                    <sub><b>Richard Lei</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/gongahkia">
                    <img src="https://avatars.githubusercontent.com/u/117062305?v=4" width="100;" alt="gongahkia"/>
                    <br />
                    <sub><b>Gabriel Ong</b></sub>
                </a>
                <br />
            </td>
            <td align="center">
                <a href="https://github.com/le-xuan-2">
                    <img src="https://avatars.githubusercontent.com/u/206502697?v=4" width="100;" alt=""/>
                    <br />
                    <sub><b>Tan Le Xuan</b></sub>
                </a>
                <br />
            </td>
            <td align="center">
                <a href="https://github.com/a-stint">
                    <img src="https://avatars.githubusercontent.com/u/149822619?v=4" width="100;" alt="Astin"/>
                    <br />
                    <sub><b>Astin Tay</b></sub>
                </a>
                <br />
            </td>
            <td align="center">
                <a href="https://github.com/kevanwee">
                    <img src="https://avatars.githubusercontent.com/u/16420323?v=4" width="100;" alt="Kevan Wee"/>
                    <br />
                    <sub><b>Kevan Wee</b></sub>
                </a>
                <br />
            </td>
        </tr>
	</tbody>
</table>

## Repository Structure

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
- **Database Integration**: Complete Supabase PostgreSQL with vector search support
- **Data Ingestion Pipeline**: Automated CSV processing and database population
- **Real-time Data**: Live data updates with fallback to mock data
- **Contradiction Detection**: Automated analysis for conflicting statements
- **Admin Dashboard**: Administrative interface for data management
- **API Integration**: Complete Next.js API routes for CRUD operations

## Getting Started

Below instructions are for running the MVP locally at [localhost:3000](http://localhost:3000).

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Database Setup
1. Create a Supabase project and get your credentials
2. Create `.env.local` with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```
3. Run the consolidated database schema in Supabase SQL Editor (see `database/schema.sql`)
4. Seed the database with sample data:
   ```bash
   npm run seed-db
   ```
5. Ingest real data from CSV files:
   ```bash
   npm run ingest-data
   ```

### Development
```console
python3 -m venv .venv
source .venv/bin/activate
cd backend && pip install -r requirements.txt && cd ..
npm install && npm run dev
```

## Stack

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

- `GET /api/sources` - Fetch all data sources
- `GET /api/documents` - Fetch all documents with optional search
- `GET /api/topics` - Fetch all topics
- `GET/POST /api/scrapers` - Data scraping operations
- `GET/POST /api/validation` - Data validation services
- `GET/POST /api/engine` - Core processing engine

## Data Ingestion

The platform includes a complete data ingestion pipeline:

- **CSV Processing**: Automatically processes CSV files from the `golden_dataset` directory
- **Database Population**: Inserts processed data into Supabase with error handling
- **Data Validation**: Validates and cleans data before insertion
- **Batch Processing**: Efficient batch insertion for large datasets

Run the ingestion pipeline:
```bash
npm run ingest-data
```