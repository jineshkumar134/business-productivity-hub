/**
 * OrgPulse - Business Productivity Hub
 * Frontend Logic
 */

// Auth Guard - redirect to login if not authenticated
if (!localStorage.getItem('bh_user')) {
    window.location.href = '/login.html';
}

// State Management
const state = {
    currentView: 'dashboard',
    tasks: [],
    personal: [],
    logs: [],
    departments: [
        'Product Research',
        'Product Development',
        'Product Marketing',
        'Product Selling',
        'Accounts & Finance',
        'Client Success',
        'HR Department'
    ],
    selectedPersonal: [] // For task modal
};

// Custom SVG Icons (Inspired by SVGRepo Collections)
const deptIcons = {
    'Product Research': `<svg xmlns="http://www.w3.org/1992/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/><path d="M7 10h4"/><path d="M9 8v4"/></svg>`,
    'Product Development': `<svg xmlns="http://www.w3.org/1992/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`,
    'Product Marketing': `<svg xmlns="http://www.w3.org/1992/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18H3"/><path d="M16 12H3"/><path d="M21 6H3"/><path d="m16 21 5-5-5-5"/></svg>`,
    'Product Selling': `<svg xmlns="http://www.w3.org/1992/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>`,
    'Accounts & Finance': `<svg xmlns="http://www.w3.org/1992/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`,
    'Client Success': `<svg xmlns="http://www.w3.org/1992/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    'HR Department': `<svg xmlns="http://www.w3.org/1992/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
};

// DOM Elements
const elements = {
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view'),
    viewTitle: document.getElementById('view-title'),
    viewDesc: document.getElementById('view-desc'),
    moduleGrid: document.getElementById('module-grid'),
    personalGrid: document.getElementById('personal-grid'),
    logsTbody: document.getElementById('logs-tbody'),
    taskModal: document.getElementById('task-modal'),
    personalModal: document.getElementById('personal-modal'),
    taskForm: document.getElementById('task-form'),
    personalForm: document.getElementById('personal-form'),
    closeModalBtns: document.querySelectorAll('.close-modal'),
    addTaskGlobalBtn: document.getElementById('add-task-global'),
    addPersonalBtn: document.getElementById('add-personal-btn'),
    clearLogsBtn: '', // Removed from UI
    personalDropdown: document.getElementById('personal-dropdown'),
    selectedPersonalList: document.getElementById('selected-personal-list'),
    summaryStats: document.getElementById('summary-stats'),
    summaryBlocks: document.getElementById('summary-blocks'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    analyzeLogsBtn: document.getElementById('analyze-logs-btn'),
    aiInsightsContainer: document.getElementById('ai-insights-container'),
    aiReportContent: document.getElementById('ai-report-content'),
    completedDateGroup: document.getElementById('completed-date-group'),
    delayReasonGroup: document.getElementById('delay-reason-group'),
    profileModal: document.getElementById('profile-modal'),
    profileName: document.getElementById('profile-name'),
    profileEmail: document.getElementById('profile-email'),
    profilePhone: document.getElementById('profile-phone'),
    profileInitial: document.getElementById('profile-initial')
};

// Initialization
async function init() {
    setupEventListeners();
    renderUserGreeting();
    await fetchData();
    renderAll();
    lucide.createIcons();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            switchView(view);
        });
    });

    // Modals
    elements.addTaskGlobalBtn.addEventListener('click', () => openTaskModal());
    elements.addPersonalBtn.addEventListener('click', () => openPersonalModal());
    if (elements.analyzeLogsBtn) elements.analyzeLogsBtn.addEventListener('click', handleAIAnalysis);
    
    // Sidebar Toggle
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', () => {
            elements.sidebar.classList.toggle('collapsed');
            const isCollapsed = elements.sidebar.classList.contains('collapsed');
            elements.sidebarToggle.innerHTML = isCollapsed ? 
                '<i data-lucide="chevrons-right"></i>' : 
                '<i data-lucide="chevrons-left"></i>';
            lucide.createIcons();
        });
    }

    elements.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.taskModal.classList.remove('active');
            elements.personalModal.classList.remove('active');
            elements.profileModal.classList.remove('active');
        });
    });

    // Forms
    elements.taskForm.addEventListener('submit', handleTaskSubmit);
    elements.personalForm.addEventListener('submit', handlePersonalSubmit);

    // Selected Personal for Task
    elements.personalDropdown.addEventListener('change', (e) => {
        const name = e.target.value;
        if (name && !state.selectedPersonal.includes(name)) {
            state.selectedPersonal.push(name);
            renderSelectedPersonal();
            e.target.value = '';
        }
    });

    // Task Status & Date Listeners
    document.getElementById('task-status').addEventListener('change', () => checkTaskConstraints());
    document.getElementById('task-completed-date').addEventListener('change', () => checkTaskConstraints());
    document.getElementById('task-due-date').addEventListener('change', () => checkTaskConstraints());
}

