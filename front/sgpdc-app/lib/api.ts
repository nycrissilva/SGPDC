// Use the public API URL when set, otherwise default to a relative path
// so the browser calls the frontend host and Next.js rewrites proxy requests
export const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
