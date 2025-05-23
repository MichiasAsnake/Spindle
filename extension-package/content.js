// content.js - Runs on the job list page

console.log('Decopress PMS Indicator content script loaded - START');

// Create a mapping of job IDs to their PMS status
const pmsJobStatus = {};

// Add this after the pmsJobStatus mapping
const jobImages = {};

// Add the exclusionPatterns array at the top of the file, after the global variables
const exclusionPatterns = [
  /\bno\s+pms\b/i,
  /\bwithout\s+pms\b/i,
  /\bno\s+pantone\b/i,
  /\bno\s+spot\b/i,
  /\bcmyk\b/i,                        // Exclude CMYK matches
  /\bprocess\s+colou?r\b/i            // Exclude process color matches
];

// Add the getPmsPatterns function at the top of the file, after the global variables
function getPmsPatterns() {
  return [
    /\bpms\s*\d+\b/i,                  // PMS followed by numbers (PMS 123)
    /\bpantone\s*\d+\b/i,              // Pantone followed by numbers
    /\bspot\s*colou?r\b/i,             // Spot color/colour
    /\bpms\s*[a-z]+\s*\d+\b/i,         // PMS with color name and number (PMS Blue 072)
    /\bpantone\s*[a-z]+\s*\d+\b/i      // Pantone with color name and number
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
  
  // Look for PMS colors in job lines only
  const jobLines = document.querySelectorAll('.js-jobline-row');
  console.log(`Found ${jobLines.length} job lines`);
  
  let hasPms = false;
  let comment = '';
  
  // Check each job line
  jobLines.forEach((row, index) => {
    // Get all text content from the row
    const allText = Array.from(row.querySelectorAll('td'))
      .map(td => td.textContent.trim())
      .join(' ')
      .toLowerCase(); // Convert to lowercase for case-insensitive matching
    
    console.log(`Job line ${index} - Checking text: "${allText.substring(0, 100)}..."`);
    
    // Define patterns that indicate PMS colors
    const pmsPatterns = getPmsPatterns();
    
    // Check for positive patterns
    const hasPmsPattern = pmsPatterns.some(pattern => pattern.test(allText));
    
    // Check for exclusion patterns
    const hasExclusionPattern = exclusionPatterns.some(pattern => pattern.test(allText));
    
    // If it matches a PMS pattern and doesn't have an exclusion pattern
    if (hasPmsPattern && !hasExclusionPattern) {
      console.log(`Found PMS color in job line ${index}: "${allText.substring(0, 100)}..."`);
      hasPms = true;
      comment = `PMS color found in job line ${index}: "${allText.substring(0, 100)}..."`;
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
      comment = 'PMS color found in order comment';
    }
  }
  
  console.log(`PMS detection result for job ${jobId}: ${hasPms}`);
  
  // Update our local cache
  pmsJobStatus[jobId] = hasPms;
  
  // Send the status to the background script for storage and Supabase update
  chrome.runtime.sendMessage(
    { action: "updateJobPmsStatus", jobId: jobId, hasPms: hasPms, comment: comment },
    response => {
      console.log(`Updated PMS status for job ${jobId}:`, response);
    }
  );
  
  return hasPms;
}

// Function to add a PMS column to the job list table
function addPmsColumn() {
  console.log('Adding PMS and Image columns to job list');
  
  const headerRow = document.querySelector('table.data-results thead tr');
  if (!headerRow) {
    console.error('Could not find job list header row');
    return;
  }
  
  // Create image header cell
  const imageHeaderCell = document.createElement('th');
  imageHeaderCell.className = 'image-status-header';
  imageHeaderCell.textContent = 'Image';
  imageHeaderCell.style.width = '80px';
  
  // Create PMS header cell
  const pmsHeaderCell = document.createElement('th');
  pmsHeaderCell.className = 'pms-status-header';
  pmsHeaderCell.textContent = 'PMS';
  pmsHeaderCell.style.width = '40px';
  
  // Insert both cells after the Description column
  const descriptionHeader = headerRow.querySelector('th[id="sortDescription"]');
  if (descriptionHeader) {
    descriptionHeader.insertAdjacentElement('afterend', imageHeaderCell);
    imageHeaderCell.insertAdjacentElement('afterend', pmsHeaderCell);
  } else {
    headerRow.insertBefore(imageHeaderCell, headerRow.lastElementChild);
    headerRow.insertBefore(pmsHeaderCell, headerRow.lastElementChild);
  }
  
  // Add cells to all job rows
  const jobRows = document.querySelectorAll('tr.js-jobstatus-row');
  jobRows.forEach(row => {
    addImageAndPmsCellsToRow(row);
  });
}

// Function to add both image and PMS cells to a row
function addImageAndPmsCellsToRow(row) {
  const jobId = row.getAttribute('data-jobnumber');
  if (!jobId) return;
  
  // Create image cell
  const imageCell = document.createElement('td');
  imageCell.className = 'image-status-cell';
  imageCell.setAttribute('data-job-id', jobId);
  
  // Create PMS cell
  const pmsCell = document.createElement('td');
  pmsCell.className = 'pms-status-cell';
  pmsCell.setAttribute('data-job-id', jobId);
  
  // Set initial content
  imageCell.innerHTML = '<span class="image-loading">⏳</span>';
  pmsCell.innerHTML = '<span class="pms-loading">⏳</span>';
  
  // Find the Description cell to insert after
  const cells = row.querySelectorAll('td');
  if (cells.length >= 3) {
    cells[2].insertAdjacentElement('afterend', imageCell);
    imageCell.insertAdjacentElement('afterend', pmsCell);
  } else {
    row.insertBefore(imageCell, row.lastElementChild);
    row.insertBefore(pmsCell, row.lastElementChild);
  }
  
  // Check for cached data
  if (jobImages[jobId]) {
    updateImageCell(imageCell, jobImages[jobId]);
  } else {
    // Request images from background script
    chrome.runtime.sendMessage(
      { action: "getJobImages", jobId: jobId },
      response => {
        if (response && response.images) {
          jobImages[jobId] = response.images;
          updateImageCell(imageCell, response.images);
        }
      }
    );
  }
  
  // Check for cached PMS status
  if (pmsJobStatus[jobId] !== undefined) {
    updatePmsCellStatus(pmsCell, pmsJobStatus[jobId]);
  } else {
    chrome.runtime.sendMessage(
      { action: "getJobPmsStatus", jobId: jobId },
      response => {
        pmsJobStatus[jobId] = response.hasPms;
        if (response.hasPms === null) {
          pmsCell.innerHTML = '<span class="pms-unknown">❓</span>';
          pmsCell.title = 'Visit job details page to sync PMS status';
        } else {
        updatePmsCellStatus(pmsCell, response.hasPms);
        }
      }
    );
  }
}

// Add carousel CSS styles to the page (only once)
(function addCarouselStyles() {
  if (document.getElementById('pms-carousel-style')) return;
  const style = document.createElement('style');
  style.id = 'pms-carousel-style';
  style.textContent = `
    .image-carousel {
      position: relative;
      width: 80px;
      height: 80px;
      overflow: hidden;
      background: #f7f7f7;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .image-carousel button {
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 2;
    }
    .image-carousel:hover button {
      opacity: 1;
    }
    .image-carousel button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.5);
      color: white;
      border: none;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 18px;
      line-height: 1;
      user-select: none;
    }
    .image-carousel button:focus {
      outline: none;
    }
    .image-carousel .carousel-image-container {
      display: flex;
      width: 80px;
      height: 80px;
      transition: transform 0.3s cubic-bezier(.4,0,.2,1);
    }
    .image-carousel .carousel-image-wrapper {
      flex: 0 0 80px;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .image-carousel img {
      width: 76px;
      height: 76px;
      object-fit: contain;
      border-radius: 4px;
      background: #fff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .image-carousel .carousel-prev {
      left: 0;
    }
    .image-carousel .carousel-next {
      right: 0;
    }
  `;
  document.head.appendChild(style);
})();

// Function to update image cell with carousel
function updateImageCell(cell, images) {
  if (!images || images.length === 0) {
    cell.innerHTML = '<span class="no-image">-</span>';
    return;
  }

  const carousel = document.createElement('div');
  carousel.className = 'image-carousel';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'carousel-image-container';

  images.forEach((image, index) => {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'carousel-image-wrapper';
    const img = document.createElement('img');
    img.src = image.url;
    img.title = image.caption || image.assetTag;
    imgWrapper.appendChild(img);
    imageContainer.appendChild(imgWrapper);
  });

  carousel.appendChild(imageContainer);

  if (images.length > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '◀';
    prevBtn.className = 'carousel-prev';
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '▶';
    nextBtn.className = 'carousel-next';

    let currentIndex = 0;
    function updateCarousel() {
      imageContainer.style.transform = `translateX(-${currentIndex * 80}px)`;
    }
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateCarousel();
    };
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex + 1) % images.length;
      updateCarousel();
    };
    carousel.appendChild(prevBtn);
    carousel.appendChild(nextBtn);
    updateCarousel(); // Ensure only the first image is visible initially
  }

  cell.innerHTML = '';
  cell.appendChild(carousel);
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
      addImageAndPmsCellsToRow(row);
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
  
  // First check if we have a user override in Supabase
  chrome.runtime.sendMessage(
    { action: "getJobPmsStatus", jobId: jobId },
    response => {
      console.log(`Received PMS status for job ${jobId}:`, response);
      
      if (response.hasPms !== null) {
        // We have a stored status (either auto-detected or user override)
        updateJobDetailPmsStatus(pmsIndicator, response.hasPms);
        pmsJobStatus[jobId] = response.hasPms;
        
        // Add the override controls
        addPmsOverrideControls(titleElement, pmsIndicator, jobId, response.hasPms);
      } else {
        // No stored status, run detection
        const detectedPms = detectPmsColors();
        updateJobDetailPmsStatus(pmsIndicator, detectedPms);
        pmsJobStatus[jobId] = detectedPms;
        
        // Add the override controls
        addPmsOverrideControls(titleElement, pmsIndicator, jobId, detectedPms);
      }
    }
  );

  // Extract images when visiting job details
  const images = extractJobImages();
}

