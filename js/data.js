/**
 * MARTS Membership - Data Layer (Local JSON + LocalStorage)
 * Handles all data operations using static JSON and browser storage
 */

// Data state
let membersData = [];

/**
 * Initialize Data Layer (Simplified)
 */
function init() {
    console.log('✅ Data Manager initialized (Local Mode)');
    return true;
}

/**
 * Load members from LocalStorage or static JSON
 */
async function loadMembers() {
    try {
        // 1. Try to load from LocalStorage first (contains user edits)
        const localData = localStorage.getItem('marts_members');

        if (localData) {
            try {
                membersData = JSON.parse(localData);
                console.log(`💾 Loaded ${membersData.length} members from localStorage`);

                // If we have data, we're good. But we might want to check if it's stale compared to JSON?
                // For now, local edits take precedence.
                return membersData;
            } catch (e) {
                console.error('Error parsing localStorage:', e);
                // Fall through to load from file
            }
        }

        // 2. Load from static JSON file
        try {
            console.log('📄 Fetching data/members.json...');
            const response = await fetch('data/members.json');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            membersData = await response.json();
            console.log(`📄 Loaded ${membersData.length} members from static file`);

            // Save to localStorage for future access/edits
            saveToLocalStorage();
            return membersData;
        } catch (e) {
            console.error('❌ Error loading members.json:', e);
            // If both fail, we start empty
            if (membersData.length === 0) {
                console.warn('⚠️ Starting with empty member list');
                membersData = [];
            }
            return membersData;
        }
    } catch (error) {
        console.error('CRITICAL: Error in loadMembers:', error);
        return [];
    }
}

/**
 * Add a new member
 */
async function addMember(member) {
    try {
        const newMember = {
            id: member.id || generateId(),
            callsign: member.callsign.toUpperCase().trim(),
            name: member.name.toUpperCase().trim(),
            member_id: member.memberId || member.member_id,
            expiry: member.expiry.trim(),
            is_local: true,
            created_at: new Date().toISOString()
        };

        membersData.push(newMember);
        saveToLocalStorage();
        console.log('💾 Member added to localStorage:', newMember.callsign);

        showToast(`Member ${newMember.callsign} added successfully`, 'success');
        return newMember;
    } catch (error) {
        console.error('Error adding member:', error);
        showToast('Error adding member: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Update an existing member
 */
async function updateMember(id, updates) {
    try {
        const updateData = {
            callsign: updates.callsign?.toUpperCase().trim(),
            name: updates.name?.toUpperCase().trim(),
            member_id: updates.memberId || updates.member_id,
            expiry: updates.expiry?.trim(),
            updated_at: new Date().toISOString()
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        const index = membersData.findIndex(m => m.id === id);
        if (index !== -1) {
            membersData[index] = { ...membersData[index], ...updateData };
            saveToLocalStorage();
            console.log('💾 Member updated in localStorage:', membersData[index].callsign);
        } else {
            throw new Error('Member not found');
        }

        showToast('Member updated successfully', 'success');
        return updateData;
    } catch (error) {
        console.error('Error updating member:', error);
        showToast('Error updating member: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Delete a member
 */
async function deleteMember(id) {
    try {
        const member = membersData.find(m => m.id === id);
        membersData = membersData.filter(m => m.id !== id);

        saveToLocalStorage();
        console.log('💾 Member deleted from localStorage');

        showToast(`Member ${member?.callsign || ''} deleted`, 'success');
        return true;
    } catch (error) {
        console.error('Error deleting member:', error);
        showToast('Error deleting member: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Bulk insert members (used for sync)
 * For local mode, this overwrites the current list with the synced list
 */
async function bulkInsertMembers(members) {
    try {
        // Prepare new data
        const newMembers = members.map(m => ({
            id: m.id || generateId(),
            callsign: m.callsign?.toUpperCase().trim() || '',
            name: m.name?.toUpperCase().trim() || '',
            member_id: m.memberId || m.member_id || '',
            expiry: m.expiry?.trim() || '',
            is_local: false,
            created_at: new Date().toISOString()
        }));

        membersData = newMembers;
        saveToLocalStorage();
        console.log(`💾 Bulk saved ${membersData.length} members to localStorage`);

        return true;
    } catch (error) {
        console.error('Error bulk inserting members:', error);
        throw error;
    }
}

/**
 * Get all members
 */
function getAllMembers() {
    return membersData;
}

/**
 * Get a single member by ID
 */
function getMemberById(id) {
    return membersData.find(m => m.id === id);
}

/**
 * Export members as JSON
 */
function exportMembersJSON() {
    const dataStr = JSON.stringify(membersData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marts_members_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${membersData.length} members`, 'success');
}

/**
 * Save to localStorage
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem('marts_members', JSON.stringify(membersData));
        const now = new Date().toISOString();
        localStorage.setItem('marts_last_sync', now);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        showToast('Warning: Could not save to local storage (quota exceeded?)', 'warning');
    }
}

/**
 * Get last sync time
 */
function getLastSyncTime() {
    return localStorage.getItem('marts_last_sync') || null;
}

/**
 * Save last sync time
 */
function setLastSyncTime() {
    const now = new Date().toISOString();
    localStorage.setItem('marts_last_sync', now);
    return now;
}

/**
 * Generate unique ID
 */
function generateId() {
    return 'M' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    if (typeof window.showToastNotification === 'function') {
        window.showToastNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Parse expiry date to Date object
 */
function parseExpiryDate(expiry) {
    if (!expiry) return null;

    // Handle special cases
    if (expiry.toUpperCase() === 'SILENT KEY' || expiry.toUpperCase() === 'SK') {
        return null;
    }

    // Format: YYYY or YYYY/MM
    const parts = expiry.split('/');
    const year = parseInt(parts[0]);
    const month = parts[1] ? parseInt(parts[1]) - 1 : 11; // Default to December if no month

    if (isNaN(year)) return null;

    return new Date(year, month, 1);
}

/**
 * Get member status based on expiry
 */
function getMemberStatus(expiry) {
    const expiryDate = parseExpiryDate(expiry);
    if (!expiryDate) return 'unknown';

    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 90) return 'expiring';
    return 'active';
}

// Export functions for use in other modules
window.DataManager = {
    init: init,
    load: loadMembers,
    add: addMember,
    update: updateMember,
    delete: deleteMember,
    bulkInsert: bulkInsertMembers,
    getAll: getAllMembers,
    getById: getMemberById,
    export: exportMembersJSON,
    parseExpiry: parseExpiryDate,
    getStatus: getMemberStatus,
    getLastSync: getLastSyncTime,
    setLastSync: setLastSyncTime,
    isConnected: () => false, // Always false as we are local only
    isConfigured: () => true  // Always true as we don't need config
};
