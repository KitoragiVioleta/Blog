// ── Data ─────────────────────────────────────────────────────────────────────

const CATS = {
  tech:   { label: '💻 Технології', cls: 'cat--tech'   },
  life:   { label: '🌿 Життя',       cls: 'cat--life'   },
  travel: { label: '✈️ Подорожі',    cls: 'cat--travel' },
  other:  { label: '📌 Інше',        cls: 'cat--other'  },
};

let posts = loadPosts() || [
  {
    id: 1,
    title: 'Ласкаво просимо до мого блогу!',
    body: 'Це перший пост у моєму новому блозі. Тут я ділитимусь думками, ідеями та досвідом на різні теми.\n\nСподіваюсь, вам сподобається читати мої нотатки.',
    category: 'other',
    tags: ['перший пост', 'привіт'],
    date: '2026-03-15',
  },
  {
    id: 2,
    title: 'JavaScript у 2026: що нового?',
    body: 'Мова JavaScript продовжує розвиватись. У цьому пості розглянемо найцікавіші нові можливості та патерни, які варто знати кожному розробнику.\n\nВіддайте перевагу сучасним підходам — вони роблять код чистішим і зрозумілішим.',
    category: 'tech',
    tags: ['javascript', 'веброзробка'],
    date: '2026-03-28',
  },
  {
    id: 3,
    title: 'Подорож до Карпат',
    body: 'Нещодавно я провів тиждень у Карпатах. Гори, свіже повітря, тиша — найкращий відпочинок від міського шуму.\n\nРекомендую кожному побувати там хоча б раз у житті.',
    category: 'travel',
    tags: ['карпати', 'природа', 'відпочинок'],
    date: '2026-04-01',
  },
];

let nextId     = Math.max(0, ...posts.map(p => p.id)) + 1;
let editingId  = null;
let editTags   = [];
let expandedId = null;
let currentFilter = 'all';

// ── Persistence ───────────────────────────────────────────────────────────────

function savePosts()  { localStorage.setItem('blog_posts', JSON.stringify(posts)); }
function loadPosts()  {
  try { return JSON.parse(localStorage.getItem('blog_posts')); } catch { return null; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function readingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200)) + ' хв читання';
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── Editor ────────────────────────────────────────────────────────────────────

