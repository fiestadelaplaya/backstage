# Local Development Setup Guide

This guide will help you set up the necessary configuration files for local development.

## Required Files

You need to create the following files by copying the templates and filling in your actual values:

### 1. Environment Variables (`.env` or `.env.local`)

```bash
cp env.template .env
# or
cp env.template .env.local
```

Then edit the file and replace the placeholder values with your actual Supabase credentials:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

**Note:** `.env.local` files are git-ignored for security.

### 2. Google Services Configuration for Android (`google-services.json`)

```bash
cp google-services.json.template google-services.json
```

Then fill in the values from your Firebase/Google Cloud Console:
- Get this file from: [Firebase Console](https://console.firebase.google.com/) → Your Project → Project Settings → Your Apps → Android App
- Make sure the package name matches: `com.fiestadelaplaya.backstage`
- Replace all placeholder values (YOUR_PROJECT_ID, YOUR_CLIENT_ID, etc.)

**Note:** This file is git-ignored for security.

### 3. Google Services Configuration for iOS (`GoogleService-Info.plist`)

```bash
cp GoogleService-Info.plist.template GoogleService-Info.plist
```

Then fill in the values from your Firebase/Google Cloud Console:
- Get this file from: [Firebase Console](https://console.firebase.google.com/) → Your Project → Project Settings → Your Apps → iOS App
- Make sure the bundle ID matches: `com.fiestadelaplaya.backstage`
- Replace all placeholder values (YOUR_PROJECT_ID, YOUR_CLIENT_ID, etc.)
- Ensure the REVERSED_CLIENT_ID matches the URL scheme in `app.json`: `com.googleusercontent.apps.336409061120-84hle6v8theg666r5dh9k3a1ueqad2qa`

**Note:** This file is git-ignored for security.

## Quick Setup Commands

Run these commands to copy all templates at once:

```bash
cp env.template .env.local
cp google-services.json.template google-services.json
cp GoogleService-Info.plist.template GoogleService-Info.plist
```

Then edit each file with your actual values.

## Where to Get the Values

### Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to: Settings → API
3. Copy the "Project URL" and "anon/public" key

### Google Services Files
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Add Android and iOS apps if not already added
4. Download the configuration files from Project Settings → Your Apps
5. Make sure package name/bundle ID matches: `com.fiestadelaplaya.backstage`

