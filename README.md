# CueMath AI - AI-Powered Voice Interviewer for Hiring 💼

CueMath AI is an intelligent hiring platform that lets companies conduct AI-powered voice interviews with candidates — automatically, at scale.

## Key Features

- **🎯 Interview Creation:** Instantly generate tailored interview questions from any job description.
- **🔗 One-Click Sharing:** Generate and share unique interview links with candidates in seconds.
- **🎙️ AI Voice Interviews:** Let our AI conduct natural, conversational interviews that adapt to candidate responses.
- **📊 Smart Analysis:** Get detailed insights and scores for each interview response, powered by advanced AI.
- **📈 Comprehensive Dashboard:** Track all candidate performances and overall stats.

## Initial Setup

1. Clone the project.

```bash
git clone https://github.com/your-org/cuematch-ai.git
```

2. Copy the existing environment template file

```bash
cp .env.example .env
```

## Clerk Setup ([Clerk](https://clerk.com/))

We use Clerk for authentication. Set up Clerk environment variables in the `.env` file. The free plan should be more than enough.

1. Navigate to [Clerk](https://dashboard.clerk.com/) and create an application following the [setup guide](https://clerk.com/docs/quickstarts/setup-clerk).
2. Your `.env` (NOT `.env.local`) file should have the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` variables populated with **no inverted commas**.
3. Enable organizations in your Clerk application by navigating to the Organization Settings page.
4. Make sure you create an organization and invite your email to it.

## Database Setup ([Supabase](https://supabase.com/))

Supabase is used for storing the data. It's really simple to set up and the free plan should suffice.

1. Create a project (note down your project's password)
2. Go to SQL Editor and copy the SQL code from `supabase_schema.sql`
3. Run the SQL code to confirm the tables are created.
4. Copy the Supabase URL and anon key from the project settings and paste them in the `.env` file under `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Retell AI Setup ([Retell AI](https://retellai.com/))

We use Retell AI to manage all the voice calls. They handle storage of recordings and provide a simple SDK to integrate with.

1. Create an API key from [Retell AI Dashboard](https://dashboard.retellai.com/apiKey) and add it to the `.env` file under `RETELL_API_KEY`

## Add OpenAI API Key

We use OpenAI to generate questions for interviews and analyze responses.

1. Go to [OpenAI](https://platform.openai.com/api-keys) and create an API key
2. Add the API key to the `.env` file under `OPENAI_API_KEY`

## Getting Started Locally

First install the packages:

```bash
yarn
```

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Self Hosting

We recommend using [Vercel](https://vercel.com/) to host the app.

## Contributing

If you'd like to contribute to CueMath AI, feel free to fork the repository, make your changes, and submit a pull request. Contributions are welcomed and appreciated.

## Contact

If you have any questions or feedback, feel free to reach out to us.

## License

The software code is licensed under the MIT License.
