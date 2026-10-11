/**
 * AI MEMER - Frontend Application & Canvas Studio Engine
 * Full support for Real News Article Photo Memes, Sub-styles, Custom Uploads, and AI Punchlines.
 */

// Application State
const state = {
  currentType: 'top',
  currentTopic: '',
  currentCountry: 'US',
  searchQuery: '',
  articles: [],
  clusters: [],
  selectedArticle: null,
  currentVibe: 'dark',
  activeTemplate: 'news_photo', // Default to news photo meme
  photoSubstyle: 'photo_impact', // photo_impact | photo_caption | photo_breaking | photo_cinematic
  photoDarken: 20, // percentage 0-75
  currentPhotoImg: null,
  isPhotoLoading: false,
  lastFetchedArticleUrl: '',
  memeData: {
    topText: 'WHEN THE NEWS DROPS:',
    bottomText: 'Select a headline from the live feed to generate meme punchlines!',
    textColor: '#ffffff',
    strokeColor: '#000000',
    fontSize: 36
  },
  savedVault: JSON.parse(localStorage.getItem('ai_memer_vault') || '[]')
};

// DOM Elements
const elements = {
  newsGrid: document.getElementById('newsGrid'),
  feedTitle: document.getElementById('feedTitle'),
  feedCountBadge: document.getElementById('feedCountBadge'),
  countrySelect: document.getElementById('countrySelect'),
  refreshFeedBtn: document.getElementById('refreshFeedBtn'),
  topicTabs: document.getElementById('topicTabs'),
  searchInput: document.getElementById('searchInput'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  quickFilterInput: document.getElementById('quickFilterInput'),
  
  // Sidebar Dock
  activeHeadlineBox: document.getElementById('activeHeadlineBox'),
  activeHeadlineCategory: document.getElementById('activeHeadlineCategory'),
  activeHeadlineText: document.getElementById('activeHeadlineText'),
  activeHeadlineSource: document.getElementById('activeHeadlineSource'),
  memeWithPhotoBtn: document.getElementById('memeWithPhotoBtn'),
  launchFullStudioBtn: document.getElementById('launchFullStudioBtn'),
  generateQuickMemeBtn: document.getElementById('generateQuickMemeBtn'),
  tickerItems: document.getElementById('tickerItems'),
  
  // Studio Modal
  studioModal: document.getElementById('studioModal'),
  closeStudioBtn: document.getElementById('closeStudioBtn'),
  memeCanvas: document.getElementById('memeCanvas'),
  downloadMemeBtn: document.getElementById('downloadMemeBtn'),
  copyMemeBtn: document.getElementById('copyMemeBtn'),
  saveVaultBtn: document.getElementById('saveVaultBtn'),
  templateSelector: document.getElementById('templateSelector'),
  aiSuggestionsList: document.getElementById('aiSuggestionsList'),
  aiVibePills: document.getElementById('aiVibePills'),
  regenerateAiBtn: document.getElementById('regenerateAiBtn'),

  // News Photo Meme Controls
  newsPhotoSection: document.getElementById('newsPhotoSection'),
  photoStatusBadge: document.getElementById('photoStatusBadge'),
  photoLayoutGrid: document.getElementById('photoLayoutGrid'),
  reFetchImageBtn: document.getElementById('reFetchImageBtn'),
  customImageInput: document.getElementById('customImageInput'),
  pasteUrlBtn: document.getElementById('pasteUrlBtn'),
  darkenSlider: document.getElementById('darkenSlider'),
  darkenVal: document.getElementById('darkenVal'),
  
  // Form Controls
  topTextInput: document.getElementById('topTextInput'),
  bottomTextInput: document.getElementById('bottomTextInput'),
  textColorPicker: document.getElementById('textColorPicker'),
  strokeColorPicker: document.getElementById('strokeColorPicker'),
  fontSizeSlider: document.getElementById('fontSizeSlider'),
  fontSizeVal: document.getElementById('fontSizeVal'),
  
  // Vault Modal
  openVaultBtn: document.getElementById('openVaultBtn'),
  vaultModal: document.getElementById('vaultModal'),
  closeVaultBtn: document.getElementById('closeVaultBtn'),
  vaultGrid: document.getElementById('vaultGrid'),
  vaultCount: document.getElementById('vaultCount'),

  // Reel Studio Modal & Controls
  openReelStudioNavBtn: document.getElementById('openReelStudioNavBtn'),
  createReelSidebarBtn: document.getElementById('createReelSidebarBtn'),
  reelModal: document.getElementById('reelModal'),
  closeReelBtn: document.getElementById('closeReelBtn'),
  reelCanvas: document.getElementById('reelCanvas'),
  reelVideoSource: document.getElementById('reelVideoSource'),
  togglePlayBtn: document.getElementById('togglePlayBtn'),
  videoSeekBar: document.getElementById('videoSeekBar'),
  toggleMuteBtn: document.getElementById('toggleMuteBtn'),
  videoTimeDisplay: document.getElementById('videoTimeDisplay'),
  exportReelBtn: document.getElementById('exportReelBtn'),
  saveReelVaultBtn: document.getElementById('saveReelVaultBtn'),
  exportProgressBar: document.getElementById('exportProgressBar'),
  exportProgressFill: document.getElementById('exportProgressFill'),
  exportProgressText: document.getElementById('exportProgressText'),
  videoSourceTabs: document.getElementById('videoSourceTabs'),
  vtabPaste: document.getElementById('vtabPaste'),
  vtabUpload: document.getElementById('vtabUpload'),
  vtabAutoSearch: document.getElementById('vtabAutoSearch'),
  vtabPreset: document.getElementById('vtabPreset'),
  reelUrlInput: document.getElementById('reelUrlInput'),
  fetchReelUrlBtn: document.getElementById('fetchReelUrlBtn'),
  reelVideoFileInput: document.getElementById('reelVideoFileInput'),
  autoSearchQueryInput: document.getElementById('autoSearchQueryInput'),
  autoSearchVideoBtn: document.getElementById('autoSearchVideoBtn'),
  videoStatusIndicator: document.getElementById('videoStatusIndicator'),
  videoStatusLabel: document.getElementById('videoStatusLabel'),
  reelLayoutGrid: document.getElementById('reelLayoutGrid'),
  regenReelHooksBtn: document.getElementById('regenReelHooksBtn'),
  reelVibePills: document.getElementById('reelVibePills'),
  reelHooksList: document.getElementById('reelHooksList'),
  reelTopHookInput: document.getElementById('reelTopHookInput'),
  reelCaptionInput: document.getElementById('reelCaptionInput'),
  reelDarkenSlider: document.getElementById('reelDarkenSlider'),
  reelDarkenVal: document.getElementById('reelDarkenVal'),

  // Instagram Navigation & Modals
  openInstagramModalBtn: document.getElementById('openInstagramModalBtn'),
  igNavLabel: document.getElementById('igNavLabel'),
  igNavStatusDot: document.getElementById('igNavStatusDot'),
  instagramModal: document.getElementById('instagramModal'),
  closeInstagramBtn: document.getElementById('closeInstagramBtn'),
  igConnectedView: document.getElementById('igConnectedView'),
  igProfilePic: document.getElementById('igProfilePic'),
  igUsernameDisplay: document.getElementById('igUsernameDisplay'),
  igFullNameDisplay: document.getElementById('igFullNameDisplay'),
  igFollowersCount: document.getElementById('igFollowersCount'),
  igDisconnectBtn: document.getElementById('igDisconnectBtn'),
  igDisconnectedView: document.getElementById('igDisconnectedView'),
  igTabSession: document.getElementById('igTabSession'),
  igTabCreds: document.getElementById('igTabCreds'),
  igSessionIdInput: document.getElementById('igSessionIdInput'),
  igConnectSessionBtn: document.getElementById('igConnectSessionBtn'),
  igUsernameInput: document.getElementById('igUsernameInput'),
  igPasswordInput: document.getElementById('igPasswordInput'),
  ig2faInput: document.getElementById('ig2faInput'),
  igConnectCredsBtn: document.getElementById('igConnectCredsBtn'),
  igStatusMsg: document.getElementById('igStatusMsg'),

  // Instagram Share & Publish Modal
  openMemeIgPublishBtn: document.getElementById('openMemeIgPublishBtn'),
  openReelIgPublishBtn: document.getElementById('openReelIgPublishBtn'),
  igPublishModal: document.getElementById('igPublishModal'),
  closeIgPublishBtn: document.getElementById('closeIgPublishBtn'),
  igPublishSubtitle: document.getElementById('igPublishSubtitle'),
  igPublishImgPreview: document.getElementById('igPublishImgPreview'),
  igPublishVidPreview: document.getElementById('igPublishVidPreview'),
  igCustomUploadRow: document.getElementById('igCustomUploadRow'),
  igCustomVideoInput: document.getElementById('igCustomVideoInput'),
  igCaptionTextarea: document.getElementById('igCaptionTextarea'),
  igAiGenCaptionBtn: document.getElementById('igAiGenCaptionBtn'),
  igHashtagsInput: document.getElementById('igHashtagsInput'),
  igHashtagPills: document.getElementById('igHashtagPills'),
  confirmPublishIgBtn: document.getElementById('confirmPublishIgBtn'),
  igPublishProgressBox: document.getElementById('igPublishProgressBox'),
  igPublishProgressText: document.getElementById('igPublishProgressText'),
  igPublishResultBox: document.getElementById('igPublishResultBox'),
  
  // Mobile Navigation & View Elements
  contentContainer: document.getElementById('contentContainer'),
  mobileModeSwitcher: document.getElementById('mobileModeSwitcher'),
  modeSwitchFeed: document.getElementById('modeSwitchFeed'),
  modeSwitchStudio: document.getElementById('modeSwitchStudio'),
  mModeBadge: document.getElementById('mModeBadge'),
  mSelectedBadge: document.getElementById('mSelectedBadge'),
  mobileBottomNav: document.getElementById('mobileBottomNav'),
  mNavNews: document.getElementById('mNavNews'),
  mNavStudio: document.getElementById('mNavStudio'),
  mNavReel: document.getElementById('mNavReel'),
  mNavIg: document.getElementById('mNavIg'),
  mNavVault: document.getElementById('mNavVault'),
  mIgNavDot: document.getElementById('mIgNavDot'),
  mVaultCountBadge: document.getElementById('mVaultCountBadge'),
  
  toastContainer: document.getElementById('toastContainer')
};

// Instagram Integration State
const igState = {
  connected: false,
  username: '',
  fullName: '',
  profilePicUrl: '',
  followerCount: 0,
  mediaCount: 0,
  isPublishing: false,
  publishMediaType: 'photo', // 'photo' | 'reel'
  pendingPhotoData: null,
  pendingVideoName: null
};

// Reel Studio State
const reelState = {
  layout: 'reel_split', // 'reel_split' | 'reel_chyron' | 'reel_glass_card' | 'reel_impact'
  vibe: 'dark',
  topHook: 'POV: YOU OPENED THE NEWS TODAY 💀',
  caption: '',
  darken: 15,
  isPlaying: false,
  isMuted: true,
  videoReady: false,
  isExporting: false,
  animFrameId: null,
  activeVTab: 'paste',
  tickerOffset: 0,
  mediaRecorder: null,
  recordedChunks: []
};

// Canvas 2D Contexts
const ctx = elements.memeCanvas.getContext('2d');
const reelCtx = elements.reelCanvas ? elements.reelCanvas.getContext('2d') : null;

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
function init() {
  // Ensure all modals are cleanly closed on startup
  [
    elements.studioModal || document.getElementById('studioModal'),
    elements.reelModal || document.getElementById('reelModal'),
    elements.vaultModal || document.getElementById('vaultModal'),
    elements.instagramModal || document.getElementById('instagramModal'),
    elements.igPublishModal || document.getElementById('igPublishModal')
  ].forEach(m => {
    if (m) hideModalElement(m);
  });

  updateVaultCount();
  setupEventListeners();
  setMobileViewMode('feed');
  loadNewsFeed();
  checkInstagramStatus();
}

function setupEventListeners() {
  // Country change
  elements.countrySelect.addEventListener('change', (e) => {
    state.currentCountry = e.target.value;
    loadNewsFeed();
  });

  // Refresh button
  elements.refreshFeedBtn.addEventListener('click', () => {
    loadNewsFeed();
  });

  // Topic tabs
  elements.topicTabs.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab-btn');
    if (!tabBtn) return;

    elements.topicTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('add-active');

    state.currentType = tabBtn.dataset.type;
    state.currentTopic = tabBtn.dataset.topic || '';
    state.searchQuery = '';
    elements.searchInput.value = '';
    elements.searchClearBtn.style.display = 'none';

    loadNewsFeed();
  });

  // Search input with debounce
  let searchTimeout;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    elements.searchClearBtn.style.display = query ? 'block' : 'none';

    searchTimeout = setTimeout(() => {
      if (query) {
        state.currentType = 'search';
        state.searchQuery = query;
        loadNewsFeed();
      } else {
        state.currentType = 'top';
        loadNewsFeed();
      }
    }, 600);
  });

  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.searchClearBtn.style.display = 'none';
    state.currentType = 'top';
    loadNewsFeed();
  });

  // In-feed quick filter
  elements.quickFilterInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = elements.newsGrid.querySelectorAll('.news-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(term) ? 'block' : 'none';
    });
  });

  // Sidebar actions
  elements.memeWithPhotoBtn.addEventListener('click', () => {
    if (!state.selectedArticle) return;
    state.activeTemplate = 'news_photo';
    updateTemplateSelectionUI();
    openStudioModal();
    if (!state.currentPhotoImg || state.lastFetchedArticleUrl !== state.selectedArticle.url) {
      fetchArticleImage(state.selectedArticle.url);
    }
    fetchAiSuggestions();
  });

  elements.launchFullStudioBtn.addEventListener('click', () => {
    openStudioModal();
  });

  elements.generateQuickMemeBtn.addEventListener('click', () => {
    openStudioModal();
    fetchAiSuggestions();
  });

  // Studio Modal
  elements.closeStudioBtn.addEventListener('click', closeStudioModal);
  elements.studioModal.addEventListener('click', (e) => {
    if (e.target === elements.studioModal) closeStudioModal();
  });

  // Template change
  elements.templateSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.template-btn');
    if (!btn) return;
    elements.templateSelector.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeTemplate = btn.dataset.template;
    
    // Toggle newsPhotoSection visibility
    elements.newsPhotoSection.style.display = (state.activeTemplate === 'news_photo') ? 'block' : 'none';
    renderCanvas();
  });

  // Photo Substyle Grid
  elements.photoLayoutGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.layout-btn');
    if (!btn) return;
    elements.photoLayoutGrid.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.photoSubstyle = btn.dataset.substyle;
    renderCanvas();
  });

  // Photo Source Tools
  elements.reFetchImageBtn.addEventListener('click', () => {
    if (state.selectedArticle && state.selectedArticle.url) {
      fetchArticleImage(state.selectedArticle.url, true);
    } else {
      showToast('Select an article first to fetch its photo', 'info');
    }
  });

  elements.customImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        state.currentPhotoImg = img;
        updatePhotoBadge('📁 Custom Upload', 'ready');
        renderCanvas();
        showToast('Custom image loaded onto canvas!', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  elements.pasteUrlBtn.addEventListener('click', () => {
    const url = prompt('Paste direct Image URL (e.g., https://...jpg/png):');
    if (!url || !url.trim()) return;
    loadExternalImage(url.trim());
  });

  // Darken slider
  elements.darkenSlider.addEventListener('input', (e) => {
    state.photoDarken = parseInt(e.target.value, 10);
    elements.darkenVal.textContent = state.photoDarken;
    renderCanvas();
  });

  // Text inputs
  elements.topTextInput.addEventListener('input', (e) => {
    state.memeData.topText = e.target.value;
    renderCanvas();
  });

  elements.bottomTextInput.addEventListener('input', (e) => {
    state.memeData.bottomText = e.target.value;
    renderCanvas();
  });

  elements.textColorPicker.addEventListener('input', (e) => {
    state.memeData.textColor = e.target.value;
    renderCanvas();
  });

  elements.strokeColorPicker.addEventListener('input', (e) => {
    state.memeData.strokeColor = e.target.value;
    renderCanvas();
  });

  elements.fontSizeSlider.addEventListener('input', (e) => {
    state.memeData.fontSize = parseInt(e.target.value, 10);
    elements.fontSizeVal.textContent = state.memeData.fontSize;
    renderCanvas();
  });

  // AI Vibe Pill Selection
  if (elements.aiVibePills) {
    elements.aiVibePills.addEventListener('click', (e) => {
      const btn = e.target.closest('.ai-vibe-pill');
      if (!btn) return;
      elements.aiVibePills.querySelectorAll('.ai-vibe-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentVibe = btn.dataset.vibe || 'dark';
      fetchAiSuggestions();
    });
  }

  if (elements.regenerateAiBtn) {
    elements.regenerateAiBtn.addEventListener('click', fetchAiSuggestions);
  }

  // Canvas Actions
  elements.downloadMemeBtn.addEventListener('click', downloadMeme);
  elements.copyMemeBtn.addEventListener('click', copyMemeToClipboard);
  elements.saveVaultBtn.addEventListener('click', saveMemeToVault);

  // Vault Modal
  elements.openVaultBtn.addEventListener('click', openVaultModal);
  elements.closeVaultBtn.addEventListener('click', closeVaultModal);
  elements.vaultModal.addEventListener('click', (e) => {
    if (e.target === elements.vaultModal) closeVaultModal();
  });

  // Reel Studio Modal & Player Listeners
  setupReelEventListeners();

  // Instagram Connect & Publish Listeners
  setupInstagramEventListeners();

  // Mobile Bottom Navigation & View Mode Listeners
  setupMobileEventListeners();
}

function setupMobileEventListeners() {
  // 1. Mobile Mode Switcher (Feed vs Studio Dock)
  if (elements.modeSwitchFeed) {
    elements.modeSwitchFeed.addEventListener('click', () => {
      setMobileViewMode('feed');
    });
  }

  if (elements.modeSwitchStudio) {
    elements.modeSwitchStudio.addEventListener('click', () => {
      setMobileViewMode('studio');
    });
  }

  // 2. Mobile Bottom Navigation Dock Items
  if (elements.mNavNews) {
    elements.mNavNews.addEventListener('click', () => {
      setMobileViewMode('feed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (elements.mNavStudio) {
    elements.mNavStudio.addEventListener('click', () => {
      if (state.selectedArticle) {
        openStudioModal();
      } else {
        setMobileViewMode('studio');
        showToast('Select any news story from the feed to meme!', 'info');
      }
    });
  }

  if (elements.mNavReel) {
    elements.mNavReel.addEventListener('click', () => {
      openReelStudio(state.selectedArticle?.title || '');
    });
  }

  if (elements.mNavIg) {
    elements.mNavIg.addEventListener('click', () => {
      openInstagramModal();
    });
  }

  if (elements.mNavVault) {
    elements.mNavVault.addEventListener('click', () => {
      openVaultModal();
    });
  }

  // 3. Reliable Modal Close Listeners for both touch and click
  const closeHandlers = [
    { id: 'closeStudioBtn', fn: closeStudioModal },
    { id: 'closeReelBtn', fn: closeReelStudio },
    { id: 'closeVaultBtn', fn: closeVaultModal },
    { id: 'closeInstagramBtn', fn: closeInstagramModal },
    { id: 'closeIgPublishBtn', fn: closeIgPublishModal }
  ];

  closeHandlers.forEach(({ id, fn }) => {
    const btn = document.getElementById(id);
    if (btn) {
      const handleClose = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        fn();
      };
      btn.addEventListener('click', handleClose);
      btn.addEventListener('touchend', handleClose, { passive: false });
    }
  });

  // Modal Backdrop click to dismiss
  ['studioModal', 'reelModal', 'vaultModal', 'instagramModal', 'igPublishModal'].forEach(id => {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          hideModalElement(modalEl);
        }
      });
    }
  });
}

