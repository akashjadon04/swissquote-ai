import { getSessionId } from './session';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const sessionId = getSessionId();
  const headers = new Headers(init?.headers);
  headers.set('x-session-id', sessionId);
  return fetch(input, { ...init, headers });
}
