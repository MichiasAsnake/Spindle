// content.js - Runs on the job list page

console.log('Decopress PMS Indicator content script loaded - START');

// Create a mapping of job IDs to their PMS status
const pmsJobStatus = {};
// Create a mapping of user overrides
const pmsUserOverrides = {};

// Function to get PMS patterns - ensures patterns are always available
function getPmsPatterns() {
  return [
    /\bpms\s*\d+\b/i,                  // PMS followed by numbers (PMS 123)
    /\bpantone\s*\d+\b/i,              // Pantone followed by numbers
    /\bspot\s*colou?r\b/i,             // Spot color/colour
    /\bpms\s*[a-z]+\s*\d+\b/i,         // PMS with color name and number (PMS Blue 072)
    /\bpantone\s*[a-z]+\s*\d+\b/i,     // Pantone with color name and number
    /\bpms\b/i                          // Just PMS (but only if NO PMS wasn't found)
  ];
}

// Function to check if a job has PMS colors by examining page content
function detectPmsColors() {
  console.log('Detecting PMS colors in job page');
  
  // Get the job ID from the URL
  const jobId = window.location.href.match(/ID=(\d+)/i)?.[1];
  if (!jobId) {
    console.error('Could not extract job ID from URL');
    return;
  }

  // Check if there's a user override for this job
  if (pmsUserOverrides[jobId] !== undefined) {
    console.log(`Using user override for job ${jobId}: ${pmsUserOverrides[jobId]}`);
    return pmsUserOverrides[jobId];
  }
  
  // Look for PMS colors in job lines only
  const jobLines = document.querySelectorAll('.js-jobline-row');
  console.log(`Found ${jobLines.length} job lines`);
  
  let hasPms = false;
  
  // Check each job line
  jobLines.forEach((row, index) => {
    // Get all text content from the row
    const allText = Array.from(row.querySelectorAll('td'))
      .map(td => td.textContent.trim())
      .join(' ')
      .toLowerCase(); // Convert to lowercase for case-insensitive matching
    
    console.log(`Job line ${index} - Checking text: "${allText.substring(0, 100)}..."`);
    
    // First check for explicit "NO PMS" cases
    if (/\bno\s+pms\b/i.test(allText) || /\bwithout\s+pms\b/i.test(allText)) {
      console.log(`Found explicit NO PMS in job line ${index}`);
      return; // Skip this line
    }
    
    // Get patterns and check for positive matches
    const patterns = getPmsPatterns();
    const hasPmsPattern = patterns.some(pattern => pattern.test(allText));
    
    if (hasPmsPattern) {
      console.log(`Found PMS color in job line ${index}: "${allText.substring(0, 100)}..."`);
      hasPms = true;
    }
  });
  
  // Check order comment if it exists
  const orderComment = document.querySelector('#orderComment');
  if (orderComment) {
    const commentText = orderComment.value.toLowerCase();
    console.log('Checking order comment for PMS colors');
    
    // Check for positive patterns
    const hasPmsPattern = getPmsPatterns().some(pattern => pattern.test(commentText));
    
    // Check for exclusion patterns
    const hasExclusionPattern = exclusionPatterns.some(pattern => pattern.test(commentText));
    
    // If it matches a PMS pattern and doesn't have an exclusion pattern
    if (hasPmsPattern && !hasExclusionPattern) {
      console.log('Found PMS color in order comment');
      hasPms = true;
    }
  }
  
  console.log(`PMS detection result for job ${jobId}: ${hasPms}`);
  
  // Update our local cache
  pmsJobStatus[jobId] = hasPms;
  
  // Send the status to the background script for storage and Supabase update
  chrome.runtime.sendMessage(
    { action: "updateJobPmsStatus", jobId: jobId, hasPms: hasPms },
    response => {
      console.log(`Updated PMS status for job ${jobId}:`, response);
    }
  );
  
  return hasPms;
}

