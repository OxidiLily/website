import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Folder,
  FolderArchive,
  Users,
  Clock,
  CheckCircle2,
  Star,
  Globe,
  Workflow,
  Search,
  ChevronRight,
  ChevronsUpDown,
  User,
  LogOut,
  PanelLeft,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Filter,
  CheckSquare,
  MoreVertical,
  ExternalLink,
  Shield,
  Key,
  Bell,
  RefreshCw,
  Check
} from 'lucide-react';
import { PageId } from '../types';

export type DashboardView =
  | 'dashboard'
  | 'tasks'
  | 'roadmap'
  | 'active-projects'
  | 'archived-projects'
  | 'members'
  | 'sprints'
  | 'approvals'
  | 'reviews'
  | 'integrations'
  | 'automations'
  | 'account';

interface DashboardPageProps {
  onNavigate?: (page: PageId) => void;
  onLogout?: () => void;
  user?: { email: string; name: string } | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onLogout, user }) => {
  // Navigation & View states
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false); // default collapsed/closed
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const currentUser = user || {
    name: 'Admin User',
    email: 'admin@shadcnblocks.com',
  };

  const [themeMode] = useState<'dark' | 'light' | 'slate'>('dark');

  // Interactive states for dashboard data
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Implement OAuth 2.0 PKCE authentication flow', status: 'In Progress', priority: 'High', project: 'Kinetic UI', assignee: 'John Doe' },
    { id: '2', title: 'Optimize WebGL particle simulation for mobile GPUs', status: 'In Review', priority: 'Urgent', project: 'Astral 3D', assignee: 'Sarah Chen' },
    { id: '3', title: 'Refactor Tailwind v4 typography and color palette', status: 'Completed', priority: 'Medium', project: 'Design System', assignee: 'Alex Rivera' },
    { id: '4', title: 'Setup automated CI/CD pipeline with GitHub Actions', status: 'To Do', priority: 'Medium', project: 'Strata Banking', assignee: 'Michael Scott' },
    { id: '5', title: 'Add dark mode contrast accessibility tests', status: 'In Progress', priority: 'Low', project: 'Shadcnblocks', assignee: 'John Doe' },
  ]);

  const [approvals, setApprovals] = useState([
    { id: 'app-1', title: 'Design System 2.0 Token Migration', author: 'Alex Rivera', role: 'Lead Designer', date: 'Today at 14:20', status: 'pending' },
    { id: 'app-2', title: 'Production Gemini API Rate Limiter Setup', author: 'Sarah Chen', role: 'Staff Engineer', date: 'Yesterday', status: 'pending' },
    { id: 'app-3', title: 'Q3 Product Roadmap & Sprint Budgets', author: 'Marcus Vance', role: 'VP of Product', date: '2 days ago', status: 'approved' },
  ]);

  const [integrations, setIntegrations] = useState([
    { id: 'github', name: 'GitHub', desc: 'Continuous deployment & pull request status tracking', connected: true, icon: '🐙' },
    { id: 'figma', name: 'Figma', desc: 'Sync design tokens, typography scales, and component assets', connected: true, icon: '🎨' },
    { id: 'vercel', name: 'Vercel', desc: 'Instant preview deployments and edge function routing', connected: true, icon: '▲' },
    { id: 'linear', name: 'Linear', desc: 'Two-way task issue synchronization and sprint boards', connected: true, icon: '⚡' },
    { id: 'gemini', name: 'Google Gemini 2.5', desc: 'AI code assistant, smart task categorization, and analytics', connected: true, icon: '✨' },
    { id: 'slack', name: 'Slack', desc: 'Real-time team notification alerts and sprint digests', connected: false, icon: '💬' },
  ]);

  const handleApprove = (id: string, newStatus: 'approved' | 'rejected') => {
    setApprovals(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(item => item.id === id ? { ...item, connected: !item.connected } : item));
  };

  // Breadcrumb generation based on active view
  const breadcrumb = useMemo(() => {
    switch (activeView) {
      case 'dashboard':
        return { category: 'Overview', page: 'Dashboard' };
      case 'tasks':
        return { category: 'Overview', page: 'Tasks' };
      case 'roadmap':
        return { category: 'Overview', page: 'Roadmap' };
      case 'active-projects':
        return { category: 'Projects', page: 'Active Projects' };
      case 'archived-projects':
        return { category: 'Projects', page: 'Archived' };
      case 'members':
        return { category: 'Team', page: 'Members' };
      case 'sprints':
        return { category: 'Team', page: 'Sprints' };
      case 'approvals':
        return { category: 'Team', page: 'Approvals' };
      case 'reviews':
        return { category: 'Team', page: 'Reviews' };
      case 'integrations':
        return { category: 'Workspace', page: 'Integrations' };
      case 'automations':
        return { category: 'Workspace', page: 'Automations' };
      case 'account':
        return { category: 'User', page: 'Account Settings' };
      default:
        return { category: 'Overview', page: 'Dashboard' };
    }
  }, [activeView]);

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-neutral-100 font-sans flex flex-col">
      {/* ========================================================================= */}
      {/* MAIN CONTAINER LAYOUT (Sidebar + Main Workspace Area) */}
      {/* ========================================================================= */}
      <div className="w-full flex-1 flex flex-col md:flex-row bg-[#09090b] overflow-hidden min-h-screen">
        
        {/* ===================================================================== */}
        {/* SIDEBAR COMPONENT (@shadcnblocks/sidebar6) */}
        {/* ===================================================================== */}
        <motion.aside
          initial={false}
          animate={{
            width: isSidebarOpen ? '260px' : '0px',
            opacity: isSidebarOpen ? 1 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`shrink-0 bg-[#09090b] text-neutral-200 border-r border-neutral-800/80 flex flex-col justify-between overflow-y-auto overflow-x-hidden ${
            isSidebarOpen ? 'w-full md:w-[260px]' : 'hidden md:flex w-0'
          }`}
        >
            {/* Top Section of Sidebar */}
            <div className="p-3.5 flex flex-col gap-4">
              
              {/* 1. Header / Brand Title */}
              <div className="flex items-center gap-3 px-1 py-1">
                {/* Cube / Polygon Logo matching screenshot */}
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700/80 flex items-center justify-center shadow-sm">
                  <div className="w-4 h-4 bg-white rounded-xs transform rotate-45 flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-xs" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight text-white leading-tight">Shadcnblocks</span>
                  <span className="text-[11px] text-neutral-500 font-normal leading-tight">Build your app</span>
                </div>
              </div>

              {/* 2. Search Box with Search Icon */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-[#121215] border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-colors"
                />
              </div>

              {/* Navigation Menu Groups */}
              <div className="flex flex-col gap-5 pt-1">
                
                {/* GROUP 1: OVERVIEW */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-neutral-500 px-2 tracking-wider">Overview</span>
                  
                  {/* Dashboard */}
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'dashboard'
                        ? 'bg-neutral-800/90 text-white font-semibold shadow-xs'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0 text-neutral-300" />
                    <span className="flex-1">Dashboard</span>
                  </button>

                  {/* Tasks */}
                  <button
                    onClick={() => setActiveView('tasks')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'tasks'
                        ? 'bg-neutral-800/90 text-white font-semibold shadow-xs'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="flex-1">Tasks</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-400 font-mono">
                      {tasks.length}
                    </span>
                  </button>

                  {/* Roadmap */}
                  <button
                    onClick={() => setActiveView('roadmap')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'roadmap'
                        ? 'bg-neutral-800/90 text-white font-semibold shadow-xs'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="flex-1">Roadmap</span>
                  </button>
                </div>

                {/* GROUP 2: PROJECTS */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-neutral-500 px-2 tracking-wider">Projects</span>
                  
                  {/* Active Projects Dropdown */}
                  <div>
                    <button
                      onClick={() => {
                        setActiveView('active-projects');
                        setProjectsExpanded(!projectsExpanded);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                        activeView === 'active-projects'
                          ? 'bg-neutral-800/90 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder className="w-4 h-4 shrink-0 text-neutral-400" />
                        <span>Active Projects</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${projectsExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Sub-projects list */}
                    {projectsExpanded && (
                      <div className="pl-8 pr-1 py-1 flex flex-col gap-0.5 border-l border-neutral-800 ml-4 mt-0.5">
                        <button onClick={() => setActiveView('active-projects')} className="text-left text-[11px] py-1 text-neutral-400 hover:text-white transition-colors">
                          • Kinetic UI System
                        </button>
                        <button onClick={() => setActiveView('active-projects')} className="text-left text-[11px] py-1 text-neutral-400 hover:text-white transition-colors">
                          • Astral 3D Physics
                        </button>
                        <button onClick={() => setActiveView('active-projects')} className="text-left text-[11px] py-1 text-neutral-400 hover:text-white transition-colors">
                          • Strata Treasury MVP
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Archived Dropdown */}
                  <div>
                    <button
                      onClick={() => {
                        setActiveView('archived-projects');
                        setArchivedExpanded(!archivedExpanded);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                        activeView === 'archived-projects'
                          ? 'bg-neutral-800/90 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderArchive className="w-4 h-4 shrink-0 text-neutral-400" />
                        <span>Archived</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${archivedExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {archivedExpanded && (
                      <div className="pl-8 pr-1 py-1 flex flex-col gap-0.5 border-l border-neutral-800 ml-4 mt-0.5">
                        <button onClick={() => setActiveView('archived-projects')} className="text-left text-[11px] py-1 text-neutral-500 hover:text-neutral-300 transition-colors">
                          • Legacy Landing v1
                        </button>
                        <button onClick={() => setActiveView('archived-projects')} className="text-left text-[11px] py-1 text-neutral-500 hover:text-neutral-300 transition-colors">
                          • Q3 Campaign Assets
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* GROUP 3: TEAM */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-neutral-500 px-2 tracking-wider">Team</span>
                  
                  {/* Members */}
                  <button
                    onClick={() => setActiveView('members')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'members'
                        ? 'bg-neutral-800/90 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="flex-1">Members</span>
                  </button>

                  {/* Sprints */}
                  <button
                    onClick={() => setActiveView('sprints')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'sprints'
                        ? 'bg-neutral-800/90 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <Clock className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="flex-1">Sprints</span>
                  </button>

                  {/* Approvals */}
                  <button
                    onClick={() => setActiveView('approvals')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'approvals'
                        ? 'bg-neutral-800/90 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="flex-1">Approvals</span>
                    {approvals.filter(a => a.status === 'pending').length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </button>

                  {/* Reviews */}
                  <button
                    onClick={() => setActiveView('reviews')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'reviews'
                        ? 'bg-neutral-800/90 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <Star className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="flex-1">Reviews</span>
                  </button>
                </div>

                {/* GROUP 4: WORKSPACE */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-neutral-500 px-2 tracking-wider">Workspace</span>
                  
                  {/* Integrations */}
                  <button
                    onClick={() => setActiveView('integrations')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'integrations'
                        ? 'bg-neutral-800/90 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <Globe className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="flex-1">Integrations</span>
                  </button>

                  {/* Automations */}
                  <button
                    onClick={() => setActiveView('automations')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      activeView === 'automations'
                        ? 'bg-neutral-800/90 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <Workflow className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="flex-1">Automations</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Bottom Section: User Profile Card & Trigger matching screenshot */}
            <div className="p-3 border-t border-neutral-800/80 bg-[#09090b] flex flex-col gap-2">
              
              {/* Profile Card Overlay (Shown matching the screenshot) */}
              {isAccountMenuOpen && (
                <div className="p-2 rounded-xl bg-neutral-900/95 border border-neutral-800 shadow-xl flex flex-col gap-1 text-xs">
                  {/* Avatar & User Details */}
                  <div className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white text-xs">{currentUser.name}</span>
                      <span className="text-[10px] text-neutral-400">{currentUser.email}</span>
                    </div>
                  </div>

                  <div className="h-px bg-neutral-800 my-0.5" />

                  {/* Account Action */}
                  <button
                    onClick={() => {
                      setActiveView('account');
                      setIsAccountMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Account</span>
                  </button>

                  {/* Log Out Action */}
                  <button
                    onClick={() => {
                      if (onLogout) {
                        onLogout();
                      } else if (onNavigate) {
                        onNavigate('home');
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-red-500/10 text-neutral-300 hover:text-red-400 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Log out</span>
                  </button>
                </div>
              )}

              {/* Bottom Trigger Button with ChevronsUpDown */}
              <button
                onClick={() => setIsAccountMenuOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-900 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white leading-tight">{currentUser.name}</span>
                    <span className="text-[10px] text-neutral-400 leading-tight">{currentUser.email}</span>
                  </div>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          </motion.aside>

          {/* ===================================================================== */}
          {/* MAIN CONTENT WORKSPACE AREA */}
          {/* ===================================================================== */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#09090b] overflow-hidden">
            
            {/* Top Workspace Bar: Sidebar Toggle & Breadcrumb navigation */}
            <div className="w-full border-b border-neutral-800/80 px-4 py-3 flex items-center justify-between bg-[#0c0c0e]">
              <div className="flex items-center gap-3">
                {/* Sidebar Toggle Button */}
                <button
                  onClick={() => setIsSidebarOpen(prev => !prev)}
                  title="Toggle Sidebar"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="text-neutral-400">{breadcrumb.category}</span>
                  <span className="text-neutral-600">›</span>
                  <span className="text-white font-semibold">{breadcrumb.page}</span>
                </div>
              </div>

              {/* Quick Actions on Right Side of Breadcrumb Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate && onNavigate('home')}
                  title="Return to Public Live Website"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Live Website</span>
                </button>
                <button
                  onClick={() => setActiveView('tasks')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Task</span>
                </button>
                <button
                  onClick={() => setActiveView('active-projects')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
                >
                  <span>New Project</span>
                </button>
              </div>
            </div>

            {/* Inner Dashboard Canvas Area (Dynamic Light / Dark / Slate according to theme mode) */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-colors ${
              themeMode === 'light'
                ? 'bg-neutral-50 text-neutral-900'
                : themeMode === 'slate'
                ? 'bg-slate-900 text-slate-100'
                : 'bg-[#0e0e11] text-neutral-100'
            }`}>
              <AnimatePresence mode="wait">
                
                {/* 1. OVERVIEW: DASHBOARD VIEW */}
                {activeView === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 max-w-6xl mx-auto"
                  >
                    {/* Welcome Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Welcome back, John 👋</h1>
                        <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                          Here is what is happening with your projects, team velocity, and active deployments today.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Sprint 24: On Track
                        </span>
                      </div>
                    </div>

                    {/* KPI Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Metric 1 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        themeMode === 'light'
                          ? 'bg-white border-neutral-200/80 shadow-xs'
                          : 'bg-[#151518] border-neutral-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${themeMode === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>Active Projects</span>
                          <Folder className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-bold">14</span>
                          <span className="text-xs font-semibold text-emerald-500 flex items-center">+2 this week</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full w-[78%]" />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        themeMode === 'light'
                          ? 'bg-white border-neutral-200/80 shadow-xs'
                          : 'bg-[#151518] border-neutral-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${themeMode === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>Task Completion</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-bold">92.4%</span>
                          <span className="text-xs font-semibold text-emerald-500 flex items-center">+4.1%</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-[92%]" />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        themeMode === 'light'
                          ? 'bg-white border-neutral-200/80 shadow-xs'
                          : 'bg-[#151518] border-neutral-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${themeMode === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>Team Velocity</span>
                          <TrendingUp className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-bold">48 pts</span>
                          <span className="text-xs font-semibold text-amber-500 flex items-center">Target: 50 pts</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full w-[86%]" />
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        themeMode === 'light'
                          ? 'bg-white border-neutral-200/80 shadow-xs'
                          : 'bg-[#151518] border-neutral-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${themeMode === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>Active Members</span>
                          <Users className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-bold">8 / 10</span>
                          <span className="text-xs font-semibold text-neutral-400">Online now</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-cyan-500 h-full rounded-full w-[80%]" />
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Active Projects Table & Recent Approvals */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Projects & Task Overview (2 cols) */}
                      <div className={`lg:col-span-2 p-5 rounded-xl border flex flex-col gap-4 ${
                        themeMode === 'light'
                          ? 'bg-white border-neutral-200/80 shadow-xs'
                          : 'bg-[#151518] border-neutral-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-base">In-Flight Sprint Tasks</h3>
                            <p className={`text-xs mt-0.5 ${themeMode === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                              Real-time updates across active design systems & services
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveView('tasks')}
                            className="text-xs font-medium text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
                          >
                            <span>View all</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 mt-1">
                          {tasks.map(t => (
                            <div
                              key={t.id}
                              className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs transition-colors ${
                                themeMode === 'light'
                                  ? 'bg-neutral-50 border-neutral-200/60 hover:bg-neutral-100/70'
                                  : 'bg-[#19191d] border-neutral-800/80 hover:bg-neutral-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  t.status === 'Completed' ? 'bg-emerald-500' : t.status === 'In Review' ? 'bg-amber-500' : 'bg-indigo-500'
                                }`} />
                                <span className="font-medium truncate">{t.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  t.priority === 'Urgent'
                                    ? 'bg-red-500/10 text-red-500'
                                    : t.priority === 'High'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-neutral-500/10 text-neutral-400'
                                }`}>
                                  {t.priority}
                                </span>
                                <span className="text-[11px] text-neutral-400 hidden sm:inline">{t.assignee}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Column: Pending Approvals & Activity */}
                      <div className={`p-5 rounded-xl border flex flex-col gap-4 ${
                        themeMode === 'light'
                          ? 'bg-white border-neutral-200/80 shadow-xs'
                          : 'bg-[#151518] border-neutral-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-base">Pending Approvals</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                            {approvals.filter(a => a.status === 'pending').length} Pending
                          </span>
                        </div>

                        <div className="flex flex-col gap-3">
                          {approvals.map(app => (
                            <div
                              key={app.id}
                              className={`p-3 rounded-lg border flex flex-col gap-2 text-xs ${
                                themeMode === 'light'
                                  ? 'bg-neutral-50 border-neutral-200/60'
                                  : 'bg-[#19191d] border-neutral-800/80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-xs leading-snug">{app.title}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-medium shrink-0 ${
                                  app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                <span>{app.author} • {app.role}</span>
                                <span>{app.date}</span>
                              </div>
                              {app.status === 'pending' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleApprove(app.id, 'approved')}
                                    className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApprove(app.id, 'rejected')}
                                    className="flex-1 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors"
                                  >
                                    Review
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 2. TASKS KANBAN / LIST VIEW */}
                {activeView === 'tasks' && (
                  <motion.div
                    key="tasks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 max-w-6xl mx-auto"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Project Tasks & Backlog</h1>
                        <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                          Manage sprint deliverables, user stories, and bug triages.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-medium hover:bg-neutral-800 transition-colors flex items-center gap-1.5">
                          <Filter className="w-3.5 h-3.5" />
                          <span>Filter</span>
                        </button>
                        <button
                          onClick={() => {
                            const newTitle = prompt('Enter task title:');
                            if (newTitle) {
                              setTasks(prev => [
                                ...prev,
                                { id: String(Date.now()), title: newTitle, status: 'To Do', priority: 'Medium', project: 'Kinetic UI', assignee: 'John Doe' }
                              ]);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Task</span>
                        </button>
                      </div>
                    </div>

                    {/* Task Columns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['To Do', 'In Progress', 'Completed'].map(col => {
                        const colTasks = tasks.filter(t => t.status === col);
                        return (
                          <div
                            key={col}
                            className={`p-4 rounded-xl border flex flex-col gap-3 ${
                              themeMode === 'light' ? 'bg-white border-neutral-200 shadow-xs' : 'bg-[#151518] border-neutral-800'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold text-xs pb-2 border-b border-neutral-800/60">
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  col === 'Completed' ? 'bg-emerald-500' : col === 'In Progress' ? 'bg-amber-500' : 'bg-neutral-400'
                                }`} />
                                {col}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-400">
                                {colTasks.length}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2.5 min-h-[160px]">
                              {colTasks.map(t => (
                                <div
                                  key={t.id}
                                  className={`p-3 rounded-lg border flex flex-col gap-2 text-xs transition-all ${
                                    themeMode === 'light'
                                      ? 'bg-neutral-50 border-neutral-200 hover:shadow-sm'
                                      : 'bg-[#19191d] border-neutral-800 hover:border-neutral-700'
                                  }`}
                                >
                                  <span className="font-semibold text-xs leading-snug">{t.title}</span>
                                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                                    <span className="px-1.5 py-0.5 rounded bg-neutral-800">{t.project}</span>
                                    <span>{t.assignee}</span>
                                  </div>
                                </div>
                              ))}
                              {colTasks.length === 0 && (
                                <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 italic py-6">
                                  No tasks in this column
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 3. ROADMAP VIEW */}
                {activeView === 'roadmap' && (
                  <motion.div
                    key="roadmap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 max-w-6xl mx-auto"
                  >
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Product Roadmap 2026</h1>
                      <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        Quarterly strategic milestones, release schedules, and core engineering tracks.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { quarter: 'Q1 2026', title: 'Design System & Physics Engine', progress: 100, status: 'Released', tags: ['WebGL', 'Tailwind v4'] },
                        { quarter: 'Q2 2026', title: 'Real-time AI Copilot & Multi-user', progress: 75, status: 'In Progress', tags: ['Gemini 2.5', 'WebSockets'] },
                        { quarter: 'Q3 2026', title: 'Enterprise RBAC & Mobile App', progress: 30, status: 'Planned', tags: ['React Native', 'OAuth PKCE'] },
                        { quarter: 'Q4 2026', title: 'Global CDN Edge & Sharding', progress: 0, status: 'Backlog', tags: ['Cloudflare', 'Postgres'] },
                      ].map((q, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                            themeMode === 'light' ? 'bg-white border-neutral-200' : 'bg-[#151518] border-neutral-800'
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-indigo-400">{q.quarter}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                q.status === 'Released' ? 'bg-emerald-500/10 text-emerald-400' : q.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {q.status}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm mt-1">{q.title}</h4>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {q.tags.map(t => (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                              <span>Progress</span>
                              <span>{q.progress}%</span>
                            </div>
                            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all"
                                style={{ width: `${q.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 4. ACTIVE PROJECTS & ARCHIVED VIEW */}
                {(activeView === 'active-projects' || activeView === 'archived-projects') && (
                  <motion.div
                    key="projects"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 max-w-6xl mx-auto"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                          {activeView === 'active-projects' ? 'Active Projects' : 'Archived Projects'}
                        </h1>
                        <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                          All active production repositories, client deliverables, and design prototypes.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {[
                        { title: 'Kinetic UI System', client: 'Stripe & Linear Partner', status: 'Production', tech: ['React 19', 'Tailwind', 'Motion'], icon: '⚡' },
                        { title: 'Astral 3D Physics WebGL', client: 'Creative Labs', status: 'Active Sprint', tech: ['Three.js', 'Rapier', 'GLSL'], icon: '🪐' },
                        { title: 'Strata Treasury & Mobile Banking', client: 'Fintech Corp', status: 'In Review', tech: ['TypeScript', 'GraphQL', 'Next.js'], icon: '💳' },
                      ].map((proj, idx) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                            themeMode === 'light' ? 'bg-white border-neutral-200 shadow-xs' : 'bg-[#151518] border-neutral-800'
                          }`}
                        >
                          <div>
                            <div className="text-2xl mb-2">{proj.icon}</div>
                            <h3 className="font-bold text-base">{proj.title}</h3>
                            <p className="text-xs text-neutral-400 mt-1">{proj.client}</p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {proj.tech.map(t => (
                                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                            <span className="text-emerald-400 font-semibold">{proj.status}</span>
                            <button className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                              <span>Details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. TEAM MEMBERS VIEW */}
                {activeView === 'members' && (
                  <motion.div
                    key="members"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 max-w-6xl mx-auto"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Team Members & Access</h1>
                        <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                          Manage collaborators, roles, and branch permission levels.
                        </p>
                      </div>
                      <button className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>Invite Teammate</span>
                      </button>
                    </div>

                    <div className={`rounded-xl border overflow-hidden ${
                      themeMode === 'light' ? 'bg-white border-neutral-200' : 'bg-[#151518] border-neutral-800'
                    }`}>
                      <div className="divide-y divide-neutral-800/70">
                        {[
                          { name: 'John Doe', email: 'john@example.com', role: 'Owner / Architect', status: 'Online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
                          { name: 'Sarah Chen', email: 'sarah.c@example.com', role: 'Senior 3D Engineer', status: 'In Sprint', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
                          { name: 'Alex Rivera', email: 'alex.r@example.com', role: 'Lead Product Designer', status: 'Online', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
                          { name: 'Marcus Vance', email: 'marcus.v@example.com', role: 'VP of Product', status: 'Away', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
                        ].map((m, i) => (
                          <div key={i} className="p-4 flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover border border-neutral-700" referrerPolicy="no-referrer" />
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{m.name}</span>
                                <span className="text-neutral-400 text-xs">{m.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 font-medium">{m.role}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                m.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>{m.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 6. INTEGRATIONS & WORKSPACE VIEW */}
                {activeView === 'integrations' && (
                  <motion.div
                    key="integrations"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 max-w-6xl mx-auto"
                  >
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Connected Integrations</h1>
                      <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        Manage active API keys, third-party connectors, and automated CI pipelines.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {integrations.map(int => (
                        <div
                          key={int.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                            themeMode === 'light' ? 'bg-white border-neutral-200 shadow-xs' : 'bg-[#151518] border-neutral-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{int.icon}</span>
                              <button
                                onClick={() => toggleIntegration(int.id)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                  int.connected
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {int.connected ? 'Connected' : 'Connect'}
                              </button>
                            </div>
                            <h3 className="font-bold text-sm mt-3">{int.name}</h3>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{int.desc}</p>
                          </div>
                          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                            <span>Status: {int.connected ? 'Active Sync' : 'Inactive'}</span>
                            <ExternalLink className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 7. ACCOUNT SETTINGS VIEW */}
                {activeView === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 max-w-4xl mx-auto"
                  >
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Account & Security</h1>
                      <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        Manage your user credentials, active sessions, and workspace preferences.
                      </p>
                    </div>

                    <div className={`p-6 rounded-xl border flex flex-col gap-5 ${
                      themeMode === 'light' ? 'bg-white border-neutral-200' : 'bg-[#151518] border-neutral-800'
                    }`}>
                      <div className="flex items-center gap-4">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                          alt="John Doe"
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="font-bold text-base">John Doe</h3>
                          <p className="text-xs text-neutral-400">Staff Full-Stack Architect • Admin</p>
                          <button className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                            Change Profile Avatar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="text-xs text-neutral-400 font-medium">Display Name</label>
                          <input
                            type="text"
                            defaultValue="John Doe"
                            className="w-full mt-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-400 font-medium">Email Address</label>
                          <input
                            type="email"
                            defaultValue="john@example.com"
                            className="w-full mt-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-neutral-800 flex justify-end gap-2">
                        <button className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-700">
                          Cancel
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Default fallback view for sprints / approvals / reviews / automations */}
                {['sprints', 'approvals', 'reviews', 'automations'].includes(activeView) && (
                  <motion.div
                    key="general-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 max-w-6xl mx-auto"
                  >
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight capitalize">{activeView} Overview</h1>
                      <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        All operational logs, workflow triggers, and continuous analytics for {activeView}.
                      </p>
                    </div>

                    <div className={`p-8 rounded-xl border flex flex-col items-center justify-center text-center gap-3 ${
                      themeMode === 'light' ? 'bg-white border-neutral-200' : 'bg-[#151518] border-neutral-800'
                    }`}>
                      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-indigo-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base capitalize">{activeView} Stream Active</h3>
                      <p className="text-xs text-neutral-400 max-w-md">
                        Data is streaming continuously with automatic synchronization to your workspace cloud engine.
                      </p>
                      <button
                        onClick={() => setActiveView('dashboard')}
                        className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        Return to Main Dashboard
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </main>

        </div>
      </div>
  );
};
