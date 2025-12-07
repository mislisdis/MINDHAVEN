class MindHavenJournal {
  constructor() {
    this.currentPage = 1;
    this.currentPeriod = 'week';
    this.moodChartInstance = null;
    this.emotionChartInstance = null;
    this.weeklyChartInstance = null;
    this.hasLoadedEntries = false; // Track if entries have been loaded
    this.loadedEntryIds = new Set(); // Track loaded entry IDs to prevent duplicates
    this.init();
  }

  async init() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial data based on active tab
    await this.loadInitialData();
    
    // Set up tab switching
    this.setupTabNavigation();
  }

  setupTabNavigation() {
    // Listen for tab changes
    document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', (event) => {
        const targetId = event.target.getAttribute('href').substring(1);
        this.onTabChange(targetId);
      });
    });
  }

  onTabChange(tabId) {
    // Load data for specific tabs when they become active
    switch(tabId) {
      case 'entries':
        if (!this.hasLoadedEntries) {
          this.loadJournalEntries();
        }
        break;
      case 'timeline':
        this.loadMoodTimeline();
        break;
      case 'moodboard':
        this.loadMoodBoard();
        break;
      case 'stats':
        this.loadStats();
        break;
    }
  }

  async loadInitialData() {
    // Check current active tab
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab) {
      const tabId = activeTab.id;
      switch(tabId) {
        case 'write':
          // Load prompts
          this.generateNewPrompt();
          break;
        case 'entries':
          await this.loadJournalEntries();
          break;
        case 'timeline':
          await this.loadMoodTimeline();
          break;
        case 'moodboard':
          await this.loadMoodBoard();
          break;
        case 'stats':
          await this.loadStats();
          break;
      }
    }
  }

  setupEventListeners() {
    // Save journal entry
    const saveJournalBtn = document.getElementById('saveJournal');
    const quickSaveBtn = document.getElementById('quickSave');

    if (saveJournalBtn) {
      saveJournalBtn.addEventListener('click', () => this.saveJournalEntry(false));
    }

    if (quickSaveBtn) {
      quickSaveBtn.addEventListener('click', () => this.saveJournalEntry(true));
    }

    // Search entries
    const searchInput = document.getElementById('searchEntries');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchEntries(e.target.value));
    }

    // Load more entries
    const loadMoreBtn = document.getElementById('loadMoreEntries');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.loadMoreEntries());
    }

    // Period buttons for timeline and moodboard
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Remove active class from all period buttons in the same group
        const parent = e.target.closest('.btn-group');
        if (parent) {
          parent.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        }
        
        // Add active class to clicked button
        e.target.classList.add('active');

        this.currentPeriod = e.target.dataset.period;
        
        // Update both timeline and moodboard if they're visible
        const timelineTab = document.getElementById('timeline');
        const moodboardTab = document.getElementById('moodboard');
        
        if (timelineTab && timelineTab.classList.contains('active')) {
          this.loadMoodTimeline();
        }
        if (moodboardTab && moodboardTab.classList.contains('active')) {
          this.loadMoodBoard();
        }
      });
    });

    // Quick mood buttons
    document.querySelectorAll('#quickMoodButtons button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emotion = e.currentTarget.getAttribute('data-emotion');
        this.logQuickMood(emotion);
      });
    });

    // New prompt button
    const newPromptBtn = document.getElementById('newPrompt');
    if (newPromptBtn) {
      newPromptBtn.addEventListener('click', () => this.generateNewPrompt());
    }

    // Add click handler for mood board color squares (delegated)
    document.addEventListener('click', (e) => {
      if (e.target.closest('.color-square')) {
        const colorSquare = e.target.closest('.color-square');
        const title = colorSquare.getAttribute('title');
        if (title) {
          alert(`Mood Details: ${title}`);
        }
      }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveJournalEntry(false);
      }
      // Ctrl/Cmd + Enter for quick save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.saveJournalEntry(true);
      }
    });

    // Auto-save draft (optional feature)
    this.setupAutoSave();
  }

  setupAutoSave() {
    const contentTextarea = document.getElementById('journalContent');
    if (contentTextarea) {
      let timeoutId;
      contentTextarea.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          this.saveDraft();
        }, 2000); // Auto-save after 2 seconds of inactivity
      });
    }
  }

  async saveDraft() {
    const content = document.getElementById('journalContent')?.value;
    if (!content || content.trim().length < 10) return; // Don't save very short drafts
    
    try {
      await fetch('/api/journal/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      // Could show a subtle indicator that draft was saved
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }

async saveJournalEntry(isQuick = false) {
  const title = document.getElementById('journalTitle')?.value;
  const content = document.getElementById('journalContent')?.value;
  const tags = document.getElementById('journalTags')?.value;
  
  if (!content || !content.trim()) {
    this.showNotification('Please write something in your journal entry.', 'warning');
    return;
  }
  
  // Show loading state
  const saveBtn = isQuick ? document.getElementById('quickSave') : document.getElementById('saveJournal');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
  saveBtn.disabled = true;
  
  try {
    const endpoint = isQuick ? '/api/journal/quick' : '/api/journal/entries';
    
    console.log('📝 Saving journal entry to:', endpoint);
    console.log('Content length:', content.length);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // THIS IS CRITICAL - sends cookies
      body: JSON.stringify({
        title: isQuick ? undefined : title,
        content,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        timestamp: new Date().toISOString(),
        analyze: true // Explicitly request analysis
      })
    });
    
    console.log('Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: Failed to save entry`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error saving entry');
    }
    
    this.showNotification('Journal entry saved successfully!', 'success');
    
    // Clear form
    if (!isQuick) {
      document.getElementById('journalTitle').value = '';
      document.getElementById('journalContent').value = '';
      document.getElementById('journalTags').value = '';
    } else {
      document.getElementById('journalContent').value = '';
    }
    
    // Show analysis if available
    if (data.analysis) {
      console.log('📊 Analysis received:', data.analysis);
      this.showEntryAnalysis(data);
    } else if (data.journalEntry?.analysis) {
      console.log('📊 Analysis from journal entry:', data.journalEntry.analysis);
      this.showEntryAnalysis({ analysis: data.journalEntry.analysis });
    } else if (data.journalEntry?.dominantEmotion) {
      // If analysis is embedded in journalEntry
      console.log('📊 Analysis embedded in journalEntry');
      this.showEntryAnalysis({ analysis: data.journalEntry });
    }
    
    // Refresh data
    this.hasLoadedEntries = false; // Reset flag to reload entries
    this.currentPage = 1; // Reset to first page
    
    // Refresh all tabs
    await Promise.all([
      this.loadJournalEntries(),
      this.loadStats(),
      this.loadMoodTimeline(),
      this.loadMoodBoard()
    ]);
    
  } catch (error) {
    console.error('❌ Error saving journal:', error);
    
    // Specific error messages
    let errorMessage = error.message;
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorMessage = 'You need to be logged in to save journal entries. Redirecting to login...';
      setTimeout(() => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }, 2000);
    } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    this.showNotification(errorMessage, 'error');
  } finally {
    // Restore button state
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }

}  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `custom-notification alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds for success/info, 10 seconds for errors
    const dismissTime = type === 'error' ? 10000 : 5000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, dismissTime);
  }

  showEntryAnalysis(data) {
    const analysis = data.analysis || data.journalEntry;
    if (!analysis) return;
    
    let html = `
      <div class="alert alert-info mt-3">
        <h5><i class="bi bi-graph-up"></i> Analysis Results</h5>
        <div class="row">
          <div class="col-md-6">
            <p><strong>Dominant Emotion:</strong> <span class="badge ${this.getEmotionClass(analysis.dominantEmotion || 'neutral')}">${analysis.dominantEmotion || 'N/A'}</span></p>
            <p><strong>Word Count:</strong> ${analysis.wordCount || 'N/A'}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Emotions Detected:</strong> ${(analysis.emotions || []).map(e => `<span class="badge ${this.getEmotionClass(e)} me-1">${e}</span>`).join('') || 'N/A'}</p>
            <p><strong>Topics:</strong> ${(analysis.topics || []).map(t => `<span class="badge bg-secondary me-1">${t}</span>`).join('') || 'N/A'}</p>
          </div>
        </div>
    `;
    
    if (analysis.insights) {
      html += `<hr><p><strong>Insight:</strong> ${analysis.insights}</p>`;
    }
    
    if (analysis.reflectionQuestions?.length > 0) {
      html += `
        <hr>
        <h6>Reflection Questions:</h6>
        <div class="row">
          ${analysis.reflectionQuestions.map(q => `
            <div class="col-md-6">
              <div class="card mb-2">
                <div class="card-body">
                  <i class="bi bi-question-circle text-primary"></i> ${q}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    if (analysis.gratitudeList?.length > 0) {
      html += `
        <hr>
        <h6><i class="bi bi-heart-fill text-danger"></i> Gratitude Moments:</h6>
        <div class="row">
          ${analysis.gratitudeList.map(g => `
            <div class="col-md-6">
              <div class="card mb-2">
                <div class="card-body">
                  <i class="bi bi-star-fill text-warning"></i> ${g}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    html += `</div>`;
    
    // Create analysis container
    const analysisDiv = document.createElement('div');
    analysisDiv.innerHTML = html;
    analysisDiv.id = 'analysisAlert';
    
    // Remove previous analysis
    const prevAlert = document.getElementById('analysisAlert');
    if (prevAlert) prevAlert.remove();
    
    // Insert after the form
    const journalForm = document.querySelector('.journal-form');
    if (journalForm) {
      journalForm.parentNode.insertBefore(analysisDiv, journalForm.nextSibling);
      
      // Add close button functionality
      const closeBtn = analysisDiv.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          analysisDiv.remove();
        });
      }
    }
  }

async loadJournalEntries() {
  try {
    // Show loading state
    const entriesList = document.getElementById('entriesList');
    if (entriesList && this.currentPage === 1) {
      entriesList.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="mt-2">Loading entries...</p>
        </div>
      `;
    }
    
    const response = await fetch(`/api/journal/entries?page=${this.currentPage}&limit=10`, {
      credentials: 'include' // Add this
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      this.hasLoadedEntries = true;
      // Calculate hasMore based on pagination
      const hasMore = data.pagination ? 
        (this.currentPage * data.pagination.limit) < data.pagination.total : 
        (data.entries && data.entries.length === 10);
      this.displayEntries(data.entries || [], hasMore);
    } else {
      this.showNotification('Failed to load entries: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error loading entries:', error);
    this.showNotification('Failed to load entries. Please try again.', 'error');
  }
}

async loadMoodTimeline() {
  try {
    const response = await fetch(`/api/journal/timeline?period=${this.currentPeriod}`, {
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.success) {
      // Pass the full data object including timeline, stats, and patterns
      this.displayTimeline(data);
    } else {
      this.displayTimeline(null);
    }
  } catch (error) {
    console.error('Error loading timeline:', error);
    this.displayTimeline(null);
  }
}

async loadMoodBoard() {
  try {
    const response = await fetch(`/api/journal/moodboard?period=${this.currentPeriod}`, {
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (data.success) {
      // Backend spreads moodBoard properties directly, so data IS the moodBoard
      // Extract moodBoard properties (excluding success flag)
      const moodBoard = {
        colors: data.colors || [],
        emotions: data.emotions || {},
        wordCloud: data.wordCloud || [],
        topics: data.topics || [],
        averageIntensity: data.averageIntensity || 5,
        insights: data.insights || []
      };
      
      console.log('📊 Mood Board Data:', moodBoard); // Debug log
      this.displayMoodBoard(moodBoard);
    } else {
      console.error('Failed to load mood board:', data.error);
      this.showEmptyMoodBoard();
    }
  } catch (error) {
    console.error('Error loading mood board:', error);
    this.showEmptyMoodBoard();
  }
}

async loadStats() {
  try {
    const response = await fetch('/api/journal/stats', {
      credentials: 'include' // Add this
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.success) {
      this.displayStats(data.stats);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async logQuickMood(emotion) {
  try {
    const response = await fetch('/api/journal/log-emotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Add this
      body: JSON.stringify({
        emotion,
        intensity: 6, // Default medium intensity
        message: `Quick mood check: feeling ${emotion}`,
        context: 'quick_check'
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.success) {
      // Show confirmation
      const alert = document.createElement('div');
      alert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
      alert.style.zIndex = '9999';
      alert.innerHTML = `
        Mood logged: ${emotion}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      
      // Insert at top of body
      document.body.appendChild(alert);
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        if (alert.parentNode) {
          alert.remove();
        }
      }, 3000);
      
      // Refresh timeline and stats
      this.loadMoodTimeline();
      this.loadStats();
    }
  } catch (error) {
    console.error('Error logging mood:', error);
    this.showNotification('Failed to log mood. Please try again.', 'error');
  }
}
  displayEntries(entries, hasMore = false) {
    const entriesList = document.getElementById('entriesList');
    if (!entriesList) return;
    
    // Clear only if it's the first page
    if (this.currentPage === 1) {
      entriesList.innerHTML = '';
      this.loadedEntryIds.clear(); // Reset loaded IDs when starting fresh
    }
    
    if (!entries || entries.length === 0) {
      if (this.currentPage === 1) {
        entriesList.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-journal-x display-1 text-muted"></i>
            <h4 class="mt-3">No Journal Entries Yet</h4>
            <p class="text-muted">Start writing your first entry to begin your journey!</p>
            <button class="btn btn-primary mt-2" onclick="window.location.href='#write'">
              <i class="bi bi-pencil"></i> Write Your First Entry
            </button>
          </div>
        `;
      } else {
        // If loading more pages but no more entries, disable load more button
        const loadMoreBtn = document.getElementById('loadMoreEntries');
        if (loadMoreBtn) {
          loadMoreBtn.disabled = true;
          loadMoreBtn.innerHTML = '<i class="bi bi-check"></i> All entries loaded';
        }
      }
      return;
    }
    
    // Filter out duplicates
    const newEntries = entries.filter(entry => {
      const entryId = entry._id || entry.id;
      if (!entryId || this.loadedEntryIds.has(entryId)) {
        return false; // Skip duplicate
      }
      this.loadedEntryIds.add(entryId); // Mark as loaded
      return true;
    });
    
    if (newEntries.length === 0 && this.currentPage > 1) {
      // All entries were duplicates, disable load more
      const loadMoreBtn = document.getElementById('loadMoreEntries');
      if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<i class="bi bi-check"></i> All entries loaded';
      }
      return;
    }
    
    let html = this.currentPage === 1 ? '<div class="row">' : '';
    
    newEntries.forEach(entry => {
      const date = new Date(entry.createdAt || entry.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const preview = entry.content.length > 150 ? 
        entry.content.substring(0, 150) + '...' : entry.content;
      
      const emotionChips = entry.emotions?.map(emotion => 
        `<span class="badge ${this.getEmotionClass(emotion)} me-1 mb-1">${emotion}</span>`
      ).join(' ') || '';
      
      const tags = entry.tags?.map(tag => 
        `<span class="badge bg-light text-dark border me-1 mb-1">#${tag}</span>`
      ).join(' ') || '';
      
      html += `
        <div class="col-md-6 col-lg-4 mb-3">
          <div class="card journal-card h-100" style="border-left: 4px solid ${entry.moodColor || '#6c757d'};">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0">${entry.title || 'Journal Entry'}</h5>
                <span class="badge bg-light text-dark">${entry.wordCount || '?'} words</span>
              </div>
              <p class="card-text text-muted small mb-2">
                <i class="bi bi-calendar"></i> ${formattedDate} at ${time}
              </p>
              <p class="card-text flex-grow-1">${preview}</p>
              <div class="mb-2">${emotionChips}</div>
              <div class="mb-3">${tags}</div>
              <div class="mt-auto">
                <button class="btn btn-sm btn-outline-primary view-entry w-100" data-id="${entry._id || entry.id}">
                  <i class="bi bi-eye"></i> Read More
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    if (this.currentPage === 1) {
      entriesList.innerHTML = html;
    } else {
      // Append to existing entries
      const rowContainer = entriesList.querySelector('.row') || entriesList;
      rowContainer.insertAdjacentHTML('beforeend', html.replace('<div class="row">', ''));
    }
    
    // Update load more button
    const loadMoreBtn = document.getElementById('loadMoreEntries');
    if (loadMoreBtn) {
      if (hasMore) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = `<i class="bi bi-arrow-clockwise"></i> Load More (Page ${this.currentPage + 1})`;
      } else {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<i class="bi bi-check"></i> All entries loaded';
      }
    }
    
    // Re-add event listeners to new view buttons
    document.querySelectorAll('.view-entry').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryId = e.currentTarget.dataset.id;
        this.viewEntry(entryId);
      });
    });
  }

  async viewEntry(entryId) {
    try {
      const response = await fetch(`/api/journal/entries/${entryId}`);
      const data = await response.json();
      
      if (data.success) {
        const entry = data.entry;
        this.showEntryModal(entry);
      } else {
        this.showNotification('Failed to load entry details.', 'error');
      }
    } catch (error) {
      console.error('Error viewing entry:', error);
      this.showNotification('Failed to load entry. Please try again.', 'error');
    }
  }

  showEntryModal(entry) {
    const date = new Date(entry.createdAt || entry.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    document.getElementById('entryModalTitle').textContent = entry.title || 'Journal Entry';
    document.getElementById('entryModalDate').textContent = `${formattedDate} at ${time}`;
    
    const emotionChips = entry.emotions?.map(emotion => 
      `<span class="badge ${this.getEmotionClass(emotion)} me-1">${emotion}</span>`
    ).join(' ') || '';
    document.getElementById('entryModalMood').innerHTML = emotionChips;
    
    const tags = entry.tags?.map(tag => 
      `<span class="badge bg-light text-dark border me-1">#${tag}</span>`
    ).join(' ') || '';
    document.getElementById('entryModalTags').innerHTML = tags || 'No tags';
    
    // Format content with line breaks and paragraphs
    const formattedContent = entry.content
      .split('\n')
      .map(paragraph => paragraph.trim() ? `<p>${paragraph}</p>` : '')
      .join('');
    document.getElementById('entryModalContent').innerHTML = formattedContent;
    
    let analysis = '';
    if (entry.isAnalyzed || entry.analysis) {
      const analysisData = entry.analysis || entry;
      analysis = `
        <div class="alert alert-light border">
          <h6><i class="bi bi-graph-up"></i> AI Analysis</h6>
          <div class="row">
            <div class="col-md-6">
              <p><strong>Dominant Emotion:</strong><br>
                <span class="badge ${this.getEmotionClass(analysisData.dominantEmotion || 'neutral')}">
                  ${analysisData.dominantEmotion || 'N/A'}
                </span>
              </p>
              <p><strong>Intensity:</strong><br>
                <div class="progress" style="height: 10px;">
                  <div class="progress-bar" style="width: ${(analysisData.emotionIntensity || 5) * 10}%;"></div>
                </div>
                ${analysisData.emotionIntensity || 'N/A'}/10
              </p>
            </div>
            <div class="col-md-6">
              <p><strong>Word Count:</strong> ${analysisData.wordCount || 'N/A'}</p>
              <p><strong>Read Time:</strong> ${Math.ceil((analysisData.wordCount || 0) / 200)} min</p>
            </div>
          </div>
      `;
      
      if (analysisData.topics?.length > 0) {
        analysis += `
          <p><strong>Topics:</strong><br>
            ${analysisData.topics.map(t => `<span class="badge bg-secondary me-1">${t}</span>`).join('')}
          </p>
        `;
      }
      
      if (analysisData.insights) {
        analysis += `
          <div class="alert alert-warning mt-2">
            <i class="bi bi-lightbulb"></i> <strong>Insight:</strong> ${analysisData.insights}
          </div>
        `;
      }
      
      if (analysisData.reflectionQuestions?.length > 0) {
        analysis += `
          <h6 class="mt-3">Reflection Questions:</h6>
          <ul class="list-group list-group-flush">
            ${analysisData.reflectionQuestions.map(q => `
              <li class="list-group-item">
                <i class="bi bi-question-circle text-primary"></i> ${q}
              </li>
            `).join('')}
          </ul>
        `;
      }
      
      if (analysisData.gratitudeList?.length > 0) {
        analysis += `
          <h6 class="mt-3"><i class="bi bi-heart-fill text-danger"></i> Gratitude Moments:</h6>
          <ul class="list-group list-group-flush">
            ${analysisData.gratitudeList.map(g => `
              <li class="list-group-item">
                <i class="bi bi-star-fill text-warning"></i> ${g}
              </li>
            `).join('')}
          </ul>
        `;
      }
      
      analysis += `</div>`;
    } else {
      analysis = '<div class="alert alert-info">No analysis available for this entry.</div>';
    }
    
    document.getElementById('entryModalAnalysis').innerHTML = analysis;
    
    // Set up modal buttons
    const editBtn = document.getElementById('editEntryBtn');
    const deleteBtn = document.getElementById('deleteEntryBtn');
    
    if (editBtn) {
      editBtn.onclick = () => this.editEntry(entry._id || entry.id);
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => this.deleteEntry(entry._id || entry.id);
    }
    
    // Show modal
    const modalElement = document.getElementById('entryModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  async editEntry(entryId) {
    // Implement edit functionality
    this.showNotification('Edit feature coming soon!', 'info');
  }

  async deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/journal/entries/${entryId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.showNotification('Entry deleted successfully.', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('entryModal'));
        if (modal) modal.hide();
        
        // Refresh entries
        this.currentPage = 1;
        await this.loadJournalEntries();
        await this.loadStats();
      } else {
        this.showNotification('Failed to delete entry: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      this.showNotification('Failed to delete entry. Please try again.', 'error');
    }
  }

  // ... rest of the methods remain mostly the same but with improved error handling ...

  async loadMoreEntries() {
    const loadMoreBtn = document.getElementById('loadMoreEntries');
    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
    }
    
    this.currentPage++;
    await this.loadJournalEntries();
  }

  showEmptyMoodBoard() {
    const moodBoardContainer = document.getElementById('moodBoard');
    if (!moodBoardContainer) return;

    moodBoardContainer.innerHTML = `
      <div class="empty-state text-center py-5">
        <i class="bi bi-emoji-neutral display-1 text-muted"></i>
        <h4 class="mt-3">No Mood Data Yet</h4>
        <p class="text-muted">Start journaling or chatting to build your mood history.</p>
        <button class="btn btn-primary mt-2" onclick="window.location.href='#write'">
          <i class="bi bi-pencil"></i> Write First Entry
        </button>
      </div>
    `;
  }

  displayMoodBoard(moodBoard) {
    const moodBoardContainer = document.getElementById('moodBoard');
    if (!moodBoardContainer) {
      console.error('Mood board container not found');
      return;
    }

    console.log('🎨 Displaying Mood Board:', moodBoard); // Debug log

    // Check if we have any data at all
    const hasColors = moodBoard.colors && moodBoard.colors.length > 0;
    const hasEmotions = moodBoard.emotions && Object.keys(moodBoard.emotions).length > 0;
    const hasWordCloud = moodBoard.wordCloud && moodBoard.wordCloud.length > 0;
    const hasInsights = moodBoard.insights && moodBoard.insights.length > 0;
    const hasTopics = moodBoard.topics && moodBoard.topics.length > 0;

    if (!hasColors && !hasEmotions && !hasWordCloud && !hasInsights && !hasTopics) {
      console.log('No mood board data available, showing empty state');
      this.showEmptyMoodBoard();
      return;
    }

    let html = '';

    // 1. Color Grid (for mood colors over time)
    if (moodBoard.colors && moodBoard.colors.length > 0) {
      html += `
        <div class="mood-card mb-4">
          <div class="mood-card-header">
            <h6 class="mood-card-title">Mood Colors (${this.currentPeriod})</h6>
            <i class="bi bi-palette"></i>
          </div>
          <div class="color-grid">
            ${moodBoard.colors.map(item => {
              const date = item.date ? new Date(item.date) : new Date();
              const dayOfMonth = date.getDate();
              const color = item.color || this.getEmotionColor(item.emotion || 'neutral', item.intensity || 5);
              return `
              <div class="color-square" style="background-color: ${color};"
                   title="${(item.emotion || 'neutral').charAt(0).toUpperCase() + (item.emotion || 'neutral').slice(1)} - ${item.intensity || 5}/10 - ${date.toLocaleDateString()}">
                <span class="color-label">${dayOfMonth}</span>
              </div>
            `;
            }).join('')}
          </div>
          <p class="text-muted small mt-2">Each square represents a day's dominant mood. Hover to see details.</p>
        </div>
      `;
    } else {
      // Show message if no color data
      html += `
        <div class="mood-card mb-4">
          <div class="mood-card-header">
            <h6 class="mood-card-title">Mood Colors</h6>
            <i class="bi bi-palette"></i>
          </div>
          <p class="text-muted text-center py-3">No mood log data available for this period. Try logging quick moods or writing journal entries!</p>
        </div>
      `;
    }

    // 2. Emotion Frequency Bar Chart
    if (moodBoard.emotions && Object.keys(moodBoard.emotions).length > 0) {
      const emotionCounts = moodBoard.emotions;
      const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
      const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1]); // Sort by frequency
      
      html += `
        <div class="mood-card mb-4">
          <div class="mood-card-header">
            <h6 class="mood-card-title">Emotion Frequency</h6>
            <i class="bi bi-bar-chart"></i>
          </div>
          <div class="emotion-distribution">
            ${sortedEmotions.map(([emotion, count]) => {
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const emotionLabel = emotion.charAt(0).toUpperCase() + emotion.slice(1);
              return `
              <div class="emotion-bar">
                <div class="emotion-bar-label">
                  <span><strong>${emotionLabel}</strong></span>
                  <span>${count} (${percentage}%)</span>
                </div>
                <div class="emotion-bar-fill">
                  <div class="emotion-bar-progress" style="width: ${percentage}%; background-color: ${this.getEmotionColor(emotion)};"></div>
                </div>
              </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="mood-card mb-4">
          <div class="mood-card-header">
            <h6 class="mood-card-title">Emotion Frequency</h6>
            <i class="bi bi-bar-chart"></i>
          </div>
          <p class="text-muted text-center py-3">No emotion data available yet. Start journaling to see your emotional patterns!</p>
        </div>
      `;
    }

    // 3. Word Cloud
    if (moodBoard.wordCloud && moodBoard.wordCloud.length > 0) {
      html += `
        <div class="mood-card mb-4">
          <div class="mood-card-header">
            <h6 class="mood-card-title">Common Themes</h6>
            <i class="bi bi-cloud"></i>
          </div>
          <div class="word-cloud">
            ${moodBoard.wordCloud.slice(0, 30).map(word => {
              // Handle different word cloud formats: {text, size}, {text, value}, {word, size}
              const wordText = word.text || word.word || '';
              const fontSize = word.size ? Math.max(14, Math.min(50, word.size)) :
                               word.value ? Math.max(14, Math.min(50, word.value * 3)) : 18;
              return `
              <span class="word-cloud-item" style="font-size: ${fontSize}px; color: ${this.getRandomColor()};">
                ${wordText}
              </span>
            `;
            }).join(' ')}
          </div>
          <p class="text-muted small mt-2">Larger words appear more frequently in your entries</p>
        </div>
      `;
    } else {
      // Alternative: Show common topics if no word cloud
      if (moodBoard.topics && moodBoard.topics.length > 0) {
        html += `
          <div class="mood-card mb-4">
            <div class="mood-card-header">
              <h6 class="mood-card-title">Common Topics</h6>
              <i class="bi bi-tags"></i>
            </div>
            <div class="topics-container">
              ${moodBoard.topics.slice(0, 10).map(topic => `
                <span class="badge bg-light text-dark border me-2 mb-2 p-2">
                  <i class="bi bi-hash"></i> ${topic}
                </span>
              `).join('')}
            </div>
          </div>
        `;
      }
    }

    // 4. Average Intensity
    if (moodBoard.averageIntensity !== undefined) {
      const avgIntensity = moodBoard.averageIntensity;
      html += `
        <div class="mood-card mb-4">
          <div class="mood-card-header">
            <h6 class="mood-card-title">Average Emotional Intensity</h6>
            <i class="bi bi-speedometer2"></i>
          </div>
          <div class="text-center py-3">
            <div class="display-4 fw-bold" style="color: ${this.getIntensityColor(avgIntensity)};">
              ${avgIntensity.toFixed(1)}
            </div>
            <p class="text-muted">/ 10 average</p>
            <div class="progress" style="height: 10px;">
              <div class="progress-bar" style="width: ${avgIntensity * 10}%; background-color: ${this.getIntensityColor(avgIntensity)};"></div>
            </div>
          </div>
        </div>
      `;
    }

    // 5. Insights
    if (moodBoard.insights && moodBoard.insights.length > 0) {
      html += `
        <div class="mood-card mb-4">
          <div class="mood-card-header">
            <h6 class="mood-card-title">Insights</h6>
            <i class="bi bi-lightbulb"></i>
          </div>
          <div class="insights-card">
            ${moodBoard.insights.map(insight => `
              <div class="insight-item">
                <i class="bi bi-dot insight-icon"></i>
                <div class="insight-text">${insight}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    moodBoardContainer.innerHTML = html;

    // Add CSS for the mood board if not already present
    this.addMoodBoardStyles();
  }

  // Helper methods for mood board
  getDayOfMonth(dateString) {
    try {
      const date = new Date(dateString);
      return date.getDate();
    } catch (error) {
      return '?';
    }
  }

  getIntensityColor(intensity) {
    if (intensity >= 8) return '#FF4500'; // Red for high intensity
    if (intensity >= 6) return '#FFD700'; // Yellow for medium-high
    if (intensity >= 4) return '#32CD32'; // Green for medium
    if (intensity >= 2) return '#87CEEB'; // Light blue for low-medium
    return '#A9A9A9'; // Gray for low
  }

  getRandomColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
      '#EF476F', '#7BDFF2', '#B388EB', '#8093F1', '#F78E69'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  addMoodBoardStyles() {
    // Only add styles if not already present
    if (document.getElementById('mood-board-styles')) return;

    const style = document.createElement('style');
    style.id = 'mood-board-styles';
    style.textContent = `
      .mood-card {
        background: white;
        border-radius: 10px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #eee;
      }

      .mood-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #f0f0f0;
      }

      .mood-card-title {
        margin: 0;
        font-weight: 600;
        color: #333;
      }

      .color-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
        gap: 5px;
        margin: 1rem 0;
      }

      .color-square {
        aspect-ratio: 1;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: transform 0.2s ease;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .color-square:hover {
        transform: scale(1.1);
        z-index: 1;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      }

      .color-label {
        font-size: 0.7rem;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }

      .emotion-distribution {
        margin-top: 1rem;
      }

      .emotion-bar {
        margin-bottom: 0.75rem;
      }

      .emotion-bar-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
      }

      .emotion-bar-fill {
        height: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .emotion-bar-progress {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
      }

      .word-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        padding: 1.5rem;
        min-height: 150px;
        align-items: center;
      }

      .word-cloud-item {
        padding: 0.25rem 0.5rem;
        transition: all 0.3s ease;
        opacity: 0.9;
        cursor: pointer;
        border-radius: 4px;
      }

      .word-cloud-item:hover {
        opacity: 1;
        transform: translateY(-2px);
        background: rgba(0,0,0,0.05);
      }

      .insights-card {
        margin-top: 1rem;
      }

      .insight-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.75rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #4ECDC4;
      }

      .insight-icon {
        color: #4ECDC4;
        margin-right: 0.5rem;
        font-size: 1.2rem;
      }

      .insight-text {
        flex: 1;
        color: #555;
        line-height: 1.4;
      }

      .topics-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .empty-state {
        padding: 3rem 1rem;
        text-align: center;
        color: #6c757d;
      }

      .empty-state i {
        opacity: 0.5;
      }
    `;

    document.head.appendChild(style);
  }

  // Enhanced timeline display with all 3 charts
  displayTimeline(timelineData) {
    if (!timelineData) {
      // Show empty state
      const moodChartCtx = document.getElementById('moodChart');
      const emotionChartCtx = document.getElementById('emotionChart');
      const weeklyChartCtx = document.getElementById('weeklyChart');
      
      if (moodChartCtx) moodChartCtx.parentElement.innerHTML = '<p class="text-muted text-center">No mood data available yet. Start journaling to see your timeline!</p>';
      if (emotionChartCtx) emotionChartCtx.parentElement.innerHTML = '<p class="text-muted text-center">No emotion data available yet.</p>';
      if (weeklyChartCtx) weeklyChartCtx.parentElement.innerHTML = '<p class="text-muted text-center">No weekly pattern data available yet.</p>';
      return;
    }

    // Extract timeline data - handle different response structures
    const timeline = timelineData.timeline || timelineData;
    const stats = timelineData.stats || {};
    const patterns = timelineData.patterns || {};

    // 1. Main Mood Intensity Line Chart
    const moodCtx = document.getElementById('moodChart');
    if (moodCtx) {
      if (this.moodChartInstance) {
        this.moodChartInstance.destroy();
      }

      // Prepare data for line chart
      const dates = [];
      const intensities = [];
      
      if (Array.isArray(timeline)) {
        timeline.forEach(day => {
          dates.push(new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          intensities.push(day.averageIntensity || 5);
        });
      } else if (timeline.dates && timeline.intensities) {
        dates.push(...timeline.dates);
        intensities.push(...timeline.intensities);
      }

      if (dates.length > 0) {
        this.moodChartInstance = new Chart(moodCtx, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [{
              label: 'Mood Intensity',
              data: intensities,
              borderColor: '#4169E1',
              backgroundColor: 'rgba(65, 105, 225, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 10,
                title: {
                  display: true,
                  text: 'Intensity (1-10)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Date'
                }
              }
            }
          }
        });
      }
    }

    // 2. Emotion Distribution Pie/Donut Chart
    const emotionCtx = document.getElementById('emotionChart');
    if (emotionCtx) {
      if (this.emotionChartInstance) {
        this.emotionChartInstance.destroy();
      }

      const emotionDist = stats.emotionDistribution || {};
      const emotionEntries = Object.entries(emotionDist);
      
      if (emotionEntries.length > 0) {
        const colors = emotionEntries.map(([emotion]) => this.getEmotionColor(emotion));
        
        this.emotionChartInstance = new Chart(emotionCtx, {
          type: 'doughnut',
          data: {
            labels: emotionEntries.map(([emotion]) => emotion.charAt(0).toUpperCase() + emotion.slice(1)),
            datasets: [{
              data: emotionEntries.map(([, count]) => count),
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 15,
                  usePointStyle: true
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      } else {
        emotionCtx.parentElement.innerHTML = '<p class="text-muted text-center">No emotion distribution data available yet.</p>';
      }
    }

    // 3. Weekly Patterns Bar Chart
    const weeklyCtx = document.getElementById('weeklyChart');
    if (weeklyCtx) {
      if (this.weeklyChartInstance) {
        this.weeklyChartInstance.destroy();
      }

      const weeklyPatterns = patterns.weekly || {};
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayLabels = daysOfWeek.map(d => d.substring(0, 3));
      const emotionCounts = daysOfWeek.map(day => {
        const dayData = weeklyPatterns[day];
        return dayData ? (dayData.count || 0) : 0;
      });

      if (emotionCounts.some(count => count > 0)) {
        this.weeklyChartInstance = new Chart(weeklyCtx, {
          type: 'bar',
          data: {
            labels: dayLabels,
            datasets: [{
              label: 'Emotion Logs',
              data: emotionCounts,
              backgroundColor: 'rgba(251, 133, 0, 0.7)',
              borderColor: 'rgba(251, 133, 0, 1)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${daysOfWeek[context.dataIndex]}: ${context.parsed.y} logs`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Logs'
                },
                ticks: {
                  stepSize: 1
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Day of Week'
                }
              }
            }
          }
        });
      } else {
        weeklyCtx.parentElement.innerHTML = '<p class="text-muted text-center">No weekly pattern data available yet.</p>';
      }
    }
  }

  async displayStats(stats) {
    // Update counters
    const totalEntriesEl = document.getElementById('totalEntries');
    const streakCountEl = document.getElementById('streakCount');
    const avgWordsEl = document.getElementById('avgWords');

    if (totalEntriesEl) totalEntriesEl.textContent = stats.totalEntries || 0;
    if (streakCountEl) streakCountEl.textContent = stats.journalingStreak || 0;
    if (avgWordsEl) avgWordsEl.textContent = stats.averageWordsPerEntry || 0;

    // Display top emotions
    const topEmotionsList = document.getElementById('topEmotions');
    if (topEmotionsList) {
      if (stats.emotionDistribution && Object.keys(stats.emotionDistribution).length > 0) {
        const topEmotions = Object.entries(stats.emotionDistribution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        topEmotionsList.innerHTML = topEmotions.map(([emotion, count]) => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <span class="badge ${this.getEmotionClass(emotion)} me-2">${emotion}</span>
            ${count} entries
          </li>
        `).join('');
      } else {
        topEmotionsList.innerHTML = '<li class="list-group-item text-muted">No emotion data yet</li>';
      }
    }

    // Display top topics
    const topTopicsList = document.getElementById('topTopics');
    if (topTopicsList) {
      if (stats.topicDistribution && Object.keys(stats.topicDistribution).length > 0) {
        const topTopics = Object.entries(stats.topicDistribution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        topTopicsList.innerHTML = topTopics.map(([topic, count]) => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${topic}
            <span class="badge bg-primary rounded-pill">${count}</span>
          </li>
        `).join('');
      } else {
        topTopicsList.innerHTML = '<li class="list-group-item text-muted">No topic data yet</li>';
      }
    }

    // Display patterns - fetch recent entries to calculate patterns
    await this.displayPatterns(stats);
  }

  async displayPatterns(stats) {
    try {
      // Fetch recent entries to analyze patterns
      const response = await fetch('/api/journal/entries?page=1&limit=50', {
        credentials: 'include'
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      if (!data.success || !data.entries) return;
      
      const entries = data.entries;
      if (entries.length === 0) return;

      // Calculate patterns
      const patterns = this.calculatePatterns(entries);
      
      // Display patterns
      const patternsContainer = document.getElementById('personalPatterns');
      if (patternsContainer) {
        let html = '';
        
        // Best writing time
        if (patterns.bestTime) {
          html += `
            <div class="col-md-6 mb-3">
              <div class="card">
                <div class="card-body">
                  <i class="bi bi-clock-history text-primary"></i>
                  <strong>Best Writing Time:</strong>
                  <span class="ms-2">${patterns.bestTime}</span>
                </div>
              </div>
            </div>
          `;
        }
        
        // Most active day
        if (patterns.mostActiveDay) {
          html += `
            <div class="col-md-6 mb-3">
              <div class="card">
                <div class="card-body">
                  <i class="bi bi-calendar-event text-success"></i>
                  <strong>Most Active Day:</strong>
                  <span class="ms-2">${patterns.mostActiveDay}</span>
                </div>
              </div>
            </div>
          `;
        }
        
        // Average entry length
        if (patterns.avgLength) {
          html += `
            <div class="col-md-6 mb-3">
              <div class="card">
                <div class="card-body">
                  <i class="bi bi-file-text text-info"></i>
                  <strong>Average Entry Length:</strong>
                  <span class="ms-2">${patterns.avgLength} words</span>
                </div>
              </div>
            </div>
          `;
        }
        
        // Writing frequency
        if (patterns.frequency) {
          html += `
            <div class="col-md-6 mb-3">
              <div class="card">
                <div class="card-body">
                  <i class="bi bi-graph-up-arrow text-warning"></i>
                  <strong>Writing Frequency:</strong>
                  <span class="ms-2">${patterns.frequency}</span>
                </div>
              </div>
            </div>
          `;
        }
        
        patternsContainer.innerHTML = html || '<div class="col-12"><p class="text-muted">Not enough data to show patterns yet. Keep journaling!</p></div>';
      }
    } catch (error) {
      console.error('Error displaying patterns:', error);
    }
  }

  calculatePatterns(entries) {
    const patterns = {};
    
    // Time of day patterns
    const timeSlots = {
      morning: { count: 0, hours: [] },
      afternoon: { count: 0, hours: [] },
      evening: { count: 0, hours: [] },
      night: { count: 0, hours: [] }
    };
    
    // Day of week patterns
    const dayCounts = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };
    
    let totalWords = 0;
    
    entries.forEach(entry => {
      const date = new Date(entry.createdAt || entry.date);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const wordCount = entry.wordCount || (entry.content ? entry.content.split(/\s+/).filter(Boolean).length : 0);
      
      totalWords += wordCount;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      
      if (hour >= 5 && hour < 12) {
        timeSlots.morning.count++;
        timeSlots.morning.hours.push(hour);
      } else if (hour >= 12 && hour < 17) {
        timeSlots.afternoon.count++;
        timeSlots.afternoon.hours.push(hour);
      } else if (hour >= 17 && hour < 22) {
        timeSlots.evening.count++;
        timeSlots.evening.hours.push(hour);
      } else {
        timeSlots.night.count++;
        timeSlots.night.hours.push(hour);
      }
    });
    
    // Find best writing time
    const bestTimeSlot = Object.entries(timeSlots)
      .sort((a, b) => b[1].count - a[1].count)[0];
    
    if (bestTimeSlot && bestTimeSlot[1].count > 0) {
      const avgHour = bestTimeSlot[1].hours.reduce((a, b) => a + b, 0) / bestTimeSlot[1].hours.length;
      const timeLabel = bestTimeSlot[0].charAt(0).toUpperCase() + bestTimeSlot[0].slice(1);
      patterns.bestTime = `${timeLabel} (${Math.round(avgHour)}:00)`;
    }
    
    // Find most active day
    const mostActiveDay = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (mostActiveDay && mostActiveDay[1] > 0) {
      patterns.mostActiveDay = `${mostActiveDay[0]} (${mostActiveDay[1]} entries)`;
    }
    
    // Average entry length
    if (entries.length > 0) {
      patterns.avgLength = Math.round(totalWords / entries.length);
    }
    
    // Writing frequency
    const daysWithEntries = new Set(entries.map(e => 
      new Date(e.createdAt || e.date).toDateString()
    )).size;
    
    if (daysWithEntries > 0) {
      const avgEntriesPerDay = (entries.length / daysWithEntries).toFixed(1);
      patterns.frequency = `${avgEntriesPerDay} entries per day`;
    }
    
    return patterns;
  }

  // Add these helper methods if missing:
  getEmotionClass(emotion) {
    const classMap = {
      'joy': 'bg-warning text-dark',
      'sadness': 'bg-primary',
      'anger': 'bg-danger',
      'fear': 'bg-info',
      'anxiety': 'bg-purple',
      'neutral': 'bg-secondary',
      'stress': 'bg-orange',
      'gratitude': 'bg-success',
      'love': 'bg-pink',
      'hope': 'bg-teal'
    };

    return classMap[emotion] || 'bg-secondary';
  }

  getEmotionColor(emotion) {
    const colorMap = {
      'joy': '#FFD700',
      'sadness': '#4169E1',
      'anger': '#FF4500',
      'fear': '#9370DB',
      'anxiety': '#BA55D3',
      'neutral': '#A9A9A9',
      'stress': '#FF6347',
      'gratitude': '#32CD32',
      'love': '#FF1493',
      'hope': '#87CEEB'
    };

    return colorMap[emotion] || '#A9A9A9';
  }

  generateNewPrompt() {
    const prompts = [
      "What's one small win you had today?",
      "What are you looking forward to?",
      "What's something you're learning about yourself?",
      "What would your best self do right now?",
      "What's bringing you comfort these days?",
      "What boundaries might you need to set?",
      "What does your heart need to hear today?",
      "What's a memory that makes you smile?",
      "What would you tell your younger self?",
      "What's something you've been avoiding that needs attention?"
    ];

    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const promptsList = document.getElementById('promptsList');

    if (promptsList) {
      // Create new prompt item
      const promptDiv = document.createElement('div');
      promptDiv.className = 'prompt-item mb-2';
      promptDiv.textContent = `• ${randomPrompt}`;

      // Add at the top
      promptsList.insertBefore(promptDiv, promptsList.firstChild);

      // Limit to 5 prompts
      while (promptsList.children.length > 5) {
        promptsList.removeChild(promptsList.lastChild);
      }
    }
  }

  searchEntries(query) {
    // Basic client-side search
    const entries = document.querySelectorAll('.journal-card');
    entries.forEach(entry => {
      const text = entry.textContent.toLowerCase();
      if (text.includes(query.toLowerCase())) {
        entry.style.display = '';
      } else {
        entry.style.display = 'none';
      }
    });
  }

  // ... rest of helper methods remain the same ...

}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the journal page
  if (document.querySelector('.journal-container')) {
    window.journalApp = new MindHavenJournal();
  }
});