function openEditor(id = null) {
  editingId = id;
  const post = id !== null ? posts.find(p => p.id === id) : null;
  editTags = post ? [...post.tags] : [];

  document.getElementById('editorTitle').textContent = post ? 'Редагувати пост' : 'Новий пост';
  document.getElementById('eTitle').value            = post ? post.title : '';
  document.getElementById('eCat').value              = post ? post.category : 'other';
  document.getElementById('eBody').value             = post ? post.body : '';
  document.getElementById('saveBtn').textContent     = post ? 'Зберегти зміни' : 'Опублікувати';

  renderTagInput();

  document.getElementById('editor').style.display = 'block';
  document.getElementById('newPostBtn').textContent = '✕ Закрити';
  document.getElementById('eTitle').focus();
  document.getElementById('editor').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeEditor() {
  document.getElementById('editor').style.display = 'none';
  document.getElementById('newPostBtn').textContent = '+ Новий пост';
  editingId = null;
  editTags  = [];
}

function toggleEditor() {
  const isOpen = document.getElementById('editor').style.display !== 'none';
  isOpen ? closeEditor() : openEditor();
}

function renderTagInput() {
  const container = document.getElementById('tagInput');
  const tagsHTML  = editTags.map(t =>
    `<span class="tag">${esc(t)}<button class="tag__remove" data-tag="${esc(t)}" title="Видалити тег">&times;</button></span>`
  ).join('');
  container.innerHTML = tagsHTML + `<input class="tag-input__box" id="tagBox" type="text" placeholder="додати тег..." />`;
  document.getElementById('tagBox').addEventListener('keydown', handleTagKey);
  container.querySelectorAll('.tag__remove').forEach(btn => {
    btn.addEventListener('click', () => removeTag(btn.dataset.tag));
  });
}

function handleTagKey(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const val = e.target.value.trim().toLowerCase();
  if (val && !editTags.includes(val)) {
    editTags.push(val);
    renderTagInput();
    document.getElementById('tagBox').focus();
  } else {
    e.target.value = '';
  }
}

function removeTag(tag) {
  editTags = editTags.filter(t => t !== tag);
  renderTagInput();
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

function savePost() {
  const title = document.getElementById('eTitle').value.trim();
  const body  = document.getElementById('eBody').value.trim();
  const cat   = document.getElementById('eCat').value;

  if (!title) { alert('Будь ласка, введіть заголовок!'); document.getElementById('eTitle').focus(); return; }
  if (!body)  { alert('Будь ласка, напишіть текст посту!'); document.getElementById('eBody').focus(); return; }

  if (editingId !== null) {
    // UPDATE
    const idx = posts.findIndex(p => p.id === editingId);
    posts[idx] = { ...posts[idx], title, body, category: cat, tags: [...editTags] };
  } else {
    // CREATE
    posts.unshift({ id: nextId++, title, body, category: cat, tags: [...editTags], date: today() });
  }

  savePosts();
  closeEditor();
  renderPosts();
}

function deletePost(id) {
  if (!confirm('Видалити цей пост? Цю дію не можна скасувати.')) return;
  posts = posts.filter(p => p.id !== id);
  if (expandedId === id) expandedId = null;
  savePosts();
  renderPosts();
}

function toggleExpand(id) {
  expandedId = expandedId === id ? null : id;
  renderPosts();
}

// ── Filters ───────────────────────────────────────────────────────────────────

function setFilter(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  renderPosts();
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderPosts() {
  const query = document.getElementById('searchBox').value.toLowerCase();

  const filtered = posts.filter(p => {
    if (currentFilter !== 'all' && p.category !== currentFilter) return false;
    if (query && !p.title.toLowerCase().includes(query) && !p.body.toLowerCase().includes(query)) return false;
    return true;
  });

  const container = document.getElementById('postsContainer');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty__icon">📭</div>
        <h3>Постів не знайдено</h3>
        <p>Спробуйте змінити фільтр або пошуковий запит</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="posts">${filtered.map(renderPost).join('')}</div>`;

  // Bind events after render
  container.querySelectorAll('.post').forEach(card => {
    const id = Number(card.dataset.id);
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // don't expand on button clicks
      toggleExpand(id);
    });
  });
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditor(Number(btn.dataset.id)));
  });
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deletePost(Number(btn.dataset.id)));
  });
}

function renderPost(p) {
  const exp     = expandedId === p.id;
  const cat     = CATS[p.category];
  const excerpt = p.body.length > 140 ? p.body.slice(0, 140).trimEnd() + '…' : p.body;

  const tagsHTML = p.tags.length
    ? `<div class="post__tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
    : '';

  return `
  <article class="post ${exp ? 'expanded' : ''}" data-id="${p.id}">
    <div class="post__meta">
      <span class="post__cat ${cat.cls}">${cat.label}</span>
      <span class="post__reading">${readingTime(p.body)}</span>
      <span class="post__date">${formatDate(p.date)}</span>
    </div>
    <h2 class="post__title">${esc(p.title)}</h2>
    <p class="post__excerpt">${exp ? '' : esc(excerpt)}</p>
    ${exp ? `<div class="post__body">${esc(p.body)}</div>` : ''}
    ${tagsHTML}
    <div class="post__actions">
      <span class="post__hint">${exp ? '▲ Згорнути' : '▼ Читати далі'}</span>
      <button class="btn btn-edit" data-id="${p.id}">✏️ Редагувати</button>
      <button class="btn btn--danger btn-delete" data-id="${p.id}">🗑 Видалити</button>
    </div>
  </article>`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.getElementById('newPostBtn').addEventListener('click', toggleEditor);
document.getElementById('cancelBtn').addEventListener('click', closeEditor);
document.getElementById('saveBtn').addEventListener('click', savePost);
document.getElementById('searchBox').addEventListener('input', renderPosts);

document.getElementById('filters').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter');
  if (btn) setFilter(btn.dataset.cat);
});

renderPosts();
