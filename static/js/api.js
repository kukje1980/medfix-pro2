async function apiFetch(path, options = {}) {
  const res = await fetch(`/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `오류가 발생했습니다. (HTTP ${res.status})`);
  }
  return res.json();
}
