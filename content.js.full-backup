// content.js - Runs on the job list page

console.log('Decopress PMS Indicator content script loaded - START');

// Create a mapping of job IDs to their PMS status
const pmsJobStatus = {};

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
  
  // Add PMS filter to the filter panel
  addPmsFilter();
}

// Function to add a PMS filter to the filter panel
function addPmsFilter() {
  console.log('Adding PMS filter to filter panel');
  
  // First check if we already added the filter section
  const existingPmsFilter = document.querySelector('#pmsFilter');
  if (existingPmsFilter) {
    console.log('PMS filter already exists, not adding again');
    attachPmsFilterEventListeners();
    return;
  }
  
  // Look for a good insertion point - first try after the Process filter
  let targetElement = document.querySelector('li:has(#processFilter)');
  
  // If that's not found, try to find any filter section
  if (!targetElement) {
    console.log('Process filter not found, looking for any filter section');
    targetElement = document.querySelector('.filter-panel li');
  }
  
  // If we still can't find a target, we need to create the whole filter structure
  if (!targetElement) {
    console.error('Could not find any filter sections to insert after');
    
    // As a fallback, try to find the filter panel itself
    const filterPanel = document.querySelector('.filter-panel, .filter-panel-container');
    if (filterPanel) {
      console.log('Found filter panel, will create a new filter list');
      
      // Create a container for our filter
      const filterContainer = document.createElement('ul');
      filterPanel.appendChild(filterContainer);
      
      // Create a list item for our filter
      const listItem = document.createElement('li');
      listItem.className = 'pr-2 cw-collapsible';
      filterContainer.appendChild(listItem);
      
      // Now use this as our target
      targetElement = listItem;
    } else {
      console.error('Could not find filter panel, cannot add PMS filter');
      return;
    }
  }
  
  // Create the filter HTML - make it match the site's format as closely as possible
  const pmsFilterHTML = `
    <li class="pr-2 cw-collapsible pms-filter-container">
      <h4>PMS Colors</h4>
      <ul id="pmsFilter" class="js-toggle-button-group btn-group-toggle d-flex flex-wrap m-0 p-0" data-toggle="buttons">
        <li class="m-0 pb-1">
          <label class="btn btn-secondary active">
            <input type="checkbox" value="ALL" data-code="ALL" data-for="pms-filter" checked="checked">All
          </label>
        </li>
        <li class="m-0 pb-1">
          <label class="btn btn-secondary">
            <input type="checkbox" value="YES" name="pms-filter" id="pmsFilter_1" data-toggle-group="true">Has PMS
          </label>
        </li>
        <li class="m-0 pb-1">
          <label class="btn btn-secondary">
            <input type="checkbox" value="NO" name="pms-filter" id="pmsFilter_2" data-toggle-group="true">No PMS
          </label>
        </li>
      </ul>
    </li>
  `;
  
  // Insert our filter section after the target element
  targetElement.insertAdjacentHTML('afterend', pmsFilterHTML);
  console.log('Added PMS filter section to the page');
  
  // Set up direct event handlers that don't rely on the site's event system
  attachPmsFilterEventListeners(true);
}

