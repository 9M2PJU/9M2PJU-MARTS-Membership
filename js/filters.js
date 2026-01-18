/**
 * MARTS Membership - Filter System
 * Handles all filtering and search logic
 */

// Filter state
let currentFilters = {
    search: '',
    prefix: '',
    year: '',
    month: '',
    status: ''
};

// Malaysian callsign prefixes
const MALAYSIAN_PREFIXES = ['9M2', '9M4', '9M6', '9M8', '9M0', '9W2', '9W4', '9W6', '9W8', '9W3'];

/**
 * Apply all filters to members data
 */
function filterMembers(members) {
    return members.filter(member => {
        // Search filter
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            const callsignMatch = member.callsign?.toLowerCase().includes(searchLower);
            const nameMatch = member.name?.toLowerCase().includes(searchLower);
            const memberIdMatch = (member.member_id || member.memberId || '')
                .toString().toLowerCase().includes(searchLower);

            if (!callsignMatch && !nameMatch && !memberIdMatch) {
                return false;
            }
        }

        // Prefix filter
        if (currentFilters.prefix) {
            const callsign = member.callsign?.toUpperCase() || '';

            if (currentFilters.prefix === 'FOREIGN') {
                // Foreign callsigns don't start with 9M or 9W
                const isForeign = !MALAYSIAN_PREFIXES.some(p => callsign.startsWith(p)) &&
                    !callsign.startsWith('SWL');
                if (!isForeign) return false;
            } else if (currentFilters.prefix === 'SWL') {
                if (!callsign.startsWith('SWL')) return false;
            } else {
                if (!callsign.startsWith(currentFilters.prefix)) return false;
            }
        }

        // Year filter
        if (currentFilters.year) {
            const expiry = member.expiry || '';
            const year = expiry.split('/')[0];
            if (year !== currentFilters.year) return false;
        }

        // Month filter
        if (currentFilters.month) {
            const expiry = member.expiry || '';
            const parts = expiry.split('/');
            if (parts.length < 2 || parts[1] !== currentFilters.month) return false;
        }

        // Status filter
        if (currentFilters.status) {
            const status = DataManager.getStatus(member.expiry);
            if (currentFilters.status !== status) return false;
        }

        return true;
    });
}

/**
 * Set a filter value
 */
function setFilter(filterName, value) {
    if (currentFilters.hasOwnProperty(filterName)) {
        currentFilters[filterName] = value;
    }
}

/**
 * Get current filter values
 */
function getFilters() {
    return { ...currentFilters };
}

/**
 * Reset all filters
 */
function resetFilters() {
    currentFilters = {
        search: '',
        prefix: '',
        year: '',
        month: '',
        status: ''
    };
}

/**
 * Get available years from data
 */
function getAvailableYears(members) {
    const years = new Set();

    members.forEach(member => {
        if (member.expiry) {
            const year = member.expiry.split('/')[0];
            if (year && !isNaN(parseInt(year))) {
                years.add(year);
            }
        }
    });

    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
}

/**
 * Get statistics from members data
 */
function getStatistics(members) {
    const stats = {
        total: members.length,
        active: 0,
        expired: 0,
        expiring: 0,
        byPrefix: {}
    };

    members.forEach(member => {
        const status = DataManager.getStatus(member.expiry);
        if (status === 'active') stats.active++;
        else if (status === 'expired') stats.expired++;
        else if (status === 'expiring') stats.expiring++;

        // Count by prefix
        const callsign = member.callsign?.toUpperCase() || '';
        let prefix = 'OTHER';

        for (const p of MALAYSIAN_PREFIXES) {
            if (callsign.startsWith(p)) {
                prefix = p;
                break;
            }
        }

        if (callsign.startsWith('SWL')) {
            prefix = 'SWL';
        } else if (!MALAYSIAN_PREFIXES.some(p => callsign.startsWith(p)) && prefix === 'OTHER') {
            prefix = 'FOREIGN';
        }

        stats.byPrefix[prefix] = (stats.byPrefix[prefix] || 0) + 1;
    });

    return stats;
}

/**
 * Sort members by different criteria
 */
function sortMembers(members, sortBy = 'callsign', ascending = true) {
    return [...members].sort((a, b) => {
        let valueA, valueB;

        switch (sortBy) {
            case 'callsign':
                valueA = a.callsign || '';
                valueB = b.callsign || '';
                break;
            case 'name':
                valueA = a.name || '';
                valueB = b.name || '';
                break;
            case 'expiry':
                valueA = DataManager.parseExpiry(a.expiry) || new Date(0);
                valueB = DataManager.parseExpiry(b.expiry) || new Date(0);
                break;
            case 'memberId':
                valueA = parseInt(a.member_id || a.memberId || 0);
                valueB = parseInt(b.member_id || b.memberId || 0);
                break;
            default:
                return 0;
        }

        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
    });
}

/**
 * Debounce function for search input
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions
window.FilterManager = {
    filter: filterMembers,
    set: setFilter,
    get: getFilters,
    reset: resetFilters,
    getYears: getAvailableYears,
    getStats: getStatistics,
    sort: sortMembers,
    debounce: debounce,
    MALAYSIAN_PREFIXES: MALAYSIAN_PREFIXES
};
