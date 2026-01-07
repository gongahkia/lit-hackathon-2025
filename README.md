![Vercel Deploy](https://deploy-badge.vercel.app/vercel/lit-hackathon-2025)

> [!IMPORTANT]
> The site is now live [***here***](https://lit-hackathon-2025.vercel.app)!

# `POFact` - Rule-based Certainty

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/gongahkia/lit-hackathon-2025)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Providing fast, verifiable access to parliamentary statements, ministerial releases, and government communications with timeline views, cross-verification, and source-attributed answers.

Made for the MinLaw 2 problem statement for the [SMU LIT Hackathon 2025](https://www.smulit.org/lit-hackathon-2025).

## Team members

<table>
	<tbody>
        <tr>
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
                <a href="https://github.com/richardleii58">
                    <img src="https://avatars.githubusercontent.com/u/174111738?v=4" width="100;" alt=""/>
                    <br />
                    <sub><b>Richard Lei</b></sub>
                </a>
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

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for optional backend services)
- Supabase account (database is already hosted - no setup needed)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gongahkia/lit-hackathon-2025.git
   cd lit-hackathon-test
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the project root:
   ```bash
   # Supabase Configuration (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # LLM Provider (Optional - for AI Query features)
   GOOGLE_GEN_AI_API_KEY=your_gemini_api_key

   # Flask API (Optional - fallback for legacy search)
   FLASK_API_BASE=http://localhost:5000
   ```

   **Note:** Supabase is already hosted and configured. You only need to add your credentials to `.env.local`. The database schema is already set up and data is populated - no need to reseed.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

### Optional: Backend Services

If you need to run the Flask backend (for legacy search fallback):

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start Flask server
cd backend
python app.py
```

## Project Structure

```
lit-hackathon-test/
├── src/
│   ├── app/              # Next.js app router pages and API routes
│   ├── components/       # React components
│   │   ├── features/     # Feature components (Search, AI Query, Document Viewer)
│   │   └── ui/           # Reusable UI components
│   └── lib/              # Utilities and services
│       ├── database.ts   # Supabase database service
│       ├── rag/          # RAG (Retrieval-Augmented Generation) services
│       └── llm/          # LLM provider integrations
├── lib/                  # Shared libraries
│   ├── timeline-service.ts
│   └── llm/              # LLM router and providers
├── database/             # Database schema and migrations
│   └── schema.sql        # Main database schema
├── scripts/              # Data ingestion scripts
│   └── ingest-golden-dataset.ts
├── scrapers/             # Web scrapers for data sources
└── docs/                 # Documentation
```

## Key Features

### 1. Trending Search
- Browse popular topics and search through verified parliamentary documents
- Filter by source type, date range, speaker, language, and topics
- View document details with confidence scores and verification status

### 2. AI Deep Search (POFMan)
- Ask complex questions using natural language
- Get AI-powered answers with citations from parliamentary documents
- Semantic search using RAG (Retrieval-Augmented Generation)
- Markdown-formatted responses with source attribution

### 3. Document Timeline
- View policy development timeline for each document
- See related parliamentary documents chronologically
- AI-generated timelines when database has insufficient data
- Grouped by topics with event classification (creation/amendment/dissolution)

### 4. Evidence Bundles
- Create matters and collect evidence items
- Add quotes from documents with citations
- Organize evidence for legal research

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts
- `npm run ingest-data` - Ingest golden dataset into Supabase (not needed - data already populated)

## Troubleshooting

### Webpack Cache Error

If you encounter webpack cache errors, clear the Next.js cache:

```bash
npm run clean
rm -rf .next
npm run dev
```

### TypeScript Errors

Run type checking to identify issues:

```bash
npm run type-check
```

### Environment Variables

Make sure all required environment variables are set in `.env.local`. Check that:
- Supabase credentials are correct
- API keys are valid (if using AI features)

## Documentation

- [FINAL_PRD.md](docs/FINAL_PRD.md) - Product requirements document
- [P2_IMPLEMENTATION_STATUS.md](docs/P2_IMPLEMENTATION_STATUS.md) - RAG implementation status
- [database/README.md](database/README.md) - Database setup guide

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run type-check` and `npm run lint` before committing
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details
