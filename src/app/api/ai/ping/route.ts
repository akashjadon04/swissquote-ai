import { NextResponse } from 'next/server';

export const runtime = 'edge';

// We just fire a tiny dummy request to wake up the NVIDIA NIM serverless models
export async function GET() {
  const keys = [
    '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',
    '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'
  ];

  try {
    // Fire off ping requests in parallel with a strict 2-second abort timeout
    const pings = keys.map((apiKey) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      return fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'meta/llama-3.3-70b-instruct', // active model
          messages: [{ role: 'user', content: '1' }],
          max_tokens: 1,
        }),
        signal: controller.signal,
      })
      .then((res) => {
        clearTimeout(timeout);
        return res;
      })
      .catch(e => {
        clearTimeout(timeout);
        console.warn('[NIM Ping] Error/Timeout:', e.message);
      });
    });

    // We wait for them to initiate and return headers, but we don't strictly need to wait for full generation
    await Promise.allSettled(pings);
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