// Helper function to attach event listeners to the PMS filter buttons
function attachPmsFilterEventListeners(isNewFilter = false) {
  console.log('Attaching direct event listeners to PMS filter buttons');
  
  // Get the filter buttons
  const allButton = document.querySelector('input[data-for="pms-filter"]');
  const filterButtons = document.querySelectorAll('input[name="pms-filter"]');
  
  if (!allButton && filterButtons.length === 0) {
    console.error('Could not find PMS filter buttons to attach listeners to');
    return;
  }
  
  // Keep track of the last active button
  window.lastActivePmsButton = null;
  
  // For the "All" button
  if (allButton) {
    // Remove existing listeners to prevent duplication
    const newAllButton = allButton.cloneNode(true);
    allButton.parentNode.replaceChild(newAllButton, allButton);
    
    // Add direct click handler
    newAllButton.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('PMS "All" button clicked');
      
      // If this button is already active, don't do anything
      if (window.lastActivePmsButton === 'all') {
        console.log('All button already active, ignoring');
        return false;
      }
      
      // Update tracking of last active button
      window.lastActivePmsButton = 'all';
      
      // Update button state
      this.checked = true;
      this.closest('label').classList.add('active');
      
      // Uncheck the other buttons
      filterButtons.forEach(btn => {
        btn.checked = false;
        btn.closest('label').classList.remove('active');
      });
      
      // Apply the filter
      showAllJobs();
      return false;
    });
  }
  
  // For the filter buttons (Yes/No)
  filterButtons.forEach(button => {
    // Remove existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add direct click handler
    newButton.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const filterValue = this.value;
      console.log(`PMS filter button clicked: ${filterValue}`);
      
      // If this button is already active, toggle it off (go back to "All")
      if (window.lastActivePmsButton === filterValue) {
        console.log(`${filterValue} already active, toggling to All`);
        
        // Uncheck this button
        this.checked = false;
        this.closest('label').classList.remove('active');
        
        // Check the "All" button
        if (allButton) {
          allButton.checked = true;
          allButton.closest('label').classList.add('active');
        }
        
        // Update tracking
        window.lastActivePmsButton = 'all';
        
        // Show all jobs
        showAllJobs();
        return false;
      }
      
      // Otherwise, apply this filter
      window.lastActivePmsButton = filterValue;
      
      // Update button state
      this.checked = true;
      this.closest('label').classList.add('active');
      
      // Uncheck the other buttons
      if (allButton) {
        allButton.checked = false;
        allButton.closest('label').classList.remove('active');
      }
      
      filterButtons.forEach(btn => {
        if (btn !== this) {
          btn.checked = false;
          btn.closest('label').classList.remove('active');
        }
      });
      
      // Apply the filter
      filterJobsByPmsStatus(filterValue);
      return false;
    });
  });
  
  // If this is a newly added filter, try to initialize it with the site's jQuery
  if (isNewFilter && typeof $ !== 'undefined') {
    try {
      console.log('Attempting to initialize new filter with jQuery');
      $('#pmsFilter').addClass('initialized');
      $('#pmsFilter input[type="checkbox"]').button();
    } catch(e) {
      console.error('Error initializing filter with jQuery:', e);
    }
  }
  
  console.log('Successfully attached event listeners to PMS filter buttons');
}

// Function to filter jobs by PMS status
function filterJobsByPmsStatus(filterValue) {
  console.log(`Filtering jobs by PMS status: ${filterValue}`);
  
  // Store the current filter value in a global variable
  window.currentPmsFilter = filterValue;
  
  // Also track the active button
  window.lastActivePmsButton = filterValue;
  
  // Given the console output, the site appears to use string values separated by commas
  // for its filtering. Let's adapt to that pattern.
  
  // Rather than trying to integrate with the site's complex filtering,
  // we'll focus on our direct approach which is more reliable
  
  // Apply our direct filtering methods right away
  applyPmsFilterDirectly(filterValue);
  applyCssBasedFiltering(filterValue);
  
  // Apply CSS classes for styling
  if (filterValue === 'YES') {
    document.body.classList.add('pms-filter-yes');
    document.body.classList.remove('pms-filter-no');
  } else if (filterValue === 'NO') {
    document.body.classList.add('pms-filter-no');
    document.body.classList.remove('pms-filter-yes');
  } else {
    document.body.classList.remove('pms-filter-yes');
    document.body.classList.remove('pms-filter-no');
  }
  
  // Update the UI to show the active filter
  updateFilterUI(filterValue);
  
  // Apply additional filtering on a delay to catch any rows that might have been missed
  setTimeout(() => {
    console.log('Applying delayed filtering check');
    applyPmsFilterDirectly(filterValue);
    applyCssBasedFiltering(filterValue);
    
    // Additional check to make sure filter is properly applied to all rows
    const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
    console.log(`Re-checking ${jobRows.length} rows for filtering`);
    
    jobRows.forEach(row => {
      const jobId = row.getAttribute('data-jobnumber');
      const pmsCell = row.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
      
      if (pmsCell) {
        const hasPms = pmsCell.classList.contains('has-pms');
        
        if (filterValue === 'YES' && !hasPms) {
          console.log(`Forcing hide on non-PMS job ${jobId}`);
          hideJobRow(row);
        } else if (filterValue === 'NO' && hasPms) {
          console.log(`Forcing hide on PMS job ${jobId}`);
          hideJobRow(row);
        } else if (filterValue === 'ALL' || !filterValue) {
          showJobRow(row);
        }
      }
    });
  }, 500);
}

