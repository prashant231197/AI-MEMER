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
  savedVault: JSON.parse(localStorage.getItem('ai_memer_vault') || '[]'),
  selectedNewsForBatch: new Map(), // articleUrl -> article object
  cardManualUrls: new Map() // articleUrl -> string URL
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
  multiClipUrlContainer: document.getElementById('multiClipUrlContainer'),
  addClipUrlBtn: document.getElementById('addClipUrlBtn'),
  fetchMultiClipsBtn: document.getElementById('fetchMultiClipsBtn'),
  autoCreateCollabEditBtn: document.getElementById('autoCreateCollabEditBtn'),
  collabModeGrid: document.getElementById('collabModeGrid'),
  aiEnhanceToggle: document.getElementById('aiEnhanceToggle'),
  activeClipsDeck: document.getElementById('activeClipsDeck'),
  activeClipsChips: document.getElementById('activeClipsChips'),
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
  reelHdQualityBadge: document.getElementById('reelHdQualityBadge'),
  patternCategoryTabs: document.getElementById('patternCategoryTabs'),
  openDatasetLibraryBtn: document.getElementById('openDatasetLibraryBtn'),
  reelColorGradeGrid: document.getElementById('reelColorGradeGrid'),
  reelDurationSelect: document.getElementById('reelDurationSelect'),
  reelLocationInput: document.getElementById('reelLocationInput'),
  reelSubBadgeInput: document.getElementById('reelSubBadgeInput'),
  datasetModal: document.getElementById('datasetModal'),
  closeDatasetBtn: document.getElementById('closeDatasetBtn'),
  datasetSearchInput: document.getElementById('datasetSearchInput'),
  datasetCatFilter: document.getElementById('datasetCatFilter'),
  datasetCardsGrid: document.getElementById('datasetCardsGrid'),

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

  // Batch Reel Studio & Action Bar Elements
  batchActionBar: document.getElementById('batchActionBar'),
  selectAllNewsCheckbox: document.getElementById('selectAllNewsCheckbox'),
  batchSelectedCountPill: document.getElementById('batchSelectedCountPill'),
  batchSelectAllBtn: document.getElementById('batchSelectAllBtn'),
  batchSelectTop5Btn: document.getElementById('batchSelectTop5Btn'),
  batchDeselectAllBtn: document.getElementById('batchDeselectAllBtn'),
  batchCreateReelsBtn: document.getElementById('batchCreateReelsBtn'),
  batchBtnCountBadge: document.getElementById('batchBtnCountBadge'),
  batchReelModal: document.getElementById('batchReelModal'),
  closeBatchReelBtn: document.getElementById('closeBatchReelBtn'),
  batchScreenSetup: document.getElementById('batchScreenSetup'),
  batchScreenRunning: document.getElementById('batchScreenRunning'),
  batchScreenSummary: document.getElementById('batchScreenSummary'),
  batchModalCountBadge: document.getElementById('batchModalCountBadge'),
  batchArticlesPreviewList: document.getElementById('batchArticlesPreviewList'),
  batchVideoSourceAuto: document.getElementById('batchVideoSourceAuto'),
  batchVideoSourceManual: document.getElementById('batchVideoSourceManual'),
  videoSourceAutoLabel: document.getElementById('videoSourceAutoLabel'),
  videoSourceManualLabel: document.getElementById('videoSourceManualLabel'),
  batchManualUrlWrap: document.getElementById('batchManualUrlWrap'),
  batchGlobalManualUrl: document.getElementById('batchGlobalManualUrl'),
  batchPatternStrategy: document.getElementById('batchPatternStrategy'),
  batchAutoPostIgToggle: document.getElementById('batchAutoPostIgToggle'),
  batchIgConnectedBox: document.getElementById('batchIgConnectedBox'),
  batchIgDisconnectedBox: document.getElementById('batchIgDisconnectedBox'),
  batchIgUsernameLabel: document.getElementById('batchIgUsernameLabel'),
  batchPostDelaySelect: document.getElementById('batchPostDelaySelect'),
  startBatchWorkflowBtn: document.getElementById('startBatchWorkflowBtn'),
  startBatchCount: document.getElementById('startBatchCount'),
  runnerHeadlineStatus: document.getElementById('runnerHeadlineStatus'),
  runnerCounterPill: document.getElementById('runnerCounterPill'),
  batchOverallProgressFill: document.getElementById('batchOverallProgressFill'),
  runnerSubtext: document.getElementById('runnerSubtext'),
  runnerTimeText: document.getElementById('runnerTimeText'),
  runnerCurrentCard: document.getElementById('runnerCurrentCard'),
  currentPatternBadge: document.getElementById('currentPatternBadge'),
  currentStoryTitle: document.getElementById('currentStoryTitle'),
  step1Node: document.getElementById('step1Node'),
  step2Node: document.getElementById('step2Node'),
  step3Node: document.getElementById('step3Node'),
  step4Node: document.getElementById('step4Node'),
  stepLine1: document.getElementById('stepLine1'),
  stepLine2: document.getElementById('stepLine2'),
  stepLine3: document.getElementById('stepLine3'),
  runnerQueueList: document.getElementById('runnerQueueList'),
  stopBatchBtn: document.getElementById('stopBatchBtn'),
  summaryStatsText: document.getElementById('summaryStatsText'),
  statReelsCreated: document.getElementById('statReelsCreated'),
  statReelsPosted: document.getElementById('statReelsPosted'),
  statPatternsUsed: document.getElementById('statPatternsUsed'),
  summaryGalleryGrid: document.getElementById('summaryGalleryGrid'),
  
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

