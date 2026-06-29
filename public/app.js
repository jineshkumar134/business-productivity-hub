/**
 * Growth Hub – Frontend Logic v2.0
 * CRED-inspired UI | Poppins | Blue + Orange
 */

// ── Auth Guard ──────────────────────────────────────────────────────────────
if (!localStorage.getItem('bh_user')) window.location.href = '/login.html';

// ── Fetch Interceptor for Auth Headers ─────────────────────────────────────────
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    const urlStr = String(url);
    if (urlStr.includes('/api/') && !urlStr.includes('/api/auth/signin')) {
        options.headers = options.headers || {};
        const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
        if (user.role)       options.headers['x-user-role']       = user.role;
        if (user.name)       options.headers['x-user-name']       = user.name;
        if (user.email)      options.headers['x-user-email']      = user.email;
        if (user.department) options.headers['x-user-department'] = user.department;
        
        const activeCompanyId = localStorage.getItem('bh_active_company_id');
        if (activeCompanyId) options.headers['x-company-id'] = activeCompanyId;
    }
    return originalFetch(url, options);
};

// ── Role Hierarchy helpers ──────────────────────────────────────────────────
const ROLE_LEVELS = { admin: 3, dept_leader: 2, employee: 1 };
const ROLE_DISPLAY = {
    admin: '⚙ Admin',
    dept_leader: '📋 Dept Leader', employee: '👤 Employee'
};
function hasMinRole(userRole, minRole) {
    return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minRole] || 0);
}

// ── Dept Config ──────────────────────────────────────────────────────────────
const DEPT_CONFIG = [
    { name:'Product Research',    color:'#6366f1', bg:'rgba(99,102,241,0.12)',  icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>` },
    { name:'Product Development', color:'#0ea5e9', bg:'rgba(14,165,233,0.12)',  icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>` },
    { name:'Product Marketing',   color:'#f97316', bg:'rgba(249,115,22,0.12)',  icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18H3"/><path d="M16 12H3"/><path d="M21 6H3"/><path d="m16 21 5-5-5-5"/></svg>` },
    { name:'Product Selling',     color:'#10b981', bg:'rgba(16,185,129,0.12)',  icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>` },
    { name:'Accounts & Finance',  color:'#8b5cf6', bg:'rgba(139,92,246,0.12)', icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>` },
    { name:'Client Success',      color:'#ec4899', bg:'rgba(236,72,153,0.12)',  icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>` },
    { name:'HR Department',       color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
];
const getDeptConfig = (name) => {
    // Check dynamic departments first (they carry color+bg)
    const dyn = state?.deptObjects?.find(d => d.name === name);
    if (dyn) {
        const fallbackIcon = DEPT_CONFIG.find(d=>d.name===name)?.icon || defaultDeptIcon();
        const icon = (dyn.icon && dyn.icon !== 'building') ? dyn.icon : fallbackIcon;
        return { color: dyn.color, bg: dyn.bg, icon };
    }
    return DEPT_CONFIG.find(d => d.name === name) || { color:'#6366f1', bg:'rgba(99,102,241,0.12)', icon: defaultDeptIcon() };
};
function defaultDeptIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`;
}

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
    currentView: 'dashboard',
    tasks: [], personal: [], logs: [], documents: [],
    deptObjects: [],   // full department objects from DB
    deptStages: [],    // custom department stages list
    selectedPersonal: [],
    departments: DEPT_CONFIG.map(d => d.name), // names only, synced from deptObjects
    orgVision: localStorage.getItem('bh_vision') || '',
    orgMission: localStorage.getItem('bh_mission') || '',
    searchQuery: '',
    personPhotoData: '',
    theme: localStorage.getItem('bh_theme') || 'light',
    pendingUploadFile: null
};

// ── DOM Refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = {
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view'),
    viewTitle: $('view-title'),
    viewDesc: $('view-desc'),
    moduleGrid: $('module-grid'),
    personalGrid: $('personal-grid'),
    logsTbody: $('logs-tbody'),
    taskModal: $('task-modal'),
    personalModal: $('personal-modal'),
    taskForm: $('task-form'),
    personalForm: $('personal-form'),
    closeModalBtns: document.querySelectorAll('.close-modal'),
    addTaskGlobalBtn: $('add-task-global'),
    addPersonalBtn: $('add-personal-btn'),
    personalDropdown: $('personal-dropdown'),
    selectedPersonalList: $('selected-personal-list'),
    summaryStats: $('summary-stats'),
    summaryBlocks: $('summary-blocks'),
    sidebar: $('sidebar'),
    sidebarToggle: $('sidebar-toggle'),
    analyzeLogsBtn: $('analyze-logs-btn'),
    aiInsightsContainer: $('ai-insights-container'),
    aiReportContent: $('ai-report-content'),
    delayReasonGroup: $('delay-reason-group'),
    completedDateGroup: $('completed-date-group'),
    profileModal: $('profile-modal'),
    exportAiBtn: $('export-ai-btn'),
    themeToggle: $('theme-toggle'),
    themeIcon: $('theme-icon'),
    docFileInput: $('doc-file-input'),
    documentModal: $('document-modal'),
    documentForm: $('document-form'),
    documentsTbody: $('documents-tbody'),
    docSearch: $('doc-search'),
    docCategoryFilter: $('doc-category-filter')
};

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
    applyTheme();
    setupRoleAccess();     // hides/shows items based on role level
    setupEventListeners();
    renderUserGreeting();
    loadVisionMission();
    await loadCompanies();
    await fetchData();     // load data first
    populateStageDeptDropdown();
    
    // Set initial view AFTER data is loaded
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const isHighLevel = hasMinRole(user.role, 'dept_leader');
    switchView(isHighLevel ? 'dashboard' : 'my-portal');

    // Start background polling for real-time updates (every 4 seconds)
    setInterval(syncDataInBackground, 4000);
}

async function syncDataInBackground() {
    try {
        if (!localStorage.getItem('bh_user')) return;

        const activeCompanyId = localStorage.getItem('bh_active_company_id') || '';
        const [tRes, pRes, lRes, dRes, deptsRes, stagesRes] = await Promise.all([
            fetch('/api/tasks').then(r => r.json()),
            fetch('/api/personal').then(r => r.json()),
            fetch('/api/logs').then(r => r.json()),
            fetch('/api/documents').then(r => r.json()).catch(() => []),
            fetch('/api/departments').then(r => r.json()).catch(() => []),
            activeCompanyId ? fetch(`/api/dept-stages?companyId=${activeCompanyId}`).then(r => r.json()).catch(() => null) : Promise.resolve(null)
        ]);

        const tasksChanged = JSON.stringify(state.tasks) !== JSON.stringify(tRes);
        const personalChanged = JSON.stringify(state.personal) !== JSON.stringify(pRes);
        const logsChanged = JSON.stringify(state.logs) !== JSON.stringify(lRes);
        const docsChanged = JSON.stringify(state.documents) !== JSON.stringify(dRes);
        const stagesChanged = stagesRes !== null && JSON.stringify(state.deptStages) !== JSON.stringify(stagesRes);
        
        const deptNames = deptsRes.map(d => d.name);
        const deptsChanged = JSON.stringify(state.departments) !== JSON.stringify(deptNames);

        let shouldRender = tasksChanged || personalChanged || logsChanged || docsChanged || deptsChanged || stagesChanged;

        if (tasksChanged) state.tasks = tRes;
        if (personalChanged) state.personal = pRes;
        if (logsChanged) state.logs = lRes;
        if (docsChanged) state.documents = dRes;
        if (stagesChanged) state.deptStages = stagesRes;
        
        if (deptsChanged) {
            state.deptObjects = deptsRes;
            state.departments = deptNames;
            populateDeptDropdowns();
        }

        if (deptsChanged || personalChanged) {
            populateHierarchyDropdowns();
        }

        // Always re-render admin dept list if stages or personal changed
        if ((stagesChanged || personalChanged) && state.currentView === 'admin') {
            renderDeptAdminList();
        }

        if (shouldRender) {
            renderAll();
        }

        // If task modal is open, keep comments list fresh in real-time
        const modal = $('task-modal');
        const activeTaskId = (modal && modal.classList.contains('active')) ? $('task-id').value : null;
        if (activeTaskId) {
            const task = state.tasks.find(t => t._id === activeTaskId || t.id === activeTaskId);
            if (task) {
                renderTaskComments(task.comments || []);
            }
        }
    } catch (err) {
        console.warn('Sync failed:', err);
    }
}

function setupRoleAccess() {
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const role = user.role || 'employee';

    // [data-admin-only] → admin
    document.querySelectorAll('[data-admin-only="true"]').forEach(el => {
        el.style.display = hasMinRole(role, 'admin') ? '' : 'none';
    });

    // [data-min-role] attribute → show only if user meets minimum level
    document.querySelectorAll('[data-min-role]').forEach(el => {
        const minRole = el.getAttribute('data-min-role');
        el.style.display = hasMinRole(role, minRole) ? '' : 'none';
    });

    // Employee cannot see HR section
    const hrNav = document.getElementById('nav-hr');
    if (hrNav) hrNav.style.display = hasMinRole(role, 'dept_leader') ? '' : 'none';

    // Dashboard only for dept_leader and above
    const dashNav = document.getElementById('nav-dashboard');
    if (dashNav) dashNav.style.display = hasMinRole(role, 'dept_leader') ? '' : 'none';

    // Admin panel only for admin
    const adminNav = document.getElementById('nav-admin');
    if (adminNav) adminNav.style.display = hasMinRole(role, 'admin') ? '' : 'none';

    // Summary only for dept_leader+
    const summaryNav = document.getElementById('nav-summary');
    if (summaryNav) summaryNav.style.display = hasMinRole(role, 'dept_leader') ? '' : 'none';

    // Invoicing + Activity log hidden always (per previous request)
    const invoicingNav = document.getElementById('nav-invoicing');
    const logsNav      = document.getElementById('nav-logs');
    if (invoicingNav) invoicingNav.style.display = 'none';
    if (logsNav)      logsNav.style.display      = 'none';
}

