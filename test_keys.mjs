import { GoogleGenAI } from '@google/genai';

async function testKey(name, key) {
  if (!key) {
    console.log(`${name}: Not provided`);
    return;
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Say "hello"',
    });
    console.log(`${name}: VALID - ${result.text.trim()}`);
  } catch (err) {
    console.log(`${name}: ERROR - ${err.message}`);
  }
}

async function main() {
  await testKey('KEY_1', process.env.GEMINI_API_KEY_1);
  await testKey('KEY_2', process.env.GEMINI_API_KEY_2);
  await testKey('LEGACY', process.env.GEMINI_API_KEY);
}

main();