// Reel Studio State (20 Patterns & HD Master Suite)
const reelState = {
  layout: 'reel_split', // 1 of 20 viral layout patterns
  vibe: 'dark',
  topHook: 'BREAKING: Nobody noticed this glitch in the simulation',
  caption: 'When the truth hits harder than your morning coffee.',
  locationTag: 'r/AskReddit • 42.8k Upvotes',
  subBadge: 'LIVE BROADCAST 🚨',
  colorGrade: 'none',
  quality: 'hd1080', // 'hd1080' | 'hd720'
  duration: 12,
  darken: 15,
  isPlaying: false,
  isMuted: true,
  videoReady: false,
  isExporting: false,
  animFrameId: null,
  activeVTab: 'paste',
  tickerOffset: 0,
  waveformPhase: 0,
  mediaRecorder: null,
  recordedChunks: [],
  videoInfo: null,
  // Multi-Clip Collab Studio & Quality Enhancer
  clips: [],
  activeClipIndex: 0,
  collabMode: 'sequence', // 'sequence' | 'split2' | 'split4' | 'pip'
  qualityEnhance: true
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
    elements.igPublishModal || document.getElementById('igPublishModal'),
    elements.batchReelModal || document.getElementById('batchReelModal')
  ].forEach(m => {
    if (m) hideModalElement(m);
  });

  updateVaultCount();
  setupEventListeners();
  setupBatchEventListeners();
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
    lead.related_coverage = related;
    const isSelected = state.selectedNewsForBatch.has(lead.url);

    const card = document.createElement('article');
    card.className = `news-card${isSelected ? ' card-batch-selected' : ''}`;

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

    const savedManualUrl = state.cardManualUrls.get(lead.url) || '';

    card.innerHTML = `
      <div class="news-meta-row">
        <div class="news-meta-left">
          <label class="news-card-select-label" title="Select this story for Batch Reel Studio & Instagram Auto-Post" onclick="event.stopPropagation()">
            <input type="checkbox" class="news-card-select-cb" data-url="${escapeHtml(lead.url)}">
            <span class="news-select-indicator"></span>
          </label>
          <span class="news-publisher">${escapeHtml(lead.publisher || 'Google News')}</span>
        </div>
        <span class="news-date">${formatDate(lead.published_date)}</span>
      </div>
      <h2 class="news-title">${escapeHtml(lead.title)}</h2>
      <div class="card-manual-url-box" onclick="event.stopPropagation()">
        <span title="Optional custom video URL for this news">🔗</span>
        <input type="url" class="card-manual-video-input" placeholder="Custom video URL for this story (optional)..." value="${escapeHtml(savedManualUrl)}">
      </div>
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

    // Checkbox Listener
    const cb = card.querySelector('.news-card-select-cb');
    cb.checked = isSelected;
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleArticleBatchSelection(lead, cb.checked);
      card.classList.toggle('card-batch-selected', cb.checked);
    });

    // Manual Video URL input listener
    const manualInput = card.querySelector('.card-manual-video-input');
    if (manualInput) {
      manualInput.addEventListener('input', (e) => {
        const val = manualInput.value.trim();
        state.cardManualUrls.set(lead.url, val);
        if (state.selectedNewsForBatch.has(lead.url)) {
          state.selectedNewsForBatch.get(lead.url).manualVideoUrl = val;
        }
      });
    }

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
  updateBatchSelectionUI();
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
function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 10) {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let curY = y;
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines) {
        return curY;
      }
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    context.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }
  return curY;
}

function drawStrokedText(context, text, x, y, maxWidth, lineHeight, maxLines = 10) {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let curY = y;
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.strokeText(line.trim(), x, curY);
      context.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines) {
        return curY;
      }
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    context.strokeText(line.trim(), x, curY);
    context.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }
  return curY;
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

  // 4. Feature 1: Multi-Clip Collab URL Downloader (1 to 4 URLs)
  if (elements.fetchReelUrlBtn) {
    elements.fetchReelUrlBtn.addEventListener('click', fetchReelFromUrl);
  }
  if (elements.reelUrlInput) {
    elements.reelUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') fetchReelFromUrl();
    });
  }

  // Multi-Clip Add Row (Up to 4 clips)
  if (elements.addClipUrlBtn) {
    elements.addClipUrlBtn.addEventListener('click', () => {
      const container = elements.multiClipUrlContainer || document.getElementById('multiClipUrlContainer');
      if (!container) return;
      const rows = container.querySelectorAll('.clip-url-row');
      if (rows.length >= 4) {
        showToast('Maximum 4 video clips supported for montage collab', 'info');
        return;
      }
      const newIdx = rows.length;
      const roles = ['Hook / Intro', 'Drop / Meme', 'Build / B-Roll', 'Punchline / Outro'];
      const row = document.createElement('div');
      row.className = 'clip-url-row';
      row.dataset.clipIndex = newIdx;
      row.innerHTML = `
        <span class="clip-index-badge">Clip ${newIdx + 1}</span>
        <input type="text" class="form-input multi-url-input" placeholder="Clip ${newIdx + 1} URL (Instagram, Shorts, TikTok)...">
        <button type="button" class="remove-clip-btn" title="Remove Clip">✕</button>
        <span class="clip-role-tag">${roles[newIdx] || 'Clip'}</span>
      `;
      row.querySelector('.remove-clip-btn').addEventListener('click', () => {
        row.remove();
        updateClipRowIndices();
      });
      container.appendChild(row);
      showToast(`Added Clip ${newIdx + 1} input field`, 'info');
    });
  }

  function updateClipRowIndices() {
    const container = elements.multiClipUrlContainer || document.getElementById('multiClipUrlContainer');
    if (!container) return;
    const rows = container.querySelectorAll('.clip-url-row');
    const roles = ['Hook / Intro', 'Drop / Meme', 'Build / B-Roll', 'Punchline / Outro'];
    rows.forEach((r, idx) => {
      r.dataset.clipIndex = idx;
      const badge = r.querySelector('.clip-index-badge');
      if (badge) badge.textContent = `Clip ${idx + 1}`;
      const tag = r.querySelector('.clip-role-tag');
      if (tag) tag.textContent = roles[idx] || 'Clip';
      const removeBtn = r.querySelector('.remove-clip-btn');
      if (removeBtn) removeBtn.style.display = idx === 0 ? 'none' : 'inline-block';
    });
  }

  // 1-Click Auto-Create Collab Edit & Batch Fetch
  if (elements.autoCreateCollabEditBtn) {
    elements.autoCreateCollabEditBtn.addEventListener('click', autoCreateCollabEdit);
  }

  if (elements.fetchMultiClipsBtn) {
    elements.fetchMultiClipsBtn.addEventListener('click', fetchMultiClipsBatch);
  }

  // Collab Montage Mode Selector
  if (elements.collabModeGrid) {
    elements.collabModeGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.collab-btn');
      if (!btn) return;
      elements.collabModeGrid.querySelectorAll('.collab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reelState.collabMode = btn.dataset.collab || 'sequence';
      const name = btn.querySelector('.collab-name')?.textContent || btn.dataset.collab;
      showToast(`🎬 Collab Edit Mode: ${name}`, 'info');
    });
  }

  // AI Quality Enhancer Switch
  if (elements.aiEnhanceToggle) {
    elements.aiEnhanceToggle.addEventListener('change', (e) => {
      reelState.qualityEnhance = e.target.checked;
      showToast(`AI Clarity & Audio Normalizer: ${e.target.checked ? 'Active ✨' : 'Disabled'}`, 'info');
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

  // 8. Reel 20 Pattern Layout Selection
  if (elements.reelLayoutGrid) {
    elements.reelLayoutGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.layout-btn');
      if (!btn) return;
      elements.reelLayoutGrid.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reelState.layout = btn.dataset.reellayout;
      const titleSpan = btn.querySelector('.layout-btn-title') || btn;
      showToast(`Selected pattern: ${titleSpan.textContent.trim()}`, 'info');
    });
  }

  // 8b. Category Filter Tabs for Patterns
  if (elements.patternCategoryTabs) {
    elements.patternCategoryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.pcat-btn');
      if (!btn) return;
      elements.patternCategoryTabs.querySelectorAll('.pcat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      if (elements.reelLayoutGrid) {
        elements.reelLayoutGrid.querySelectorAll('.layout-btn').forEach(card => {
          if (cat === 'all' || card.dataset.cat === cat) {
            card.classList.remove('is-hidden');
          } else {
            card.classList.add('is-hidden');
          }
        });
      }
    });
  }

  // 8c. Color Grade Grid Selection
  if (elements.reelColorGradeGrid) {
    elements.reelColorGradeGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.cgrade-btn');
      if (!btn) return;
      elements.reelColorGradeGrid.querySelectorAll('.cgrade-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reelState.colorGrade = btn.dataset.grade || 'none';
      showToast(`Color grade applied: ${btn.textContent.trim()}`, 'info');
    });
  }

  // 8d. Master Export Quality Radios
  document.querySelectorAll('input[name="reelQuality"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      reelState.quality = e.target.value;
      document.querySelectorAll('.quality-radio-card').forEach(c => c.classList.remove('active'));
      e.target.closest('.quality-radio-card')?.classList.add('active');
      showToast(`Export resolution: ${e.target.value === 'hd1080' ? '💎 1080x1920 Full HD Master' : '⚡ 720x1280 Fast HD'}`, 'info');
    });
  });

  // 8e. Duration Selector
  if (elements.reelDurationSelect) {
    elements.reelDurationSelect.addEventListener('change', (e) => {
      reelState.duration = parseInt(e.target.value, 10);
    });
  }

  // 9. Text, Location, Badge & Dimming Inputs
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

  if (elements.reelLocationInput) {
    elements.reelLocationInput.addEventListener('input', (e) => {
      reelState.locationTag = e.target.value;
    });
  }

  if (elements.reelSubBadgeInput) {
    elements.reelSubBadgeInput.addEventListener('input', (e) => {
      reelState.subBadge = e.target.value;
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
      reelState.vibe = btn.dataset.vibe || 'spiritual';
      fetchReelAiHooks();
    });
  }

  if (elements.regenReelHooksBtn) {
    elements.regenReelHooksBtn.addEventListener('click', fetchReelAiHooks);
  }

  // 10b. Dataset Library Modal Triggers
  if (elements.openDatasetLibraryBtn) {
    elements.openDatasetLibraryBtn.addEventListener('click', openDatasetModal);
  }
  if (elements.closeDatasetBtn) {
    elements.closeDatasetBtn.addEventListener('click', closeDatasetModal);
  }
  if (elements.datasetModal) {
    elements.datasetModal.addEventListener('click', (e) => {
      if (e.target === elements.datasetModal) closeDatasetModal();
    });
  }
  if (elements.datasetSearchInput) {
    elements.datasetSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      filterDatasetCards(q, currentDatasetCat);
    });
  }
  if (elements.datasetCatFilter) {
    elements.datasetCatFilter.addEventListener('click', (e) => {
      const btn = e.target.closest('.dcat-btn');
      if (!btn) return;
      elements.datasetCatFilter.querySelectorAll('.dcat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDatasetCat = btn.dataset.dcat;
      const q = elements.datasetSearchInput?.value.toLowerCase().trim() || '';
      filterDatasetCards(q, currentDatasetCat);
    });
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
      reelState.videoInfo = data.videoInfo || null;
      if (elements.reelHdQualityBadge) {
        elements.reelHdQualityBadge.textContent = data.videoInfo?.badge || '💎 1080p Full HD';
        elements.reelHdQualityBadge.style.display = 'inline-flex';
      }
      loadVideoSource(data.videoUrl, data.title || 'Instagram Reel');
      showToast(`🎬 ${data.videoInfo?.badge || 'HD Video'} loaded into Reel Studio!`, 'success');
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

// 1-Click Fast Auto-Create Collab Edit Workflow
async function autoCreateCollabEdit() {
  const container = elements.multiClipUrlContainer || document.getElementById('multiClipUrlContainer');
  if (!container) return;
  const inputs = container.querySelectorAll('.multi-url-input');
  const urls = [];
  inputs.forEach(inp => {
    const u = inp.value.trim();
    if (u) urls.push(u);
  });

  if (urls.length === 0) {
    const single = elements.reelUrlInput?.value.trim();
    if (single) urls.push(single);
    else {
      showToast('Please paste at least 1 or 2 video links to create your edit!', 'error');
      return;
    }
  }

  const btn = elements.autoCreateCollabEditBtn || document.getElementById('autoCreateCollabEditBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ 1/2 Downloading ${urls.length} clips in parallel...</span>`;
  }
  setVideoStatus(`🚀 Step 1/2: Downloading ${urls.length} video clips in parallel...`, 'loading');

  try {
    // Step 1: Parallel Batch Download
    const res = await fetch('/api/fetch-multi-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.clips || data.clips.length === 0) {
      throw new Error(data.error || 'Failed to download video clips');
    }

    reelState.clips = data.clips;
    renderActiveClipsDeck(data.clips);

    if (btn) {
      btn.innerHTML = `<span>🎬 2/2 Auto-compositing ${reelState.collabMode.toUpperCase()} Edit...</span>`;
    }
    setVideoStatus(`✨ Step 2/2: Rendering Full HD Collab Edit (${reelState.collabMode}) with AI Quality Enhancer...`, 'loading');

    // Step 2: Auto-Render Collab Composite with AI Quality Enhancement
    const overlay = getReelOverlayDataUrl();
    const renderRes = await fetch('/api/render-reel-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_name: data.clips[0].filename,
        clips: data.clips,
        collab_mode: reelState.collabMode || 'sequence',
        quality_enhancement: reelState.qualityEnhance !== false,
        overlay: overlay,
        layout: reelState.layout || 'reel_split',
        duration: reelState.duration || 12,
        quality: reelState.quality || 'hd1080',
        color_grade: reelState.colorGrade || 'none'
      })
    });
    const renderData = await renderRes.json();
    if (!renderRes.ok || !renderData.success) {
      throw new Error(renderData.error || 'Rendering collab edit failed');
    }

    // Step 3: Immediately Load & Play Final Rendered Video in Player Mockup
    loadVideoSource(renderData.videoUrl, "Final Collab Edit");
    reelState.lastExportedServerVideo = renderData.filename;
    reelState.lastExportedVideoUrl = renderData.videoUrl;

    if (elements.reelHdQualityBadge) {
      elements.reelHdQualityBadge.textContent = '💎 1080p Master Collab';
      elements.reelHdQualityBadge.style.display = 'inline-flex';
    }

    showToast(`🎉 Ekdum Perfect Collab Edit Taiyaar Hai! Playing 1080p Master.`, 'success');

  } catch (err) {
    console.error('Auto collab edit error:', err);
    setVideoStatus(`⚠️ ${err.message}`, 'error');
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>⚡ Auto-Create Collab Edit (1-Click)</span>`;
    }
  }
}

// Batch Fetch 1 to 4 HD Clips for Multi-Clip Collab Studio
async function fetchMultiClipsBatch() {
  const container = elements.multiClipUrlContainer || document.getElementById('multiClipUrlContainer');
  if (!container) return;
  const inputs = container.querySelectorAll('.multi-url-input');
  const urls = [];
  inputs.forEach(inp => {
    const u = inp.value.trim();
    if (u) urls.push(u);
  });

  if (urls.length === 0) {
    // Check single reelUrlInput as fallback
    const single = elements.reelUrlInput?.value.trim();
    if (single) {
      urls.push(single);
    } else {
      showToast('Please paste at least 1 video URL (Clip 1, Clip 2, etc.)', 'error');
      return;
    }
  }

  setVideoStatus(`⏳ Fetching ${urls.length} HD video clips via yt-dlp...`, 'loading');
  if (elements.fetchMultiClipsBtn) {
    elements.fetchMultiClipsBtn.disabled = true;
    elements.fetchMultiClipsBtn.textContent = `Downloading ${urls.length} Clips...`;
  }

  try {
    const res = await fetch('/api/fetch-multi-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });
    const data = await res.json();

    if (!res.ok || !data.success || !data.clips || data.clips.length === 0) {
      throw new Error(data.error || 'Failed to fetch multi video clips');
    }

    reelState.clips = data.clips;
    renderActiveClipsDeck(data.clips);

    // Load first clip as primary preview
    const firstClip = data.clips[0];
    reelState.videoInfo = firstClip.videoInfo || null;
    if (elements.reelHdQualityBadge) {
      elements.reelHdQualityBadge.textContent = firstClip.videoInfo?.badge || '💎 1080p Full HD';
      elements.reelHdQualityBadge.style.display = 'inline-flex';
    }

    loadVideoSource(firstClip.videoUrl, firstClip.title || 'Clip 1');
    showToast(`🎬 Loaded ${data.clips.length} HD clips into Collab Studio!`, 'success');

  } catch (err) {
    console.error('Fetch multi clips error:', err);
    setVideoStatus(`⚠️ ${err.message}`, 'error');
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    if (elements.fetchMultiClipsBtn) {
      elements.fetchMultiClipsBtn.disabled = false;
      elements.fetchMultiClipsBtn.textContent = '⚡ Fetch All HD Clips';
    }
  }
}

function renderActiveClipsDeck(clips) {
  const deck = elements.activeClipsDeck || document.getElementById('activeClipsDeck');
  const chipsContainer = elements.activeClipsChips || document.getElementById('activeClipsChips');
  if (!deck || !chipsContainer) return;

  if (!clips || clips.length === 0) {
    deck.style.display = 'none';
    return;
  }

  deck.style.display = 'block';
  chipsContainer.innerHTML = '';

  clips.forEach((clip, idx) => {
    const chip = document.createElement('div');
    chip.className = 'clip-chip' + (idx === reelState.activeClipIndex ? ' active' : '');
    const title = (clip.title || `Clip ${idx + 1}`).substring(0, 24);
    const badge = clip.videoInfo?.badge || '1080p';
    chip.innerHTML = `<span>▶️ Clip ${idx + 1}: ${escapeHtml(title)} (${escapeHtml(badge)})</span>`;
    chip.addEventListener('click', () => {
      reelState.activeClipIndex = idx;
      chipsContainer.querySelectorAll('.clip-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadVideoSource(clip.videoUrl, clip.title || `Clip ${idx + 1}`);
      showToast(`Active preview: Clip ${idx + 1}`, 'info');
    });
    chipsContainer.appendChild(chip);
  });
}

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

  setVideoStatus(`🔍 Searching Internet for related news footage & CCTV...`, 'loading');
  if (elements.autoSearchVideoBtn) {
    elements.autoSearchVideoBtn.disabled = true;
    elements.autoSearchVideoBtn.textContent = 'Searching...';
  }

  try {
    const res = await fetch('/api/fetch-reel-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'search',
        query,
        search_queries: reelState.searchQueries || []
      })
    });
    const data = await res.json();

    if (data.success && data.videoUrl) {
      reelState.videoInfo = data.videoInfo || null;
      if (elements.reelHdQualityBadge) {
        elements.reelHdQualityBadge.textContent = data.videoInfo?.badge || '💎 1080p Full HD';
        elements.reelHdQualityBadge.style.display = 'inline-flex';
      }
      loadVideoSource(data.videoUrl, data.title || 'Related Video Footage');
      showToast('✨ Found and downloaded relatable HD video footage!', 'success');
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
  const vibe = reelState.vibe || 'news';
  const relatedCoverage = state.selectedArticle?.related_coverage || [];

  elements.reelHooksList.innerHTML = `<div class="ai-suggest-placeholder">
    <div class="spinner" style="width: 20px; height: 20px; margin: 0 auto 8px;"></div>
    ⚡ Groq AI synthesizing breaking headline & 2-3 line description...
  </div>`;

  try {
    const res = await fetch('/api/reel-hooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: headline,
        publisher: publisher,
        category: state.currentTopic || state.currentType || '',
        vibe: vibe,
        related_coverage: relatedCoverage
      })
    });
    const data = await res.json();

    if (data.headline) {
      reelState.topHook = data.headline;
      if (elements.reelTopHookInput) elements.reelTopHookInput.value = data.headline;
    }
    if (data.description) {
      reelState.caption = data.description;
      if (elements.reelCaptionInput) elements.reelCaptionInput.value = data.description;
    }
    if (data.search_queries && Array.isArray(data.search_queries)) {
      reelState.searchQueries = data.search_queries;
    }

    if (data.hooks && data.hooks.length > 0) {
      elements.reelHooksList.innerHTML = '';
      data.hooks.forEach(item => {
        const card = document.createElement('div');
        card.className = 'ai-suggest-card';
        const badge = item.vibe || '🔴 BREAKING NEWS';
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
          showToast('Applied breaking news hook to Reel!', 'success');
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
      try {
        renderReelCanvasFrame();
      } catch (err) {
        console.warn('[REEL LOOP] Frame render warning:', err);
      }
      reelState.animFrameId = requestAnimationFrame(loop);
    }
  }
  reelState.animFrameId = requestAnimationFrame(loop);
}

// 6. Dataset Library State & Controller
let currentDatasetCat = 'all';
let cachedViralDataset = [];

async function loadViralDataset() {
  if (cachedViralDataset.length > 0) return cachedViralDataset;
  try {
    const res = await fetch('/api/reel-dataset');
    const data = await res.json();
    if (data.success && Array.isArray(data.dataset)) {
      cachedViralDataset = data.dataset;
      return cachedViralDataset;
    }
  } catch (err) {
    console.error('Failed to load viral dataset:', err);
  }
  return [];
}

async function openDatasetModal() {
  const modal = elements.datasetModal || document.getElementById('datasetModal');
  if (!modal) return;
  showModalElement(modal);

  const grid = elements.datasetItemsGrid || document.getElementById('datasetItemsGrid');
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-muted);">
        <div class="spinner" style="width: 28px; height: 28px; margin: 0 auto 12px;"></div>
        ⚡ Loading 20 Viral Reel Patterns & Verified Formulas...
      </div>
    `;
  }

  const dataset = await loadViralDataset();
  renderDatasetCards(dataset);
}

