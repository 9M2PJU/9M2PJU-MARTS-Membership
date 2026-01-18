/**
 * MARTS Membership - Data Layer with Supabase Integration
 * Handles all CRUD operations with Supabase backend
 */

// Supabase Configuration
const SUPABASE_URL = 'https://arxffqjvlsdfsswayecb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeGZmcWp2bHNkZnNzd2F5ZWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTI5MzYsImV4cCI6MjA4NDI2ODkzNn0.U7V_fuBvk0cVxlH2hnqkhzEl-coJCiV0smw_6oQax-g';

// Initialize Supabase client
let supabaseClient = null;

// Data state
let membersData = [];
let isSupabaseConnected = false;

/**
 * Initialize Supabase client
 */
function initSupabase() {
    if (typeof window.supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isSupabaseConnected = true;
        console.log('✅ Supabase connected');
        return true;
    }
    console.log('⚠️ Supabase not configured, using local storage fallback');
    return false;
}

/**
 * Load members from Supabase or localStorage
 */
async function loadMembers() {
    try {
        if (isSupabaseConnected && supabaseClient) {
            try {
                // Fetch all records using pagination (Supabase default limit is 1000)
                let allData = [];
                let from = 0;
                const batchSize = 1000;
                let hasMore = true;

                while (hasMore) {
                    const { data, error } = await supabaseClient
                        .from('members')
                        .select('*')
                        .order('callsign', { ascending: true })
                        .range(from, from + batchSize - 1);

                    if (error) throw error;

                    if (data && data.length > 0) {
                        allData = allData.concat(data);
                        from += batchSize;
                        hasMore = data.length === batchSize;
                    } else {
                        hasMore = false;
                    }
                }

                if (allData.length > 0) {
                    membersData = allData;
                    console.log(`📡 Loaded ${membersData.length} members from Supabase`);
                    return membersData;
                } else {
                    console.warn('⚠️ Supabase returned no data, falling back to local...');
                }
            } catch (err) {
                console.error('❌ Supabase load failed:', err);
                console.log('⚠️ Falling back to local storage/file...');
            }
        }

        // Fallback flow (runs if Supabase disabled, failed, or empty)
        // 1. Try localStorage
        const localData = localStorage.getItem('marts_members');
        if (localData) {
            membersData = JSON.parse(localData);
            console.log(`💾 Loaded ${membersData.length} members from localStorage`);
        } else {
            // Load from static JSON file
            try {
                const response = await fetch('data/members.json');
                if (response.ok) {
                    membersData = await response.json();
                    console.log(`📄 Loaded ${membersData.length} members from static file`);
                    // Save to localStorage for future use
                    saveToLocalStorage();
                }
            } catch (e) {
                console.log('📭 No static data file found, starting empty');
                membersData = [];
            }
        }

        return membersData;
    } catch (error) {
        console.error('Error loading members:', error);
        showToast('Error loading members', 'error');
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

        if (isSupabaseConnected && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('members')
                .insert([newMember])
                .select()
                .single();

            if (error) throw error;
            membersData.push(data);
            console.log('✅ Member added to Supabase:', data.callsign);
        } else {
            membersData.push(newMember);
            saveToLocalStorage();
            console.log('💾 Member added to localStorage:', newMember.callsign);
        }

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

        if (isSupabaseConnected && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('members')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const index = membersData.findIndex(m => m.id === id);
            if (index !== -1) {
                membersData[index] = data;
            }
            console.log('✅ Member updated in Supabase:', data.callsign);
        } else {
            const index = membersData.findIndex(m => m.id === id);
            if (index !== -1) {
                membersData[index] = { ...membersData[index], ...updateData };
                saveToLocalStorage();
                console.log('💾 Member updated in localStorage:', membersData[index].callsign);
            }
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

        if (isSupabaseConnected && supabaseClient) {
            const { error } = await supabaseClient
                .from('members')
                .delete()
                .eq('id', id);

            if (error) throw error;
            console.log('✅ Member deleted from Supabase');
        }

        membersData = membersData.filter(m => m.id !== id);

        if (!isSupabaseConnected) {
            saveToLocalStorage();
            console.log('💾 Member deleted from localStorage');
        }

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
 */
async function bulkInsertMembers(members) {
    try {
        if (isSupabaseConnected && supabaseClient) {
            // Clear existing data first
            await supabaseClient.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // Insert in batches of 500
            const batchSize = 500;
            for (let i = 0; i < members.length; i += batchSize) {
                const batch = members.slice(i, i + batchSize).map(m => ({
                    id: m.id || generateId(),
                    callsign: m.callsign?.toUpperCase().trim() || '',
                    name: m.name?.toUpperCase().trim() || '',
                    member_id: m.memberId || m.member_id || '',
                    expiry: m.expiry?.trim() || '',
                    is_local: false,
                    created_at: new Date().toISOString()
                }));

                const { error } = await supabaseClient.from('members').insert(batch);
                if (error) throw error;

                console.log(`📦 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(members.length / batchSize)}`);
            }

            membersData = members;
            console.log(`✅ Bulk inserted ${members.length} members to Supabase`);
        } else {
            membersData = members;
            saveToLocalStorage();
            console.log(`💾 Bulk saved ${members.length} members to localStorage`);
        }

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
 * Save to localStorage (fallback)
 */
function saveToLocalStorage() {
    localStorage.setItem('marts_members', JSON.stringify(membersData));
    localStorage.setItem('marts_last_sync', new Date().toISOString());
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
 * Show toast notification (will be implemented in app.js)
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

/**
 * Check if Supabase is configured
 */
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

// Export functions for use in other modules
window.DataManager = {
    init: initSupabase,
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
    isConnected: () => isSupabaseConnected,
    isConfigured: isSupabaseConfigured
};
