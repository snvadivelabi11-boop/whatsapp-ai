import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import ChatPlayground from './pages/ChatPlayground';
import Tickets from './pages/Tickets';
import CallRequests from './pages/CallRequests';
import Users from './pages/Users';
import Teams from './pages/Teams';
import KnowledgeBase from './pages/KnowledgeBase';
import SettingsPage from './pages/Settings';
import { api } from './services/api';

const PAGE_HEADERS = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Smart India Hackathon AI WhatsApp Helpdesk telemetry and performance'
  },
  conversations: {
    title: 'Live WhatsApp Conversations',
    subtitle: 'Inspect student message threads and provide direct admin assistance'
  },
  playground: {
    title: 'AI WhatsApp Chat Simulator',
    subtitle: 'Test student doubt resolution, escalation flow, and call requests locally'
  },
  tickets: {
    title: 'Admin Support Tickets',
    subtitle: 'Review and resolve queries escalated by the AI Helpdesk engine'
  },
  call_requests: {
    title: 'Student Call Requests',
    subtitle: 'Direct callback requests submitted by student teams via WhatsApp'
  },
  users: {
    title: 'Participant Directory',
    subtitle: 'All registered students and verified WhatsApp contact numbers'
  },
  teams: {
    title: 'Registered SIH Teams',
    subtitle: 'College teams, problem statements, and member rosters'
  },
  knowledge: {
    title: 'SIH Knowledge Base Manager',
    subtitle: 'Manage official SIH guidelines, evaluation rules, and dynamic FAQ answers'
  },
  settings: {
    title: 'System Settings & Integration',
    subtitle: 'Meta WhatsApp webhook instructions, environment status, and API health'
  }
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGlobalData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, healthRes] = await Promise.allSettled([
        api.getStats(),
        api.getHealth()
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value);
      }
    } catch (err) {
      console.error('Error fetching global stats/health:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const currentHeader = PAGE_HEADERS[currentPage] || PAGE_HEADERS.dashboard;

  return (
    <div className="app-container">
      {/* Fixed Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        stats={stats}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
          onRefresh={fetchGlobalData}
          isRefreshing={isRefreshing}
          healthData={healthData}
        />

        <main style={{ flex: 1 }}>
          {currentPage === 'dashboard' && (
            <Dashboard
              stats={stats}
              setCurrentPage={setCurrentPage}
              healthData={healthData}
            />
          )}

          {currentPage === 'conversations' && (
            <Conversations />
          )}

          {currentPage === 'playground' && (
            <ChatPlayground
              onConversationUpdated={fetchGlobalData}
            />
          )}

          {currentPage === 'tickets' && (
            <Tickets
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === 'call_requests' && (
            <CallRequests />
          )}

          {currentPage === 'users' && (
            <Users />
          )}

          {currentPage === 'teams' && (
            <Teams />
          )}

          {currentPage === 'knowledge' && (
            <KnowledgeBase />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              healthData={healthData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
