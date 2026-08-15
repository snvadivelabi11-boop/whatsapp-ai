import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  // System Health & Analytics
  getHealth: () => client.get('/health').then((r) => r.data),
  getStats: () => client.get('/api/stats').then((r) => r.data),

  // AI Chat Simulator (Phase 3 testing)
  sendChatMessage: (payload) => client.post('/api/chat', payload).then((r) => r.data),

  // Conversations
  getConversations: () => client.get('/api/conversations').then((r) => r.data),
  getConversationMessages: (convId) => client.get(`/api/conversations/${convId}/messages`).then((r) => r.data),
  sendAdminReply: (convId, payload) => client.post(`/api/conversations/${convId}/reply`, payload).then((r) => r.data),

  // Users & Teams
  getUsers: () => client.get('/api/users').then((r) => r.data),
  getTeams: () => client.get('/api/teams').then((r) => r.data),
  createTeam: (payload) => client.post('/api/teams', payload).then((r) => r.data),

  // Support Tickets (Escalations)
  getTickets: (status) => client.get('/api/tickets', { params: { status } }).then((r) => r.data),
  createTicket: (payload) => client.post('/api/tickets', payload).then((r) => r.data),
  updateTicket: (ticketId, payload) => client.put(`/api/tickets/${ticketId}`, payload).then((r) => r.data),

  // Call Requests
  getCallRequests: (status) => client.get('/api/call-requests', { params: { status } }).then((r) => r.data),
  createCallRequest: (payload) => client.post('/api/call-requests', payload).then((r) => r.data),
  updateCallRequest: (requestId, payload) => client.put(`/api/call-requests/${requestId}`, payload).then((r) => r.data),

  // Knowledge Base
  getKnowledge: () => client.get('/api/knowledge').then((r) => r.data),
  createKnowledge: (payload) => client.post('/api/knowledge', payload).then((r) => r.data),
  updateKnowledge: (id, payload) => client.put(`/api/knowledge/${id}`, payload).then((r) => r.data),
  deleteKnowledge: (id) => client.delete(`/api/knowledge/${id}`).then((r) => r.data),
};