function setMobileViewMode(mode) {
  if (!elements.contentContainer) return;
  if (mode === 'feed') {
    elements.contentContainer.classList.remove('show-studio-only');
    elements.contentContainer.classList.add('show-feed-only');
    if (elements.modeSwitchFeed) elements.modeSwitchFeed.classList.add('active');
    if (elements.modeSwitchStudio) elements.modeSwitchStudio.classList.remove('active');
    if (elements.mNavNews) elements.mNavNews.classList.add('active');
    if (elements.mNavStudio) elements.mNavStudio.classList.remove('active');
  } else {
    elements.contentContainer.classList.remove('show-feed-only');
    elements.contentContainer.classList.add('show-studio-only');
    if (elements.modeSwitchStudio) elements.modeSwitchStudio.classList.add('active');
    if (elements.modeSwitchFeed) elements.modeSwitchFeed.classList.remove('active');
    if (elements.mNavStudio) elements.mNavStudio.classList.add('active');
    if (elements.mNavNews) elements.mNavNews.classList.remove('active');
  }
}

function updateTemplateSelectionUI() {
  elements.templateSelector.querySelectorAll('.template-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.template === state.activeTemplate);
  });
  elements.newsPhotoSection.style.display = (state.activeTemplate === 'news_photo') ? 'block' : 'none';
}

function updatePhotoBadge(text, type = 'ready') {
  elements.photoStatusBadge.textContent = text;
  elements.photoStatusBadge.className = 'photo-status-badge';
  if (type === 'loading') elements.photoStatusBadge.classList.add('loading');
  if (type === 'error') elements.photoStatusBadge.classList.add('error');
}

/* ==========================================================================
   IMAGE FETCHING & PROXY ENGINE
   ========================================================================== */
async function fetchArticleImage(articleUrl, force = false) {
  if (!articleUrl) return;
  if (!force && state.lastFetchedArticleUrl === articleUrl && state.currentPhotoImg) {
    return;
  }

  state.isPhotoLoading = true;
  state.lastFetchedArticleUrl = articleUrl;
  state.currentPhotoImg = null; // Clear previous photo so new article photo loads cleanly
  updatePhotoBadge('⏳ Scraping Article Photo...', 'loading');
  renderCanvas();

  try {
    const title = state.selectedArticle?.title || '';
    const res = await fetch(`/api/extract-image?url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(title)}`);
    const data = await res.json();

    if (data.success && data.proxyUrl) {
      const publisher = state.selectedArticle?.publisher || 'Publisher';
      loadExternalImage(data.proxyUrl, `${publisher} Photo`);
    } else {
      state.isPhotoLoading = false;
      updatePhotoBadge('No Photo Found (Upload/Paste)', 'error');
      state.currentPhotoImg = null;
      renderCanvas();
    }
  } catch (err) {
    state.isPhotoLoading = false;
    updatePhotoBadge('Failed to fetch photo', 'error');
    console.error('Photo fetch error:', err);
  }
}

function loadExternalImage(url, sourceLabel = 'Online Photo') {
  state.isPhotoLoading = true;
  updatePhotoBadge('Loading pixels...', 'loading');

  const proxyUrl = url.startsWith('/api/') ? url : `/api/proxy-image?url=${encodeURIComponent(url)}`;
  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    state.currentPhotoImg = img;
    state.isPhotoLoading = false;
    updatePhotoBadge(`✅ ${sourceLabel}`, 'ready');
    renderCanvas();
    showToast(`${sourceLabel} loaded onto canvas!`, 'success');
  };

  img.onerror = () => {
    state.isPhotoLoading = false;
    updatePhotoBadge('⚠️ Image Load Failed', 'error');
    showToast('Failed to load image. Try uploading a custom image.', 'error');
  };

  img.src = proxyUrl;
}

/* ==========================================================================
   NEWS FETCHING & RENDERING
   ========================================================================== */
async function loadNewsFeed() {
  elements.newsGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Fetching real-time Google News feeds via PyGNews...</p>
    </div>
  `;

  if (state.currentType === 'top') {
    elements.feedTitle.textContent = `Today's Top Stories (${state.currentCountry})`;
  } else if (state.currentType === 'topic') {
    elements.feedTitle.textContent = `${state.currentTopic} Headlines`;
  } else if (state.currentType === 'search') {
    elements.feedTitle.textContent = `Search Results: "${state.searchQuery}"`;
  }

  let apiUrl = `/api/news?type=${state.currentType}&country=${state.currentCountry}`;
  if (state.currentType === 'topic') {
    apiUrl += `&topic=${encodeURIComponent(state.currentTopic)}`;
  } else if (state.currentType === 'search') {
    apiUrl += `&q=${encodeURIComponent(state.searchQuery)}`;
  }

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    state.clusters = data.clusters || [];
    state.articles = data.articles || [];
    elements.feedCountBadge.textContent = `${state.clusters.length} Story Clusters`;
    if (elements.mModeBadge) {
      elements.mModeBadge.textContent = `${state.clusters.length}`;
    }

    renderNewsCards();
    updateTrendingTicker();

    // Auto-select first article if none selected
    if (!state.selectedArticle && state.clusters.length > 0) {
      selectArticle(state.clusters[0].main_story, false);
    }
  } catch (err) {
    elements.newsGrid.innerHTML = `
      <div class="loading-state">
        <p style="color: #f43f5e;">⚠️ Error loading feeds: ${escapeHtml(err.message)}</p>
        <button class="secondary-btn" onclick="loadNewsFeed()" style="margin-top: 12px;">Retry</button>
      </div>
    `;
    showToast('Failed to load news feed', 'error');
  }
}

