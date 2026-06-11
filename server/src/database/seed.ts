import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Database seed script — populates achievements, challenges, and education content.
 * Idempotent: uses ON CONFLICT DO NOTHING.
 */

async function seed(): Promise<void> {
  logger.info('Starting database seed...');

  // ---- Achievements ----
  const achievements = [
    { slug: 'first-entry', name: 'First Step', description: 'Log your first carbon entry', icon: '🌱', xp: 50, type: 'entries_count', criteria: { count: 1 } },
    { slug: 'ten-entries', name: 'Data Collector', description: 'Log 10 carbon entries', icon: '📊', xp: 100, type: 'entries_count', criteria: { count: 10 } },
    { slug: 'fifty-entries', name: 'Carbon Tracker Pro', description: 'Log 50 carbon entries', icon: '🏆', xp: 250, type: 'entries_count', criteria: { count: 50 } },
    { slug: 'week-streak', name: '7-Day Streak', description: 'Log entries for 7 consecutive days', icon: '🔥', xp: 150, type: 'streak_days', criteria: { days: 7 } },
    { slug: 'month-streak', name: '30-Day Warrior', description: 'Maintain a 30-day logging streak', icon: '⚡', xp: 500, type: 'streak_days', criteria: { days: 30 } },
    { slug: 'reduce-10', name: 'Carbon Cutter', description: 'Reduce emissions by 10% vs baseline', icon: '✂️', xp: 200, type: 'reduction_percent', criteria: { percent: 10 } },
    { slug: 'reduce-25', name: 'Green Champion', description: 'Reduce emissions by 25%', icon: '🌿', xp: 400, type: 'reduction_percent', criteria: { percent: 25 } },
    { slug: 'first-challenge', name: 'Challenge Accepted', description: 'Complete your first eco challenge', icon: '🎯', xp: 100, type: 'challenge_complete', criteria: { count: 1 } },
    { slug: 'quiz-master', name: 'Eco Scholar', description: 'Score 100% on any quiz', icon: '🎓', xp: 150, type: 'quiz_score', criteria: { score: 100 } },
    { slug: 'eco-100', name: 'Eco Score 100', description: 'Reach an eco score of 100', icon: '💯', xp: 300, type: 'eco_score', criteria: { score: 100 } },
  ];

  for (const a of achievements) {
    await pool.query(
      `INSERT INTO achievements (slug, name, description, icon, xp_reward, criteria_type, criteria_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO NOTHING`,
      [a.slug, a.name, a.description, a.icon, a.xp, a.type, JSON.stringify(a.criteria)],
    );
  }
  logger.info(`✅ Seeded ${achievements.length} achievements`);

  // ---- Challenges ----
  const challenges = [
    { slug: 'no-plastic-week', title: 'No Plastic Week', description: 'Avoid all single-use plastics for 7 days. Bring your own bags, bottles, and containers.', category: 'lifestyle', days: 7, xp: 200, criteria: { type: 'avoid', subcategory: 'plastic' } },
    { slug: 'public-transport-week', title: 'Public Transport Week', description: 'Use only public transport or active travel (walk/cycle) for your commute for 7 days.', category: 'transportation', days: 7, xp: 250, criteria: { type: 'transport_mode', modes: ['bus', 'metro', 'train', 'bike'] } },
    { slug: 'water-saving', title: 'Water Saver Challenge', description: 'Reduce your daily water usage by 20% for 14 days.', category: 'home', days: 14, xp: 200, criteria: { type: 'reduce', subcategory: 'water', percent: 20 } },
    { slug: 'energy-saving', title: 'Energy Guardian', description: 'Cut your electricity usage by 15% for 14 days.', category: 'home', days: 14, xp: 300, criteria: { type: 'reduce', subcategory: 'electricity', percent: 15 } },
    { slug: 'veggie-week', title: 'Vegetarian Week', description: 'Eat only vegetarian or vegan meals for 7 days.', category: 'food', days: 7, xp: 200, criteria: { type: 'diet', allowed: ['vegetarian', 'vegan'] } },
    { slug: 'zero-waste-month', title: 'Zero Waste Month', description: 'Minimize all waste — reduce, reuse, recycle for 30 days.', category: 'lifestyle', days: 30, xp: 500, criteria: { type: 'reduce', subcategory: 'plastic', percent: 80 } },
    { slug: 'bike-commute', title: 'Cycle Commuter', description: 'Cycle to work or school every day for a week.', category: 'transportation', days: 7, xp: 250, criteria: { type: 'transport_mode', modes: ['bike'] } },
    { slug: 'meatless-month', title: 'Meatless Month', description: 'Go meat-free for an entire month.', category: 'food', days: 30, xp: 400, criteria: { type: 'diet', allowed: ['vegetarian', 'vegan'] } },
  ];

  for (const c of challenges) {
    await pool.query(
      `INSERT INTO challenges (slug, title, description, category, duration_days, xp_reward, criteria)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO NOTHING`,
      [c.slug, c.title, c.description, c.category, c.days, c.xp, JSON.stringify(c.criteria)],
    );
  }
  logger.info(`✅ Seeded ${challenges.length} challenges`);

  // ---- Education Content ----
  const educationContent = [
    {
      slug: 'what-is-carbon-footprint',
      title: 'What is a Carbon Footprint?',
      type: 'article',
      difficulty: 'beginner',
      readTime: 5,
      body: `# What is a Carbon Footprint?\n\nA carbon footprint is the total amount of greenhouse gases (including carbon dioxide and methane) that are generated by our actions.\n\n## Why Does It Matter?\n\nThe average person's carbon footprint is about 4.7 tonnes of CO₂ per year globally. In the US, it's closer to 16 tonnes. To avoid a 2°C rise in global temperatures, we need to reduce this to about 2 tonnes per person per year.\n\n## How Is It Measured?\n\nCarbon footprints are measured in units of carbon dioxide equivalent (CO₂e). This accounts for the different warming potential of various greenhouse gases.\n\n## Your Impact Areas\n\n1. **Transportation** — How you travel (car, bus, flight)\n2. **Home Energy** — Electricity, gas, and water usage\n3. **Diet** — What you eat (meat vs plant-based)\n4. **Lifestyle** — Shopping, electronics, waste`,
    },
    {
      slug: 'reduce-transport-emissions',
      title: '10 Ways to Reduce Transport Emissions',
      type: 'article',
      difficulty: 'beginner',
      readTime: 7,
      body: `# 10 Ways to Reduce Transport Emissions\n\n1. **Walk or cycle** for trips under 3 km\n2. **Use public transport** — buses emit 50-75% less per passenger than cars\n3. **Carpool** with colleagues or neighbors\n4. **Work from home** when possible\n5. **Maintain your vehicle** — proper tire pressure alone saves 3% fuel\n6. **Drive efficiently** — avoid rapid acceleration and idling\n7. **Consider an EV** — even with grid electricity, EVs emit 50% less\n8. **Avoid unnecessary flights** — one round-trip flight can equal months of driving\n9. **Use trains** for intercity travel — trains emit ~75% less than flights\n10. **Plan errands** to combine multiple trips into one`,
    },
    {
      slug: 'sustainable-diet-guide',
      title: 'The Sustainable Diet Guide',
      type: 'article',
      difficulty: 'intermediate',
      readTime: 8,
      body: `# The Sustainable Diet Guide\n\n## The Impact of Food\n\nFood production accounts for 26% of global greenhouse gas emissions.\n\n## Diet Comparison (kg CO₂e per day)\n\n- 🥩 High-meat diet: ~7.2 kg\n- 🍗 Medium-meat diet: ~5.6 kg\n- 🥗 Vegetarian: ~3.8 kg\n- 🌱 Vegan: ~2.9 kg\n\n## Easy Steps\n\n1. **Reduce beef** — beef produces 10x more emissions than chicken\n2. **Try Meatless Mondays** — save ~3 kg CO₂ per week\n3. **Buy local** — reduces transport emissions\n4. **Reduce food waste** — plan meals and use leftovers\n5. **Choose seasonal** — greenhouse-grown produce uses 5x more energy`,
    },
  ];

  for (const content of educationContent) {
    await pool.query(
      `INSERT INTO education_content (slug, title, content_type, difficulty, read_time_minutes, body, published)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (slug) DO NOTHING`,
      [content.slug, content.title, content.type, content.difficulty, content.readTime, content.body],
    );
  }
  logger.info(`✅ Seeded ${educationContent.length} education articles`);

  // ---- Quiz Questions ----
  const contentResult = await pool.query(
    "SELECT id, slug FROM education_content WHERE slug = 'what-is-carbon-footprint'",
  );
  if (contentResult.rows.length > 0) {
    const row = contentResult.rows[0] as { id: string };
    const contentId = row.id;
    const quizzes = [
      { q: 'What unit is used to measure carbon footprints?', opts: ['Watts', 'CO₂ equivalent (CO₂e)', 'Joules', 'BTUs'], correct: 1, xp: 10 },
      { q: 'What is the global average carbon footprint per person per year?', opts: ['1 tonne', '4.7 tonnes', '10 tonnes', '20 tonnes'], correct: 1, xp: 10 },
      { q: 'What is the target per-person footprint to limit warming to 2°C?', opts: ['0.5 tonnes', '2 tonnes', '5 tonnes', '8 tonnes'], correct: 1, xp: 15 },
    ];

    for (const quiz of quizzes) {
      await pool.query(
        `INSERT INTO quiz_questions (content_id, question, options, correct_index, xp_reward)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [contentId, quiz.q, JSON.stringify(quiz.opts), quiz.correct, quiz.xp],
      );
    }
    logger.info(`✅ Seeded ${quizzes.length} quiz questions`);
  }

  logger.info('Database seed complete!');
  await pool.end();
}

seed().catch((err: unknown) => {
  logger.error({ err: err as Error }, 'Seed failed');
  process.exit(1);
});
