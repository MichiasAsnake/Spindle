# Decopress PMS Indicator

A Chrome extension that adds PMS color indicators to Decopress job listings.

## Features

- Automatically identifies jobs that contain PMS colors
- Adds a visual indicator column to the job list
- Stores job data in Supabase for persistence
- Includes filtering options to show only jobs with or without PMS colors

## Installation

1. Clone this repository
2. Edit the `config.js` file to add your Supabase URL and API key
3. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension-package` directory

## Configuration

The extension requires a Supabase database to store job data. Edit the `config.js` file to provide your Supabase credentials:

```javascript
// config.js
const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_KEY = 'your-supabase-api-key';
```

## Supabase Schema

Create a table named `jobs` in your Supabase database with the following schema:

```sql
CREATE TABLE jobs (
  id VARCHAR PRIMARY KEY,
  has_pms BOOLEAN DEFAULT FALSE,
  complexity VARCHAR NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Development

To modify the extension:

1. Make your changes to the source files
2. Run `npm run build` to copy files to the `extension-package` directory
3. Reload the extension in Chrome

### Building and Packaging

This repository includes scripts to help with building and packaging the extension:

- `npm run build` - Copies all necessary files to the `extension-package` directory
- `npm run package` - Creates a ZIP file of the extension for distribution
- `npm run generate-icons` - Generates new icon files if needed

### Project Structure

- Root directory contains the source files
- `extension-package/` contains the files loaded by Chrome
- `images/` contains the extension icons
