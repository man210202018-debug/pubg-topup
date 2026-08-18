const SUPABASE_URL = 'https://lwmfcyoyudkmoizvxshh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_I1memX_5vqkzg1fMnqxcmw_10Lg5Q-0';

const db = {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },

    async insert(table, data) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    async select(table, query = '') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
            headers: this.headers
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    async update(table, data, filter) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        return await res.json();
    },

    async remove(table, filter) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
            method: 'DELETE',
            headers: this.headers
        });
        if (!res.ok) throw await res.json();
        return true;
    }
};