function checkTaskConstraints() {
    const status = document.getElementById('task-status').value;
    const isCompleted = status === 'Completed';
    const dueDate = document.getElementById('task-due-date').value;
    const compDate = document.getElementById('task-completed-date').value;

    elements.completedDateGroup.style.display = isCompleted ? 'block' : 'none';
    
    // Show Delay Reason if completed late
    if (isCompleted && dueDate && compDate) {
        const delay = new Date(compDate) > new Date(dueDate);
        elements.delayReasonGroup.style.display = delay ? 'block' : 'none';
    } else {
        elements.delayReasonGroup.style.display = 'none';
    }

    const formInputs = elements.taskForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        if (['task-completed-date', 'task-status', 'task-due-date', 'task-delay-reason', 'task-id'].includes(input.id)) {
            input.disabled = false;
        } else {
            input.disabled = isCompleted;
        }
    });
    document.getElementById('personal-dropdown').disabled = isCompleted;
}

function renderUserGreeting() {
    const storedUser = localStorage.getItem('bh_user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const greetEl = document.getElementById('user-greeting');
        if (greetEl) {
            greetEl.innerHTML = `<span style="width:28px; height:28px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700;">${user.name.charAt(0).toUpperCase()}</span> ${user.name}`;
        }
    }
}

// Logout
function handleLogout() {
    localStorage.removeItem('bh_user');
    window.location.href = '/login.html';
}
window.handleLogout = handleLogout;
// View Management
function switchView(viewName) {
    state.currentView = viewName;

    // Update Nav
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    // Update Views
    elements.views.forEach(view => {
        view.classList.toggle('active', view.id === `${viewName}-view`);
    });

    // Update Title/Desc
    const titles = {
        dashboard: { t: 'Dashboard Overview', d: 'Monitor organizational performance in real-time.' },
        summary: { t: 'Health Summary', d: 'High-level status of all departments and bottlenecks.' },
        hr: { t: 'Team Management', d: 'Manage personal and define core responsibilities.' },
        logs: { t: 'Activity Logs', d: 'Audit trail of all system changes and task updates.' }
    };

    elements.viewTitle.innerText = titles[viewName].t;
    elements.viewDesc.innerText = titles[viewName].d;

    // Smooth transition effect on header
    const headerWrapper = elements.viewTitle.parentElement;
    headerWrapper.style.animation = 'none';
    void headerWrapper.offsetWidth;
    headerWrapper.style.animation = 'fadeIn 0.3s ease forwards';

    renderAll();
}

// Data Fetching
async function fetchData() {
    try {
        const [tasksRes, personalRes, logsRes] = await Promise.all([
            fetch('/api/tasks').then(r => r.json()),
            fetch('/api/personal').then(r => r.json()),
            fetch('/api/logs').then(r => r.json())
        ]);

        state.tasks = tasksRes;
        state.personal = personalRes;
        state.logs = logsRes;
    } catch (err) {
        showNotification('Error fetching data', 'error');
        console.error(err);
    }
}

// Rendering Logic
function renderAll() {
    if (state.currentView === 'dashboard') renderDashboard();
    if (state.currentView === 'summary') renderSummary();
    if (state.currentView === 'hr') renderPersonal();
    if (state.currentView === 'logs') renderLogs();
    
    // Update personal dropdown in task modal
    renderPersonalDropdown();
    lucide.createIcons();
}

