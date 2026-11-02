import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  ExternalLink,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import type {
  JobApplication,
  RoleCategoryType,
  ApplicationStatusType,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '../../types';
import {
  fetchApplications,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
} from '../../services/api';

const ROLE_CATEGORIES: RoleCategoryType[] = ['Python', 'Backend', 'Frontend', 'AI/ML', 'Full Stack', 'Other'];
const STATUSES: ApplicationStatusType[] = ['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];

interface ApplicationTrackerProps {
  onNavigateToAnalytics: () => void;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ onNavigateToAnalytics }) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [companyName, setCompanyName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [roleCategory, setRoleCategory] = useState<RoleCategoryType>('Backend');
  const [status, setStatus] = useState<ApplicationStatusType>('Applied');
  const [jobUrl, setJobUrl] = useState<string>('');
  const [applicationDate, setApplicationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [responseDate, setResponseDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const loadApps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApplications({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
      });
      setApplications(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load applications';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const openAddModal = () => {
    setEditingApp(null);
    setCompanyName('');
    setJobTitle('');
    setRoleCategory('Backend');
    setStatus('Applied');
    setJobUrl('');
    setApplicationDate(new Date().toISOString().split('T')[0]);
    setResponseDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setCompanyName(app.company_name);
    setJobTitle(app.job_title);
    setRoleCategory(app.role_category);
    setStatus(app.status);
    setJobUrl(app.job_description_or_url || '');
    setApplicationDate(app.application_date.split('T')[0]);
    setResponseDate(app.response_date ? app.response_date.split('T')[0] : '');
    setNotes(app.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim()) {
      setError('Company Name and Job Title are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingApp) {
        const updateInput: UpdateApplicationInput = {
          company_name: companyName.trim(),
          job_title: jobTitle.trim(),
          role_category: roleCategory,
          status,
          job_description_or_url: jobUrl.trim() || undefined,
          application_date: applicationDate || undefined,
          response_date: responseDate || undefined,
          notes: notes.trim() || undefined,
        };
        await updateApplication(editingApp.id, updateInput);
      } else {
        const createInput: CreateApplicationInput = {
          company_name: companyName.trim(),
          job_title: jobTitle.trim(),
          role_category: roleCategory,
          status,
          job_description_or_url: jobUrl.trim() || undefined,
          application_date: applicationDate || undefined,
          response_date: responseDate || undefined,
          notes: notes.trim() || undefined,
        };
        await createApplication(createInput);
      }
      setIsModalOpen(false);
      await loadApps();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving application';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (appId: string, newStatus: ApplicationStatusType) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      await loadApps();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      setError(msg);
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await deleteApplication(appId);
      setDeleteConfirmId(null);
      await loadApps();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setError(msg);
    }
  };

  const getStatusBadge = (st: ApplicationStatusType) => {
    switch (st) {
      case 'Offer':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Interview':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Assessment':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Applied':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2.5">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            <span>Job Application Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track your recruitment pipelines, log outreach, and sync your application funnel in SQLite.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateToAnalytics}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Funnel Analytics</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Tracks / Categories</option>
            {ROLE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-xs">Loading application records...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">No applications found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter || categoryFilter
                ? 'No tracked applications match your current filters.'
                : 'Start tracking your job search by logging your first application.'}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Application</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Company &amp; Title</th>
                  <th className="p-4">Track</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4">Response Date</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm flex items-center space-x-1.5">
                        <span>{app.company_name}</span>
                        {app.job_description_or_url && (
                          <a
                            href={
                              app.job_description_or_url.startsWith('http')
                                ? app.job_description_or_url
                                : undefined
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300"
                            title={app.job_description_or_url}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">{app.job_title}</div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {app.role_category}
                      </span>
                    </td>

                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleQuickStatusChange(app.id, e.target.value as ApplicationStatusType)
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st} className="bg-slate-900 text-white">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-4 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(app.application_date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-300 whitespace-nowrap">
                      {app.response_date ? (
                        <div className="flex items-center space-x-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{new Date(app.response_date).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Pending</span>
                      )}
                    </td>

                    <td className="p-4 max-w-xs truncate text-slate-400" title={app.notes || ''}>
                      {app.notes || <span className="text-slate-600">—</span>}
                    </td>

                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(app)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Edit application"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === app.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleDelete(app.id)}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-500 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(app.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                            title="Delete application"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>{editingApp ? 'Edit Job Application' : 'Log New Application'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Stripe, Vercel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Role Track / Category</label>
                  <select
                    value={roleCategory}
                    onChange={(e) => setRoleCategory(e.target.value as RoleCategoryType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {ROLE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Pipeline Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ApplicationStatusType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Application Date</label>
                  <input
                    type="date"
                    value={applicationDate}
                    onChange={(e) => setApplicationDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Response Date (Optional)</label>
                  <input
                    type="date"
                    value={responseDate}
                    onChange={(e) => setResponseDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Job URL or Posting Info</label>
                <input
                  type="text"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/role or job ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Notes &amp; Contacts</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Recruiter names, referral details, interview rounds, salary expectations..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingApp ? 'Update Application' : 'Save Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};