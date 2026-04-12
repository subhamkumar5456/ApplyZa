# Applyza - AI-Powered Resume Assistant

Applyza is an intelligent resume analysis platform that helps job seekers optimize their resumes for ATS systems, match their skills against job descriptions, and receive AI-powered improvement suggestions.

## Features

- **Resume Upload & Parsing** — Upload PDF/DOCX resumes with AI-powered text extraction
- **ATS Score Analysis** — Get detailed ATS compatibility scores with breakdowns
- **Job Description Matching** — Compare your resume against specific job descriptions
- **AI Suggestions** — Receive actionable recommendations to improve your resume
- **Dashboard Analytics** — Track your resume optimization progress over time

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **AI**: OpenAI GPT-4 for analysis, embeddings for semantic matching

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/applyza.git
   cd applyza
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase and OpenAI credentials.

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL migrations from `supabase/migrations/` in order
   - Deploy edge functions from `supabase/functions/`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/            # Next.js App Router pages and API routes
├── components/     # React components (ui, layout, resume, analysis, shared)
├── lib/            # Utility libraries (supabase, openai, hooks, utils)
├── types/          # TypeScript type definitions
├── supabase/       # Supabase migrations, edge functions, config
└── public/         # Static assets
```

## License

MIT