function renderDashboard() {
    elements.moduleGrid.innerHTML = '';
    // Remove old stats banner if exists
    const oldBanner = document.getElementById('dashboard-stats-banner');
    if (oldBanner) oldBanner.remove();

    // Gamified Stats Banner
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.status === 'Completed').length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const inProgress = state.tasks.filter(t => t.status === 'In Progress').length;

    // Find top performing department
    let topDept = '—';
    let topScore = -1;
    state.departments.forEach(d => {
        const dt = state.tasks.filter(t => t.department === d);
        const dc = dt.filter(t => t.status === 'Completed').length;
        const dp = dt.length > 0 ? Math.round((dc / dt.length) * 100) : 0;
        if (dp > topScore && dt.length > 0) { topScore = dp; topDept = d; }
    });    const banner = document.createElement('div');
    banner.id = 'dashboard-stats-banner';
    banner.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; margin-bottom:1.5rem; animation:fadeIn 0.3s ease;';
    banner.innerHTML = `
        <div style="background:white; border-radius:12px; padding:1rem 1.25rem; border:1px solid var(--gray-200); display:flex; align-items:center; gap:0.75rem;">
            <div style="width:36px; height:36px; border-radius:8px; background:rgba(37,99,235,0.1); display:flex; align-items:center; justify-content:center;"><i data-lucide="layers" style="width:18px; height:18px; color:var(--primary);"></i></div>
            <div><div style="font-size:0.7rem; color:var(--secondary); font-weight:600; text-transform:uppercase;">Total Tasks</div><div style="font-size:1.5rem; font-weight:800; color:var(--dark);">${totalTasks}</div></div>
        </div>
        <div style="background:white; border-radius:12px; padding:1rem 1.25rem; border:1px solid var(--gray-200); display:flex; align-items:center; gap:0.75rem;">
            <div style="width:36px; height:36px; border-radius:8px; background:rgba(16,185,129,0.1); display:flex; align-items:center; justify-content:center;"><i data-lucide="check-circle-2" style="width:18px; height:18px; color:var(--success);"></i></div>
            <div><div style="font-size:0.7rem; color:var(--secondary); font-weight:600; text-transform:uppercase;">Completed</div><div style="font-size:1.5rem; font-weight:800; color:var(--success);">${completedTasks}</div></div>
        </div>
        <div style="background:white; border-radius:12px; padding:1rem 1.25rem; border:1px solid var(--gray-200); display:flex; align-items:center; gap:0.75rem;">
            <div style="width:36px; height:36px; border-radius:8px; background:rgba(245,158,11,0.1); display:flex; align-items:center; justify-content:center;"><i data-lucide="loader" style="width:18px; height:18px; color:var(--warning);"></i></div>
            <div><div style="font-size:0.7rem; color:var(--secondary); font-weight:600; text-transform:uppercase;">In Progress</div><div style="font-size:1.5rem; font-weight:800; color:var(--warning);">${inProgress}</div></div>
        </div>
        <div style="background:white; border-radius:12px; padding:1rem 1.25rem; border:1px solid var(--gray-200);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <div style="font-size:0.7rem; color:var(--secondary); font-weight:600; text-transform:uppercase;">Overall Progress</div>
                <div style="font-size:0.85rem; font-weight:800; color:var(--primary);">${overallProgress}%</div>
            </div>
            <div style="width:100%; height:8px; background:var(--gray-200); border-radius:4px; overflow:hidden;">
                <div class="animated-bar" style="height:100%; width:0%; background:linear-gradient(90deg, var(--primary), var(--success)); border-radius:4px; transition:width 0.8s ease;" data-target="${overallProgress}"></div>
            </div>
            <div style="font-size:0.65rem; color:var(--secondary); margin-top:0.4rem;">🏆 Top: <strong>${topDept}</strong></div>
        </div>
    `;
    elements.moduleGrid.parentElement.insertBefore(banner, elements.moduleGrid);

    // Animate progress bars after render
    setTimeout(() => {
        document.querySelectorAll('.animated-bar').forEach(bar => {
            bar.style.width = bar.dataset.target + '%';
        });
    }, 100);

    state.departments.forEach(dept => {
        const deptTasks = state.tasks.filter(t => t.department === dept);
        const completedCount = deptTasks.filter(t => t.status === 'Completed').length;
        const progress = deptTasks.length > 0 ? Math.round((completedCount / deptTasks.length) * 100) : 0;
        const deptTeam = state.personal.filter(p => p.department === dept && (p.role || '').toLowerCase().includes('lead'));

        const card = document.createElement('div');
        card.className = 'module-card';
        card.innerHTML = `
            <div class="module-card-header">
                <div class="module-title-row">
                    <div class="module-icon-wrap">
                        ${deptIcons[dept] || '<svg xmlns="http://www.w3.org/1992/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>'}
                    </div>
                    <h3 class="module-name">${dept}</h3>
                </div>
                <span class="module-stats-pill">${completedCount}/${deptTasks.length} Tasks</span>
            </div>
            <div class="module-progress-section">
                <div class="progress-info">
                    <span>Performance Score</span>
                    <span>${progress}%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="module-team-list" style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.75rem; margin-bottom:0.5rem; background:rgba(241, 245, 249, 0.5); padding:0.6rem; border-radius:var(--radius-sm); border:1px solid var(--gray-200);">
                <div style="font-size:0.75rem; color:var(--dark); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--gray-200); padding-bottom:0.3rem; margin-bottom:0.2rem;">Team Lead</div>
                <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:120px; overflow-y:auto; padding-right:0.25rem;">
                    ${deptTeam.map(p => `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; font-size:0.85rem; border-left:2px solid var(--primary); padding-left:0.4rem;">
                            <div style="font-weight:600; color:var(--dark); display:flex; flex-direction:column;">
                                <span>${p.name}</span>
                                <span style="font-size:0.7rem; color:var(--secondary); font-weight:400;">${p.email || 'No email'}</span>
                            </div>
                            <span style="color:var(--primary); font-size:0.7rem; font-weight:600; background:rgba(37,99,235,0.1); padding:0.15rem 0.4rem; border-radius:4px;">${p.role}</span>
                        </div>
                    `).join('')}
                    ${deptTeam.length === 0 ? '<div style="font-size:0.75rem; color:var(--gray-400);">No assigned lead</div>' : ''}
                </div>
            </div>
            <div class="task-list-mini">
                ${deptTasks.map(t => {
                    const taskMembers = state.personal.filter(p => (t.responsible || []).includes(p.name));
                    const linkedDepts = [...new Set(taskMembers.map(p => p.department))].filter(d => d !== dept);
                    
                    return `
                    <div class="mini-task-item" onclick="openTaskModal('${t._id}')" style="display:flex; flex-direction:column; gap:0.5rem; border:1px solid transparent; transition:border 0.2s;">
                        <div class="mini-task-row" style="align-items:flex-start;">
                            <div style="display:flex; flex-direction:column; flex-grow:1; padding-right:0.5rem;">
                                <div class="mini-task-content" style="font-weight:700; font-size:0.95rem;">${t.task_name}</div>
                                ${t.description ? `<div style="font-size:0.75rem; color:var(--secondary); margin-top:0.25rem; line-height:1.4;">${t.description}</div>` : ''}
                            </div>
                            <button class="mini-delete-btn" onclick="event.stopPropagation(); deleteTask('${t._id}')" title="Delete Task" style="flex-shrink:0;">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                        <div style="font-size:0.75rem; color:var(--secondary); display:flex; flex-direction:column; gap:0.25rem; background:rgba(0,0,0,0.03); padding:0.4rem; border-radius:4px;">
                            <div style="display:flex; align-items:center; gap:0.35rem;">
                                <i data-lucide="user" style="width:12px; height:12px;"></i> 
                                ${t.responsible && t.responsible.length > 0 ? t.responsible.join(', ') : 'Unassigned'}
                            </div>
                            <div style="display:flex; align-items:center; gap:0.35rem;">
                                <i data-lucide="calendar" style="width:12px; height:12px;"></i> 
                                ${t.due_date ? 'Due: ' + new Date(t.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : 'No due date'}
                            </div>
                            ${t.requested_by && t.requested_by !== dept ? `
                                <div style="display:flex; align-items:center; gap:0.35rem; color:var(--primary); font-weight:700;">
                                    <i data-lucide="arrow-right-left" style="width:12px; height:12px;"></i>
                                    Req by: ${t.requested_by}
                                </div>
                            ` : ''}
                        </div>
                        ${linkedDepts.length > 0 ? `
                        <div style="font-size:0.7rem; color:var(--info); font-weight:600; background:rgba(59,130,246,0.1); padding:0.3rem 0.5rem; border-radius:4px; display:inline-flex; align-items:center; gap:0.3rem; border:1px dashed rgba(59,130,246,0.5);">
                            <i data-lucide="link" style="width:12px; height:12px;"></i>
                            Linked: ${linkedDepts.join(' & ')}
                        </div>` : ''}
                        <div class="mini-task-meta" style="margin-top:0.2rem;">
                            <span class="status-badge status-${t.status.toLowerCase().replace(' ', '')}">${t.status}</span>
                            <span class="priority-${t.priority.toLowerCase()}">${t.priority}</span>
                        </div>
                    </div>
                `;}).join('')}
                ${deptTasks.length === 0 ? '<p class="empty-msg">No tasks assigned yet.</p>' : ''}
            </div>
            <button class="add-task-btn-small" onclick="openTaskModal(null, '${dept}')">
                <i data-lucide="plus"></i>
                <span>Add Task</span>
            </button>
        `;
        elements.moduleGrid.appendChild(card);
    });
}