// Function to add PMS override controls
function addPmsOverrideControls(titleElement, pmsIndicator, jobId, currentStatus) {
  const toggleContainer = document.createElement('div');
  toggleContainer.style.marginTop = '10px';
  toggleContainer.style.display = 'flex';
  toggleContainer.style.alignItems = 'center';
  toggleContainer.style.gap = '8px';
  toggleContainer.setAttribute('data-form-ignore', 'true');

  const toggleLabel = document.createElement('span');
  toggleLabel.textContent = 'Override PMS status:';
  toggleLabel.style.fontWeight = 'bold';

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '4px';
  buttonContainer.setAttribute('data-form-ignore', 'true');

  // Create Auto button
  const autoButton = document.createElement('button');
  autoButton.textContent = 'Auto';
  autoButton.style.padding = '4px 8px';
  autoButton.style.border = '1px solid #ccc';
  autoButton.style.borderRadius = '4px';
  autoButton.style.cursor = 'pointer';
  autoButton.style.backgroundColor = '#fff';
  autoButton.setAttribute('type', 'button');
  autoButton.setAttribute('data-form-ignore', 'true');

  // Create Has PMS button
  const hasPmsButton = document.createElement('button');
  hasPmsButton.textContent = 'Has PMS';
  hasPmsButton.style.padding = '4px 8px';
  hasPmsButton.style.border = '1px solid #ccc';
  hasPmsButton.style.borderRadius = '4px';
  hasPmsButton.style.cursor = 'pointer';
  hasPmsButton.style.backgroundColor = '#fff';
  hasPmsButton.setAttribute('type', 'button');
  hasPmsButton.setAttribute('data-form-ignore', 'true');

  // Create No PMS button
  const noPmsButton = document.createElement('button');
  noPmsButton.textContent = 'No PMS';
  noPmsButton.style.padding = '4px 8px';
  noPmsButton.style.border = '1px solid #ccc';
  noPmsButton.style.borderRadius = '4px';
  noPmsButton.style.cursor = 'pointer';
  noPmsButton.style.backgroundColor = '#fff';
  noPmsButton.setAttribute('type', 'button');
  noPmsButton.setAttribute('data-form-ignore', 'true');

  // Function to update button states
  function updateButtonStates(activeButton) {
    [autoButton, hasPmsButton, noPmsButton].forEach(btn => {
      btn.classList.remove('active');
      btn.style.backgroundColor = '#fff';
    });
    activeButton.classList.add('active');
    activeButton.style.backgroundColor = '#e6e6e6';
  }

  // Function to update PMS status
  function updatePmsStatus(newStatus, comment) {
    // Update UI
    updateJobDetailPmsStatus(pmsIndicator, newStatus);
    // Update local cache
    pmsJobStatus[jobId] = newStatus;
    // Send to background/Supabase
    chrome.runtime.sendMessage(
      { action: "updateJobPmsStatus", jobId: jobId, hasPms: newStatus, comment: comment },
      response => {
        console.log(`Updated PMS status for job ${jobId}:`, response);
      }
    );
  }

  // Add click handlers
  autoButton.addEventListener('click', function(e) {
    e.preventDefault();
    updateButtonStates(autoButton);
  const detectedPms = detectPmsColors();
    updatePmsStatus(detectedPms, 'Auto-detected by script');
  });

  hasPmsButton.addEventListener('click', function(e) {
    e.preventDefault();
    updateButtonStates(hasPmsButton);
    updatePmsStatus(true, 'User override: Has PMS');
  });

  noPmsButton.addEventListener('click', function(e) {
    e.preventDefault();
    updateButtonStates(noPmsButton);
    updatePmsStatus(false, 'User override: No PMS');
  });
  
  // Set initial button state based on current status
  if (currentStatus === true) {
    updateButtonStates(hasPmsButton);
  } else if (currentStatus === false) {
    updateButtonStates(noPmsButton);
  } else {
    updateButtonStates(autoButton);
  }

  // Add buttons to container
  buttonContainer.appendChild(autoButton);
  buttonContainer.appendChild(hasPmsButton);
  buttonContainer.appendChild(noPmsButton);

  // Add elements to page
  toggleContainer.appendChild(toggleLabel);
  toggleContainer.appendChild(buttonContainer);
  titleElement.appendChild(toggleContainer);
}

