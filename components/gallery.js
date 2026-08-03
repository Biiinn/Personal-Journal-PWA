// ============================================================
// GALLERY — multi-photo support for journal entries
// ============================================================
// Depends on: ImageStore (utils/imageStore.js), t()/i18n, and the
// app's `state` object + saveEntry()/currentDate from script.js.
//
// Data model: state.photos is an ORDERED array of image IDs, e.g.
// ["a1b2c3", "d4e5f6"]. That array is the only thing saved into the
// journal entry itself (in localStorage). The actual image bytes are
// stored separately in IndexedDB via ImageStore and are looked up
// by ID whenever they need to be displayed.
//
// Object URLs created with URL.createObjectURL() are tracked and
// revoked on every re-render to avoid leaking memory over a long
// session.

let galleryObjectURLs = []; // { id, url } currently shown in the Write-tab gallery
let lightboxIndex = 0;
let lightboxURLs = []; // object URLs for the entry currently open in the lightbox

function revokeGalleryURLs() {
  galleryObjectURLs.forEach(({ url }) => URL.revokeObjectURL(url));
  galleryObjectURLs = [];
}

// Any gallery change (add / delete / reorder) immediately persists the
// entry — this keeps the small localStorage record and the IndexedDB
// blobs from ever drifting out of sync, and matches how photos already
// behaved before this feature (added, then saved).
async function persistGalleryChange() {
  if (typeof cancelAutosave === 'function') cancelAutosave();
  await saveEntry();
}

async function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const countBadge = document.getElementById('photoCount');
  if (!grid) return;

  revokeGalleryURLs();
  grid.innerHTML = '';
  if (countBadge) countBadge.textContent = state.photos.length ? '(' + state.photos.length + ')' : '';

  for (const id of state.photos) {
    const blob = await ImageStore.getImage(id);
    if (!blob) continue; // image was deleted/missing — skip silently
    const url = URL.createObjectURL(blob);
    galleryObjectURLs.push({ id, url });

    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumb';
    thumb.draggable = true;
    thumb.dataset.id = id;
    thumb.innerHTML = '<img src="' + url + '" alt=""><button class="gallery-thumb-del" data-id="' + id + '">×</button>';
    thumb.querySelector('img').addEventListener('click', () => openLightboxForCurrentEntry(state.photos.indexOf(id)));
    thumb.querySelector('.gallery-thumb-del').addEventListener('click', async (e) => {
      e.stopPropagation();
      await ImageStore.deleteImage(id);
      state.photos = state.photos.filter(pid => pid !== id);
      await renderGallery();
      await persistGalleryChange();
    });
    wireDragAndDrop(thumb);
    grid.appendChild(thumb);
  }
}

// ---------- Drag-and-drop reordering ----------
let dragSourceId = null;

function wireDragAndDrop(thumb) {
  thumb.addEventListener('dragstart', () => { dragSourceId = thumb.dataset.id; thumb.classList.add('dragging'); });
  thumb.addEventListener('dragend', () => { thumb.classList.remove('dragging'); dragSourceId = null; });
  thumb.addEventListener('dragover', (e) => { e.preventDefault(); thumb.classList.add('drag-over'); });
  thumb.addEventListener('dragleave', () => thumb.classList.remove('drag-over'));
  thumb.addEventListener('drop', async (e) => {
    e.preventDefault();
    thumb.classList.remove('drag-over');
    const targetId = thumb.dataset.id;
    if (!dragSourceId || dragSourceId === targetId) return;
    const from = state.photos.indexOf(dragSourceId);
    const to = state.photos.indexOf(targetId);
    if (from === -1 || to === -1) return;
    state.photos.splice(to, 0, state.photos.splice(from, 1)[0]);
    await renderGallery();
    await persistGalleryChange();
  });
}

// ---------- Adding photos ----------
async function handlePhotoFilesSelected(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  let failCount = 0;
  for (const file of files) {
    try {
      const id = await ImageStore.addImage(currentDate, file, state.photos.length);
      state.photos.push(id);
    } catch (err) {
      failCount++;
      console.warn('Could not add photo:', err);
    }
  }
  await renderGallery();
  await persistGalleryChange();
  if (failCount > 0) {
    const status = document.getElementById('saveStatus');
    if (status) {
      status.textContent = t('write.photoAddError', { count: failCount });
      setTimeout(() => { status.textContent = ''; }, 4000);
    }
  }
}

// ---------- Lightbox ----------
async function openLightboxForCurrentEntry(startIndex) {
  const ids = state.photos;
  if (!ids.length) return;
  lightboxURLs.forEach(u => URL.revokeObjectURL(u));
  lightboxURLs = await Promise.all(ids.map(id => ImageStore.getImageURL(id)));
  lightboxIndex = startIndex;
  showLightbox();
}

// Used by other views (Home, Search, etc.) where we're not editing
// the currently-loaded entry, so we fetch that entry's own photo list.
async function openLightboxForEntry(imageIds, startIndex) {
  lightboxURLs.forEach(u => URL.revokeObjectURL(u));
  lightboxURLs = await Promise.all(imageIds.map(id => ImageStore.getImageURL(id)));
  lightboxIndex = startIndex;
  showLightbox();
}

function showLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.add('show');
  updateLightboxImage();
  document.addEventListener('keydown', lightboxKeyHandler);
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('show');
  document.removeEventListener('keydown', lightboxKeyHandler);
  lightboxURLs.forEach(u => URL.revokeObjectURL(u));
  lightboxURLs = [];
}
function updateLightboxImage() {
  document.getElementById('lightboxImg').src = lightboxURLs[lightboxIndex] || '';
  document.getElementById('lightboxCounter').textContent = (lightboxIndex + 1) + ' / ' + lightboxURLs.length;
  document.getElementById('lightboxPrev').style.visibility = lightboxURLs.length > 1 ? 'visible' : 'hidden';
  document.getElementById('lightboxNext').style.visibility = lightboxURLs.length > 1 ? 'visible' : 'hidden';
}
function lightboxNext() { lightboxIndex = (lightboxIndex + 1) % lightboxURLs.length; updateLightboxImage(); }
function lightboxPrev() { lightboxIndex = (lightboxIndex - 1 + lightboxURLs.length) % lightboxURLs.length; updateLightboxImage(); }
function lightboxKeyHandler(e) {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lightboxNext();
  if (e.key === 'ArrowLeft') lightboxPrev();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('photoInput').addEventListener('change', (e) => {
    handlePhotoFilesSelected(e.target.files);
    e.target.value = ''; // allow selecting the same file again later
  });
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxNext').addEventListener('click', lightboxNext);
  document.getElementById('lightboxPrev').addEventListener('click', lightboxPrev);
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox(); // click on backdrop
  });
});

// ---------- Thumbnails elsewhere in the app (Home, Search, ...) ----------
// Given a container element and a journal entry, if the entry has
// photos, asynchronously fetch the first one and drop it in as a
// small thumbnail. Fire-and-forget: never blocks the list it's part of.
function attachEntryThumbnail(containerEl, entry, allImageIds) {
  if (!containerEl || !entry.photos || !entry.photos.length) return;
  ImageStore.getImageURL(entry.photos[0]).then(url => {
    if (!url) return;
    const img = document.createElement('img');
    img.src = url;
    img.className = 'hi-thumb';
    img.alt = '';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightboxForEntry(entry.photos, 0);
    });
    containerEl.prepend(img);
  });
}
