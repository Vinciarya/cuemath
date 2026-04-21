import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const questions = [
  {
    id: 'q1',
    text: "Hi! Welcome to Cuemath's tutor screening. I'm your AI interviewer today. To start, could you tell me a little about yourself and why you're interested in tutoring with Cuemath?",
  },
  { id: 'q1-followup', text: 'What age groups have you worked with before, if any?' },
  {
    id: 'q2',
    text: "Here's a scenario: a 9-year-old student looks confused and says they don't understand fractions at all. How would you explain what a fraction is to them?",
  },
  { id: 'q2-followup', text: "Can you give me a real-world example you'd use?" },
  {
    id: 'q3',
    text: "Imagine a student has been staring at a problem for 5 minutes and is getting frustrated. They say, I'm just bad at math. What do you do?",
  },
  {
    id: 'q3-followup',
    text: 'How do you keep them motivated without just giving them the answer?',
  },
  {
    id: 'q4',
    text: 'How would you explain the concept of multiplication to a child who only understands addition so far?',
  },
  {
    id: 'q5',
    text: 'Last question — what do you think makes a truly great math tutor? Not just a good one, but someone a student will remember years later.',
  },
];

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';

if (!elevenLabsApiKey) {
  console.error('Error: ELEVENLABS_API_KEY is missing from .env.');
  process.exit(1);
}

async function generateAudio() {
  const outputDir = path.join(process.cwd(), 'public', 'audio');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const question of questions) {
    const filename = `${question.id}.mp3`;
    const outputPath = path.join(outputDir, filename);

    console.log(`Generating audio for ${question.id}...`);

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: question.text,
            model_id: modelId,
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved ${filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to generate audio for ${question.id}: ${message}`);
    }
  }

  console.log('Audio generation complete!');
}

generateAudio();