function renderNewsCards() {
  if (state.clusters.length === 0) {
    elements.newsGrid.innerHTML = `
      <div class="loading-state">
        <p>No news stories found for this category or query.</p>
      </div>
    `;
    return;
  }

  elements.newsGrid.innerHTML = '';

  state.clusters.forEach((cluster) => {
    const lead = cluster.main_story;
    const related = cluster.related_coverage || [];

    const card = document.createElement('article');
    card.className = 'news-card';

    const relatedHtml = related.length > 0 ? `
      <div class="related-coverage-wrap">
        <div class="related-header">Related Coverage (${related.length} more)</div>
        <div class="related-list">
          ${related.slice(0, 3).map(r => `
            <div class="related-item">
              <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="related-link">
                ${escapeHtml(r.title)}
              </a>
              <span class="related-source">${escapeHtml(r.publisher || '')}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="news-meta-row">
        <span class="news-publisher">${escapeHtml(lead.publisher || 'Google News')}</span>
        <span class="news-date">${formatDate(lead.published_date)}</span>
      </div>
      <h2 class="news-title">${escapeHtml(lead.title)}</h2>
      ${relatedHtml}
      <div class="news-card-actions">
        <div class="card-actions-left">
          <button class="photo-meme-btn" title="Create meme using the real news photograph">
            <span>📸 Meme With Photo</span>
          </button>
          <button class="meme-this-btn" title="Create classic graphic template meme">
            <span>⚡ Graphic Meme</span>
          </button>
          <button class="reel-btn" title="Create 9:16 vertical video reel for Instagram, Shorts & TikTok">
            <span>🎬 Reel</span>
          </button>
        </div>
        <a href="${escapeHtml(lead.url)}" target="_blank" rel="noopener noreferrer" class="source-link">
          <span>Read Story</span>
          <span>↗</span>
        </a>
      </div>
    `;

    // Event Listeners for Card
    const photoBtn = card.querySelector('.photo-meme-btn');
    photoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectArticle(lead, true);
      state.activeTemplate = 'news_photo';
      updateTemplateSelectionUI();
      openStudioModal();
      fetchArticleImage(lead.url);
      fetchAiSuggestions();
    });

    const memeBtn = card.querySelector('.meme-this-btn');
    memeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectArticle(lead, false);
      state.activeTemplate = 'breaking_news';
      updateTemplateSelectionUI();
      openStudioModal();
      fetchAiSuggestions();
    });

    const reelBtn = card.querySelector('.reel-btn');
    if (reelBtn) {
      reelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectArticle(lead, false);
        openReelStudio(lead.title);
      });
    }

    card.addEventListener('click', () => {
      selectArticle(lead, false);
    });

    elements.newsGrid.appendChild(card);
  });
}

function selectArticle(article, withPhoto = false) {
  state.selectedArticle = article;
  elements.activeHeadlineText.textContent = article.title;
  elements.activeHeadlineSource.textContent = `Source: ${article.publisher || 'News Agency'}`;
  elements.activeHeadlineCategory.textContent = 'ACTIVE STORY';
  elements.memeWithPhotoBtn.disabled = false;
  elements.launchFullStudioBtn.disabled = false;
  elements.generateQuickMemeBtn.disabled = false;
  if (elements.createReelSidebarBtn) elements.createReelSidebarBtn.disabled = false;
  if (elements.autoSearchQueryInput) elements.autoSearchQueryInput.value = article.title;
  if (elements.mSelectedBadge) elements.mSelectedBadge.textContent = 'Selected';

  state.memeData.topText = 'WHEN THE NEWS DROPS:';
  state.memeData.bottomText = article.title;
  elements.topTextInput.value = state.memeData.topText;
  elements.bottomTextInput.value = state.memeData.bottomText;

  // Pre-fetch article image in background
  if (article.url && article.url !== state.lastFetchedArticleUrl) {
    fetchArticleImage(article.url);
  }
}

function updateTrendingTicker() {
  if (state.articles.length === 0) return;
  const sample = state.articles.slice(0, 5);
  elements.tickerItems.innerHTML = sample.map(a => `
    <div class="ticker-item" style="margin-bottom: 8px; cursor: pointer;" title="Click to select">
      🔥 <strong>${escapeHtml(a.publisher || 'News')}:</strong> ${escapeHtml(a.title.slice(0, 65))}...
    </div>
  `).join('');

  elements.tickerItems.querySelectorAll('.ticker-item').forEach((item, idx) => {
    item.addEventListener('click', () => {
      selectArticle(sample[idx], false);
    });
  });
}

/* ==========================================================================
   AI PUNCHLINES & SUGGESTIONS
   ========================================================================== */
async function fetchAiSuggestions() {
  if (!state.selectedArticle) return;

  elements.aiSuggestionsList.innerHTML = `
    <div class="ai-suggest-placeholder">
      <div class="spinner" style="width: 20px; height: 20px; margin: 0 auto 8px;"></div>
      ⚡ Groq AI analyzing dark comedy & deep meme angles...
    </div>
  `;

  try {
    const res = await fetch('/api/meme-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: state.selectedArticle.title,
        publisher: state.selectedArticle.publisher || '',
        category: state.currentTopic || state.currentType || '',
        vibe: state.currentVibe || 'dark'
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const angles = data.angles || [];
    if (angles.length === 0) {
      elements.aiSuggestionsList.innerHTML = '<div class="ai-suggest-placeholder">No suggestions generated.</div>';
      return;
    }

    elements.aiSuggestionsList.innerHTML = '';
    angles.forEach(angle => {
      const card = document.createElement('div');
      card.className = 'ai-card';
      const vibeBadge = angle.vibe || '⚡ Groq Angle';
      const templateName = (angle.template || 'photo_impact').replace(/_/g, ' ');
      card.innerHTML = `
        <div class="ai-card-vibe">${escapeHtml(vibeBadge)} • ${escapeHtml(templateName)}</div>
        <div class="ai-card-punchline">${escapeHtml(angle.punchline || angle.bottom_text)}</div>
        ${angle.top_text ? `<div style="font-size:11px; color:rgba(255,255,255,0.65); margin-top:3px;"><strong>Setup:</strong> ${escapeHtml(angle.top_text)}</div>` : ''}
      `;

      card.addEventListener('click', () => {
        state.memeData.topText = angle.top_text || '';
        state.memeData.bottomText = angle.bottom_text || angle.punchline || '';
        if (angle.template) state.activeTemplate = angle.template;
        if (angle.style) state.photoSubstyle = angle.style;

        elements.topTextInput.value = state.memeData.topText;
        elements.bottomTextInput.value = state.memeData.bottomText;

        updateTemplateSelectionUI();
        if (elements.photoLayoutGrid) {
          elements.photoLayoutGrid.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.substyle === state.photoSubstyle);
          });
        }

        renderCanvas();
        showToast('Applied Groq AI meme angle to canvas!', 'success');
      });

      elements.aiSuggestionsList.appendChild(card);
    });

  } catch (err) {
    elements.aiSuggestionsList.innerHTML = `<div class="ai-suggest-placeholder" style="color: #f43f5e;">Failed: ${escapeHtml(err.message)}</div>`;
  }
}

/* ==========================================================================
   MEME CANVAS RENDERING ENGINE
   ========================================================================== */
function renderCanvas() {
  const width = elements.memeCanvas.width;
  const height = elements.memeCanvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  switch (state.activeTemplate) {
    case 'news_photo':
      drawNewsPhotoTemplate(width, height);
      break;
    case 'breaking_news':
      drawBreakingNewsTemplate(width, height);
      break;
    case 'twitter_card':
      drawTwitterCardTemplate(width, height);
      break;
    case 'two_buttons':
      drawTwoButtonsTemplate(width, height);
      break;
    case 'this_is_fine':
      drawThisIsFineTemplate(width, height);
      break;
    case 'drake_style':
      drawDrakeStyleTemplate(width, height);
      break;
    case 'classic_impact':
    default:
      drawClassicImpactTemplate(width, height);
      break;
  }
}

/* ==========================================================================
   FEATURE: NEWS PHOTO MEME TEMPLATE ENGINE
   ========================================================================== */
function drawNewsPhotoTemplate(w, h) {
  const img = state.currentPhotoImg;

  if (state.photoSubstyle === 'photo_caption') {
    // Substyle 2: Reddit/Twitter Header Box Style
    const headerH = 220;

    // White Header Area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, headerH);

    // Header Text
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${Math.max(26, state.memeData.fontSize - 4)}px "Outfit", -apple-system, sans-serif`;
    ctx.textAlign = 'left';

    const headerText = state.memeData.topText || 'Nobody:';
    ctx.fillText(headerText, 36, 52);

    ctx.font = `600 ${Math.max(22, state.memeData.fontSize - 8)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#1e293b';
    wrapText(ctx, state.memeData.bottomText, 36, 100, w - 72, 34);

    // Photo Area Below Header
    const photoY = headerH;
    const photoH = h - headerH;

    if (img) {
      drawImageProp(ctx, img, 0, photoY, w, photoH, 0.5, 0.5);
      if (state.photoDarken > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${state.photoDarken / 100})`;
        ctx.fillRect(0, photoY, w, photoH);
      }
    } else {
      drawPhotoPlaceholder(0, photoY, w, photoH);
    }

    // Source watermark tag at bottom right
    drawSourceWatermark(w, h);
    return;
  }

  // Draw photo full bleed for Impact, Breaking, and Cinematic
  if (img) {
    drawImageProp(ctx, img, 0, 0, w, h, 0.5, 0.5);
    if (state.photoDarken > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${state.photoDarken / 100})`;
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    drawPhotoPlaceholder(0, 0, w, h);
  }

  if (state.photoSubstyle === 'photo_breaking') {
    // Substyle 3: Live TV Lower-Third Chyron Over News Photo
    // Top Live Watermark
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(36, 36, 95, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔴 LIVE', 83, 60);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(145, 36, 170, 36);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NEWS 24/7 SPECIAL', 158, 60);

    // Lower Third Breaking Bar
    const barY = h - 190;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, barY, w, 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Outfit", Impact, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BREAKING NEWS', 36, barY + 48);

    // Ticker Line below
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, barY + 68, w, 80);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.max(20, state.memeData.fontSize - 10)}px "Plus Jakarta Sans", sans-serif`;
    wrapText(ctx, `▶ ${state.memeData.bottomText}`, 36, barY + 115, w - 72, 30);

  } else if (state.photoSubstyle === 'photo_cinematic') {
    // Substyle 4: Cinematic Letterbox Subtitles
    const barHeight = 85;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, barHeight);
    ctx.fillRect(0, h - barHeight, w, barHeight);

    // Yellow Movie Subtitle at bottom
    ctx.fillStyle = '#facc15';
    ctx.font = `bold ${Math.max(24, state.memeData.fontSize - 4)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    wrapText(ctx, `“${state.memeData.bottomText}”`, w / 2, h - barHeight - 40, w - 100, 38);
    ctx.shadowColor = 'transparent';

  } else {
    // Substyle 1: Classic High-Contrast Impact Overlay
    ctx.font = `900 ${state.memeData.fontSize}px Impact, "Arial Black", sans-serif`;
    ctx.fillStyle = state.memeData.textColor;
    ctx.strokeStyle = state.memeData.strokeColor;
    ctx.lineWidth = 7;
    ctx.textAlign = 'center';

    // Top Impact Text
    if (state.memeData.topText) {
      drawStrokedText(ctx, state.memeData.topText.toUpperCase(), w / 2, 90, w - 80, state.memeData.fontSize * 1.25);
    }

    // Bottom Impact Text
    if (state.memeData.bottomText) {
      drawStrokedText(ctx, state.memeData.bottomText.toUpperCase(), w / 2, h - 140, w - 80, state.memeData.fontSize * 1.25);
    }
  }

  drawSourceWatermark(w, h);
}

function drawPhotoPlaceholder(x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#090a10');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  const publisher = state.selectedArticle?.publisher || 'News Source';

  ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 - 25, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📸', x + w / 2, y + h / 2 - 12);

  if (state.isPhotoLoading) {
    ctx.font = 'bold 22px "Outfit", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Scraping Photo from ${publisher}...`, x + w / 2, y + h / 2 + 50);

    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Decoding article link and extracting publisher photography...', x + w / 2, y + h / 2 + 82);
  } else {
    ctx.font = 'bold 20px "Outfit", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('No Lead Photo on Publisher Page', x + w / 2, y + h / 2 + 50);

    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Click "📁 Upload Image" to use any screenshot or custom photo', x + w / 2, y + h / 2 + 82);
  }
}

