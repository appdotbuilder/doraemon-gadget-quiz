import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gadgetsTable, quizQuestionsTable, gameSessionsTable, quizAnswersTable } from '../db/schema';
import { getRandomQuestion } from '../handlers/get_random_question';

describe('getRandomQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a random question with gadget info when no questions answered', async () => {
    // Create test data
    const gadgets = await db.insert(gadgetsTable)
      .values([
        {
          name: 'Anywhere Door',
          description: 'A door that can transport you anywhere instantly',
          image_url: 'http://example.com/door.jpg'
        },
        {
          name: 'Bamboo Copter',
          description: 'A helicopter rotor for flying',
          image_url: null
        }
      ])
      .returning()
      .execute();

    const questions = await db.insert(quizQuestionsTable)
      .values([
        {
          gadget_id: gadgets[0].id,
          question_text: 'What does the Anywhere Door do?',
          correct_answer: 'A',
          option_a: 'Teleports you anywhere',
          option_b: 'Makes you invisible',
          option_c: 'Flies you around',
          option_d: 'Travels through time'
        },
        {
          gadget_id: gadgets[1].id,
          question_text: 'What is the Bamboo Copter used for?',
          correct_answer: 'B',
          option_a: 'Swimming',
          option_b: 'Flying',
          option_c: 'Digging',
          option_d: 'Cooking'
        }
      ])
      .returning()
      .execute();

    const sessions = await db.insert(gameSessionsTable)
      .values([{ player_name: 'Test Player' }])
      .returning()
      .execute();

    const result = await getRandomQuestion(sessions[0].id);

    // Should return one of the questions
    expect(result).not.toBeNull();
    expect(result!.id).toBeOneOf([questions[0].id, questions[1].id]);
    expect(result!.question_text).toBeString();
    expect(result!.gadget_id).toBeNumber();

    // Check options format
    expect(result!.options).toHaveLength(4);
    expect(result!.options[0].key).toBe('A');
    expect(result!.options[1].key).toBe('B');
    expect(result!.options[2].key).toBe('C');
    expect(result!.options[3].key).toBe('D');
    result!.options.forEach(option => {
      expect(option.value).toBeString();
      expect(option.value.length).toBeGreaterThan(0);
    });

    // Check gadget info is included
    expect(result!.gadget).toBeDefined();
    expect(result!.gadget!.id).toBeNumber();
    expect(result!.gadget!.name).toBeString();
    expect(result!.gadget!.description).toBeString();
    expect(result!.gadget!.created_at).toBeInstanceOf(Date);
  });

  it('should exclude already answered questions', async () => {
    // Create test data
    const gadgets = await db.insert(gadgetsTable)
      .values([
        {
          name: 'Time Machine',
          description: 'Travel through time',
          image_url: null
        }
      ])
      .returning()
      .execute();

    const questions = await db.insert(quizQuestionsTable)
      .values([
        {
          gadget_id: gadgets[0].id,
          question_text: 'Question 1',
          correct_answer: 'A',
          option_a: 'Option A1',
          option_b: 'Option B1',
          option_c: 'Option C1',
          option_d: 'Option D1'
        },
        {
          gadget_id: gadgets[0].id,
          question_text: 'Question 2',
          correct_answer: 'B',
          option_a: 'Option A2',
          option_b: 'Option B2',
          option_c: 'Option C2',
          option_d: 'Option D2'
        }
      ])
      .returning()
      .execute();

    const sessions = await db.insert(gameSessionsTable)
      .values([{ player_name: 'Test Player' }])
      .returning()
      .execute();

    // Answer the first question
    await db.insert(quizAnswersTable)
      .values([{
        session_id: sessions[0].id,
        question_id: questions[0].id,
        selected_answer: 'A',
        is_correct: true,
        points_awarded: 10
      }])
      .execute();

    const result = await getRandomQuestion(sessions[0].id);

    // Should return only the unanswered question
    expect(result).not.toBeNull();
    expect(result!.id).toBe(questions[1].id);
    expect(result!.question_text).toBe('Question 2');
  });

  it('should return null when all questions are answered', async () => {
    // Create test data
    const gadgets = await db.insert(gadgetsTable)
      .values([
        {
          name: 'Magic Pocket',
          description: 'A pocket with infinite storage',
          image_url: null
        }
      ])
      .returning()
      .execute();

    const questions = await db.insert(quizQuestionsTable)
      .values([
        {
          gadget_id: gadgets[0].id,
          question_text: 'What is special about the Magic Pocket?',
          correct_answer: 'A',
          option_a: 'Infinite storage',
          option_b: 'Time travel',
          option_c: 'Invisibility',
          option_d: 'Flying'
        }
      ])
      .returning()
      .execute();

    const sessions = await db.insert(gameSessionsTable)
      .values([{ player_name: 'Test Player' }])
      .returning()
      .execute();

    // Answer the only question
    await db.insert(quizAnswersTable)
      .values([{
        session_id: sessions[0].id,
        question_id: questions[0].id,
        selected_answer: 'A',
        is_correct: true,
        points_awarded: 10
      }])
      .execute();

    const result = await getRandomQuestion(sessions[0].id);

    expect(result).toBeNull();
  });

  it('should return null when no questions exist', async () => {
    const sessions = await db.insert(gameSessionsTable)
      .values([{ player_name: 'Test Player' }])
      .returning()
      .execute();

    const result = await getRandomQuestion(sessions[0].id);

    expect(result).toBeNull();
  });

  it('should return different questions on multiple calls (randomness)', async () => {
    // Create multiple test questions
    const gadgets = await db.insert(gadgetsTable)
      .values([
        {
          name: 'Test Gadget',
          description: 'A gadget for testing',
          image_url: null
        }
      ])
      .returning()
      .execute();

    // Create 5 questions to increase chance of getting different ones
    const questions = await db.insert(quizQuestionsTable)
      .values([
        {
          gadget_id: gadgets[0].id,
          question_text: 'Question 1',
          correct_answer: 'A',
          option_a: 'A1', option_b: 'B1', option_c: 'C1', option_d: 'D1'
        },
        {
          gadget_id: gadgets[0].id,
          question_text: 'Question 2',
          correct_answer: 'B',
          option_a: 'A2', option_b: 'B2', option_c: 'C2', option_d: 'D2'
        },
        {
          gadget_id: gadgets[0].id,
          question_text: 'Question 3',
          correct_answer: 'C',
          option_a: 'A3', option_b: 'B3', option_c: 'C3', option_d: 'D3'
        },
        {
          gadget_id: gadgets[0].id,
          question_text: 'Question 4',
          correct_answer: 'D',
          option_a: 'A4', option_b: 'B4', option_c: 'C4', option_d: 'D4'
        },
        {
          gadget_id: gadgets[0].id,
          question_text: 'Question 5',
          correct_answer: 'A',
          option_a: 'A5', option_b: 'B5', option_c: 'C5', option_d: 'D5'
        }
      ])
      .returning()
      .execute();

    const sessions = await db.insert(gameSessionsTable)
      .values([{ player_name: 'Test Player' }])
      .returning()
      .execute();

    // Call multiple times and collect results
    const results = [];
    for (let i = 0; i < 10; i++) {
      const result = await getRandomQuestion(sessions[0].id);
      if (result) {
        results.push(result.id);
      }
    }

    // Should have at least some variation (not all the same)
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBeGreaterThan(1);
  });

  it('should handle session with no answers correctly', async () => {
    // Create test data
    const gadgets = await db.insert(gadgetsTable)
      .values([
        {
          name: 'Translation Konjac',
          description: 'Translates any language',
          image_url: 'http://example.com/konjac.jpg'
        }
      ])
      .returning()
      .execute();

    const questions = await db.insert(quizQuestionsTable)
      .values([
        {
          gadget_id: gadgets[0].id,
          question_text: 'What does Translation Konjac do?',
          correct_answer: 'A',
          option_a: 'Translates languages',
          option_b: 'Cooks food',
          option_c: 'Plays music',
          option_d: 'Takes photos'
        }
      ])
      .returning()
      .execute();

    const sessions = await db.insert(gameSessionsTable)
      .values([{ player_name: 'New Player' }])
      .returning()
      .execute();

    const result = await getRandomQuestion(sessions[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(questions[0].id);
    expect(result!.gadget!.name).toBe('Translation Konjac');
    expect(result!.gadget!.image_url).toBe('http://example.com/konjac.jpg');
  });
});