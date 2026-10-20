import { AiService } from '../services/ai.service';

async function main() {
  const status = AiService.status();
  if (!status.configured) throw new Error('Set GEMINI_API_KEY or OPENAI_API_KEY in backend/.env before running the live AI check.');
  const first = await AiService.chat({ provider: 'auto', history: [], message: 'I chose indigo as my notebook color. Acknowledge in one sentence.' });
  const second = await AiService.chat({ provider: 'auto', history: [{ role: 'user', content: 'I chose indigo as my notebook color.' }, { role: 'assistant', content: first.reply }], message: 'What color did I choose? Answer briefly.' });
  if (!/indigo/i.test(second.reply)) throw new Error('Conversation recall check failed.');
  const general = await AiService.chat({ provider: 'auto', history: [], message: 'Write a polite two-sentence email asking a professor for a deadline extension.' });
  if (general.reply.length < 20 || /#include\s*</.test(general.reply)) throw new Error('General conversation check failed.');
  console.log(`PASS: ${first.provider}/${first.model} — live general conversation and follow-up recall.`);
}
void main().catch(error => { console.error(error.message); process.exitCode = 1; });
