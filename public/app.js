/**
 * OrgPulse - Business Productivity Hub
 * Frontend Logic
 */

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
    clearLogsBtn: document.getElementById('clear-logs-btn'),
    personalDropdown: document.getElementById('personal-dropdown'),
    selectedPersonalList: document.getElementById('selected-personal-list'),
    summaryStats: document.getElementById('summary-stats'),
    summaryBlocks: document.getElementById('summary-blocks')
};

// Initialization
async function init() {
    setupEventListeners();
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
    elements.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.taskModal.classList.remove('active');
            elements.personalModal.classList.remove('active');
        });
    });

    // Forms
    elements.taskForm.addEventListener('submit', handleTaskSubmit);
    elements.personalForm.addEventListener('submit', handlePersonalSubmit);

    // Logs
    elements.clearLogsBtn.addEventListener('click', clearLogs);

    // Selected Personal for Task
    elements.personalDropdown.addEventListener('change', (e) => {
        const name = e.target.value;
        if (name && !state.selectedPersonal.includes(name)) {
            state.selectedPersonal.push(name);
            renderSelectedPersonal();
        }
        e.target.value = '';
    });
}

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
    void headerWrapper.offsetWidth; // trigger reflow
    headerWrapper.style.animation = 'slideInSmooth 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';

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
                                ${t.due_date ? 'Due: ' + new Date(t.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'No due date'}
                            </div>
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
    state.personal.forEach(person => {
        const card = document.createElement('div');
        card.className = 'person-card';
        
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

    elements.summaryStats.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">Total Tasks <i data-lucide="layers"></i></div>
            <div class="stat-value">${totalTasks}</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">Completed <i data-lucide="check-circle-2"></i></div>
            <div class="stat-value">${completedTasks}</div>
        </div>
         <div class="stat-card">
            <div class="stat-header">High Priority <i data-lucide="alert-triangle"></i></div>
            <div class="stat-value">${highPriority}</div>
            <div class="stat-trend trend-down">Pending Attention</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">Org Health <i data-lucide="heart"></i></div>
            <div class="stat-value">${healthScore}%</div>
            <div class="stat-trend ${healthScore > 70 ? 'trend-up' : 'trend-down'}">${healthScore > 70 ? 'Optimal' : 'Needs Improvement'}</div>
        </div>
    `;

    elements.summaryBlocks.innerHTML = '';
    state.departments.forEach(dept => {
        const deptTasks = state.tasks.filter(t => t.department === dept);
        const done = deptTasks.filter(t => t.status === 'Completed').length;
        const progress = deptTasks.length > 0 ? Math.round((done / deptTasks.length) * 100) : 0;
        
        let statusClass = 'good';
        if (progress < 40) statusClass = 'critical';
        else if (progress < 70) statusClass = 'warning';

        const block = document.createElement('div');
        block.className = `summary-dept-block ${statusClass}`;
        block.innerHTML = `
            <div class="dept-summary-row" style="display:flex; justify-content:space-between; align-items:center; background:white; padding:1.5rem; border-radius:10px; margin-bottom:1rem; border-left: 6px solid var(--${statusClass === 'good' ? 'success' : statusClass === 'warning' ? 'warning' : 'danger'})">
                <div>
                    <h3 style="margin-bottom:0.25rem">${dept}</h3>
                    <span style="font-size:0.875rem; color:var(--secondary)">${deptTasks.length} Total Tasks | ${done} Completed</span>
                </div>
                <div style="text-align:right">
                    <div style="font-weight:800; font-size:1.25rem">${progress}% Complete</div>
                    <div class="progress-track" style="width:150px; height:6px; margin-top:0.5rem">
                        <div class="progress-fill" style="width:${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
        elements.summaryBlocks.appendChild(block);
    });
}

function renderLogs() {
    elements.logsTbody.innerHTML = state.logs.map(log => `
        <tr>
            <td><span class="log-action-${log.action.toLowerCase()}">${log.action}</span></td>
            <td><strong>${log.task_name || 'N/A'}</strong><br><small>${log.description}</small></td>
            <td>${log.department || '—'}</td>
            <td>${(log.responsible || []).join(', ') || 'System'}</td>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
        </tr>
    `).join('');
    if (state.logs.length === 0) {
        elements.logsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:3rem; color:var(--secondary)">No logs found.</td></tr>';
    }
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
        document.getElementById('task-due-date').value = task.due_date ? task.due_date.split('T')[0] : '';
        document.getElementById('task-description').value = task.description || '';
        state.selectedPersonal = [...(task.responsible || [])];
        renderSelectedPersonal();
        document.getElementById('modal-title').innerText = 'Edit Task';
    } else {
        document.getElementById('task-id').value = '';
        if (dept) document.getElementById('task-department').value = dept;
        document.getElementById('modal-title').innerText = 'Create New Task';
    }

    elements.taskModal.classList.add('active');
}

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
        description: document.getElementById('task-description').value,
        responsible: state.selectedPersonal
    };

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