function closeDatasetModal() {
  const modal = elements.datasetModal || document.getElementById('datasetModal');
  if (modal) hideModalElement(modal);
}

function renderDatasetCards(items) {
  const grid = elements.datasetItemsGrid || document.getElementById('datasetItemsGrid');
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-muted);">
        No patterns found matching your search. Try another keyword or filter.
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'dataset-item-card';
    const gradeName = (item.color_grade || 'Clean HD').replace(/_/g, ' ').toUpperCase();
    const catName = (item.category || 'Viral').toUpperCase();

    card.innerHTML = `
      <div class="ditem-header">
        <span class="ditem-badge">${escapeHtml(catName)}</span>
        <span class="ditem-grade-pill">🎨 ${escapeHtml(gradeName)}</span>
      </div>
      <div class="ditem-title">${escapeHtml(item.name)}</div>
      <div class="ditem-flow"><strong>Pattern Flow:</strong> ${escapeHtml(item.visual_pattern || item.pattern || '')}</div>
      <div class="ditem-hook">"${escapeHtml(item.hook || item.viral_hooks || '')}"</div>
      <div class="ditem-footer">
        <span class="ditem-tip">💡 ${escapeHtml(item.quality_tip || '1080p 60fps')}</span>
        <button type="button" class="ditem-apply-btn">Apply Pattern ✨</button>
      </div>
    `;

    card.querySelector('.ditem-apply-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      applyDatasetItemToReel(item);
    });

    card.addEventListener('click', () => {
      applyDatasetItemToReel(item);
    });

    grid.appendChild(card);
  });
}

function filterDatasetCards(q, cat) {
  if (!cachedViralDataset) return;
  const filtered = cachedViralDataset.filter(item => {
    const matchCat = (cat === 'all' || item.category === cat);
    if (!matchCat) return false;
    if (!q) return true;
    const haystack = `${item.name} ${item.hook} ${item.caption} ${item.visual_pattern} ${item.pattern || ''} ${item.category}`.toLowerCase();
    return haystack.includes(q);
  });
  renderDatasetCards(filtered);
}

function applyDatasetItemToReel(item) {
  if (!item) return;

  if (item.layout_id) {
    reelState.layout = item.layout_id;
    if (elements.reelLayoutGrid) {
      elements.reelLayoutGrid.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.reellayout === item.layout_id);
      });
    }
  }

  if (item.hook) {
    reelState.topHook = item.hook;
    if (elements.reelTopHookInput) elements.reelTopHookInput.value = item.hook;
  }

  if (item.caption) {
    reelState.caption = item.caption;
    if (elements.reelCaptionInput) elements.reelCaptionInput.value = item.caption;
  }

  if (item.location) {
    reelState.locationTag = item.location;
    if (elements.reelLocationInput) elements.reelLocationInput.value = item.location;
  }

  if (item.color_grade) {
    reelState.colorGrade = item.color_grade;
    if (elements.reelColorGradeGrid) {
      elements.reelColorGradeGrid.querySelectorAll('.cgrade-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.grade === item.color_grade);
      });
    }
  }

  if (item.vibe) {
    reelState.vibe = item.vibe;
    if (elements.reelVibePills) {
      elements.reelVibePills.querySelectorAll('.ai-vibe-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.vibe === item.vibe);
      });
    }
  }

  closeDatasetModal();
  showToast(`✨ Loaded viral pattern: "${item.name}"!`, 'success');
}

window.openDatasetModal = openDatasetModal;
window.closeDatasetModal = closeDatasetModal;

// 7. Reel Canvas 9:16 Render Engine
function renderReelCanvasFrame() {
  if (!reelCtx || !elements.reelCanvas) return;
  const w = elements.reelCanvas.width;
  const h = elements.reelCanvas.height;
  const vid = elements.reelVideoSource;

  // Clear canvas
  reelCtx.clearRect(0, 0, w, h);

  const topHook = reelState.topHook || 'BREAKING: Nobody noticed this glitch in the simulation';
  const caption = reelState.caption || state.selectedArticle?.title || 'When the truth hits harder than your morning coffee.';
  const publisher = state.selectedArticle?.publisher || 'TODAY MEMER';
  const hasVideo = vid && vid.readyState >= 2;

  // Update dynamic animation phases
  reelState.waveformPhase = (reelState.waveformPhase + 0.15) % (Math.PI * 2);
  reelState.tickerOffset = (reelState.tickerOffset + 2) % 3000;

  renderSelectedLayout(reelCtx, w, h, vid, hasVideo, topHook, caption, publisher, false);

  // Modern bottom progress bar line
  if (hasVideo && vid.duration) {
    const progress = vid.currentTime / vid.duration;
    reelCtx.fillStyle = '#ec4899';
    reelCtx.fillRect(0, h - 8, w * progress, 8);
  }
}

