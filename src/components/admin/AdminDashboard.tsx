import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Wallet, 
  Activity, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpRight,
  UserPlus,
  MapPin,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Cluster, Payment, UserRole } from '../../types';

const mockUsers: User[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'alex@example.com', role: 'INVESTOR', joinedDate: '2024-01-15', location: 'New York, USA' },
  { id: 'u2', name: 'Sarah Miller', email: 'sarah@example.com', role: 'FARMER', joinedDate: '2024-02-10', location: 'Zaria, Nigeria' },
  { id: 'u3', name: 'John Doe', email: 'john@example.com', role: 'CLUSTER_REP', joinedDate: '2024-03-05', location: 'Nairobi, Kenya' },
  { id: 'u4', name: 'Admin User', email: 'admin@agriinvest.com', role: 'ADMIN', joinedDate: '2023-12-01', location: 'Remote' },
];

const mockPendingClusters: Cluster[] = [
  { id: 'cl1', name: 'Green Valley Cooperative', location: 'Kaduna', region: 'North', memberCount: 45, isVerified: false, size: 120, establishedDate: '2023-11-20' },
  { id: 'cl2', name: 'Sunshine Farmers', location: 'Ibadan', region: 'South', memberCount: 32, isVerified: false, size: 85, establishedDate: '2024-01-12' },
];

const mockPendingPayments: Payment[] = [
  { id: 'p1', agreementId: 'a1', agreementTitle: 'Maize Production 2024', amount: 5000, type: 'REPAYMENT', status: 'SUBMITTED', date: '2024-03-20', senderName: 'Sarah Miller', receiverName: 'Alex Johnson' },
  { id: 'p2', agreementId: 'a2', agreementTitle: 'Soybean Expansion', amount: 12000, type: 'DISBURSEMENT', status: 'SUBMITTED', date: '2024-03-22', senderName: 'Alex Johnson', receiverName: 'John Doe' },
];

export const AdminDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'USERS' | 'CLUSTERS' | 'PAYMENTS'>('USERS');

  const stats = [
    { title: 'Total Users', value: '1,284', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Clusters', value: '156', change: '+8%', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Volume', value: '$2.4M', change: '+15%', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'System Health', value: '99.9%', change: 'Stable', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Control Center</h1>
          <p className="text-gray-500 mt-1">Manage users, verify entities, and monitor system performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            <span>Invite User</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none">
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: User Management */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all registered users in the system.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-medium">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.location}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.joinedDate}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Verification Queues */}
        <div className="space-y-6">
          {/* Cluster Verification Queue */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Cluster Verification</CardTitle>
                <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-none">
                  {mockPendingClusters.length} Pending
                </Badge>
              </div>
              <CardDescription>New cooperatives awaiting verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPendingClusters.map((cluster) => (
                <div key={cluster.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{cluster.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {cluster.location}, {cluster.region}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50">
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:bg-rose-50">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <span>{cluster.memberCount} Members</span>
                    <span>{cluster.size} Hectares</span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs text-primary font-bold">
                View All Clusters
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Payment Verification Queue */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Payment Verification</CardTitle>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none">
                  {mockPendingPayments.length} Pending
                </Badge>
              </div>
              <CardDescription>Recent transactions requiring review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPendingPayments.map((payment) => (
                <div key={payment.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">${payment.amount.toLocaleString()}</span>
                        <Badge className={payment.type === 'DISBURSEMENT' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}>
                          {payment.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{payment.agreementTitle}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      Review
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {payment.date}
                    </span>
                    <span>By {payment.senderName}</span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs text-primary font-bold">
                View All Payments
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