function applyTheme() {
    if (state.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    updateThemeIcon();
}

function loadVisionMission() {
    const vEl = $('org-vision'), mEl = $('org-mission');
    if (vEl) vEl.value = state.orgVision;
    if (mEl) mEl.value = state.orgMission;
}

// ── EVENT LISTENERS ───────────────────────────────────────────────────────────
function setupEventListeners() {
    // Nav
    el.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            if (view) switchView(view);
        });
    });

    // Sidebar toggle
    el.sidebarToggle?.addEventListener('click', () => {
        el.sidebar.classList.toggle('collapsed');
        const c = el.sidebar.classList.contains('collapsed');
        el.sidebarToggle.innerHTML = c
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
    });

    // Expand sidebar if clicking on the logo when collapsed
    document.querySelector('.logo')?.addEventListener('click', () => {
        if (el.sidebar.classList.contains('collapsed')) {
            el.sidebar.classList.remove('collapsed');
            if (el.sidebarToggle) {
                el.sidebarToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
            }
        }
    });

    // Modals
    el.addTaskGlobalBtn?.addEventListener('click', () => openTaskModal());
    el.addPersonalBtn?.addEventListener('click', () => openPersonalModal());
    el.analyzeLogsBtn?.addEventListener('click', handleAIAnalysis);

    el.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            el.taskModal?.classList.remove('active');
            el.personalModal?.classList.remove('active');
            el.profileModal?.classList.remove('active');
            el.documentModal?.classList.remove('active');
        });
    });

    // Close modal on backdrop click
    [el.taskModal, el.personalModal, el.profileModal, el.documentModal].forEach(m => {
        m?.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
    });

    // Document file selector
    el.docFileInput?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        $('doc-display-name').value = file.name;
        $('doc-category').value = 'Other';
        $('doc-description').value = '';
        state.pendingUploadFile = file;
        el.documentModal.classList.add('active');
    });

    // Document form submit
    el.documentForm?.addEventListener('submit', handleDocumentSubmit);

    // Document filters
    $('doc-search')?.addEventListener('input', renderDocuments);
    $('doc-category-filter')?.addEventListener('change', renderDocuments);

    // Forms
    el.taskForm?.addEventListener('submit', handleTaskSubmit);
    el.personalForm?.addEventListener('submit', handlePersonalSubmit);

    // Comments
    $('btn-add-comment')?.addEventListener('click', handleCommentSubmit);

    // Personal selector
    el.personalDropdown?.addEventListener('change', e => {
        const name = e.target.value;
        if (name && !state.selectedPersonal.includes(name)) {
            state.selectedPersonal.push(name);
            renderSelectedPersonal();
        }
        e.target.value = '';
    });

    // Task field constraints
    document.querySelectorAll('input[name="task-status"]').forEach(r => r.addEventListener('change', checkTaskConstraints));
    $('task-completed-date')?.addEventListener('change', checkTaskConstraints);
    $('task-due-date')?.addEventListener('change', checkTaskConstraints);

    // Person name → preview initial
    $('person-name')?.addEventListener('input', e => {
        const init = $('person-preview-initial');
        if (init) init.textContent = e.target.value.charAt(0).toUpperCase() || '?';
    });

    // Photo uploads
    $('profile-img-input')?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const wrap = $('profile-initial');
            if (wrap) {
                wrap.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`;
            }
            // persist
            const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
            user.photo = ev.target.result;
            localStorage.setItem('bh_user', JSON.stringify(user));
            updateHeaderAvatar(ev.target.result, user.name || '');
        };
        reader.readAsDataURL(file);
    });

    $('person-photo-input')?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            state.personPhotoData = ev.target.result;
            const prev = $('person-preview-avatar');
            if (prev) {
                const init = prev.querySelector('span');
                if (init) init.style.display = 'none';
                let img = prev.querySelector('img');
                if (!img) { img = document.createElement('img'); img.style.cssText='width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:18px;'; prev.appendChild(img); }
                img.src = ev.target.result;
            }
            $('person-photo-data').value = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Search - works on ALL views
    $('global-search')?.addEventListener('input', e => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderAll();
    });

    // Save vision/mission
    $('save-vision-btn')?.addEventListener('click', () => {
        state.orgVision = $('org-vision')?.value || '';
        state.orgMission = $('org-mission')?.value || '';
        localStorage.setItem('bh_vision', state.orgVision);
        localStorage.setItem('bh_mission', state.orgMission);
        showNotification('Vision & Mission saved!', 'success');
    });

    // Run AI analysis  
    $('run-ai-btn')?.addEventListener('click', handleAIAlignmentAnalysis);

    // Export PDF
    el.exportAiBtn?.addEventListener('click', () => exportToPDF('ai-results-area', 'AI_Strategic_Alignment.pdf'));

    // Theme Toggle
    el.themeToggle?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    state.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('bh_theme', state.theme);
    updateThemeIcon();
    
    // Also notify if it's a significant change
    showNotification(`${isDark ? 'Dark' : 'Light'} theme applied`, 'success');
}

function updateThemeIcon() {
    if (!el.themeIcon) return;
    if (state.theme === 'dark') {
        el.themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    } else {
        el.themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }
}

async function exportToPDF(elementId, filename) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const opt = {
        margin: [10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
        showNotification('Generating PDF...', 'success');
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        showNotification('PDF Export failed', 'error');
    }
}

function checkTaskConstraints() {
    const status = document.querySelector('input[name="task-status"]:checked')?.value || 'Not Started';
    const isCompleted = status === 'Completed';
    const dueDate = $('task-due-date').value;
    const compDate = $('task-completed-date').value;
    el.completedDateGroup.style.display = isCompleted ? 'block' : 'none';
    if (isCompleted && dueDate && compDate) {
        const late = new Date(compDate) > new Date(dueDate);
        el.delayReasonGroup.style.display = late ? 'block' : 'none';
    } else {
        el.delayReasonGroup.style.display = 'none';
    }
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const role = user.role || 'employee';
    const isAdmin = role === 'admin';
    const isManager = role === 'admin' || role === 'dept_leader';
    const isLocked = $('task-is-locked')?.checked;
    const isNewTask = !$('task-id').value;

    el.taskForm.querySelectorAll('input:not([type="radio"]), select, textarea').forEach(inp => {
        // IDs that employees (non-managers) can edit
        const staffEditable = ['task-progress', 'task-completed-date', 'task-delay-reason', 'task-new-comment', 'task-current-stage'];
        
        let shouldDisable = isCompleted || (isLocked && !isAdmin);
        if (!isManager && !isNewTask && !staffEditable.includes(inp.id)) {
            shouldDisable = true; // Non-managers can't edit core fields of EXISTING tasks
        }

        if (!['task-completed-date','task-due-date','task-delay-reason','task-id'].includes(inp.id) || (!isManager && !isNewTask)) {
            // Keep completed date editable if completed, but if it's a field they shouldn't edit, disable it
            if (isCompleted && inp.id === 'task-completed-date' && (isManager || isNewTask)) shouldDisable = false;
            inp.disabled = shouldDisable;
        }
    });

    el.taskForm.querySelectorAll('input[type="radio"]').forEach(inp => {
        let shouldDisable = isCompleted || (isLocked && !isAdmin);
        if (!isManager && !isNewTask && inp.name !== 'task-status') {
            shouldDisable = true; // Non-managers can't edit priority of existing tasks
        }
        inp.disabled = shouldDisable;
    });

    const pDrop = $('personal-dropdown');
    if(pDrop) pDrop.disabled = isCompleted || (isLocked && !isAdmin) || (!isManager && !isNewTask);
    
    // Always enable the new comment field and post button
    const commentInp = $('task-new-comment');
    const commentBtn = $('btn-add-comment');
    if (commentInp) commentInp.disabled = false;
    if (commentBtn) commentBtn.disabled = false;
    
    // Save button disabled if locked and not admin
    const saveBtn = $('save-task-btn');
    if (saveBtn) saveBtn.disabled = isLocked && !isAdmin;
}

function renderUserGreeting() {
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const nameEl = $('header-user-name');
    if (nameEl) {
        let displayName = user.name || 'User';
        if ((user.role === 'department_leader' || user.role === 'employee') && user.department) {
            displayName = `${displayName} (${user.department})`;
        }
        nameEl.textContent = displayName;
    }
    updateHeaderAvatar(user.photo, user.name || 'U');
}

function updateHeaderAvatar(photo, name) {
    const wrap = $('header-avatar-wrap');
    if (!wrap) return;
    if (photo) {
        wrap.innerHTML = `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        wrap.innerHTML = `<span id="header-avatar-initial">${(name || 'U').charAt(0).toUpperCase()}</span>`;
    }
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
function handleLogout() {
    localStorage.removeItem('bh_user');
    window.location.href = '/login.html';
}
window.handleLogout = handleLogout;

// ── VIEW SWITCHER ─────────────────────────────────────────────────────────────
const VIEW_META = {
    'my-portal': { t:'My Portal',                  d:'Manage your assigned tasks and collaborate.' },
    dashboard: { t:'Dashboard Overview',           d:'Monitor organizational performance in real-time.' },
    summary:   { t:'Organizational Working',        d:'Live pipeline and health of all departments.' },
    ai:           { t:'AI Analysis Admin Panel',     d:'Ask the AI assistant anything — tasks, departments, or general questions.' },
    'ai-insights':{ t:'AI Strategic Alignment',      d:'Evaluate task alignment with your organization\'s vision & mission.' },
    hr:        { t:'Team Management',               d:'Manage personnel and define core responsibilities.' },
    logs:      { t:'Activity Logs',                 d:'Full audit trail of all system changes and task updates.' },
    invoicing: { t:'Invoicing Calculator',          d:'Estimate GST and TDS for your transactions with ease.' },
    documents: { t:'Document Center',               d:'Upload and manage core organizational files and documents.' },
    admin:     { t:'Admin Panel',                    d:'Create and manage user accounts. Admin access only.' },
};
function switchView(viewName) {
    state.currentView = viewName;
    el.navItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-view') === viewName));
    el.views.forEach(v => v.classList.toggle('active', v.id === `${viewName}-view`));
    const meta = VIEW_META[viewName] || { t:'', d:'' };
    el.viewTitle.textContent = meta.t;
    el.viewDesc.textContent = meta.d;
    renderAll();
    if (viewName === 'admin') {
        renderDeptAdminList();
        populateHierarchyDropdowns();
    }
}

// ── DATA ──────────────────────────────────────────────────────────────────────
async function fetchData() {
    try {
        const activeCompanyId = localStorage.getItem('bh_active_company_id') || '';
        const [tRes, pRes, lRes, dRes, deptsRes, stagesRes] = await Promise.all([
            fetch('/api/tasks').then(r => r.json()),
            fetch('/api/personal').then(r => r.json()),
            fetch('/api/logs').then(r => r.json()),
            fetch('/api/documents').then(r => r.json()).catch(() => []),
            fetch('/api/departments').then(r => r.json()).catch(() => []),
            activeCompanyId ? fetch(`/api/dept-stages?companyId=${activeCompanyId}`).then(r => r.json()).catch(() => []) : Promise.resolve([])
        ]);
        state.tasks = tRes; state.personal = pRes; state.logs = lRes; state.documents = dRes;
        state.deptStages = stagesRes || [];

        state.deptObjects = deptsRes || [];
        state.departments = (deptsRes || []).map(d => d.name);

        populateDeptDropdowns();
        populateHierarchyDropdowns();
        renderDeptAdminList();
    } catch(err) { showNotification('Error fetching data', 'error'); }
}

async function seedDefaultDepartments() {
    try {
        const promises = DEPT_CONFIG.map(d => fetch('/api/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: d.name, color: d.color, bg: d.bg })
        }).then(r => r.json()).catch(() => null));
        const results = await Promise.all(promises);
        const saved = results.filter(Boolean);
        // Fetch fresh list
        const fresh = await fetch('/api/departments').then(r => r.json()).catch(() => []);
        state.deptObjects = fresh.length ? fresh : DEPT_CONFIG.map(d => ({...d, _id: d.name}));
        state.departments = state.deptObjects.map(d => d.name);
    } catch(e) {
        // Fallback to hardcoded
        state.deptObjects = DEPT_CONFIG.map(d => ({...d, _id: d.name}));
        state.departments = DEPT_CONFIG.map(d => d.name);
    }
}

function populateDeptDropdowns() {
    const depts = state.departments;
    const selects = [
        document.getElementById('task-department'),
        document.getElementById('task-requested-by'),
        document.getElementById('person-dept'),
        document.getElementById('admin-new-dept')
    ];
    selects.forEach(sel => {
        if (!sel) return;
        const isRequestedBy = sel.id === 'task-requested-by';
        const isAdminDept = sel.id === 'admin-new-dept';
        const currentVal = sel.value;
        if (isRequestedBy) {
            sel.innerHTML = '<option value="">Self</option>';
        } else if (isAdminDept) {
            sel.innerHTML = '<option value="">None / Select Department</option>';
        } else {
            sel.innerHTML = '';
        }
        depts.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            sel.appendChild(opt);
        });
        // restore previous value if still valid
        if (currentVal && (depts.includes(currentVal) || currentVal === "")) sel.value = currentVal;
    });

    // When dept changes inside the task modal, refresh stage options
    const deptSel = document.getElementById('task-department');
    if (deptSel && !deptSel._stageListenerAdded) {
        deptSel.addEventListener('change', () => {
            populateTaskStageDropdown(deptSel.value, '');
        });
        deptSel._stageListenerAdded = true;
    }
}

function renderAll() {
    const v = state.currentView;
    if (v === 'dashboard') renderDashboard();
    else if (v === 'summary') renderSummary();
    else if (v === 'ai') renderAIView();
    else if (v === 'hr') renderPersonal();
    else if (v === 'logs') renderLogs();
    else if (v === 'documents') renderDocuments();
    else if (v === 'my-portal') renderMyPortal();
    renderPersonalDropdown();
}

