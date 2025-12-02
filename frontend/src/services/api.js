const BASE_URL = 'http://127.0.0.1:8000/api/core';

export async function fetchHealthCheck() {
  const response = await fetch(`${BASE_URL}/health/`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

export async function callAnthropicProxy(payload) {
  // ✅ Changed from /anthropic/ to /chat/
  const response = await fetch(`${BASE_URL}/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error: ${errorText}`);
  }

  return response.json();
}