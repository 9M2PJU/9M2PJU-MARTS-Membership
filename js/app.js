/**
 * MARTS Membership - Main Application
 * Handles UI rendering, events, and app lifecycle
 */

// App state
let displayedMembers = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 50;
let isLoading = false;

// DOM Elements
const elements = {
    loadingOverlay: null,
    membersGrid: null,
    searchInput: null,
    clearSearch: null,
    prefixFilter: null,
    yearFilter: null,
    monthFilter: null,
    statusFilter: null,
    resetFiltersBtn: null,
    addMemberBtn: null,
    syncDataBtn: null,
    exportBtn: null,
    loadMoreBtn: null,
    loadMoreContainer: null,
    emptyState: null,
    themeToggle: null,
    installBtn: null,
    // Stats
    totalCount: null,
    activeCount: null,
    expiredCount: null,
    filteredCount: null,
    lastSync: null,
    // Modals
    memberModal: null,
    deleteModal: null,
    syncModal: null
};

// PWA Install prompt
let deferredPrompt = null;

/**
 * Initialize the application
 */
async function initApp() {
    console.log('🚀 Initializing MARTS Membership App...');

    // Cache DOM elements
    cacheElements();

    // Initialize theme
    initTheme();

    // Initialize Supabase
    DataManager.init();

    // Load data
    await DataManager.load();

    // Populate year filter
    populateYearFilter();

    // Initial render
    renderMembers();
    updateStats();
    updateLastSync();

    // Bind events
    bindEvents();

    // Register service worker
    registerServiceWorker();

    // Hide loading overlay
    hideLoading();

    console.log('✅ App initialized successfully');
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
    elements.loadingOverlay = document.getElementById('loading-overlay');
    elements.membersGrid = document.getElementById('members-grid');
    elements.searchInput = document.getElementById('search-input');
    elements.clearSearch = document.getElementById('clear-search');
    elements.prefixFilter = document.getElementById('prefix-filter');
    elements.yearFilter = document.getElementById('year-filter');
    elements.monthFilter = document.getElementById('month-filter');
    elements.statusFilter = document.getElementById('status-filter');
    elements.resetFiltersBtn = document.getElementById('reset-filters');
    elements.addMemberBtn = document.getElementById('add-member-btn');
    elements.syncDataBtn = document.getElementById('sync-data-btn');
    elements.exportBtn = document.getElementById('export-btn');
    elements.loadMoreBtn = document.getElementById('load-more-btn');
    elements.loadMoreContainer = document.getElementById('load-more-container');
    elements.emptyState = document.getElementById('empty-state');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.installBtn = document.getElementById('install-btn');
    elements.totalCount = document.getElementById('total-count');
    elements.activeCount = document.getElementById('active-count');
    elements.expiredCount = document.getElementById('expired-count');
    elements.filteredCount = document.getElementById('filtered-count');
    elements.lastSync = document.getElementById('last-sync');
    elements.memberModal = document.getElementById('member-modal');
    elements.deleteModal = document.getElementById('delete-modal');
    elements.syncModal = document.getElementById('sync-modal');
}

/**
 * Bind event listeners
 */
function bindEvents() {
    // Search
    const debouncedSearch = FilterManager.debounce(handleSearch, 300);
    elements.searchInput.addEventListener('input', debouncedSearch);
    elements.clearSearch.addEventListener('click', clearSearch);

    // Filters
    elements.prefixFilter.addEventListener('change', handleFilterChange);
    elements.yearFilter.addEventListener('change', handleFilterChange);
    elements.monthFilter.addEventListener('change', handleFilterChange);
    elements.statusFilter.addEventListener('change', handleFilterChange);
    elements.resetFiltersBtn.addEventListener('click', handleResetFilters);

    // Actions
    elements.addMemberBtn.addEventListener('click', () => openMemberModal());
    elements.syncDataBtn.addEventListener('click', handleSync);
    elements.exportBtn.addEventListener('click', () => DataManager.export());
    elements.loadMoreBtn.addEventListener('click', loadMore);

    // Theme
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Install PWA
    elements.installBtn.addEventListener('click', installPWA);

    // Modal events
    document.getElementById('modal-close').addEventListener('click', closeMemberModal);
    document.getElementById('modal-cancel').addEventListener('click', closeMemberModal);
    document.getElementById('member-form').addEventListener('submit', handleMemberSubmit);
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', closeAllModals);
    });

    // Delete modal
    document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-confirm').addEventListener('click', handleDeleteConfirm);

    // Sync modal
    document.getElementById('sync-modal-close').addEventListener('click', closeSyncModal);
    document.getElementById('sync-close').addEventListener('click', closeSyncModal);

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        elements.installBtn.classList.remove('hidden');
    });
}

/**
 * Handle search input
 */
function handleSearch(e) {
    const query = e.target.value.trim();
    FilterManager.set('search', query);

    elements.clearSearch.classList.toggle('hidden', !query);

    currentPage = 1;
    renderMembers();
    updateStats();
}

/**
 * Clear search input
 */