// ── MY PORTAL ─────────────────────────────────────────────────────────────────
function renderMyPortal() {
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const myName = user.name;
    
    // Show role badge
    const badge = $('portal-role-badge');
    if (badge) {
        badge.textContent = ROLE_DISPLAY[user.role] || user.role || '👤 Employee';
        badge.style.background = 'rgba(99,102,241,0.12)';
        badge.style.color = 'var(--primary)';
    }
    
    // Show all tasks returned by backend (backend already handles secure role-based scoping and visibility toggles)
    let myTasks = [...state.tasks];
    
    if (state.searchQuery) {
        myTasks = myTasks.filter(t => 
            t.task_name?.toLowerCase().includes(state.searchQuery) || 
            t.description?.toLowerCase().includes(state.searchQuery) ||
            (t.responsible && t.responsible.some(r => r.toLowerCase().includes(state.searchQuery))) ||
            t.requested_by?.toLowerCase().includes(state.searchQuery) ||
            t.department?.toLowerCase().includes(state.searchQuery)
        );
    }

    const todo = myTasks.filter(t => t.status === 'Not Started');
    const inProg = myTasks.filter(t => t.status === 'In Progress');
    const comp = myTasks.filter(t => t.status === 'Completed');

    if ($('portal-todo-count')) $('portal-todo-count').textContent = todo.length;
    if ($('portal-inprog-count')) $('portal-inprog-count').textContent = inProg.length;
    if ($('portal-comp-count')) $('portal-comp-count').textContent = comp.length;

    const isAdmin = user.role === 'admin';
    const emptyMsg = myTasks.length === 0 && isAdmin
        ? 'No tasks assigned to you yet. You can assign tasks to yourself from the Dashboard.'
        : 'No tasks here yet.';

    const renderList = (tasks, containerId) => {
        const c = $(containerId);
        if (!c) return;
        if (tasks.length === 0) {
            c.innerHTML = `<div style="color:var(--gray-400);font-size:0.8rem;text-align:center;padding:1rem 0;">${tasks === todo && myTasks.length === 0 ? emptyMsg : 'No tasks'}</div>`;
            return;
        }
        c.innerHTML = tasks.map(t => {
            const dateStr = t.due_date ? new Date(t.due_date).toLocaleDateString('en', { month:'short', day:'numeric' }) : 'No date';
            const overdue = t.status !== 'Completed' && t.due_date && new Date(t.due_date) < new Date() ? 'color:var(--danger);' : '';
            const commentCount = (t.comments || []).length;
            const cfg = getDeptConfig(t.department || '');
            return `
            <div class="task-item" onclick="openTaskModal('${t._id}', null)" style="background:var(--card-bg);border:1px solid var(--gray-200);border-radius:var(--radius-sm);padding:0.85rem;cursor:pointer;transition:transform 0.2s, box-shadow 0.2s;position:relative;">
                <div style="font-weight:600;font-size:0.85rem;color:var(--dark);margin-bottom:0.3rem;">${t.task_name} ${t.is_locked ? '<span style="font-size:0.75rem;" title="Locked">🔒</span>' : ''}</div>
                <div style="font-size:0.75rem;color:var(--secondary);margin-bottom:0.4rem;">${t.department || 'No Dept'}</div>
                ${t.currentStage ? `<div style="margin-bottom:0.45rem;"><span style="font-size:0.68rem;font-weight:700;padding:2px 9px;border-radius:12px;background:${cfg.color}15;color:${cfg.color};border:1px solid ${cfg.color}30;">📍 ${t.currentStage}</span></div>` : ''}
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.3rem;">
                    <span style="font-size:0.72rem;font-weight:600;${overdue}">📅 ${dateStr}</span>
                    <div style="display:flex;gap:0.4rem;align-items:center;">
                        ${commentCount > 0 ? `<span style="font-size:0.7rem;color:var(--secondary);">💬 ${commentCount}</span>` : ''}
                        <span style="background:var(--gray-100);padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:600;">${t.progress}%</span>
                        <span class="priority-${(t.priority||'medium').toLowerCase()}" style="font-size:0.68rem;">${t.priority}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    };

    renderList(todo, 'portal-todo-list');
    renderList(inProg, 'portal-inprogress-list');
    renderList(comp, 'portal-completed-list');
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard() {
    const tasks = state.searchQuery
        ? state.tasks.filter(t => 
            t.task_name?.toLowerCase().includes(state.searchQuery) || 
            t.description?.toLowerCase().includes(state.searchQuery) ||
            (t.responsible && t.responsible.some(r => r.toLowerCase().includes(state.searchQuery))) ||
            t.requested_by?.toLowerCase().includes(state.searchQuery) ||
            t.department?.toLowerCase().includes(state.searchQuery)
          )
        : state.tasks;

    const total = tasks.length;
    const done  = tasks.filter(t => t.status === 'Completed').length;
    const inProg = tasks.filter(t => t.status === 'In Progress').length;
    const overall = total > 0 ? Math.round((done / total) * 100) : 0;

    // Banner
    const banner = $('dashboard-stats-banner');
    banner.innerHTML = `
        ${statBannerCard('rgba(37,99,235,0.1)','#2563eb', svgIcon('layers'), 'Total Tasks', `<span id="b-total">0</span>`)}
        ${statBannerCard('rgba(16,185,129,0.1)','#10b981', svgIcon('check-circle'), 'Completed', `<span id="b-done">0</span>`)}
        ${statBannerCard('rgba(249,115,22,0.1)','#f97316', svgIcon('loader'), 'In Progress', `<span id="b-prog">0</span>`)}
        <div class="banner-stat banner-progress">
            <div style="width:100%;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                    <span class="banner-stat-label">Overall Progress</span>
                    <span style="font-size:0.85rem;font-weight:800;color:var(--primary);" id="b-pct">0%</span>
                </div>
                <div class="progress-track-thin"><div class="progress-fill-thin" id="b-bar" style="width:0%;background:linear-gradient(90deg,var(--primary),var(--orange));"></div></div>
            </div>
        </div>
    `;
    setTimeout(() => {
        animVal($('b-total'), total);
        animVal($('b-done'), done);
        animVal($('b-prog'), inProg);
        const pct = $('b-pct'); if (pct) pct.textContent = overall + '%';
        const bar = $('b-bar'); if (bar) bar.style.width = overall + '%';
    }, 80);

    // Risk Alerts
    const riskAlerts = $('dashboard-risk-alerts');
    if (riskAlerts) {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const highRiskTasks = tasks.filter(t => {
            if (t.status === 'Completed') return false;
            let isOverdue = false;
            if (t.due_date) {
                const due = new Date(t.due_date);
                due.setHours(0,0,0,0);
                if (due < today) isOverdue = true;
            }
            return t.priority === 'High' || isOverdue || t.delay_reason;
        });

        if (highRiskTasks.length > 0) {
            riskAlerts.style.display = 'flex';
            riskAlerts.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 1rem 1.5rem;">
                    <h3 style="color: #ef4444; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; font-weight: 700;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        High Risk & Overdue Alerts
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${highRiskTasks.map(t => {
                            let reason = t.delay_reason ? t.delay_reason : (t.priority === 'High' ? 'High priority pending task.' : 'Task is overdue.');
                            let isOverdue = false;
                            if (t.due_date) {
                                const due = new Date(t.due_date); due.setHours(0,0,0,0);
                                if (due < today) isOverdue = true;
                            }
                            return `
                            <div style="background: var(--card-bg); padding: 0.8rem 1rem; border-radius: 8px; border-left: 4px solid #ef4444; display: flex; flex-direction: column; gap: 0.3rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); cursor: pointer;" onclick="openTaskModal('${t._id}')">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <span style="font-weight: 700; font-size: 0.9rem; color: var(--dark);">${t.task_name}</span>
                                    <span style="font-size: 0.7rem; font-weight: 700; background: ${isOverdue ? '#ef4444' : '#f97316'}; color: white; padding: 0.15rem 0.5rem; border-radius: 20px;">${isOverdue ? 'Overdue' : 'High Risk'}</span>
                                </div>
                                <div style="font-size: 0.8rem; color: var(--secondary);">
                                    <strong>Why it's at risk / not done:</strong> ${reason}
                                </div>
                                <div style="font-size: 0.75rem; color: #ef4444; margin-top: 0.2rem; font-weight: 600;">
                                    Assigned to: ${(t.responsible||[]).join(', ')||'Unassigned'} • Dept: ${t.department}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            riskAlerts.style.display = 'none';
        }
    }

    // Module cards
    el.moduleGrid.innerHTML = '';
    state.departments.forEach(dept => {
        const cfg = getDeptConfig(dept);
        const deptTasks = tasks.filter(t => t.department === dept);
        const doneCount = deptTasks.filter(t => t.status === 'Completed').length;
        const prog = deptTasks.length > 0 ? Math.round((doneCount / deptTasks.length) * 100) : 0;
        const leads = state.personal.filter(p => p.department === dept && (p.role||'').toLowerCase().includes('lead'));

        const card = document.createElement('div');
        card.className = 'module-card';
        card.style.setProperty('--dept-color', cfg.color);
        card.style.cssText += `--dept-color:${cfg.color};`;
        card.innerHTML = `
            <style>#mc-${dept.replace(/\W/g,'')}{}</style>
            <div class="module-card-header">
                <div class="module-title-row">
                    <div class="module-icon-wrap" style="background:${cfg.bg};color:${cfg.color};">${cfg.icon}</div>
                    <h3 class="module-name">${dept}</h3>
                </div>
                <span class="module-stats-pill">${doneCount}/${deptTasks.length}</span>
            </div>
            <div class="module-progress-section">
                <div class="progress-info"><span>Performance</span><span style="color:${cfg.color};font-weight:800;">${prog}%</span></div>
                <div class="progress-track"><div class="progress-fill" style="width:${prog}%;background:linear-gradient(90deg,${cfg.color},${cfg.color}99);"></div></div>
            </div>
            ${leads.length > 0 ? `
            <div style="background:var(--gray-50);border:1px solid var(--gray-100);border-radius:10px;padding:0.6rem 0.75rem;">
                <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;color:var(--secondary);letter-spacing:0.06em;margin-bottom:0.4rem;">Team Lead</div>
                ${leads.map(p=>`
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;">
                    <span style="font-weight:600;color:var(--dark);">${p.name}</span>
                    <span style="font-size:0.65rem;font-weight:600;color:${cfg.color};background:${cfg.bg};padding:0.1rem 0.45rem;border-radius:50px;">${p.role}</span>
                </div>`).join('')}
            </div>` : ''}
            <div class="task-list-mini">
                ${deptTasks.length === 0 ? '<p class="empty-msg">No tasks yet. Add one below!</p>' : deptTasks.map(t => `
                <div class="mini-task-item" onclick="openTaskModal('${t._id}')">
                    <div class="mini-task-row">
                        <div style="flex-grow:1;">
                            <div class="mini-task-content" style="font-weight:700;font-size:0.88rem;">${t.task_name} ${t.is_locked ? '<span style="font-size:0.75rem;" title="Locked">🔒</span>' : ''}</div>
                            ${t.description ? `<div style="font-size:0.72rem;color:var(--secondary);margin-top:0.2rem;line-height:1.4;">${t.description.slice(0,80)}${t.description.length>80?'…':''}</div>` : ''}
                        </div>
                        <button class="mini-delete-btn" onclick="event.stopPropagation();deleteTask('${t._id}')" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.5rem;font-size:0.7rem;color:var(--secondary);">
                        <span style="display:flex;align-items:center;gap:0.25rem;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            ${(t.responsible||[]).join(', ')||'Unassigned'}
                        </span>
                        <span style="display:flex;align-items:center;gap:0.25rem;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            ${t.due_date ? new Date(t.due_date).toLocaleDateString('en',{month:'short',day:'numeric'}) : 'No date'}
                        </span>
                        ${t.requested_by && t.requested_by !== dept ? `<span style="color:var(--primary);font-weight:700;">↔ ${t.requested_by}</span>` : ''}
                    </div>
                    <div class="mini-task-meta" style="display:flex; gap:0.25rem; align-items:center; flex-wrap:wrap;">
                        <span class="status-badge status-${t.status.toLowerCase().replace(' ','')}">${t.status}</span>
                        <span class="priority-${t.priority.toLowerCase()}">${t.priority}</span>
                        ${t.currentStage ? `<span style="background:${cfg.color}15;color:${cfg.color};border:1px solid ${cfg.color}30;padding:2px 8px;border-radius:12px;font-size:0.68rem;font-weight:700;">📍 ${t.currentStage}</span>` : ''}
                    </div>
                </div>`).join('')}
            </div>
            <button class="add-task-btn-small" onclick="openTaskModal(null,'${dept}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Task
            </button>
        `;
        // set ::before color via inline style trick
        card.style.setProperty('--card-accent', cfg.color);
        card.setAttribute('style', card.getAttribute('style') + `--card-accent:${cfg.color};`);
        // We apply border-top bar using a real element
        const bar2 = document.createElement('div');
        bar2.style.cssText = `position:absolute;top:0;left:0;width:100%;height:4px;background:${cfg.color};border-radius:20px 20px 0 0;`;
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.prepend(bar2);
        el.moduleGrid.appendChild(card);
    });
    renderDashboardPipelineFeed(tasks);
}

// ── SUMMARY / ORG WORKING ─────────────────────────────────────────────────────
function renderSummary() {
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.status === 'Completed').length;
    const healthScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const healthColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444';

    // ── Stats row (hidden on print via CSS) ──
    el.summaryStats.innerHTML = `
        <div class="stat-card"><div class="stat-header"><span>Total Tasks</span></div><div class="stat-value" id="s-total">0</div><div class="stat-trend">${state.departments.length} departments</div></div>
        <div class="stat-card"><div class="stat-header"><span>Completed</span></div><div class="stat-value" id="s-done" style="color:var(--success);">0</div><div class="stat-trend trend-up">↑ ${totalTasks > 0 ? Math.round(completedTasks/totalTasks*100) : 0}% rate</div></div>
        <div class="stat-card"><div class="stat-header"><span>High Risk</span></div><div class="stat-value" id="s-risk" style="color:var(--danger);">0</div><div class="stat-trend trend-down">High priority pending</div></div>
        <div class="stat-card"><div class="stat-header"><span>Org Health</span></div><div class="stat-value" id="s-health" style="color:${healthColor};">0%</div><div class="stat-trend" style="color:${healthColor};">${healthScore>=70?'Healthy 🟢':healthScore>=40?'Moderate 🟡':'Critical 🔴'}</div></div>
    `;
    setTimeout(() => {
        animVal($('s-total'), totalTasks);
        animVal($('s-done'), completedTasks);
        animVal($('s-risk'), state.tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length);
        const sh = $('s-health'); if(sh){let i=0;const t2=setInterval(()=>{sh.textContent=(i++)+'%';if(i>healthScore)clearInterval(t2);},12);}
    }, 80);

    // ── Pipeline section (replaces old pipeline-container + summary-blocks) ──
    const pipelineEl = $('pipeline-container');
    const blocksEl = el.summaryBlocks;

    // Build the full pipeline viz in the pipeline-container,
    // hide summary-blocks (no longer needed in this design)
    blocksEl.innerHTML = '';
    blocksEl.style.display = 'none';

    if (!pipelineEl) return;

    // Compute per-dept data
    const deptData = state.departments.map(dept => {
        const cfg = getDeptConfig(dept);
        const tasks = state.tasks.filter(t => t.department === dept);
        const done = tasks.filter(t => t.status === 'Completed').length;
        const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
        const nodeColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
        const shortName = dept.replace('Product ', '').replace(' Department', '').replace(' & ', '\n& ');
        return { dept, cfg, tasks, done, pct, nodeColor, shortName };
    });

    // Gradient rope color (blend from first to last dept color)
    const ropeGradient = `linear-gradient(90deg, ${deptData.map((d,i)=>`${d.nodeColor} ${Math.round(i/(deptData.length-1)*100)}%`).join(', ')})`;

    pipelineEl.innerHTML = `
    <div class="pipeline-viz-wrap">
        <!-- Header: Legend + Print + Org Health -->
        <div class="pipeline-viz-header">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div class="pipeline-legend">
                    <div class="legend-item" style="color:#10b981;">
                        <span class="legend-dot" style="background:#10b981;box-shadow:0 0 6px #10b981;"></span>HEALTHY
                    </div>
                    <div class="legend-item" style="color:#f59e0b;">
                        <span class="legend-dot" style="background:#f59e0b;"></span>RISK
                    </div>
                    <div class="legend-item" style="color:#ef4444;">
                        <span class="legend-dot" style="background:#ef4444;"></span>CRITICAL
                    </div>
                </div>
                <button class="btn-print" onclick="window.print()" title="Print / Export">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print / Export
                </button>
            </div>
            <div class="pipeline-org-health">
                <div class="label">ORG HEALTH</div>
                <div class="value" style="color:${healthColor};">${healthScore}%</div>
                <div style="display:flex;justify-content:flex-end;margin-top:0.3rem;">
                    <div class="health-bar-wrap" style="width:120px;height:5px;background:#f1f5f9;border-radius:10px;overflow:hidden;">
                        <div class="health-bar-fill" style="width:0%;height:100%;background:${healthColor};border-radius:10px;transition:width 1s ease;" id="health-bar-fill"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Rope Pipeline -->
        <div class="pipeline-track-wrap">

            <!-- Row 1: horizontal rope + circle nodes -->
            <div class="pipeline-rope-row" style="height:90px;">
                <div class="pipeline-rope-line" style="background:${ropeGradient};opacity:0.7;"></div>
                ${deptData.map(d => `
                <div class="pipeline-dept-col">
                    <div class="pipeline-node-circle" style="background:${d.nodeColor};"
                         title="${d.dept} — ${d.pct}% complete">
                        <div style="width:20px;height:20px;opacity:0.9;">${d.cfg.icon}</div>
                        <div class="circle-label" style="font-size:0.55rem;max-width:60px;text-align:center;line-height:1.2;margin-top:0.2rem;">${d.shortName}</div>
                        <div class="circle-pct">${d.pct}%</div>
                    </div>
                </div>`).join('')}
            </div>

            <!-- Row 2: vertical drops -->
            <div class="pipeline-rope-row" style="height:36px;align-items:flex-start;">
                <div class="pipeline-rope-line" style="opacity:0;"></div>
                ${deptData.map(d => `
                <div class="pipeline-dept-col">
                    <div class="pipeline-drop" style="height:36px;background:linear-gradient(to bottom,${d.nodeColor}80,${d.nodeColor}10);width:3px;border-radius:2px;"></div>
                </div>`).join('')}
            </div>

            <!-- Row 3: task pill columns -->
            <div class="pipeline-rope-row" style="align-items:flex-start;padding-top:0;">
                <div class="pipeline-rope-line" style="opacity:0;"></div>
                ${deptData.map(d => `
                <div class="pipeline-dept-col" style="align-items:center;">
                    <div class="pipeline-tasks-col">
                        ${d.tasks.length === 0
                            ? `<div class="pipeline-empty" style="border:1.5px dashed #e2e8f0;border-radius:12px;padding:0.6rem;width:100%;text-align:center;color:#94a3b8;font-size:0.68rem;">No tasks yet</div>`
                            : d.tasks.map(t => {
                                const assignee = (t.responsible||[]).slice(0,2).join(', ') || 'Unassigned';
                                const dueStr = t.due_date ? new Date(t.due_date).toLocaleDateString('en',{month:'short',day:'numeric'}) : 'No date';
                                const isComplete = t.status === 'Completed';
                                const compStr = (isComplete && t.completed_date) ? new Date(t.completed_date).toLocaleDateString('en',{month:'short',day:'numeric'}) : null;
                                const isHigh = t.priority === 'High' && !isComplete;
                                const pillBorder = isComplete ? d.nodeColor : isHigh ? '#ef4444' : '#e2e8f0';
                                const dotColor = isComplete ? '#10b981' : t.status === 'In Progress' ? '#2563eb' : '#94a3b8';
                                
                                // Determine visually if it was completed late
                                const isLate = isComplete && t.due_date && t.completed_date && new Date(t.completed_date) > new Date(t.due_date);
                                
                                return `
                                <div class="pipeline-task-pill" style="border-color:${pillBorder};"
                                     onclick="openTaskModal('${t._id}')" title="Click to edit">
                                    <div class="pill-name" title="${t.task_name}">${t.task_name}</div>
                                    <div class="pill-meta" style="flex-direction:column;align-items:flex-start;gap:0.2rem;">
                                        <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
                                            <span style="display:flex;align-items:center;gap:0.25rem;flex-shrink:0;">
                                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                <span style="font-weight:600;color:#2563eb;max-width:85px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${assignee}</span>
                                            </span>
                                            <span class="pill-status-dot" style="background:${dotColor};"></span>
                                        </div>
                                        <span style="display:flex;align-items:center;gap:0.25rem;flex-wrap:wrap;">
                                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                            <span style="${isLate ? 'color:var(--danger);opacity:0.7;text-decoration:line-through;' : ''}" title="Due: ${dueStr}">${dueStr}</span>
                                            ${compStr ? `<span style="color:var(--success);font-weight:700;" title="Completed on: ${compStr}">✓ ${compStr}</span>` : ''}
                                        </span>
                                    </div>
                                </div>`;
                            }).join('')
                        }
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </div>`;

    // Animate health bar fill
    setTimeout(() => {
        const bar = $('health-bar-fill');
        if (bar) bar.style.width = healthScore + '%';
    }, 150);
}


// ── AI INSIGHTS VIEW ──────────────────────────────────────────────────────────
function renderAIView() {
    const vEl = $('org-vision'), mEl = $('org-mission');
    if (vEl) vEl.value = state.orgVision;
    if (mEl) mEl.value = state.orgMission;
}

async function handleAIAlignmentAnalysis() {
    const vision = $('org-vision')?.value?.trim() || state.orgVision;
    const mission = $('org-mission')?.value?.trim() || state.orgMission;
    const resultsArea = $('ai-results-area');
    if (!resultsArea) return;
    if (!vision && !mission) { showNotification('Please define Vision & Mission first.', 'error'); return; }
    
        resultsArea.innerHTML = `<div class="ai-insight-panel" style="text-align:center;padding:2.5rem;"><div class="spinner" style="margin:0 auto 1rem;"></div><div style="font-weight:600;color:var(--dark);font-size:0.95rem;">Analysing tasks against strategic goals…</div><div style="font-size:0.78rem;color:var(--secondary);margin-top:0.5rem;">Connecting to AI Engine via backend...</div></div>`;
        if (el.exportAiBtn) el.exportAiBtn.style.display = 'none';
        
        try {
            const response = await fetch('/api/ai/align', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vision, mission, tasks: state.tasks, departments: state.departments })
        });
        
        const data = await response.json();
        if (el.exportAiBtn) el.exportAiBtn.style.display = 'inline-flex';
        
        if (data.error) throw new Error(data.error);
        
        const delayed = state.tasks.filter(t => t.delay_reason).length;
        const cross = state.tasks.filter(t => t.requested_by && t.requested_by !== t.department).length;
        
        let avg = data.averageAlignment;
        const hColor = avg>=65?'var(--success)':avg>=35?'var(--warning)':'var(--danger)';
        const misaligned = data.departmentScores.filter(d=>d.status==='Misaligned');
        
        resultsArea.innerHTML = `
        ${!data.hasKey ? `<div style="background:var(--warning);color:white;padding:0.6rem;text-align:center;font-size:0.8rem;font-weight:600;border-radius:var(--radius-sm);margin-bottom:1rem;">⚠️ Using deterministic fallback analysis. Provide a GROQ_API_KEY in backend .env to unlock full GenAI insights.</div>` : ''}
        <div class="ai-insight-panel" style="margin-bottom:1rem;">
            <div class="ai-section-title">📊 Strategic Alignment Score</div>
            <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
                <div style="text-align:center;"><div style="font-size:3rem;font-weight:900;color:${hColor};">${avg}%</div><div style="font-size:0.7rem;font-weight:600;color:var(--secondary);text-transform:uppercase;">Overall Alignment</div></div>
                <div style="flex:1;min-width:180px;display:flex;flex-direction:column;gap:0.5rem;">
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;"><span>Aligned Depts</span><strong style="color:var(--success);">${data.departmentScores.filter(d=>d.status==='Aligned').length}</strong></div>
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;"><span>Needs Attention</span><strong style="color:var(--danger);">${misaligned.length}</strong></div>
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;"><span>Cross-Dept Requests</span><strong style="color:var(--primary);">${cross}</strong></div>
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;"><span>Delayed Tasks</span><strong style="color:var(--warning);">${delayed}</strong></div>
                </div>
                <div style="flex:1;min-width:200px;background:var(--gray-50);border-radius:var(--radius-md);padding:1rem;border:1px solid var(--gray-200);font-size:0.82rem;line-height:1.5;font-style:italic;color:var(--secondary);">
                    "${data.overallInsight}"
                </div>
            </div>
        </div>
        <div class="ai-insight-panel" style="margin-bottom:1rem;">
            <div class="ai-section-title">🏢 Department Breakdown</div>
            <div style="display:flex;flex-direction:column;gap:0.6rem;">
                ${data.departmentScores.map(d=> {
                    const cfg = getDeptConfig(d.dept);
                    return `
                    <div class="alignment-card">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="display:flex;align-items:center;gap:0.6rem;">
                                <div style="width:28px;height:28px;border-radius:8px;background:${cfg.bg};color:${cfg.color};display:flex;align-items:center;justify-content:center;">${cfg.icon}</div>
                                <span style="font-weight:700;font-size:0.875rem;">${d.dept}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span style="font-size:0.75rem;font-weight:700;color:${cfg.color};">${d.score}%</span>
                                <span class="${d.statusClass}">${d.status}</span>
                            </div>
                        </div>
                        <div class="progress-track"><div class="progress-fill" style="width:${d.score}%;background:${cfg.color};transition:width 1s ease;"></div></div>
                        ${d.status !== 'Aligned' && d.suggestion ? `<div style="font-size:0.75rem;color:var(--danger);background:rgba(239,68,68,0.06);padding:0.5rem 0.75rem;border-radius:8px;border-left:3px solid var(--danger);margin-top:0.4rem;">⚠️ <strong>AI Insight:</strong> ${d.suggestion}</div>` : ''}
                    </div>`
                }).join('')}
            </div>
        </div>
        <div class="ai-insight-panel">
            <div class="ai-section-title">⭐ Key Recommendations</div>
            <div style="display:flex;flex-direction:column;gap:0.6rem;">
                ${data.keyRecommendations.map((r, i) => `<div style="padding:0.75rem 1rem;background:var(--gray-50);border-left:3px solid var(--primary);border-radius:8px;font-size:0.82rem;"><strong>💡 Idea ${i+1}:</strong> ${r}</div>`).join('')}
            </div>
        </div>`;
    } catch(err) {
        showNotification('Analysis failed. Is backend running?', 'error');
        resultsArea.innerHTML = `<div style="color:var(--danger);font-weight:600;text-align:center;padding:1rem;">Failed to fetch AI insights. error: ${err.message}</div>`;
    }
}

// ── HR ────────────────────────────────────────────────────────────────────────
function renderPersonal() {
    el.personalGrid.innerHTML = '';
    const list = state.searchQuery ? state.personal.filter(p=>p.name?.toLowerCase().includes(state.searchQuery)||p.department?.toLowerCase().includes(state.searchQuery)) : state.personal;
    if (list.length===0) { el.personalGrid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--secondary);">No team members found.</div>'; return; }
    list.forEach((person,i) => {
        const cfg = getDeptConfig(person.department);
        let dateStr='N/A';
        if (person.createdAt) dateStr=new Date(person.createdAt).toLocaleDateString('en',{year:'numeric',month:'short',day:'numeric'});
        else if (person._id?.length===24) dateStr=new Date(parseInt(person._id.substring(0,8),16)*1000).toLocaleDateString('en',{year:'numeric',month:'short',day:'numeric'});
        const card=document.createElement('div'); card.className='person-card'; card.style.animationDelay=`${i*0.05}s`;
        card.innerHTML=`
        <div class="person-header">
            <div class="person-avatar" style="background:${person.photoData?'transparent':cfg.color};">
                ${person.photoData?`<img src="${person.photoData}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:16px;">`:(person.name||'?').charAt(0).toUpperCase()}
            </div>
            <div class="person-info"><h3>${person.name}</h3><p>${person.role}</p></div>
        </div>
        <span class="person-badge" style="background:${cfg.bg};color:${cfg.color};">${person.department}</span>
        <div style="font-size:0.8rem;color:var(--secondary);display:flex;flex-direction:column;gap:0.35rem;padding:0.6rem 0.75rem;background:var(--gray-50);border-radius:var(--radius-sm);border:1px solid var(--gray-100);">
            <div>📧 ${person.email||'No email'}</div>
            <div>📅 Added: ${dateStr}</div>
        </div>
        ${person.responsibility?`<div class="person-responsibility"><strong style="font-size:0.78rem;">Responsibility:</strong><div style="margin-top:0.2rem;font-size:0.8rem;">${person.responsibility}</div></div>`:''}
        <div style="margin-top:auto;padding-top:0.75rem;border-top:1px solid var(--gray-100);display:flex;justify-content:flex-end;gap:0.5rem;">
            <button class="btn btn-glass" onclick="editPersonal('${person._id}')" style="padding:0.4rem 0.9rem;font-size:0.75rem;">✏️ Edit</button>
            <button class="btn btn-danger" onclick="deletePersonal('${person._id}')" style="padding:0.4rem 0.9rem;font-size:0.75rem;">🗑️ Remove</button>
        </div>`;
        el.personalGrid.appendChild(card);
    });
}

// ── LOGS ──────────────────────────────────────────────────────────────────────
function renderLogs() {
    const consolidated={};
    state.logs.forEach(log=>{const k=log.task_name||'System';if(!consolidated[k]||new Date(log.timestamp)>new Date(consolidated[k].timestamp))consolidated[k]=log;});
    const logs=Object.values(consolidated).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
    el.logsTbody.innerHTML=logs.length===0?`<tr><td colspan="5" style="text-align:center;padding:3rem;color:var(--secondary);">No logs yet.</td></tr>`:
        logs.map(log=>{
            const isLate=log.due_date&&log.completed_date&&new Date(log.completed_date)>new Date(log.due_date);
            return `<tr>
                <td><span class="log-action-${(log.action||'').toLowerCase()}">${log.action}</span></td>
                <td><div style="font-weight:700;color:var(--dark);">${log.task_name||'System'}</div><div style="font-size:0.72rem;color:var(--secondary);">${log.task_description||log.description||''}</div>${log.requested_by?`<div style="font-size:0.65rem;color:var(--primary);font-weight:700;">Ref: ${log.requested_by}</div>`:''}</td>
                <td>${(log.responsible||[]).map(r=>`<div style="font-size:0.78rem;font-weight:600;color:var(--primary);">• ${r}</div>`).join('')||'—'}</td>
                <td><div style="font-size:0.78rem;">Due: <strong>${log.due_date?new Date(log.due_date).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'}):'—'}</strong></div>${log.completed_date?`<div style="font-size:0.78rem;">Done: <strong style="color:var(--success);">${new Date(log.completed_date).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}</strong></div>`:''}</td>
                <td>${isLate?`<div style="padding:0.35rem 0.6rem;background:rgba(239,68,68,0.12);border-radius:6px;border-left:3px solid var(--danger);"><div style="color:var(--danger);font-size:0.68rem;font-weight:800;">DELAY</div><div style="font-size:0.7rem;color:var(--secondary);">"${log.delay_reason||'No reason'}"</div></div>`:'<div style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.35rem 0.6rem;background:rgba(16,185,129,0.12);color:var(--success);border-radius:6px;font-weight:700;font-size:0.75rem;">✅ On Time</div>'}<div style="font-size:0.62rem;color:var(--gray-400);margin-top:0.3rem;">${new Date(log.timestamp).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div></td>
            </tr>`;
        }).join('');
}

// ── AI LOG ANALYSIS ───────────────────────────────────────────────────────────
async function handleAIAnalysis() {
    el.aiInsightsContainer.style.display='block';
    el.aiReportContent.innerHTML=`<div style="text-align:center;padding:2rem;"><div class="spinner" style="margin:0 auto 1rem;"></div><p style="font-weight:600;color:var(--dark);">Synthesising performance metrics…</p></div>`;
    await new Promise(r=>setTimeout(r,1800));
    const comp=state.tasks.filter(t=>t.status==='Completed').length;
    const delayed=state.tasks.filter(t=>t.delay_reason).length;
    const cross=state.tasks.filter(t=>t.requested_by&&t.requested_by!==t.department).length;
    const mainDelay=state.tasks.find(t=>t.delay_reason)?.delay_reason||'Resource allocation';
    el.aiReportContent.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1.5fr;gap:1.25rem;"><div style="background:var(--gray-50);border-radius:12px;padding:1rem;border:1px solid var(--gray-200);"><div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--primary);margin-bottom:0.75rem;">📊 Metrics</div><div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.82rem;"><div style="display:flex;justify-content:space-between;"><span>Efficiency Ratio:</span><strong>${Math.round((comp/Math.max(state.logs.length,1))*100)}%</strong></div><div style="display:flex;justify-content:space-between;"><span>Late Tasks:</span><strong style="color:var(--danger);">${delayed}</strong></div><div style="display:flex;justify-content:space-between;"><span>Cross-Dept:</span><strong style="color:var(--primary);">${cross}</strong></div></div></div><div><div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--primary);margin-bottom:0.75rem;">✨ Strategic Audit</div><p style="font-style:italic;font-size:0.82rem;line-height:1.5;color:var(--secondary);">System shows <strong>${delayed>0?'moderate':'low'}</strong> friction with <strong>${cross}</strong> cross-dept handoffs. Main delay: <strong>"${mainDelay}"</strong>.</p><div style="margin-top:0.75rem;padding:0.75rem;background:var(--primary-light);border-left:3px solid var(--primary);border-radius:6px;font-size:0.78rem;"><strong>Next Move:</strong> Standardise response to "${mainDelay}" to reduce delays by ~25%.</div></div></div>`;
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function openTaskModal(taskId=null,dept=null){
    el.taskForm.reset(); state.selectedPersonal=[]; renderSelectedPersonal();
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    if(taskId){
        const task=state.tasks.find(t=>t._id===taskId);if(!task)return;
        $('task-id').value=task._id; $('task-name').value=task.task_name;
        $('task-department').value=task.department; 
        const priR=document.querySelector(`input[name="task-priority"][value="${task.priority}"]`); if(priR)priR.checked=true;
        const statR=document.querySelector(`input[name="task-status"][value="${task.status}"]`); if(statR)statR.checked=true;
        $('task-progress').value=task.progress;
        $('task-requested-by').value=task.requested_by||'';
        $('task-due-date').value=task.due_date?task.due_date.split('T')[0]:'';
        $('task-completed-date').value=task.completed_date?task.completed_date.split('T')[0]:'';
        $('task-delay-reason').value=task.delay_reason||'';$('task-description').value=task.description||'';
        const lockCb = $('task-is-locked'); if(lockCb) lockCb.checked = task.is_locked || false;
        state.selectedPersonal=[...(task.responsible||[])]; renderSelectedPersonal();
        $('modal-title').textContent='Edit Task';
        const c=task.status==='Completed'; el.completedDateGroup.style.display=c?'block':'none';
        renderTaskComments(task.comments || []);
        // Populate stage dropdown for this task's department
        populateTaskStageDropdown(task.department, task.currentStage || '');
    } else {
        $('task-id').value=''; if(dept)$('task-department').value=dept;
        $('task-requested-by').value=user.name||''; $('modal-title').textContent='Create New Task';
        el.completedDateGroup.style.display='none'; el.delayReasonGroup.style.display='none';
        $('task-comments-container').style.display='none';
        const lockCb = $('task-is-locked'); if(lockCb) lockCb.checked = false;
        // Populate stage dropdown for the preset dept (if any)
        populateTaskStageDropdown(dept || '', '');
    }
    el.taskModal.classList.add('active'); checkTaskConstraints();
}

function populateTaskStageDropdown(deptName, selectedStage) {
    const stageGroup = $('task-stage-group');
    const stageSelect = $('task-current-stage');
    const stageDatalist = $('stage-suggestions');
    if (!stageGroup || !stageSelect || !stageDatalist) return;

    if (!deptName) {
        stageGroup.style.display = 'none';
        stageSelect.value = '';
        stageDatalist.innerHTML = '';
        return;
    }

    // Find the dept object by name
    const deptObj = state.deptObjects.find(d => d.name.trim().toLowerCase() === deptName.trim().toLowerCase());
    if (!deptObj) {
        stageGroup.style.display = 'none';
        stageSelect.value = '';
        stageDatalist.innerHTML = '';
        return;
    }

    // Find stages for this dept
    const stageDoc = state.deptStages.find(s => String(s.departmentId) === String(deptObj._id));
    const stages = stageDoc ? stageDoc.stages : [];

    stageGroup.style.display = 'block';
    stageSelect.value = selectedStage || '';

    // Collect all stage suggestions
    const taskStages = new Set(stages.map(s => s.title));
    
    // Add unique stages currently used by tasks of this department as suggestions
    if (state.tasks && Array.isArray(state.tasks)) {
        state.tasks.forEach(t => {
            if ((t.department || '').trim().toLowerCase() === deptName.trim().toLowerCase() && t.currentStage) {
                taskStages.add(t.currentStage);
            }
        });
    }

    stageDatalist.innerHTML = Array.from(taskStages).map(s => `<option value="${s}"></option>`).join('');
}
window.populateTaskStageDropdown = populateTaskStageDropdown;


function renderTaskComments(comments) {
    const container = $('task-comments-container');
    const list = $('task-comments-list');
    if (!container || !list) return;
    
    // Always show container when editing
    container.style.display = 'block';
    
    if (!comments || comments.length === 0) {
        list.innerHTML = '<div style="color:var(--gray-400);font-style:italic;">No comments yet.</div>';
        return;
    }
    
    list.innerHTML = comments.map(c => {
        const d = new Date(c.timestamp).toLocaleString('en', { month:'short', day:'numeric', hour:'numeric', minute:'numeric' });
        return `
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius-sm);padding:0.6rem;font-size:0.8rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                <span style="font-weight:700;color:var(--dark);">${c.author}</span>
                <span style="color:var(--secondary);font-size:0.7rem;">${d}</span>
            </div>
            <div style="color:var(--text);word-break:break-word;line-height:1.4;">${c.text}</div>
        </div>
        `;
    }).join('');
    list.scrollTop = list.scrollHeight;
}

function openPersonalModal(personId=null){
    el.personalForm.reset(); state.personPhotoData=''; $('person-photo-data').value='';
    const pInit=$('person-preview-initial'); if(pInit)pInit.textContent='?';
    const pImg=$('person-preview-avatar')?.querySelector('img'); if(pImg)pImg.remove();
    if(personId){
        const person=state.personal.find(p=>p._id===personId);if(!person)return;
        $('person-id').value=person._id; $('person-name').value=person.name;
        $('person-role').value=person.role; $('person-dept').value=person.department;
        $('person-email').value=person.email||''; $('person-password').value=''; $('person-responsibility').value=person.responsibility||'';
        if(pInit)pInit.textContent=person.name.charAt(0).toUpperCase();
        if(person.photoData){state.personPhotoData=person.photoData;$('person-photo-data').value=person.photoData;const av=$('person-preview-avatar');if(av){const img=document.createElement('img');img.src=person.photoData;img.style.cssText='width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:18px;';av.appendChild(img);}}
        $('personal-modal-title').textContent='Edit Team Member';
    } else { $('person-id').value=''; $('personal-modal-title').textContent='Add Team Member'; }
    el.personalModal.classList.add('active');
}

function openProfileModal(){
    const user=JSON.parse(localStorage.getItem('bh_user')||'{}');
    $('profile-name').textContent=user.name||'—'; $('profile-email').textContent=user.email||'—'; $('profile-phone').textContent=user.phone||'—';
    const initEl=$('profile-initial');
    if(initEl){if(user.photo)initEl.innerHTML=`<img src="${user.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`;else initEl.textContent=(user.name||'U').charAt(0).toUpperCase();}
    el.profileModal.classList.add('active');
}
window.openProfileModal=openProfileModal;

// ── FORM HANDLERS ──────────────────────────────────────────────────────────────
async function handleCommentSubmit() {
    const taskId = $('task-id').value;
    const text = $('task-new-comment').value.trim();
    if (!taskId || !text) return;

    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const author = user.name || 'Unknown';

    const btn = $('btn-add-comment');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(`/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, author })
        });
        if (res.ok) {
            const updatedTask = await res.json();
            // Update local state
            state.tasks = state.tasks.map(t => (t._id === taskId || t.id === taskId) ? updatedTask : t);
            // Re-render comments without closing modal
            renderTaskComments(updatedTask.comments);
            $('task-new-comment').value = '';
            
            // Optionally update UI behind if it affects progress/status
            renderAll();
        } else {
            showNotification('Failed to add comment', 'error');
        }
    } catch(err) {
        showNotification('Error adding comment', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function handleTaskSubmit(e){
    e.preventDefault();
    const id=$('task-id').value;
    if(state.selectedPersonal.length===0){showNotification('Assign at least one person','error');return;}
    const taskData={task_name:$('task-name').value,department:$('task-department').value,priority:document.querySelector('input[name="task-priority"]:checked').value,status:document.querySelector('input[name="task-status"]:checked').value,progress:parseInt($('task-progress').value),due_date:$('task-due-date').value,completed_date:$('task-completed-date').value,delay_reason:$('task-delay-reason').value,requested_by:$('task-requested-by').value,description:$('task-description').value,responsible:state.selectedPersonal, is_locked: $('task-is-locked')?.checked || false, currentStage: ($('task-current-stage')?.value || '')};
    if(taskData.status==='Completed'&&taskData.completed_date&&new Date(taskData.completed_date)>new Date(taskData.due_date)&&!taskData.delay_reason){showNotification('Delay reason required','error');return;}
    const btn = $('save-task-btn');
    const originalHtml = btn ? btn.innerHTML : '';
    if(btn){ btn.disabled = true; btn.innerHTML = '<div class="spinner-small"></div> Saving...'; }
    try{
        const res=await fetch(id?`/api/tasks/${id}`:'/api/tasks',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(taskData)});
        if(res.ok){
            const updatedData = await res.json();
            if(id) {
                state.tasks = state.tasks.map(t => (t._id === id || t.id === id) ? updatedData : t);
            } else {
                state.tasks.push(updatedData);
            }
            showNotification(id?'Task updated ✅':'Task created ✅','success');
            el.taskModal.classList.remove('active');
            fetch('/api/logs').then(r => r.json()).then(l => { state.logs = l; renderAll(); });
            renderAll();
        } else {
            let errMsg = 'Server error';
            try { const j = await res.json(); errMsg = j.error || res.statusText; } catch(e){}
            showNotification('Failed to save task: ' + errMsg, 'error');
        }
    }catch(err){
        showNotification('Network error: ' + err.message, 'error');
    } finally {
        if(btn){ btn.disabled = false; btn.innerHTML = originalHtml; }
    }
}

async function handlePersonalSubmit(e){
    e.preventDefault();
    const id=$('person-id').value;
    const photoData = state.personPhotoData || $('person-photo-data').value || '';
    const loggedInUser = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const selectedDeptName = $('person-dept').value;

    const personData={
        name:$('person-name').value,
        role:$('person-role').value,
        department:selectedDeptName,
        email:$('person-email').value,
        password:$('person-password').value,
        responsibility:$('person-responsibility').value,
        photoData
    };
    const btn = e.submitter;
    const originalHtml = btn ? btn.innerHTML : '';
    if(btn){ btn.disabled=true; btn.innerHTML='<div class="spinner-small"></div> Saving...'; }

    async function doSave(data) {
        const res = await fetch(
            id ? `/api/personal/${id}` : '/api/personal',
            { method: id?'PUT':'POST', headers:{'Content-Type':'application/json','x-user-role': JSON.parse(localStorage.getItem('bh_user')||'{}').role || 'staff'}, body:JSON.stringify(data) }
        );
        return res;
    }

    try{
        const res = await doSave(personData);
        if(res.ok){
            const updatedPerson = await res.json();
            if(id) {
                state.personal = state.personal.map(p => (p._id === id || p.id === id) ? updatedPerson : p);
            } else {
                state.personal.push(updatedPerson);
            }
            showNotification(id?'Member updated ✅':'Member added ✅','success');
            el.personalModal.classList.remove('active');
            state.personPhotoData='';
            await loadAndRenderDepts();
            renderAll();
        } else if(res.status === 409) {
            let warnData = {};
            try { warnData = await res.json(); } catch(e){}
            if(warnData.warn) {
                if(btn){ btn.disabled=false; btn.innerHTML=originalHtml; }
                const confirmed = confirm(
                    `⚠️ ${warnData.message}\n\nNote: Having two employees with the same name might cause confusion in task tracking.\n\nDo you still want to add them?`
                );
                if(confirmed){
                    if(btn){ btn.disabled=true; btn.innerHTML='<div class="spinner-small"></div> Saving...'; }
                    const forceRes = await doSave({...personData, force:true});
                    if(forceRes.ok){
                        const p2 = await forceRes.json();
                        state.personal.push(p2);
                        showNotification('Member added ✅','success');
                        el.personalModal.classList.remove('active');
                        state.personPhotoData='';
                        await loadAndRenderDepts();
                        renderAll();
                    } else {
                        let e2='Server error';
                        try { const j=await forceRes.json(); e2=j.error||forceRes.statusText; } catch(e){}
                        showNotification('Save failed: '+e2,'error');
                    }
                }
                return;
            }
            showNotification(warnData.message || 'Duplicate entry','error');
        } else {
            let errMsg = 'Server error';
            try { const j=await res.json(); errMsg=j.error||res.statusText; } catch(e){}
            showNotification('Save failed: '+errMsg,'error');
        }
    }catch(err){
        showNotification('Network error: '+err.message,'error');
    } finally {
        if(btn){ btn.disabled=false; btn.innerHTML=originalHtml; }
    }
}

// The showCredentialsPopup and copyCredentials helpers have been removed.


// ── HELPERS ───────────────────────────────────────────────────────────────────
function renderSelectedPersonal(){
    if(!state.selectedPersonal || state.selectedPersonal.length === 0) {
        el.selectedPersonalList.innerHTML = `<span style="color:var(--gray-400);font-size:0.8rem;font-style:italic;">No assignees selected...</span>`;
    } else {
        el.selectedPersonalList.innerHTML = state.selectedPersonal.map(n=>`<div class="tag">${n}<span class="tag-remove" onclick="removeSelectedPersonal('${n}')">&times;</span></div>`).join('');
    }
}
window.removeSelectedPersonal=n=>{state.selectedPersonal=state.selectedPersonal.filter(x=>x!==n);renderSelectedPersonal();};

function renderPersonalDropdown(){
    el.personalDropdown.innerHTML='<option value="">+ Add Person to Task…</option>';
    state.personal.forEach(p=>{
        const o=document.createElement('option');
        o.value=p.name;
        o.textContent=`${p.name} (${p.department})`;
        el.personalDropdown.appendChild(o);
    });
}

function animVal(el2,target,duration=600){if(!el2)return;let start=null;const step=ts=>{if(!start)start=ts;const p=Math.min((ts-start)/duration,1);el2.textContent=Math.floor(p*target);if(p<1)requestAnimationFrame(step);else el2.textContent=target;};requestAnimationFrame(step);}

function svgIcon(name){const icons={layers:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,'check-circle':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,loader:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`};return icons[name]||'';}

function statBannerCard(bg,iconColor,icon,label,valHtml){return `<div class="banner-stat"><div class="banner-stat-icon" style="background:${bg};color:${iconColor};">${icon}</div><div><div class="banner-stat-label">${label}</div><div class="banner-stat-value">${valHtml}</div></div></div>`;}

function showNotification(msg,type='success'){const container=$('notification-container');const note=document.createElement('div');note.className=`notification ${type}`;const icon=type==='success'?'✅':'⚠️';note.innerHTML=`<span style="font-size:1rem;">${icon}</span><span>${msg}</span>`;container.appendChild(note);setTimeout(()=>{note.style.opacity='0';note.style.transform='translateX(20px)';setTimeout(()=>note.remove(),300);},3000);}

// ── GLOBALS ───────────────────────────────────────────────────────────────────
window.openTaskModal=openTaskModal;
window.editPersonal=id=>openPersonalModal(id);
window.deleteTask=async id=>{if(!confirm('Delete this task?'))return;try{const r=await fetch(`/api/tasks/${id}`,{method:'DELETE'});if(r.ok){showNotification('Task deleted','success');state.tasks = state.tasks.filter(t => t._id !== id && t.id !== id);fetch('/api/logs').then(r => r.json()).then(l => { state.logs = l; renderAll(); });renderAll();}}catch(e){showNotification('Error deleting task','error');}};
window.deletePersonal=async id=>{if(!confirm('Remove this team member?'))return;try{const r = await fetch(`/api/personal/${id}`,{method:'DELETE'});if(r.ok){showNotification('Member removed','success');state.personal = state.personal.filter(p => p._id !== id && p.id !== id);await loadAndRenderDepts();renderAll();}}catch(e){showNotification('Error','error');}};

// ── DEPARTMENT MANAGEMENT ─────────────────────────────────────────────────────
async function loadAndRenderDepts() {
    try {
        const res = await fetch('/api/departments').then(r => r.json());
        state.deptObjects = res;
        state.departments = res.map(d => d.name);
        populateDeptDropdowns();
        populateHierarchyDropdowns();
        renderDeptAdminList();
    } catch(e) { showNotification('Failed to reload departments', 'error'); }
}

function renderDeptAdminList() {
    const container = document.getElementById('dept-admin-list');
    if (!container) return;
    if (!state.deptObjects || state.deptObjects.length === 0) {
        container.innerHTML = '<p style="color:var(--secondary);font-size:0.85rem;text-align:center;padding:1rem;">No departments yet.</p>';
        return;
    }
    container.innerHTML = state.deptObjects.map(d => {
        const deptEmployees = state.personal.filter(p => p.department && p.department.trim().toLowerCase() === d.name.trim().toLowerCase());
        const employeesHtml = deptEmployees.length > 0
            ? `<div style="margin-top: 0.5rem; background: var(--card-bg); padding: 0.6rem 0.85rem; border-radius: 8px; border: 1px solid var(--gray-150);">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--secondary); margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing:0.04em;">👥 Team Members (${deptEmployees.length}):</div>
                <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
                    ${deptEmployees.map(e => `<span style="background:var(--gray-100); color:var(--text); padding:3px 9px; border-radius:12px; font-size:0.72rem; font-weight:600; border:1px solid var(--gray-200);">${e.name} <span style="font-size:0.6rem; color:var(--secondary); font-weight:normal;">(${e.role})</span></span>`).join('')}
                </div>
               </div>`
            : `<div style="font-size:0.72rem; color:var(--secondary); font-style:italic; margin-top:0.4rem;">No registered team members in this department.</div>`;

        const deptStageDoc = state.deptStages.find(s => String(s.departmentId) === String(d._id));
        const stagesList = deptStageDoc ? deptStageDoc.stages : [];
        const stagesHtml = stagesList.length > 0
            ? `<div style="margin-top: 0.5rem; background: var(--card-bg); padding: 0.6rem 0.85rem; border-radius: 8px; border: 1px solid var(--gray-150);">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--secondary); margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing:0.04em;">Workflow Pipeline:</div>
                <div style="display: flex; align-items: center; gap: 0.4rem; overflow-x: auto; padding-bottom: 2px;">
                    ${stagesList.map((s, idx) => `
                        <div style="display:flex; align-items:center; gap:0.25rem;">
                            <span style="font-size:0.75rem; font-weight:600; padding: 3px 10px; border-radius: 12px; background: ${s.color}15; color: ${s.color}; border: 1px solid ${s.color}30; white-space:nowrap;" title="${s.description || ''}">
                                ${idx + 1}. ${s.title}
                            </span>
                            ${idx < stagesList.length - 1 ? '<span style="color:var(--gray-300); font-size: 0.75rem;">➔</span>' : ''}
                        </div>
                    `).join('')}
                </div>
               </div>`
            : `<div style="font-size:0.72rem; color:var(--secondary); font-style:italic; margin-top:0.4rem;">No custom workflow stages added. Configure them below!</div>`;

        return `
            <div style="padding:0.75rem 1rem;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:10px;margin-bottom:0.75rem;display:flex;flex-direction:column;gap:0.5rem;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:0.6rem;">
                        <div style="width:12px;height:12px;border-radius:50%;background:${d.color || '#6366f1'};flex-shrink:0;"></div>
                        <span style="font-weight:700;font-size:0.9rem;color:var(--dark);">${d.name}</span>
                    </div>
                    <button class="btn btn-danger" onclick="deleteDepartment('${d._id}', '${d.name}')" style="padding:0.25rem 0.6rem;font-size:0.7rem;line-height:1;">Delete</button>
                </div>
                <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.6rem;font-size:0.78rem;color:var(--secondary);background:var(--card-bg);padding:0.5rem;border-radius:6px;border:1px solid var(--gray-100);">
                    <span style="white-space:nowrap;">👤 Leader: <strong style="color:var(--dark);">${d.deptLeader || 'None'}</strong></span>
                </div>
                
                ${employeesHtml}

                <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;margin-top:0.25rem;">
                    <input type="checkbox" id="vis-${d._id}" ${d.employeeVisibility ? 'checked' : ''} onchange="toggleDeptVisibility('${d._id}', this.checked)" style="width:auto;cursor:pointer;">
                    <label for="vis-${d._id}" style="font-weight:500;cursor:pointer;color:var(--text);">Allow employees to see other employee's tasks</label>
                </div>
            </div>
        `;
    }).join('');
}

window.toggleDeptVisibility = async (id, employeeVisibility) => {
    try {
        const res = await fetch(`/api/departments/${id}/visibility`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeVisibility })
        });
        if (res.ok) {
            showNotification('Employee task visibility updated', 'success');
            await loadAndRenderDepts();
        } else {
            const data = await res.json();
            showNotification(data.error || 'Failed to update visibility', 'error');
            await loadAndRenderDepts();
        }
    } catch(e) {
        showNotification('Error updating visibility', 'error');
        await loadAndRenderDepts();
    }
};

