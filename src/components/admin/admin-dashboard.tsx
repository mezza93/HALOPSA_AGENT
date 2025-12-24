'use client';

import { useState } from 'react';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Shield,
  Activity,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data - replace with actual API calls
const stats = [
  {
    name: 'Total Users',
    value: '1,234',
    change: '+12%',
    icon: Users,
  },
  {
    name: 'Chat Sessions',
    value: '45,678',
    change: '+23%',
    icon: MessageSquare,
  },
  {
    name: 'API Usage',
    value: '2.3M tokens',
    change: '+8%',
    icon: TrendingUp,
  },
  {
    name: 'Active Connections',
    value: '892',
    change: '+5%',
    icon: Activity,
  },
];

const recentUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'USER',
    plan: 'PRO',
    lastLogin: '2 hours ago',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'USER',
    plan: 'FREE',
    lastLogin: '1 day ago',
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    plan: 'ENTERPRISE',
    lastLogin: 'Just now',
  },
];

export function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and monitor system usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-turquoise-500" />
          <span className="text-sm font-medium">Admin Access</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="glass-card p-6 space-y-2"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-turquoise-500" />
              <span className="text-sm font-medium text-green-500">
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold">Recent Users</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Last Login
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-600 dark:text-turquoise-400 font-medium">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        user.plan === 'ENTERPRISE'
                          ? 'bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-700 dark:text-turquoise-300'
                          : user.plan === 'PRO'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {user.lastLogin}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity & Audit Log */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'User john@example.com logged in', time: '2 mins ago' },
              { action: 'New connection created by jane@example.com', time: '15 mins ago' },
              { action: 'Admin updated user permissions', time: '1 hour ago' },
              { action: 'User upgraded to Pro plan', time: '2 hours ago' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
              >
                <p className="text-sm">{item.action}</p>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card p-6">
          <h2 className="mb-4 font-semibold">System Health</h2>
          <div className="space-y-4">
            {[
              { name: 'API Response Time', status: 'healthy', value: '45ms' },
              { name: 'Database', status: 'healthy', value: 'Connected' },
              { name: 'AI Service', status: 'healthy', value: 'Operational' },
              { name: 'Storage', status: 'warning', value: '78% used' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      item.status === 'healthy'
                        ? 'bg-green-500'
                        : item.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <p className="text-sm">{item.name}</p>
                </div>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