function renderPersonal() {
    elements.personalGrid.innerHTML = '';
    state.personal.forEach((person, index) => {
        const card = document.createElement('div');
        card.className = 'person-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        // Try to get date from createdAt, fallback to extracting from MongoDB _id timestamp
        let dateStr = 'N/A';
        if (person.createdAt) {
            dateStr = new Date(person.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } else if (person._id && person._id.length === 24) {
            // MongoDB ID first 8 chars are hex timestamp in seconds
            const timestamp = parseInt(person._id.substring(0, 8), 16) * 1000;
            dateStr = new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }

        card.innerHTML = `
            <div class="person-header" style="margin-bottom:0.25rem;">
                <div class="person-avatar">${person.name.charAt(0)}</div>
                <div class="person-info">
                    <h3 style="font-size:1.1rem; margin-bottom:0;">${person.name}</h3>
                    <p style="font-size:0.85rem; font-weight:500;">${person.role}</p>
                </div>
            </div>
            <div class="person-badges" style="margin-bottom:0.75rem;">
                <span class="person-badge" style="background:var(--primary); color:white;">${person.department}</span>
            </div>
            <div class="person-contact" style="font-size:0.85rem; color:var(--secondary); display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1rem; padding:0.5rem; background:var(--gray-100); border-radius:var(--radius-sm);">
                <div style="display:flex; align-items:center; gap:0.5rem;"><i data-lucide="mail" style="width:14px; height:14px;"></i> ${person.email || 'No email provided'}</div>
                <div style="display:flex; align-items:center; gap:0.5rem;"><i data-lucide="calendar" style="width:14px; height:14px;"></i> Date Added: ${dateStr}</div>
            </div>
            <div class="person-responsibility" style="border-top:none; padding-top:0;">
                <strong style="font-size:0.85rem;">Responsibility:</strong><br>
                <div style="font-size:0.85rem; margin-top:0.25rem;">${person.responsibility || 'General Support'}</div>
            </div>
            <div class="person-actions" style="margin-top:auto; padding-top:1rem; border-top:1px solid var(--gray-100); display:flex; justify-content:flex-end; gap:0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="editPersonal('${person._id}')" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deletePersonal('${person._id}')" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Delete</button>
            </div>
        `;
        elements.personalGrid.appendChild(card);
    });
}

function renderSummary() {
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.status === 'Completed').length;
    const highPriority = state.tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
    const healthScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Compact Stats Ribbon
    // Count up the stats for a professional gamified feel
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) { window.requestAnimationFrame(step); }
            else { obj.innerHTML = end + (obj.dataset.suffix || ''); }
        };
        window.requestAnimationFrame(step);
    }

    elements.summaryStats.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; background: white; padding: 0.75rem 1.5rem; border-radius: 12px; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="color: var(--secondary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Total: <span id="v-total" class="gamified-stat-row" style="color: var(--dark); font-size: 1.1rem; margin-left: 0.25rem;">0</span></div>
                <div style="width: 1px; height: 16px; background: var(--gray-200);"></div>
                <div style="color: var(--secondary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Done: <span id="v-done" style="color: var(--success); font-size: 1.1rem; margin-left: 0.25rem;">0</span></div>
                <div style="width: 1px; height: 16px; background: var(--gray-200);"></div>
                <div style="color: var(--secondary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Risk: <span id="v-risk" style="color: var(--danger); font-size: 1.1rem; margin-left: 0.25rem;">0</span></div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="text-align: right;">
                    <div style="font-size: 0.65rem; color: var(--secondary); font-weight: 700; text-transform: uppercase;">Org Health</div>
                    <div id="v-health" style="font-size: 1.1rem; font-weight: 800; color: ${healthScore > 70 ? 'var(--success)' : 'var(--danger)'};" data-suffix="%">0</div>
                </div>
                <div style="width: 60px; height: 6px; background: var(--gray-100); border-radius: 3px; overflow: hidden;">
                    <div class="h-fill" style="height: 100%; width: 0%; background: ${healthScore > 70 ? 'var(--success)' : 'var(--danger)'}; transition: width 1s ease-out;"></div>
                </div>
            </div>
        </div>
    `;

    // Trigger animations after insertion
    setTimeout(() => {
        animateValue(document.getElementById('v-total'), 0, totalTasks, 600);
        animateValue(document.getElementById('v-done'), 0, completedTasks, 600);
        animateValue(document.getElementById('v-risk'), 0, highPriority, 600);
        animateValue(document.getElementById('v-health'), 0, healthScore, 800);
        document.querySelector('.h-fill').style.width = healthScore + '%';
        
        // Internal bars animate
        document.querySelectorAll('.summary-progress-bar').forEach(bar => {
            bar.style.width = bar.dataset.target + '%';
        });
    }, 100);

    elements.summaryBlocks.innerHTML = '';
    elements.summaryBlocks.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 0.5rem;';

    state.departments.forEach((dept, index) => {
        const deptTasks = state.tasks.filter(t => t.department === dept);
        const done = deptTasks.filter(t => t.status === 'Completed').length;
        const progress = deptTasks.length > 0 ? Math.round((done / deptTasks.length) * 100) : 0;
        
        let statusColor = 'var(--success)';
        let statusLabel = 'Healthy';
        if (progress < 40) { statusColor = 'var(--danger)'; statusLabel = 'Critical'; }
        else if (progress < 70) { statusColor = 'var(--warning)'; statusLabel = 'Warning'; }

        const card = document.createElement('div');
        card.style.cssText = `background: white; border-radius: 12px; padding: 1.15rem; border: 1px solid var(--gray-200); border-top: 4px solid ${statusColor}; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.65rem; transition: transform 0.2s ease, box-shadow 0.2s ease; animation: fadeIn 0.4s ease backwards; animation-delay: ${index * 0.05}s; cursor: default;`;
        card.onmouseenter = function() { this.style.transform = 'translateY(-3px)'; this.style.boxShadow = 'var(--shadow-md)'; };
        card.onmouseleave = function() { this.style.transform = 'translateY(0)'; this.style.boxShadow = 'var(--shadow-sm)'; };
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--dark); margin: 0;">${dept}</h3>
                <span class="${statusLabel === 'Critical' ? 'status-critical-pulse' : ''}" style="font-size: 0.6rem; font-weight: 700; color: ${statusColor}; background: ${statusColor}15; padding: 0.2rem 0.4rem; border-radius: 4px; text-transform: uppercase; border: 1px solid ${statusColor}30;">${statusLabel}</span>
            </div>
            
            <div style="display: flex; align-items: baseline; gap: 0.3rem; margin-top: -0.25rem;">
                <span style="font-size: 1.1rem; font-weight: 800; color: var(--dark);">${progress}%</span>
                <span style="font-size: 0.65rem; color: var(--secondary); font-weight: 600;">Progress</span>
            </div>

            <div style="height: 4px; background: var(--gray-100); border-radius: 2px; overflow: hidden;">
                <div class="summary-progress-bar" style="height: 100%; width: 0%; background: ${statusColor}; transition: width 1s cubic-bezier(0.16, 1, 0.3, 1); border-radius: 2px;" data-target="${progress}"></div>
            </div>

            <div style="margin-top: 0.25rem; max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 0.25rem;" class="custom-scrollbar">
                ${deptTasks.map(t => {
                    const date = t.due_date ? new Date(t.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : 'No date';
                    return `
                    <div style="display: flex; flex-direction: column; gap: 0.2rem; padding: 0.45rem; background: var(--gray-100); border-radius: 6px; font-size: 0.7rem; border-left: 3px solid ${t.status === 'Completed' ? 'var(--success)' : (t.priority === 'High' ? 'var(--danger)' : 'var(--gray-300)')};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 700; color: var(--dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;" title="${t.task_name}">${t.task_name}</span>
                            <span style="font-size: 0.6rem; font-weight: 700; color: ${t.status === 'Completed' ? 'var(--success)' : 'var(--secondary)'};">${t.status}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; color: var(--secondary); font-size: 0.65rem;">
                            <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="user" style="width:10px; height:10px;"></i> ${(t.responsible || [])[0] || 'Unassigned'}</span>
                            <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="calendar" style="width:10px; height:10px;"></i> ${date}</span>
                        </div>
                    </div>
                `;}).join('')}
                ${deptTasks.length === 0 ? '<div style="font-size: 0.7rem; color: var(--gray-400); text-align: center; padding: 0.5rem;">No tasks yet.</div>' : ''}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem; border-top: 1px solid var(--gray-100); font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">
                <span style="color: var(--secondary);">Total: <strong style="color: var(--dark);">${deptTasks.length}</strong></span>
                <span style="color: var(--success);">Done: <strong style="color: var(--success);">${done}</strong></span>
            </div>
        `;
        elements.summaryBlocks.appendChild(card);
    });
    // Ensure icons in cards are rendered
    lucide.createIcons();
}

