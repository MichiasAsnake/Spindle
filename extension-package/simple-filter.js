// simple-filter.js - A direct DOM manipulation approach for PMS filtering

// Create a floating filter control panel
function createDirectFilterPanel() {
  console.log('Creating JobSight panel');
  
  // Check if we already added the panel
  if (document.querySelector('#jobsight-panel')) {
    console.log('JobSight panel already exists');
    return;
  }
  
  // Create the panel container
  const panel = document.createElement('div');
  panel.id = 'jobsight-panel';
  panel.className = 'jobsight-panel collapsed';
  
  // Create the collapsed/expanded state toggle
  let isExpanded = true;
  
  // Create the header (always visible part)
  const header = document.createElement('div');
  header.className = 'jobsight-header';
  
  // Add logo
  const logo = document.createElement('div');
  logo.className = 'jobsight-logo';
  logo.innerHTML = `<img src="${chrome.runtime.getURL('images/logo.png')}" alt="JobSight">`;
  header.appendChild(logo);
  
  // Add logo text (only visible when expanded)
  const logoText = document.createElement('div');
  logoText.className = 'jobsight-logo-text';
  logoText.textContent = 'JobSight';
  header.appendChild(logoText);
  
  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'jobsight-toggle';
  toggleButton.innerHTML = '◀';
  toggleButton.setAttribute('aria-label', 'Expand panel');
  header.appendChild(toggleButton);
  
  // Add header to panel
  panel.appendChild(header);
  
  // Create content container (only visible when expanded)
  const content = document.createElement('div');
  content.className = 'jobsight-content';
  
  // Add filter label
  const filterLabel = document.createElement('div');
  filterLabel.className = 'jobsight-filter-label';
  filterLabel.textContent = 'PMS filter:';
  content.appendChild(filterLabel);
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'jobsight-button-group';
  
  // Create "All" button
  const allButton = document.createElement('button');
  allButton.textContent = 'All';
  allButton.dataset.filter = 'all';
  allButton.className = 'jobsight-button active';
  allButton.onclick = () => applyDirectFilter('all');
  buttonContainer.appendChild(allButton);
  
  // Create "Has PMS" button
  const hasPmsButton = document.createElement('button');
  hasPmsButton.textContent = 'Has PMS';
  hasPmsButton.dataset.filter = 'has-pms';
  hasPmsButton.className = 'jobsight-button';
  hasPmsButton.onclick = () => applyDirectFilter('has-pms');
  buttonContainer.appendChild(hasPmsButton);
  
  // Create "No PMS" button
  const noPmsButton = document.createElement('button');
  noPmsButton.textContent = 'No PMS';
  noPmsButton.dataset.filter = 'no-pms';
  noPmsButton.className = 'jobsight-button';
  noPmsButton.onclick = () => applyDirectFilter('no-pms');
  buttonContainer.appendChild(noPmsButton);
  
  // Add buttons to content
  content.appendChild(buttonContainer);
  
  // Add version number
  const version = document.createElement('div');
  version.className = 'jobsight-version';
  version.textContent = 'v 1.0.0';
  content.appendChild(version);
  
  // Add content to panel
  panel.appendChild(content);
  
  // Add panel to page
  document.body.appendChild(panel);
 

  // Add CSS styles
  addStyles();
  makePanelDraggable(panel, header);

  // Set up toggle functionality
  toggleButton.addEventListener('click', () => {
    const isCollapsed = panel.classList.contains('collapsed');
  
    if (isCollapsed) {
      panel.classList.remove('collapsed');
      toggleButton.innerHTML = '▶';
      toggleButton.setAttribute('aria-label', 'Collapse panel');
    } else {
      panel.classList.add('collapsed');
      toggleButton.innerHTML = '◀';
      toggleButton.setAttribute('aria-label', 'Expand panel');
    }
  });
  
  console.log('JobSight panel created');
}
function makePanelDraggable(panel) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const header = panel.querySelector('.jobsight-header');

  header.style.cursor = 'move';

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
    document.body.style.userSelect = 'none'; // prevent text selection while dragging
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const panelWidth = panel.offsetWidth;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Allow horizontal movement during drag
    let newLeft = e.clientX - offsetX;
    
    // Constrain vertical movement
    let newTop = e.clientY - offsetY;
    newTop = Math.max(0, Math.min(windowHeight - panel.offsetHeight, newTop));
    
    // Update position during drag
    panel.style.left = `${newLeft}px`;
    panel.style.right = 'auto';
    panel.style.top = `${newTop}px`;

    // Calculate distances to edges for snapping
    const distanceToLeft = newLeft;
    const distanceToRight = windowWidth - (newLeft + panelWidth);
    
    // Add snap threshold
    const snapThreshold = 50; // pixels from edge to trigger snap

    // Check if near edges for snapping preview
    if (distanceToLeft < snapThreshold || distanceToRight < snapThreshold) {
      if (distanceToLeft < distanceToRight) {
        panel.style.left = '0px';
        panel.style.right = 'auto';
      } else {
        panel.style.left = 'auto';
        panel.style.right = '0px';
      }
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = ''; // re-enable text selection

      // Get final position and snap to nearest edge
      const rect = panel.getBoundingClientRect();
      const distanceToLeft = rect.left;
      const distanceToRight = window.innerWidth - rect.right;

      if (distanceToLeft < distanceToRight) {
        panel.style.left = '0px';
        panel.style.right = 'auto';
      } else {
        panel.style.left = 'auto';
        panel.style.right = '0px';
      }
    }
  });
}

