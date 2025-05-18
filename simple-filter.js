// simple-filter.js - A direct DOM manipulation approach for PMS filtering

// Save user preferences to Chrome storage
function saveUserPreferences(isExpanded, activeFilter, position) {
  const prefsToSave = {
    'jobsightPanelExpanded': isExpanded,
    'jobsightActiveFilter': activeFilter
  };
  
  // Add position if provided
  if (position) {
    prefsToSave.jobsightPanelPosition = position;
  }
  
  chrome.storage.sync.set(prefsToSave, function() {
    console.log('Preferences saved:', prefsToSave);
  });
}

// Load user preferences from Chrome storage
function loadUserPreferences(callback) {
  chrome.storage.sync.get(['jobsightPanelExpanded', 'jobsightActiveFilter', 'jobsightPanelPosition'], function(result) {
    console.log('Preferences loaded:', result);
    callback(result);
  });
}

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
  panel.className = 'jobsight-panel collapsed'; // Start collapsed by default
  
  // Create the collapsed/expanded state toggle
  let isExpanded = false; // Start collapsed by default
  let activeFilter = 'all'; // Default filter
  
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
  toggleButton.innerHTML = '▶';
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
  
  // Create button container with slider
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'jobsight-button-group';
  
  // Create slider element (this will move to indicate the active button)
  const slider = document.createElement('div');
  slider.className = 'jobsight-slider';
  buttonContainer.appendChild(slider);
  
  // Create "All" button
  const allButton = document.createElement('button');
  allButton.textContent = 'All';
  allButton.dataset.filter = 'all';
  allButton.className = 'jobsight-button active';
  allButton.onclick = () => {
    applyDirectFilter('all', slider);
    saveUserPreferences(isExpanded, 'all');
  };
  buttonContainer.appendChild(allButton);
  
  // Create "Has PMS" button
  const hasPmsButton = document.createElement('button');
  hasPmsButton.textContent = 'Has PMS';
  hasPmsButton.dataset.filter = 'has-pms';
  hasPmsButton.className = 'jobsight-button';
  hasPmsButton.onclick = () => {
    applyDirectFilter('has-pms', slider);
    saveUserPreferences(isExpanded, 'has-pms');
  };
  buttonContainer.appendChild(hasPmsButton);
  
  // Create "No PMS" button
  const noPmsButton = document.createElement('button');
  noPmsButton.textContent = 'No PMS';
  noPmsButton.dataset.filter = 'no-pms';
  noPmsButton.className = 'jobsight-button';
  noPmsButton.onclick = () => {
    applyDirectFilter('no-pms', slider);
    saveUserPreferences(isExpanded, 'no-pms');
  };
  buttonContainer.appendChild(noPmsButton);
  
  // Add buttons to content
  content.appendChild(buttonContainer);
  
  // Add version number
  const version = document.createElement('div');
  version.className = 'jobsight-version';
  version.textContent = 'v 1.0.4';
  content.appendChild(version);
  
  // Add content to panel
  panel.appendChild(content);
  
  // Add panel to page
  document.body.appendChild(panel);
  
  // Add CSS styles
  addStyles();
  
  // Load user preferences
  loadUserPreferences((prefs) => {
    // Apply saved panel state, but only if explicitly set to true
    // This ensures the panel starts collapsed by default
    if (prefs.jobsightPanelExpanded === true) {
      isExpanded = true;
      panel.classList.remove('collapsed');
      panel.classList.add('expanded');
      toggleButton.innerHTML = '◀';
      toggleButton.setAttribute('aria-label', 'Collapse panel');
    } else {
      // Ensure collapsed state
      isExpanded = false;
      panel.classList.add('collapsed');
      panel.classList.remove('expanded');
      toggleButton.innerHTML = '▶';
      toggleButton.setAttribute('aria-label', 'Expand panel');
    }
    
    // Apply saved position if available
    if (prefs.jobsightPanelPosition) {
      panel.style.top = prefs.jobsightPanelPosition.top;
      panel.style.right = prefs.jobsightPanelPosition.right;
    }
    
    // Apply saved filter
    if (prefs.jobsightActiveFilter) {
      setTimeout(() => {
        applyDirectFilter(prefs.jobsightActiveFilter, slider);
      }, 300);
    } else {
      // Position the slider initially on the "All" button
      setTimeout(() => {
        positionSlider(allButton, slider);
      }, 300);
    }
  });
  
  // Set up toggle functionality
  toggleButton.addEventListener('click', function(e) {
    // Stop event propagation to prevent conflicts with drag handler
    e.stopPropagation();
    
    isExpanded = !isExpanded;
    
    if (isExpanded) {
      panel.classList.remove('collapsed');
      panel.classList.add('expanded');
      toggleButton.innerHTML = '◀';
      toggleButton.setAttribute('aria-label', 'Collapse panel');
    } else {
      panel.classList.remove('expanded');
      panel.classList.add('collapsed');
      toggleButton.innerHTML = '▶';
      toggleButton.setAttribute('aria-label', 'Expand panel');
    }
    
    // Save the expanded state
    saveUserPreferences(isExpanded, activeFilter);
  });
  
  // Make the header also toggle the panel when clicked (except the toggle button)
  logo.addEventListener('click', (e) => {
    // Stop event propagation to prevent conflicts with drag handler
    e.stopPropagation();
    toggleButton.click();
  });
  
  logoText.addEventListener('click', (e) => {
    // Stop event propagation to prevent conflicts with drag handler
    e.stopPropagation();
    toggleButton.click();
  });
  
  // Add drag functionality to the panel
  makeDraggable(panel, header);
  
  console.log('JobSight panel created');
}