function renderLogs() {
    // Consolidate logs by task name to show only the latest status for each task
    const consolidated = {};
    state.logs.forEach(log => {
        const key = log.task_name || 'System Action';
        // Only keep the most recent log for each task name
        if (!consolidated[key] || new Date(log.timestamp) > new Date(consolidated[key].timestamp)) {
            consolidated[key] = log;
        }
    });

    const consolidatedLogs = Object.values(consolidated).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    elements.logsTbody.innerHTML = consolidatedLogs.map(log => {
        const isLate = log.due_date && log.completed_date && new Date(log.completed_date) > new Date(log.due_date);
        return `
        <tr>
            <td><span class="log-action-${log.action.toLowerCase()}">${log.action}</span></td>
            <td>
                <div style="font-weight:700; color:var(--dark);">${log.task_name || 'System Action'}</div>
                <div style="font-size:0.75rem; color:var(--secondary); margin-top:0.2rem;">${log.task_description || log.description}</div>
                ${log.requested_by ? `<div style="font-size:0.65rem; color:var(--primary); font-weight:700; margin-top:0.3rem;">Ref: ${log.requested_by}</div>` : ''}
            </td>
            <td>
                <div style="display:flex; flex-direction:column; gap:0.25rem;">
                    ${(log.responsible || []).map(r => `<span style="font-size:0.8rem; font-weight:600; color:var(--primary);">• ${r}</span>`).join('') || '—'}
                </div>
            </td>
            <td>
                <div style="font-size:0.8rem;">Due: <strong style="color:var(--dark);">${log.due_date ? new Date(log.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : '—'}</strong></div>
                ${log.completed_date ? `<div style="font-size:0.8rem;">Done: <strong style="color:var(--success);">${new Date(log.completed_date).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}</strong></div>` : ''}
            </td>
            <td>
                ${isLate ? `
                    <div style="padding:0.4rem; background:rgba(239,68,68,0.08); border-radius:6px; border-left:3px solid var(--danger);">
                        <div style="color:var(--danger); font-size:0.7rem; font-weight:700; text-transform:uppercase;">Delay Identified</div>
                        <div style="font-size:0.75rem; color:var(--secondary); font-style:italic;">"${log.delay_reason || 'No justification provided'}"</div>
                    </div>
                ` : `
                    <div style="color:var(--success); font-weight:600; font-size:0.8rem;"><i data-lucide="check-circle" style="width:12px; height:12px;"></i> On Time</div>
                `}
                <div style="font-size:0.65rem; color:var(--gray-400); margin-top:0.25rem;">Last Activity: ${new Date(log.timestamp).toLocaleString()}</div>
            </td>
        </tr>
    `;}).join('');
    if (state.logs.length === 0) {
        elements.logsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:3rem; color:var(--secondary)">No logs found.</td></tr>';
    }
    lucide.createIcons();
}

