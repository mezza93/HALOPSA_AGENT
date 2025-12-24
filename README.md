# HaloPSA AI Web Application

AI-powered assistant for HaloPSA. Manage tickets, clients, and assets using natural language. Built for IT Managed Service Providers.

## Features

- **Natural Language Interface** - Ask questions and give commands in plain English
- **Multi-Tenant Support** - Connect to multiple HaloPSA instances
- **Real-time Chat** - Streaming responses with Claude AI
- **Image Uploads** - Attach screenshots and documents to conversations
- **Chat History** - Persistent conversation history
- **Mobile Responsive** - Works on all devices
- **Enterprise Security** - Encrypted credentials, audit logging

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: NextAuth.js v5 (Google + Email/Password)
- **AI**: Claude (Anthropic) via Vercel AI SDK
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)
- Google OAuth credentials
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/halopsa-ai-web.git
cd halopsa-ai-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Encryption
ENCRYPTION_KEY="your-32-byte-hex-key"
```

5. Initialize the database:
```bash
npx prisma db push
```

6. Run the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development

### Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run unit/integration tests
npm run test:ui      # Vitest UI
npm run test:coverage # With coverage
npm run test:e2e     # E2E tests (Playwright)
npm run test:e2e:ui  # Playwright UI

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Linting
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard
│   │   ├── chat/          # AI chat interface
│   │   ├── settings/      # User settings
│   │   └── admin/         # Admin panel
│   ├── (marketing)/       # Public marketing pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # Base UI components
│   ├── chat/              # Chat-specific components
│   ├── dashboard/         # Dashboard components
│   └── landing/           # Landing page components
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Prisma client
│   ├── halopsa/           # HaloPSA API client
│   ├── ai/                # AI/Claude integration
│   └── utils/             # Utility functions
├── stores/                # Zustand stores
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

## Testing

### Unit & Integration Tests (Vitest)

```bash
npm test                    # Run all tests
npm run test:coverage       # With coverage report
npm run test:ui             # Interactive UI
```

### E2E Tests (Playwright)

```bash
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Interactive UI
npx playwright test --project=chromium  # Specific browser
```

### Coverage Thresholds

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random 32+ character string
- `NEXTAUTH_URL` - Production URL
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `ANTHROPIC_API_KEY` - Anthropic API key
- `ENCRYPTION_KEY` - 32-byte hex string for credential encryption

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [HaloPSA](https://halopsa.com) - PSA platform
- [Anthropic](https://anthropic.com) - Claude AI
- [Vercel](https://vercel.com) - Hosting platform
- [Supabase](https://supabase.com) - Database hosting
