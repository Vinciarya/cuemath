# TutorScreen AI

## What I Built

TutorScreen AI is a Cuemath recruiter workflow for creating voice interview links, collecting candidate responses, and automatically analyzing interviews with AI scoring. The app includes:

- Supabase password auth for recruiters
- Recruiter dashboard to create and review interviews
- Public candidate interview flow with microphone-based responses
- Pre-generated AI voice prompts for the interview questions
- Transcript analysis and scorecards stored in Supabase

## Problem 3: AI Tutor Screener

This project solves the "AI Tutor Screener" problem by giving the hiring team a structured, repeatable voice interview flow. Candidates receive a public interview link, respond to audio prompts, and the system stores a transcript plus a rubric-based recommendation for recruiter review.

## Key Decisions

- Supabase Auth over Clerk: simpler stack, fewer moving parts, and direct alignment with the database layer
- Pre-generated ElevenLabs audio: human voice quality with zero runtime generation cost during interviews
- Web Speech API for STT: simple browser-native speech recognition without adding another paid runtime dependency
- Gemini Flash for scoring: fast transcript evaluation with structured JSON output
- Indian English `en-IN`: better language tuning for the candidate interview experience

## Known Limitations

- Chrome only for STT. The current speech recognition flow depends on `webkitSpeechRecognition`, so the voice interview is effectively Chrome-only today.

## What I'd improve

- Whisper API for STT to remove the Chrome-only browser dependency
- Real-time follow-up generation instead of static follow-up prompts
- Email reports with scorecards and recruiter summaries after each interview

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js App Router |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Styling | Tailwind CSS |
| Recruiter UI | Custom React + Tailwind |
| Candidate Voice UI | React + Framer Motion |
| TTS | ElevenLabs pre-generated MP3 files |
| STT | Web Speech API (`webkitSpeechRecognition`) |
| Evaluation | Gemini Flash |
| Hosting | Vercel |

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the required values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the app:

```bash
npm run dev
```

## Vercel Deploy Commands

```bash
npm install -g vercel
vercel login
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY
vercel env add ELEVENLABS_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel --prod
```