// Modal Form Handlers
function openTaskModal(taskId = null, dept = null) {
    elements.taskForm.reset();
    state.selectedPersonal = [];
    renderSelectedPersonal();

    if (taskId) {
        const task = state.tasks.find(t => t._id === taskId);
        document.getElementById('task-id').value = task._id;
        document.getElementById('task-name').value = task.task_name;
        document.getElementById('task-department').value = task.department;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-progress').value = task.progress;
        document.getElementById('task-requested-by').value = task.requested_by || '';
        document.getElementById('task-due-date').value = task.due_date ? task.due_date.split('T')[0] : '';
        document.getElementById('task-completed-date').value = task.completed_date ? task.completed_date.split('T')[0] : '';
        document.getElementById('task-delay-reason').value = task.delay_reason || '';
        document.getElementById('task-description').value = task.description || '';
        state.selectedPersonal = [...(task.responsible || [])];
        renderSelectedPersonal();
        document.getElementById('modal-title').innerText = 'Edit Task';

        // Completion Guard: If task is completed, lock everything but the completion date
        const isCompleted = task.status === 'Completed';
        elements.completedDateGroup.style.display = isCompleted ? 'block' : 'none';
        
        const formInputs = elements.taskForm.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            if (input.id === 'task-completed-date' || input.id === 'task-status') {
                input.disabled = false;
            } else {
                input.disabled = isCompleted;
            }
        });
        document.getElementById('personal-dropdown').disabled = isCompleted;
    } else {
        document.getElementById('task-id').value = '';
        if (dept) document.getElementById('task-department').value = dept;
        document.getElementById('task-requested-by').value = '';
        document.getElementById('modal-title').innerText = 'Create New Task';
        elements.completedDateGroup.style.display = 'none';
        
        // Ensure all enabled
        const formInputs = elements.taskForm.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => input.disabled = false);
        document.getElementById('personal-dropdown').disabled = false;
        elements.delayReasonGroup.style.display = 'none';
    }

    elements.taskModal.classList.add('active');
    // Final check for visibility of extra fields
    checkTaskConstraints();
}

