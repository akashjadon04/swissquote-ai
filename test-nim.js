const apiKey = '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';
async function test() {
  console.log('Fetching NIM 3.1 JSON...');
  const start = Date.now();
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        {role: 'system', content: 'You are a JSON assistant. Output JSON with a list of 5 plumbing items.'},
        {role: 'user', content: 'Give me the items.'}
      ],
      response_format: { type: 'json_object' },
      max_tokens: 8192
    })
  });
  console.log('Status:', res.status, 'Time:', Date.now() - start, 'ms');
  const text = await res.text();
  console.log('Response:', text.slice(0, 500));
}
test();