function clearSearch() {
    elements.searchInput.value = '';
    FilterManager.set('search', '');
    elements.clearSearch.classList.add('hidden');
    currentPage = 1;
    renderMembers();
    updateStats();
}

/**
 * Handle filter change
 */
function handleFilterChange(e) {
    const filterName = e.target.id.replace('-filter', '');
    FilterManager.set(filterName, e.target.value);
    currentPage = 1;
    renderMembers();
    updateStats();
}

/**
 * Reset all filters
 */
function handleResetFilters() {
    FilterManager.reset();
    elements.searchInput.value = '';
    elements.prefixFilter.value = '';
    elements.yearFilter.value = '';
    elements.monthFilter.value = '';
    elements.statusFilter.value = '';
    elements.clearSearch.classList.add('hidden');
    currentPage = 1;
    renderMembers();
    updateStats();
    showToastNotification('Filters reset', 'info');
}

/**
 * Populate year filter dropdown
 */
function populateYearFilter() {
    const years = FilterManager.getYears(DataManager.getAll());
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        elements.yearFilter.appendChild(option);
    });
}

/**
 * Render members grid
 */
function renderMembers(append = false) {
    const allMembers = DataManager.getAll();
    const filteredMembers = FilterManager.filter(allMembers);
    const sortedMembers = FilterManager.sort(filteredMembers, 'callsign', true);

    displayedMembers = sortedMembers;

    const start = 0;
    const end = currentPage * ITEMS_PER_PAGE;
    const membersToShow = sortedMembers.slice(start, end);

    if (!append) {
        elements.membersGrid.innerHTML = '';
    }

    if (membersToShow.length === 0 && !append) {
        elements.emptyState.classList.remove('hidden');
        elements.loadMoreContainer.classList.add('hidden');
        return;
    }

    elements.emptyState.classList.add('hidden');

    const startIndex = append ? (currentPage - 1) * ITEMS_PER_PAGE : 0;
    const membersSubset = append ? sortedMembers.slice(startIndex, end) : membersToShow;

    membersSubset.forEach(member => {
        const card = createMemberCard(member);
        elements.membersGrid.appendChild(card);
    });

    // Show/hide load more button
    if (end < sortedMembers.length) {
        elements.loadMoreContainer.classList.remove('hidden');
        elements.loadMoreBtn.textContent = `Load More (${end} of ${sortedMembers.length})`;
    } else {
        elements.loadMoreContainer.classList.add('hidden');
    }
}

/**
 * Create a member card element
 */
function createMemberCard(member) {
    const status = DataManager.getStatus(member.expiry);
    const isLocal = member.is_local || member.isLocal;

    const card = document.createElement('div');
    card.className = 'member-card';
    card.dataset.id = member.id;

    card.innerHTML = `
        ${isLocal ? '<span class="local-badge">Local</span>' : ''}
        <div class="card-header">
            <span class="callsign">${escapeHtml(member.callsign)}</span>
            <span class="status-badge status-${status}">${status}</span>
        </div>
        <div class="member-name">${escapeHtml(member.name)}</div>
        <div class="member-details">
            <span class="detail-item">
                <span>🪪</span> ${escapeHtml(member.member_id || member.memberId || '-')}
            </span>
            <span class="detail-item">
                <span>📅</span> ${escapeHtml(member.expiry || '-')}
            </span>
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary btn-edit" data-id="${member.id}">
                ✏️ Edit
            </button>
            <button class="btn btn-danger btn-delete" data-id="${member.id}">
                🗑️ Delete
            </button>
        </div>
    `;

    // Bind card action events
    card.querySelector('.btn-edit').addEventListener('click', () => openMemberModal(member));
    card.querySelector('.btn-delete').addEventListener('click', () => openDeleteModal(member));

    return card;
}

/**
 * Load more members
 */
function loadMore() {
    currentPage++;
    renderMembers(true);
}

/**
 * Update statistics display
 */
function updateStats() {
    const allMembers = DataManager.getAll();
    const filteredMembers = FilterManager.filter(allMembers);
    const stats = FilterManager.getStats(allMembers);

    elements.totalCount.textContent = stats.total.toLocaleString();
    elements.activeCount.textContent = stats.active.toLocaleString();
    elements.expiredCount.textContent = stats.expired.toLocaleString();
    elements.filteredCount.textContent = filteredMembers.length.toLocaleString();
}

/**
 * Update last sync time display
 */
