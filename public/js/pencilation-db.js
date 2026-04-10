/**
 * Pencilation — Supabase data layer (vanilla JS, no npm).
 * Mirrors the former PHP /api contract so UI scripts stay unchanged.
 */
(function () {
    function waitForSupabase(maxMs) {
        const cap = maxMs ?? 15000;
        return new Promise(function (resolve, reject) {
            const t0 = Date.now();
            function tick() {
                if (window.supabaseClient) return resolve();
                if (Date.now() - t0 > cap) {
                    return reject(new Error('Supabase client not initialized — check meta tags and js/supabase.js'));
                }
                setTimeout(tick, 25);
            }
            tick();
        });
    }

    function sb() {
        if (!window.supabaseClient) throw new Error('Supabase not configured');
        return window.supabaseClient;
    }

    function mapBooking(row) {
        if (!row) return row;
        return {
            ...row,
            client_name: row.client_name || row.name,
            client_email: row.client_email,
            client_phone: row.client_phone,
            client_social: row.client_social,
            medium: row.medium,
            size: row.size,
            address: row.address,
            deadline: row.deadline,
            payment_method: row.payment_method,
            reference_url: row.reference_url,
            receipt_url: row.receipt_url,
            status: row.status,
            created_at: row.created_at,
        };
    }

    window.PencilationDB = {
        waitForSupabase: waitForSupabase,

        async listBookings() {
            await waitForSupabase();
            const { data, error } = await sb()
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(mapBooking);
        },

        async insertBooking(payload) {
            await waitForSupabase();
            const deadline = payload.deadline || null;
            const name = (payload.client_name || '').trim();
            const service = [payload.medium, payload.size].filter(Boolean).join(' · ') || payload.medium || '';
            const dateStr = deadline ? String(deadline).slice(0, 10) : new Date().toISOString().slice(0, 10);

            const row = {
                name,
                service,
                date: dateStr,
                client_name: name,
                client_email: (payload.client_email || '').trim(),
                client_phone: payload.client_phone || '',
                client_social: payload.client_social || '',
                medium: payload.medium || '',
                size: payload.size || '',
                address: payload.address || '',
                deadline: deadline,
                payment_method: payload.payment_method || '',
                reference_url: payload.reference_url || null,
                receipt_url: payload.receipt_url || null,
                status: 'pending',
            };

            const { data, error } = await sb().from('bookings').insert(row).select('id');
            if (error) throw error;
            const id = Array.isArray(data) && data[0] ? data[0].id : data?.id;
            return { id, status: 'pending' };
        },

        async getBookingStatusByEmail(email) {
            await waitForSupabase();
            const em = (email || '').trim();
            if (!em) return { status: 'none' };
            const { data, error } = await sb()
                .from('bookings')
                .select('*')
                .eq('client_email', em)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            if (!data) return { status: 'none' };
            return mapBooking(data);
        },

        async updateBookingStatus(id, status) {
            await waitForSupabase();
            const { error } = await sb().from('bookings').update({ status }).eq('id', id);
            if (error) throw error;
        },

        async deleteBooking(id) {
            await waitForSupabase();
            const { error } = await sb().from('bookings').delete().eq('id', id);
            if (error) throw error;
        },

        async clearBookingArchive() {
            await waitForSupabase();
            const { error } = await sb().from('bookings').delete().in('status', ['completed', 'rejected']);
            if (error) throw error;
        },

        async listArtworks() {
            await waitForSupabase();
            const { data, error } = await sb()
                .from('artworks')
                .select('id, title, category, size, image_url, is_featured, created_at')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },

        async createArtwork(body) {
            await waitForSupabase();
            const { data, error } = await sb()
                .from('artworks')
                .insert({
                    title: body.title,
                    category: body.category || '',
                    size: body.size || '',
                    image_url: body.image_url || '',
                    is_featured: !!body.is_featured,
                })
                .select('id');
            if (error) throw error;
            const row = Array.isArray(data) ? data[0] : data;
            return { id: row?.id };
        },

        async updateArtwork(id, body) {
            await waitForSupabase();
            const patch = {};
            if (body.title !== undefined) patch.title = body.title;
            if (body.category !== undefined) patch.category = body.category;
            if (body.size !== undefined) patch.size = body.size;
            if (body.image_url !== undefined && body.image_url !== '') patch.image_url = body.image_url;
            const { error } = await sb().from('artworks').update(patch).eq('id', id);
            if (error) throw error;
        },

        async deleteArtwork(id) {
            await waitForSupabase();
            const { error } = await sb().from('artworks').delete().eq('id', id);
            if (error) throw error;
        },

        async listServices() {
            await waitForSupabase();
            const { data, error } = await sb().from('services').select('*').order('order_index', { ascending: true });
            if (error) throw error;
            return data || [];
        },

        async updateService(id, body) {
            await waitForSupabase();
            const { error } = await sb()
                .from('services')
                .update({
                    title: body.title,
                    description: body.description || '',
                    image_url: body.image_url || '',
                })
                .eq('id', id);
            if (error) throw error;
        },

        async listRates() {
            await waitForSupabase();
            const { data, error } = await sb().from('rates').select('*').order('order_index', { ascending: true });
            if (error) throw error;
            return (data || []).map(function (r) {
                return { ...r, price: r.price != null ? String(r.price) : '' };
            });
        },

        async updateRate(id, body) {
            await waitForSupabase();
            const { error } = await sb()
                .from('rates')
                .update({
                    size: body.size,
                    label: body.label || '',
                    price: String(body.price ?? ''),
                })
                .eq('id', id);
            if (error) throw error;
        },

        adminEmailFromUsername(username) {
            const u = (username || '').trim().toLowerCase();
            const domain =
                (typeof CONFIG !== 'undefined' && CONFIG.LOGIN_EMAIL_DOMAIN) || 'pencilation.admin';
            return u + '@' + domain;
        },

        async login(username, password) {
            await waitForSupabase();
            const uname = (username || '').trim().toLowerCase();
            const pass = String(password ?? '').trim();

            if (!uname || !pass) throw new Error('Username and password are required.');

            // Query the admin_users table directly — credentials are NOT in Supabase Auth.
            const { data, error } = await sb()
                .from('admin_users')
                .select('id, username, password_hash')
                .eq('username', uname)
                .maybeSingle();

            if (error) throw new Error('Login error: ' + (error.message || 'Database error.'));
            if (!data) throw new Error('Invalid username or password.');

            // Simple plain-text comparison (password_hash stores the raw password).
            if (data.password_hash !== pass) {
                throw new Error('Invalid username or password.');
            }

            // Persist a lightweight session in localStorage.
            localStorage.setItem('admin_session', JSON.stringify({
                id: data.id,
                username: data.username,
                role: 'admin',
                at: Date.now(),
            }));

            return {
                username: data.username,
                role: 'admin',
                session: null,
                mode: 'table',
            };
        },

        async signOut() {
            // Table-based auth — just clear the localStorage session.
            localStorage.removeItem('admin_session');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_role');
        },

        async updateAdminPassword(currentPassword, newPassword) {
            await waitForSupabase();

            // Verify against the admin_users table.
            const raw = localStorage.getItem('admin_session');
            if (!raw) throw new Error('Not signed in.');
            const sess = JSON.parse(raw);

            const { data, error } = await sb()
                .from('admin_users')
                .select('id, password_hash')
                .eq('username', sess.username)
                .maybeSingle();
            if (error || !data) throw new Error('Session error.');
            if (data.password_hash !== String(currentPassword)) throw new Error('Incorrect current passkey.');

            // Update password in the table.
            const { error: e2 } = await sb()
                .from('admin_users')
                .update({ password_hash: String(newPassword) })
                .eq('id', data.id);
            if (e2) throw e2;
        },

        async requireAdminSession() {
            // Table-based auth — check localStorage session.
            const raw = localStorage.getItem('admin_session');
            if (!raw) {
                window.location.href = 'login.html';
                return false;
            }
            try {
                const sess = JSON.parse(raw);
                if (!sess || !sess.username || sess.role !== 'admin') {
                    localStorage.removeItem('admin_session');
                    window.location.href = 'login.html';
                    return false;
                }
                // Optionally verify the username still exists in DB.
                await waitForSupabase();
                const { data } = await sb()
                    .from('admin_users')
                    .select('id')
                    .eq('username', sess.username)
                    .maybeSingle();
                if (!data) {
                    localStorage.removeItem('admin_session');
                    window.location.href = 'login.html';
                    return false;
                }
                return true;
            } catch {
                localStorage.removeItem('admin_session');
                window.location.href = 'login.html';
                return false;
            }
        },

        subscribeBookings(onChange) {
            if (!window.supabaseClient) return null;
            return sb()
                .channel('pencilation-bookings')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'bookings' },
                    function () {
                        if (typeof onChange === 'function') onChange();
                    }
                )
                .subscribe();
        },

        subscribeArtworks(onChange) {
            if (!window.supabaseClient) return null;
            return sb()
                .channel('pencilation-artworks')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'artworks' },
                    function () {
                        if (typeof onChange === 'function') onChange();
                    }
                )
                .subscribe();
        },
    };

    window.PencilationAuth = {
        requireSession: function () {
            return window.PencilationDB.requireAdminSession();
        },
        signOut: function () {
            return window.PencilationDB.signOut();
        },
    };
})();