function drawSourceWatermark(w, h) {
  const publisher = state.selectedArticle?.publisher || 'TODAY MEMER';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`⚡ ${publisher.toUpperCase()}`, w - 24, h - 16);
}

/**
 * Draw image or video maintaining aspect ratio and centering (cover mode)
 */
function drawImageProp(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
  if (!img) return;
  const iw = img.videoWidth || img.naturalWidth || img.width;
  const ih = img.videoHeight || img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const r = Math.min(w / iw, h / ih);
  let nw = iw * r;
  let nh = ih * r;
  let cx, cy, cw, ch, ar = 1;

  if (nw < w) ar = w / nw;
  if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
  nw *= ar;
  nh *= ar;

  cw = iw / (nw / w);
  ch = ih / (nh / h);

  cx = (iw - cw) * offsetX;
  cy = (ih - ch) * offsetY;

  if (cx < 0) cx = 0;
  if (cy < 0) cy = 0;
  if (cw > iw) cw = iw;
  if (ch > ih) ch = ih;

  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

/* Template: Breaking News TV Broadcast */
function drawBreakingNewsTemplate(w, h) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w);
  grad.addColorStop(0, '#1e1b4b');
  grad.addColorStop(0.6, '#0f172a');
  grad.addColorStop(1, '#030712');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 40; x < w; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Live broadcast watermark
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(40, 40, 90, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LIVE', 85, 64);

  // Logo Badge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ NEWS 24/7', 150, 64);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '16px "Space Grotesk", monospace';
  ctx.fillText(new Date().toLocaleTimeString(), w - 40, 64);

  // Central graphic container
  const boxY = 130;
  const boxH = 430;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(40, boxY, w - 80, boxH);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, boxY, w - 80, boxH);

  // Center Headline
  ctx.fillStyle = state.memeData.textColor;
  ctx.font = `bold ${state.memeData.fontSize}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, state.memeData.bottomText, w / 2, boxY + 140, w - 160, state.memeData.fontSize * 1.35);

  // Bottom Breaking News Red Bar
  const bannerY = h - 210;
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, bannerY, w, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BREAKING NEWS', 40, bannerY + 48);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, bannerY + 70, w, 65);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  const tickerText = state.memeData.topText || 'SPECIAL REPORT: LIVE DETAILS DEVELOPING';
  ctx.fillText(`▶ ${tickerText}`, 40, bannerY + 112);
}

/* Template: Viral Social Media Post / Tweet */
function drawTwitterCardTemplate(w, h) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  const cardX = 40;
  const cardY = 50;
  const cardW = w - 80;
  const cardH = h - 100;

  ctx.fillStyle = '#0f141c';
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  ctx.strokeStyle = '#2f3336';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.stroke();

  // Avatar Circle
  ctx.beginPath();
  ctx.arc(cardX + 50, cardY + 55, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#8b5cf6';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('M', cardX + 50, cardY + 63);

  ctx.textAlign = 'left';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#e7e9ea';
  ctx.fillText(state.memeData.topText || 'Today In Reality', cardX + 96, cardY + 50);

  ctx.fillStyle = '#1d9bf0';
  ctx.beginPath();
  ctx.arc(cardX + 290, cardY + 43, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓', cardX + 290, cardY + 47);

  ctx.textAlign = 'left';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#71767b';
  ctx.fillText('@today_memer · 2m', cardX + 96, cardY + 74);

  ctx.fillStyle = '#ffffff';
  ctx.font = `500 ${Math.max(26, state.memeData.fontSize - 6)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, state.memeData.bottomText, cardX + 40, cardY + 160, cardW - 80, 42);

  const statsY = cardY + cardH - 70;
  ctx.strokeStyle = '#2f3336';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, statsY - 20);
  ctx.lineTo(cardX + cardW - 40, statsY - 20);
  ctx.stroke();

  ctx.fillStyle = '#71767b';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('💬 4,821    🔄 28.4K    ❤️ 142K    📊 1.8M', cardX + 40, statsY + 16);
}

/* Template: Classic Impact Meme */
function drawClassicImpactTemplate(w, h) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1e1b4b');
  grad.addColorStop(0.5, '#312e81');
  grad.addColorStop(1, '#090a10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 40;
  ctx.strokeRect(0, 0, w, h);

  ctx.font = `900 ${state.memeData.fontSize}px Impact, "Arial Black", sans-serif`;
  ctx.fillStyle = state.memeData.textColor;
  ctx.strokeStyle = state.memeData.strokeColor;
  ctx.lineWidth = 6;
  ctx.textAlign = 'center';
  drawStrokedText(ctx, (state.memeData.topText || '').toUpperCase(), w / 2, 100, w - 80, state.memeData.fontSize * 1.2);
  drawStrokedText(ctx, (state.memeData.bottomText || '').toUpperCase(), w / 2, h - 180, w - 80, state.memeData.fontSize * 1.2);
}

/* Template: Two Buttons Dilemma */
function drawTwoButtonsTemplate(w, h) {
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 28px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE HARDEST DECISION EVER', w / 2, 60);

  const b1X = 60, bY = 120, bW = 310, bH = 260;
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, b1X, bY, bW, bH, 16);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  wrapText(ctx, state.memeData.topText || 'Fix the actual problem', b1X + bW / 2, bY + 110, bW - 40, 30);

  const b2X = 430;
  ctx.fillStyle = '#3b82f6';
  roundRect(ctx, b2X, bY, bW, bH, 16);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, state.memeData.bottomText.slice(0, 80) || 'Panic and write another headline', b2X + bW / 2, bY + 110, bW - 40, 30);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 420, w, h - 420);

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(w / 2, 540, 70, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(w / 2 - 25, 530, 8, 0, Math.PI * 2);
  ctx.arc(w / 2 + 25, 530, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(w / 2 + 45, 500, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Sweating intensely trying to choose...', w / 2, 670);
}

/* Template: This Is Fine */
function drawThisIsFineTemplate(w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.5, '#dc2626');
  grad.addColorStop(1, '#450a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(60 + i * 80, 260 + (i % 2) * 40, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 460, w, h - 460);

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 160, 80, w - 320, 150, 20);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.font = '900 32px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THIS IS FINE.', w / 2, 140);
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Everything is totally under control.', w / 2, 180);

  ctx.fillStyle = '#fef08a';
  ctx.font = `bold ${Math.max(22, state.memeData.fontSize - 6)}px "Outfit", sans-serif`;
  wrapText(ctx, state.memeData.bottomText, w / 2, 540, w - 120, 36);
}

/* Template: Drake Approval Style */
function drawDrakeStyleTemplate(w, h) {
  const halfH = h / 2;

  ctx.fillStyle = '#450a0a';
  ctx.fillRect(0, 0, w, halfH);
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🙅‍♂️ NAH', 120, halfH / 2);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${state.memeData.fontSize}px "Outfit", sans-serif`;
  wrapText(ctx, state.memeData.topText || 'Solving actual problems in society', 480, halfH / 2 - 20, w - 300, 40);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, halfH - 3, w, 6);

  ctx.fillStyle = '#064e3b';
  ctx.fillRect(0, halfH, w, halfH);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👉 YEAH', 120, halfH + halfH / 2);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${state.memeData.fontSize}px "Outfit", sans-serif`;
  wrapText(ctx, state.memeData.bottomText, 480, halfH + halfH / 2 - 20, w - 300, 40);
}

/* Helper Text Drawing Functions */
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  if (!text) return;
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line.trim(), x, y);
}

function drawStrokedText(context, text, x, y, maxWidth, lineHeight) {
  if (!text) return;
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.strokeText(line.trim(), x, y);
      context.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.strokeText(line.trim(), x, y);
  context.fillText(line.trim(), x, y);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/* ==========================================================================
   MODAL & EXPORT HANDLERS
   ========================================================================== */
function showModalElement(modal) {
  if (!modal) return;
  modal.classList.remove('is-hidden');
  modal.classList.add('is-open');
  modal.style.setProperty('display', 'flex', 'important');
  document.body.style.overflow = 'hidden';
}

function hideModalElement(modal) {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.classList.add('is-hidden');
  modal.style.setProperty('display', 'none', 'important');
  const anyOpen = document.querySelector('.modal-backdrop.is-open:not(.is-hidden)');
  if (!anyOpen) {
    document.body.style.overflow = '';
  }
}

function openStudioModal() {
  showModalElement(elements.studioModal);
  updateTemplateSelectionUI();
  renderCanvas();
}

function closeStudioModal() {
  hideModalElement(elements.studioModal);
}

function downloadMeme() {
  const link = document.createElement('a');
  link.download = `ai-memer-${Date.now()}.png`;
  link.href = elements.memeCanvas.toDataURL('image/png');
  link.click();
  showToast('Meme image downloaded successfully!', 'success');
}

async function copyMemeToClipboard() {
  try {
    elements.memeCanvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Failed to create image blob');
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('Meme copied to clipboard!', 'success');
    });
  } catch (err) {
    showToast('Clipboard error: Please use download button', 'error');
  }
}

function saveMemeToVault() {
  const dataUrl = elements.memeCanvas.toDataURL('image/png');
  const memeItem = {
    id: Date.now(),
    image: dataUrl,
    headline: state.memeData.bottomText,
    date: new Date().toLocaleDateString()
  };

  state.savedVault.unshift(memeItem);
  if (state.savedVault.length > 50) state.savedVault.pop();

  localStorage.setItem('ai_memer_vault', JSON.stringify(state.savedVault));
  updateVaultCount();
  showToast('Meme saved to your Vault! ⭐', 'success');
}

function openVaultModal() {
  renderVaultGrid();
  showModalElement(elements.vaultModal);
}

function closeVaultModal() {
  hideModalElement(elements.vaultModal);
}

function updateVaultCount() {
  const count = state.savedVault.length;
  if (elements.vaultCount) elements.vaultCount.textContent = count;
  if (elements.mVaultCountBadge) elements.mVaultCountBadge.textContent = count;
}

