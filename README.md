# 🔖 Smart Bookmark App

A modern, real-time bookmark manager built with Next.js and Supabase.
This is a Screening Task From Abstrabit Technologies 

## Challenges & How I Solved Them

### 1. Realtime updates were not working initially

At first, I assumed the issue was with Supabase Realtime configuration or replication settings. I checked publications and replication multiple times.

However, I later realized that newer Supabase projects already have replication enabled by default.

The actual problem was in my `useEffect` logic. The subscription was being created before the user state was properly available, and my dependency array was not set correctly. Because of that, the UI wasn’t updating consistently.

To fix this, I:
 Ensured the subscription runs only after the authenticated user is available
 Corrected the `useEffect` dependency array
 Properly cleaned up the realtime channel on component unmount
After fixing the lifecycle handling, realtime updates worked correctly across multiple tabs.

---

### 2. OAuth redirect issues in production

Authentication worked locally but failed after deploying to Vercel.

The issue was caused by missing production URLs in Supabase Auth settings. The redirect URL and site URL were not configured for the deployed domain.

I resolved this by:
 Adding the Vercel production URL to the Site URL setting
 Adding the correct redirect path in the Redirect URLs section

After updating these settings, Google OAuth worked correctly in production.