window.deleteDepartment = async (id, name) => {
    if (!confirm(`Delete department "${name}"? Tasks assigned to it will remain but unlinked.`)) return;
    try {
        const r = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
        if (r.ok) {
            showNotification(`"${name}" removed`, 'success');
            await loadAndRenderDepts();
            renderAll();
        }
    } catch(e) { showNotification('Error deleting department', 'error'); }
};

// (Division management removed — hierarchy is now Company → Department → dept_leader → employee)

function populateHierarchyDropdowns() {
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const userRole = user.role || 'employee';

    // Populate role selection based on logged in user's role hierarchy
    const roleSelect = document.getElementById('admin-new-role');
    if (roleSelect) {
        roleSelect.innerHTML = '';
        const allowedRoles = Object.keys(ROLE_LEVELS).filter(r => ROLE_LEVELS[userRole] > ROLE_LEVELS[r]);
        // Also allow admin to create admins if needed (requires secret)
        if (userRole === 'admin') {
            allowedRoles.push('admin');
        }
        allowedRoles.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = ROLE_DISPLAY[r] || r;
            roleSelect.appendChild(opt);
        });
    }

    // Populate Dept Leaders select in Dept Manager
    const leaderSelect = document.getElementById('new-dept-leader');
    if (leaderSelect) {
        const currentVal = leaderSelect.value;
        leaderSelect.innerHTML = '<option value="">Select Dept Leader (Optional)</option>';
        (state.personal || []).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = `${p.name} (${p.role})`;
            leaderSelect.appendChild(opt);
        });
        if ([...leaderSelect.options].some(o => o.value === currentVal)) {
            leaderSelect.value = currentVal;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Dept form
    const form = document.getElementById('add-dept-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('add-dept-btn');
            const nameInput = document.getElementById('new-dept-name');
            const name = nameInput?.value?.trim();
            if (!name) return;
            const deptLeader = document.getElementById('new-dept-leader')?.value || '';

            const companyId = localStorage.getItem('bh_active_company_id');
            if (!companyId) {
                showNotification('Please select or create a company first', 'error');
                return;
            }
            if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }

            try {
                const res = await fetch('/api/departments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, deptLeader, companyId })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed');
                if (nameInput) nameInput.value = '';
                showNotification(`"${name}" department added! ✅`, 'success');
                await loadAndRenderDepts();
                renderAll();
            } catch(e) {
                showNotification(e.message || 'Error adding department', 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Add Department'; }
            }
        });
    }
});


