// Use the public API URL when set, otherwise default to the local backend in development.
// This ensures the browser sends the backend auth cookie, since the frontend proxy path would be a different origin.
export const apiBase =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5001" : "");

export async function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(`${apiBase}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