// Function to update the PMS indicator on the job detail page
function updateJobDetailPmsStatus(indicatorElement, hasPms) {
  if (hasPms) {
    indicatorElement.innerHTML = '<span class="pms-yes">✅ Has PMS Colors</span>';
  } else {
    indicatorElement.innerHTML = '<span class="pms-no">❌ No PMS Colors</span>';
  }
}

// Add this function after the existing functions
async function scrapeJobDetailsAndUpdatePmsStatus(jobId, pmsCell) {
  try {
    const jobUrl = `https://intranet.decopress.com/Jobs/job.aspx?ID=${jobId}`;
    const response = await fetch(jobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch job details for job ${jobId}`);
    }
    const html = await response.text();
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Run detectPmsColors on the fetched HTML
    const hasPms = detectPmsColors();
    // Update the PMS cell status
    updatePmsCellStatus(pmsCell, hasPms);
    // Optionally, update the cache or Supabase
    pmsJobStatus[jobId] = hasPms;
    chrome.runtime.sendMessage(
      { action: "updateJobPmsStatus", jobId: jobId, hasPms: hasPms },
      response => {
        console.log(`Updated PMS status for job ${jobId}:`, response);
      }
    );
  } catch (error) {
    console.error(`Error scraping job details for job ${jobId}:`, error);
    pmsCell.innerHTML = '<span class="pms-loading">⏳</span>';
  }
}

// Add this function to handle image extraction
function extractJobImages() {
  const jobId = window.location.href.match(/ID=(\d+)/i)?.[1];
  if (!jobId) return [];

  const images = [];
  const imageContainers = document.querySelectorAll('.js-jobline-asset-image-container');
  
  imageContainers.forEach(container => {
    const img = container.querySelector('img');
    if (img && img.src) {
      images.push({
        url: img.src,
        assetTag: container.getAttribute('data-asset-tag') || '',
        caption: img.getAttribute('data-caption') || ''
      });
    }
  });

  if (images.length > 0) {
    jobImages[jobId] = images;
    // Send images to background script for storage
    chrome.runtime.sendMessage(
      { action: "updateJobImages", jobId: jobId, images: images },
      response => {
        console.log(`Updated images for job ${jobId}:`, response);
      }
    );
  }

  return images;
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