// ── DOCUMENT CENTER HANDLERS ──────────────────────────────────────────────────
async function handleDocumentSubmit(e) {
    e.preventDefault();
    const file = state.pendingUploadFile;
    if (!file) return;
    
    const btn = $('save-doc-btn');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner-small"></div> Uploading...'; }
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
        const docData = {
            name: $('doc-display-name').value,
            type: file.type || 'application/octet-stream',
            size: file.size,
            data: ev.target.result,
            category: $('doc-category').value,
            description: $('doc-description').value,
            uploadedBy: user.name || 'User'
        };
        
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(docData)
            });
            
            if (res.ok) {
                showNotification('Document uploaded successfully ✅', 'success');
                el.documentModal.classList.remove('active');
                
                const [docs, logs] = await Promise.all([
                    fetch('/api/documents').then(r => r.json()),
                    fetch('/api/logs').then(r => r.json())
                ]);
                state.documents = docs;
                state.logs = logs;
                renderAll();
            } else {
                let errMsg = 'Upload failed';
                try { const j = await res.json(); errMsg = j.error || res.statusText; } catch(e){}
                showNotification('Failed to upload: ' + errMsg, 'error');
            }
        } catch (err) {
            showNotification('Network error: ' + err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
            state.pendingUploadFile = null;
            el.docFileInput.value = '';
        }
    };
    reader.readAsDataURL(file);
}