function renderVaultGrid() {
  if (state.savedVault.length === 0) {
    elements.vaultGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        No saved memes yet. Generate some hilarious memes and click "Save to Vault"!
      </div>
    `;
    return;
  }

  elements.vaultGrid.innerHTML = '';
  state.savedVault.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'vault-card';
    card.innerHTML = `
      <img src="${item.image}" alt="Meme" class="vault-card-img">
      <div class="vault-card-info">
        <span class="vault-time">${item.date}</span>
        <div class="vault-card-actions">
          <button class="mini-icon-btn download-btn" title="Download">📥</button>
          <button class="mini-icon-btn delete-btn" title="Delete" style="color: #f43f5e;">🗑️</button>
        </div>
      </div>
    `;

    card.querySelector('.download-btn').addEventListener('click', () => {
      const a = document.createElement('a');
      a.download = `vault-meme-${item.id}.png`;
      a.href = item.image;
      a.click();
    });

    card.querySelector('.delete-btn').addEventListener('click', () => {
      state.savedVault.splice(index, 1);
      localStorage.setItem('ai_memer_vault', JSON.stringify(state.savedVault));
      updateVaultCount();
      renderVaultGrid();
      showToast('Meme removed from vault', 'success');
    });

    elements.vaultGrid.appendChild(card);
  });
}

/* ==========================================================================
   UTILITY FUNCTIONS
   ========================================================================== */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffHours = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours <= 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

/* ==========================================================================
   AI REEL STUDIO & 9:16 VERTICAL VIDEO CREATOR ENGINE
   ========================================================================== */

function setupReelEventListeners() {
  const modal = elements.reelModal || document.getElementById('reelModal');
  const navBtn = elements.openReelStudioNavBtn || document.getElementById('openReelStudioNavBtn');
  const sidebarBtn = elements.createReelSidebarBtn || document.getElementById('createReelSidebarBtn');
  const closeBtn = elements.closeReelBtn || document.getElementById('closeReelBtn');

  // 1. Open/Close Reel Studio Modal
  if (navBtn) {
    navBtn.disabled = false;
    navBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openReelStudio(state.selectedArticle?.title || '');
    });
  }

  if (sidebarBtn) {
    sidebarBtn.disabled = false;
    sidebarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openReelStudio(state.selectedArticle?.title || '');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeReelStudio();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeReelStudio();
    });
  }

  // 2. Video Player Overlay Controls
  if (elements.togglePlayBtn && elements.reelVideoSource) {
    elements.togglePlayBtn.addEventListener('click', () => {
      if (elements.reelVideoSource.paused) {
        elements.reelVideoSource.play().catch(e => console.log('Play err:', e));
        elements.togglePlayBtn.textContent = '⏸️';
        reelState.isPlaying = true;
      } else {
        elements.reelVideoSource.pause();
        elements.togglePlayBtn.textContent = '▶️';
        reelState.isPlaying = false;
      }
    });
  }

  if (elements.toggleMuteBtn && elements.reelVideoSource) {
    elements.toggleMuteBtn.addEventListener('click', () => {
      reelState.isMuted = !reelState.isMuted;
      elements.reelVideoSource.muted = reelState.isMuted;
      elements.toggleMuteBtn.textContent = reelState.isMuted ? '🔇' : '🔊';
      showToast(reelState.isMuted ? 'Reel muted' : 'Reel sound active 🔊', 'info');
    });
  }

  if (elements.videoSeekBar && elements.reelVideoSource) {
    elements.videoSeekBar.addEventListener('input', (e) => {
      if (elements.reelVideoSource.duration) {
        elements.reelVideoSource.currentTime = (parseFloat(e.target.value) / 100) * elements.reelVideoSource.duration;
      }
    });

    elements.reelVideoSource.addEventListener('timeupdate', () => {
      if (elements.reelVideoSource.duration) {
        const pct = (elements.reelVideoSource.currentTime / elements.reelVideoSource.duration) * 100;
        elements.videoSeekBar.value = pct;
        
        const curM = Math.floor(elements.reelVideoSource.currentTime / 60);
        const curS = Math.floor(elements.reelVideoSource.currentTime % 60).toString().padStart(2, '0');
        const durM = Math.floor(elements.reelVideoSource.duration / 60);
        const durS = Math.floor(elements.reelVideoSource.duration % 60).toString().padStart(2, '0');
        if (elements.videoTimeDisplay) {
          elements.videoTimeDisplay.textContent = `${curM}:${curS} / ${durM}:${durS}`;
        }
      }
    });

    elements.reelVideoSource.addEventListener('play', () => {
      if (elements.togglePlayBtn) elements.togglePlayBtn.textContent = '⏸️';
      reelState.isPlaying = true;
    });

    elements.reelVideoSource.addEventListener('pause', () => {
      if (elements.togglePlayBtn) elements.togglePlayBtn.textContent = '▶️';
      reelState.isPlaying = false;
    });
  }

  // 3. Source Tab Switching
  if (elements.videoSourceTabs) {
    elements.videoSourceTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.vtab-btn');
      if (!btn) return;
      const tab = btn.dataset.vtab;
      reelState.activeVTab = tab;

      elements.videoSourceTabs.querySelectorAll('.vtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tabs = {
        paste: elements.vtabPaste,
        upload: elements.vtabUpload,
        autosearch: elements.vtabAutoSearch,
        preset: elements.vtabPreset
      };

      Object.entries(tabs).forEach(([k, el]) => {
        if (el) el.style.display = (k === tab) ? 'block' : 'none';
      });
    });
  }

  // 4. Feature 1: Paste Instagram Reel / YouTube Shorts URL
  if (elements.fetchReelUrlBtn) {
    elements.fetchReelUrlBtn.addEventListener('click', fetchReelFromUrl);
  }
  if (elements.reelUrlInput) {
    elements.reelUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') fetchReelFromUrl();
    });
  }

  // 5. Feature 2: Local Video File Upload & Dropzone
  if (elements.reelVideoFileInput) {
    elements.reelVideoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleVideoFileSelected(file);
    });

    const dropzone = document.querySelector('.upload-dropzone');
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '';
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleVideoFileSelected(e.dataTransfer.files[0]);
        }
      });
    }
  }

  // 6. Feature 3: Auto-Search Related Video Footage on Internet
  if (elements.autoSearchVideoBtn) {
    elements.autoSearchVideoBtn.addEventListener('click', fetchRelatedVideoFromInternet);
  }
  if (elements.autoSearchQueryInput) {
    elements.autoSearchQueryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') fetchRelatedVideoFromInternet();
    });
  }

  // 7. Feature 4: Presets
  const presetButtons = document.querySelectorAll('.preset-vid-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filename = btn.dataset.preset || 'sample_reel.mp4';
      loadVideoSource(`/api/serve-video?name=${encodeURIComponent(filename)}`, 'Breaking News Background Loop');
    });
  });

  // 8. Reel Layout Selection (4 Formats)
  if (elements.reelLayoutGrid) {
    elements.reelLayoutGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.layout-btn');
      if (!btn) return;
      elements.reelLayoutGrid.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reelState.layout = btn.dataset.reellayout;
      showToast(`Selected format: ${btn.textContent.trim()}`, 'info');
    });
  }

  // 9. Text & Dimming Inputs
  if (elements.reelTopHookInput) {
    elements.reelTopHookInput.addEventListener('input', (e) => {
      reelState.topHook = e.target.value;
    });
  }

  if (elements.reelCaptionInput) {
    elements.reelCaptionInput.addEventListener('input', (e) => {
      reelState.caption = e.target.value;
    });
  }

  if (elements.reelDarkenSlider) {
    elements.reelDarkenSlider.addEventListener('input', (e) => {
      reelState.darken = parseInt(e.target.value, 10);
      if (elements.reelDarkenVal) elements.reelDarkenVal.textContent = reelState.darken;
    });
  }

  // 10. AI Viral Hooks & Vibe Pills
  if (elements.reelVibePills) {
    elements.reelVibePills.addEventListener('click', (e) => {
      const btn = e.target.closest('.ai-vibe-pill');
      if (!btn) return;
      elements.reelVibePills.querySelectorAll('.ai-vibe-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reelState.vibe = btn.dataset.vibe || 'dark';
      fetchReelAiHooks();
    });
  }

  if (elements.regenReelHooksBtn) {
    elements.regenReelHooksBtn.addEventListener('click', fetchReelAiHooks);
  }

  // 11. Reel Export (MP4 Download) & Vault
  if (elements.exportReelBtn) {
    elements.exportReelBtn.addEventListener('click', exportReelVideo);
  }

  if (elements.saveReelVaultBtn) {
    elements.saveReelVaultBtn.addEventListener('click', saveReelToVault);
  }
}

function setVideoStatus(text, type = 'ready') {
  if (!elements.videoStatusLabel) return;
  elements.videoStatusLabel.textContent = text;
  if (elements.videoStatusIndicator) {
    elements.videoStatusIndicator.className = 'video-status-indicator ' + (type === 'loading' ? 'loading' : type === 'error' ? 'error' : '');
  }
}

function loadVideoSource(src, label = 'Video') {
  if (!elements.reelVideoSource) return;
  setVideoStatus(`Loading ${label}...`, 'loading');
  elements.reelVideoSource.src = src;
  elements.reelVideoSource.load();
  elements.reelVideoSource.muted = reelState.isMuted;

  elements.reelVideoSource.onloadeddata = () => {
    reelState.videoReady = true;
    setVideoStatus(`✅ ${label} Ready!`, 'ready');
    elements.reelVideoSource.play().then(() => {
      reelState.isPlaying = true;
      if (elements.togglePlayBtn) elements.togglePlayBtn.textContent = '⏸️';
    }).catch(err => {
      console.log('Autoplay handled:', err);
    });
  };

  elements.reelVideoSource.onerror = () => {
    setVideoStatus(`⚠️ Video load failed`, 'error');
    showToast('Failed to load video stream', 'error');
  };
}

// 1. Fetch Instagram Reel / YouTube Shorts URL
async function fetchReelFromUrl() {
  const url = elements.reelUrlInput.value.trim();
  if (!url) {
    showToast('Please paste an Instagram Reel, YouTube Shorts, or direct video URL', 'error');
    return;
  }

  setVideoStatus('⏳ Downloading Instagram Reel/Video via yt-dlp...', 'loading');
  if (elements.fetchReelUrlBtn) {
    elements.fetchReelUrlBtn.disabled = true;
    elements.fetchReelUrlBtn.textContent = 'Downloading...';
  }

  try {
    const res = await fetch('/api/fetch-reel-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'url', url })
    });
    const data = await res.json();

    if (data.success && data.videoUrl) {
      loadVideoSource(data.videoUrl, data.title || 'Instagram Reel');
      showToast('🎬 Video fetched & loaded into Reel Studio!', 'success');
    } else {
      throw new Error(data.error || 'Failed to download video from URL');
    }
  } catch (err) {
    console.error('Fetch Reel error:', err);
    setVideoStatus(`⚠️ ${err.message}`, 'error');
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    if (elements.fetchReelUrlBtn) {
      elements.fetchReelUrlBtn.disabled = false;
      elements.fetchReelUrlBtn.textContent = 'Fetch Video';
    }
  }
}

// 2. Handle Local Video File Upload
function handleVideoFileSelected(file) {
  if (!file) return;
  if (!file.type.startsWith('video/')) {
    showToast('Please select a valid video file (MP4, WebM, MOV)', 'error');
    return;
  }

  const localUrl = URL.createObjectURL(file);
  loadVideoSource(localUrl, file.name);
  showToast(`📁 Local video "${file.name}" loaded!`, 'success');

  // Background upload to server
  const formData = new FormData();
  formData.append('video', file);
  fetch('/api/upload-video', {
    method: 'POST',
    body: formData
  }).then(r => r.json()).then(data => {
    if (data.success) {
      console.log('Video saved on server:', data.videoUrl);
    }
  }).catch(err => console.log('Upload backup note:', err));
}

// 3. Auto-Fetch Related Video from Internet
async function fetchRelatedVideoFromInternet() {
  let query = elements.autoSearchQueryInput.value.trim();
  if (!query && state.selectedArticle) {
    query = state.selectedArticle.title;
    elements.autoSearchQueryInput.value = query;
  }
  if (!query) {
    showToast('Enter a headline or topic to search video footage', 'error');
    return;
  }

  setVideoStatus(`🔍 Searching Internet for related video footage...`, 'loading');
  if (elements.autoSearchVideoBtn) {
    elements.autoSearchVideoBtn.disabled = true;
    elements.autoSearchVideoBtn.textContent = 'Searching...';
  }

  try {
    const res = await fetch('/api/fetch-reel-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'search', query })
    });
    const data = await res.json();

    if (data.success && data.videoUrl) {
      loadVideoSource(data.videoUrl, data.title || 'Related Video Footage');
      showToast('✨ Found and downloaded related video footage!', 'success');
    } else {
      throw new Error(data.error || 'No video footage found for this query');
    }
  } catch (err) {
    console.error('Auto-fetch video error:', err);
    setVideoStatus(`⚠️ ${err.message}`, 'error');
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    if (elements.autoSearchVideoBtn) {
      elements.autoSearchVideoBtn.disabled = false;
      elements.autoSearchVideoBtn.textContent = 'Search Internet';
    }
  }
}

// 4. AI Viral Hooks Generator
async function fetchReelAiHooks() {
  if (!elements.reelHooksList) return;
  const headline = state.selectedArticle?.title || reelState.caption || 'Today\'s Major Headline';
  const publisher = state.selectedArticle?.publisher || 'News Agency';
  const vibe = reelState.vibe || 'dark';

  elements.reelHooksList.innerHTML = `<div class="ai-suggest-placeholder">
    <div class="spinner" style="width: 20px; height: 20px; margin: 0 auto 8px;"></div>
    ⚡ Groq AI cooking viral 9:16 Reel hooks...
  </div>`;

  try {
    const res = await fetch('/api/reel-hooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: headline,
        publisher: publisher,
        category: state.currentTopic || state.currentType || '',
        vibe: vibe
      })
    });
    const data = await res.json();

    if (data.hooks && data.hooks.length > 0) {
      elements.reelHooksList.innerHTML = '';
      data.hooks.forEach(item => {
        const card = document.createElement('div');
        card.className = 'ai-suggest-card';
        const badge = item.vibe || '🔥 VIRAL REEL HOOK';
        const formatName = (item.layout || 'reel_split').replace('reel_', '');
        card.innerHTML = `
          <div class="suggest-angle-badge">${escapeHtml(badge)} • ${escapeHtml(formatName.toUpperCase())}</div>
          <div class="suggest-headline">"${escapeHtml(item.top_hook)}"</div>
          <div class="suggest-punchline">${escapeHtml(item.caption)}</div>
        `;

        card.addEventListener('click', () => {
          reelState.topHook = item.top_hook;
          reelState.caption = item.caption;
          if (item.layout) {
            reelState.layout = item.layout;
            if (elements.reelLayoutGrid) {
              elements.reelLayoutGrid.querySelectorAll('.layout-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.reellayout === item.layout);
              });
            }
          }
          if (elements.reelTopHookInput) elements.reelTopHookInput.value = item.top_hook;
          if (elements.reelCaptionInput) elements.reelCaptionInput.value = item.caption;
          showToast('Applied Groq viral hook to Reel!', 'success');
        });

        elements.reelHooksList.appendChild(card);
      });
    } else {
      elements.reelHooksList.innerHTML = `<div class="ai-suggest-placeholder">Click to generate hooks.</div>`;
    }
  } catch (err) {
    console.error('Reel hooks err:', err);
    elements.reelHooksList.innerHTML = `<div class="ai-suggest-placeholder">Click "Regenerate" to try again.</div>`;
  }
}

// 5. Open & Close Reel Studio Modal
function openReelStudio(prefilledHeadline = '') {
  const modal = elements.reelModal || document.getElementById('reelModal');
  if (!modal) {
    console.error('Reel modal element not found!');
    return;
  }

  const headline = prefilledHeadline || state.selectedArticle?.title || '';
  if (headline) {
    reelState.caption = headline;
    const captionInput = elements.reelCaptionInput || document.getElementById('reelCaptionInput');
    if (captionInput) captionInput.value = headline;
    const searchInput = elements.autoSearchQueryInput || document.getElementById('autoSearchQueryInput');
    if (searchInput) searchInput.value = headline;
  }

  const topHookInput = elements.reelTopHookInput || document.getElementById('reelTopHookInput');
  if (topHookInput && !topHookInput.value) {
    topHookInput.value = reelState.topHook;
  }

  // Display 9:16 modal
  showModalElement(modal);

  // Ensure video element has a source
  const vid = elements.reelVideoSource || document.getElementById('reelVideoSource');
  if (vid) {
    if (!vid.src || vid.src === window.location.href || vid.src.endsWith('/')) {
      loadVideoSource('/api/serve-video?name=sample_reel.mp4', 'Sample Breaking Loop');
    } else {
      vid.muted = reelState.isMuted;
      vid.play().catch(e => console.log('Autoplay handled:', e));
    }
  }

  // Start continuous 60fps render loop
  startReelAnimationLoop();

  // Load hooks
  fetchReelAiHooks();
}

function closeReelStudio() {
  const modal = elements.reelModal || document.getElementById('reelModal');
  if (modal) hideModalElement(modal);

  const vid = elements.reelVideoSource || document.getElementById('reelVideoSource');
  if (vid) {
    vid.pause();
    reelState.isPlaying = false;
  }

  if (reelState.animFrameId) {
    cancelAnimationFrame(reelState.animFrameId);
    reelState.animFrameId = null;
  }
}

// Expose globally so onclick in HTML always works
window.openReelStudio = openReelStudio;
window.closeReelStudio = closeReelStudio;

function startReelAnimationLoop() {
  if (reelState.animFrameId) {
    cancelAnimationFrame(reelState.animFrameId);
  }

  function loop() {
    if (elements.reelModal && elements.reelModal.style.display !== 'none') {
      renderReelCanvasFrame();
      reelState.animFrameId = requestAnimationFrame(loop);
    }
  }
  reelState.animFrameId = requestAnimationFrame(loop);
}

// 6. Reel Canvas 9:16 Render Engine
function renderReelCanvasFrame() {
  if (!reelCtx || !elements.reelCanvas) return;
  const w = elements.reelCanvas.width;
  const h = elements.reelCanvas.height;
  const vid = elements.reelVideoSource;

  // Clear canvas
  reelCtx.clearRect(0, 0, w, h);

  const topHook = reelState.topHook || 'BREAKING UPDATE:';
  const caption = reelState.caption || state.selectedArticle?.title || 'Developing news story unfolding now';
  const publisher = state.selectedArticle?.publisher || 'GLOBAL NEWS';
  const hasVideo = vid && vid.readyState >= 2;

  switch (reelState.layout) {
    case 'reel_split':
      drawReelSplitLayout(reelCtx, w, h, vid, hasVideo, topHook, caption, publisher, false);
      break;
    case 'reel_chyron':
      drawReelChyronLayout(reelCtx, w, h, vid, hasVideo, topHook, caption, publisher, false);
      break;
    case 'reel_glass_card':
      drawReelGlassCardLayout(reelCtx, w, h, vid, hasVideo, topHook, caption, publisher, false);
      break;
    case 'reel_impact':
    default:
      drawReelImpactLayout(reelCtx, w, h, vid, hasVideo, topHook, caption, false);
      break;
  }

  // Modern bottom progress bar line
  if (hasVideo && vid.duration) {
    const progress = vid.currentTime / vid.duration;
    reelCtx.fillStyle = '#ec4899';
    reelCtx.fillRect(0, h - 8, w * progress, 8);
  }
}

/* Layout 1: Split-Screen News Card (Top White Card, Bottom Video) */
function drawReelSplitLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const cardH = 510;

  // 1. Top Card Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, cardH);

  // Top Tag & Publisher Row
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, 40, 48, 175, 34, 17);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔴 BREAKING NEWS', 127, 71);

  ctx.fillStyle = '#f1f5f9';
  roundRect(ctx, 225, 48, 190, 34, 17);
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`⚡ ${publisher.slice(0, 16).toUpperCase()}`, 320, 71);

  // Top Hook (Bold dark lead)
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 38px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, topHook, 40, 140, w - 80, 46);

  // Caption (Secondary explanation)
  ctx.fillStyle = '#334155';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, caption, 40, 290, w - 80, 36);

  // 2. Sleek Divider
  const grad = ctx.createLinearGradient(0, cardH - 4, w, cardH + 4);
  grad.addColorStop(0, '#f43f5e');
  grad.addColorStop(0.5, '#8b5cf6');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, cardH - 2, w, 4);

  // 3. Bottom Video Section
  const videoY = cardH + 2;
  const videoH = h - videoY;

  if (!overlayOnly) {
    if (hasVideo) {
      drawImageProp(ctx, vid, 0, videoY, w, videoH, 0.5, 0.5);
      if (reelState.darken > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${reelState.darken / 100})`;
        ctx.fillRect(0, videoY, w, videoH);
      }
    } else {
      drawVideoPlaceholder(ctx, 0, videoY, w, videoH);
    }
  }
}