// Function to add a PMS column to the job list table
function addPmsColumn() {
  console.log('Adding PMS column to job list');
  
  // Find the table header row - using the actual structure from the page
  const headerRow = document.querySelector('table.data-results thead tr');
  if (!headerRow) {
    console.error('Could not find job list header row');
    
    // Try to find any table headers to help debug
    const allHeaders = document.querySelectorAll('th');
    console.log('Found ' + allHeaders.length + ' table headers on page');
    allHeaders.forEach((header, index) => {
      console.log(`Header ${index}: ${header.textContent}`);
    });
    
    return;
  }
  
  console.log('Found job list header:', headerRow);
  
  // Create a new header cell for PMS status
  const pmsHeaderCell = document.createElement('th');
  pmsHeaderCell.className = 'pms-status-header';
  pmsHeaderCell.textContent = 'PMS';
  pmsHeaderCell.style.width = '40px';
  
  // Insert the new header cell after the Description column
  const descriptionHeader = headerRow.querySelector('th[id="sortDescription"]');
  if (descriptionHeader) {
    descriptionHeader.insertAdjacentElement('afterend', pmsHeaderCell);
    console.log('Added PMS header cell after Description column');
  } else {
    // Fallback: insert before the last cell
    headerRow.insertBefore(pmsHeaderCell, headerRow.lastElementChild);
    console.log('Added PMS header cell before last column');
  }
  
  // Find all job rows and add PMS status cells
  const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
  console.log(`Found ${jobRows.length} job rows`);
  
  jobRows.forEach((row, index) => {
    console.log(`Adding PMS cell to row ${index}`);
    addPmsCellToRow(row);
  });
}

// Function to add a PMS status cell to a job row
function addPmsCellToRow(row) {
  // Get the job ID from the row
  const jobId = row.getAttribute('data-jobnumber');
  if (!jobId) {
    console.error('Row is missing data-jobnumber attribute:', row);
    return;
  }
  
  console.log(`Adding PMS cell for job ID: ${jobId}`);
  
  // Create a new cell for PMS status
  const pmsCell = document.createElement('td');
  pmsCell.className = 'pms-status-cell';
  pmsCell.setAttribute('data-job-id', jobId);
  
  // Set initial content (loading indicator)
  pmsCell.innerHTML = '<span class="pms-loading">⏳</span>';
  
  // Find the Description cell to insert after
  const cells = row.querySelectorAll('td');
  if (cells.length >= 3) {
    // Insert after the third cell (Description)
    cells[2].insertAdjacentElement('afterend', pmsCell);
  } else {
    // Fallback: insert before the last cell
    row.insertBefore(pmsCell, row.lastElementChild);
  }
  
  // Check if we have the PMS status in memory
  if (pmsJobStatus[jobId] !== undefined) {
    console.log(`Using cached PMS status for job ${jobId}: ${pmsJobStatus[jobId]}`);
    updatePmsCellStatus(pmsCell, pmsJobStatus[jobId]);
  } else {
    // Request PMS status from background script
    console.log(`Requesting PMS status for job ${jobId} from background`);
    chrome.runtime.sendMessage(
      { action: "getJobPmsStatus", jobId: jobId },
      response => {
        console.log(`Received PMS status for job ${jobId}:`, response);
        // Store the response in our mapping
        pmsJobStatus[jobId] = response.hasPms;
        // Update the cell with the status
        updatePmsCellStatus(pmsCell, response.hasPms);
      }
    );
  }
}

// Function to update a PMS status cell with the appropriate indicator
function updatePmsCellStatus(cell, hasPms) {
  console.log(`Updating cell status: hasPms=${hasPms}`);
  
  // Remove any existing classes
  cell.classList.remove('has-pms', 'no-pms');
  
  // Create the status indicator with override buttons
  const jobId = cell.getAttribute('data-job-id');
  const statusHtml = hasPms ? 
    `<span class="pms-yes">✅</span>
     <div class="pms-override-buttons">
       <button class="pms-override-btn" data-override="false" title="Mark as No PMS">❌</button>
     </div>` :
    `<span class="pms-no">❌</span>
     <div class="pms-override-buttons">
       <button class="pms-override-btn" data-override="true" title="Mark as Has PMS">✅</button>
     </div>`;
  
  cell.innerHTML = statusHtml;
  cell.title = hasPms ? 'Contains PMS colors' : 'No PMS colors';
  cell.classList.add(hasPms ? 'has-pms' : 'no-pms');
  
  // Add click handlers for override buttons
  const overrideBtn = cell.querySelector('.pms-override-btn');
  if (overrideBtn) {
    overrideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newStatus = overrideBtn.getAttribute('data-override') === 'true';
      handlePmsOverride(jobId, newStatus);
    });
  }
}

// Function to handle PMS status override
function handlePmsOverride(jobId, newStatus) {
  console.log(`User overriding PMS status for job ${jobId} to: ${newStatus}`);
  
  // Store the override
  pmsUserOverrides[jobId] = newStatus;
  
  // Update the UI
  const pmsCell = document.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
  if (pmsCell) {
    updatePmsCellStatus(pmsCell, newStatus);
  }
  
  // Send the override to the background script for storage and Supabase update
  chrome.runtime.sendMessage(
    { 
      action: "updateJobPmsStatus", 
      jobId: jobId, 
      hasPms: newStatus,
      isUserOverride: true 
    },
    response => {
      console.log(`Updated PMS override for job ${jobId}:`, response);
    }
  );
}

