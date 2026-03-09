// ══ STATE ══
let state = JSON.parse(localStorage.getItem('flowmind_v3') || 'null') || {
  habits: [], tasks: [], sessions: [], notes: [], apiKey: ''
};
const save = () => localStorage.setItem('flowmind_v3', JSON.stringify(state));

// ══ CONSTANTS ══
const EMOJIS = ['⭐️','💪','📚','🧘','🏃','💧','🍎','✍️','🎯','🛌','🧠','🎨','🚴','🎵','🌿','🏋️'];
const MOODS  = ['😄','😊','😐','😔','😤','😴','🤩','😰'];

// Priority design tokens
const PRIORITY_CONFIG = {
  low:    { color: '#2DD4BF', bg: 'rgba(45,212,191,0.12)',  border: 'rgba(45,212,191,0.3)'  },
  medium: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  high:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  urgent: { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)'   }
};
const PRIORITY_LABELS = { low: '● Low', medium: '● Medium', high: '● High', urgent: '● Urgent' };

let selectedEmoji = EMOJIS[0];
let selectedMood  = MOODS[0];
let currentTab    = 'dashboard';

// ══ INIT ══
document.addEventListener('DOMContentLoaded', () => {
  const h = new Date().getHours();
  document.getElementById('greeting').textContent =
    h < 5  ? 'Night owl mode 🌙' :
    h < 12 ? 'Good morning! 🌅' :
    h < 17 ? 'Good afternoon! ☀️' : 'Good evening! 🌙';
  document.getElementById('today-date').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  buildPicker('emoji-row', EMOJIS, e => { selectedEmoji = e; }, 'emoji-btn');
  buildPicker('mood-row',  MOODS,  m => { selectedMood  = m; }, 'mood-btn');

  if (state.apiKey) document.getElementById('api-banner').style.display = 'none';

  initChat();
  renderAll();
  initTimer();
});

function buildPicker(id, items, onSelect, cls) {
  const c = document.getElementById(id);
  if (!c) return;
  items.forEach((item, idx) => {
    const b = document.createElement('button');
    b.className = cls + (idx === 0 ? ' selected' : '');
    b.textContent = item;
    b.onclick = () => {
      onSelect(item);
      c.querySelectorAll('.' + cls).forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
    };
    c.appendChild(b);
  });
}

// ══ TABS ══
function showTab(name, btn) {
  currentTab = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const hideFab = ['timer','ai','dashboard','notes'].includes(name);
  document.getElementById('fab').className = 'fab' + (hideFab ? ' hidden' : '');

  if (name === 'dashboard') renderDashboard();
  if (name === 'notes')     renderNotes();
}

function openAdd() {
  if (currentTab === 'habits') { document.getElementById('modal-habit').classList.add('open'); setTimeout(() => document.getElementById('h-name').focus(), 350); }
  if (currentTab === 'tasks')  { document.getElementById('modal-task').classList.add('open');  setTimeout(() => document.getElementById('t-name').focus(), 350); }
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeModals(); });

// ══ UTILS ══
function todayStr() { return new Date().toISOString().split('T')[0]; }
function renderAll() { renderHabits(); renderTasks(); renderDashboard(); renderNotes(); }
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ══ DASHBOARD ══
function renderDashboard() {
  const today = todayStr();
  const done  = state.habits.filter(h => h.completedDates?.includes(today)).length;
  document.getElementById('stat-habits').textContent = `${done}/${state.habits.length}`;
  document.getElementById('stat-tasks').textContent  = state.tasks.filter(t => !t.done).length;
  const fm = Math.round(
    state.sessions.filter(s => s.date === today && s.type === 'Focus')
      .reduce((a, b) => a + b.duration, 0) / 60
  );
  document.getElementById('stat-focus').textContent = fm + 'm';

  const dh = document.getElementById('dash-habits');
  dh.innerHTML = state.habits.length
    ? state.habits.map((h, i) => {
        const d = h.completedDates?.includes(today);
        return `<div class="habit-chip ${d ? 'done' : ''}" onclick="toggleHabit(${i})">
          <div class="habit-chip-emoji">${h.emoji}</div>
          <div class="habit-chip-name">${esc(h.name)}</div>
          <div class="habit-chip-check">${d ? '✓' : ''}</div>
        </div>`;
      }).join('')
    : '<div style="color:var(--t3);font-size:13px;padding:8px 0">No habits yet</div>';

  const pending = state.tasks.filter(t => !t.done).slice(0, 3);
  document.getElementById('dash-tasks').innerHTML = pending.length
    ? pending.map(t => taskHTML(t, state.tasks.indexOf(t))).join('')
    : '<div style="color:var(--t3);font-size:13px;padding:8px 0">All clear 🎉</div>';
}