// Add CSS styles for the panel
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'BRSonoma';
      src: url('${chrome.runtime.getURL('fonts/BRSonoma-SemiBold.otf')}') format('opentype');
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'BRSonoma';
      src: url('${chrome.runtime.getURL('fonts/BRSonoma-Medium.otf')}') format('opentype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    .jobsight-panel {
      position: fixed;
      top: 20px;
      left: auto;
      right: 20px;
      z-index: 9999;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      overflow: hidden;
      width: 300px;
    }
    
    .jobsight-panel.collapsed {
      width: 80px;
    }
    
    .jobsight-header {
  background: #00C07F;
  color: white;
  padding: 10px;
  display: flex;
  align-items: center;
  height: 50px;
  justify-content: space-between; /* Distribute space */
}

    
    .jobsight-logo {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .jobsight-logo img {
      max-width: 100%;
      max-height: 100%;
    }
    
    .jobsight-logo-text {
      font-size: 24px;
      font-weight: 600;
      margin-left: auto;
      flex-grow: 1;
      font-family: 'BRSonoma', Arial, sans-serif;
      transition: opacity 0.3s ease;
      text-align: right;
    }
    
    .collapsed .jobsight-logo-text {
      opacity: 0;
      width: 0;
      margin-left: 0;
    }
    
    .jobsight-toggle {
  background: transparent;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 10px;         /* Increase clickable padding */
  min-width: 30px;       /* Ensures it stays tappable */
  height: 40px;          /* Matches header height */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;        /* Prevent shrinking inside flex */
  z-index: 1;            /* Optional: make sure it stays on top */
}

    
    .jobsight-content {
      padding: 15px;
      transition: all 0.3s ease;
    }
    
    .collapsed .jobsight-content {
      opacity: 0;
      max-height: 0;
      padding: 0;
      pointer-events: none;
    }
    
    .jobsight-filter-label {
      color: #00C07F;
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 16px;
      font-family: 'BRSonoma', sans-serif;
    }
    
    .jobsight-button-group {
      display: flex;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #00C07F;
    }
    
    .jobsight-button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      background: white;
      cursor: pointer;
      font-family: 'BRSonoma', sans-serif;
      transition: all 0.2s ease;
      color: #00C07F;
      font-size: 14px;
    }
    
    .jobsight-button:not(:last-child) {
      border-right: 1px solid #00C07F;
    }
    
    .jobsight-button:hover {
      background: #f0f0f0;
    }
    
    .jobsight-button.active {
      background: #00C07F;
      color: white;
    }
    
    .jobsight-version {
      text-align: right;
      color: #999;
      font-size: 10px;
      margin-top: 10px;
      font-family: Arial, sans-serif;
    }
  `;
  document.head.appendChild(style);
}

// Apply the direct filter
function applyDirectFilter(filterType) {
  console.log(`Applying direct filter: ${filterType}`);
  
  // Update button states
  const buttons = document.querySelectorAll('.jobsight-button');
  buttons.forEach(button => {
    if (button.dataset.filter === filterType) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Get all job rows
  const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
  console.log(`Filtering ${jobRows.length} job rows`);
  
  // Apply filtering
  jobRows.forEach(row => {
    const jobId = row.getAttribute('data-jobnumber');
    const pmsCell = row.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
    
    if (pmsCell) {
      const hasPms = pmsCell.classList.contains('has-pms');
      
      // Simple visibility control using direct inline style
      if (filterType === 'all') {
        row.style.display = '';
      } else if (filterType === 'has-pms' && !hasPms) {
        row.style.display = 'none';
      } else if (filterType === 'no-pms' && hasPms) {
        row.style.display = 'none';
      } else {
        row.style.display = '';
      }
    }
  });
}

// Set up a mutation observer to watch for table changes
function setupTableObserver() {
  console.log('Setting up table observer');
  
  const observer = new MutationObserver(mutations => {
    console.log('Table mutation detected');
    
    // Get the active filter
    const activeButton = document.querySelector('.jobsight-button.active');
    if (activeButton) {
      // Reapply the current filter after a short delay
      setTimeout(() => {
        applyDirectFilter(activeButton.dataset.filter);
      }, 200);
    }
  });
  
  // Observe the job table
  const jobTable = document.querySelector('table.data-results');
  if (jobTable) {
    observer.observe(jobTable, { childList: true, subtree: true });
    console.log('Now observing job table for changes');
  }
}

// Initialize
function initDirectFiltering() {
  console.log('Initializing JobSight filtering');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReady);
  } else {
    onDomReady();
  }
}

function onDomReady() {
  // Wait for the page to fully load and for the PMS column to be added
  setTimeout(() => {
    createDirectFilterPanel();
    setupTableObserver();
  }, 2000);
}

// Start the direct filtering
initDirectFiltering();