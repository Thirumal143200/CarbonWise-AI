import type { Request, Response } from 'express';

import { query, queryOne } from '../../config/database';
import { asyncHandler, AppError } from '../../middleware/error-handler.middleware';
import { sendSuccess } from '../../utils/response';

// ---- Controllers ----

export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const type = req.query.type as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const conditions = ['published = true'];
  const values: unknown[] = [];
  let idx = 1;

  if (type) { conditions.push(`content_type = $${idx++}`); values.push(type); }
  if (difficulty) { conditions.push(`difficulty = $${idx++}`); values.push(difficulty); }

  const where = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM education_content WHERE ${where}`, values,
  );
  const total = parseInt(countResult[0]?.count ?? '0', 10);

  values.push(limit, offset);
  const content = await query<{
    id: string; title: string; content_type: string; body: string;
    difficulty: string; read_time_minutes: number; slug: string; created_at: Date;
  }>(
    `SELECT * FROM education_content WHERE ${where}
     ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  sendSuccess(res, {
    content: content.map((c) => ({
      id: c.id, title: c.title, contentType: c.content_type,
      difficulty: c.difficulty, readTimeMinutes: c.read_time_minutes,
      slug: c.slug, createdAt: c.created_at.toISOString(),
    })),
  }, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug!;

  const content = await queryOne<{
    id: string; title: string; content_type: string; body: string;
    difficulty: string; read_time_minutes: number; slug: string; created_at: Date;
  }>(
    'SELECT * FROM education_content WHERE slug = $1 AND published = true', [slug],
  );

  if (!content) throw new AppError(404, 'NOT_FOUND', 'Content not found');

  // Fetch associated quiz questions
  const quiz = await query<{
    id: string; question: string; options: unknown; correct_index: number; xp_reward: number;
  }>(
    'SELECT * FROM quiz_questions WHERE content_id = $1', [content.id],
  );

  sendSuccess(res, {
    content: {
      id: content.id, title: content.title, contentType: content.content_type,
      body: content.body, difficulty: content.difficulty,
      readTimeMinutes: content.read_time_minutes, slug: content.slug,
      createdAt: content.created_at.toISOString(),
    },
    quiz: quiz.map((q) => ({
      id: q.id, question: q.question, options: q.options, xpReward: q.xp_reward,
      // Don't send correct_index to client!
    })),
  });
});

export const answerQuiz = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const questionId = req.params.questionId!;
  const { selected_index } = req.body as { selected_index: number };

  // Check if already answered
  const existing = await queryOne(
    'SELECT id FROM user_quiz_results WHERE user_id = $1 AND question_id = $2',
    [userId, questionId],
  );
  if (existing) throw new AppError(409, 'CONFLICT', 'Already answered this question');

  // Get correct answer
  const question = await queryOne<{ correct_index: number; xp_reward: number }>(
    'SELECT correct_index, xp_reward FROM quiz_questions WHERE id = $1', [questionId],
  );
  if (!question) throw new AppError(404, 'NOT_FOUND', 'Question not found');

  const correct = selected_index === question.correct_index;

  await query(
    `INSERT INTO user_quiz_results (user_id, question_id, selected_index, correct)
     VALUES ($1, $2, $3, $4)`,
    [userId, questionId, selected_index, correct],
  );

  // Award XP if correct
  let xpEarned = 0;
  if (correct) {
    xpEarned = question.xp_reward;
    await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [xpEarned, userId]);
  }

  sendSuccess(res, { correct, xpEarned, correctIndex: question.correct_index });
});
