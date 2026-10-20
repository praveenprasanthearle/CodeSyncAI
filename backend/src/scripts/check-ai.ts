import { AiService } from '../services/ai.service';

async function main() {
  const status = AiService.status();
  if (!status.configured) throw new Error('Set GEMINI_API_KEY or OPENAI_API_KEY in backend/.env before running the live AI check.');
  const first = await AiService.chat({ provider: 'auto', history: [], message: 'I chose indigo as my notebook color. Acknowledge in one sentence.' });
  const second = await AiService.chat({ provider: 'auto', history: [{ role: 'user', content: 'I chose indigo as my notebook color.' }, { role: 'assistant', content: first.reply }], message: 'What color did I choose? Answer briefly.' });
  if (!/indigo/i.test(second.reply)) throw new Error('Conversation recall check failed.');
  const general = await AiService.chat({ provider: 'auto', history: [], message: 'Write a polite two-sentence email asking a professor for a deadline extension.' });
  if (general.reply.length < 20 || /#include\s*</.test(general.reply)) throw new Error('General conversation check failed.');
  const greeting = await AiService.chat({ provider: 'auto', history: [], message: 'Hello! Please greet me in one sentence without code.' });
  if (/```|#include\s*</.test(greeting.reply)) throw new Error('Greeting unexpectedly returned code.');
  const coding = await AiService.chat({ provider: 'auto', history: [], message: 'Write a JavaScript function named add that returns the sum of two numbers. Put the function in a fenced javascript code block.' });
  if (!/```(?:javascript|js)\s*\n[\s\S]+?```/.test(coding.reply)) throw new Error('Coding request did not return the requested JavaScript block.');
  const changedTopic = await AiService.chat({ provider: 'auto', history: [{ role: 'user', content: 'Write a JavaScript function named add.' }, { role: 'assistant', content: coding.reply }], message: 'Now write a birthday wish for a friend, in English. No code.' });
  if (/```|#include\s*</.test(changedTopic.reply) || !/birthday/i.test(changedTopic.reply)) throw new Error('Topic-switch check failed.');
  for (const [label, result] of [['Greeting', greeting], ['Email', general], ['Coding', coding], ['New topic after coding', changedTopic]] as const) {
    console.log(`${label}:\n${result.reply.slice(0, 600)}\n`);
  }
  console.log(`PASS: ${first.provider}/${first.model} — live greeting, writing, follow-up recall, coding and topic switching.`);
}
void main().catch(error => { console.error(error.message); process.exitCode = 1; });