function renderDocuments() {
    const tbody = $('documents-tbody');
    if (!tbody) return;
    
    const query = $('doc-search')?.value?.toLowerCase() || '';
    const categoryFilter = $('doc-category-filter')?.value || 'All';
    
    let filtered = state.documents || [];
    if (categoryFilter !== 'All') {
        filtered = filtered.filter(d => d.category === categoryFilter);
    }
    if (query) {
        filtered = filtered.filter(d => d.name?.toLowerCase().includes(query) || d.category?.toLowerCase().includes(query) || d.description?.toLowerCase().includes(query));
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--secondary); padding: 2rem;">No documents match your filters.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(doc => {
        const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        
        let sizeStr = '0 B';
        if (doc.size > 1024 * 1024) {
            sizeStr = (doc.size / (1024 * 1024)).toFixed(2) + ' MB';
        } else if (doc.size > 1024) {
            sizeStr = (doc.size / 1024).toFixed(1) + ' KB';
        } else if (doc.size) {
            sizeStr = doc.size + ' B';
        }
        
        return `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <div>
                        <div style="font-weight: 700; color: var(--dark);">${doc.name}</div>
                        ${doc.description ? `<div style="font-size: 0.72rem; color: var(--secondary); margin-top: 0.1rem;">${doc.description}</div>` : ''}
                    </div>
                </div>
            </td>
            <td><span style="font-size:0.75rem; font-weight:700; color:var(--primary); background:rgba(99,102,241,0.1); padding:0.2rem 0.6rem; border-radius:50px;">${doc.category}</span></td>
            <td><span style="font-size: 0.78rem; font-weight: 600; color: var(--secondary);">${sizeStr}</span></td>
            <td><span style="font-size: 0.78rem; font-weight: 600; color: var(--dark);">${doc.uploadedBy || 'User'}</span></td>
            <td><span style="font-size: 0.78rem; color: var(--secondary);">${dateStr}</span></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn btn-glass" onclick="downloadDocument('${doc._id || doc.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download
                    </button>
                    ${hasMinRole(JSON.parse(localStorage.getItem('bh_user') || '{}').role, 'admin') ? `
                    <button class="btn btn-danger" onclick="deleteDocument('${doc._id || doc.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                        🗑️ Delete
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

async function downloadDocument(id) {
    showNotification('Retrieving file...', 'success');
    try {
        const res = await fetch(`/api/documents/${id}`);
        if (!res.ok) throw new Error('Could not fetch document content');
        const doc = await res.json();
        
        // Extract base64 and MIME type
        const parts = doc.data.split(',');
        if (parts.length < 2) throw new Error('Invalid document data format');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        
        // Decode base64 to raw binary data
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        // Create blob and ObjectURL for safe download
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Download started ✅', 'success');
    } catch (err) {
        showNotification('Download failed: ' + err.message, 'error');
    }
}
window.downloadDocument = downloadDocument;

async function deleteDocument(id) {
    if (!confirm('Are you sure you want to permanently delete this document?')) return;
    try {
        const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showNotification('Document deleted successfully ✅', 'success');
            state.documents = state.documents.filter(d => d._id !== id && d.id !== id);
            fetch('/api/logs').then(r => r.json()).then(l => { state.logs = l; renderAll(); });
            renderAll();
        } else {
            showNotification('Failed to delete document', 'error');
        }
    } catch (err) {
        showNotification('Error: ' + err.message, 'error');
    }
}
window.deleteDocument = deleteDocument;