// ══ HABITS ══
function renderHabits() {
  const el = document.getElementById('habits-list');
  const today = todayStr();
  if (!state.habits.length) {
    el.innerHTML = emptyState('💫', 'No habits yet', 'Tap + to start your first streak');
    return;
  }
  el.innerHTML = state.habits.map((h, i) => {
    const d = h.completedDates?.includes(today);
    return `<div class="habit-item ${d ? 'done' : ''}" onclick="toggleHabit(${i})">
      <div class="habit-emoji">${h.emoji}</div>
      <div class="habit-info">
        <div class="habit-name">${esc(h.name)}</div>
        <div class="habit-meta">${h.freq} &nbsp;·&nbsp; 🔥 ${h.streak || 0} day streak</div>
      </div>
      <div class="habit-check">✓</div>
    </div>`;
  }).join('');
}

function addHabit() {
  const name = document.getElementById('h-name').value.trim();
  if (!name) return;
  state.habits.push({ name, emoji: selectedEmoji, freq: document.getElementById('h-freq').value, streak: 0, completedDates: [] });
  save(); renderAll(); closeModals();
  document.getElementById('h-name').value = '';
}

function toggleHabit(i) {
  const today = todayStr();
  const h = state.habits[i];
  if (!h.completedDates) h.completedDates = [];
  if (h.completedDates.includes(today)) {
    h.completedDates = h.completedDates.filter(d => d !== today);
    h.streak = Math.max(0, (h.streak || 1) - 1);
  } else {
    h.completedDates.push(today);
    h.streak = (h.streak || 0) + 1;
  }
  save(); renderAll();
}

// ══ TASKS ══
function taskHTML(t, i) {
  const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
  return `<div class="task-item ${t.done ? 'done' : ''}">
    <div class="task-check-wrap" onclick="toggleTask(${i})">✓</div>
    <div class="task-body">
      <div class="task-title">${esc(t.name)}</div>
      <div class="task-meta">
        <span class="priority-pill" style="color:${p.color};background:${p.bg};border-color:${p.border}">
          ${PRIORITY_LABELS[t.priority] || t.priority}
        </span>
        ${t.due ? `<span>· Due ${t.due}</span>` : ''}
      </div>
    </div>
    <button class="task-edit-btn" onclick="openEditTask(${i})">✏️</button>
  </div>`;
}

function renderTasks() {
  const el = document.getElementById('tasks-list');
  if (!state.tasks.length) {
    el.innerHTML = emptyState('🎯', 'All clear!', 'Tap + to add your first task');
    return;
  }
  const pending = state.tasks.filter(t => !t.done);
  const done    = state.tasks.filter(t => t.done);
  let html = pending.map(t => taskHTML(t, state.tasks.indexOf(t))).join('');
  if (done.length) {
    html += `<div class="section-label">Completed (${done.length})</div>`;
    html += done.map(t => taskHTML(t, state.tasks.indexOf(t))).join('');
  }
  el.innerHTML = html;
}

function addTask() {
  const name = document.getElementById('t-name').value.trim();
  if (!name) return;
  state.tasks.unshift({ name, priority: document.getElementById('t-priority').value, due: document.getElementById('t-due').value, done: false });
  save(); renderAll(); closeModals();
  document.getElementById('t-name').value = '';
  document.getElementById('t-due').value  = '';
}

function toggleTask(i) {
  state.tasks[i].done = !state.tasks[i].done;
  save(); renderAll();
}

function openEditTask(i) {
  const t = state.tasks[i];
  document.getElementById('edit-task-index').value = i;
  document.getElementById('edit-t-name').value     = t.name;
  document.getElementById('edit-t-priority').value = t.priority;
  document.getElementById('edit-t-due').value      = t.due || '';
  document.getElementById('modal-edit-task').classList.add('open');
}

function saveEditTask() {
  const i = parseInt(document.getElementById('edit-task-index').value);
  const name = document.getElementById('edit-t-name').value.trim();
  if (!name) return;
  state.tasks[i] = { ...state.tasks[i], name, priority: document.getElementById('edit-t-priority').value, due: document.getElementById('edit-t-due').value };
  save(); renderAll(); closeModals();
}

function deleteTask() {
  state.tasks.splice(parseInt(document.getElementById('edit-task-index').value), 1);
  save(); renderAll(); closeModals();
}

// ══ TIMER ══
let timerInterval = null, timerRunning = false;
let timeLeft = 25 * 60, totalTime = 25 * 60;
let sessionName = 'Focus', sessionStart = null;
const CIRC = 2 * Math.PI * 100; // r=100

function initTimer() { updateTimerDisplay(); renderSessionHistory(); }

