/** Small JSON client for the YA² API (same-origin, cookie session). */

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

export const IS_PREVIEW = import.meta.env.VITE_PREVIEW === '1';

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  if (IS_PREVIEW) {
    const { previewRequest, PreviewError } = await import('./previewApi');
    try {
      return (await previewRequest(method, url, body)) as T;
    } catch (e) {
      if (e instanceof PreviewError) throw new ApiError(e.status, e.message, e.fields);
      throw e;
    }
  }
  let res: Response;
  try {
    res = await fetch(`/api${url}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined || method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : method !== 'GET' ? '{}' : undefined,
    });
  } catch {
    throw new ApiError(0, 'Could not reach YA² servers. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Something went wrong. Please try again.', data.fields ?? {});
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
};
