import React, { useState, useEffect } from 'react';
import { userService, type UserFilters, type CreateUserData } from '../../services/userService';
import type { User } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  MagnifyingGlassIcon, 
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PlusIcon,
  XMarkIcon,
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
  
  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');
  const [newUserData, setNewUserData] = useState<CreateUserData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STUDENT'
  });

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
        const transformedUsers = response.data
          .filter(user => user.role !== 'ADMIN') // Hide admin users
          .map(user => ({
            ...user,
            id: user.user_id,
            name: `${user.first_name} ${user.last_name}`,
            createdAt: user.created_at,
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

  // Add User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError('');
    setAddUserSuccess('');

    try {
      const response = await userService.createUser(newUserData);
      
      if (response.success) {
        setAddUserSuccess('User created successfully! Login credentials have been sent to their email.');
        setNewUserData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'STUDENT'
        });
        
        // Refresh users list
        await fetchUsers();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowAddUserModal(false);
          setAddUserSuccess('');
        }, 2000);
      } else {
        setAddUserError(response.message || 'Failed to create user');
      }
    } catch (err: any) {
      setAddUserError(err.response?.data?.error?.message || err.message || 'An error occurred while creating the user');
    } finally {
      setAddUserLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - Add back the Add New User button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts and permissions ({totalUsers} total)
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add New User</span>
        </Button>
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
                      
                      {/* Delete Action */}
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

      {/* Empty State - Add back the Add New User button */}
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
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New User
              </h2>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setAddUserError('');
                  setAddUserSuccess('');
                  setNewUserData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    role: 'STUDENT'
                  });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {addUserError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {addUserError}
              </div>
            )}

            {addUserSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {addUserSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                  className="input w-full"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                  className="input w-full"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="input w-full"
                  placeholder="Enter email address"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserError('');
                    setAddUserSuccess('');
                    setNewUserData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      role: 'STUDENT'
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={addUserLoading}
                  className="flex-1"
                >
                  {addUserLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> A temporary password will be generated and sent to the user's email address along with login instructions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

