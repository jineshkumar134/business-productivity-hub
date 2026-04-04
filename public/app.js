/**
 * Business Hub – Frontend Logic v2.0
 * CRED-inspired UI | Poppins | Blue + Orange
 */

// ── Auth Guard ──────────────────────────────────────────────────────────────
if (!localStorage.getItem('bh_user')) window.location.href = '/login.html';

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
const getDeptConfig = (name) => DEPT_CONFIG.find(d => d.name === name) || { color:'#6366f1', bg:'rgba(99,102,241,0.12)', icon:'' };

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
    currentView: 'dashboard',
    tasks: [], personal: [], logs: [],
    selectedPersonal: [],
    departments: DEPT_CONFIG.map(d => d.name),
    orgVision: localStorage.getItem('bh_vision') || '',
    orgMission: localStorage.getItem('bh_mission') || '',
    searchQuery: '',
    personPhotoData: '',
    theme: localStorage.getItem('bh_theme') || 'light'
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
    themeIcon: $('theme-icon')
};

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
    applyTheme();
    setupEventListeners();
    renderUserGreeting();
    loadVisionMission();
    await fetchData();
    renderAll();
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

    // Modals
    el.addTaskGlobalBtn?.addEventListener('click', () => openTaskModal());
    el.addPersonalBtn?.addEventListener('click', () => openPersonalModal());
    el.analyzeLogsBtn?.addEventListener('click', handleAIAnalysis);

    el.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            el.taskModal.classList.remove('active');
            el.personalModal.classList.remove('active');
            el.profileModal.classList.remove('active');
        });
    });

    // Close modal on backdrop click
    [el.taskModal, el.personalModal, el.profileModal].forEach(m => {
        m?.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
    });

    // Forms
    el.taskForm?.addEventListener('submit', handleTaskSubmit);
    el.personalForm?.addEventListener('submit', handlePersonalSubmit);

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

    // Search
    $('global-search')?.addEventListener('input', e => {
        state.searchQuery = e.target.value.toLowerCase();
        if (state.currentView === 'dashboard') renderDashboard();
        else if (state.currentView === 'hr') renderPersonal();
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
    el.taskForm.querySelectorAll('input:not([type="radio"]), select, textarea').forEach(inp => {
        if (!['task-completed-date','task-due-date','task-delay-reason','task-id'].includes(inp.id)) {
            inp.disabled = isCompleted;
        }
    });
    el.taskForm.querySelectorAll('input[type="radio"]').forEach(inp => {
        if (inp.name !== 'task-status') inp.disabled = isCompleted;
    });
    const pDrop = $('personal-dropdown');
    if(pDrop) pDrop.disabled = isCompleted;
}

function renderUserGreeting() {
    const user = JSON.parse(localStorage.getItem('bh_user') || '{}');
    const nameEl = $('header-user-name');
    if (nameEl) nameEl.textContent = user.name || 'User';
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
    dashboard: { t:'Dashboard Overview',           d:'Monitor organizational performance in real-time.' },
    summary:   { t:'Organizational Working',        d:'Live pipeline and health of all departments.' },
    ai:        { t:'AI Strategic Alignment',        d:'Evaluate tasks against your organization\'s vision & mission.' },
    hr:        { t:'Team Management',               d:'Manage personnel and define core responsibilities.' },
    logs:      { t:'Activity Logs',                 d:'Full audit trail of all system changes and task updates.' },
    invoicing: { t:'Invoicing Calculator',          d:'Estimate GST and TDS for your transactions with ease.' },
};
function switchView(viewName) {
    state.currentView = viewName;
    el.navItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-view') === viewName));
    el.views.forEach(v => v.classList.toggle('active', v.id === `${viewName}-view`));
    const meta = VIEW_META[viewName] || { t:'', d:'' };
    el.viewTitle.textContent = meta.t;
    el.viewDesc.textContent = meta.d;
    renderAll();
}

// ── DATA ──────────────────────────────────────────────────────────────────────
async function fetchData() {
    try {
        const [tRes, pRes, lRes] = await Promise.all([
            fetch('/api/tasks').then(r => r.json()),
            fetch('/api/personal').then(r => r.json()),
            fetch('/api/logs').then(r => r.json()),
        ]);
        state.tasks = tRes; state.personal = pRes; state.logs = lRes;
    } catch(err) { showNotification('Error fetching data', 'error'); }
}

function renderAll() {
    const v = state.currentView;
    if (v === 'dashboard') renderDashboard();
    else if (v === 'summary') renderSummary();
    else if (v === 'ai') renderAIView();
    else if (v === 'hr') renderPersonal();
    else if (v === 'logs') renderLogs();
    renderPersonalDropdown();
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard() {
    const tasks = state.searchQuery
        ? state.tasks.filter(t => t.task_name?.toLowerCase().includes(state.searchQuery) || t.description?.toLowerCase().includes(state.searchQuery))
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
        card.querySelector?.('before');
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
                            <div class="mini-task-content" style="font-weight:700;font-size:0.88rem;">${t.task_name}</div>
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
                    <div class="mini-task-meta">
                        <span class="status-badge status-${t.status.toLowerCase().replace(' ','')}">${t.status}</span>
                        <span class="priority-${t.priority.toLowerCase()}">${t.priority}</span>
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
        ${!data.hasKey ? `<div style="background:var(--warning);color:white;padding:0.6rem;text-align:center;font-size:0.8rem;font-weight:600;border-radius:var(--radius-sm);margin-bottom:1rem;">⚠️ Using deterministic fallback analysis. Provide a GEMINI_API_KEY in backend .env to unlock full GenAI insights.</div>` : ''}
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
        state.selectedPersonal=[...(task.responsible||[])]; renderSelectedPersonal();
        $('modal-title').textContent='Edit Task';
        const c=task.status==='Completed'; el.completedDateGroup.style.display=c?'block':'none';
        el.taskForm.querySelectorAll('input,select,textarea').forEach(i=>{i.disabled=c&&!['task-completed-date','task-status','task-due-date','task-delay-reason','task-id'].includes(i.id);});
        $('personal-dropdown').disabled=c;
    } else {
        $('task-id').value=''; if(dept)$('task-department').value=dept;
        $('task-requested-by').value=''; $('modal-title').textContent='Create New Task';
        el.completedDateGroup.style.display='none'; el.delayReasonGroup.style.display='none';
        el.taskForm.querySelectorAll('input,select,textarea').forEach(i=>i.disabled=false);
        $('personal-dropdown').disabled=false;
    }
    el.taskModal.classList.add('active'); checkTaskConstraints();
}

function openPersonalModal(personId=null){
    el.personalForm.reset(); state.personPhotoData=''; $('person-photo-data').value='';
    const pInit=$('person-preview-initial'); if(pInit)pInit.textContent='?';
    const pImg=$('person-preview-avatar')?.querySelector('img'); if(pImg)pImg.remove();
    if(personId){
        const person=state.personal.find(p=>p._id===personId);if(!person)return;
        $('person-id').value=person._id; $('person-name').value=person.name;
        $('person-role').value=person.role; $('person-dept').value=person.department;
        $('person-email').value=person.email||''; $('person-responsibility').value=person.responsibility||'';
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
async function handleTaskSubmit(e){
    e.preventDefault();
    const id=$('task-id').value;
    if(state.selectedPersonal.length===0){showNotification('Assign at least one person','error');return;}
    const taskData={task_name:$('task-name').value,department:$('task-department').value,priority:document.querySelector('input[name="task-priority"]:checked').value,status:document.querySelector('input[name="task-status"]:checked').value,progress:parseInt($('task-progress').value),due_date:$('task-due-date').value,completed_date:$('task-completed-date').value,delay_reason:$('task-delay-reason').value,requested_by:$('task-requested-by').value,description:$('task-description').value,responsible:state.selectedPersonal};
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
            // Fetch only logs since they are small and server-generated
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
    // Always prefer state.personPhotoData — it's reliably set on upload and edit-modal open
    const photoData = state.personPhotoData || $('person-photo-data').value || '';
    const personData={
        name:$('person-name').value,
        role:$('person-role').value,
        department:$('person-dept').value,
        email:$('person-email').value,
        responsibility:$('person-responsibility').value,
        photoData
    };
    const btn = e.submitter;
    const originalHtml = btn ? btn.innerHTML : '';
    if(btn){ btn.disabled=true; btn.innerHTML='<div class="spinner-small"></div> Saving...'; }
    try{
        const res=await fetch(
            id ? `/api/personal/${id}` : '/api/personal',
            { method: id?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(personData) }
        );
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
            renderAll();
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
window.deletePersonal=async id=>{if(!confirm('Remove this team member?'))return;try{const r = await fetch(`/api/personal/${id}`,{method:'DELETE'});if(r.ok){showNotification('Member removed','success');state.personal = state.personal.filter(p => p._id !== id && p.id !== id);renderAll();}}catch(e){showNotification('Error','error');}};

// ── START ─────────────────────────────────────────────────────────────────────
init();