// ── ADMIN: CREATE USER ────────────────────────────────────────────────────────
function setupAdminPanel() {
    const form = $('admin-create-user-form');
    
    // Add dynamic UI adjustments for registration form
    const roleSelect = $('admin-new-role');
    const deptSelect = $('admin-new-dept');
    
    const adjustFields = () => {
        if (!roleSelect || !deptSelect) return;
        const role = roleSelect.value;
        if (role === 'admin') {
            deptSelect.value = '';
            deptSelect.disabled = true;
        } else {
            deptSelect.disabled = false;
        }
    };

    if (roleSelect) {
        roleSelect.addEventListener('change', adjustFields);
        // Observe mutation or initialization
        setTimeout(adjustFields, 500);
    }

    if (form) {
        form.addEventListener('reset', () => {
            setTimeout(adjustFields, 0);
        });
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = $('admin-create-btn');
            const msgEl = $('admin-msg');
            const name       = $('admin-new-name').value.trim();
            const email      = $('admin-new-email').value.trim();
            const phone      = $('admin-new-phone').value.trim();
            const password   = $('admin-new-password').value;
            const role       = $('admin-new-role').value;
            
            // Set department based on selected role
            let department = deptSelect ? deptSelect.value : '';
            if (role === 'admin') {
                department = '';
            }

            const secret     = $('admin-secret-input').value;

            btn.disabled = true;
            btn.innerHTML = `<span style="opacity:0.7">Creating…</span>`;
            msgEl.style.display = 'none';

            const doSignup = async (forceFlag) => {
                const activeCompanyId = localStorage.getItem('bh_active_company_id') || null;
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
                    body: JSON.stringify({ name, email, phone, password, role, department, companyId: activeCompanyId, force: forceFlag })
                });
                return res;
            };

            try {
                let res = await doSignup(false);
                const data = await res.json();

                // Duplicate name warning — ask admin to confirm
                if (res.status === 409 && data.warn) {
                    btn.disabled = false;
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Create User Account`;
                    const confirmed = confirm(`⚠️ ${data.message}\n\nNote: Having two accounts with the same name might cause confusion in task tracking.\n\nDo you still want to create it?`);
                    if (confirmed) {
                        btn.disabled = true;
                        btn.innerHTML = `<span style="opacity:0.7">Creating…</span>`;
                        res = await doSignup(true);
                        const d2 = await res.json();
                        btn.disabled = false;
                        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Create User Account`;
                        if (res.ok) {
                            msgEl.style.cssText = 'display:block;background:rgba(16,185,129,0.1);color:#10b981;border:1px solid #6ee7b7;';
                            msgEl.textContent = `✅ Account created for ${d2.user.name} (${d2.user.email}). Share credentials manually.`;
                            form.reset();
                            showNotification(`User "${d2.user.name}" created successfully!`, 'success');
                            fetchData().then(() => renderAll());
                        } else {
                            msgEl.style.cssText = 'display:block;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid #fecaca;';
                            msgEl.textContent = '❌ ' + (d2.error || 'Failed to create user.');
                        }
                    }
                    return;
                }

                btn.disabled = false;
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Create User Account`;
                if (!res.ok) {
                    msgEl.style.cssText = 'display:block;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid #fecaca;';
                    msgEl.textContent = '❌ ' + (data.error || 'Failed to create user.');
                } else {
                    msgEl.style.cssText = 'display:block;background:rgba(16,185,129,0.1);color:#10b981;border:1px solid #6ee7b7;';
                    msgEl.textContent = `✅ Account created for ${data.user.name} (${data.user.email}). Share credentials manually.`;
                    form.reset();
                    showNotification(`User "${data.user.name}" created successfully!`, 'success');
                    fetchData().then(() => renderAll());
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = `Create User Account`;
                msgEl.style.cssText = 'display:block;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid #fecaca;';
                msgEl.textContent = '❌ Network error: ' + err.message;
            }
        });
    }
}




// ── MULTI-COMPANY AND STAGES LOGIC (NEW) ──────────────────────────────────────
state.companies = [];
state.activeCompanyId = localStorage.getItem('bh_active_company_id') || '';
state.currentDeptStages = [];

async function loadCompanies() {
    try {
        const res = await fetch('/api/companies');
        const list = await res.json();
        state.companies = list || [];
        
        if (state.companies.length > 0) {
            const exists = state.companies.some(c => c._id === state.activeCompanyId);
            if (!exists) {
                state.activeCompanyId = state.companies[0]._id;
                localStorage.setItem('bh_active_company_id', state.activeCompanyId);
            }
        } else {
            state.activeCompanyId = '';
            localStorage.removeItem('bh_active_company_id');
        }
        
        updateCompanyUI();
    } catch (err) {
        console.error('Error loading companies:', err);
    }
}
window.loadCompanies = loadCompanies;

function updateCompanyUI() {
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const isAdmin = user.role === 'admin';
    
    const switcherWrap = $('company-switcher-wrap');
    if (switcherWrap) {
        if (state.companies.length > 0) {
            switcherWrap.style.display = 'flex';
        } else {
            switcherWrap.style.display = 'none';
        }
    }
    
    const activeCompName = $('active-company-name');
    const active = state.companies.find(c => c._id === state.activeCompanyId);
    if (activeCompName) {
        activeCompName.textContent = active ? active.name : 'Select Company';
    }
    
    const dropdownList = $('company-dropdown-list');
    if (dropdownList) {
        dropdownList.innerHTML = '';
        state.companies.forEach(comp => {
            const item = document.createElement('div');
            item.style.cssText = `padding: 0.6rem 0.85rem; font-size: 0.82rem; cursor: pointer; color: var(--text); border-bottom: 1px solid var(--gray-100); display: flex; align-items: center; justify-content: space-between; background: ${comp._id === state.activeCompanyId ? 'rgba(99,102,241,0.1)' : 'transparent'}; font-weight: ${comp._id === state.activeCompanyId ? '700' : 'normal'};`;
            item.innerHTML = `
                <span>🏢 ${comp.name}</span>
                ${comp._id === state.activeCompanyId ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
            `;
            item.onclick = () => selectCompany(comp._id);
            dropdownList.appendChild(item);
        });
    }
    
    const switcherAdd = $('company-switcher-add');
    if (switcherAdd) {
        switcherAdd.style.display = isAdmin ? 'block' : 'none';
    }
    
    const banner = $('active-company-banner');
    const bannerName = $('banner-company-name');
    const bannerMeta = $('banner-company-meta');
    if (banner) {
        if (active) {
            banner.style.cssText = 'display:flex;padding:0.75rem 1.25rem;border-radius:12px;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(167,139,250,0.08));border:1px solid rgba(99,102,241,0.2);align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;';
            if (bannerName) bannerName.textContent = active.name;
            if (bannerMeta) bannerMeta.textContent = `${active.industry || 'General'} • Est. ${active.establishedYear || 'N/A'}`;
        } else {
            banner.style.display = 'none';
        }
    }
    
    const adminCompList = $('company-admin-list');
    if (adminCompList) {
        adminCompList.innerHTML = '';
        if (state.companies.length === 0) {
            adminCompList.innerHTML = `<p style="color:var(--secondary);font-size:0.85rem;text-align:center;padding:1.5rem;background:var(--gray-50);border-radius:10px;border:1px dashed var(--gray-200);">No companies registered yet. Create one on the left!</p>`;
        } else {
            state.companies.forEach(comp => {
                const isActive = comp._id === state.activeCompanyId;
                const card = document.createElement('div');
                card.style.cssText = `background: var(--surface); border: 1px solid ${isActive ? 'var(--primary)' : 'var(--gray-200)'}; border-radius: 12px; padding: 0.85rem 1.15rem; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--shadow-sm); margin-bottom: 0.5rem;`;
                card.innerHTML = `
                    <div>
                        <div style="font-weight: 700; font-size: 0.9rem; color: var(--text); display:flex; align-items:center; gap:0.4rem;">
                            <span>🏢 ${comp.name}</span>
                            ${isActive ? '<span style="font-size:0.62rem; font-weight:700; color:var(--primary); background:rgba(99,102,241,0.12); padding:2px 6px; border-radius:10px; text-transform:uppercase;">Active</span>' : ''}
                        </div>
                        <div style="font-size: 0.72rem; color: var(--secondary); margin-top: 0.2rem;">
                            ${comp.industry || 'No industry specified'} • Est. ${comp.establishedYear || 'N/A'}
                        </div>
                    </div>
                    <div style="display:flex; gap:0.4rem;">
                        <button onclick="selectCompany('${comp._id}')" class="btn btn-secondary" style="font-size:0.75rem; padding:0.35rem 0.65rem;">Use</button>
                        <button onclick="handleDeleteCompany('${comp._id}')" class="btn btn-secondary" style="font-size:0.75rem; padding:0.35rem 0.65rem; color:#ef4444; border-color:transparent;">Delete</button>
                    </div>
                `;
                adminCompList.appendChild(card);
            });
        }
    }
}

function toggleCompanySwitcher() {
    const dropdown = $('company-switcher-dropdown');
    if (!dropdown) return;
    const isShowing = dropdown.style.display === 'block';
    dropdown.style.display = isShowing ? 'none' : 'block';
    
    if (!isShowing) {
        const closeDropdown = (e) => {
            if (!e.target.closest('#company-switcher-wrap')) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        };
        setTimeout(() => document.addEventListener('click', closeDropdown), 0);
    }
}
window.toggleCompanySwitcher = toggleCompanySwitcher;

async function selectCompany(id) {
    state.activeCompanyId = id;
    localStorage.setItem('bh_active_company_id', id);
    
    // Clear stale company-scoped state immediately so stale data never renders
    state.deptStages = [];
    state.deptObjects = [];
    state.departments = [];
    state.tasks = [];
    state.personal = [];

    const dropdown = $('company-switcher-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    showNotification('Switched company context', 'success');
    updateCompanyUI();
    
    await fetchData();
    renderAll();
    
    // Refresh admin lists if active view is admin
    if (state.currentView === 'admin') {
        renderDeptAdminList();
        populateHierarchyDropdowns();
    }
    
    populateStageDeptDropdown();
}
window.selectCompany = selectCompany;

async function handleAddCompany() {
    const nameInput = $('new-company-name');
    const indInput = $('new-company-industry');
    const yearInput = $('new-company-year');
    
    const name = nameInput.value.trim();
    if (!name) {
        showNotification('Company name is required', 'error');
        return;
    }
    
    const body = {
        name,
        industry: indInput.value.trim(),
        establishedYear: yearInput.value ? parseInt(yearInput.value) : null
    };
    
    try {
        const res = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add company');
        
        nameInput.value = '';
        indInput.value = '';
        yearInput.value = '';
        
        showNotification(`Company "${name}" created!`, 'success');
        
        await loadCompanies();
        if (state.companies.length > 0) {
            const newComp = state.companies.find(c => c.name === name);
            if (newComp) await selectCompany(newComp._id);
        }
    } catch (err) {
        showNotification(err.message, 'error');
    }
}
window.handleAddCompany = handleAddCompany;

async function handleDeleteCompany(id) {
    const comp = state.companies.find(c => c._id === id);
    if (!comp) return;
    
    const conf = confirm(`⚠️ Warning: Are you sure you want to delete "${comp.name}"?\n\nThis will also delete ALL departments, tasks, and members linked to this company!`);
    if (!conf) return;
    
    try {
        const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete company');
        }
        
        showNotification(`Company "${comp.name}" deleted successfully.`, 'success');
        
        if (state.activeCompanyId === id) {
            state.activeCompanyId = '';
            localStorage.removeItem('bh_active_company_id');
        }
        
        await loadCompanies();
        await fetchData();
        renderAll();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}
window.handleDeleteCompany = handleDeleteCompany;

function openAddCompanyModal() {
    const dropdown = $('company-switcher-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    switchView('admin');
    const input = $('new-company-name');
    if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
window.openAddCompanyModal = openAddCompanyModal;

function openEditCompanyModal() {
    const active = state.companies.find(c => c._id === state.activeCompanyId);
    if (!active) return;
    
    $('edit-company-id').value = active._id;
    $('edit-company-name-input').value = active.name;
    $('edit-company-industry-input').value = active.industry || '';
    $('edit-company-year-input').value = active.establishedYear || '';
    
    $('edit-company-modal').style.display = 'flex';
}
window.openEditCompanyModal = openEditCompanyModal;

function closeEditCompanyModal() {
    $('edit-company-modal').style.display = 'none';
}
window.closeEditCompanyModal = closeEditCompanyModal;

async function handleSaveCompanyEdit(e) {
    if (e) e.preventDefault();
    const id = $('edit-company-id').value;
    const name = $('edit-company-name-input').value.trim();
    const industry = $('edit-company-industry-input').value.trim();
    const establishedYear = $('edit-company-year-input').value ? parseInt($('edit-company-year-input').value) : null;
    
    if (!name) return;
    
    try {
        const res = await fetch(`/api/companies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, industry, establishedYear })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update company');
        
        closeEditCompanyModal();
        showNotification('Company updated successfully!', 'success');
        await loadCompanies();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}
window.handleSaveCompanyEdit = handleSaveCompanyEdit;

async function handleMigrateData() {
    if (!state.activeCompanyId) {
        showNotification('Please select or create an active company first.', 'error');
        return;
    }
    
    const active = state.companies.find(c => c._id === state.activeCompanyId);
    const conf = confirm(`Link all existing, unlinked departments, tasks, and members to "${active.name}"?`);
    if (!conf) return;
    
    try {
        const res = await fetch('/api/companies/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName: active.name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Migration failed');
        
        showNotification(`Success! Link completed.`, 'success');
        await fetchData();
        renderAll();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}
window.handleMigrateData = handleMigrateData;

function populateStageDeptDropdown() {
    const select = $('stage-dept-select');
    if (!select) return;
    select.innerHTML = '<option value="">Choose a department...</option>';
    
    state.deptObjects.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d._id;
        opt.textContent = d.name;
        select.appendChild(opt);
    });
}
window.populateStageDeptDropdown = populateStageDeptDropdown;

