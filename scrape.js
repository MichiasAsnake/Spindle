import { chromium } from 'playwright';
import { saveJobTag } from './supabase.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Config for storing user credentials
const CONFIG_DIR = path.join(process.cwd(), '.config');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, 'credentials.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Function to read user input
async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Function to load saved credentials
async function loadCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
  return { accounts: [] };
}

// Function to save credentials
async function saveCredentials(credentials) {
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
}

async function run() {
  // Load saved credentials
  const credentials = await loadCredentials();
  
  // Handle user authentication
  let username, password, useStoredAuth = false;
  
  if (credentials.accounts && credentials.accounts.length > 0) {
    console.log('Saved accounts:');
    credentials.accounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.username}`);
    });
    console.log(`${credentials.accounts.length + 1}. Use a new account`);
    
    const choice = await promptUser('Select an account (number) or press Enter for last used: ');
    
    if (choice === '') {
      // Use last used account
      const lastUsed = credentials.accounts.find(a => a.isLastUsed) || credentials.accounts[0];
      username = lastUsed.username;
      password = lastUsed.password;
      useStoredAuth = true;
      console.log(`Using account: ${username}`);
    } else {
      const choiceNum = parseInt(choice);
      if (choiceNum > 0 && choiceNum <= credentials.accounts.length) {
        username = credentials.accounts[choiceNum - 1].username;
        password = credentials.accounts[choiceNum - 1].password;
        useStoredAuth = true;
        console.log(`Using account: ${username}`);
      } else {
        // New account flow
        username = await promptUser('Enter username: ');
        password = await promptUser('Enter password: ');
        const saveAccount = await promptUser('Save this account for future use? (y/n): ');
        
        if (saveAccount.toLowerCase() === 'y') {
          // Update all accounts to not be last used
          credentials.accounts.forEach(account => account.isLastUsed = false);
          
          // Add new account
          credentials.accounts.push({
            username,
            password,
            isLastUsed: true
          });
          
          await saveCredentials(credentials);
          console.log('Account saved!');
        }
      }
    }
    
    // Update last used account
    if (useStoredAuth) {
      credentials.accounts.forEach(account => {
        account.isLastUsed = account.username === username;
      });
      await saveCredentials(credentials);
    }
  } else {
    // No saved accounts
    username = await promptUser('Enter username: ');
    password = await promptUser('Enter password: ');
    const saveAccount = await promptUser('Save this account for future use? (y/n): ');
    
    if (saveAccount.toLowerCase() === 'y') {
      credentials.accounts = [{
        username,
        password,
        isLastUsed: true
      }];
      await saveCredentials(credentials);
      console.log('Account saved!');
    }
  }

  // Launch browser with persistent context
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow down operations by 100ms to give the site time to respond
  });
  
  // Use a persistent context to maintain cookies between runs
  const context = await browser.newContext({
    storageState: fs.existsSync(path.join(CONFIG_DIR, 'storage.json')) 
      ? path.join(CONFIG_DIR, 'storage.json') 
      : undefined,
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  
  const page = await context.newPage();

  // Set longer timeouts for navigation and waiting
  page.setDefaultTimeout(60000); // 60 seconds timeout
  page.setDefaultNavigationTimeout(60000);

  try {
  // 🔐 1. LOGIN TO OMS
    console.log('Navigating to login page...');
    await page.goto('https://intranet.decopress.com/', { waitUntil: 'networkidle' });
    
    // Check if login form exists (if not, we're already logged in)
    const loginFormExists = await page.evaluate(() => {
      return !!document.querySelector('#txt_Username');
    });
    
    if (loginFormExists) {
      console.log('Logging in...');
      await page.fill('#txt_Username', username);
      await page.fill('#txt_Password', password);
      
      // Find and click the login button
      const loginButtonSelector = [
        'input[type="button"]',
        'input[type="submit"]',
        'button[type="submit"]',
        '#login-button'
      ];
      
      for (const selector of loginButtonSelector) {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log(`Clicked login button using selector: ${selector}`);
          break;
        }
      }
      
      // Wait for navigation to complete
      await page.waitForNavigation({ waitUntil: 'networkidle' });
      console.log('Login successful');
    } else {
      console.log('Already logged in');
    }
    
    // Save storage state for future runs
    await context.storageState({ path: path.join(CONFIG_DIR, 'storage.json') });

  // 📄 2. NAVIGATE TO JOB LIST
    console.log('Navigating to job list...');
    await page.goto('https://intranet.decopress.com/JobStatusList/JobStatusList.aspx?from=menu', { 
      waitUntil: 'networkidle' 
    });
    
    // Wait for the job list to load
    console.log('Waiting for job list to load...');
    await page.waitForSelector('.ew-badge-container.process-codes', { timeout: 30000 });
    
    // Additional wait to ensure JavaScript has finished loading dynamic content
    await page.waitForTimeout(5000);

    // 🔍 3. COLLECT JOBS WITH HW OR AP CODES
    console.log('Collecting jobs with HW or AP codes...');
    const jobsWithTargetCodes = await page.$$eval('.ew-badge-container.process-codes .ew-badge', badges => {
      return badges
        .filter(badge => {
          const code = badge.getAttribute('data-code');
          return code === 'HW' || code === 'AP';
        })
        .map(badge => {
          const jobNumber = badge.getAttribute('data-jobnumber');
          const code = badge.getAttribute('data-code');
          const quantity = badge.querySelector('.process-qty')?.innerText || '0';
          return { jobNumber, code, quantity };
        });
    });

    // 4. GET UNIQUE JOB NUMBERS TO VISIT
    const uniqueJobNumbers = [...new Set(jobsWithTargetCodes.map(job => job.jobNumber))];
    
    console.log(`Found ${uniqueJobNumbers.length} jobs with HW or AP codes`);
    
    if (uniqueJobNumbers.length === 0) {
      console.log('No jobs with HW or AP codes found. The page might not have loaded correctly.');
      
      // Debug: Take a screenshot to see what's on the page
      await page.screenshot({ path: path.join(CONFIG_DIR, 'debug-screenshot.png') });
      console.log(`Debug screenshot saved to ${path.join(CONFIG_DIR, 'debug-screenshot.png')}`);
    }

    for (const jobNumber of uniqueJobNumbers) {
      try {
        const jobUrl = `https://intranet.decopress.com/Jobs/job.aspx?ID=${jobNumber}`;
        console.log(`Processing job ${jobNumber}...`);
        await page.goto(jobUrl, { waitUntil: 'networkidle' });
        
        // Wait for job details to load
        await page.waitForSelector('.js-jobline-row', { timeout: 30000 });
        
        // 🧠 SCRAPE JOB DETAILS - Check for PMS colors in jobline rows
        const hasPms = await page.$$eval('.js-jobline-row', rows => {
          for (const row of rows) {
            const comment = row.getAttribute('data-comment') || '';
            // Check if comment contains "PMS" but not "NO PMS"
            if (comment.toLowerCase().includes('pms')) {
              // If it explicitly says "NO PMS", return false
              if (comment.toLowerCase().includes('no pms')) {
                continue;
              }
              return true;
            }
          }
          return false;
        });
        
        const jobCodes = jobsWithTargetCodes
          .filter(job => job.jobNumber === jobNumber)
          .map(job => `${job.code}:${job.quantity}`)
          .join(', ');

      // 💾 Send to Supabase
        await saveJobTag({ 
          id: jobNumber, 
          has_pms: hasPms,
        });

        console.log(`Processed job ${jobNumber} with codes: ${jobCodes}, PMS colors: ${hasPms}`);

    } catch (err) {
        console.error(`Failed to scrape job ${jobNumber}:`, err);
    }
  }
  } catch (err) {
    console.error('An error occurred during scraping:', err);
    
    // Take a screenshot on error
    try {
      await page.screenshot({ path: path.join(CONFIG_DIR, 'error-screenshot.png') });
      console.log(`Error screenshot saved to ${path.join(CONFIG_DIR, 'error-screenshot.png')}`);
    } catch (screenshotErr) {
      console.error('Failed to take error screenshot:', screenshotErr);
    }
  } finally {
    console.log('Closing browser...');
  await browser.close();
  }
}

run().catch(err => {
  console.error('Unhandled error in main process:', err);
  process.exit(1);
});
