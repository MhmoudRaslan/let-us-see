const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
console.log('API_BASE_URL:', API_BASE_URL);

export const fetchHealthCheck = async () => {
  const res = await fetch(`${API_BASE_URL}/core/health/`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// use this instead of calling api.anthropic.com directly
export const callAnthropicProxy = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/core/anthropic/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  return res.json();
};