// Helper function to hide a job row using multiple techniques
function hideJobRow(row) {
  // CSS display property
  row.style.display = 'none';
  
  // ARIA attributes
  row.setAttribute('aria-hidden', 'true');
  
  // CSS classes for our filtering
  row.classList.add('pms-filtered-out');
  row.classList.add('pms-filtered-out-by-css');
  
  // Inline styles for maximum effect
  row.style.visibility = 'hidden';
  row.style.opacity = '0';
  row.style.height = '0';
  row.style.overflow = 'hidden';
  row.style.position = 'absolute';
  row.style.left = '-9999px';
  row.style.pointerEvents = 'none';
}

// Helper function to show a job row
function showJobRow(row) {
  // Remove all hiding properties
  row.style.display = '';
  row.style.visibility = '';
  row.style.opacity = '';
  row.style.height = '';
  row.style.overflow = '';
  row.style.position = '';
  row.style.left = '';
  row.style.pointerEvents = '';
  
  // Remove ARIA attributes
  row.removeAttribute('aria-hidden');
  
  // Remove CSS classes
  row.classList.remove('pms-filtered-out');
  row.classList.remove('pms-filtered-out-by-css');
}

// New function to apply CSS-based filtering
function applyCssBasedFiltering(filterValue) {
  console.log(`Applying CSS-based filtering: ${filterValue}`);
  
  // If no specific filter, remove all filter classes
  if (!filterValue || filterValue === 'ALL') {
    document.querySelectorAll('tr.js-jobstatus-row').forEach(row => {
      row.classList.remove('pms-filtered-out-by-css');
    });
    return;
  }
  
  // Find all job rows
  const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
  
  jobRows.forEach(row => {
    const jobId = row.getAttribute('data-jobnumber');
    const pmsCell = row.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
    
    if (pmsCell) {
      const hasPms = pmsCell.classList.contains('has-pms');
      
      if ((filterValue === 'YES' && !hasPms) || (filterValue === 'NO' && hasPms)) {
        row.classList.add('pms-filtered-out-by-css');
      } else {
        row.classList.remove('pms-filtered-out-by-css');
      }
    }
  });
}

// Function to directly apply filtering to all job rows
function applyPmsFilterDirectly(filterValue) {
  // If no filter value is provided, use the stored one
  if (!filterValue && window.currentPmsFilter) {
    filterValue = window.currentPmsFilter;
  }
  
  // If no filter value is available, show all jobs
  if (!filterValue || filterValue === 'ALL') {
    showAllJobs();
    return;
  }
  
  console.log(`Directly applying PMS filter: ${filterValue}`);
  
  // Find all job rows
  const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
  console.log(`Found ${jobRows.length} rows to filter`);
  
  jobRows.forEach(row => {
    const jobId = row.getAttribute('data-jobnumber');
    const pmsCell = row.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
    
    if (pmsCell) {
      const hasPms = pmsCell.classList.contains('has-pms');
      
      if (filterValue === 'YES' && !hasPms) {
        // Hide rows without PMS when filtering for PMS
        row.style.display = 'none';
        row.classList.add('pms-filtered-out');
        row.setAttribute('aria-hidden', 'true');
      } else if (filterValue === 'NO' && hasPms) {
        // Hide rows with PMS when filtering for no PMS
        row.style.display = 'none';
        row.classList.add('pms-filtered-out');
        row.setAttribute('aria-hidden', 'true');
      } else {
        // Show all other rows
        row.style.display = '';
        row.classList.remove('pms-filtered-out');
        row.removeAttribute('aria-hidden');
      }
    }
  });
}