// Make an element draggable
function makeDraggable(element, dragHandle) {
  let offsetX, offsetY, initialX, initialY;
  let isDragging = false;
  let dragStartTime = 0;
  
  // Function to handle mouse down event
  const onMouseDown = (e) => {
    // Only allow dragging from the handle, and not when clicking buttons or elements inside buttons
    if (e.target.tagName === 'BUTTON' || 
        e.target.closest('button') || 
        e.target.classList.contains('jobsight-toggle') || 
        !e.target.closest(`.${dragHandle.className}`)) {
      return;
    }
    
    e.preventDefault();
    dragStartTime = Date.now();
    
    // Get the initial position of the cursor and the element
    initialX = e.clientX;
    initialY = e.clientY;
    
    // Calculate the offset between the cursor and the element's top-left corner
    const rect = element.getBoundingClientRect();
    offsetX = initialX - rect.left;
    offsetY = initialY - rect.top;
    
    // Add event listeners for mouse move and mouse up
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    isDragging = true;
    
    // Add a dragging class to the element
    element.classList.add('dragging');
  };
  
  // Function to handle mouse move event
  const onMouseMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // Calculate the new position
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Apply the new position
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.right = 'auto';
    
    // Save the position after a short delay to avoid excessive storage writes
    clearTimeout(element.savePositionTimeout);
    element.savePositionTimeout = setTimeout(() => {
      const position = {
        top: `${y}px`,
        left: `${x}px`,
        right: 'auto'
      };
      saveUserPreferences(
        element.classList.contains('expanded'),
        document.querySelector('.jobsight-button.active')?.dataset.filter || 'all',
        position
      );
    }, 500);
  };
  
  // Function to handle mouse up event
  const onMouseUp = (e) => {
    isDragging = false;
    
    // Remove event listeners for mouse move and mouse up
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // Remove the dragging class from the element
    element.classList.remove('dragging');
    
    // If this was a short click (not a drag), and not on the toggle button,
    // check if we should toggle the panel
    const clickDuration = Date.now() - dragStartTime;
    if (clickDuration < 200 && 
        !e.target.classList.contains('jobsight-toggle') && 
        !e.target.closest('.jobsight-toggle')) {
      // Find and click the toggle button
      const toggleButton = element.querySelector('.jobsight-toggle');
      if (toggleButton) {
        // Simulate a click on the toggle button
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        toggleButton.dispatchEvent(clickEvent);
      }
    }
  };
  
  // Add event listener for mouse down on the drag handle
  dragHandle.addEventListener('mousedown', onMouseDown);
}

// Position the slider under the active button
function positionSlider(activeButton, slider) {
  if (!activeButton || !slider) return;
  
  const buttonRect = activeButton.getBoundingClientRect();
  const containerRect = activeButton.parentElement.getBoundingClientRect();
  
  // Set the width and position of the slider
  slider.style.width = `${buttonRect.width}px`;
  slider.style.transform = `translateX(${buttonRect.left - containerRect.left}px)`;
}

