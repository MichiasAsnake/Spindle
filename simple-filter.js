// simple-filter.js - A direct DOM manipulation approach for PMS filtering

// Create a floating filter control panel
function createDirectFilterPanel() {
  console.log('Creating direct filter panel');
  
  // Check if we already added the panel
  if (document.querySelector('#direct-pms-filter-panel')) {
    console.log('Direct filter panel already exists');
    return;
  }
  
  // Create the panel container
  const panel = document.createElement('div');
  panel.id = 'direct-pms-filter-panel';
  panel.style.position = 'fixed';
  panel.style.top = '50px'; // Position below any potential header
  panel.style.right = '10px';
  panel.style.zIndex = '9999';
  panel.style.background = 'white';
  panel.style.padding = '10px';
  panel.style.borderRadius = '4px';
  panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  panel.style.border = '1px solid #ddd';
  
  // Add a title
  const title = document.createElement('h3');
  title.textContent = 'Direct PMS Filter';
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '16px';
  title.style.fontWeight = 'bold';
  panel.appendChild(title);
  
  // Add a note about this being a different approach
  const note = document.createElement('p');
  note.textContent = 'This is a direct DOM filter that bypasses the site\'s JS.';
  note.style.fontSize = '11px';
  note.style.margin = '0 0 10px 0';
  note.style.color = '#666';
  panel.appendChild(note);
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '5px';
  
  // Create "All" button
  const allButton = document.createElement('button');
  allButton.textContent = 'All';
  allButton.dataset.filter = 'all';
  allButton.className = 'direct-filter-button active';
  allButton.onclick = () => applyDirectFilter('all');
  styleButton(allButton);
  buttonContainer.appendChild(allButton);
  
  // Create "Has PMS" button
  const hasPmsButton = document.createElement('button');
  hasPmsButton.textContent = 'Has PMS';
  hasPmsButton.dataset.filter = 'has-pms';
  hasPmsButton.className = 'direct-filter-button';
  hasPmsButton.onclick = () => applyDirectFilter('has-pms');
  styleButton(hasPmsButton);
  buttonContainer.appendChild(hasPmsButton);
  
  // Create "No PMS" button
  const noPmsButton = document.createElement('button');
  noPmsButton.textContent = 'No PMS';
  noPmsButton.dataset.filter = 'no-pms';
  noPmsButton.className = 'direct-filter-button';
  noPmsButton.onclick = () => applyDirectFilter('no-pms');
  styleButton(noPmsButton);
  buttonContainer.appendChild(noPmsButton);
  
  // Add buttons to panel
  panel.appendChild(buttonContainer);
  
  // Add panel to page
  document.body.appendChild(panel);
  
  // Add CSS for button styling
  const style = document.createElement('style');
  style.textContent = `
    .direct-filter-button {
      padding: 5px 10px;
      border: 1px solid #ccc;
      border-radius: 3px;
      background: #f0f0f0;
      cursor: pointer;
      font-size: 14px;
    }
    
    .direct-filter-button.active {
      background-color: #007bff;
      color: white;
      border-color: #0056b3;
    }
  `;
  document.head.appendChild(style);
  
  console.log('Direct filter panel created');
}

// Style button helper
function styleButton(button) {
  button.style.padding = '5px 10px';
  button.style.border = '1px solid #ccc';
  button.style.borderRadius = '3px';
  button.style.background = '#f0f0f0';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';
}

// Apply the direct filter
function applyDirectFilter(filterType) {
  console.log(`Applying direct filter: ${filterType}`);
  
  // Update button states
  const buttons = document.querySelectorAll('.direct-filter-button');
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
    const activeButton = document.querySelector('.direct-filter-button.active');
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
  console.log('Initializing direct PMS filtering');
  
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