function updateLastSync() {
    const lastSync = DataManager.getLastSync();
    if (lastSync) {
        const date = new Date(lastSync);
        elements.lastSync.textContent = `Last sync: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } else {
        elements.lastSync.textContent = 'Last sync: Never';
    }
}

/**
 * Open member modal for add/edit
 */
function openMemberModal(member = null) {
    const isEdit = !!member;
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Member' : 'Add New Member';
    document.getElementById('modal-submit').textContent = isEdit ? 'Update Member' : 'Save Member';

    if (isEdit) {
        document.getElementById('member-callsign').value = member.callsign || '';
        document.getElementById('member-name').value = member.name || '';
        document.getElementById('member-member-id').value = member.member_id || member.memberId || '';
        document.getElementById('member-expiry').value = member.expiry || '';
        document.getElementById('member-edit-id').value = member.id;
    } else {
        document.getElementById('member-form').reset();
        document.getElementById('member-edit-id').value = '';
    }

    elements.memberModal.classList.remove('hidden');
    document.getElementById('member-callsign').focus();
}

/**
 * Close member modal
 */
function closeMemberModal() {
    elements.memberModal.classList.add('hidden');
    document.getElementById('member-form').reset();
}

/**
 * Handle member form submit
 */
async function handleMemberSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('member-edit-id').value;
    const memberData = {
        callsign: document.getElementById('member-callsign').value,
        name: document.getElementById('member-name').value,
        memberId: document.getElementById('member-member-id').value,
        expiry: document.getElementById('member-expiry').value
    };

    try {
        if (id) {
            await DataManager.update(id, memberData);
        } else {
            await DataManager.add(memberData);
        }

        closeMemberModal();
        renderMembers();
        updateStats();
        populateYearFilter();
    } catch (error) {
        console.error('Error saving member:', error);
    }
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(member) {
    document.getElementById('delete-callsign').textContent = member.callsign;
    document.getElementById('delete-member-id').value = member.id;
    elements.deleteModal.classList.remove('hidden');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    elements.deleteModal.classList.add('hidden');
}

/**
 * Handle delete confirmation
 */
async function handleDeleteConfirm() {
    const id = document.getElementById('delete-member-id').value;

    try {
        await DataManager.delete(id);
        closeDeleteModal();
        renderMembers();
        updateStats();
    } catch (error) {
        console.error('Error deleting member:', error);
    }
}

/**
 * Handle sync from MARTS website
 */
async function handleSync() {
    elements.syncModal.classList.remove('hidden');
    document.getElementById('sync-progress').classList.remove('hidden');
    document.getElementById('sync-complete').classList.add('hidden');
    document.getElementById('sync-error').classList.add('hidden');

    try {
        const members = await scrapeMartsData((progress, total, current) => {
            const percent = Math.round((progress / total) * 100);
            document.getElementById('sync-progress-bar').style.width = `${percent}%`;
            document.getElementById('sync-status').textContent = `Fetching data...`;
            document.getElementById('sync-details').textContent = `Page ${current} of ${total} (${progress} members)`;
        });

        await DataManager.bulkInsert(members);
        DataManager.setLastSync();

        document.getElementById('sync-progress').classList.add('hidden');
        document.getElementById('sync-complete').classList.remove('hidden');
        document.getElementById('sync-result').textContent = `Loaded ${members.length} members from MARTS`;

        renderMembers();
        updateStats();
        updateLastSync();
        populateYearFilter();

    } catch (error) {
        console.error('Sync error:', error);
        document.getElementById('sync-progress').classList.add('hidden');
        document.getElementById('sync-error').classList.remove('hidden');
        document.getElementById('sync-error-msg').textContent = error.message || 'Unable to connect to MARTS server';
    }
}

/**
 * Scrape data from MARTS website
 */
async function scrapeMartsData(progressCallback) {
    const totalPages = 73;
    const allData = [];

    for (let page = 1; page <= totalPages; page++) {
        try {
            const response = await fetch('https://ahli.marts.org.my/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `search=&ms=${page}`
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const rows = Array.from(doc.querySelectorAll('tr'));

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length === 5) {
                    const callsign = cells[1]?.textContent?.trim() || '';
                    const name = cells[2]?.textContent?.trim() || '';
                    const memberId = cells[3]?.textContent?.trim() || '';
                    const expiry = cells[4]?.textContent?.trim() || '';

                    if (callsign && name && memberId && callsign !== 'CALLSIGN') {
                        allData.push({
                            id: 'M' + String(allData.length + 1).padStart(5, '0'),
                            callsign,
                            name,
                            member_id: memberId,
                            expiry,
                            is_local: false
                        });
                    }
                }
            });

            if (progressCallback) {
                progressCallback(allData.length, totalPages, page);
            }

        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            // Continue with next page
        }
    }

    return allData;
}

/**
 * Close sync modal
 */
function closeSyncModal() {
    elements.syncModal.classList.add('hidden');
}

/**
 * Close all modals
 */
function closeAllModals() {
    closeMemberModal();
    closeDeleteModal();
    closeSyncModal();
}

/**
 * Initialize theme
 */
function initTheme() {
    const savedTheme = localStorage.getItem('marts_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * Toggle theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('marts_theme', newTheme);
}

/**
 * Install PWA
 */
async function installPWA() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        showToastNotification('App installed successfully!', 'success');
    }

    deferredPrompt = null;
    elements.installBtn.classList.add('hidden');
}

/**
 * Register service worker
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('📝 Service Worker registered:', registration.scope);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
    }, 500);
}

/**
 * Show toast notification
 */
function showToastNotification(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make showToastNotification globally available
window.showToastNotification = showToastNotification;

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
