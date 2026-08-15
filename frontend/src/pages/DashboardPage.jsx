import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUserGroup, HiOutlineSparkles, HiOutlinePhone,
  HiOutlineEyeOff, HiOutlineInboxIn, HiOutlineCalendar,
  HiOutlineLocationMarker, HiOutlineHeart, HiOutlineAcademicCap,
  HiOutlinePresentationChartBar, HiOutlineThumbUp, HiOutlineThumbDown,
  HiOutlineGlobe
} from 'react-icons/hi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const STAT_CONFIGS = [
  { key: 'totalDatabase', label: 'Total Database (All Time)', icon: HiOutlineUserGroup, color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  { key: 'newLeads', label: 'New Leads (Period)', icon: HiOutlineSparkles, color: '#f97316', bg: 'rgba(249,115,22,0.12)', highlighted: true },
  { key: 'connectedCalls', label: 'Connected Calls', icon: HiOutlinePhone, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { key: 'notConnected', label: 'Not Connected', icon: HiOutlineEyeOff, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { key: 'untouchedLeads', label: 'Untouched Leads', icon: HiOutlineInboxIn, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { key: 'dueFollowUps', label: 'Due Follow-Ups', icon: HiOutlineCalendar, color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  { key: 'centerVisited', label: 'Center Visited', icon: HiOutlineLocationMarker, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { key: 'highlyInterested', label: 'Highly Interested', icon: HiOutlineHeart, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'courseJoined', label: 'Course Joined', icon: HiOutlineAcademicCap, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { key: 'workshopJoined', label: 'Workshop Joined', icon: HiOutlinePresentationChartBar, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'interested', label: 'Interested', icon: HiOutlineThumbUp, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  { key: 'notInterested', label: 'Not Interested', icon: HiOutlineThumbDown, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { key: 'onlineMode', label: 'Online Mode', icon: HiOutlineGlobe, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
];

const TIME_FILTERS = ['Today', '7D', '14D', '30D', 'All Time', 'Custom'];
const PERIOD_MAP = { 'Today': 'today', '7D': '7d', '14D': '14d', '30D': '30d', 'All Time': 'all', 'Custom': '14d' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [pipeline, setPipeline] = useState([]);
  const [period, setPeriod] = useState('14D');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      const [statsRes, pipelineRes] = await Promise.all([
        api.get(`/analytics/dashboard?period=${PERIOD_MAP[period]}`),
        api.get('/analytics/pipeline?days=30')
      ]);
      setStats(statsRes.data.stats || {});
      setPipeline(pipelineRes.data.pipeline || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Use empty stats if API not available
      setStats({});
      setPipeline([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: pipeline.map(p => {
      const d = new Date(p.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: 'Acquired Leads',
        data: pipeline.map(p => p.acquiredLeads),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'Scheduled Follow-ups',
        data: pipeline.map(p => p.scheduledFollowUps),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'Successful Joins',
        data: pipeline.map(p => p.successfulJoins),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11, weight: '600', family: 'Inter' },
          padding: 20
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: 'Inter' }, color: '#94a3b8' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 10, family: 'Inter' }, color: '#94a3b8', stepSize: 1 }
      }
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon">✨</span>
          <div>
            <h1 className="page-title">CRM Command Center</h1>
            <p className="page-subtitle">Real-Time Dynamic Cohort Analytics</p>
          </div>
        </div>
        <div className="global-filter">
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>🏢</span>
          <select className="select" defaultValue="all">
            <option value="all">Global (All Team)</option>
          </select>
        </div>
      </div>

      <div className="app-content">
        {/* Time Filter */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div className="time-filter">
            {TIME_FILTERS.map(f => (
              <button
                key={f}
                className={`time-filter-btn ${period === f ? 'active' : ''}`}
                onClick={() => setPeriod(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid animate-fade-in">
          {STAT_CONFIGS.map(stat => (
            <div
              key={stat.key}
              className={`stat-card ${stat.highlighted ? 'highlighted' : ''}`}
              style={{ '--stat-color': stat.color, '--stat-bg': stat.bg }}
            >
              <div>
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value">{stats[stat.key] ?? 0}</div>
              </div>
              <div className="stat-card-icon">
                <stat.icon />
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline Trajectory Graph */}
        <div className="card animate-slide-up" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">📈 Pipeline Trajectory Graph</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px', fontWeight: 600 }}>
                Comparing New Leads, Actioned Follow-Ups, and Conversions
              </p>
            </div>
          </div>
          <div className="card-body" style={{ height: '320px' }}>
            {pipeline.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="empty-state" style={{ height: '100%' }}>
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">No Pipeline Data Yet</div>
                <div className="empty-state-text">Data will appear here as contacts and conversations are tracked.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
