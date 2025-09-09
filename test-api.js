// Test OpenRouter API
const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'x-ai/grok-code-fast-1';

async function testAPI() {
  console.log('Testing OpenRouter API...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://flowcraft-ai.vercel.app',
        'X-Title': 'FlowCraft AI',
        'User-Agent': 'FlowCraft-AI/1.0'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: 'Hello, can you help me design a simple mobile app?'
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
        stream: false
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Response:', data);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();