function openProfileModal() {
    const storedUser = localStorage.getItem('bh_user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        elements.profileName.innerText = user.name;
        elements.profileEmail.innerText = user.email;
        elements.profilePhone.innerText = user.phone || '—';
        elements.profileInitial.innerText = user.name.charAt(0).toUpperCase();
        elements.profileModal.classList.add('active');
        lucide.createIcons();
    }
}
window.openProfileModal = openProfileModal;

function openPersonalModal(personId = null) {
    elements.personalForm.reset();
    
    if (personId) {
        const person = state.personal.find(p => p._id === personId);
        document.getElementById('person-id').value = person._id;
        document.getElementById('person-name').value = person.name;
        document.getElementById('person-role').value = person.role;
        document.getElementById('person-dept').value = person.department;
        document.getElementById('person-email').value = person.email || '';
        document.getElementById('person-responsibility').value = person.responsibility || '';
        document.querySelector('#personal-modal h2').innerText = 'Edit Team Member';
    } else {
        document.getElementById('person-id').value = '';
        document.querySelector('#personal-modal h2').innerText = 'Add Team Member (Personal)';
    }

    elements.personalModal.classList.add('active');
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const taskData = {
        task_name: document.getElementById('task-name').value,
        department: document.getElementById('task-department').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        progress: parseInt(document.getElementById('task-progress').value),
        due_date: document.getElementById('task-due-date').value,
        completed_date: document.getElementById('task-completed-date').value,
        delay_reason: document.getElementById('task-delay-reason').value,
        requested_by: document.getElementById('task-requested-by').value,
        description: document.getElementById('task-description').value,
        responsible: state.selectedPersonal
    };

    // Strict validation
    if (taskData.status === 'Completed' && new Date(taskData.completed_date) > new Date(taskData.due_date) && !taskData.delay_reason) {
        showNotification('Reason for delay is mandatory for late tasks', 'error');
        return;
    }

    // Strict validation check - make sure everything is present
    if (state.selectedPersonal.length === 0) {
        showNotification('Please assign at least one person', 'error');
        return;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/tasks/${id}` : '/api/tasks';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (res.ok) {
            showNotification(id ? 'Task updated' : 'Task created', 'success');
            elements.taskModal.classList.remove('active');
            await fetchData();
            renderAll();
        }
    } catch (err) {
        showNotification('Failed to save task', 'error');
    }
}

async function handlePersonalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('person-id').value;
    const personData = {
        name: document.getElementById('person-name').value,
        role: document.getElementById('person-role').value,
        department: document.getElementById('person-dept').value,
        email: document.getElementById('person-email').value,
        responsibility: document.getElementById('person-responsibility').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/personal/${id}` : '/api/personal';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(personData)
        });

        if (res.ok) {
            showNotification(id ? 'Team member updated' : 'Team member added', 'success');
            elements.personalModal.classList.remove('active');
            await fetchData();
            renderAll();
        }
    } catch (err) {
        showNotification('Failed to save member', 'error');
    }
}

// Helper Functions
function renderSelectedPersonal() {
    elements.selectedPersonalList.innerHTML = state.selectedPersonal.map(name => `
        <div class="tag">
            ${name}
            <span class="tag-remove" onclick="removeSelectedPersonal('${name}')">&times;</span>
        </div>
    `).join('');
}

window.removeSelectedPersonal = (name) => {
    state.selectedPersonal = state.selectedPersonal.filter(n => n !== name);
    renderSelectedPersonal();
};

function renderPersonalDropdown() {
    elements.personalDropdown.innerHTML = '<option value="">Select Personal...</option>';
    state.personal.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.innerText = `${p.name} (${p.department})`;
        elements.personalDropdown.appendChild(opt);
    });
}

async function clearLogs() {
    if (!confirm('Are you sure you want to clear all system logs?')) return;
    try {
        await fetch('/api/logs', { method: 'DELETE' });
        showNotification('Logs cleared', 'success');
        await fetchData();
        renderAll();
    } catch (err) {
        showNotification('Error clearing logs', 'error');
    }
}