// Function to check for job rows that need PMS cells
function checkForNewJobRows() {
  console.log('Checking for new job rows');
  const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
  console.log(`Found ${jobRows.length} total job rows`);
  
  let newRowCount = 0;
  
  jobRows.forEach(row => {
    // Check if this row already has a PMS cell
    const jobId = row.getAttribute('data-jobnumber');
    const existingPmsCell = row.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
    
    if (!existingPmsCell) {
      console.log(`Found new row for job ${jobId}`);
      addPmsCellToRow(row);
      newRowCount++;
    }
  });
  
  console.log(`Added PMS cells to ${newRowCount} new rows`);
}

// Function to handle the job detail page
function handleJobDetailPage() {
  console.log('Handling job detail page');
  
  // Look for the job title element
  const titleElements = document.querySelectorAll('.job-title, h1, h2, h3, .header-title');
  let titleElement = null;
  
  for (const el of titleElements) {
    if (el.textContent && el.textContent.trim()) {
      titleElement = el;
      break;
    }
  }
  
  if (!titleElement) {
    console.error('Could not find job title element');
    return;
  }
  
  console.log('Found title element:', titleElement);
  
  // Create a PMS indicator element
  const pmsIndicator = document.createElement('div');
  pmsIndicator.className = 'pms-indicator';
  
  // Get the job ID from the URL
  const jobId = window.location.href.match(/ID=(\d+)/i)?.[1];
  if (!jobId) {
    console.error('Could not extract job ID from URL');
    return;
  }
  
  console.log(`Job ID from URL: ${jobId}`);
  
  // Set initial content (loading)
  pmsIndicator.innerHTML = '<span class="pms-loading">⏳ Checking PMS</span>';
  
  // Add to the title element
  titleElement.appendChild(pmsIndicator);
  
  // First, detect PMS colors in the current page
  const detectedPms = detectPmsColors();
  
  // Then, update the UI with the result
  updateJobDetailPmsStatus(pmsIndicator, detectedPms);
  
  // Store the detected status
  pmsJobStatus[jobId] = detectedPms;
}

// Function to update the PMS indicator on the job detail page
function updateJobDetailPmsStatus(indicatorElement, hasPms) {
  if (hasPms) {
    indicatorElement.innerHTML = '<span class="pms-yes">✅ Has PMS Colors</span>';
  } else {
    indicatorElement.innerHTML = '<span class="pms-no">❌ No PMS Colors</span>';
  }
}

// Initialize the extension
function init() {
  console.log('Initializing PMS Indicator');
  console.log('Current URL:', window.location.href);
  
  // Check if we're on the job list page or job detail page
  if (window.location.href.includes('JobStatusList.aspx')) {
    console.log('Detected job list page');
    
    // Wait a bit for the page to fully render
    setTimeout(() => {
      // We're on the job list page
      addPmsColumn();
      
      // Set up a mutation observer to detect new job rows
      console.log('Setting up mutation observer');
      const observer = new MutationObserver((mutations) => {
        console.log('Mutation detected:', mutations.length, 'changes');
        
        // Check if any mutations affected the job table
        const affectedTable = mutations.some(mutation => {
          return mutation.target.tagName === 'TABLE' || 
                 mutation.target.closest('table.data-results') !== null;
        });
        
        if (affectedTable) {
          console.log('Table structure changed, checking for new rows');
          checkForNewJobRows();
        }
      });
      
      // Start observing the table for changes
      const jobTable = document.querySelector('table.data-results');
      if (jobTable) {
        console.log('Found job table, starting observation');
        observer.observe(jobTable, { childList: true, subtree: true, attributes: true });
      } else {
        console.error('Could not find job table');
      }
      
    }, 1000); // Wait 1 second for the page to load
    
  } else if (window.location.href.includes('job.aspx')) {
    console.log('Detected job detail page');
    // We're on a job detail page
    setTimeout(() => {
      handleJobDetailPage();
    }, 1000); // Wait 1 second for the page to load
  } else {
    console.log('Not on a recognized page');
  }
}

// Run initialization when the page is loaded
if (document.readyState === 'loading') {
  console.log('Document still loading, adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('Document already loaded, running init immediately');
  init();
}

console.log('Decopress PMS Indicator content script loaded - END'); 