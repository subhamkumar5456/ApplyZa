import { HfInference } from '@huggingface/inference';

async function testKey(name, key) {
  if (!key) {
    console.log(`${name}: Not provided`);
    return;
  }
  try {
    const hf = new HfInference(key);
    const result = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [
        { role: 'user', content: 'Say "hello"' }
      ],
      parameters: { max_new_tokens: 10 }
    });
    console.log(`${name}: VALID - ${result.choices[0].message.content.trim()}`);
  } catch (err) {
    console.log(`${name}: ERROR - ${err.message}`);
  }
}

async function main() {
  await testKey('HF_KEY', process.env.HUGGINGFACE_API_KEY);
  for (let i = 1; i <= 3; i++) {
    await testKey(`HF_KEY_${i}`, process.env[`HUGGINGFACE_API_KEY_${i}`]);
  }
}

main();