// Background Video Drawer with Collab Montage Modes & Live Color Grading
function drawReelVideoBg(ctx, w, h, vid, hasVideo) {
  // Always render base dark studio background so canvas is NEVER transparent/blank
  const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
  baseGrad.addColorStop(0, '#090d16');
  baseGrad.addColorStop(0.5, '#1e1b4b');
  baseGrad.addColorStop(1, '#05070c');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);
  const mode = reelState.collabMode || 'sequence';
  const isSplitLayout = reelState.layout === 'reel_brainrot_subway' || reelState.layout === 'reel_before_after';

  if (mode === 'split2' || isSplitLayout) {
    // Dual Vertical Split (Top Half + Bottom Half)
    const midY = h / 2;
    if (hasVideo) {
      drawImageProp(ctx, vid, 0, 0, w, midY, 0.5, 0.3);
      drawImageProp(ctx, vid, 0, midY, w, midY, 0.5, 0.7);
    } else {
      drawVideoPlaceholder(ctx, 0, 0, w, midY);
      drawVideoPlaceholder(ctx, 0, midY, w, midY);
    }
    // Middle Divider Bar
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, midY - 2, w, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, midY - 14, 120, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillText('⚡ DUAL SPLIT', 14, midY + 4);

  } else if (mode === 'split4') {
    // Quad 2x2 Grid Collage
    const halfW = w / 2;
    const halfH = h / 2;
    if (hasVideo) {
      drawImageProp(ctx, vid, 0, 0, halfW, halfH, 0.5, 0.5);
      drawImageProp(ctx, vid, halfW, 0, halfW, halfH, 0.5, 0.5);
      drawImageProp(ctx, vid, 0, halfH, halfW, halfH, 0.5, 0.5);
      drawImageProp(ctx, vid, halfW, halfH, halfW, halfH, 0.5, 0.5);
    } else {
      drawVideoPlaceholder(ctx, 0, 0, halfW, halfH);
      drawVideoPlaceholder(ctx, halfW, 0, halfW, halfH);
      drawVideoPlaceholder(ctx, 0, halfH, halfW, halfH);
      drawVideoPlaceholder(ctx, halfW, halfH, halfW, halfH);
    }
    // Grid Lines
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(halfW - 2, 0, 4, h);
    ctx.fillRect(0, halfH - 2, w, 4);

  } else if (mode === 'pip' || reelState.layout === 'reel_pip_commentary') {
    // Picture-in-Picture Webcam / Reaction Drop
    if (hasVideo) {
      drawImageProp(ctx, vid, 0, 0, w, h, 0.5, 0.5);
    } else {
      drawVideoPlaceholder(ctx, 0, 0, w, h);
    }
    // Floating PiP Camera Window
    const pipW = w * 0.38;
    const pipH = h * 0.28;
    const pipX = w - pipW - 30;
    const pipY = h - pipH - 120;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    roundRect(ctx, pipX, pipY, pipW, pipH, 16);
    ctx.stroke();
    ctx.clip();
    if (hasVideo) {
      drawImageProp(ctx, vid, pipX, pipY, pipW, pipH, 0.5, 0.5);
    } else {
      drawVideoPlaceholder(ctx, pipX, pipY, pipW, pipH);
    }
    ctx.restore();
    // PiP Cam Badge
    ctx.fillStyle = 'rgba(236, 72, 153, 0.85)';
    roundRect(ctx, pipX + 10, pipY + 10, 80, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Outfit", sans-serif';
    ctx.fillText('🔴 REACTION', pipX + 16, pipY + 25);

  } else {
    // Full Screen Single / Sequential Clip
    if (hasVideo) {
      drawImageProp(ctx, vid, 0, 0, w, h, 0.5, 0.5);
    } else {
      drawVideoPlaceholder(ctx, 0, 0, w, h);
    }
  }

  // Live Canvas Color Grading Filters (Punchy Dark, Neon, News)
  const grade = reelState.colorGrade;
  if (grade === 'ai_crystal') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'oled_midnight') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'cinematic_contrast') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.20)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'reddit_dark') {
    ctx.fillStyle = 'rgba(10, 10, 18, 0.35)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'vintage_vhs') {
    ctx.fillStyle = 'rgba(20, 184, 166, 0.10)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon_cyber') {
    ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'news_vivid') {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'golden_film') {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(0, 0, w, h);
  }

  // Darken overlay
  if (reelState.darken > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${reelState.darken / 100})`;
    ctx.fillRect(0, 0, w, h);
  }
}

// -------------------------------------------------------------
// 20 VIRAL REEL PATTERN LAYOUT ENGINES
// -------------------------------------------------------------

/* Layout 3: Market & Money Reality Satire (Unusual Whales style) */
function drawReelUnusualWhalesLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top Neon Green Market Ticker Card
  const boxY = 60 * s;
  const boxH = 220 * s;
  ctx.fillStyle = 'rgba(9, 14, 26, 0.94)';
  roundRect(ctx, 36 * s, boxY, w - 72 * s, boxH, 20 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, 36 * s, boxY, w - 72 * s, boxH, 20 * s);
  ctx.stroke();

  // Green Live Market Badge
  ctx.fillStyle = '#22c55e';
  roundRect(ctx, 56 * s, boxY + 20 * s, 140 * s, 30 * s, 15 * s);
  ctx.fill();
  ctx.fillStyle = '#052e16';
  ctx.font = `800 ${Math.round(13 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('📈 MARKET SATIRE', 126 * s, boxY + 40 * s);

  // Ticker symbol / handle
  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 ${Math.round(14 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(reelState.locationTag || '$REALITY • NYSE', w - 60 * s, boxY + 40 * s);

  // Satire Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(26 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'left';
  wrapText(ctx, topHook, 56 * s, boxY + 86 * s, w - 112 * s, 34 * s);

  // Bottom Punchline Card
  const pY = h - 260 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  roundRect(ctx, 36 * s, pY, w - 72 * s, 180 * s, 20 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
  ctx.lineWidth = 1.5 * s;
  roundRect(ctx, 36 * s, pY, w - 72 * s, 180 * s, 20 * s);
  ctx.stroke();

  ctx.fillStyle = '#f87171';
  ctx.font = `700 ${Math.round(14 * s)}px "Outfit", sans-serif`;
  ctx.fillText('💀 ECONOMIC REALITY CHECK', 56 * s, pY + 36 * s);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = `500 ${Math.round(20 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, 56 * s, pY + 76 * s, w - 112 * s, 28 * s);
}

/* Layout 4: Shock Breaking Notification (iOS Glass Push Banner) */
function drawReelFakeNotificationLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // iOS Push Notification Glass Card
  const notifY = 70 * s;
  const notifH = 170 * s;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 25 * s;
  roundRect(ctx, 32 * s, notifY, w - 64 * s, notifH, 26 * s);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5 * s;
  roundRect(ctx, 32 * s, notifY, w - 64 * s, notifH, 26 * s);
  ctx.stroke();

  // App Icon & App Title
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, 52 * s, notifY + 18 * s, 36 * s, 36 * s, 10 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚨', 70 * s, notifY + 43 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(16 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('BREAKING NEWS ALERT', 100 * s, notifY + 34 * s);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 ${Math.round(12 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('NOW • NOTIFICATION', 100 * s, notifY + 50 * s);

  // Notification Message Body
  ctx.fillStyle = '#f8fafc';
  ctx.font = `700 ${Math.round(20 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, topHook, 52 * s, notifY + 88 * s, w - 104 * s, 26 * s);

  // Bottom Comment Card
  const botY = h - 220 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  roundRect(ctx, 32 * s, botY, w - 64 * s, 140 * s, 20 * s);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.font = `600 ${Math.round(14 * s)}px "Outfit", sans-serif`;
  ctx.fillText('💬 COMMUNITY REACTION', 52 * s, botY + 34 * s);
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 ${Math.round(19 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, 52 * s, botY + 70 * s, w - 104 * s, 26 * s);
}

/* Layout 5: Headline + Meme Reaction Collab */
function drawReelHeadlineReactionLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top Breaking News Banner
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, w, 80 * s);
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(22 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🚨 BREAKING NEWS COLLAB 🚨', w / 2, 48 * s);

  // White News Headline Card
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 24 * s, 100 * s, w - 48 * s, 160 * s, 18 * s);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 ${Math.round(24 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, topHook, w / 2, 148 * s, w - 80 * s, 32 * s);

  // Bottom Reaction Punchline
  const botY = h - 180 * s;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  roundRect(ctx, 30 * s, botY, w - 60 * s, 110 * s, 20 * s);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, 30 * s, botY, w - 60 * s, 110 * s, 20 * s);
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = `700 ${Math.round(22 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, caption, w / 2, botY + 50 * s, w - 90 * s, 30 * s);
}

/* Layout 6: Existential Dark Meme / High-Impact News Reel */
function drawReelDarkHumorLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Subtle dark vignette over video
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, w, h);

  // Sleek Glassmorphic Breaking News Card in Center
  const cardW = w - 60 * s;
  const cardX = 30 * s;
  const cardY = h / 2 - 220 * s;
  const cardH = 460 * s;

  // Dark glass backing
  ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 24 * s);
  ctx.fill();

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24 * s);
  ctx.stroke();

  // Top Badge Row
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, cardX + 28 * s, cardY + 24 * s, 175 * s, 34 * s, 17 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(13 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🔴 BREAKING NEWS', cardX + 115 * s, cardY + 46 * s);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  roundRect(ctx, cardX + 215 * s, cardY + 24 * s, 190 * s, 34 * s, 17 * s);
  ctx.fill();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `bold ${Math.round(12 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`⚡ ${(publisher || 'GLOBAL DESK').slice(0, 18).toUpperCase()}`, cardX + 310 * s, cardY + 46 * s);

  // 1. Full News Headline (Prominent, 2 to 3 lines)
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(28 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'left';
  const headEndY = wrapText(ctx, topHook, cardX + 28 * s, cardY + 105 * s, cardW - 56 * s, 38 * s, 3);

  // Subtle separator line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(cardX + 28 * s, headEndY + 4 * s, cardW - 56 * s, 1.5 * s);

  // 2. 2-3 Line Factual News Description
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `500 ${Math.round(19 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  wrapText(ctx, caption, cardX + 28 * s, headEndY + 32 * s, cardW - 56 * s, 27 * s, 4);

  // Footer Tag
  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 ${Math.round(13 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('⚡ Real-Time Global Updates • Follow for More', w / 2, cardY + cardH - 24 * s);
}

/* Layout 7: Simulation Glitch / Error 404 */
function drawReelSimulationGlitchLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // CRT Scanlines
  ctx.fillStyle = 'rgba(0, 255, 200, 0.03)';
  for (let y = 0; y < h; y += 8 * s) {
    ctx.fillRect(0, y, w, 2 * s);
  }

  // Glitch Alert Card
  const gY = 80 * s;
  ctx.fillStyle = 'rgba(10, 10, 25, 0.95)';
  roundRect(ctx, 30 * s, gY, w - 60 * s, 260 * s, 16 * s);
  ctx.fill();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, 30 * s, gY, w - 60 * s, 260 * s, 16 * s);
  ctx.stroke();

  // Glitch Error Badge
  ctx.fillStyle = '#06b6d4';
  roundRect(ctx, 50 * s, gY + 20 * s, 180 * s, 32 * s, 8 * s);
  ctx.fill();
  ctx.fillStyle = '#082f49';
  ctx.font = `800 ${Math.round(13 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('ERR: BREAKING_REPORT', 140 * s, gY + 41 * s);

  // Glitch Text RGB Shift (Full Headline)
  ctx.textAlign = 'left';
  ctx.font = `800 ${Math.round(27 * s)}px "Outfit", sans-serif`;
  ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
  wrapText(ctx, topHook, 52 * s, gY + 92 * s, w - 100 * s, 35 * s, 3);
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, topHook, 50 * s, gY + 90 * s, w - 100 * s, 35 * s, 3);

  // Explanation Punchline / 2-3 Line Description
  const bY = h - 240 * s;
  ctx.fillStyle = 'rgba(10, 10, 25, 0.92)';
  roundRect(ctx, 30 * s, bY, w - 60 * s, 160 * s, 16 * s);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.font = `600 ${Math.round(14 * s)}px monospace`;
  ctx.fillText('// DEVELOPING STORY DETAILS', 50 * s, bY + 34 * s);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `500 ${Math.round(19 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, 50 * s, bY + 70 * s, w - 100 * s, 26 * s, 3);
}

/* Layout 8: Split-Screen News Card */
function drawReelSplitLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  const cardH = 540 * s;

  // 1. Top Card Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, cardH);

  // Top Tag & Publisher Row
  ctx.fillStyle = '#dc2626';
  roundRect(ctx, 40 * s, 42 * s, 180 * s, 34 * s, 17 * s);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(14 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🔴 BREAKING NEWS', 130 * s, 65 * s);

  ctx.fillStyle = '#f1f5f9';
  roundRect(ctx, 230 * s, 42 * s, 190 * s, 34 * s, 17 * s);
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.font = `bold ${Math.round(13 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`⚡ ${(publisher || 'GLOBAL NEWS').slice(0, 18).toUpperCase()}`, 325 * s, 65 * s);

  // 1. Full Headline (prominent, 2 to 3 lines)
  ctx.fillStyle = '#0f172a';
  ctx.font = `900 ${Math.round(30 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'left';
  const headEndY = wrapText(ctx, topHook, 40 * s, 122 * s, w - 80 * s, 38 * s, 3);

  // Subtle separator line
  ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
  ctx.fillRect(40 * s, headEndY + 4 * s, w - 80 * s, 2 * s);

  // 2. 2-3 Line Factual News Description
  ctx.fillStyle = '#334155';
  ctx.font = `500 ${Math.round(20 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  wrapText(ctx, caption, 40 * s, headEndY + 32 * s, w - 80 * s, 28 * s, 3);

  // Sleek Divider between card and video
  const grad = ctx.createLinearGradient(0, cardH - 4 * s, w, cardH + 4 * s);
  grad.addColorStop(0, '#f43f5e');
  grad.addColorStop(0.5, '#8b5cf6');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, cardH - 2 * s, w, 4 * s);

  // Bottom Video Section
  const videoY = cardH + 2 * s;
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

/* Layout 9: TV Broadcast Chyron */
function drawReelChyronLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top Live Watermark
  ctx.fillStyle = '#dc2626';
  roundRect(ctx, 40 * s, 60 * s, 110 * s, 38 * s, 8 * s);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(17 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🔴 LIVE', 95 * s, 85 * s);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, 160 * s, 60 * s, 210 * s, 38 * s, 8 * s);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = `bold ${Math.round(14 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('GLOBAL REEL FEED', 175 * s, 85 * s);

  // Top Hook Overlay with Shadow (Headline)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 14 * s;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(30 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, topHook, w / 2, 160 * s, w - 80 * s, 38 * s, 3);
  ctx.shadowColor = 'transparent';

  // Lower Third Chyron
  const chyronY = h - 350 * s;

  // Red Header Bar
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, chyronY, w, 52 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(26 * s)}px "Outfit", Impact, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`⚡ BREAKING NEWS: ${(publisher || 'WORLD DESK').toUpperCase()}`, 40 * s, chyronY + 36 * s);

  // Navy Headline Container (fits 2-3 lines of description)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fillRect(0, chyronY + 52 * s, w, 190 * s);

  ctx.fillStyle = '#f8fafc';
  ctx.font = `500 ${Math.round(21 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  wrapText(ctx, caption, 40 * s, chyronY + 95 * s, w - 80 * s, 30 * s, 3);

  // Animated Scrolling Bottom Ticker
  const tickerY = chyronY + 242 * s;
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, tickerY, w, 50 * s);

  const tickerText = `🚨 DEVELOPING STORY • ${caption} • LIVE WORLD BROADCAST • FOLLOW FOR MORE REELS 🚨`;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(17 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(tickerText, 40 * s - (reelState.tickerOffset % 900), tickerY + 32 * s);
}

/* Layout 10: Frosted Glass POV Card */
function drawReelGlassCardLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Floating Glass Card
  const cardX = 40 * s;
  const cardY = 320 * s;
  const cardW = w - 80 * s;
  const cardH = 560 * s;

  // Glass backdrop
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 24 * s);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24 * s);
  ctx.stroke();

  // Profile Header Row
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(cardX + 45 * s, cardY + 50 * s, 24 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(22 * s)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('📰', cardX + 45 * s, cardY + 58 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(20 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('@TodayInNews', cardX + 85 * s, cardY + 48 * s);

  ctx.fillStyle = '#38bdf8';
  ctx.font = `bold ${Math.round(15 * s)}px sans-serif`;
  ctx.fillText('✓ Verified', cardX + 85 * s, cardY + 70 * s);

  // Top Hook
  ctx.fillStyle = '#38bdf8';
  ctx.font = `900 ${Math.round(30 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'left';
  wrapText(ctx, topHook, cardX + 35 * s, cardY + 130 * s, cardW - 70 * s, 38 * s);

  // Main Caption Quote
  ctx.fillStyle = '#f8fafc';
  ctx.font = `600 ${Math.round(27 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  wrapText(ctx, `“${caption}”`, cardX + 35 * s, cardY + 240 * s, cardW - 70 * s, 38 * s);

  // Engagement stats footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(cardX + 25 * s, cardY + cardH - 70 * s, cardW - 50 * s, 1);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold ${Math.round(16 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('❤️ 248.5K     💬 14.2K     🔁 58.1K     🔖 92.4K', cardX + 35 * s, cardY + cardH - 30 * s);
}

/* Layout 11: Classic Impact Meme */
function drawReelImpactLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  ctx.font = `900 ${Math.round(52 * s)}px Impact, "Arial Black", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 10 * s;
  ctx.textAlign = 'center';

  if (topHook) {
    drawStrokedText(ctx, topHook.toUpperCase(), w / 2, 140 * s, w - 80 * s, 60 * s);
  }

  if (caption) {
    ctx.font = `900 ${Math.round(44 * s)}px Impact, "Arial Black", sans-serif`;
    drawStrokedText(ctx, caption.toUpperCase(), w / 2, h - 140 * s, w - 80 * s, 52 * s);
  }
}

/* Layout 12: Dark X / Tweet Card */
function drawReelTweetDarkLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  const cardX = 40 * s;
  const cardY = 300 * s;
  const cardW = w - 80 * s;
  const cardH = 540 * s;

  // OLED dark card
  ctx.fillStyle = 'rgba(10, 10, 15, 0.94)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 24 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24 * s);
  ctx.stroke();

  // User Header
  ctx.fillStyle = '#1d9bf0';
  ctx.beginPath();
  ctx.arc(cardX + 50 * s, cardY + 55 * s, 25 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(20 * s)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('𝕏', cardX + 50 * s, cardY + 62 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(22 * s)}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Daily Wisdom', cardX + 90 * s, cardY + 50 * s);

  ctx.fillStyle = '#71767b';
  ctx.font = `400 ${Math.round(16 * s)}px "Inter", sans-serif`;
  ctx.fillText('@DailyWisdom · 2h', cardX + 90 * s, cardY + 74 * s);

  // Tweet Body
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.round(30 * s)}px "Inter", sans-serif`;
  wrapText(ctx, topHook, cardX + 35 * s, cardY + 140 * s, cardW - 70 * s, 42 * s);

  ctx.fillStyle = '#e7e9ea';
  ctx.font = `400 ${Math.round(22 * s)}px "Inter", sans-serif`;
  wrapText(ctx, caption, cardX + 35 * s, cardY + 270 * s, cardW - 70 * s, 32 * s);

  // Engagement row
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(cardX + 25 * s, cardY + cardH - 65 * s, cardW - 50 * s, 1);
  ctx.fillStyle = '#71767b';
  ctx.font = `500 ${Math.round(15 * s)}px "Inter", sans-serif`;
  ctx.fillText('🔁 45.2K Reposts      ❤️ 182.4K Likes      🔖 24.1K Bookmarks', cardX + 35 * s, cardY + cardH - 26 * s);
}

/* Layout 13: Cinematic 2.39:1 Letterbox */
function drawReelCinematicLetterboxLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Anamorphic black bars top & bottom
  const barH = 180 * s;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  // Top letterspaced title
  ctx.fillStyle = '#d97706';
  ctx.font = `600 ${Math.round(15 * s)}px "Cinzel", serif`;
  ctx.textAlign = 'center';
  ctx.fillText('C I N E M A T I C   S E R I E S', w / 2, barH - 40 * s);

  // Center movie title hook
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 18 * s;
  ctx.fillStyle = '#ffffff';
  ctx.font = `italic 700 ${Math.round(40 * s)}px "Playfair Display", serif`;
  wrapText(ctx, topHook, w / 2, h / 2 - 30 * s, w - 100 * s, 52 * s);
  ctx.shadowColor = 'transparent';

  // Bottom classic movie yellow subtitles
  ctx.font = `600 ${Math.round(24 * s)}px "Courier Prime", "Inter", sans-serif`;
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4 * s;
  drawStrokedText(ctx, `“${caption}”`, w / 2, h - barH - 40 * s, w - 80 * s, 32 * s);

  // Director note
  ctx.fillStyle = '#78716c';
  ctx.font = `500 ${Math.round(13 * s)}px "Outfit", sans-serif`;
  ctx.fillText('DIR. MASTER STUDIO • 4K 24FPS CINEMATIC', w / 2, h - 30 * s);
}

/* Layout 14: Minimalist Dark Poetry */
function drawReelMinimalistPoetryLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, 200 * s, w / 2, h / 2, 600 * s);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Poetic center quote
  ctx.fillStyle = '#ffffff';
  ctx.font = `italic 500 ${Math.round(38 * s)}px "Playfair Display", serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, topHook, w / 2, h / 2 - 60 * s, w - 120 * s, 52 * s);

  // Subtle separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 30 * s, h / 2 + 30 * s);
  ctx.lineTo(w / 2 + 30 * s, h / 2 + 30 * s);
  ctx.stroke();

  // Caption in typewriter font
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `400 ${Math.round(20 * s)}px "Courier Prime", monospace`;
  wrapText(ctx, caption, w / 2, h / 2 + 80 * s, w - 140 * s, 30 * s);

  // Signoff
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = `italic ${Math.round(16 * s)}px "Playfair Display", serif`;
  ctx.fillText('— quiet reflections', w / 2, h - 80 * s);
}

/* Layout 15: Retro 90s VHS Camcorder */
function drawReelRetroVhsLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Scanlines overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let y = 0; y < h; y += 4 * s) {
    ctx.fillRect(0, y, w, 1 * s);
  }

  // Top Left PLAY / SP
  ctx.fillStyle = '#4ade80';
  ctx.font = `bold ${Math.round(24 * s)}px "Courier Prime", monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('PLAY ▶', 40 * s, 70 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(18 * s)}px "Courier Prime", monospace`;
  ctx.fillText('SP', 160 * s, 70 * s);

  // Top Right Blinking REC
  const blink = Math.floor(Date.now() / 600) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(w - 110 * s, 64 * s, 9 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ef4444';
  ctx.font = `bold ${Math.round(22 * s)}px "Courier Prime", monospace`;
  ctx.fillText('REC', w - 90 * s, 70 * s);

  // Bottom VHS Subtitles
  ctx.font = `900 ${Math.round(36 * s)}px "Courier Prime", Impact, sans-serif`;
  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6 * s;
  ctx.textAlign = 'center';
  drawStrokedText(ctx, topHook.toUpperCase(), w / 2, h - 220 * s, w - 80 * s, 44 * s);

  ctx.font = `bold ${Math.round(24 * s)}px "Courier Prime", monospace`;
  ctx.fillStyle = '#ffffff';
  drawStrokedText(ctx, caption, w / 2, h - 140 * s, w - 100 * s, 32 * s);

  // VHS Timestamp Bottom Left
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(20 * s)}px "Courier Prime", monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('OCT 12 1998  00:24:19', 40 * s, h - 50 * s);
}

/* Layout 16: Neon Cyberpunk / Glow */
function drawReelNeonCyberpunkLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Glowing Cyber Brackets
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3 * s;
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 16 * s;

  // Corners
  const pad = 30 * s, len = 60 * s;
  ctx.beginPath();
  ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad);
  ctx.moveTo(w - pad - len, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + len);
  ctx.moveTo(pad, h - pad - len); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + len, h - pad);
  ctx.moveTo(w - pad - len, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - len);
  ctx.stroke();

  // Top Cyber Pill
  ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
  roundRect(ctx, w / 2 - 140 * s, 60 * s, 280 * s, 38 * s, 10 * s);
  ctx.fill();
  ctx.fillStyle = '#22d3ee';
  ctx.font = `900 ${Math.round(15 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('// OVERRIDE PROTOCOL 2077 //', w / 2, 85 * s);

  // Cyber Headline with Glow
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 24 * s;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(42 * s)}px "Outfit", sans-serif`;
  wrapText(ctx, topHook.toUpperCase(), w / 2, h / 2 - 40 * s, w - 100 * s, 52 * s);

  // Magenta Sub-box
  ctx.shadowColor = '#ec4899';
  ctx.shadowBlur = 18 * s;
  ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
  roundRect(ctx, 40 * s, h - 220 * s, w - 80 * s, 120 * s, 16 * s);
  ctx.fill();
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, 40 * s, h - 220 * s, w - 80 * s, 120 * s, 16 * s);
  ctx.stroke();

  ctx.fillStyle = '#fdf2f8';
  ctx.font = `bold ${Math.round(22 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, w / 2, h - 170 * s, w - 120 * s, 30 * s);
  ctx.shadowColor = 'transparent';
}

/* Layout 17: Viral Podcast Subtitle Clip */
function drawReelPodcastClipLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top Speaker Tag
  ctx.fillStyle = '#8b5cf6';
  roundRect(ctx, 40 * s, 60 * s, 240 * s, 40 * s, 20 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(15 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🎙️ EPISODE HIGHLIGHT', 160 * s, 85 * s);

  // Animated Audio Waveform at bottom
  const waveY = h - 280 * s;
  const numBars = 16;
  const barW = 8 * s;
  const spacing = 12 * s;
  const startX = w / 2 - (numBars * (barW + spacing)) / 2;

  ctx.fillStyle = '#ec4899';
  for (let i = 0; i < numBars; i++) {
    const waveH = (Math.sin(reelState.waveformPhase + i * 0.45) * 0.5 + 0.5) * 45 * s + 10 * s;
    ctx.fillRect(startX + i * (barW + spacing), waveY - waveH / 2, barW, waveH);
  }

  // Giant High-Contrast Keyword Subtitle Box
  const subY = h - 200 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  roundRect(ctx, 30 * s, subY, w - 60 * s, 130 * s, 20 * s);
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, 30 * s, subY, w - 60 * s, 130 * s, 20 * s);
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  ctx.font = `900 ${Math.round(28 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, topHook, w / 2, subY + 45 * s, w - 100 * s, 36 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.round(18 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, w / 2, subY + 95 * s, w - 100 * s, 26 * s);
}

/* Layout 18: Reddit Story Confession */
function drawReelRedditStoryLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  const cardX = 40 * s;
  const cardY = 320 * s;
  const cardW = w - 80 * s;
  const cardH = 500 * s;

  // Reddit Dark Card
  ctx.fillStyle = 'rgba(26, 26, 27, 0.95)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 20 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX, cardY, cardW, cardH, 20 * s);
  ctx.stroke();

  // Reddit Icon & Subreddit
  ctx.fillStyle = '#ff4500';
  ctx.beginPath();
  ctx.arc(cardX + 45 * s, cardY + 45 * s, 20 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(16 * s)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🤖', cardX + 45 * s, cardY + 52 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(18 * s)}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('r/AskReddit', cardX + 75 * s, cardY + 42 * s);

  ctx.fillStyle = '#818384';
  ctx.font = `400 ${Math.round(14 * s)}px "Inter", sans-serif`;
  ctx.fillText('Posted by u/deep_mind · 5h ago', cardX + 75 * s, cardY + 62 * s);

  // Story Question Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(28 * s)}px "Inter", sans-serif`;
  wrapText(ctx, topHook, cardX + 30 * s, cardY + 120 * s, cardW - 60 * s, 38 * s);

  // Story Paragraph
  ctx.fillStyle = '#d7dadc';
  ctx.font = `400 ${Math.round(20 * s)}px "Inter", sans-serif`;
  wrapText(ctx, caption, cardX + 30 * s, cardY + 240 * s, cardW - 60 * s, 30 * s);

  // Upvote Pill Footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, cardX + 30 * s, cardY + cardH - 65 * s, 140 * s, 38 * s, 19 * s);
  ctx.fill();
  ctx.fillStyle = '#ff4500';
  ctx.font = `bold ${Math.round(16 * s)}px "Inter", sans-serif`;
  ctx.fillText('▲ 48.2k ▼', cardX + 50 * s, cardY + cardH - 40 * s);
}

/* Layout 19: Before vs After Split */
function drawReelBeforeAfterLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top VS comparison pill
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, 40 * s, 60 * s, 180 * s, 42 * s, 21 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(16 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('◀ BEFORE', 130 * s, 87 * s);

  ctx.fillStyle = '#10b981';
  roundRect(ctx, w - 220 * s, 60 * s, 180 * s, 42 * s, 21 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AFTER ▶', w - 130 * s, 87 * s);

  // Center VS Circle Badge
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 42 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 42 * s, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = `900 ${Math.round(24 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('VS', w / 2, h / 2 + 8 * s);

  // Bottom Transformation Headline Card
  const boxY = h - 240 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  roundRect(ctx, 30 * s, boxY, w - 60 * s, 160 * s, 20 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 30 * s, boxY, w - 60 * s, 160 * s, 20 * s);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(28 * s)}px "Outfit", sans-serif`;
  wrapText(ctx, topHook, w / 2, boxY + 50 * s, w - 100 * s, 36 * s);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 ${Math.round(18 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, w / 2, boxY + 110 * s, w - 100 * s, 26 * s);
}

/* Layout 20: Dark Stoic Titan Motivation */
function drawReelMotivationalTitanLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Heavy dark vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, 200 * s, w / 2, h / 2, 600 * s);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Top Stoic Banner
  ctx.fillStyle = '#f59e0b';
  roundRect(ctx, w / 2 - 130 * s, 60 * s, 260 * s, 38 * s, 8 * s);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = `900 ${Math.round(15 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('✦ STOIC RULE #1 ✦', w / 2, 85 * s);

  // Giant Upper Case Font (Bebas Neue / Impact)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 18 * s;
  ctx.fillStyle = '#fbbf24';
  ctx.font = `900 ${Math.round(48 * s)}px "Bebas Neue", Impact, sans-serif`;
  wrapText(ctx, topHook.toUpperCase(), w / 2, h / 2 - 60 * s, w - 80 * s, 54 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(38 * s)}px "Bebas Neue", Impact, sans-serif`;
  wrapText(ctx, caption.toUpperCase(), w / 2, h / 2 + 60 * s, w - 100 * s, 44 * s);
  ctx.shadowColor = 'transparent';

  // Bottom rule
  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold ${Math.round(15 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('SILENCE IS POWER • WORK IN THE SHADOWS', w / 2, h - 70 * s);
}

// Layout Router for all 20 patterns

/* Layout 12: r/Confessions Midnight Secret */
function drawReelRedditConfessionLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Reddit Dark Mode Confession Card
  const cY = 80 * s;
  const cH = 240 * s;
  ctx.fillStyle = 'rgba(18, 24, 38, 0.95)';
  roundRect(ctx, 30 * s, cY, w - 60 * s, cH, 20 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 69, 0, 0.5)';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, 30 * s, cY, w - 60 * s, cH, 20 * s);
  ctx.stroke();

  // Reddit Badge & Karma
  ctx.fillStyle = '#ff4500';
  roundRect(ctx, 50 * s, cY + 20 * s, 150 * s, 32 * s, 16 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(13 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('r/Confessions 🤫', 125 * s, cY + 41 * s);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 ${Math.round(13 * s)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('⬆ 34.2k • 2.4k comments', w - 50 * s, cY + 41 * s);

  // Confession Hook
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(26 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'left';
  wrapText(ctx, topHook, 50 * s, cY + 92 * s, w - 100 * s, 34 * s);

  // Spoiler Bar Secret Body
  const bY = h - 260 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  roundRect(ctx, 30 * s, bY, w - 60 * s, 180 * s, 20 * s);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.font = `700 ${Math.round(14 * s)}px "Outfit", sans-serif`;
  ctx.fillText('🔒 UNFILTERED CONFESSION:', 50 * s, bY + 36 * s);
  ctx.fillStyle = '#f1f5f9';
  ctx.font = `500 ${Math.round(20 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, 50 * s, bY + 76 * s, w - 100 * s, 28 * s);
}

/* Layout 13: r/AITA Dramatic Thread */
function drawReelRedditAitaLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top AITA Card
  const aY = 70 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  roundRect(ctx, 30 * s, aY, w - 60 * s, 220 * s, 22 * s);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, 30 * s, aY, w - 60 * s, 220 * s, 22 * s);
  ctx.stroke();

  // AITA Verdict Stamp
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, 50 * s, aY + 20 * s, 170 * s, 32 * s, 16 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(13 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('⚖️ r/AmITheA**hole', 135 * s, aY + 41 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(24 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'left';
  wrapText(ctx, topHook, 50 * s, aY + 90 * s, w - 100 * s, 32 * s);

  // Bottom Community Verdict Poll Card
  const vY = h - 220 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  roundRect(ctx, 30 * s, vY, w - 60 * s, 140 * s, 20 * s);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.font = `700 ${Math.round(14 * s)}px "Outfit", sans-serif`;
  ctx.fillText('📊 TOP VERDICT COMMENTS:', 50 * s, vY + 36 * s);
  ctx.fillStyle = '#f8fafc';
  ctx.font = `500 ${Math.round(19 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, 50 * s, vY + 72 * s, w - 100 * s, 26 * s);
}

/* Layout 14: Multi-Clip Viral Montage */
function drawReelMashupMontageLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top Montage Cut Header
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, w, 70 * s);
  ctx.fillStyle = '#a855f7';
  ctx.font = `900 ${Math.round(16 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🎬 MULTI-CLIP COLLAB MASHUP', w / 2, 42 * s);

  // Center Drop Text
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 24 * s;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(40 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, topHook, w / 2, h / 2 - 40 * s, w - 80 * s, 50 * s);
  ctx.shadowColor = 'transparent';

  // Bottom Commentary
  const bY = h - 170 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  roundRect(ctx, 30 * s, bY, w - 60 * s, 100 * s, 20 * s);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.font = `700 ${Math.round(20 * s)}px "Outfit", sans-serif`;
  wrapText(ctx, caption, w / 2, bY + 54 * s, w - 100 * s, 28 * s);
}

/* Layout 15: Satisfying Brainrot Dual Split */
function drawReelBrainrotSubwayLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top Headline Card floating over top video
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 24 * s, 60 * s, w - 48 * s, 140 * s, 18 * s);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 ${Math.round(22 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, topHook, w / 2, 106 * s, w - 80 * s, 30 * s);

  // Brainrot divider stamp in the middle
  ctx.fillStyle = '#ec4899';
  roundRect(ctx, w / 2 - 120 * s, h / 2 - 20 * s, 240 * s, 40 * s, 20 * s);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(14 * s)}px "Outfit", sans-serif`;
  ctx.fillText('🛹 SATISFYING SPLIT', w / 2, h / 2 + 5 * s);

  // Bottom Subtitle bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  roundRect(ctx, 24 * s, h - 160 * s, w - 48 * s, 90 * s, 16 * s);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.font = `700 ${Math.round(18 * s)}px "Outfit", sans-serif`;
  wrapText(ctx, caption, w / 2, h - 110 * s, w - 80 * s, 26 * s);
}

/* Layout 16: PiP Reaction Commentary */
function drawReelPipCommentaryLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Top Headline Card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  roundRect(ctx, 30 * s, 60 * s, w - 60 * s, 150 * s, 20 * s);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2 * s;
  roundRect(ctx, 30 * s, 60 * s, w - 60 * s, 150 * s, 20 * s);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = `700 ${Math.round(13 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('🔴 LIVE REACTION STREAM', 50 * s, 94 * s);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(22 * s)}px "Outfit", sans-serif`;
  wrapText(ctx, topHook, 50 * s, 130 * s, w - 100 * s, 28 * s);

  // Floating Commentary Quote
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  roundRect(ctx, 30 * s, h - 180 * s, w * 0.52, 110 * s, 16 * s);
  ctx.fill();
  ctx.fillStyle = '#ec4899';
  ctx.font = `700 ${Math.round(13 * s)}px "Outfit", sans-serif`;
  ctx.fillText('SPEAKER COMMENTARY:', 44 * s, h - 150 * s);
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 ${Math.round(17 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, 44 * s, h - 122 * s, w * 0.48 - 20 * s, 24 * s);
}

/* Layout 10: Savage Reality Check */
function drawReelSavageRealityLayout(targetCtx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false) {
  const ctx = targetCtx || reelCtx;
  const s = w / 720;
  if (!overlayOnly) drawReelVideoBg(ctx, w, h, vid, hasVideo);

  // Brutal Crimson Warning Banner
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 60 * s, w, 50 * s);
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(18 * s)}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('⚠️ SAVAGE REALITY CHECK ⚠️', w / 2, 92 * s);

  // Truth Card
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 25 * s;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(36 * s)}px "Outfit", sans-serif`;
  wrapText(ctx, `"${topHook}"`, w / 2, h / 2 - 50 * s, w - 80 * s, 46 * s);
  ctx.shadowColor = 'transparent';

  // Bottom Reality Subtitle
  const bY = h - 200 * s;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  roundRect(ctx, 30 * s, bY, w - 60 * s, 120 * s, 20 * s);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.font = `700 ${Math.round(20 * s)}px "Plus Jakarta Sans", sans-serif`;
  wrapText(ctx, caption, w / 2, bY + 62 * s, w - 90 * s, 28 * s);
}

function renderSelectedLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly = false, layoutOverride = null) {
  try {
  const activeLayout = layoutOverride || reelState.layout;
  switch (activeLayout) {
    case 'reel_split':
      drawReelSplitLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_chyron':
      drawReelChyronLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_unusual_whales':
      drawReelUnusualWhalesLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_fake_notification':
      drawReelFakeNotificationLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_headline_reaction':
      drawReelHeadlineReactionLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_dark_humor':
      drawReelDarkHumorLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_impact':
      drawReelImpactLayout(ctx, w, h, vid, hasVideo, topHook, caption, overlayOnly);
      break;
    case 'reel_simulation_glitch':
      drawReelSimulationGlitchLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_tweet_dark':
      drawReelTweetDarkLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_savage_reality':
      drawReelSavageRealityLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_reddit_story':
      drawReelRedditStoryLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_reddit_confession':
      drawReelRedditConfessionLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_reddit_aita':
      drawReelRedditAitaLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_mashup_montage':
      drawReelMashupMontageLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_brainrot_subway':
      drawReelBrainrotSubwayLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_pip_commentary':
      drawReelPipCommentaryLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_before_after':
      drawReelBeforeAfterLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_podcast_clip':
      drawReelPodcastClipLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_retro_vhs':
      drawReelRetroVhsLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    case 'reel_neon_cyberpunk':
      drawReelNeonCyberpunkLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
    default:
      drawReelSplitLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
      break;
  }
  } catch (err) {
    console.warn('[REEL RENDER] Handled layout error gracefully:', err);
    try {
      drawReelSplitLayout(ctx, w, h, vid, hasVideo, topHook, caption, publisher, overlayOnly);
    } catch (e2) {}
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
  ctx.fillText('Loading 9:16 HD Video...', x + w / 2, y + h / 2 + 50);

  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Paste Reel URL, upload file, or search footage', x + w / 2, y + h / 2 + 82);
}

// Generate transparent overlay PNG (1080x1920 Full HD or 720x1280 Fast HD)
function getReelOverlayDataUrl(customData = null) {
  const is1080 = (customData?.quality || reelState.quality) === 'hd1080';
  const w = is1080 ? 1080 : 720;
  const h = is1080 ? 1920 : 1280;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const ctx = offCanvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const topHook = customData?.topHook || reelState.topHook || 'BREAKING: Nobody noticed this glitch in the simulation';
  const caption = customData?.caption || reelState.caption || state.selectedArticle?.title || 'When the truth hits harder than your morning coffee.';
  const publisher = customData?.publisher || state.selectedArticle?.publisher || 'TODAY MEMER';
  const layout = customData?.layout || reelState.layout;

  renderSelectedLayout(ctx, w, h, null, false, topHook, caption, publisher, true, layout);
  return offCanvas.toDataURL('image/png');
}

// 8. Export Reel to MP4 Video (High-Definition Server Composite)
async function exportReelVideo() {
  if (reelState.isExporting) return;
  reelState.isExporting = true;
  elements.exportProgressBar.style.display = 'block';
  elements.exportProgressFill.style.width = '20%';
  const isFullHd = reelState.quality === 'hd1080';
  elements.exportProgressText.textContent = `Rendering ${isFullHd ? '1080x1920 Full HD Master' : '720x1280 HD'} Reel...`;
  elements.exportReelBtn.disabled = true;

  try {
    let videoName = 'sample_reel.mp4';
    if (elements.reelVideoSource && elements.reelVideoSource.src) {
      const match = elements.reelVideoSource.src.match(/name=([^&]+)/);
      if (match) videoName = decodeURIComponent(match[1]);
    }

    const overlay = getReelOverlayDataUrl();
    elements.exportProgressFill.style.width = '55%';
    elements.exportProgressText.textContent = `Encoding crisp 60fps MP4 with ${reelState.colorGrade} grade...`;

    const res = await fetch('/api/render-reel-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_name: videoName,
        clips: reelState.clips || [],
        collab_mode: reelState.collabMode || 'sequence',
        quality_enhancement: reelState.qualityEnhance !== false,
        overlay: overlay,
        layout: reelState.layout,
        duration: reelState.duration || 12,
        quality: reelState.quality || 'hd1080',
        color_grade: reelState.colorGrade || 'none'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Server render failed');
    }

    elements.exportProgressFill.style.width = '95%';
    elements.exportProgressText.textContent = 'Finalizing HD Reel Download...';

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
    elements.exportProgressText.textContent = `✅ ${isFullHd ? '1080p Master' : 'HD'} Export Complete!`;
    showToast(`🎉 ${isFullHd ? '1080p Full HD Master' : 'HD'} Reel exported and downloaded!`, 'success');

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
            duration: reelState.duration || 12,
            quality: reelState.quality || 'hd1080',
            color_grade: reelState.colorGrade || 'none'
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

/* ==========================================================================
   BATCH REEL STUDIO & 1-CLICK INSTAGRAM AUTO-POST WORKFLOW
   ========================================================================== */
const BATCH_PATTERNS = [
  'reel_split',
  'reel_chyron',
  'reel_unusual_whales',
  'reel_dark_humor',
  'reel_fake_notification',
  'reel_tweet_dark',
  'reel_simulation_glitch',
  'reel_reddit_story',
  'reel_savage_reality',
  'reel_headline_reaction',
  'reel_retro_vhs',
  'reel_neon_cyberpunk',
  'reel_reddit_confession',
  'reel_reddit_aita',
  'reel_brainrot_subway',
  'reel_podcast_clip',
  'reel_before_after',
  'reel_impact'
];

const batchState = {
  isRunning: false,
  queue: [],
  currentIndex: 0,
  results: [],
  timerInterval: null,
  startTime: 0
};

function formatPatternName(layout) {
  const map = {
    'reel_split': 'Split Breaking News',
    'reel_chyron': 'Live TV Chyron',
    'reel_unusual_whales': 'Unusual Whales Alert',
    'reel_fake_notification': 'Viral Push Notification',
    'reel_dark_humor': 'Existential Dark Meme',
    'reel_simulation_glitch': 'Simulation Glitch Matrix',
    'reel_tweet_dark': 'OLED Dark Mode Tweet',
    'reel_savage_reality': 'Savage Reality Check',
    'reel_reddit_story': 'r/AskReddit Storytime',
    'reel_reddit_confession': 'r/Confession Secrets',
    'reel_reddit_aita': 'r/AITA Drama Story',
    'reel_headline_reaction': 'Headline Reaction Collab',
    'reel_retro_vhs': 'Retro 90s VHS Camcorder',
    'reel_neon_cyberpunk': 'Cyberpunk Neon HUD',
    'reel_brainrot_subway': 'Brainrot Subway Collab',
    'reel_podcast_clip': 'Podcast Wisdom Highlight',
    'reel_before_after': 'Expectation vs Reality',
    'reel_impact': 'Impact Meme Classic'
  };
  return map[layout] || 'Split Breaking News';
}

function extractSearchKeywords(title) {
  if (!title) return 'breaking news footage 4k';
  const clean = title.replace(/[^\w\s]/g, ' ');
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'after', 'into', 'over', 'says', 'said', 'will', 'what', 'when', 'where', 'how', 'today', 'news', 'amid', 'first', 'about']);
  const words = clean.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));
  return words.slice(0, 4).join(' ') || title.slice(0, 30);
}

function getPatternForIndex(strategy, idx) {
  if (!strategy || strategy === 'cycle') {
    return BATCH_PATTERNS[idx % BATCH_PATTERNS.length];
  }
  if (strategy === 'random') {
    return BATCH_PATTERNS[Math.floor(Math.random() * BATCH_PATTERNS.length)];
  }
  return strategy;
}

function toggleArticleBatchSelection(article, isSelected) {
  if (!article || !article.url) return;
  if (isSelected) {
    const customUrl = state.cardManualUrls.get(article.url) || '';
    state.selectedNewsForBatch.set(article.url, {
      ...article,
      manualVideoUrl: customUrl,
      related_coverage: article.related_coverage || []
    });
  } else {
    state.selectedNewsForBatch.delete(article.url);
  }
  updateBatchSelectionUI();
}

function selectAllNews(shouldSelect = true) {
  if (shouldSelect) {
    state.clusters.forEach(cluster => {
      if (cluster && cluster.main_story) {
        const lead = cluster.main_story;
        const customUrl = state.cardManualUrls.get(lead.url) || '';
        state.selectedNewsForBatch.set(lead.url, {
          ...lead,
          manualVideoUrl: customUrl,
          related_coverage: cluster.related_coverage || lead.related_coverage || []
        });
      }
    });
  } else {
    state.selectedNewsForBatch.clear();
  }

  // Sync all DOM checkboxes & cards
  const checkboxes = document.querySelectorAll('.news-card-select-cb');
  checkboxes.forEach(cb => {
    cb.checked = shouldSelect;
    const card = cb.closest('.news-card');
    if (card) card.classList.toggle('card-batch-selected', shouldSelect);
  });

  updateBatchSelectionUI();
}

function selectTopNNews(n = 5) {
  state.selectedNewsForBatch.clear();
  const subset = state.clusters.slice(0, n);
  const selectedUrls = new Set();
  subset.forEach(cluster => {
    if (cluster && cluster.main_story) {
      const lead = cluster.main_story;
      selectedUrls.add(lead.url);
      const customUrl = state.cardManualUrls.get(lead.url) || '';
      state.selectedNewsForBatch.set(lead.url, {
        ...lead,
        manualVideoUrl: customUrl,
        related_coverage: cluster.related_coverage || lead.related_coverage || []
      });
    }
  });

  // Sync checkboxes in DOM
  const checkboxes = document.querySelectorAll('.news-card-select-cb');
  checkboxes.forEach(cb => {
    const isChecked = selectedUrls.has(cb.dataset.url);
    cb.checked = isChecked;
    const card = cb.closest('.news-card');
    if (card) card.classList.toggle('card-batch-selected', isChecked);
  });

  updateBatchSelectionUI();
}

function updateBatchSelectionUI() {
  const count = state.selectedNewsForBatch.size;
  const total = state.clusters.length;

  if (elements.batchSelectedCountPill) {
    elements.batchSelectedCountPill.textContent = `${count} selected`;
    elements.batchSelectedCountPill.classList.toggle('has-selection', count > 0);
  }

  if (elements.batchBtnCountBadge) {
    elements.batchBtnCountBadge.textContent = count;
    elements.batchBtnCountBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  if (elements.selectAllNewsCheckbox) {
    elements.selectAllNewsCheckbox.checked = total > 0 && count === total;
    elements.selectAllNewsCheckbox.indeterminate = count > 0 && count < total;
  }

  if (elements.batchModalCountBadge) {
    elements.batchModalCountBadge.textContent = `${count} Stories Selected`;
  }

  if (elements.startBatchCount) {
    elements.startBatchCount.textContent = count;
  }
}

function openBatchReelModal() {
  // If nothing selected, auto-select top 5 stories as smart convenience
  if (state.selectedNewsForBatch.size === 0 && state.clusters.length > 0) {
    selectTopNNews(Math.min(5, state.clusters.length));
    showToast('Auto-selected top 5 news stories for batch reel creation', 'info');
  }

  if (state.selectedNewsForBatch.size === 0) {
    showToast('Please wait for news feeds to load or select articles first.', 'warning');
    return;
  }

  // Reset to Screen 1 (Setup)
  if (elements.batchScreenSetup) elements.batchScreenSetup.style.display = 'block';
  if (elements.batchScreenRunning) elements.batchScreenRunning.style.display = 'none';
  if (elements.batchScreenSummary) elements.batchScreenSummary.style.display = 'none';

  updateBatchSelectionUI();
  renderBatchArticlesPreview();
  updateBatchIgStatusUI();

  if (elements.batchReelModal) {
    showModalElement(elements.batchReelModal);
  }
}

function closeBatchReelModal() {
  if (batchState.isRunning) {
    const ok = confirm('A batch reel creation workflow is currently in progress. Stop and close?');
    if (!ok) return;
    stopBatchWorkflow();
  }
  if (elements.batchReelModal) {
    hideModalElement(elements.batchReelModal);
  }
}

function updateBatchIgStatusUI() {
  if (elements.batchIgConnectedBox && elements.batchIgDisconnectedBox) {
    if (igState.connected) {
      elements.batchIgConnectedBox.style.display = 'flex';
      elements.batchIgDisconnectedBox.style.display = 'none';
      if (elements.batchIgUsernameLabel) {
        elements.batchIgUsernameLabel.textContent = `@${igState.username || 'connected'}`;
      }
    } else {
      elements.batchIgConnectedBox.style.display = 'none';
      elements.batchIgDisconnectedBox.style.display = 'block';
    }
  }
}

function renderBatchArticlesPreview() {
  if (!elements.batchArticlesPreviewList) return;
  elements.batchArticlesPreviewList.innerHTML = '';

  const strategy = elements.batchPatternStrategy?.value || 'cycle';
  let idx = 0;

  state.selectedNewsForBatch.forEach(article => {
    const pattern = getPatternForIndex(strategy, idx);
    const chip = document.createElement('div');
    chip.className = 'batch-article-chip';
    chip.innerHTML = `
      <div class="batch-chip-meta">
        <span class="batch-chip-source">${escapeHtml(article.publisher || 'News')}</span>
        <span class="batch-chip-pattern">🎬 ${formatPatternName(pattern)}</span>
      </div>
      <div class="batch-chip-title">${escapeHtml(article.title)}</div>
    `;
    elements.batchArticlesPreviewList.appendChild(chip);
    idx++;
  });
}

function setupBatchEventListeners() {
  // Select All Checkbox in action bar
  if (elements.selectAllNewsCheckbox) {
    elements.selectAllNewsCheckbox.addEventListener('change', (e) => {
      selectAllNews(e.target.checked);
    });
  }

  // Quick Action Buttons
  if (elements.batchSelectAllBtn) {
    elements.batchSelectAllBtn.addEventListener('click', () => selectAllNews(true));
  }
  if (elements.batchSelectTop5Btn) {
    elements.batchSelectTop5Btn.addEventListener('click', () => selectTopNNews(5));
  }
  if (elements.batchDeselectAllBtn) {
    elements.batchDeselectAllBtn.addEventListener('click', () => selectAllNews(false));
  }

  // Open modal button
  if (elements.batchCreateReelsBtn) {
    elements.batchCreateReelsBtn.addEventListener('click', openBatchReelModal);
  }

  // Close modal button
  if (elements.closeBatchReelBtn) {
    elements.closeBatchReelBtn.addEventListener('click', closeBatchReelModal);
  }

  // Radio toggles for video source
  const autoRadio = elements.batchVideoSourceAuto;
  const manualRadio = elements.batchVideoSourceManual;
  const autoLabel = elements.videoSourceAutoLabel;
  const manualLabel = elements.videoSourceManualLabel;
  const manualWrap = elements.batchManualUrlWrap;

  function syncVideoRadio() {
    const isManual = manualRadio && manualRadio.checked;
    if (autoLabel) autoLabel.classList.toggle('active', !isManual);
    if (manualLabel) manualLabel.classList.toggle('active', isManual);
    if (manualWrap) manualWrap.style.display = isManual ? 'block' : 'none';
  }

  if (autoRadio) autoRadio.addEventListener('change', syncVideoRadio);
  if (manualRadio) manualRadio.addEventListener('change', syncVideoRadio);

  // Pattern strategy change updates chips
  if (elements.batchPatternStrategy) {
    elements.batchPatternStrategy.addEventListener('change', () => {
      renderBatchArticlesPreview();
    });
  }
}

function setPipelineStep(step) {
  const nodes = [elements.step1Node, elements.step2Node, elements.step3Node, elements.step4Node];
  const lines = [elements.stepLine1, elements.stepLine2, elements.stepLine3];

  nodes.forEach((node, i) => {
    if (!node) return;
    const stepNum = i + 1;
    node.classList.remove('active', 'completed');
    if (stepNum < step) {
      node.classList.add('completed');
    } else if (stepNum === step) {
      node.classList.add('active');
    }
  });

  lines.forEach((line, i) => {
    if (!line) return;
    line.classList.toggle('completed', (i + 1) < step);
  });
}

function updateRunnerTimer() {
  if (!batchState.startTime || !elements.runnerTimeText) return;
  const elapsedSec = Math.floor((Date.now() - batchState.startTime) / 1000);
  const m = Math.floor(elapsedSec / 60);
  const s = elapsedSec % 60;
  elements.runnerTimeText.textContent = `Time elapsed: ${m > 0 ? `${m}m ` : ''}${s}s`;
}

function stopBatchWorkflow() {
  batchState.isRunning = false;
  if (batchState.timerInterval) {
    clearInterval(batchState.timerInterval);
    batchState.timerInterval = null;
  }
  if (elements.runnerHeadlineStatus) {
    elements.runnerHeadlineStatus.textContent = '🛑 Batch workflow stopped by user';
  }
  showToast('Batch automation stopped', 'warning');
}

async function startBatchWorkflow() {
  const selectedList = Array.from(state.selectedNewsForBatch.values());
  if (selectedList.length === 0) {
    showToast('Please select at least 1 news story to generate reels', 'warning');
    return;
  }

  // Read batch settings
  const isManualSource = elements.batchVideoSourceManual?.checked;
  const globalManualUrl = (elements.batchGlobalManualUrl?.value || '').trim();
  const patternStrategy = elements.batchPatternStrategy?.value || 'cycle';
  const autoPostIg = elements.batchAutoPostIgToggle ? elements.batchAutoPostIgToggle.checked : true;
  const postDelaySec = parseInt(elements.batchPostDelaySelect?.value || '10', 10);

  // Initialize batch state
  batchState.isRunning = true;
  batchState.startTime = Date.now();
  batchState.results = [];
  batchState.queue = selectedList.map((art, idx) => ({
    article: art,
    index: idx,
    pattern: getPatternForIndex(patternStrategy, idx),
    manualUrl: art.manualVideoUrl || (isManualSource ? globalManualUrl : ''),
    status: 'queued',
    stepText: 'Queued...',
    videoUrl: '',
    postUrl: '',
    renderedFilename: '',
    errorMsg: ''
  }));

  // Switch to Screen 2 (Running)
  if (elements.batchScreenSetup) elements.batchScreenSetup.style.display = 'none';
  if (elements.batchScreenRunning) elements.batchScreenRunning.style.display = 'block';
  if (elements.batchScreenSummary) elements.batchScreenSummary.style.display = 'none';

  if (batchState.timerInterval) clearInterval(batchState.timerInterval);
  batchState.timerInterval = setInterval(updateRunnerTimer, 1000);

  // Render Queue Table
  renderRunnerQueue();

  const total = batchState.queue.length;

  for (let i = 0; i < total; i++) {
    if (!batchState.isRunning) break;

    const item = batchState.queue[i];
    item.status = 'working';
    renderRunnerQueue();

    // Update Overall Progress Bar
    const progressPct = Math.round((i / total) * 100);
    if (elements.batchOverallProgressFill) elements.batchOverallProgressFill.style.width = `${progressPct}%`;
    if (elements.runnerCounterPill) elements.runnerCounterPill.textContent = `Reel ${i + 1} of ${total} (${progressPct}%)`;
    if (elements.runnerHeadlineStatus) elements.runnerHeadlineStatus.textContent = `Processing story ${i + 1} of ${total}`;
    if (elements.currentStoryTitle) elements.currentStoryTitle.textContent = item.article.title;
    if (elements.currentPatternBadge) elements.currentPatternBadge.textContent = `🎬 Pattern: ${formatPatternName(item.pattern)}`;

    try {
      // STEP 1: Extract Factual News Headline, 2-3 Line Description & Video Search Queries
      setPipelineStep(1);
      if (elements.runnerSubtext) elements.runnerSubtext.textContent = 'Step 1/4: Synthesizing breaking headline & 2-3 line news summary...';
      item.stepText = 'Extracting news story...';
      renderRunnerQueue();

      let hookData = null;
      try {
        const hookRes = await fetch('/api/reel-hooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.article.title,
            publisher: item.article.publisher || '',
            category: state.currentTopic || '',
            vibe: 'news',
            related_coverage: item.article.related_coverage || []
          })
        });
        hookData = await hookRes.json();
      } catch (err) {
        console.warn('[BATCH] AI hook fallback:', err);
      }

      const rawTitle = item.article.title.trim();
      const defaultHeadline = rawTitle.toUpperCase().startsWith('BREAKING') ? rawTitle : `BREAKING: ${rawTitle}`;
      const topHook = hookData?.headline || hookData?.hooks?.[0]?.top_hook || defaultHeadline;
      const description = hookData?.description || hookData?.hooks?.[0]?.caption || item.article.title;
      const subBadge = hookData?.sub_badge || '🔴 BREAKING NEWS';
      const searchQueries = hookData?.search_queries || [];
      const igCaption = hookData?.ig_caption || `${topHook}\n\n${description}\n\nStay tuned for real-time global news updates.\n\n#breakingnews #news #reels`;
      const hashtags = hookData?.hashtags || '#breakingnews #worldnews #reels #viral #trending #todaynews';

      if (!batchState.isRunning) break;

      // STEP 2: Fetch Relatable Video Footage from Internet or Custom URL
      setPipelineStep(2);
      if (elements.runnerSubtext) elements.runnerSubtext.textContent = item.manualUrl 
        ? 'Step 2/4: Fetching custom background video from URL...'
        : 'Step 2/4: Searching YouTube for relatable news footage & CCTV/b-roll...';
      item.stepText = 'Fetching relatable video...';
      renderRunnerQueue();

      const videoPayload = item.manualUrl
        ? { type: 'url', url: item.manualUrl }
        : {
            type: 'search',
            query: item.article.title,
            search_queries: searchQueries
          };

      let videoFilename = 'sample_reel.mp4';
      try {
        const fetchVidRes = await fetch('/api/fetch-reel-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoPayload)
        });
        const vidJson = await fetchVidRes.json();
        if (vidJson.success && vidJson.videoUrl) {
          const match = vidJson.videoUrl.match(/name=([^&]+)/);
          if (match) videoFilename = decodeURIComponent(match[1]);
        }
      } catch (vfErr) {
        console.warn('[BATCH] Video fetch fallback to sample_reel:', vfErr);
      }

      if (!batchState.isRunning) break;

      // STEP 3: Render 9:16 HD Reel with Pattern Overlay
      setPipelineStep(3);
      if (elements.runnerSubtext) elements.runnerSubtext.textContent = `Step 3/4: Compositing 9:16 Full HD Reel with pattern: ${formatPatternName(item.pattern)}...`;
      item.stepText = 'Rendering 9:16 HD Reel...';
      renderRunnerQueue();

      const overlayPng = getReelOverlayDataUrl({
        layout: item.pattern,
        topHook: topHook,
        caption: description,
        publisher: item.article.publisher || 'TODAY MEMER',
        subBadge: subBadge,
        quality: 'hd1080'
      });

      const renderRes = await fetch('/api/render-reel-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_name: videoFilename,
          overlay: overlayPng,
          layout: item.pattern,
          duration: 12,
          quality: 'hd1080',
          color_grade: 'none'
        })
      });
      const renderJson = await renderRes.json();
      if (!renderRes.ok || !renderJson.success) {
        throw new Error(renderJson.error || 'Failed to render 9:16 video');
      }

      item.renderedFilename = renderJson.filename;
      item.videoUrl = renderJson.videoUrl;

      if (!batchState.isRunning) break;

      // STEP 4: Direct Auto-Publish to Instagram Reels
      setPipelineStep(4);
      if (autoPostIg && igState.connected) {
        if (elements.runnerSubtext) elements.runnerSubtext.textContent = 'Step 4/4: Uploading and publishing 9:16 Reel to Instagram...';
        item.stepText = 'Publishing to Instagram...';
        renderRunnerQueue();

        try {
          const igRes = await fetch('/api/instagram/publish-reel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              video_name: item.renderedFilename,
              overlay: overlayPng,
              layout: item.pattern,
              caption: igCaption,
              hashtags: hashtags
            })
          });
          const igJson = await igRes.json();
          if (igRes.ok && igJson.success) {
            item.postUrl = igJson.post_url || igJson.reel_url;
            item.stepText = 'Published on Instagram!';
          } else {
            console.warn('[BATCH] Instagram publish note:', igJson.error);
            item.errorMsg = igJson.error || 'Instagram upload note';
            item.stepText = 'Rendered (IG upload skipped)';
          }
        } catch (igErr) {
          console.warn('[BATCH] Instagram publish error:', igErr);
          item.errorMsg = igErr.message;
          item.stepText = 'Rendered (IG skipped)';
        }
      } else {
        item.stepText = 'Rendered & Saved Locally';
      }

      item.status = 'done';
      batchState.results.push(item);
      renderRunnerQueue();

      // Pause delay between Instagram posts
      if (autoPostIg && igState.connected && i < total - 1) {
        for (let s = postDelaySec; s > 0; s--) {
          if (!batchState.isRunning) break;
          if (elements.runnerSubtext) {
            elements.runnerSubtext.textContent = `⏳ Waiting ${s}s before next post to respect Instagram limits...`;
          }
          await new Promise(r => setTimeout(r, 1000));
        }
      }

    } catch (storyErr) {
      console.error(`[BATCH] Error on story ${i + 1}:`, storyErr);
      item.status = 'error';
      item.errorMsg = storyErr.message || 'Workflow error';
      item.stepText = `Failed: ${item.errorMsg.slice(0, 30)}`;
      batchState.results.push(item);
      renderRunnerQueue();
    }
  }

  // Finalize Workflow
  if (batchState.timerInterval) {
    clearInterval(batchState.timerInterval);
    batchState.timerInterval = null;
  }

  if (elements.batchOverallProgressFill) elements.batchOverallProgressFill.style.width = '100%';
  setPipelineStep(4);

  // Switch to Screen 3 (Summary)
  showBatchSummaryScreen();
}

