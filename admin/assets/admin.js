;(function () {
  const AUTH_KEY = 'brgy:admin:token';
  const USER_KEY = 'brgy:admin:user';
  const API_BASE =
    window.__ADMIN_API_BASE__ ||
    `${window.location.origin.replace(/\/$/, '')}/api/admin`;

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = localStorage.getItem(AUTH_KEY);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      logout();
      window.location.href = 'index.html';
      throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
      let message = 'Request failed';
      try {
        const err = await response.json();
        message = err.error || err.message || message;
      } catch {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  function logout(opts = {}) {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    if (!opts.silent) {
      window.location.href = 'index.html';
    }
  }

  async function requireAuth(options = {}) {
    const { redirect = true } = options;
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      logout({ silent: true });
      if (redirect) {
        window.location.href = 'index.html';
      }
      return null;
    }

    try {
      const user =
        JSON.parse(localStorage.getItem(USER_KEY) || 'null') ||
        (await request('/me'));
      if (!user) {
        throw new Error('Session not found');
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (err) {
      console.error('Auth check failed:', err);
      logout({ silent: true });
      if (redirect) {
        window.location.href = 'index.html';
      }
      return null;
    }
  }

  const api = {
    async login(username, password) {
      const payload = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' },
      });
      localStorage.setItem(AUTH_KEY, payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      return payload.user;
    },
    logout,
    requireAuth,
    getCurrentUser() {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    },
    async dashboardStats() {
      return request('/dashboard');
    },
    async listCertifications() {
      return request('/certifications');
    },
    async setCertStatus(id, status) {
      return request(`/certifications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    async listComplaints() {
      return request('/complaints');
    },
    async updateComplaint(id, updates) {
      return request(`/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    async listAnnouncements() {
      return request('/announcements');
    },
    async createAnnouncement(payload) {
      return request('/announcements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async updateAnnouncement(id, payload) {
      return request(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    async deleteAnnouncement(id) {
      return request(`/announcements/${id}`, {
        method: 'DELETE',
      });
    },
    async listAccidents() {
      return request('/accidents');
    },
    async updateAccident(id, updates) {
      return request(`/accidents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    async listResidents() {
      return request('/residents');
    },
    async updateResident(id, updates) {
      return request(`/residents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    async archiveResident(id) {
      return request(`/residents/${id}/archive`, {
        method: 'POST',
      });
    },
    async listMessages() {
      return request('/messages');
    },
    async replyToMessage(messageId, reply) {
      return request(`/messages/${messageId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: reply }),
      });
    },
    async getMessageThread(username) {
      return request(`/messages/thread/${encodeURIComponent(username)}`);
    },
    async listRegistrations() {
      return request('/registrations');
    },
    async changeRegistrationStatus(id, status) {
      return request(`/registrations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    async pushActivity(entry) {
      return request('/activity', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
    },
  };

  window.brgyAdmin = api;
})();

