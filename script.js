// ============================================================
// DATABASE LAYER - localStorage
// ============================================================
const DB = {
    _prefix: 'journal_3d_',

    get(key) {
        try {
            const raw = localStorage.getItem(this._prefix + key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this._prefix + key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this._prefix + key);
            return true;
        } catch {
            return false;
        }
    }
};

// ============================================================
// APP STATE
// ============================================================
const MOODS = ['#8FAE93', '#C9B36B', '#A6453B', '#6C5B7B', '#5E82A8'];
const MOOD_LABELS = ['Tenang', 'Netral', 'Sedih', 'Melankolis', 'Bersemangat'];

let entries = [];
let activeId = null;
let saveTimer = null;
let toastTimer = null;

// ============================================================
// HELPERS
// ============================================================
function uid() {
    return 'e' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function todayStr() {
    return new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function sortedEntries() {
    return [...entries].sort((a, b) => b.createdAt - a.createdAt);
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    clearTimeout(toastTimer);
    void toast.offsetWidth;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================
function loadEntries() {
    const data = DB.get('entries');
    if (data && Array.isArray(data)) {
        entries = data;
    } else {
        entries = [];
        DB.set('entries', entries);
    }

    if (entries.length > 0) {
        activeId = sortedEntries()[0]?.id || null;
    }
    renderAll();
    updateStatsFooter();
}

function persistEntries() {
    DB.set('entries', entries);
    updateStatsFooter();
}

function scheduleSave() {
    const status = document.getElementById('saveStatus');
    if (status) {
        status.textContent = '⏳ Menyimpan…';
        status.className = 'save-status saving';
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        persistEntries();
        const status = document.getElementById('saveStatus');
        if (status) {
            status.textContent = '✓ Tersimpan';
            status.className = 'save-status saved';
        }
    }, 500);
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderAll() {
    renderToc();
    renderMoodStats();
    renderPageContent();
    updateNavButtons();
}

function renderToc() {
    const list = document.getElementById('tocList');
    const sorted = sortedEntries();
    const total = entries.length;

    document.getElementById('entryCountText').textContent = `${total} catatan`;

    if (sorted.length === 0) {
        list.innerHTML = `
                    <div class="empty-toc">
                        <span class="icon">📝</span>
                        Belum ada catatan.<br>Mulai tulis yang pertama!
                    </div>
                `;
        return;
    }

    list.innerHTML = sorted.map(e => `
                <div class="toc-item ${e.id === activeId ? 'active' : ''}" data-id="${e.id}">
                    <span class="toc-dot" style="background:${e.mood || MOODS[0]}"></span>
                    <div style="flex:1; min-width:0;">
                        <div class="toc-date">${e.date}</div>
                        <div class="toc-title">${e.title || 'Tanpa judul'}</div>
                        ${e.body ? `<div class="toc-preview">${e.body.substring(0, 40)}${e.body.length > 40 ? '…' : ''}</div>` : ''}
                    </div>
                </div>
            `).join('');

    list.querySelectorAll('.toc-item').forEach(item => {
        item.addEventListener('click', () => flipToEntry(item.dataset.id));
    });
}

function renderMoodStats() {
    const bar = document.getElementById('moodBar');
    const recent = sortedEntries().slice(0, 7).reverse();

    if (recent.length === 0) {
        bar.innerHTML = `<span style="background:var(--page-line);flex:1;height:10px;border-radius:3px;"></span>`;
        return;
    }

    // Count mood distribution for height variation
    const moodCount = {};
    recent.forEach(e => {
        const m = e.mood || MOODS[0];
        moodCount[m] = (moodCount[m] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(moodCount), 1);

    bar.innerHTML = recent.map(e => {
        const m = e.mood || MOODS[0];
        const count = moodCount[m] || 1;
        const height = 12 + (count / maxCount) * 28;
        return `<span style="background:${m};height:${height}px;" title="${MOOD_LABELS[MOODS.indexOf(m)] || ''}"></span>`;
    }).join('');
}

function renderPageContent() {
    const container = document.getElementById('pageContent');
    const entry = entries.find(e => e.id === activeId);

    if (!entry) {
        container.innerHTML = `
                    <div class="no-entry">
                        <div class="icon">📖</div>
                        <h2>Halaman kosong</h2>
                        <p>Pilih catatan dari daftar isi,<br>atau tulis yang baru.</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = `
                <div class="entry-toolbar">
                    <span class="entry-date">📅 ${entry.date}</span>
                    <div class="mood-picker" id="moodPicker">
                        ${MOODS.map((m, i) => `
                            <span 
                                class="dot ${entry.mood === m ? 'selected' : ''}" 
                                data-mood="${m}" 
                                style="background:${m}"
                                title="${MOOD_LABELS[i]}"
                            ></span>
                        `).join('')}
                    </div>
                </div>
                <input class="entry-title" id="titleInput" placeholder="📝 Judul catatan hari ini" value="${(entry.title || '').replace(/"/g, '&quot;')}" />
                <textarea class="entry-body" id="bodyInput" placeholder="Tulis apa saja yang ada di pikiran Anda…">${entry.body || ''}</textarea>
                <div class="entry-footer">
                    <div class="left-actions">
                        <button class="delete-btn" id="deleteBtn">🗑 Hapus</button>
                    </div>
                    <span class="save-status" id="saveStatus">✓ Tersimpan</span>
                </div>
            `;

    // Event listeners
    const titleInput = document.getElementById('titleInput');
    const bodyInput = document.getElementById('bodyInput');

    const updateEntry = (field, value) => {
        entry[field] = value;
        entry.updatedAt = Date.now();
        renderToc();
        scheduleSave();
    };

    titleInput.addEventListener('input', e => updateEntry('title', e.target.value));
    bodyInput.addEventListener('input', e => updateEntry('body', e.target.value));

    // Mood picker
    document.getElementById('moodPicker').querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            entry.mood = dot.dataset.mood;
            entry.updatedAt = Date.now();
            renderPageContent();
            renderToc();
            renderMoodStats();
            scheduleSave();
            const label = MOOD_LABELS[MOODS.indexOf(entry.mood)];
            showToast(`Suasana: ${label}`, 'success');
        });
    });

    // Delete
    document.getElementById('deleteBtn').addEventListener('click', () => {
        if (!confirm('Yakin ingin menghapus catatan ini? Tindakan ini tidak bisa dibatalkan.')) return;
        entries = entries.filter(e => e.id !== entry.id);
        const remaining = sortedEntries();
        activeId = remaining.length > 0 ? remaining[0].id : null;
        persistEntries();
        renderAll();
        showToast('Catatan dihapus', 'error');
    });
}

// ============================================================
// NAVIGATION
// ============================================================
function flipToEntry(id, animate = true) {
    if (id === activeId) return;

    const el = document.getElementById('pageContent');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!animate || prefersReduced) {
        activeId = id;
        renderToc();
        renderPageContent();
        updateNavButtons();
        return;
    }

    el.classList.add('flip-out');
    setTimeout(() => {
        activeId = id;
        renderToc();
        renderPageContent();
        updateNavButtons();
        const fresh = document.getElementById('pageContent');
        fresh.classList.remove('flip-out');
        fresh.classList.add('flip-in');
        setTimeout(() => fresh.classList.remove('flip-in'), 450);
    }, 380);
}

function updateNavButtons() {
    const sorted = sortedEntries();
    const idx = sorted.findIndex(e => e.id === activeId);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const counter = document.getElementById('navCounter');

    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx === -1 || idx >= sorted.length - 1;

    if (sorted.length > 0 && idx !== -1) {
        counter.textContent = `${idx + 1} / ${sorted.length}`;
    } else {
        counter.textContent = '—';
    }
}

function updateStatsFooter() {
    const footer = document.getElementById('statsFooter');
    const total = entries.length;
    footer.textContent = `✦ total catatan: ${total} ✦`;
}

// ============================================================
// EVENT LISTENERS
// ============================================================
// New entry
document.getElementById('newEntryBtn').addEventListener('click', () => {
    const newEntry = {
        id: uid(),
        date: todayStr(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: '',
        body: '',
        mood: MOODS[0]
    };
    entries.push(newEntry);
    activeId = newEntry.id;
    persistEntries();
    renderAll();
    showToast('📝 Catatan baru dibuat', 'success');
    setTimeout(() => {
        const t = document.getElementById('titleInput');
        if (t) t.focus();
    }, 100);
});

// Navigation buttons
document.getElementById('prevBtn').addEventListener('click', () => {
    const sorted = sortedEntries();
    const idx = sorted.findIndex(e => e.id === activeId);
    if (idx > 0) flipToEntry(sorted[idx - 1].id);
});

document.getElementById('nextBtn').addEventListener('click', () => {
    const sorted = sortedEntries();
    const idx = sorted.findIndex(e => e.id === activeId);
    if (idx !== -1 && idx < sorted.length - 1) flipToEntry(sorted[idx + 1].id);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('newEntryBtn').click();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        document.getElementById('prevBtn').click();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        document.getElementById('nextBtn').click();
    }
});

// Cover click to open
document.getElementById('cover').addEventListener('click', () => {
    document.getElementById('book').classList.add('opened');
});

// Auto-open after load if there are entries
setTimeout(() => {
    if (entries.length > 0) {
        document.getElementById('book').classList.add('opened');
    }
}, 600);

// ============================================================
// INIT
// ============================================================
loadEntries();

console.log('📖 Jurnal Harian 3D loaded!');
console.log(`📊 ${entries.length} entries`);
console.log('💡 Keyboard: Ctrl+N (new), Ctrl+Shift+←/→ (navigate)');
// ============================================================
// DATABASE LAYER - MySQL via PHP API
// ============================================================

const API_URL = 'http://localhost/jurnal_3d/api_'; // Sesuaikan URL

async function bacaData() {
    try {
        const response = await fetch(API_URL + 'read.php');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Gagal membaca data:', error);
        return [];
    }
}

async function tambahCatatan(judul, isi, mood) {
    try {
        const response = await fetch(API_URL + 'create.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: judul,
                body: isi,
                mood: mood
            })
        });
        const result = await response.json();
        if (result.success) {
            // Refresh data
            await loadData();
            return result;
        }
    } catch (error) {
        console.error('Gagal menambah catatan:', error);
    }
}

async function ubahCatatan(id, field, nilai) {
    try {
        const response = await fetch(API_URL + 'update.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                field: field,
                value: nilai
            })
        });
        const result = await response.json();
        if (result.success) {
            await loadData();
            return result;
        }
    } catch (error) {
        console.error('Gagal mengubah catatan:', error);
    }
}

async function hapusCatatan(id) {
    if (!confirm('Yakin ingin menghapus catatan ini?')) return;
    
    try {
        const response = await fetch(API_URL + 'delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        if (result.success) {
            await loadData();
            showToast('Catatan dihapus', 'error');
        }
    } catch (error) {
        console.error('Gagal menghapus catatan:', error);
    }
}

// Fungsi untuk memuat data saat halaman dibuka
async function loadData() {
    entries = await bacaData();
    if (entries.length > 0) {
        activeId = entries[0]?.id || null;
    }
    renderAll();
    updateStatsFooter();
}

// Ganti loadEntries() dengan loadData()
// Ganti persistEntries() dengan loadData() (refresh)