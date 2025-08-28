// src/pages/projects/ProjectsPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { format, differenceInDays, parseISO } from 'date-fns';

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (user) {
      loadProjects();
      loadCustomers();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const projectData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectData);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const q = query(collection(db, 'customers'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const customerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(customerData);
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const project = {
        ...projectData,
        userId: user.uid,
        projectNumber: await generateProjectNumber(),
        status: 'planning',
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: 0,
        actualHours: 0,
        actualCost: 0
      };

      await addDoc(collection(db, 'projects'), project);
      toast.success('Project created successfully');
      setShowCreateForm(false);
      loadProjects();
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const generateProjectNumber = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const count = projects.length + 1;
    return `PRJ-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleStatusUpdate = async (projectId, newStatus) => {
    try {
      const updates = {
        status: newStatus,
        updatedAt: new Date()
      };

      if (newStatus === 'completed') {
        updates.completedAt = new Date();
        updates.progress = 100;
      }

      await updateDoc(doc(db, 'projects', projectId), updates);
      toast.success('Project status updated');
      loadProjects();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleProgressUpdate = async (projectId, progress) => {
    try {
      const updates = {
        progress: Math.max(0, Math.min(100, progress)),
        updatedAt: new Date()
      };

      if (progress >= 100) {
        updates.status = 'completed';
        updates.completedAt = new Date();
      }

      await updateDoc(doc(db, 'projects', projectId), updates);
      toast.success('Progress updated');
      loadProjects();
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const filteredProjects = projects
    .filter(project => {
      if (filterStatus !== 'all' && project.status !== filterStatus) return false;
      if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !project.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = {
    total: projects.length,
    planning: projects.filter(p => p.status === 'planning').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalValue: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    totalRevenue: projects.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.budget || 0), 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Project Management
          </h1>
          <p className="text-gray-600 mt-1">Track project progress, budgets, and deliverables</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary btn-modern flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="card-modern p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-700">{stats.total}</div>
              <div className="text-sm text-indigo-600 font-medium">Total Projects</div>
            </div>
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{stats.planning}</div>
              <div className="text-sm text-blue-600 font-medium">Planning</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">{stats.inProgress}</div>
              <div className="text-sm text-yellow-600 font-medium">In Progress</div>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
              <div className="text-sm text-green-600 font-medium">Completed</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-700">
                ₹{stats.totalValue.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-purple-600 font-medium">Total Budget</div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-emerald-600 font-medium">Revenue</div>
            </div>
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card-modern p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No projects match your filters' : 'No projects yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first project to start tracking progress and deliverables'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
              Create First Project
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onStatusUpdate={handleStatusUpdate}
              onProgressUpdate={handleProgressUpdate}
              onView={setSelectedProject}
            />
          ))}
        </div>
      ) : (
        <ProjectsTable 
          projects={filteredProjects}
          onStatusUpdate={handleStatusUpdate}
          onView={setSelectedProject}
        />
      )}

      {/* Create Project Modal */}
      {showCreateForm && (
        <CreateProjectModal 
          customers={customers}
          onSubmit={handleCreateProject} 
          onCancel={() => setShowCreateForm(false)} 
        />
      )}

      {/* View Project Modal */}
      {selectedProject && (
        <ViewProjectModal 
          project={selectedProject}
          onStatusUpdate={handleStatusUpdate}
          onProgressUpdate={handleProgressUpdate}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, onStatusUpdate, onProgressUpdate, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = () => {
    if (!project.endDate) return null;
    const today = new Date();
    const endDate = new Date(project.endDate);
    const days = differenceInDays(endDate, today);
    return days;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="card-modern p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
          <p className="text-sm text-gray-600">{project.customerName}</p>
          <p className="text-xs text-gray-500 mt-1">{project.projectNumber}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              project.progress >= 100 ? 'bg-green-500' : 
              project.progress >= 75 ? 'bg-blue-500' : 
              project.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${project.progress || 0}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Budget</span>
          <span className="font-medium">₹{(project.budget || 0).toLocaleString('en-IN')}</span>
        </div>
        {daysRemaining !== null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Days Remaining</span>
            <span className={`font-medium ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-yellow-600' : 'text-gray-900'}`}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} overdue` : daysRemaining}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Started</span>
          <span className="text-xs">
            {format(project.createdAt?.toDate ? project.createdAt.toDate() : new Date(project.createdAt), 'MMM dd, yyyy')}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onView(project)}
          className="btn btn-outline btn-sm flex-1 text-xs"
        >
          View Details
        </button>
        {project.status === 'planning' && (
          <button
            onClick={() => onStatusUpdate(project.id, 'in_progress')}
            className="btn btn-outline btn-sm text-blue-600 hover:bg-blue-50 text-xs"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
};

// Projects Table Component
const ProjectsTable = ({ projects, onStatusUpdate, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card-modern overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Customer</th>
              <th>Progress</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id}>
                <td>
                  <div className="font-medium text-gray-900">{project.name}</div>
                  <div className="text-sm text-gray-500">{project.projectNumber}</div>
                </td>
                <td>{project.customerName}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div 
                        className={`h-2 rounded-full ${
                          project.progress >= 100 ? 'bg-green-500' : 
                          project.progress >= 75 ? 'bg-blue-500' : 
                          project.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{project.progress || 0}%</span>
                  </div>
                </td>
                <td className="font-medium">₹{(project.budget || 0).toLocaleString('en-IN')}</td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'N/A'}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(project)}
                      className="btn btn-outline btn-xs"
                    >
                      View
                    </button>
                    {project.status === 'planning' && (
                      <button
                        onClick={() => onStatusUpdate(project.id, 'in_progress')}
                        className="btn btn-outline btn-xs text-blue-600 hover:bg-blue-50"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Create Project Modal
const CreateProjectModal = ({ customers, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerId: '',
    customerName: '',
    budget: '',
    estimatedHours: '',
    startDate: '',
    endDate: '',
    priority: 'medium'
  });

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      budget: parseFloat(formData.budget) || 0,
      estimatedHours: parseInt(formData.estimatedHours) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-textarea"
                  placeholder="Project description and objectives"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Budget (₹)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="form-input"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Hours</label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
                    className="form-input"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="form-input"
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!formData.name || !formData.customerId}>
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Project Modal
const ViewProjectModal = ({ project, onStatusUpdate, onProgressUpdate, onClose }) => {
  const [newProgress, setNewProgress] = useState(project.progress || 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProgressSubmit = () => {
    onProgressUpdate(project.id, newProgress);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-500">{project.projectNumber}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Project Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Customer</h3>
                <div className="text-sm text-gray-600">{project.customerName}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Priority</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  project.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {project.priority}
                </span>
              </div>
            </div>

            {project.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                <div className="text-sm text-gray-600 whitespace-pre-wrap">{project.description}</div>
              </div>
            )}

            {/* Progress Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Progress</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        project.progress >= 100 ? 'bg-green-500' : 
                        project.progress >= 75 ? 'bg-blue-500' : 
                        project.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium">{project.progress || 0}%</span>
              </div>
              
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={newProgress}
                  onChange={(e) => setNewProgress(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="form-input w-20"
                  min="0"
                  max="100"
                />
                <button
                  onClick={handleProgressSubmit}
                  className="btn btn-outline btn-sm"
                  disabled={newProgress === project.progress}
                >
                  Update Progress
                </button>
              </div>
            </div>

            {/* Project Metrics */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Budget</h3>
                <div className="text-lg font-semibold text-gray-900">₹{(project.budget || 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Estimated Hours</h3>
                <div className="text-lg font-semibold text-gray-900">{project.estimatedHours || 0}h</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Actual Hours</h3>
                <div className="text-lg font-semibold text-gray-900">{project.actualHours || 0}h</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Created</h3>
                <div className="text-sm text-gray-600">
                  {format(project.createdAt?.toDate ? project.createdAt.toDate() : new Date(project.createdAt), 'MMM dd, yyyy')}
                </div>
              </div>
              {project.startDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Start Date</h3>
                  <div className="text-sm text-gray-600">
                    {format(new Date(project.startDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              )}
              {project.endDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">End Date</h3>
                  <div className="text-sm text-gray-600">
                    {format(new Date(project.endDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <div className="flex gap-3">
              {project.status === 'planning' && (
                <button
                  onClick={() => onStatusUpdate(project.id, 'in_progress')}
                  className="btn btn-outline text-blue-600 hover:bg-blue-50"
                >
                  Start Project
                </button>
              )}
              {project.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(project.id, 'on_hold')}
                    className="btn btn-outline text-red-600 hover:bg-red-50"
                  >
                    Put On Hold
                  </button>
                  <button
                    onClick={() => onStatusUpdate(project.id, 'completed')}
                    className="btn btn-success"
                  >
                    Mark Complete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;