// Function to update the filter UI to highlight the active filter
function updateFilterUI(filterValue) {
  console.log(`Updating filter UI for value: ${filterValue}`);
  
  // Find all filter buttons
  const allButton = document.querySelector('input[data-for="pms-filter"]');
  const yesButton = document.querySelector('#pmsFilter_1');
  const noButton = document.querySelector('#pmsFilter_2');
  
  if (allButton && yesButton && noButton) {
    console.log('Found all filter buttons, updating UI');
    
    // Reset all buttons
    allButton.checked = false;
    yesButton.checked = false;
    noButton.checked = false;
    
    // Remove active class from all labels
    document.querySelectorAll('#pmsFilter label').forEach(label => {
      label.classList.remove('active');
    });
    
    // Set the active button
    if (filterValue === 'ALL' || !filterValue) {
      allButton.checked = true;
      allButton.closest('label').classList.add('active');
      window.lastActivePmsButton = 'all';
    } else if (filterValue === 'YES') {
      yesButton.checked = true;
      yesButton.closest('label').classList.add('active');
      window.lastActivePmsButton = 'YES';
    } else if (filterValue === 'NO') {
      noButton.checked = true;
      noButton.closest('label').classList.add('active');
      window.lastActivePmsButton = 'NO';
    }
    
    // Log the current state of the UI
    console.log('Current filter UI state:', {
      activeFilter: filterValue,
      lastActiveButton: window.lastActivePmsButton,
      allButtonChecked: allButton.checked,
      yesButtonChecked: yesButton.checked,
      noButtonChecked: noButton.checked
    });
    
    // Attempt to update any jQuery UI components if they exist
    if (typeof $ !== 'undefined') {
      try {
        console.log('Attempting to refresh jQuery UI components');
        $('#pmsFilter input[type="checkbox"]').button('refresh');
      } catch(e) {
        console.log('Error refreshing jQuery UI:', e);
      }
    }
  } else {
    console.warn('Could not find all filter buttons:', {
      allButton: !!allButton,
      yesButton: !!yesButton,
      noButton: !!noButton
    });
  }
}

