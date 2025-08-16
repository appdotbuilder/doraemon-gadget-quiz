import { type QuizQuestionWithOptions } from '../schema';

export async function getRandomQuestion(sessionId: number): Promise<QuizQuestionWithOptions | null> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to fetch a random quiz question that hasn't been
    // answered yet in the current game session, including the gadget information
    // and formatting the multiple choice options properly.
    return Promise.resolve({
        id: 1, // Placeholder question ID
        gadget_id: 1,
        question_text: "What is the name of Doraemon's teleportation gadget?",
        options: [
            { key: "A", value: "Anywhere Door" },
            { key: "B", value: "Time Machine" },
            { key: "C", value: "Bamboo Copter" },
            { key: "D", value: "Magic Carpet" }
        ],
        gadget: {
            id: 1,
            name: "Anywhere Door",
            description: "A door that can transport you anywhere instantly",
            image_url: null,
            created_at: new Date()
        }
    } as QuizQuestionWithOptions);
}