// Add CSS styles for the panel
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'BRSonoma-SemiBold';
      src: url('${chrome.runtime.getURL('fonts/BRSonoma-SemiBold.otf')}') format('opentype');
      font-weight: 600;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'BRSonoma-Medium';
      src: url('${chrome.runtime.getURL('fonts/BRSonoma-Medium.otf')}') format('opentype');
      font-weight: 500;
      font-style: normal;
    }
    
    .jobsight-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      overflow: hidden;
      width: 300px;
      user-select: none;
      font-family: 'BRSonoma-Medium', Arial, sans-serif;
    }
    
    .jobsight-panel:hover {
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    
    .jobsight-panel.dragging {
      opacity: 0.8;
      transition: none;
    }
    
    .jobsight-panel.collapsed {
      width: 80px;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    
    .jobsight-panel.expanded {
      width: 300px;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    
    .jobsight-header {
      background: #00C07F;
      color: white;
      padding: 10px;
      display: flex;
      align-items: center;
      height: 50px;
      cursor: move;
    }
    
    .jobsight-logo {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .jobsight-logo img {
      max-width: 100%;
      max-height: 100%;
    }
    
    .jobsight-logo-text {
      font-size: 24px;
      font-weight: bold;
      margin-left: 10px;
      flex-grow: 1;
      font-family: 'BRSonoma-SemiBold', Arial, sans-serif;
      transition: opacity 0.3s ease, transform 0.3s ease;
      white-space: nowrap;
    }
    
    .collapsed .jobsight-logo-text {
      opacity: 0;
      transform: translateX(-20px);
      width: 0;
      margin-left: 0;
    }
    
    .expanded .jobsight-logo-text {
      opacity: 1;
      transform: translateX(0);
    }
    
    .jobsight-toggle {
      background: transparent;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
      z-index: 10;
      position: relative;
      min-width: 30px;
      min-height: 30px;
      outline: none;
    }
    
    .jobsight-toggle:hover {
      transform: scale(1.2);
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
    
    .jobsight-toggle:active {
      transform: scale(0.95);
    }
    
    .jobsight-content {
      padding: 15px;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      opacity: 1;
      height: auto;
    }
    
    .collapsed .jobsight-content {
      opacity: 0;
      height: 0;
      padding: 0;
      pointer-events: none;
    }
    
    .jobsight-filter-label {
      color: #00C07F;
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 16px;
      font-family: 'BRSonoma-Medium', Arial, sans-serif;
    }
    
    .jobsight-button-group {
      display: flex;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #00C07F;
      position: relative;
    }
    
    .jobsight-slider {
      position: absolute;
      height: 100%;
      background-color: #00C07F;
      top: 0;
      left: 0;
      z-index: 1;
      transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      border-radius: 2px;
    }
    
    .jobsight-button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: 'BRSonoma-Medium', Arial, sans-serif;
      transition: all 0.2s ease;
      color: #00C07F;
      font-size: 14px;
      position: relative;
      z-index: 2;
    }
    
    .jobsight-button:not(:last-child) {
      border-right: 1px solid rgba(0, 192, 127, 0.2);
    }
    
    .jobsight-button:hover {
      background: rgba(0, 192, 127, 0.1);
    }
    
    .jobsight-button.active {
      color: white;
    }
    
    .jobsight-version {
      text-align: right;
      color: #999;
      font-size: 10px;
      margin-top: 10px;
      font-family: 'BRSonoma-Medium', Arial, sans-serif;
    }
  `;
  document.head.appendChild(style);
}

// Apply the direct filter
function applyDirectFilter(filterType, slider) {
  console.log(`Applying direct filter: ${filterType}`);
  
  // Update button states
  const buttons = document.querySelectorAll('.jobsight-button');
  let activeButton = null;
  
  buttons.forEach(button => {
    if (button.dataset.filter === filterType) {
      button.classList.add('active');
      activeButton = button;
    } else {
      button.classList.remove('active');
    }
  });
  
  // Move the slider to the active button
  if (activeButton && slider) {
    positionSlider(activeButton, slider);
  }
  
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
    
    // Get the active filter and slider
    const activeButton = document.querySelector('.jobsight-button.active');
    const slider = document.querySelector('.jobsight-slider');
    
    if (activeButton) {
      // Reapply the current filter after a short delay
      setTimeout(() => {
        applyDirectFilter(activeButton.dataset.filter, slider);
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

// Handle window resize to reposition the slider
function handleResize() {
  const activeButton = document.querySelector('.jobsight-button.active');
  const slider = document.querySelector('.jobsight-slider');
  
  if (activeButton && slider) {
    positionSlider(activeButton, slider);
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
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
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