const PRODUCTION_API_URL = 'https://project-six-rust-94.vercel.app';
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? PRODUCTION_API_URL : '');

/**
 * Thin fetch wrapper. Throws an Error carrying `fieldErrors` when the API
 * replies with a 400 validation payload, so forms can show per-field messages.
 */
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the API. Is the server running on port 4000?');
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || `Request failed (${response.status}).`);
    error.fieldErrors = payload.errors || {};
    error.status = response.status;
    throw error;
  }

  return payload;
}

export const api = {
  health: () => request('/health'),

  listAppointments: ({ status = 'All', search = '' } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    const query = params.toString();
    return request(`/appointments${query ? `?${query}` : ''}`);
  },

  createAppointment: (appointment) =>
    request('/appointments', { method: 'POST', body: JSON.stringify(appointment) }),

  updateStatus: (id, status) =>
    request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),
};
