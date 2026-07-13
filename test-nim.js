const apiKey = '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';
fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + apiKey
  },
  body: JSON.stringify({
    model: 'meta/llama-3.3-70b-instruct',
    messages: [{role: 'user', content: 'Say hi'}],
    max_tokens: 10
  })
}).then(r => r.json()).then(console.log).catch(console.error);