function setSession(name, mins) {
  if (timerRunning) { clearInterval(timerInterval); timerRunning = false; }
  sessionName = name; totalTime = mins * 60; timeLeft = totalTime;

  document.querySelectorAll('.session-tab').forEach(b =>
    b.classList.toggle('active', b.textContent.trim() === name || b.textContent.trim() === mins + ' min')
  );
  document.getElementById('session-label').textContent = name;

  const ringColors = { 'Focus': '#3B82F6', 'Short Break': '#2DD4BF', 'Long Break': '#A855F7' };
  document.getElementById('ring-fill').style.stroke = ringColors[name] || '#3B82F6';
  document.getElementById('ring-fill').style.filter = `drop-shadow(0 0 10px ${ringColors[name] || '#3B82F6'}66)`;
  document.getElementById('play-btn').textContent = '▶';
  sessionStart = null;
  updateTimerDisplay(); setMascotMood(false);
}

function openCustomTimer() {
  document.getElementById('modal-custom-timer').classList.add('open');
  setTimeout(() => document.getElementById('custom-mins').focus(), 350);
}

function applyCustomTimer() {
  const mins  = parseInt(document.getElementById('custom-mins').value);
  const label = document.getElementById('custom-label').value.trim() || 'Custom';
  if (!mins || mins < 1 || mins > 180) { alert('Please enter 1–180 minutes'); return; }
  closeModals();
  document.querySelectorAll('.session-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('custom-tab').classList.add('active');
  if (timerRunning) { clearInterval(timerInterval); timerRunning = false; }
  sessionName = label; totalTime = mins * 60; timeLeft = totalTime;
  document.getElementById('session-label').textContent = label;
  document.getElementById('ring-fill').style.stroke = '#A855F7';
  document.getElementById('play-btn').textContent = '▶';
  sessionStart = null;
  updateTimerDisplay(); setMascotMood(false);
  document.getElementById('custom-mins').value  = '';
  document.getElementById('custom-label').value = '';
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval); timerRunning = false;
    document.getElementById('play-btn').textContent = '▶';
    setMascotMood(false);
  } else {
    timerRunning = true; sessionStart = sessionStart || new Date();
    document.getElementById('play-btn').textContent = '⏸';
    setMascotMood(true);
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval); timerRunning = false;
        document.getElementById('play-btn').textContent = '▶';
        saveSession(totalTime); setMascotMood(false);
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  }
}

function setMascotMood(focused) {
  const m = document.getElementById('timer-mouth');
  if (m) m.setAttribute('d', focused ? 'M34 44 Q40 44 46 44' : 'M34 43 Q40 48 46 43');
}

function resetTimer() {
  if (timerRunning) { clearInterval(timerInterval); timerRunning = false; }
  timeLeft = totalTime; sessionStart = null;
  document.getElementById('play-btn').textContent = '▶';
  updateTimerDisplay(); setMascotMood(false);
}

function skipTimer() {
  if (timerRunning && sessionStart) saveSession(totalTime - timeLeft);
  resetTimer();
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const offset = CIRC * (timeLeft / totalTime);
  document.getElementById('ring-fill').style.strokeDashoffset = CIRC - offset;
}

function saveSession(dur) {
  if (dur < 10) return;
  state.sessions.push({ type: sessionName, duration: dur, date: todayStr(), time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) });
  save(); renderSessionHistory(); renderDashboard();
}

function renderSessionHistory() {
  const el = document.getElementById('session-history');
  const today = state.sessions.filter(s => s.date === todayStr());
  if (!today.length) {
    el.innerHTML = '<div style="color:var(--t3);font-size:13px;font-weight:500">No sessions yet — let\'s focus! 💪</div>';
    return;
  }
  const colors = { 'Focus': '#3B82F6', 'Short Break': '#2DD4BF', 'Long Break': '#A855F7' };
  el.innerHTML = [...today].reverse().map(s => {
    const c = colors[s.type] || '#A855F7';
    return `<span class="session-pill" style="background:${c}18;color:${c};border-color:${c}33">${esc(s.type)} · ${Math.round(s.duration/60)}m · ${s.time}</span>`;
  }).join('');
}

// ══ JOURNAL ══
function renderNotes() {
  const el = document.getElementById('notes-list');
  if (!state.notes.length) {
    el.innerHTML = emptyState('📓', 'No entries yet', 'Tap "New Entry" to start journalling');
    return;
  }
  el.innerHTML = [...state.notes].reverse().map((n, ri) => {
    const i = state.notes.length - 1 - ri;
    return `<div class="note-card" onclick="openEditNote(${i})">
      <div class="note-card-accent"></div>
      <div class="note-card-header">
        <div class="note-card-title">${esc(n.title || 'Untitled')}</div>
        <div class="note-card-mood">${n.mood || '😊'}</div>
      </div>
      <div class="note-card-date">${new Date(n.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</div>
      <div class="note-card-preview">${esc(n.body || '')}</div>
    </div>`;
  }).join('');
}

