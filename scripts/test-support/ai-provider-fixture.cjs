// Only preloaded by the browser test subprocess. Never imported by application code.
// These controlled responses test request routing and rendering, not live model quality.
if (process.env.NODE_ENV !== 'test') throw new Error('The AI provider fixture requires NODE_ENV=test.');

const { appendFileSync } = require('node:fs');
const originalFetch = globalThis.fetch;
const replies = new Map([
  ['Reply with OK.', 'OK'],
  ['Hello!', 'Hello! How can I help you today?'],
  ['Explain photosynthesis in simple English.', 'Plants use sunlight, water and carbon dioxide to make food and release oxygen.'],
  ['Write a polite email to my professor.', 'Dear Professor,\n\nMay I please request a deadline extension? Thank you for your consideration.'],
  ['My notebook color is indigo. Remember it.', 'I will remember that your notebook is indigo.'],
  ['Write a JavaScript function that adds two numbers.', '```javascript\nfunction add(a, b) {\n  return a + b;\n}\n```'],
  ['Write a birthday wish for my friend.', 'Happy birthday! Wishing you a wonderful year filled with joy and success.'],
]);

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const provider = url.hostname === 'generativelanguage.googleapis.com' ? 'gemini' : url.hostname === 'api.openai.com' ? 'openai' : null;
  if (!provider) return originalFetch(input, options);
  const headers = new Headers(options.headers);
  const key = provider === 'gemini' ? headers.get('x-goog-api-key') : headers.get('authorization')?.replace(/^Bearer /, '');
  if (key !== `codesync-demo-${provider}-fixture-key`) return new Response('{}', { status: 401 });
  const body = JSON.parse(options.body);
  const messages = provider === 'gemini'
    ? body.contents.map(item => ({ role: item.role === 'model' ? 'assistant' : 'user', content: item.parts.map(part => part.text).join('') }))
    : body.input;
  const instructions = provider === 'gemini' ? body.systemInstruction.parts[0].text : body.instructions;
  if (!instructions.includes('general-purpose')) return new Response('{}', { status: 400 });
  const latest = messages.at(-1).content;
  const question = latest.split('\n\nCurrent user request:\n').at(-1);
  // Record no headers or credentials; only synthetic test prompts and source files.
  appendFileSync(process.env.CODESYNC_TEST_AI_LOG, JSON.stringify({ provider, messages }) + '\n');
  let text = replies.get(question);
  if (question === 'What color is my notebook?' && messages.some(item => item.role === 'user' && item.content.includes('color is indigo'))) text = 'Your notebook is indigo.';
  if (question === 'What does the open C file print?' && latest.includes('DEMO_RUN_42')) text = 'The C file prints DEMO_RUN_42 followed by a newline.';
  if (latest.startsWith('Explain this c code and derive') && latest.includes('DEMO_RUN_42')) {
    text = JSON.stringify({ explanation: 'The program prints DEMO_RUN_42 and exits successfully.', timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }
  // An unrecognized test request must fail, not receive a generic successful answer.
  if (!text) return new Response('{}', { status: 400 });
  const data = provider === 'gemini'
    ? { candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }
    : { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text }] }] };
  return Response.json(data);
};
