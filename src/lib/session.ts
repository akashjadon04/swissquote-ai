export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sessionId = localStorage.getItem('sq_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('sq_session_id', sessionId);
  }
  return sessionId;
}
