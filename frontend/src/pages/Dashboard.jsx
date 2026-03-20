import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import StatusBadge from '../components/StatusBadge';
import api from '../utils/api';
import { extractErrorMessage, unwrapData } from '../utils/apiResponse';

function buildTrendFromRequests(requests) {
  const monthMap = {};
  requests.forEach((request) => {
    const source = request.requestedAt || request.startDate;
    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    const monthIndex = parsed.getMonth();
    const key = String(monthIndex);
    if (!monthMap[key]) {
      monthMap[key] = {
        monthIndex,
        month: parsed.toLocaleString('en-US', { month: 'short' }),
        requests: 0,
        approved: 0,
        rejected: 0,
      };
    }

    monthMap[key].requests += 1;
    if (String(request.status).toLowerCase() === 'approved') {
      monthMap[key].approved += 1;
    }
    if (String(request.status).toLowerCase() === 'rejected') {
      monthMap[key].rejected += 1;
    }
  });

  return Object.values(monthMap).sort((a, b) => a.monthIndex - b.monthIndex);
}

function buildLeaveTypeBreakdown(requests) {
  const typeMap = {};
  requests.forEach((request) => {
    const leaveType = request.leaveTypeName || 'Other';
    typeMap[leaveType] = (typeMap[leaveType] || 0) + 1;
  });

  return Object.entries(typeMap)
    .map(([name, requestsCount]) => ({ name, requests: requestsCount }))
    .sort((a, b) => b.requests - a.requests);
}

function buildDepartmentSummary(requests, users, departmentMap) {
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  const summaryMap = {};

  requests.forEach((request) => {
    const user = userMap[request.userId];
    const departmentName = departmentMap[user?.departmentId] || 'Unassigned';
    if (!summaryMap[departmentName]) {
      summaryMap[departmentName] = {
        department: departmentName,
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
      };
    }

    summaryMap[departmentName].totalRequests += 1;
    if (String(request.status).toLowerCase() === 'pending') {
      summaryMap[departmentName].pendingRequests += 1;
    }
    if (String(request.status).toLowerCase() === 'approved') {
      summaryMap[departmentName].approvedRequests += 1;
    }
  });

  return Object.values(summaryMap).sort((a, b) => b.totalRequests - a.totalRequests);
}

function toDisplayDate(rawDate) {
  if (!rawDate) {
    return '-';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }
  return parsed.toLocaleDateString();
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const [dashboardResponse, requestsResponse, departmentsResponse, usersResponse] = await Promise.all([
          api.get('/dashboard', {
            params: { year: currentYear },
          }),
          api.get('/leave-requests'),
          api.get('/departments'),
          api.get('/users'),
        ]);

        setStats(unwrapData(dashboardResponse) || null);
        setRequests(unwrapData(requestsResponse) || []);
        setDepartments(unwrapData(departmentsResponse) || []);
        setUsers(unwrapData(usersResponse) || []);
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Failed to load dashboard'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summaryCards = useMemo(
    () => [
      { label: 'Total Requests', value: stats?.totalRequests ?? 0 },
      { label: 'Pending Requests', value: stats?.pendingRequests ?? 0 },
      { label: 'Approved Requests', value: stats?.approvedRequests ?? 0 },
      { label: 'Rejected Requests', value: stats?.rejectedRequests ?? 0 },
    ],
    [stats]
  );

  const departmentMap = useMemo(
    () =>
      departments.reduce((acc, department) => {
        acc[department.id] = department.name;
        return acc;
      }, {}),
    [departments]
  );

  const trendData = useMemo(() => {
    if (stats?.trendData?.length) {
      return stats.trendData;
    }
    return buildTrendFromRequests(requests);
  }, [stats, requests]);

  const topLeaveTypes = useMemo(() => {
    if (stats?.topLeaveTypes?.length) {
      return stats.topLeaveTypes;
    }
    return buildLeaveTypeBreakdown(requests);
  }, [stats, requests]);

  const departmentSummary = useMemo(
    () => buildDepartmentSummary(requests, users, departmentMap),
    [requests, users, departmentMap]
  );

  const recentRequests = useMemo(
    () =>
      [...requests]
        .sort((a, b) => new Date(b.requestedAt || b.startDate) - new Date(a.requestedAt || a.startDate))
        .slice(0, 6),
    [requests]
  );

  if (loading) {
    return <section className="grid min-h-[40vh] place-items-center text-text-muted">Loading dashboard...</section>;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Track requests, balances, and team activity.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="app-card p-4">
            <p className="text-sm text-text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="app-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Requests by Leave Type</h2>
          {topLeaveTypes.length > 0 ? (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topLeaveTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis allowDecimals={false} stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">No leave type stats available.</p>
          )}
        </div>

        <div className="app-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Monthly Leave Trends</h2>
          {trendData.length > 0 ? (
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis allowDecimals={false} stroke="#9ca3af" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="requests" stroke="#4ade80" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="approved" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="rejected" stroke="#f87171" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">No trend data available yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="app-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Department Leave Summary</h2>
          {departmentSummary.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-dark-card2 text-left text-text-muted">
                  <tr>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Total Requests</th>
                    <th className="px-3 py-2">Pending</th>
                    <th className="px-3 py-2">Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentSummary.map((department) => (
                    <tr key={department.department} className="border-t border-dark-border">
                      <td className="px-3 py-2 text-text-primary">{department.department}</td>
                      <td className="px-3 py-2 text-text-secondary">{department.totalRequests}</td>
                      <td className="px-3 py-2 text-text-secondary">{department.pendingRequests}</td>
                      <td className="px-3 py-2 text-text-secondary">{department.approvedRequests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">No department summary available.</p>
          )}
        </div>

        <div className="app-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Recent Leave Requests</h2>
          {recentRequests.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-xl border border-dark-border bg-dark-card2 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-text-primary">{request.employeeName || 'Employee'}</h3>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{request.leaveTypeName || '-'} • {toDisplayDate(request.startDate)} - {toDisplayDate(request.endDate)}</p>
                  <p className="mt-1 text-xs text-text-muted">Requested on {toDisplayDate(request.requestedAt)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">No recent requests available.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
