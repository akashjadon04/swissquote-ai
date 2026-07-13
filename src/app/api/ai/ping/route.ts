import { NextResponse } from 'next/server';

export const runtime = 'edge';

// We just fire a tiny dummy request to wake up the NVIDIA NIM serverless models
export async function GET() {
  const keys = [
    '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',
    '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'
  ];

  try {
    // Fire off ping requests in parallel
    const pings = keys.map((apiKey) => 
      fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [{ role: 'user', content: '1' }],
          max_tokens: 1,
        }),
      }).catch(e => console.warn('[NIM Ping] Network error:', e))
    );

    // We wait for them to initiate and return headers, but we don't strictly need to wait for full generation
    // since the server is already woken up by the HTTP request arriving.
    await Promise.allSettled(pings);
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
