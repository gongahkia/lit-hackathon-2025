# Changelog

All notable changes to the MinLaw 2 Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-13

### Added
- **Database Infrastructure** - Complete Supabase PostgreSQL integration
- **Database Schema** - Sources, documents, topics tables with Row Level Security
- **TypeScript Services** - DatabaseService and DataService with fallback to mock data
- **Seeding Scripts** - Automated database population with sample data
- **Environment Configuration** - Proper Supabase credentials management
- **Phase 2 Preparation** - pgvector extension ready for semantic search

### Technical Details
- **Database**: Supabase PostgreSQL with pgvector extension
- **Security**: Row Level Security (RLS) policies for public read access
- **Type Safety**: Full TypeScript integration with database operations
- **Fallback System**: Automatic fallback to mock data if database unavailable

## [1.0.0] - 2025-09-12

### Added
- **Initial Release** - Complete frontend MVP for MinLaw 2 Platform
- **Search Interface** - Advanced search with filters and results display
- **Document Viewer** - Interactive document viewing with highlighting
- **Timeline View** - Policy timeline visualization with event markers
- **Contradiction Detection UI** - Mock contradiction detection interface
- **Admin Dashboard** - Source management and system monitoring interface
- **AI Assistant** - Query processing interface with document linking
- **Theme System** - Dark/light mode with proper hydration handling
- **Responsive Design** - Mobile-first approach with proper breakpoints
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- **TypeScript Support** - Full type safety with proper interfaces
- **Modern UI Components** - shadcn/ui component library integration
- **Geist Sans Fonts** - Professional typography with local font loading
- **Mock Data System** - Comprehensive mock data for all entities
- **API Route Structure** - Basic Next.js API routes for future backend integration

### Technical Details
- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Forms**: React Hook Form with Zod validation
- **Analytics**: Vercel Analytics integration

### Features Implemented
- ✅ **Search & Discovery** - Advanced search capabilities for parliamentary data
- ✅ **Document Viewer** - Interactive document viewing and analysis
- ✅ **AI Assistant** - Intelligent query processing and responses
- ✅ **Timeline View** - Chronological data visualization
- ✅ **Contradiction Detection** - Automated analysis for conflicting statements
- ✅ **Admin Dashboard** - Administrative interface for data management
- ✅ **Theme Toggle** - Dark/light mode switching
- ✅ **Responsive Layout** - Mobile and desktop optimized
- ✅ **Keyboard Shortcuts** - Cmd+K for search focus

### Code Quality
- **Clean Architecture** - Well-organized component structure
- **Type Safety** - Comprehensive TypeScript usage
- **Performance** - Optimized rendering and state management
- **Accessibility** - WCAG 2.1 compliance
- **Error Handling** - Proper error boundaries and user feedback
- **Hydration Safety** - SSR/CSR compatibility

### Documentation
- **README.md** - Comprehensive project documentation
- **CONTRIBUTING.md** - Contributor guidelines
- **PROJECT_TODO_LIST.md** - Detailed development roadmap
- **LICENSE** - MIT License
- **CHANGELOG.md** - This changelog

### Known Limitations
- **Mock Data Only** - No real data ingestion or storage
- **API Stubs** - Backend services not yet implemented
- **No Authentication** - User management system pending
- **No Real-time Updates** - No WebSocket or live data updates
- **Limited Testing** - No unit or integration tests yet

### Roadmap
- **Phase 1**: Database implementation and basic backend
- **Phase 2**: Data ingestion and search infrastructure
- **Phase 3**: Advanced features and ML integration
- **Phase 4**: Production deployment and monitoring

### Acknowledgments
- Built for SMU LIT Hackathon 2025
- Inspired by the need for transparent government communication
- Special thanks to the Singapore parliamentary system for open data access

---

## [1.2.0] - 2025-12-09

### Added
- **Data Ingestion Pipeline** - Complete CSV processing and database population system
- **API Integration** - Full Next.js API routes connected to Supabase database
- **Frontend-Database Connection** - Real data integration with fallback to mock data
- **Schema Consolidation** - Single consolidated database schema file
- **Frontend Views** - Optimized database views for frontend data consumption
- **Data Validation** - Input validation and error handling for data ingestion

### Changed
- **Database Schema** - Added frontend-required columns (published_at, source_type, role, verified, confidence, contradictions, url, topics)
- **Data Service** - Updated to support both real database and mock data fallback
- **Frontend Components** - Modified to use DataService instead of direct mock data imports
- **Project Structure** - Cleaned up test files and consolidated schema files

### Technical Details
- **CSV Processing**: Automated parsing of golden_dataset CSV files
- **Database Population**: Batch insertion with duplicate handling and error recovery
- **API Endpoints**: Complete CRUD operations for sources, documents, and topics
- **Data Mapping**: Proper transformation from CSV format to database schema
- **Error Handling**: Comprehensive error handling and logging throughout pipeline

### Fixed
- **Module Resolution** - Fixed all import path issues across the project
- **Database Connection** - Resolved Supabase key configuration issues
- **Data Consistency** - Ensured data integrity during ingestion process
- **Frontend Loading** - Added proper loading states for database operations

## [Unreleased]

### Planned Features
- Real-time data updates from Singapore government sources
- Elasticsearch and Vector DB integration for advanced search
- Actual contradiction detection with NLI models
- User authentication and authorization
- Comprehensive testing suite
- Production deployment pipeline

### Planned Improvements
- Performance optimizations
- Enhanced accessibility features
- Mobile app development
- API documentation
- Monitoring and observability
- Security hardening

---

## Version History

- **1.2.0** - Database integration and data ingestion pipeline complete
- **1.1.0** - Database infrastructure and Supabase integration
- **1.0.0** - Initial release with complete frontend MVP
- **0.1.0** - Development version (pre-release)

---

*For more details, see the [PROJECT_TODO_LIST.md](PROJECT_TODO_LIST.md) file.*
