import React, { useState, useEffect } from 'react';
import { userService, type UserFilters } from '../../services/userService';
import type { User } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'STUDENT' | 'ADMIN'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Add the missing badge functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      blocked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Blocked' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
      STUDENT: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Student' },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.STUDENT;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'blocked' | 'pending') => {
    try {
      setLoading(true);
      await userService.updateUserStatus(userId, newStatus);
      
      // Update the user in the local state immediately
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: newStatus }
            : user
        )
      );
      
      // Optionally refresh the entire list
      // await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters: UserFilters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        page: currentPage,
        limit: 10
      };
  
      const response = await userService.getUsers(filters);
      
      if (response.success) {
        const transformedUsers = response.data.map(user => ({
          ...user,
          id: user.user_id,
          name: `${user.first_name} ${user.last_name}`,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          // Status is now properly set by userService.getUsers()
        }));
        
        setUsers(transformedUsers);
        setTotalPages(response.pagination.totalPages);
        setTotalUsers(response.pagination.total);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter, roleFilter, currentPage]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(userId);
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // Remove handleCreateUser function entirely
  // const handleCreateUser = async (e: React.FormEvent) => { ... }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - Remove Add New User button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts and permissions ({totalUsers} total)
          </p>
        </div>
        {/* Remove the Add New User button */}
      </div>

      {/* Filters */}
      <Card variant="default" padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="input"
          >
            <option value="all">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setRoleFilter('all');
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 animate-scale-in">
          {error}
        </div>
      )}

      {/* Users Table */}
      <Card variant="default">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">User</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Email</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Role</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Joined</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Last Login</th>
                <th className="text-right py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors animate-slide-in-right delay-${index}`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="py-4 px-6">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {user.lastLogin ? (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <ShieldCheckIcon className="w-4 h-4" />
                        <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Status Actions */}
                      {user.status !== 'active' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(user.id, 'active')}
                        >
                          Activate
                        </Button>
                      )}
                      {user.status !== 'blocked' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleStatusChange(user.id, 'blocked')}
                        >
                          Block
                        </Button>
                      )}
                      
                      {/* Edit and Delete Actions */}
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Loading State for Pagination */}
      {loading && users.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card variant="default" padding="lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State - Remove Add New User button */}
      {!loading && users.length === 0 && (
        <Card variant="default" padding="xl">
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No users found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No users available to display.'}
            </p>
            {/* Remove the Add New User button */}
          </div>
        </Card>
      )}

      {/* Remove the entire Add User Modal */}
      {/* {showAddUserModal && ( ... )} */}
    </div>
  );
};

export default Users;

