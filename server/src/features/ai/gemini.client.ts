import { env, isGeminiAvailable } from '../../config/env';
import { logger } from '../../utils/logger';

interface GeminiResponse {
  text: string;
}

/**
 * Gemini API client with graceful fallback.
 * When GEMINI_API_KEY is not set, returns mock responses
 * so the app remains fully functional for demos.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateContent(prompt: string): Promise<GeminiResponse> {
  if (!isGeminiAvailable()) {
    logger.info('Gemini API key not configured — returning fallback response');
    return { text: generateFallbackResponse(prompt) };
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Gemini API error');
      return { text: generateFallbackResponse(prompt) };
    }

    const data = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      logger.warn('Gemini returned empty response');
      return { text: generateFallbackResponse(prompt) };
    }

    return { text };
  } catch (error) {
    logger.error({ error }, 'Gemini API request failed');
    return { text: generateFallbackResponse(prompt) };
  }
}

function generateFallbackResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('weekly plan') || lowerPrompt.includes('sustainability plan')) {
    return JSON.stringify({
      title: 'Your Weekly Sustainability Plan',
      days: [
        { day: 'Monday', action: 'Use public transport instead of driving', impact: 'Save ~2.1 kg CO₂' },
        { day: 'Tuesday', action: 'Have a vegetarian lunch', impact: 'Save ~1.6 kg CO₂' },
        { day: 'Wednesday', action: 'Reduce AC usage by 2 hours', impact: 'Save ~0.9 kg CO₂' },
        { day: 'Thursday', action: 'Walk or cycle for short trips', impact: 'Save ~1.5 kg CO₂' },
        { day: 'Friday', action: 'Unplug unused electronics', impact: 'Save ~0.4 kg CO₂' },
        { day: 'Saturday', action: 'Buy local produce, skip packaged food', impact: 'Save ~0.8 kg CO₂' },
        { day: 'Sunday', action: 'Plan meals to reduce food waste', impact: 'Save ~1.2 kg CO₂' },
      ],
      weeklyTotal: '~8.5 kg CO₂ saved',
    });
  }

  if (lowerPrompt.includes('recommendation') || lowerPrompt.includes('reduce')) {
    return JSON.stringify({
      recommendations: [
        { title: 'Switch to Public Transport', description: 'Taking the bus or metro 3 days a week can reduce your transport emissions by 40%.', impact: 'high', category: 'transportation' },
        { title: 'Meatless Mondays', description: 'Replacing one non-vegetarian meal per week saves about 3.3 kg CO₂.', impact: 'medium', category: 'food' },
        { title: 'Energy Audit', description: 'Switching to LED bulbs and smart power strips can cut electricity by 15%.', impact: 'medium', category: 'home' },
        { title: 'Reduce Single-Use Plastic', description: 'Carrying reusable bags and bottles eliminates ~5 kg plastic waste/month.', impact: 'low', category: 'lifestyle' },
      ],
    });
  }

  return JSON.stringify({
    message: 'Here are some general tips to reduce your carbon footprint:',
    tips: [
      'Walk or cycle for trips under 3 km',
      'Reduce meat consumption to 2-3 meals per week',
      'Switch to renewable energy if available in your area',
      'Buy locally produced food to reduce transport emissions',
      'Use a programmable thermostat to optimize energy usage',
    ],
  });
}