/* Layout 2: TV Chyron Lower-Third (Full Video, Live Badge, Lower-Third Bar & Ticker) */
function drawReelChyronLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;

  // Full screen video
  if (!overlayOnly) {
    if (hasVideo) {
      drawImageProp(ctx, vid, 0, 0, w, h, 0.5, 0.5);
      if (reelState.darken > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${reelState.darken / 100})`;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      drawVideoPlaceholder(ctx, 0, 0, w, h);
    }
  }

  // Top Live Watermark
  ctx.fillStyle = '#dc2626';
  roundRect(ctx, 40, 60, 110, 38, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 17px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔴 LIVE', 95, 85);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, 160, 60, 200, 38, 8);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('GLOBAL REEL FEED', 175, 85);

  // Top Hook Overlay with Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  wrapText(ctx, topHook, w / 2, 170, w - 80, 44);
  ctx.shadowColor = 'transparent';

  // Lower Third Chyron
  const chyronY = 980;

  // Red Header Bar
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, chyronY, w, 56);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 32px "Outfit", Impact, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ BREAKING NEWS', 40, chyronY + 40);

  // Navy Headline Container
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fillRect(0, chyronY + 56, w, 150);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, caption, 40, chyronY + 105, w - 80, 36);

  // Animated Scrolling Bottom Ticker
  const tickerY = chyronY + 206;
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, tickerY, w, 50);

  reelState.tickerOffset = (reelState.tickerOffset + 2) % 1500;
  const tickerText = `🚨 DEVELOPING STORY • ${caption} • LIVE WORLD BROADCAST • FOLLOW FOR MORE REELS 🚨`;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(tickerText, 40 - (reelState.tickerOffset % 800), tickerY + 32);
}

/* Layout 3: POV Floating Frosted Glass Card */
function drawReelGlassCardLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;

  // Full screen video
  if (!overlayOnly) {
    if (hasVideo) {
      drawImageProp(ctx, vid, 0, 0, w, h, 0.5, 0.5);
      if (reelState.darken > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${reelState.darken / 100})`;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      drawVideoPlaceholder(ctx, 0, 0, w, h);
    }
  }

  // Floating Glass Card
  const cardX = 40;
  const cardY = 320;
  const cardW = w - 80;
  const cardH = 560;

  // Glass backdrop
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.stroke();

  // Profile Header Row
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(cardX + 45, cardY + 50, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📰', cardX + 45, cardY + 58);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('@TodayInNews', cardX + 85, cardY + 48);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('✓ Verified', cardX + 85, cardY + 70);

  // Top Hook
  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 30px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, topHook, cardX + 35, cardY + 130, cardW - 70, 38);

  // Main Caption Quote
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, `“${caption}”`, cardX + 35, cardY + 240, cardW - 70, 40);

  // Engagement stats footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(cardX + 25, cardY + cardH - 70, cardW - 50, 1);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('❤️ 248.5K     💬 14.2K     🔁 58.1K     🔖 92.4K', cardX + 35, cardY + cardH - 30);
}

/* Layout 4: Classic Impact Meme Overlay */
function drawReelImpactLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;

  // Full screen video
  if (!overlayOnly) {
    if (hasVideo) {
      drawImageProp(ctx, vid, 0, 0, w, h, 0.5, 0.5);
      if (reelState.darken > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${reelState.darken / 100})`;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      drawVideoPlaceholder(ctx, 0, 0, w, h);
    }
  }

  // Classic Bold Stroked Impact Text
  ctx.font = '900 52px Impact, "Arial Black", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 10;
  ctx.textAlign = 'center';

  if (topHook) {
    drawStrokedText(ctx, topHook.toUpperCase(), w / 2, 140, w - 80, 60);
  }

  if (caption) {
    ctx.font = '900 44px Impact, "Arial Black", sans-serif';
    drawStrokedText(ctx, caption.toUpperCase(), w / 2, 1140, w - 80, 52);
  }
}

function drawVideoPlaceholder(targetCtx, x, y, w, h) {
  const ctx = targetCtx || reelCtx;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#090d16');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#05070c');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 - 30, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎬', x + w / 2, y + h / 2 - 18);

  ctx.font = 'bold 24px "Outfit", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Loading 9:16 Video...', x + w / 2, y + h / 2 + 50);

  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Paste Reel URL, upload file, or auto-fetch', x + w / 2, y + h / 2 + 82);
}

// Generate transparent overlay PNG of custom graphics (used for FFmpeg burning into video)
function getReelOverlayDataUrl() {
  const w = 720;
  const h = 1280;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const ctx = offCanvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const topHook = reelState.topHook || 'BREAKING UPDATE:';
  const caption = reelState.caption || state.selectedArticle?.title || 'Developing news story unfolding now';
  const publisher = state.selectedArticle?.publisher || 'GLOBAL NEWS';

  switch (reelState.layout) {
    case 'reel_split':
      drawReelSplitLayout(ctx, w, h, null, false, topHook, caption, publisher, true);
      break;
    case 'reel_chyron':
      drawReelChyronLayout(ctx, w, h, null, false, topHook, caption, publisher, true);
      break;
    case 'reel_glass_card':
      drawReelGlassCardLayout(ctx, w, h, null, false, topHook, caption, publisher, true);
      break;
    case 'reel_impact':
    default:
      drawReelImpactLayout(ctx, w, h, null, false, topHook, caption, true);
      break;
  }
  return offCanvas.toDataURL('image/png');
}

// 7. Export Reel to MP4 Video (High-definition Server Composite)
async function exportReelVideo() {
  if (reelState.isExporting) return;
  reelState.isExporting = true;
  elements.exportProgressBar.style.display = 'block';
  elements.exportProgressFill.style.width = '25%';
  elements.exportProgressText.textContent = 'Rendering 9:16 Reel with custom layout...';
  elements.exportReelBtn.disabled = true;

  try {
    let videoName = 'sample_reel.mp4';
    if (elements.reelVideoSource && elements.reelVideoSource.src) {
      const match = elements.reelVideoSource.src.match(/name=([^&]+)/);
      if (match) videoName = decodeURIComponent(match[1]);
    }

    const overlay = getReelOverlayDataUrl();
    elements.exportProgressFill.style.width = '60%';
    elements.exportProgressText.textContent = 'Encoding crisp 60fps MP4 Reel...';

    const res = await fetch('/api/render-reel-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_name: videoName,
        overlay: overlay,
        layout: reelState.layout,
        duration: 12
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Server render failed');
    }

    elements.exportProgressFill.style.width = '95%';
    elements.exportProgressText.textContent = 'Finalizing Reel Download...';

    reelState.lastExportedServerVideo = data.filename;
    reelState.lastExportedVideoUrl = data.videoUrl;

    // Trigger instant download of the crisp MP4
    const a = document.createElement('a');
    a.href = data.videoUrl;
    a.download = `ai-reel-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    elements.exportProgressFill.style.width = '100%';
    elements.exportProgressText.textContent = '✅ Export Complete!';
    showToast('🎉 9:16 Reel exported and downloaded successfully!', 'success');

    setTimeout(() => {
      elements.exportProgressBar.style.display = 'none';
      elements.exportReelBtn.disabled = false;
      reelState.isExporting = false;
    }, 1200);

  } catch (err) {
    console.error('Export Reel error:', err);
    elements.exportProgressBar.style.display = 'none';
    elements.exportReelBtn.disabled = false;
    reelState.isExporting = false;
    showToast(`Export error: ${err.message}`, 'error');
  }
}

