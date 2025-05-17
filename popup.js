// popup.js - Handles popup functionality

// When the popup is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get the clear data button
  const clearButton = document.getElementById('clearData');
  
  // Add click event listener to clear data button
  clearButton.addEventListener('click', function() {
    // Clear the stored PMS job data
    chrome.storage.local.set({ 'pmsJobs': {} }, function() {
      // Update status message
      const statusMessage = document.getElementById('status-message');
      statusMessage.textContent = 'Data cleared successfully!';
      statusMessage.style.color = '#2ecc71';
      
      // Reset message after 3 seconds
      setTimeout(function() {
        statusMessage.textContent = 'Extension is active and monitoring jobs.';
        statusMessage.style.color = '';
      }, 3000);
    });
  });
  
  // Get job count from storage
  chrome.storage.local.get('pmsJobs', function(data) {
    const pmsJobs = data.pmsJobs || {};
    const jobCount = Object.keys(pmsJobs).length;
    
    // Update status message with job count
    const statusMessage = document.getElementById('status-message');
    if (jobCount > 0) {
      statusMessage.textContent = `Extension is active with data for ${jobCount} jobs.`;
    }
  });
}); 