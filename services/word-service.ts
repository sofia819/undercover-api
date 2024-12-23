import Groq from 'groq-sdk';

const apiKey: string = process.env.API_KEY || '';
const groq = new Groq({ apiKey });
const prompt: string = `
Provide two commonly used everyday nouns for the word game Spyfall. The words should be related but not identical or subtypes of each other, and should not be interchangeable.

Good examples:
- car, van
- guitar, violin
- coffee, tea
- computer, television

Bad examples:
- couch, sofa
- chair, stool
- chef, cook
- hammer, mallet
- bookshelf, bookcase

Return only the two words, separated by a comma and in lowercase. Do not provide reasoning.
`;

export const getWords = async () => {
  const result = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama3-70b-8192',
  });
  return result.choices[0]?.message?.content || '';
};

export const wordService = { getWords };