async function loadDeptStagesForAdmin() {
    const deptId = $('stage-dept-select').value;
    const listContainer = $('stages-admin-list');
    const countSpan = $('stages-count');
    
    if (!deptId) {
        listContainer.innerHTML = `<p style="color:var(--secondary);font-size:0.85rem;text-align:center;padding:2rem;background:var(--gray-50);border-radius:10px;border:1px dashed var(--gray-200);">Please select a department to load and edit its stages pipeline.</p>`;
        countSpan.textContent = '0 stages';
        state.currentDeptStages = [];
        return;
    }
    
    try {
        const res = await fetch(`/api/dept-stages/${deptId}?companyId=${state.activeCompanyId}`);
        const stages = await res.json();
        state.currentDeptStages = stages || [];
        renderStagesList();
    } catch (err) {
        showNotification('Error loading stages', 'error');
    }
}
window.loadDeptStagesForAdmin = loadDeptStagesForAdmin;

function renderStagesList() {
    const listContainer = $('stages-admin-list');
    const countSpan = $('stages-count');
    countSpan.textContent = `${state.currentDeptStages.length} stages`;
    
    listContainer.innerHTML = '';
    
    if (state.currentDeptStages.length === 0) {
        listContainer.innerHTML = `<p style="color:var(--secondary);font-size:0.85rem;text-align:center;padding:2rem;background:var(--gray-50);border-radius:10px;border:1px dashed var(--gray-200);">No stages defined for this department. Add your first stage using the form!</p>`;
        return;
    }
    
    state.currentDeptStages.forEach((stage, idx) => {
        const item = document.createElement('div');
        item.style.cssText = `background: var(--surface); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--shadow-sm); margin-bottom:0.5rem;`;
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: ${stage.color}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
                    ${idx + 1}
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.88rem; color: var(--text);">${stage.title}</div>
                    <div style="font-size: 0.72rem; color: var(--secondary); margin-top: 0.15rem;">${stage.description || 'No description'}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
                <button onclick="moveStage(${idx}, -1)" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" ${idx === 0 ? 'disabled' : ''}>▲</button>
                <button onclick="moveStage(${idx}, 1)" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" ${idx === state.currentDeptStages.length - 1 ? 'disabled' : ''}>▼</button>
                <button onclick="handleDeleteStage(${idx})" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444; border-color: transparent;">Delete</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

async function handleAddStage() {
    const deptId = $('stage-dept-select').value;
    if (!deptId) {
        showNotification('Please select a department first', 'error');
        return;
    }
    
    const titleInput = $('new-stage-title');
    const descInput = $('new-stage-desc');
    const colorInput = $('new-stage-color');
    
    const title = titleInput.value.trim();
    if (!title) {
        showNotification('Stage name is required', 'error');
        return;
    }
    
    const newStage = {
        title,
        description: descInput.value.trim(),
        color: colorInput.value
    };
    
    state.currentDeptStages.push(newStage);
    
    titleInput.value = '';
    descInput.value = '';
    colorInput.value = '#6366f1';
    
    await saveDeptStages();
}
window.handleAddStage = handleAddStage;

async function handleDeleteStage(index) {
    state.currentDeptStages.splice(index, 1);
    await saveDeptStages();
}
window.handleDeleteStage = handleDeleteStage;

async function moveStage(index, direction) {
    if (index + direction < 0 || index + direction >= state.currentDeptStages.length) return;
    const targetIdx = index + direction;
    const temp = state.currentDeptStages[index];
    state.currentDeptStages[index] = state.currentDeptStages[targetIdx];
    state.currentDeptStages[targetIdx] = temp;
    await saveDeptStages();
}
window.moveStage = moveStage;

async function saveDeptStages() {
    const deptId = $('stage-dept-select').value;
    if (!deptId) return;
    
    try {
        const res = await fetch(`/api/dept-stages/${deptId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stages: state.currentDeptStages,
                companyId: state.activeCompanyId
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save stages');
        
        showNotification('Stages updated successfully!', 'success');
        state.currentDeptStages = data || [];
        renderStagesList();

        // ── sync state.deptStages so pipeline feed & admin list update immediately ──
        const existingIdx = state.deptStages.findIndex(s => String(s.departmentId) === String(deptId));
        if (existingIdx >= 0) {
            state.deptStages[existingIdx] = { ...state.deptStages[existingIdx], stages: state.currentDeptStages };
        } else {
            state.deptStages.push({ departmentId: deptId, companyId: state.activeCompanyId, stages: state.currentDeptStages });
        }
        // Refresh admin list and pipeline feed
        renderDeptAdminList();
        if (state.currentView === 'dashboard') renderDashboard();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}
window.saveDeptStages = saveDeptStages;

function renderDashboardPipelineFeed(tasks) {
    const container = document.getElementById('dashboard-pipeline-feed');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const role = user.role || 'employee';
    const isAdmin = role === 'admin';
    const isDeptLeader = role === 'dept_leader';

    // Only admin and dept_leader see this summary tracker
    if (!isAdmin && !isDeptLeader) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    let visibleDepts = state.deptObjects;
    if (isDeptLeader) {
        const myDept = (user.department || '').trim().toLowerCase();
        visibleDepts = state.deptObjects.filter(d => d.name.trim().toLowerCase() === myDept);
    }

    if (visibleDepts.length === 0) {
        container.innerHTML = '';
        return;
    }

    const today = new Date(); today.setHours(0,0,0,0);

    let html = `
        <div class=\"ai-insight-panel\" style=\"width:100%;background:var(--surface);border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:1.25rem 1.5rem;\">
            <div class=\"ai-section-title\" style=\"margin-bottom:0.4rem;color:var(--dark);display:flex;align-items:center;gap:0.5rem;\">
                <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"var(--primary)\" stroke-width=\"2.5\"><polyline points=\"22 12 18 12 15 21 9 3 6 12 2 12\"/></svg>
                Department Workflow & Stage Overview
            </div>
            <p style=\"font-size:0.78rem;color:var(--secondary);margin-bottom:1.25rem;\">
                Quick view of active tasks, current stages, and pending deliverables.
            </p>
            <div style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;\">
    `;

    visibleDepts.forEach(d => {
        const cfg = getDeptConfig(d.name);
        const deptTasks = tasks.filter(t => (t.department || '').trim().toLowerCase() === d.name.trim().toLowerCase() && t.status !== 'Completed');
        const deptStageDoc = state.deptStages.find(s => String(s.departmentId) === String(d._id));
        const stagesList = deptStageDoc ? deptStageDoc.stages : [];

        const overdueCount = deptTasks.filter(t => {
            const due = t.due_date ? new Date(t.due_date) : null;
            return due && due < today;
        }).length;

        // Group tasks by their stage
        const stageSummary = {};
        deptTasks.forEach(t => {
            const st = t.currentStage || 'Unassigned';
            stageSummary[st] = (stageSummary[st] || 0) + 1;
        });

        const stageLines = Object.entries(stageSummary).map(([stage, count]) => {
            const stageObj = stagesList.find(s => s.title === stage);
            const badgeColor = stageObj ? stageObj.color : '#f97316';
            return `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;padding:0.35rem 0.5rem;background:var(--gray-50);border-radius:6px;border:1px solid var(--gray-150);">
                    <span style="display:flex;align-items:center;gap:0.4rem;font-weight:600;color:var(--dark);">
                        <span style="width:7px;height:7px;border-radius:50%;background:${badgeColor};"></span>
                        ${stage}
                    </span>
                    <span style="font-weight:700;color:${badgeColor};background:${badgeColor}15;padding:1px 6px;border-radius:10px;">${count} tasks</span>
                </div>
            `;
        }).join('');

        html += `
            <div style="padding:1rem;border:1px solid var(--gray-200);border-top:3px solid ${cfg.color};border-radius:10px;background:var(--card-bg);display:flex;flex-direction:column;gap:0.75rem;box-shadow:var(--shadow-sm);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:800;font-size:0.9rem;color:var(--dark);">${d.name}</span>
                    <span style="font-size:0.7rem;font-weight:700;background:${cfg.bg};color:${cfg.color};padding:2px 8px;border-radius:10px;">Leader: ${d.deptLeader || 'None'}</span>
                </div>
                
                <div style="display:flex;gap:0.5rem;margin:0.25rem 0;">
                    <div style="flex:1;background:var(--gray-50);padding:0.4rem;border-radius:6px;text-align:center;border:1px solid var(--gray-150);">
                        <div style="font-size:0.6rem;color:var(--secondary);text-transform:uppercase;font-weight:700;">Active Tasks</div>
                        <div style="font-size:0.95rem;font-weight:800;color:var(--dark);margin-top:0.1rem;">${deptTasks.length}</div>
                    </div>
                    <div style="flex:1;background:${overdueCount > 0 ? 'rgba(239,68,68,0.05)' : 'var(--gray-50)'};padding:0.4rem;border-radius:6px;text-align:center;border:1px solid ${overdueCount > 0 ? '#ef444430' : 'var(--gray-150)'};">
                        <div style="font-size:0.6rem;color:${overdueCount > 0 ? '#ef4444' : 'var(--secondary)'};text-transform:uppercase;font-weight:700;">Overdue</div>
                        <div style="font-size:0.95rem;font-weight:800;color:${overdueCount > 0 ? '#ef4444' : 'var(--dark)'};margin-top:0.1rem;">${overdueCount}</div>
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:0.4rem;margin-top:0.25rem;">
                    <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;color:var(--secondary);letter-spacing:0.04em;">Current Pipeline Positions:</div>
                    ${stageLines || `<div style="font-size:0.72rem;color:var(--secondary);font-style:italic;text-align:center;padding:0.4rem;">No active tasks in progress.</div>`}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
}
function toggleStageTasksPopup(id) {
    const el = document.getElementById(`popup-${id}`);
    if (el) {
        const isShowing = el.style.display === 'block';
        el.style.display = isShowing ? 'none' : 'block';
    }
}
window.toggleStageTasksPopup = toggleStageTasksPopup;

// ── AI ANALYSIS CHATBOT ───────────────────────────────────────────────────────
const chatHistory = [];

function renderChatMessage(sender, text) {
    const log = $('chatbot-message-log');
    if (!log) return;

    const isUser = sender === 'user';
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `display:flex; gap:0.75rem; max-width:85%; align-self:${isUser ? 'flex-end' : 'flex-start'}; animation: fadeInUp 0.25s ease;`;

    const avatar = document.createElement('div');
    avatar.style.cssText = `width:32px; height:32px; border-radius:50%; background:${isUser ? 'var(--accent, #6366f1)' : 'var(--primary)'}; color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.72rem; font-weight:bold; order:${isUser ? 2 : 0};`;
    avatar.textContent = isUser ? 'You' : 'AI';

    const bubble = document.createElement('div');
    bubble.style.cssText = `background:${isUser ? 'var(--primary)' : 'var(--white)'}; color:${isUser ? '#fff' : 'var(--text)'}; border:1px solid ${isUser ? 'transparent' : 'var(--gray-200)'}; border-radius:12px; border-${isUser ? 'top-right' : 'top-left'}-radius:2px; padding:0.85rem 1rem; font-size:0.84rem; line-height:1.6; box-shadow:var(--shadow-sm); white-space:pre-wrap; word-break:break-word;`;

    // Basic markdown-lite: bold, bullet points
    bubble.innerHTML = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[-•] (.+)$/gm, '<span style="display:block;padding-left:0.5rem;">• $1</span>')
        .replace(/\n/g, '<br>');

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    log.appendChild(wrapper);
    log.scrollTop = log.scrollHeight;
}

function showChatTypingIndicator() {
    const log = $('chatbot-message-log');
    if (!log) return null;

    const el = document.createElement('div');
    el.id = 'chatbot-typing-indicator';
    el.style.cssText = 'display:flex; gap:0.75rem; max-width:85%; align-self:flex-start; animation: fadeInUp 0.2s ease;';
    el.innerHTML = `
        <div style="width:32px; height:32px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.72rem; font-weight:bold;">AI</div>
        <div style="background:var(--white); border:1px solid var(--gray-200); border-radius:12px; border-top-left-radius:2px; padding:0.85rem 1rem; box-shadow:var(--shadow-sm); display:flex; gap:5px; align-items:center;">
            <span style="width:7px;height:7px;border-radius:50%;background:var(--secondary);display:inline-block;animation:chatBounce 1s infinite 0s;"></span>
            <span style="width:7px;height:7px;border-radius:50%;background:var(--secondary);display:inline-block;animation:chatBounce 1s infinite 0.2s;"></span>
            <span style="width:7px;height:7px;border-radius:50%;background:var(--secondary);display:inline-block;animation:chatBounce 1s infinite 0.4s;"></span>
        </div>
    `;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
}

async function sendChatMessage(message) {
    if (!message || !message.trim()) return;

    // Push to UI
    renderChatMessage('user', message);
    chatHistory.push({ sender: 'user', text: message });

    // Clear input
    const input = $('chatbot-input-field');
    if (input) input.value = '';

    // Show typing
    const typingEl = showChatTypingIndicator();

    try {
        const tasksAll = state.tasks || [];
        const depts = state.departments || [];

        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                chatHistory: chatHistory.slice(-10),
                tasks: tasksAll,
                departments: depts.map(d => ({ name: d.name, manager: d.manager }))
            })
        });

        const data = await res.json();

        typingEl?.remove();

        if (!res.ok) {
            // Show only human-readable part, not raw JSON
            let errMsg = data?.error || `Server error (${res.status})`;
            // If it's a JSON string, try to extract just the message
            if (typeof errMsg === 'string' && errMsg.startsWith('{')) {
                try { errMsg = JSON.parse(errMsg)?.message || errMsg; } catch(e) {}
            }
            renderChatMessage('ai', `⚠️ ${errMsg}`);
            return;
        }

        const reply = data.reply || 'No reply generated.';
        renderChatMessage('ai', reply);
        chatHistory.push({ sender: 'ai', text: reply });

    } catch (err) {
        typingEl?.remove();
        renderChatMessage('ai', `⚠️ Network error: ${err.message}`);
        console.error('Chatbot error:', err);
    }
}

async function handleChatbotSubmit(e) {
    e.preventDefault();
    const input = $('chatbot-input-field');
    const msg = input?.value?.trim();
    if (msg) await sendChatMessage(msg);
}

async function sendQuickChat(msg) {
    await sendChatMessage(msg);
}

// Inject chatbot bounce animation
(function injectChatbotStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes chatBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
            40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
})();

window.handleChatbotSubmit = handleChatbotSubmit;
window.sendQuickChat = sendQuickChat;

// ── START ─────────────────────────────────────────────────────────────────────
setupAdminPanel();
init();


