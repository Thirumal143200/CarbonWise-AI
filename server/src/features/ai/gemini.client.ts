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

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

    const data = (await response.json()) as {
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

  // 1. If it's a weekly plan request (must return JSON)
  if (lowerPrompt.includes('weekly plan') || lowerPrompt.includes('sustainability plan')) {
    return JSON.stringify({
      title: 'Your Weekly Sustainability Plan',
      days: [
        {
          day: 'Monday',
          action: 'Use public transport instead of driving',
          impact: 'Save ~2.1 kg CO₂',
        },
        { day: 'Tuesday', action: 'Have a vegetarian lunch', impact: 'Save ~1.6 kg CO₂' },
        { day: 'Wednesday', action: 'Reduce AC usage by 2 hours', impact: 'Save ~0.9 kg CO₂' },
        { day: 'Thursday', action: 'Walk or cycle for short trips', impact: 'Save ~1.5 kg CO₂' },
        { day: 'Friday', action: 'Unplug unused electronics', impact: 'Save ~0.4 kg CO₂' },
        {
          day: 'Saturday',
          action: 'Buy local produce, skip packaged food',
          impact: 'Save ~0.8 kg CO₂',
        },
        { day: 'Sunday', action: 'Plan meals to reduce food waste', impact: 'Save ~1.2 kg CO₂' },
      ],
      weeklyTotal: '~8.5 kg CO₂ saved',
    });
  }

  // 2. If it's a recommendations / advice request (must return JSON)
  if (lowerPrompt.includes('recommendations" array') || lowerPrompt.includes('reduction_advice')) {
    return JSON.stringify({
      recommendations: [
        {
          title: 'Switch to Public Transport',
          description:
            'Taking the bus or metro 3 days a week can reduce your transport emissions by 40%.',
          impact: 'high',
          category: 'transportation',
        },
        {
          title: 'Meatless Mondays',
          description: 'Replacing one non-vegetarian meal per week saves about 3.3 kg CO₂.',
          impact: 'medium',
          category: 'food',
        },
        {
          title: 'Energy Audit',
          description: 'Switching to LED bulbs and smart power strips can cut electricity by 15%.',
          impact: 'medium',
          category: 'home',
        },
        {
          title: 'Reduce Single-Use Plastic',
          description: 'Carrying reusable bags and bottles eliminates ~5 kg plastic waste/month.',
          impact: 'low',
          category: 'lifestyle',
        },
      ],
    });
  }

  // 3. If it's a behavioral insights request (must return JSON)
  if (lowerPrompt.includes('insights" array') || lowerPrompt.includes('behavioral_insight')) {
    return JSON.stringify({
      insights: [
        {
          pattern: 'High transportation emissions on weekdays',
          suggestion: 'Consider carpooling or using public transit for your daily commute.',
          potentialSavingsKg: 12.5,
        },
        {
          pattern: 'Frequent high-impact food logs',
          suggestion:
            'Try replacing one beef or poultry meal per week with a plant-based alternative.',
          potentialSavingsKg: 4.2,
        },
        {
          pattern: 'Steady electricity base load',
          suggestion:
            'Unplug chargers and appliances when not in use to reduce standby power consumption.',
          potentialSavingsKg: 2.1,
        },
      ],
    });
  }

  // 4. Otherwise, it is a chat request!
  // Parse the user's message and generate a friendly, natural language conversational response.
  const match = prompt.match(/User message: "(.*)"/i);
  const userMsg = (match && match[1] ? match[1] : prompt).trim().toLowerCase();

  const transportTips = [
    'Switching to public transit or carpooling can drastically cut your transport footprint. Did you know that taking the bus instead of driving alone reduces emissions by over 60%?',
    'For short trips under 3 km, try walking or cycling. It is zero-emission, great for health, and saves money!',
    'If you drive, keeping your tires properly inflated and avoiding rapid acceleration can improve fuel efficiency by up to 10%.',
    'Transitioning to an electric vehicle or hybrid model when possible can reduce your driving carbon footprint by 50% to 80% depending on your power grid!',
  ];

  const foodTips = [
    'Eating more plant-based foods is one of the most effective ways to lower your carbon footprint. Beef and lamb have some of the highest emissions among all food groups.',
    "Try incorporating 'Meatless Mondays' or swapping red meat for poultry, fish, or legumes to reduce your diet's carbon footprint by up to 30%.",
    'Reducing food waste is crucial. Meal planning and composting organic waste can save significant landfill greenhouse gases.',
    'Buying local, seasonal produce reduces transport emissions (food miles) and supports local eco-friendly farmers!',
  ];

  const energyTips = [
    'Heating and cooling are the biggest home energy consumers. Setting your thermostat 1-2 degrees Celsius cooler in winter or warmer in summer saves significant energy.',
    'Unplug devices and appliances when not in use. Standby power (phantom load) can account for up to 10% of your electricity bill.',
    'Switching to LED light bulbs uses up to 80% less energy than incandescent bulbs and they last 25 times longer.',
    'Wash your laundry in cold water and air-dry clothing. Water heating is responsible for about 90% of the energy used by washing machines.',
  ];

  const wasteTips = [
    'Practice the 5 Rs of waste management: Refuse single-use plastics, Reduce what you buy, Reuse containers, Recycle correctly, and Rot (compost) organic scraps.',
    'Carry a reusable water bottle, coffee cup, and shopping bags to eliminate single-use plastics.',
    'Avoid fast fashion. Buying high-quality, durable clothes and shopping secondhand reduces waste and manufacturing emissions.',
    'Recycling one aluminum can saves enough energy to run a TV for three hours compared to creating a new one from scratch!',
  ];

  const generalTips = [
    'Every small action adds up! Tracking your daily carbon log, setting reduction goals, and staying mindful of energy, food, and transport choices makes a huge difference.',
    'Consider planting trees or supporting local carbon offset programs to neutralize emissions that you cannot avoid directly.',
    'Advocate for green policies and share eco-friendly tips with friends and family to amplify your positive impact!',
    'Understanding your footprint is the first step. Keep logging your activities to identify your highest emission categories and tackle them first!',
  ];

  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]!;

  if (
    userMsg.includes('food') ||
    userMsg.includes('eat') ||
    userMsg.includes('meat') ||
    userMsg.includes('diet') ||
    userMsg.includes('beef') ||
    userMsg.includes('chicken') ||
    userMsg.includes('vegetar') ||
    userMsg.includes('vegan')
  ) {
    return `Great question about food choices! ${getRandom(foodTips)} ${getRandom(generalTips)}`;
  }
  if (
    userMsg.includes('car') ||
    userMsg.includes('drive') ||
    userMsg.includes('transport') ||
    userMsg.includes('commute') ||
    userMsg.includes('travel') ||
    userMsg.includes('flight') ||
    userMsg.includes('plane') ||
    userMsg.includes('train') ||
    userMsg.includes('bus') ||
    userMsg.includes('bike')
  ) {
    return `Transport is a major source of emissions. ${getRandom(transportTips)} ${getRandom(generalTips)}`;
  }
  if (
    userMsg.includes('energy') ||
    userMsg.includes('electric') ||
    userMsg.includes('power') ||
    userMsg.includes('ac') ||
    userMsg.includes('heat') ||
    userMsg.includes('light') ||
    userMsg.includes('appliances')
  ) {
    return `Reducing home energy use has a direct green impact. ${getRandom(energyTips)} ${getRandom(generalTips)}`;
  }
  if (
    userMsg.includes('waste') ||
    userMsg.includes('plastic') ||
    userMsg.includes('recycle') ||
    userMsg.includes('garbage') ||
    userMsg.includes('trash') ||
    userMsg.includes('compost')
  ) {
    return `Managing waste properly is incredibly helpful for our ecosystems. ${getRandom(wasteTips)} ${getRandom(generalTips)}`;
  }

  // Fallback to a nice, variable general response
  return `Hi there! I am your AI Eco-Coach. ${getRandom(generalTips)} ${getRandom(foodTips)} Let me know if you want to chat about transportation, diet, home energy, or waste reduction!`;
}
