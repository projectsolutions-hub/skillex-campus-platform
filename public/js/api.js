// public/js/api.js
// SkillEx Client API layer

const API_BASE = (function() {
  const p = window.location.pathname.replace(/\/index\.(html|php)$/, '').replace(/\/$/, '');
  return (p ? p : '') + '/api';
})();

const API = {
  async req(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('skillex_token');
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(API_BASE + endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...(options.headers || {})
        },
        credentials: 'same-origin',
        ...options
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth
  auth: {
    register: (name, email) => API.req('/auth/register', { method: 'POST', body: JSON.stringify({ name, email }) }),
    verifyOtp: (email, otp) => API.req('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
    login: (email, password, requiredRole) => API.req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, requiredRole }) }),
    getMe: (userId) => API.req(`/auth/me?userId=${userId || ''}`),
    updateProfile: (profile) => API.req('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
    forgotPassword: (email) => API.req('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    getUsers: () => API.req('/auth/users')
  },

  // Projects
  projects: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.req(`/projects${q ? '?' + q : ''}`);
    },
    getById: (id) => API.req(`/projects/${id}`),
    create: (project) => API.req('/projects', { method: 'POST', body: JSON.stringify(project) }),
    update: (id, updates) => API.req(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    delete: (id) => API.req(`/projects/${id}`, { method: 'DELETE' })
  },

  // Proposals
  proposals: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.req(`/proposals${q ? '?' + q : ''}`);
    },
    create: (proposal) => API.req('/proposals', { method: 'POST', body: JSON.stringify(proposal) }),
    shortlist: (id) => API.req(`/proposals/${id}/shortlist`, { method: 'POST' }),
    reject: (id) => API.req(`/proposals/${id}/reject`, { method: 'POST' }),
    select: (id) => API.req(`/proposals/${id}/select`, { method: 'POST' })
  },

  // Workspace
  workspace: {
    get: (projectId) => API.req(`/workspace/${projectId}`),
    approveMilestone: (projectId, milestoneId) =>
      API.req(`/workspace/${projectId}/milestones/${milestoneId}/approve`, { method: 'POST' }),
    requestRevision: (projectId, milestoneId, reason) =>
      API.req(`/workspace/${projectId}/milestones/${milestoneId}/revision`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    submitMilestone: (projectId, milestoneId, deliverableNote) =>
      API.req(`/workspace/${projectId}/milestones/${milestoneId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ deliverableNote })
      }),
    getChat: (projectId) => API.req(`/workspace/${projectId}/chat`),
    sendChat: (projectId, text, senderName, isMe = true) =>
      API.req(`/workspace/${projectId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ text, senderName, isMe })
      }),
    uploadFile: async (projectId, file, uploader = 'You') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploader', uploader);
      const token = localStorage.getItem('skillex_token');
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/workspace/${projectId}/files`, {
        method: 'POST',
        headers: {
          ...authHeaders
        },
        credentials: 'same-origin',
        body: formData
      });
      return await res.json();
    },
    dispute: (projectId, reason, details, filedBy) =>
      API.req(`/workspace/${projectId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason, details, filedBy })
      })
  },

  // AI Requirement Analyzer
  ai: {
    analyze: (title, description, category) =>
      API.req('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ title, description, category })
      })
  },

  // Reviews
  reviews: {
    submit: (review) => API.req('/reviews', { method: 'POST', body: JSON.stringify(review) })
  },

  // Notifications
  notifications: {
    getAll: () => API.req('/notifications'),
    markRead: () => API.req('/notifications/mark-read', { method: 'POST' })
  },

  // Admin
  admin: {
    getOverview: () => API.req('/admin/overview'),
    getVerificationQueue: () => API.req('/admin/verification-queue'),
    approveVerification: (id) => API.req(`/admin/verify/${id}/approve`, { method: 'POST' }),
    rejectVerification: (id) => API.req(`/admin/verify/${id}/reject`, { method: 'POST' }),
    getSkillsAnalysis: () => API.req('/admin/skills-analysis'),
    getUsers: (q) => API.req(`/admin/users${q ? '?q=' + encodeURIComponent(q) : ''}`),
    toggleUserStatus: (id) => API.req(`/admin/users/${id}/toggle-status`, { method: 'POST' }),
    getModeration: () => API.req('/admin/moderation'),
    moderateItem: (id, action) => API.req(`/admin/moderation/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
    getDisputes: () => API.req('/admin/disputes'),
    getAuditLogs: () => API.req('/admin/audit-logs')
  }
};