function renderRunnerQueue() {
  if (!elements.runnerQueueList) return;
  elements.runnerQueueList.innerHTML = '';

  batchState.queue.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = `runner-item-card${item.status === 'working' ? ' is-processing' : ''}${item.status === 'done' ? ' is-done' : ''}`;

    let badgeClass = 'queued';
    let badgeText = '⏳ Queued';
    if (item.status === 'working') {
      badgeClass = 'working';
      badgeText = `⚡ ${item.stepText || 'Processing...'}`;
    } else if (item.status === 'done') {
      badgeClass = 'done';
      badgeText = item.postUrl ? '✅ Published on IG' : '✅ Reel Rendered';
    } else if (item.status === 'error') {
      badgeClass = 'error';
      badgeText = '❌ Failed';
    }

    let linkHtml = '';
    if (item.postUrl) {
      linkHtml = `<a href="${escapeHtml(item.postUrl)}" target="_blank" rel="noopener noreferrer" class="runner-item-link">View IG ↗</a>`;
    } else if (item.videoUrl) {
      linkHtml = `<a href="${escapeHtml(item.videoUrl)}" target="_blank" download="reel_${idx+1}.mp4" class="runner-item-link">Download ⬇</a>`;
    }

    card.innerHTML = `
      <div class="runner-item-left">
        <span class="runner-item-num">#${idx + 1}</span>
        <span class="runner-item-title" title="${escapeHtml(item.article.title)}">${escapeHtml(item.article.title)}</span>
        <span class="runner-item-pattern">${formatPatternName(item.pattern)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="runner-item-status-badge ${badgeClass}">${badgeText}</span>
        ${linkHtml}
      </div>
    `;
    elements.runnerQueueList.appendChild(card);
  });
}