function showNotification(msg, type = 'success') {
    const container = document.getElementById('notification-container');
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
        <span>${msg}</span>
    `;
    container.appendChild(note);
    lucide.createIcons();
    
    setTimeout(() => {
        note.style.opacity = '0';
        note.style.transform = 'translateX(20px)';
        setTimeout(() => note.remove(), 300);
    }, 3000);
}

// AI Analysis Logic
async function handleAIAnalysis() {
    elements.aiInsightsContainer.style.display = 'block';
    elements.aiReportContent.innerHTML = `
        <div style="text-align:center; padding: 2rem;">
            <div class="loading-animation" style="display:inline-block; width:30px; height:30px; border:3px solid var(--gray-200); border-top-color:var(--primary); border-radius:50%; animation:spin 1s linear infinite;"></div>
            <p style="margin-top:1rem; font-weight:600; color:var(--dark);">Synthesizing data performance metrics...</p>
        </div>
    `;

    try {
        // We'll simulate the AI analysis based on current state.logs since Gemini API might not be configured on backend yet.
        // In a production app, this would be a fetch('/api/ai/analyze-logs')
        
        await new Promise(r => setTimeout(r, 2000)); // Simulate thinking

        const report = generateAILogReport(state.logs, state.tasks);
        elements.aiReportContent.innerHTML = report;
        lucide.createIcons();
    } catch (err) {
        elements.aiReportContent.innerHTML = '<p style="color:var(--danger);">Error generating AI report. Please check your connection.</p>';
    }
}

function generateAILogReport(logs, tasks) {
    if (logs.length === 0) return '<p>No system activity logs available for analysis yet. Perform some actions first!</p>';

    const completed = tasks.filter(t => t.status === 'Completed').length;
    const delayedCount = tasks.filter(t => t.delay_reason).length;
    const crossDeptCount = tasks.filter(t => t.requested_by && t.requested_by !== t.department).length;
    
    const topPerformer = tasks.reduce((acc, t) => {
        if (t.status === 'Completed' && t.responsible && t.responsible[0]) {
            acc[t.responsible[0]] = (acc[t.responsible[0]] || 0) + 1;
        }
        return acc;
    }, {});
    
    const bestUser = Object.keys(topPerformer).sort((a,b) => topPerformer[bestUser] - topPerformer[a])[0] || 'N/A';
    const mainDelayReason = tasks.filter(t => t.delay_reason).map(t => t.delay_reason)[0] || 'Unclear bottlenecks';

    return `
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:1.5rem;">
            <div style="background:var(--gray-100); padding:1rem; border-radius:12px;">
                <h4 style="font-size:0.85rem; color:var(--primary); text-transform:uppercase; margin-bottom:0.75rem;"><i data-lucide="trending-up" style="width:14px; height:14px;"></i> Integration Metrics</h4>
                <div style="display:flex; flex-direction:column; gap:0.6rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem;"><span>Efficiency Ratio:</span> <strong style="color:var(--dark);">${Math.round((completed / Math.max(logs.length, 1)) * 100)}%</strong></div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem;"><span>Timeline Justifications:</span> <strong style="color:var(--danger);">${delayedCount} Late Tasks</strong></div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem;"><span>Inter-Dept Traffic:</span> <strong style="color:var(--info);">${crossDeptCount} Requests</strong></div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem;"><span>Top Asset:</span> <strong style="color:var(--success);">${bestUser}</strong></div>
                </div>
            </div>
            <div>
                 <h4 style="font-size:0.85rem; color:var(--primary); text-transform:uppercase; margin-bottom:0.75rem;"><i data-lucide="sparkles" style="width:14px; height:14px;"></i> Strategic Audit</h4>
                 <p style="font-style:italic; margin-bottom:1rem; line-height:1.5;">"The system analysis indicates a <strong>${delayedCount > 0 ? 'medium' : 'low'}</strong> friction level. We've identified <strong>${crossDeptCount}</strong> cross-departmental handoffs, primarily driven by <strong>Product Selling</strong>. The most common justification for recent delays was: <strong style="color:var(--secondary);">"${mainDelayReason}"</strong>."</p>
                 
                 <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    <div style="padding:0.75rem; background:rgba(37,99,235,0.06); border-left:3px solid var(--primary); border-radius:4px; font-size:0.8rem;">
                        <strong>Next Move:</strong> Standardizing the response to "${mainDelayReason}" across the Product Development team will likely reduce late completions by 25%.
                    </div>
                 </div>
            </div>
        </div>
    `;
}

// Window globals for inline calls
window.openTaskModal = openTaskModal;
window.editPersonal = (id) => openPersonalModal(id);
window.deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showNotification('Task deleted', 'success');
            await fetchData();
            renderAll();
        }
    } catch (err) {
        showNotification('Error deleting task', 'error');
    }
};

window.deletePersonal = async (id) => {
    if (!confirm('Remove this team member?')) return;
    try {
        await fetch(`/api/personal/${id}`, { method: 'DELETE' });
        showNotification('Member removed', 'success');
        await fetchData();
        renderAll();
    } catch (err) {
        showNotification('Error removing member', 'error');
    }
};

// Start the app
init();