// 8. Save Reel Frame to Vault
function saveReelToVault() {
  if (!elements.reelCanvas) return;
  const dataUrl = elements.reelCanvas.toDataURL('image/png');
  const reelItem = {
    id: Date.now(),
    image: dataUrl,
    headline: `[REEL] ${reelState.topHook}: ${reelState.caption}`,
    date: new Date().toLocaleDateString()
  };

  state.savedVault.unshift(reelItem);
  if (state.savedVault.length > 50) state.savedVault.pop();
  localStorage.setItem('ai_memer_vault', JSON.stringify(state.savedVault));
  updateVaultCount();
  showToast('Reel frame snapshot saved to Vault! ⭐', 'success');
}

// ==========================================================================
// INSTAGRAM AUTO-PUBLISHING INTEGRATION
// ==========================================================================

async function checkInstagramStatus() {
  try {
    const res = await fetch('/api/instagram/status');
    const data = await res.json();
    if (data.connected) {
      igState.connected = true;
      igState.username = data.username || '';
      igState.fullName = data.full_name || data.username || '';
      igState.profilePicUrl = data.profile_pic_url || '';
      igState.followerCount = data.follower_count || 0;
      igState.mediaCount = data.media_count || 0;
    } else {
      igState.connected = false;
    }
  } catch (e) {
    console.log('Instagram status check note:', e);
    igState.connected = false;
  }
  updateInstagramUI();
}

function updateInstagramUI() {
  if (igState.connected) {
    if (elements.igNavLabel) elements.igNavLabel.textContent = `@${igState.username}`;
    if (elements.igNavStatusDot) {
      elements.igNavStatusDot.className = 'ig-nav-dot connected';
    }
    if (elements.mIgNavDot) {
      elements.mIgNavDot.className = 'm-nav-dot connected';
    }
    if (elements.igConnectedView) elements.igConnectedView.style.display = 'block';
    if (elements.igDisconnectedView) elements.igDisconnectedView.style.display = 'none';

    if (elements.igUsernameDisplay) elements.igUsernameDisplay.textContent = `@${igState.username}`;
    if (elements.igFullNameDisplay) elements.igFullNameDisplay.textContent = igState.fullName || igState.username;
    if (elements.igFollowersCount) {
      elements.igFollowersCount.textContent = `${Number(igState.followerCount).toLocaleString()} Followers`;
    }
    if (elements.igProfilePic) {
      if (igState.profilePicUrl) {
        elements.igProfilePic.src = igState.profilePicUrl;
      } else {
        elements.igProfilePic.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(igState.username) + '&background=e1306c&color=fff';
      }
    }
  } else {
    if (elements.igNavLabel) elements.igNavLabel.textContent = 'Connect Instagram';
    if (elements.igNavStatusDot) {
      elements.igNavStatusDot.className = 'ig-nav-dot disconnected';
    }
    if (elements.mIgNavDot) {
      elements.mIgNavDot.className = 'm-nav-dot disconnected';
    }
    if (elements.igConnectedView) elements.igConnectedView.style.display = 'none';
    if (elements.igDisconnectedView) elements.igDisconnectedView.style.display = 'block';
  }
}

function openInstagramModal() {
  showModalElement(elements.instagramModal);
  if (elements.igStatusMsg) {
    elements.igStatusMsg.style.display = 'none';
    elements.igStatusMsg.textContent = '';
  }
  checkInstagramStatus();
}

function closeInstagramModal() {
  hideModalElement(elements.instagramModal);
}

function setupInstagramEventListeners() {
  if (elements.openInstagramModalBtn) {
    elements.openInstagramModalBtn.addEventListener('click', openInstagramModal);
  }
  if (elements.closeInstagramBtn) {
    elements.closeInstagramBtn.addEventListener('click', closeInstagramModal);
  }
  if (elements.instagramModal) {
    elements.instagramModal.addEventListener('click', (e) => {
      if (e.target === elements.instagramModal) closeInstagramModal();
    });
  }

  // Session vs Creds Tab Switching
  const tabBtns = document.querySelectorAll('.ig-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabType = btn.dataset.igtab;
      if (elements.igTabSession) elements.igTabSession.style.display = (tabType === 'session') ? 'block' : 'none';
      if (elements.igTabCreds) elements.igTabCreds.style.display = (tabType === 'creds') ? 'block' : 'none';
    });
  });

  // Connect via Session ID
  if (elements.igConnectSessionBtn) {
    elements.igConnectSessionBtn.addEventListener('click', connectInstagramSession);
  }

  // Connect via Credentials
  if (elements.igConnectCredsBtn) {
    elements.igConnectCredsBtn.addEventListener('click', connectInstagramCreds);
  }

  // Disconnect
  if (elements.igDisconnectBtn) {
    elements.igDisconnectBtn.addEventListener('click', disconnectInstagram);
  }

  // Post buttons from studios
  if (elements.openMemeIgPublishBtn) {
    elements.openMemeIgPublishBtn.addEventListener('click', openPublishModalForMeme);
  }
  if (elements.openReelIgPublishBtn) {
    elements.openReelIgPublishBtn.addEventListener('click', openPublishModalForReel);
  }

  // Publish Modal Close
  if (elements.closeIgPublishBtn) {
    elements.closeIgPublishBtn.addEventListener('click', closeIgPublishModal);
  }
  if (elements.igPublishModal) {
    elements.igPublishModal.addEventListener('click', (e) => {
      if (e.target === elements.igPublishModal) closeIgPublishModal();
    });
  }

  // Hashtag pills
  if (elements.igHashtagPills) {
    elements.igHashtagPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.ig-tag-pill');
      if (!pill) return;
      const tag = pill.dataset.tag;
      if (elements.igHashtagsInput) {
        const cur = elements.igHashtagsInput.value.trim();
        if (!cur.includes(tag)) {
          elements.igHashtagsInput.value = cur ? `${cur} ${tag}` : tag;
          showToast(`Added ${tag} to caption!`, 'info');
        }
      }
    });
  }

  // Confirm publish
  if (elements.confirmPublishIgBtn) {
    elements.confirmPublishIgBtn.addEventListener('click', executeInstagramPublish);
  }

  // Groq AI Caption & Viral Hashtag Generator
  if (elements.igAiGenCaptionBtn) {
    elements.igAiGenCaptionBtn.addEventListener('click', generateAiCaptionForIg);
  }

  // Custom Video File Input (pick an already exported reel MP4 from PC)
  if (elements.igCustomVideoInput) {
    elements.igCustomVideoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) {
        showToast('Please select a valid MP4 or WebM video file', 'error');
        return;
      }
      showToast('Uploading custom video file...', 'info');
      try {
        const res = await fetch('/api/upload-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: file
        });
        const data = await res.json();
        if (data.success && data.filename) {
          reelState.lastExportedServerVideo = data.filename;
          reelState.lastExportedVideoUrl = data.videoUrl;
          if (elements.igPublishVidPreview) {
            elements.igPublishVidPreview.src = data.videoUrl;
            elements.igPublishVidPreview.style.display = 'block';
            elements.igPublishImgPreview.style.display = 'none';
            elements.igPublishVidPreview.play().catch(() => {});
          }
          showToast('✅ Custom video loaded for Instagram Reel!', 'success');
        } else {
          showToast(data.error || 'Failed to upload video', 'error');
        }
      } catch (err) {
        showToast('Upload error: ' + err.message, 'error');
      }
    });
  }
}

async function connectInstagramSession() {
  const sessionid = elements.igSessionIdInput ? elements.igSessionIdInput.value.trim() : '';
  if (!sessionid) {
    showInstagramStatus('Please paste your Instagram sessionid cookie first!', 'error');
    return;
  }

  showInstagramStatus('Verifying session with Instagram...', 'loading');
  if (elements.igConnectSessionBtn) elements.igConnectSessionBtn.disabled = true;

  try {
    const res = await fetch('/api/instagram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'sessionid', sessionid })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Connection failed');
    }

    igState.connected = true;
    igState.username = data.username || '';
    igState.fullName = data.full_name || data.username || '';
    igState.profilePicUrl = data.profile_pic_url || '';
    igState.followerCount = data.follower_count || 0;
    igState.mediaCount = data.media_count || 0;

    showInstagramStatus(`🎉 Connected as @${data.username}!`, 'success');
    showToast(`Instagram connected: @${data.username}`, 'success');
    updateInstagramUI();
    if (elements.igSessionIdInput) elements.igSessionIdInput.value = '';
  } catch (err) {
    showInstagramStatus(`Error connecting: ${err.message}`, 'error');
    showToast(`Instagram connect error: ${err.message}`, 'error');
  } finally {
    if (elements.igConnectSessionBtn) elements.igConnectSessionBtn.disabled = false;
  }
}

async function connectInstagramCreds() {
  const username = elements.igUsernameInput ? elements.igUsernameInput.value.trim() : '';
  const password = elements.igPasswordInput ? elements.igPasswordInput.value.trim() : '';
  const verificationCode = elements.ig2faInput ? elements.ig2faInput.value.trim() : '';

  if (!username || !password) {
    showInstagramStatus('Please enter both your Instagram username and password!', 'error');
    return;
  }

  showInstagramStatus('Authenticating with Instagram...', 'loading');
  if (elements.igConnectCredsBtn) elements.igConnectCredsBtn.disabled = true;

  try {
    const res = await fetch('/api/instagram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'credentials',
        username,
        password,
        verification_code: verificationCode
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Authentication failed');
    }

    igState.connected = true;
    igState.username = data.username || '';
    igState.fullName = data.full_name || data.username || '';
    igState.profilePicUrl = data.profile_pic_url || '';
    igState.followerCount = data.follower_count || 0;
    igState.mediaCount = data.media_count || 0;

    showInstagramStatus(`🎉 Connected as @${data.username}!`, 'success');
    showToast(`Instagram connected: @${data.username}`, 'success');
    updateInstagramUI();
    if (elements.igPasswordInput) elements.igPasswordInput.value = '';
  } catch (err) {
    showInstagramStatus(`Error logging in: ${err.message}`, 'error');
    showToast(`Instagram login error: ${err.message}`, 'error');
  } finally {
    if (elements.igConnectCredsBtn) elements.igConnectCredsBtn.disabled = false;
  }
}