// Function to show all jobs (reset filter)
function showAllJobs() {
  console.log('Showing all jobs');
  
  window.currentPmsFilter = 'ALL';
  window.lastActivePmsButton = 'all';
  
  // Remove all filtering classes
  const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
  jobRows.forEach(row => {
    // Display all rows
    row.style.display = '';
    
    // Remove all filter-related classes
    row.classList.remove('pms-filtered-out');
    row.classList.remove('pms-filtered-out-by-css');
    row.removeAttribute('aria-hidden');
  });
  
  // Remove filtering classes from body
  document.body.classList.remove('pms-filter-yes');
  document.body.classList.remove('pms-filter-no');
  
  // Update the UI to show the active filter
  updateFilterUI('ALL');
  
  // Try to dispatch events to the website to clear its filtering
  const searchEvent = new CustomEvent('cw:search', {
    detail: { 'pms-filter': 'ALL' },
    bubbles: true
  });
  
  const filterChangeEvent = new CustomEvent('cw:filter-changed', {
    detail: { 
      filter: 'pms-filter',
      value: 'ALL'
    },
    bubbles: true
  });
  
  // Dispatch the events
  document.dispatchEvent(searchEvent);
  document.dispatchEvent(filterChangeEvent);
  
  // Make sure the "All" button is checked and active
  const allButton = document.querySelector('input[data-for="pms-filter"]');
  if (allButton) {
    allButton.checked = true;
    allButton.closest('label').classList.add('active');
    
    // Try to trigger its change event
    const changeEvent = new Event('change', { bubbles: true });
    allButton.dispatchEvent(changeEvent);
  }
  
  // Make sure the other buttons are unchecked
  const filterButtons = document.querySelectorAll('input[name="pms-filter"]');
  filterButtons.forEach(button => {
    button.checked = false;
    button.closest('label').classList.remove('active');
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
  
  if (hasPms) {
    cell.innerHTML = '<span class="pms-yes">✅</span>';
    cell.title = 'Contains PMS colors';
    cell.classList.add('has-pms');
  } else {
    cell.innerHTML = '<span class="pms-no">❌</span>';
    cell.title = 'No PMS colors';
    cell.classList.add('no-pms');
  }
}

// Function to check for job rows that need PMS cells
function checkForNewJobRows() {
  console.log('Checking for new job rows');
  const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
  console.log(`Found ${jobRows.length} total job rows`);
  
  let newRowCount = 0;
  let updatedRows = 0;
  
  jobRows.forEach(row => {
    // Check if this row already has a PMS cell
    const jobId = row.getAttribute('data-jobnumber');
    const existingPmsCell = row.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
    
    if (!existingPmsCell) {
      console.log(`Found new row for job ${jobId}`);
      addPmsCellToRow(row);
      newRowCount++;
    } else {
      // Check if the row has its filter status correctly applied
      if (window.currentPmsFilter && window.currentPmsFilter !== 'ALL') {
        const hasPms = existingPmsCell.classList.contains('has-pms');
        const shouldBeHidden = (window.currentPmsFilter === 'YES' && !hasPms) || 
                              (window.currentPmsFilter === 'NO' && hasPms);
        
        // If the row should be hidden but isn't, update it
        if (shouldBeHidden && row.style.display !== 'none') {
          updatedRows++;
          row.style.display = 'none';
          row.classList.add('pms-filtered-out');
          row.classList.add('pms-filtered-out-by-css');
        }
      }
    }
  });
  
  console.log(`Added PMS cells to ${newRowCount} new rows`);
  if (updatedRows > 0) {
    console.log(`Updated filter status on ${updatedRows} existing rows`);
  }
  
  // If there were new rows added, or if we're checking after a page update, reapply the filter
  if (newRowCount > 0 || updatedRows > 0 || window.justUpdated) {
    window.justUpdated = false;
    // Slight delay to let the PMS cells finish updating
    setTimeout(() => {
      if (window.currentPmsFilter) {
        console.log('Reapplying PMS filter after row updates');
        applyPmsFilterDirectly(window.currentPmsFilter);
        applyCssBasedFiltering(window.currentPmsFilter);
      }
    }, 100);
  }
  
  // Apply a forced check if the filter is active
  if (window.currentPmsFilter && window.currentPmsFilter !== 'ALL') {
    // Check if we need to clean up any incorrectly visible rows
    const visibleRows = Array.from(document.querySelectorAll('tr.js-jobstatus-row')).filter(
      row => row.style.display !== 'none' && 
             !row.classList.contains('pms-filtered-out') &&
             !row.classList.contains('pms-filtered-out-by-css')
    );
    
    visibleRows.forEach(row => {
      const jobId = row.getAttribute('data-jobnumber');
      const pmsCell = row.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
      
      if (pmsCell) {
        const hasPms = pmsCell.classList.contains('has-pms');
        const shouldBeHidden = (window.currentPmsFilter === 'YES' && !hasPms) || 
                              (window.currentPmsFilter === 'NO' && hasPms);
        
        if (shouldBeHidden) {
          console.log(`Fixing incorrectly visible row for job ${jobId}`);
          row.style.display = 'none';
          row.classList.add('pms-filtered-out');
          row.classList.add('pms-filtered-out-by-css');
        }
      }
    });
  }
}

// Function to handle job detail page
function handleJobDetailPage() {
  console.log('Handling job detail page');
  
  // Check if we're on a job detail page
  const jobIdMatch = window.location.href.match(/[?&]ID=(\d+)/i);
  if (!jobIdMatch) {
    console.error('Could not extract job ID from URL:', window.location.href);
    return;
  }
  
  const jobId = jobIdMatch[1];
  console.log(`Detected job detail page for job ID: ${jobId}`);
  
  // Look for PMS colors in job lines
  const jobLines = document.querySelectorAll('.js-jobline-row');
  console.log(`Found ${jobLines.length} job lines`);
  
  let hasPms = false;
  
  // Enhanced PMS detection - check in comments, descriptions, and additional fields
  // Also check for common PMS color naming patterns like "PMS 123", "Pantone 456", etc.
  
  // 1. First check job lines
  jobLines.forEach((row, index) => {
    // Check in comment field
    const comment = row.getAttribute('data-comment') || '';
    // Check in description fields
    const description = row.querySelector('.job-line-description')?.textContent || '';
    // Check in other cells that might contain text
    const allText = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim()).join(' ');
    
    console.log(`Job line ${index} - Checking: "${comment}" and "${description}"`);
    
    const combinedText = `${comment} ${description} ${allText}`.toLowerCase();
    
    // Define patterns that indicate PMS colors
    const pmsPatterns = [
      /pms\s*\d+/i,                  // PMS followed by numbers (PMS 123)
      /pantone\s*\d+/i,              // Pantone followed by numbers
      /spot\s*colou?r/i,             // Spot color/colour
      /pms\s*[a-z]+\s*\d+/i,         // PMS with color name and number (PMS Blue 072)
      /pantone\s*[a-z]+\s*\d+/i      // Pantone with color name and number
    ];
    
    // Exclusion patterns (when these appear alone, they often mean no PMS)
    const exclusionPatterns = [
      /no\s*pms/i,
      /without\s*pms/i,
      /no\s*pantone/i,
      /no\s*spot/i
    ];
    
    // Check for positive patterns
    const hasPmsPattern = pmsPatterns.some(pattern => pattern.test(combinedText));
    
    // Check for exclusion patterns
    const hasExclusionPattern = exclusionPatterns.some(pattern => pattern.test(combinedText));
    
    // If it matches a PMS pattern and doesn't have an exclusion pattern
    if (hasPmsPattern && !hasExclusionPattern) {
      console.log(`Found PMS color in job line ${index}: "${combinedText.substring(0, 100)}..."`);
      hasPms = true;
    }
    
    // Also try simple string matching which was working before
    if (combinedText.includes('pms') && !combinedText.includes('no pms')) {
      console.log(`Found PMS color in job line ${index} using simple string match`);
      hasPms = true;
    }
  });
  
  // 2. Check in the overall job details and specs section
  const jobDetails = document.querySelector('.job-details-container, .job-details, .job-specs');
  if (jobDetails) {
    const detailsText = jobDetails.textContent.toLowerCase();
    
    // Look for PMS indicators in job details
    if (
      (detailsText.includes('pms') || 
       detailsText.includes('pantone') || 
       detailsText.includes('spot color') || 
       detailsText.includes('spot colour')) && 
      !detailsText.includes('no pms') && 
      !detailsText.includes('without pms')
    ) {
      console.log('Found PMS color indicator in job details');
      hasPms = true;
    }
  }
  
  console.log(`Job ${jobId} PMS status: ${hasPms}`);
  
  // Update the PMS status in storage
  chrome.runtime.sendMessage(
    { action: "updateJobPmsStatus", jobId: jobId, hasPms: hasPms },
    response => {
      console.log(`Updated PMS status for job ${jobId} in storage:`, response);
    }
  );
  
  // Add a visual indicator to the job page
  const jobHeader = document.querySelector('.job-header');
  if (jobHeader) {
    console.log('Found job header, adding PMS indicator');
    
    // Check if an indicator already exists
    let pmsIndicator = jobHeader.querySelector('.pms-indicator');
    if (!pmsIndicator) {
      pmsIndicator = document.createElement('div');
      pmsIndicator.className = 'pms-indicator';
      jobHeader.appendChild(pmsIndicator);
    }
    
    pmsIndicator.innerHTML = hasPms ? 
      '<span class="pms-yes">✅ PMS Colors</span>' : 
      '<span class="pms-no">❌ No PMS Colors</span>';
  } else {
    console.error('Could not find job header (.job-header)');
    
    // Try to find alternative elements to attach the indicator
    const h1Elements = document.querySelectorAll('h1');
    console.log(`Found ${h1Elements.length} h1 elements on page`);
    
    if (h1Elements.length > 0) {
      console.log('Attaching PMS indicator to first h1 element');
      
      // Check if an indicator already exists
      let pmsIndicator = h1Elements[0].querySelector('.pms-indicator');
      if (!pmsIndicator) {
        pmsIndicator = document.createElement('div');
        pmsIndicator.className = 'pms-indicator';
        h1Elements[0].appendChild(pmsIndicator);
      }
      
      pmsIndicator.innerHTML = hasPms ? 
        '<span class="pms-yes">✅ PMS Colors</span>' : 
        '<span class="pms-no">❌ No PMS Colors</span>';
    }
  }
}

// Main initialization
function init() {
  console.log('Decopress PMS Indicator content script init');
  console.log('Current URL:', window.location.href);
  
  // Create a global variable to keep track of whether we just updated the page
  window.justUpdated = false;
  
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
        window.justUpdated = true;
        
        // Check if any mutations affected the job table
        const affectedTable = mutations.some(mutation => {
          return mutation.target.tagName === 'TABLE' || 
                 mutation.target.closest('table.data-results') !== null;
        });
        
        if (affectedTable) {
          console.log('Table structure changed, checking for new rows');
          checkForNewJobRows();
          
          // Reapply filter after a short delay
          setTimeout(() => {
            if (window.currentPmsFilter) {
              console.log('Reapplying PMS filter after table change');
              applyPmsFilterDirectly(window.currentPmsFilter);
              applyCssBasedFiltering(window.currentPmsFilter);
            }
          }, 200);
        }
      });
      
      // Start observing the table for changes
      const jobTable = document.querySelector('table.data-results');
      if (jobTable) {
        console.log('Found job table, starting observation');
        observer.observe(jobTable, { childList: true, subtree: true, attributes: true });
        
        // Also observe the entire filter panel to detect when the website's own filtering is applied
        const filterPanel = document.querySelector('.filter-panel-container');
        if (filterPanel) {
          console.log('Found filter panel, observing for changes');
          const filterObserver = new MutationObserver((mutations) => {
            console.log('Filter panel changed, may need to reapply PMS filter');
            
            // Don't immediately reapply, as it might be our own change
            setTimeout(() => {
              if (window.currentPmsFilter && window.currentPmsFilter !== 'ALL') {
                console.log('Reapplying PMS filter after filter panel change');
                applyPmsFilterDirectly(window.currentPmsFilter);
                applyCssBasedFiltering(window.currentPmsFilter);
              }
            }, 300);
          });
          
          filterObserver.observe(filterPanel, { attributes: true, subtree: true });
        }
      } else {
        console.error('Could not find job table');
        
        // Log the body HTML to help debug
        console.log('Page body structure:');
        console.log(document.body.innerHTML.substring(0, 500) + '...');
      }
      
      // Listen for ALL website's events that might indicate filtering changes
      const events = ['cw:search', 'cw:filter-changed', 'cw:filter-change', 'change'];
      
      events.forEach(eventName => {
        document.addEventListener(eventName, (event) => {
          console.log(`Detected ${eventName} event:`, event);
          window.justUpdated = true;
          
          // Wait a bit for the table to update, then recheck and reapply filter
          setTimeout(() => {
            // Check for new rows
            checkForNewJobRows();
            
            // Force reapply the current filter if one is active
            if (window.currentPmsFilter && window.currentPmsFilter !== 'ALL') {
              console.log(`Reapplying filter after ${eventName} event`);
              applyPmsFilterDirectly(window.currentPmsFilter);
              applyCssBasedFiltering(window.currentPmsFilter);
            }
          }, 300);
        });
      });
      
      // Also check for changes when page loads or user navigates
      window.addEventListener('load', () => {
        console.log('Page load event detected');
        window.justUpdated = true;
        setTimeout(() => {
          checkForNewJobRows();
          if (window.currentPmsFilter) {
            applyPmsFilterDirectly(window.currentPmsFilter);
            applyCssBasedFiltering(window.currentPmsFilter);
          }
        }, 500);
      });
      
      // If browser navigation happens (back/forward)
      window.addEventListener('popstate', () => {
        console.log('Navigation event detected');
        window.justUpdated = true;
        setTimeout(() => {
          checkForNewJobRows();
          if (window.currentPmsFilter) {
            applyPmsFilterDirectly(window.currentPmsFilter);
            applyCssBasedFiltering(window.currentPmsFilter);
          }
        }, 500);
      });
      
      // Intercept AJAX requests to detect when the website fetches new data
      const originalXhrOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function() {
        const url = arguments[1];
        if (typeof url === 'string' && url.includes('JobStatusList')) {
          console.log('Detected AJAX request to job list:', url);
          
          this.addEventListener('load', () => {
            console.log('AJAX request to job list completed');
            setTimeout(() => {
              checkForNewJobRows();
              if (window.currentPmsFilter) {
                applyPmsFilterDirectly(window.currentPmsFilter);
                applyCssBasedFiltering(window.currentPmsFilter);
              }
            }, 500);
          });
        }
        return originalXhrOpen.apply(this, arguments);
      };
      
      // Create a periodic check to ensure filtering is applied
      setInterval(() => {
        if (window.currentPmsFilter && window.currentPmsFilter !== 'ALL') {
          // Check if all rows are correctly filtered
          const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
          let needsRefilter = false;
          
          jobRows.forEach(row => {
            const jobId = row.getAttribute('data-jobnumber');
            const pmsCell = row.querySelector(`.pms-status-cell[data-job-id="${jobId}"]`);
            
            if (pmsCell) {
              const hasPms = pmsCell.classList.contains('has-pms');
              const isHidden = row.style.display === 'none' || 
                              row.classList.contains('pms-filtered-out') ||
                              row.classList.contains('pms-filtered-out-by-css');
              
              // Check if the row should be filtered but isn't
              if ((window.currentPmsFilter === 'YES' && !hasPms && !isHidden) ||
                  (window.currentPmsFilter === 'NO' && hasPms && !isHidden)) {
                needsRefilter = true;
              }
            }
          });
          
          if (needsRefilter) {
            console.log('Found incorrectly filtered rows, reapplying filter');
            applyPmsFilterDirectly(window.currentPmsFilter);
            applyCssBasedFiltering(window.currentPmsFilter);
          }
        }
      }, 1000); // Check every second
      
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