import React, { useState } from 'react';

const TechnicianDashboard = () => {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      deviceType: 'Smartphone',
      deviceModel: 'iPhone 13',
      issue: 'Broken Screen',
      customerName: 'John Doe',
      customerPhone: '+1 234-567-8900',
      customerEmail: 'john.doe@email.com',
      address: '123 Main St, Apt 4B, New York, NY 10001',
      preferredTime: '10:00 AM',
      status: 'assigned',
      createdAt: '2024-01-22T09:30:00Z',
    },
    {
      id: 2,
      deviceType: 'Laptop',
      deviceModel: 'MacBook Pro 2021',
      issue: 'Battery Issues',
      customerName: 'Jane Smith',
      customerPhone: '+1 234-567-8901',
      customerEmail: 'jane.smith@email.com',
      address: '456 Oak Ave, San Francisco, CA 94102',
      preferredTime: '2:00 PM',
      status: 'accepted',
      createdAt: '2024-01-22T08:15:00Z',
    },
    {
      id: 3,
      deviceType: 'Smartphone',
      deviceModel: 'Samsung Galaxy S22',
      issue: 'Charging Port',
      customerName: 'Mike Johnson',
      customerPhone: '+1 234-567-8902',
      customerEmail: 'mike.j@email.com',
      address: '789 Pine Rd, Los Angeles, CA 90001',
      preferredTime: '4:00 PM',
      status: 'en_route',
      createdAt: '2024-01-22T07:45:00Z',
    },
    {
      id: 4,
      deviceType: 'Laptop',
      deviceModel: 'Dell XPS 15',
      issue: 'Software Problems',
      customerName: 'Sarah Wilson',
      customerPhone: '+1 234-567-8903',
      customerEmail: 'sarah.w@email.com',
      address: '321 Elm St, Chicago, IL 60601',
      preferredTime: '11:00 AM',
      status: 'in_progress',
      createdAt: '2024-01-22T06:20:00Z',
    },
  ]);

  const statusLabels = {
    assigned: 'Assigned',
    accepted: 'Accepted',
    en_route: 'En Route',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  const statusColors = {
    assigned: 'bg-gray-100 text-gray-700',
    accepted: 'bg-blue-100 text-blue-700',
    en_route: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
  };

  const actionButtons = {
    assigned: [
      { label: 'Accept Job', action: 'accepted', color: 'bg-brand hover:bg-opacity-90' },
    ],
    accepted: [
      { label: 'En Route', action: 'en_route', color: 'bg-yellow-500 hover:bg-yellow-600' },
    ],
    en_route: [
      { label: 'Start Repair', action: 'in_progress', color: 'bg-orange-500 hover:bg-orange-600' },
    ],
    in_progress: [
      { label: 'Complete', action: 'completed', color: 'bg-green-500 hover:bg-green-600' },
    ],
    completed: [],
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      // Simulate API call
      const response = await fetch(`/api/v1/bookings/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        ));
        console.log(`Job ${jobId} status updated to ${newStatus}`);
      } else {
        console.error('Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getDeviceIcon = (deviceType) => {
    return deviceType === 'Smartphone' ? '📱' : '💻';
  };

  const getJobCountByStatus = (status) => {
    return jobs.filter(job => job.status === status).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Technician Dashboard</h1>
        <p className="text-gray-600">Manage your repair jobs efficiently</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="bg-white rounded-lg shadow p-4">
            <div className={`text-2xl font-bold ${statusColors[status].split(' ')[1]}`}>
              {getJobCountByStatus(status)}
            </div>
            <div className="text-sm text-gray-600 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-4 lg:p-6">
              {/* Job Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="flex items-center space-x-3 mb-3 lg:mb-0">
                  <span className="text-2xl">{getDeviceIcon(job.deviceType)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Job #{job.id}</h3>
                    <p className="text-sm text-gray-600">{job.deviceModel}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[job.status]}`}>
                    {statusLabels[job.status]}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatTime(job.preferredTime)}
                  </span>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Issue</div>
                  <div className="text-gray-900">{job.issue}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Customer</div>
                  <div className="text-gray-900">{job.customerName}</div>
                  <div className="text-sm text-gray-600">{job.customerPhone}</div>
                </div>
                <div className="lg:col-span-1">
                  <div className="text-sm font-medium text-gray-700 mb-1">Address</div>
                  <div className="text-gray-900 text-sm">{job.address}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {actionButtons[job.status].map((button) => (
                  <button
                    key={button.action}
                    onClick={() => updateJobStatus(job.id, button.action)}
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${button.color}`}
                  >
                    {button.label}
                  </button>
                ))}
                <button
                  onClick={() => console.log('View details for job', job.id)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs assigned</h3>
          <p className="text-gray-600">New jobs will appear here when assigned to you.</p>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