async function disconnectInstagram() {
  try {
    await fetch('/api/instagram/logout', { method: 'POST' });
    igState.connected = false;
    igState.username = '';
    igState.fullName = '';
    igState.profilePicUrl = '';
    igState.followerCount = 0;
    igState.mediaCount = 0;
    updateInstagramUI();
    showToast('Instagram account disconnected', 'info');
  } catch (err) {
    console.error('Logout error:', err);
  }
}

function showInstagramStatus(msg, type = 'info') {
  if (!elements.igStatusMsg) return;
  elements.igStatusMsg.style.display = 'block';
  elements.igStatusMsg.textContent = msg;
  elements.igStatusMsg.className = 'ig-status-msg ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : '');
}

async function generateAiCaptionForIg() {
  const btn = elements.igAiGenCaptionBtn;
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; display: inline-block;"></span> Cooking caption...`;
  }

  try {
    let title = '';
    let publisher = '';
    let hook = '';
    let vibe = 'dark';

    if (igState.publishMediaType === 'reel') {
      title = reelState.caption || state.selectedArticle?.title || 'Breaking News Reel';
      publisher = state.selectedArticle?.publisher || 'News Desk';
      hook = reelState.topHook || '';
      vibe = reelState.vibe || 'dark';
    } else {
      title = state.selectedArticle?.title || 'Trending Meme';
      publisher = state.selectedArticle?.publisher || '';
      const top = elements.topTextInput ? elements.topTextInput.value.trim() : '';
      const bottom = elements.bottomTextInput ? elements.bottomTextInput.value.trim() : '';
      hook = [top, bottom].filter(Boolean).join(' - ');
      vibe = state.currentVibe || 'dark';
    }

    const res = await fetch('/api/ai-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        publisher: publisher,
        hook: hook,
        vibe: vibe
      })
    });

    const data = await res.json();
    if (data.caption && elements.igCaptionTextarea) {
      elements.igCaptionTextarea.value = data.caption;
    }
    if (data.hashtags && elements.igHashtagsInput) {
      elements.igHashtagsInput.value = data.hashtags;
    }

    showToast('✨ Groq AI generated viral caption & hashtags!', 'success');
  } catch (err) {
    console.error('AI Caption generation error:', err);
    showToast('Failed to generate AI caption: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml || '✨ Groq AI Viral Caption';
    }
  }
}

function openPublishModalForMeme() {
  if (!igState.connected) {
    showToast('Please connect your Instagram account first! 📸', 'info');
    openInstagramModal();
    return;
  }

  if (!elements.memeCanvas) return;
  const dataUrl = elements.memeCanvas.toDataURL('image/jpeg', 0.95);
  igState.publishMediaType = 'photo';
  igState.pendingPhotoData = dataUrl;

  const previewBox = document.querySelector('.ig-media-preview-box');
  if (previewBox) {
    previewBox.classList.remove('reel-mode');
  }

  if (elements.igPublishSubtitle) {
    elements.igPublishSubtitle.textContent = 'Publish this news meme directly to your Instagram feed';
  }
  if (elements.igPublishImgPreview) {
    elements.igPublishImgPreview.src = dataUrl;
    elements.igPublishImgPreview.style.display = 'block';
  }
  if (elements.igPublishVidPreview) {
    elements.igPublishVidPreview.style.display = 'none';
  }

  // Pre-fill caption
  const title = state.selectedArticle ? state.selectedArticle.title : '';
  const punchline = elements.bottomTextInput ? elements.bottomTextInput.value.trim() : '';
  let initialCaption = '';
  if (title && punchline) {
    initialCaption = `${title}\n\n👉 ${punchline}`;
  } else if (punchline) {
    initialCaption = punchline;
  } else if (title) {
    initialCaption = title;
  }
  if (elements.igCaptionTextarea) {
    elements.igCaptionTextarea.value = initialCaption;
  }

  // Reset progress and result
  if (elements.igPublishProgressBox) elements.igPublishProgressBox.style.display = 'none';
  if (elements.igPublishResultBox) elements.igPublishResultBox.style.display = 'none';
  if (elements.confirmPublishIgBtn) elements.confirmPublishIgBtn.disabled = false;

  if (elements.igPublishModal) showModalElement(elements.igPublishModal);
}

async function openPublishModalForReel() {
  if (!igState.connected) {
    showToast('Please connect your Instagram account first! 📸', 'info');
    openInstagramModal();
    return;
  }

  igState.publishMediaType = 'reel';

  // 1. Capture current high-resolution frame snapshot from the edited canvas (with all text & layout!)
  if (elements.reelCanvas) {
    const snapshot = elements.reelCanvas.toDataURL('image/jpeg', 0.95);
    igState.pendingPhotoData = snapshot;
  }

  // 2. Set 9:16 vertical smartphone aspect ratio on preview box
  const previewBox = document.querySelector('.ig-media-preview-box');
  if (previewBox) {
    previewBox.classList.add('reel-mode');
  }

  // Determine source video name
  let videoName = 'sample_reel.mp4';
  if (elements.reelVideoSource && elements.reelVideoSource.src) {
    const match = elements.reelVideoSource.src.match(/name=([^&]+)/);
    if (match) videoName = decodeURIComponent(match[1]);
  }
  igState.pendingVideoName = videoName;

  if (elements.igPublishSubtitle) {
    elements.igPublishSubtitle.textContent = 'Publish this custom 9:16 Video Reel (with text & layout) to Instagram Reels';
  }

  // 3. SHOW PREVIEW:
  // If already composed, show the video immediately
  if (reelState.lastExportedVideoUrl) {
    elements.igPublishVidPreview.src = reelState.lastExportedVideoUrl;
    elements.igPublishVidPreview.style.display = 'block';
    elements.igPublishImgPreview.style.display = 'none';
    elements.igPublishVidPreview.play().catch(() => {});
  } else {
    // Show high-res canvas frame snapshot (all text, headline and formatting visible!)
    elements.igPublishImgPreview.src = igState.pendingPhotoData || '';
    elements.igPublishImgPreview.style.display = 'block';
    elements.igPublishVidPreview.style.display = 'none';

    // Auto-render the composite in background so preview video plays with all text!
    (async () => {
      try {
        const overlay = getReelOverlayDataUrl();
        const res = await fetch('/api/render-reel-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_name: videoName,
            overlay: overlay,
            layout: reelState.layout,
            duration: 12
          })
        });
        const data = await res.json();
        if (data.success && data.videoUrl) {
          reelState.lastExportedServerVideo = data.filename;
          reelState.lastExportedVideoUrl = data.videoUrl;
          if (elements.igPublishVidPreview && elements.igPublishModal && elements.igPublishModal.style.display !== 'none') {
            elements.igPublishVidPreview.src = data.videoUrl;
            elements.igPublishVidPreview.style.display = 'block';
            elements.igPublishImgPreview.style.display = 'none';
            elements.igPublishVidPreview.play().catch(() => {});
          }
        }
      } catch (e) {
        console.log('Background render note:', e);
      }
    })();
  }

  // 4. Pre-fill reel caption from topHook and headline
  const hook = reelState.topHook || '';
  const caption = reelState.caption || '';
  let initialCaption = '';
  if (hook && caption) {
    initialCaption = `${hook}\n\n${caption}`;
  } else if (hook) {
    initialCaption = hook;
  } else if (caption) {
    initialCaption = caption;
  }
  if (elements.igCaptionTextarea) {
    elements.igCaptionTextarea.value = initialCaption;
  }

  // Reset progress and result
  if (elements.igPublishProgressBox) elements.igPublishProgressBox.style.display = 'none';
  if (elements.igPublishResultBox) elements.igPublishResultBox.style.display = 'none';
  if (elements.confirmPublishIgBtn) elements.confirmPublishIgBtn.disabled = false;

  if (elements.igPublishModal) showModalElement(elements.igPublishModal);
}

function closeIgPublishModal() {
  if (elements.igPublishModal) {
    hideModalElement(elements.igPublishModal);
  }
  if (elements.igPublishVidPreview) {
    elements.igPublishVidPreview.pause();
  }
}

async function executeInstagramPublish() {
  if (igState.isPublishing) return;
  if (!igState.connected) {
    showToast('Instagram not connected', 'error');
    return;
  }

  const caption = elements.igCaptionTextarea ? elements.igCaptionTextarea.value.trim() : '';
  const hashtags = elements.igHashtagsInput ? elements.igHashtagsInput.value.trim() : '';

  igState.isPublishing = true;
  if (elements.confirmPublishIgBtn) elements.confirmPublishIgBtn.disabled = true;
  if (elements.igPublishResultBox) elements.igPublishResultBox.style.display = 'none';

  if (elements.igPublishProgressBox) {
    elements.igPublishProgressBox.style.display = 'flex';
  }

  try {
    let endpoint = '';
    let payload = {};

    if (igState.publishMediaType === 'photo') {
      endpoint = '/api/instagram/publish-photo';
      if (elements.igPublishProgressText) {
        elements.igPublishProgressText.textContent = 'Uploading Photo Meme to Instagram feed...';
      }
      payload = {
        image: igState.pendingPhotoData,
        caption: caption,
        hashtags: hashtags
      };
    } else {
      endpoint = '/api/instagram/publish-reel';
      
      let videoName = reelState.lastExportedServerVideo || igState.pendingVideoName || 'sample_reel.mp4';
      const overlay = getReelOverlayDataUrl();

      // Ensure the edited composite video is rendered
      if (!reelState.lastExportedServerVideo) {
        if (elements.igPublishProgressText) {
          elements.igPublishProgressText.textContent = '🎬 Rendering 9:16 Reel with custom layout & headlines...';
        }
        const renderRes = await fetch('/api/render-reel-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_name: videoName,
            overlay: overlay,
            layout: reelState.layout,
            duration: 12
          })
        });
        const renderData = await renderRes.json();
        if (renderData.success && renderData.filename) {
          videoName = renderData.filename;
          reelState.lastExportedServerVideo = renderData.filename;
          reelState.lastExportedVideoUrl = renderData.videoUrl;
        } else {
          throw new Error(renderData.error || 'Failed to render reel composite');
        }
      }

      if (elements.igPublishProgressText) {
        elements.igPublishProgressText.textContent = '📸 Publishing full edited 9:16 Reel to Instagram Reels...';
      }

      payload = {
        video_name: reelState.lastExportedServerVideo || videoName,
        overlay: overlay,
        layout: reelState.layout,
        thumbnail: igState.pendingPhotoData || '',
        caption: caption,
        hashtags: hashtags
      };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Publish failed');
    }

    const postUrl = data.post_url || data.reel_url || 'https://www.instagram.com';
    const postType = igState.publishMediaType === 'photo' ? 'Photo Meme' : '9:16 Reel';

    if (elements.igPublishResultBox) {
      elements.igPublishResultBox.style.display = 'block';
      elements.igPublishResultBox.className = 'ig-publish-result success';
      elements.igPublishResultBox.innerHTML = `
        <div>🎉 <strong>${postType} Published Successfully!</strong></div>
        <div style="margin-top: 6px;">
          <a href="${postUrl}" target="_blank" rel="noopener noreferrer">👉 View Live on Instagram (${data.code || 'Post'}) ↗</a>
        </div>
      `;
    }

    showToast(`🎉 ${postType} published to Instagram!`, 'success');

  } catch (err) {
    console.error('Instagram publish error:', err);
    if (elements.igPublishResultBox) {
      elements.igPublishResultBox.style.display = 'block';
      elements.igPublishResultBox.className = 'ig-publish-result error';
      elements.igPublishResultBox.innerHTML = `<div>❌ <strong>Publish Failed:</strong> ${err.message}</div>`;
    }
    showToast(`Publish error: ${err.message}`, 'error');
  } finally {
    igState.isPublishing = false;
    if (elements.igPublishProgressBox) elements.igPublishProgressBox.style.display = 'none';
    if (elements.confirmPublishIgBtn) elements.confirmPublishIgBtn.disabled = false;
  }
}

// Global window helpers for inline HTML onclick handlers
window.openStudioModal = openStudioModal;
window.closeStudioModal = closeStudioModal;
window.openReelStudio = openReelStudio;
window.closeReelStudio = closeReelStudio;
window.openVaultModal = openVaultModal;
window.closeVaultModal = closeVaultModal;
window.openInstagramModal = openInstagramModal;
window.closeInstagramModal = closeInstagramModal;
window.closeIgPublishModal = closeIgPublishModal;

// Start application
window.addEventListener('DOMContentLoaded', init);
