export function createTeamNotifier(config, whatsapp) {
  const { whatsappNumbers, webhookUrl } = config.team;

  async function notify(text) {
    const results = [];
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, content: text }),
          signal: AbortSignal.timeout(10_000)
        });
        results.push({ channel: 'webhook', ok: res.ok, detail: res.ok ? 'sent' : `HTTP ${res.status}` });
      } catch (error) {
        results.push({ channel: 'webhook', ok: false, detail: error.message });
      }
    }
    for (const number of whatsappNumbers) {
      try {
        const sent = await whatsapp.sendText(number, text);
        results.push({ channel: 'whatsapp', to: number, ok: true, detail: sent.demo ? 'demo' : 'sent' });
      } catch (error) {
        results.push({ channel: 'whatsapp', to: number, ok: false, detail: error.message });
      }
    }
    if (results.length === 0) results.push({ channel: 'log', ok: true, detail: 'No team channel configured.' });
    return results;
  }

  return { notify };
}
