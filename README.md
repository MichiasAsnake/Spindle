# JobSight PMS Indicator

A Chrome extension that adds PMS color indicators to job listings.

## Features

- Automatically identifies jobs that contain PMS colors
- Adds a visual indicator column to the job list
- Stores job data in Supabase for persistence
- Includes filtering options to show only jobs with or without PMS colors


https://github.com/user-attachments/assets/a3346d7b-11e0-4777-879a-f47fd186f117

JobSight Demo
--------------

Here’s how JobSight handles items without PMS colors:

When a job is first opened, it initially shows a “?” to indicate the PMS color status is unknown.

Once the job is reviewed and confirmed not to contain any PMS colors, the system updates accordingly.

After returning to the job list and refreshing the page, the “?” is replaced with an “X”, clearly marking that the item does not use PMS colors.

At the end of the demo, you’ll also see how filtering works — showing only items with or without PMS colors.