function showBatchSummaryScreen() {
  if (elements.batchScreenSetup) elements.batchScreenSetup.style.display = 'none';
  if (elements.batchScreenRunning) elements.batchScreenRunning.style.display = 'none';
  if (elements.batchScreenSummary) elements.batchScreenSummary.style.display = 'block';

  const total = batchState.results.length;
  const posted = batchState.results.filter(r => r.postUrl).length;
  const rendered = batchState.results.filter(r => r.renderedFilename).length;
  const uniquePatterns = new Set(batchState.results.map(r => r.pattern)).size;

  if (elements.statReelsCreated) elements.statReelsCreated.textContent = rendered;
  if (elements.statReelsPosted) elements.statReelsPosted.textContent = posted;
  if (elements.statPatternsUsed) elements.statPatternsUsed.textContent = uniquePatterns;

  if (elements.summaryStatsText) {
    elements.summaryStatsText.textContent = posted > 0
      ? `Successfully rendered ${rendered} full HD reels and published ${posted} directly to Instagram!`
      : `Successfully rendered ${rendered} full HD reels with custom layouts ready for download.`;
  }

  // Populate gallery
  if (elements.summaryGalleryGrid) {
    elements.summaryGalleryGrid.innerHTML = '';
    batchState.results.forEach((res, i) => {
      if (!res.renderedFilename && !res.videoUrl) return;
      const card = document.createElement('div');
      card.className = 'gallery-card';

      const igBtn = res.postUrl
        ? `<a href="${escapeHtml(res.postUrl)}" target="_blank" rel="noopener noreferrer" class="gallery-ig-link">📸 View on Instagram ↗</a>`
        : `<span style="font-size: 11px; color: var(--text-dim);">Saved locally</span>`;

      card.innerHTML = `
        <div class="gallery-card-top">
          <span class="gallery-card-pattern">🎬 ${formatPatternName(res.pattern)}</span>
          <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 700;">#${i + 1}</span>
        </div>
        <div class="gallery-card-title">${escapeHtml(res.article.title)}</div>
        <div class="gallery-card-actions">
          ${igBtn}
          <a href="${escapeHtml(res.videoUrl || `/api/serve-video?name=${res.renderedFilename}`)}" target="_blank" download="reel_${i+1}.mp4" class="gallery-download-btn">⬇ MP4</a>
        </div>
      `;
      elements.summaryGalleryGrid.appendChild(card);
    });
  }

  showToast(`🎉 Batch automation complete: ${rendered} reels rendered!`, 'success');
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
window.openDatasetModal = openDatasetModal;
window.closeDatasetModal = closeDatasetModal;
window.openBatchReelModal = openBatchReelModal;
window.closeBatchReelModal = closeBatchReelModal;
window.startBatchWorkflow = startBatchWorkflow;
window.stopBatchWorkflow = stopBatchWorkflow;

// Start application
window.addEventListener('DOMContentLoaded', init);
