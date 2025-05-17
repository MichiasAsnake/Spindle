// background.js - Handles background tasks for the extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Decopress PMS Indicator installed');
  
  // Initialize storage with empty job data
  chrome.storage.local.set({ 'pmsJobs': {} });
  
  // Load Supabase configuration
  fetch(chrome.runtime.getURL('config.js'))
    .then(response => response.text())
    .then(text => {
      // Extract the configuration values using regex
      const urlMatch = text.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
      const keyMatch = text.match(/SUPABASE_KEY\s*=\s*['"]([^'"]+)['"]/);
      
      if (urlMatch && keyMatch) {
        // Store the configuration in local storage
        chrome.storage.local.set({
          'supabaseConfig': {
            url: urlMatch[1],
            key: keyMatch[1]
          }
        });
        console.log('Supabase configuration loaded');
      } else {
        console.error('Failed to load Supabase configuration');
      }
    })
    .catch(error => {
      console.error('Error loading config.js:', error);
    });
});

// Function to save job data to Supabase
async function saveJobToSupabase(jobId, hasPms) {
  try {
    console.log(`Saving job ${jobId} with PMS status ${hasPms} to Supabase`);
    
    // Get Supabase configuration from storage
    const config = await new Promise(resolve => {
      chrome.storage.local.get('supabaseConfig', data => {
        resolve(data.supabaseConfig);
      });
    });
    
    if (!config || !config.url || !config.key) {
      console.error('Supabase configuration is missing');
      return false;
    }
    
    const response = await fetch(`${config.url}/rest/v1/jobs`, {
      method: 'POST',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: jobId,
        has_pms: hasPms,
        updated_at: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      console.error(`Failed to save job ${jobId} to Supabase:`, response.statusText);
      return false;
    }
    
    console.log(`Successfully saved job ${jobId} to Supabase`);
    return true;
  } catch (error) {
    console.error(`Error saving job ${jobId} to Supabase:`, error);
    return false;
  }
}

// Function to fetch job data from Supabase
async function getJobFromSupabase(jobId) {
  try {
    console.log(`Fetching job ${jobId} from Supabase`);
    
    // Get Supabase configuration from storage
    const config = await new Promise(resolve => {
      chrome.storage.local.get('supabaseConfig', data => {
        resolve(data.supabaseConfig);
      });
    });
    
    if (!config || !config.url || !config.key) {
      console.error('Supabase configuration is missing');
      return null;
    }
    
    const response = await fetch(`${config.url}/rest/v1/jobs?id=eq.${jobId}`, {
      method: 'GET',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch job ${jobId} from Supabase:`, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log(`Found job ${jobId} in Supabase:`, data[0]);
      return data[0];
    }
    
    console.log(`Job ${jobId} not found in Supabase`);
    return null;
  } catch (error) {
    console.error(`Error fetching job ${jobId} from Supabase:`, error);
    return null;
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getJobPmsStatus") {
    // First try to get from local storage
    chrome.storage.local.get('pmsJobs', async (data) => {
      const pmsJobs = data.pmsJobs || {};
      
      // If we have it in local storage, return immediately
      if (pmsJobs[request.jobId] !== undefined) {
        console.log(`Using cached PMS status for job ${request.jobId}: ${pmsJobs[request.jobId]}`);
        sendResponse({ hasPms: pmsJobs[request.jobId] });
        return;
      }
      
      // Otherwise, try to get from Supabase
      const jobData = await getJobFromSupabase(request.jobId);
      
      if (jobData) {
        // Update local storage with the data from Supabase
        pmsJobs[request.jobId] = jobData.has_pms;
        chrome.storage.local.set({ 'pmsJobs': pmsJobs });
        
        sendResponse({ hasPms: jobData.has_pms });
      } else {
        // If not in Supabase, default to false
        sendResponse({ hasPms: false });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "updateJobPmsStatus") {
    // Update PMS status for a job in storage
    chrome.storage.local.get('pmsJobs', async (data) => {
      const pmsJobs = data.pmsJobs || {};
      pmsJobs[request.jobId] = request.hasPms;
      
      // Save to local storage
      chrome.storage.local.set({ 'pmsJobs': pmsJobs });
      
      // Save to Supabase
      const saved = await saveJobToSupabase(request.jobId, request.hasPms);
      
      sendResponse({ success: true, savedToSupabase: saved });
    });
    
    return true; // Keep the message channel open for async response
  }
}); 