function openNewNote() {
  document.getElementById('note-index').value = '';
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value  = '';
  document.getElementById('note-modal-title').textContent = 'New Entry ⌘';
  document.getElementById('note-delete-btn').style.display = 'none';
  selectedMood = MOODS[0];
  document.querySelectorAll('.mood-btn').forEach((b, i) => b.classList.toggle('selected', i === 0));
  document.getElementById('modal-note').classList.add('open');
  setTimeout(() => document.getElementById('note-title').focus(), 350);
}

function openEditNote(i) {
  const n = state.notes[i];
  document.getElementById('note-index').value = i;
  document.getElementById('note-title').value = n.title || '';
  document.getElementById('note-body').value  = n.body  || '';
  document.getElementById('note-modal-title').textContent = 'Edit Entry ✏️';
  document.getElementById('note-delete-btn').style.display = 'block';
  selectedMood = n.mood || MOODS[0];
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b.textContent === selectedMood));
  document.getElementById('modal-note').classList.add('open');
}

function saveNote() {
  const title = document.getElementById('note-title').value.trim();
  const body  = document.getElementById('note-body').value.trim();
  if (!title && !body) return;
  const idx = document.getElementById('note-index').value;
  const note = { title, body, mood: selectedMood, date: new Date().toISOString() };
  if (idx !== '') { state.notes[parseInt(idx)] = note; } else { state.notes.push(note); }
  save(); renderNotes(); closeModals();
}

function deleteNote() {
  state.notes.splice(parseInt(document.getElementById('note-index').value), 1);
  save(); renderNotes(); closeModals();
}

// ══ AI CHAT ══
let chatHistory = [];

function initChat() {
  addAIMessage("Hey! 👋 I'm your FlowMind assistant, powered by Claude. I know your habits and tasks so I can give you personalised help. What are we working on today?");
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key.startsWith('sk-ant-')) { alert('Please enter a valid Claude API key (starts with sk-ant-)'); return; }
  state.apiKey = key; save();
  document.getElementById('api-banner').style.display = 'none';
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;
  input.value = ''; input.style.height = 'auto';

  addUserMessage(text);
  chatHistory.push({ role: 'user', content: text });

  const typing = document.createElement('div');
  typing.className = 'msg ai'; typing.id = 'typing';
  typing.innerHTML = `<div class="ai-avatar"></div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  document.getElementById('chat-messages').appendChild(typing);
  scrollChat();

  if (!state.apiKey) {
    setTimeout(() => { typing.remove(); addAIMessage("Please enter your Claude API key to enable AI responses! 🔑"); }, 800);
    return;
  }

  try {
    const today  = todayStr();
    const habits = state.habits.map(h => h.name + (h.completedDates?.includes(today) ? ' ✓' : '')).join(', ') || 'none';
    const tasks  = state.tasks.filter(t => !t.done).map(t => `${t.name}[${t.priority}]`).join(', ') || 'none';
    const focus  = Math.round(state.sessions.filter(s => s.date === today && s.type === 'Focus').reduce((a,b) => a+b.duration, 0) / 60);
    const system = `You are FlowMind's AI assistant — warm, sharp, encouraging. Embedded in a productivity app.
User data: Habits: ${habits}. Pending tasks: ${tasks}. Focus today: ${focus} minutes.
Be concise (max 3 sentences unless asked more). Use 1-2 emojis naturally. Reference real user data when helpful.`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, system, messages: chatHistory.slice(-10) })
    });

    const data = await resp.json();
    typing.remove();
    if (data.error) { addAIMessage('Error: ' + data.error.message); return; }
    const reply = data.content[0].text;
    chatHistory.push({ role: 'assistant', content: reply });
    addAIMessage(reply);
  } catch (e) {
    typing.remove();
    addAIMessage('Connection issue — check your API key and internet! 🌐');
  }
}

function addUserMessage(text) {
  const el = document.createElement('div');
  el.className = 'msg user';
  el.innerHTML = `<div class="user-avatar">🙂</div><div class="msg-bubble">${escHTML(text)}</div>`;
  document.getElementById('chat-messages').appendChild(el);
  scrollChat();
}

function addAIMessage(text) {
  const el = document.createElement('div');
  el.className = 'msg ai';
  el.innerHTML = `<div class="ai-avatar"></div><div class="msg-bubble">${escHTML(text)}</div>`;
  document.getElementById('chat-messages').appendChild(el);
  scrollChat();
}

function scrollChat() {
  const c = document.getElementById('chat-messages');
  setTimeout(() => c.scrollTop = c.scrollHeight, 50);
}

function escHTML(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

// ══ HELPERS ══
function emptyState(icon, title, sub) {
  return `<div class="empty-state">
    <div class="empty-mascot">${icon}</div>
    <div class="empty-title">${title}</div>
    <div class="empty-sub">${sub}</div>
  </div>`;
}
