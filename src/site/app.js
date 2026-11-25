// @ts-nocheck
import { createClient } from "@supabase/supabase-js";

export function startSite() {

    // 1. SUPABASE CONFIGURATION
    const SUPABASE_URL = "https://uthlbmwvwzssmgotycdf.supabase.co";
    const SUPABASE_KEY = "sb_publishable_k95hUAxrypzfqkOd2ttYcg_5iQImT2j";
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    const ROOM_CATALOG = [
      { id: "R101", name: "Maple Nest PG", kind: "PG", location: "Law Gate, near LPU", rent: 8000, details: "Furnished bed, study table, wardrobe, Wi-Fi and RO water." },
      { id: "R102", name: "Olive Courtyard Home", kind: "Home", location: "Chaheru, near LPU", rent: 9000, details: "Single room with attached washroom, wardrobe and balcony." },
      { id: "R103", name: "The Bluebell Residency", kind: "PG", location: "Hardaspur Road, near LPU", rent: 8500, details: "2 sharing room with desk, cupboard and common lounge." },
      { id: "R104", name: "Sunrise Haven", kind: "Home", location: "Green Valley, near LPU", rent: 10000, details: "Independent room with attached bathroom and kitchen access." },
      { id: "R105", name: "Cedar House PG", kind: "PG", location: "Law Gate Market, near LPU", rent: 9500, details: "Private furnished room with study corner and balcony." },
      { id: "R106", name: "Rosewood Corner", kind: "Home", location: "Near LPU Main Gate", rent: 10000, details: "Well-lit room in a family home with attached washroom." }
    ];

    let currentUser = null;
    let currentProfile = null;

    function toast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2800);
    }

    // AUTH SWITCH
    document.getElementById('to-signup').onclick = () => {
      document.getElementById('signin-panel').classList.add('hidden');
      document.getElementById('signup-panel').classList.remove('hidden');
    };
    document.getElementById('to-signin').onclick = () => {
      document.getElementById('signup-panel').classList.add('hidden');
      document.getElementById('signin-panel').classList.remove('hidden');
    };

    // SIGN UP
    document.getElementById('signup-form').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const { data, error } = await sb.auth.signUp({
        email: f.email.value.trim(),
        password: f.password.value,
        options: { data: { full_name: f.name.value.trim() } }
      });
      if (error) return toast('Signup Error: ' + error.message);
      toast('Account created! Signing you in...');
      f.reset();
      if (data.session) initSession();
      else showVerify(data.user?.email || '');
    };

    // EMAIL CODE VERIFICATION
    let verifyEmail = '';
    let resendTimer = null;
    function startResendWait() {
      const btn = document.getElementById('resend-code');
      let left = 60;
      clearInterval(resendTimer);
      btn.disabled = true;
      btn.textContent = 'Resend code (' + left + 's)';
      resendTimer = setInterval(() => {
        left--;
        if (left <= 0) {
          clearInterval(resendTimer);
          btn.disabled = false;
          btn.textContent = 'Resend code';
        } else btn.textContent = 'Resend code (' + left + 's)';
      }, 1000);
    }
    function showVerify(email) {
      verifyEmail = email;
      document.getElementById('verify-email').textContent = email;
      document.getElementById('signup-panel').classList.add('hidden');
      document.getElementById('signin-panel').classList.add('hidden');
      document.getElementById('verify-panel').classList.remove('hidden');
      toast('We sent a 6-digit code to your email.');
      startResendWait();
    }
    document.getElementById('verify-form').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const { data, error } = await sb.auth.verifyOtp({
        email: verifyEmail,
        token: f.code.value.trim(),
        type: 'signup'
      });
      if (error) return toast('Verification Error: ' + error.message);
      f.reset();
      clearInterval(resendTimer);
      document.getElementById('verify-panel').classList.add('hidden');
      document.getElementById('signin-panel').classList.remove('hidden');
      toast('Email verified!');
      if (data.session) initSession();
    };
    document.getElementById('resend-code').onclick = async () => {
      const { error } = await sb.auth.resend({ type: 'signup', email: verifyEmail });
      if (error) return toast('Resend Error: ' + error.message);
      toast('A new code has been sent.');
      startResendWait();
    };

    // SIGN IN
    document.getElementById('login-form').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const { error } = await sb.auth.signInWithPassword({
        email: f.email.value.trim(),
        password: f.password.value
      });
      if (error) return toast('Login Error: ' + error.message);
      toast('Welcome back!');
      initSession();
    };

    // LOGOUT
    document.getElementById('logout-btn').onclick = async () => {
      await sb.auth.signOut();
      currentUser = null;
      currentProfile = null;
      document.getElementById('app-screen').classList.add('hidden');
      document.getElementById('login-screen').classList.remove('hidden');
      toast('Logged out');
    };

    // NAVIGATION
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(btn.dataset.view).classList.add('active');
      };
    });

    // INITIALIZE SESSION & LOAD DATA
    async function initSession() {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
        return;
      }

      currentUser = session.user;
      const { data: profile, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error || !profile) {
        toast('Profile loading issue. Refreshing...');
        return;
      }

      currentProfile = profile;
      const isAdmin = profile.role === 'admin';

      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app-screen').classList.remove('hidden');
      document.getElementById('role-badge').textContent = isAdmin ? 'ADMIN PANEL' : 'TENANT PORTAL';
      document.getElementById('user-display-name').textContent = profile.full_name || profile.email;
      document.getElementById('welcome-name').textContent = profile.full_name || 'User';
      document.getElementById('user-email-badge').textContent = '● ' + profile.email;

      document.querySelectorAll('[data-admin-only]').forEach(el => el.classList.toggle('hidden', !isAdmin));
      document.querySelectorAll('[data-tenant-only]').forEach(el => el.classList.toggle('hidden', isAdmin));

      await loadDashboardData(isAdmin);
    }

    async function loadDashboardData(isAdmin) {
      // 1. Load Properties
      const { data: props = [] } = await sb.from('properties').select('*').order('created_at', { ascending: false });
      document.getElementById('kpi-props').textContent = props.length;
      document.getElementById('properties-grid').innerHTML = props.map(p => `
        <article class="property-card">
          <div class="property-visual"><span>PROPERTY</span><b>${p.name.slice(0,2).toUpperCase()}</b></div>
          <div class="pc-body">
            <small>${p.address || 'No address'}</small>
            <h3>${p.name}</h3>
            <p style="color:var(--muted);font-size:12px">${p.description || ''}</p>
          </div>
        </article>
      `).join('') || '<p style="color:var(--muted)">No properties added yet.</p>';

      // 2. Load Room Bookings
      const { data: bookings = [] } = await sb.from('room_bookings').select('*').order('created_at', { ascending: false });
      document.getElementById('kpi-bookings').textContent = bookings.length;

      // 3. Load Maintenance Requests
      const { data: maints = [] } = await sb.from('maintenance_requests').select('*').order('created_at', { ascending: false });
      document.getElementById('kpi-maint').textContent = maints.length;

      if (isAdmin) {
        // Load All Profiles
        const { data: profiles = [] } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
        document.getElementById('kpi-users').textContent = profiles.length;

        document.getElementById('recent-users-list').innerHTML = profiles.slice(0, 5).map(u => `
          <div class="admin-item">
            <div><b>${u.full_name || 'Unnamed'}</b><small>${u.email}</small></div>
            <span class="pill">${u.role}</span>
          </div>
        `).join('');

        document.getElementById('profiles-tbody').innerHTML = profiles.map(u => `
          <tr>
            <td><b>${u.full_name || 'Unnamed'}</b></td>
            <td>${u.email}</td>
            <td><span class="pill">${u.role}</span></td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('');

        // Admin Bookings List
        document.getElementById('admin-bookings-list').innerHTML = bookings.map(b => `
          <div class="request">
            <div>
              <b>${b.room_name}</b>
              <small>Date: ${b.booking_date || 'N/A'} · ${b.details}</small>
            </div>
            <span class="pill ${b.status}">${b.status}</span>
            <div class="room-actions">
              <button class="approve" onclick="updateBooking('${b.id}','approved')">Approve</button>
              <button class="reject" onclick="updateBooking('${b.id}','rejected')">Reject</button>
            </div>
          </div>
        `).join('') || '<p style="color:var(--muted)">No room booking requests yet.</p>';

        // Admin Maintenance List
        document.getElementById('admin-maint-list').innerHTML = maints.map(m => `
          <div class="request">
            <div><b>${m.title}</b><small>${m.description}</small></div>
            <select onchange="updateMaint('${m.id}', this.value)">
              <option value="pending" ${m.status==='pending'?'selected':''}>Pending</option>
              <option value="in_progress" ${m.status==='in_progress'?'selected':''}>In Progress</option>
              <option value="completed" ${m.status==='completed'?'selected':''}>Completed</option>
              <option value="rejected" ${m.status==='rejected'?'selected':''}>Rejected</option>
            </select>
          </div>
        `).join('') || '<p style="color:var(--muted)">No maintenance requests yet.</p>';

      } else {
        // TENANT VIEW
        document.getElementById('kpi-users').textContent = '1';

        document.getElementById('my-bookings-list').innerHTML = bookings.map(b => `
          <div class="admin-item">
            <div><b>${b.room_name}</b><small>Move-in: ${b.booking_date || 'N/A'} · ${b.details}</small></div>
            <span class="pill ${b.status}">${b.status}</span>
          </div>
        `).join('') || '<p style="color:var(--muted)">You have not booked any room yet. Go to "Book a Room".</p>';

        document.getElementById('room-catalog').innerHTML = ROOM_CATALOG.map(r => `
          <div class="room-card">
            <div class="room-art"><b>${r.id}</b><span>${r.kind}</span></div>
            <div class="room-info">
              <small style="color:var(--muted)">${r.location}</small>
              <h3>${r.name}</h3>
              <p>${r.details}</p>
              <div class="room-price">₹${r.rent.toLocaleString('en-IN')} <small>/ month</small></div>
              <button class="action" onclick="openBookingModal('${r.name}', ${r.rent})">Request Booking</button>
            </div>
          </div>
        `).join('');

        document.getElementById('tenant-maint-list').innerHTML = maints.map(m => `
          <div class="request">
            <div><b>${m.title}</b><small>${m.description}</small></div>
            <span class="pill ${m.status}">${m.status}</span>
          </div>
        `).join('') || '<p style="color:var(--muted)">No maintenance tickets submitted.</p>';
      }
    }

    // ADMIN ACTIONS
    window.updateBooking = async (id, status) => {
      const { error } = await sb.from('room_bookings').update({ status }).eq('id', id);
      if (error) return toast('Error: ' + error.message);
      toast('Booking marked as ' + status);
      loadDashboardData(true);
    };

    window.updateMaint = async (id, status) => {
      const { error } = await sb.from('maintenance_requests').update({ status }).eq('id', id);
      if (error) return toast('Error: ' + error.message);
      toast('Status updated');
      loadDashboardData(true);
    };

    // MODALS (Add Property, Book Room, New Maintenance)
    const modal = document.getElementById('modal');
    document.getElementById('close-modal').onclick = () => modal.classList.remove('visible');

    function openPropModal() {
      document.getElementById('modal-title').textContent = 'Add New Property';
      document.getElementById('modal-body').innerHTML = `
        <form id="prop-form">
          <label>Property Name<input name="name" required placeholder="e.g. Skyline Residency"></label>
          <label>Address<input name="address" required placeholder="Phagwara, Punjab"></label>
          <label>Description<textarea name="description" rows="3" placeholder="Units, facilities..."></textarea></label>
          <button class="action" type="submit">Save Property</button>
        </form>
      `;
      modal.classList.add('visible');
      document.getElementById('prop-form').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const { error } = await sb.from('properties').insert({
          name: f.name.value,
          address: f.address.value,
          description: f.description.value,
          created_by: currentUser.id
        });
        if (error) return toast('Error: ' + error.message);
        modal.classList.remove('visible');
        toast('Property saved!');
        loadDashboardData(true);
      };
    }
    document.getElementById('open-prop-modal').onclick = openPropModal;
    document.getElementById('open-prop-modal-2').onclick = openPropModal;

    window.openBookingModal = (roomName, rent) => {
      document.getElementById('modal-title').textContent = 'Book ' + roomName;
      document.getElementById('modal-body').innerHTML = `
        <form id="book-form">
          <label>Preferred Move-in Date<input name="date" type="date" required></label>
          <label>Notes / Phone Number<input name="details" required placeholder="Your phone & any notes"></label>
          <button class="action" type="submit">Submit Booking Request (₹${rent}/mo)</button>
        </form>
      `;
      modal.classList.add('visible');
      document.getElementById('book-form').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const { error } = await sb.from('room_bookings').insert({
          user_id: currentUser.id,
          room_name: `${roomName} (₹${rent}/mo)`,
          booking_date: f.date.value,
          details: f.details.value
        });
        if (error) return toast('Error: ' + error.message);
        modal.classList.remove('visible');
        toast('Booking request sent to Admin!');
        loadDashboardData(false);
      };
    };

    function openMaintModal() {
      document.getElementById('modal-title').textContent = 'Submit Maintenance Request';
      document.getElementById('modal-body').innerHTML = `
        <form id="maint-form">
          <label>Issue Title<input name="title" required placeholder="e.g. Water leakage or Wi-Fi issue"></label>
          <label>Details & Room No.<textarea name="description" rows="3" required placeholder="Describe the problem..."></textarea></label>
          <button class="action" type="submit">Submit Request</button>
        </form>
      `;
      modal.classList.add('visible');
      document.getElementById('maint-form').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const { error } = await sb.from('maintenance_requests').insert({
          user_id: currentUser.id,
          title: f.title.value,
          description: f.description.value
        });
        if (error) return toast('Error: ' + error.message);
        modal.classList.remove('visible');
        toast('Maintenance ticket submitted!');
        loadDashboardData(false);
      };
    }
    document.getElementById('open-maint-modal').onclick = openMaintModal;
    document.getElementById('open-maint-modal-hero').onclick = openMaintModal;

    // Start app
    initSession();
  
}
