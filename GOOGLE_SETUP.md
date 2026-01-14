# Complete Google Sign-In Setup Guide for Android APK

This guide will walk you through setting up Google Sign-In from scratch for building an Android APK for manual distribution/testing.

## Prerequisites

- Google account
- Supabase account (already set up)
- Package name: `com.fiestadelaplaya.backstage` (already configured)

## Step 1: Create/Configure Google Cloud Project

### 1.1 Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"New Project"** (or select an existing project)
4. Enter a project name (e.g., "Backstage App")
5. Click **"Create"**

### 1.2 Enable Required APIs

1. In the Google Cloud Console, go to **"APIs & Services" → "Library"**
2. Search for and enable:
   - **Google Sign-In API** (or **Identity Toolkit API**)
   - **Google+ API** (if available, though deprecated, some services still use it)

## Step 2: Create OAuth 2.0 Client IDs

### 2.1 Create OAuth Consent Screen

1. Go to **"APIs & Services" → "OAuth consent screen"**
2. Choose **"External"** user type (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: Backstage
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. For **Scopes**, click **"Add or Remove Scopes"**:
   - Add: `openid`, `profile`, `email`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`
7. Click **"Save and Continue"**
8. For **Test users** (if app is in testing):
   - Click **"Add Users"**
   - Add test email addresses that will be allowed to sign in
   - Click **"Add"**
9. Click **"Save and Continue"**
10. Review and click **"Back to Dashboard"**

### 2.2 Create OAuth 2.0 Client ID (Web Client - Required for React Native)

1. Go to **"APIs & Services" → "Credentials"**
2. Click **"+ CREATE CREDENTIALS" → "OAuth client ID"**
3. Select **"Web application"** as the application type
4. Name it: **"Backstage Web Client"** (or similar)
5. Leave **"Authorized JavaScript origins"** empty (not needed for mobile)
6. Leave **"Authorized redirect URIs"** empty (React Native handles this)
7. Click **"Create"**
8. **IMPORTANT**: Copy the **Client ID** (it looks like: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`)
   - This is your **Web Client ID** - you'll need this!
9. Click **"OK"**

### 2.3 Create OAuth 2.0 Client ID (Android Client)

1. Still in **"Credentials"**, click **"+ CREATE CREDENTIALS" → "OAuth client ID"**
2. Select **"Android"** as the application type
3. Name it: **"Backstage Android Client"**
4. Enter the **Package name**: `com.fiestadelaplaya.backstage`
5. For **SHA-1 certificate fingerprint**:
   - You'll need your debug keystore SHA-1 for testing
   - **Easiest method**: Run the helper script from project root:
     ```bash
     ./scripts/get-sha1.sh
     ```
   - **Or manually**: 
     ```bash
     keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
     ```
   - Copy the SHA-1 fingerprint (looks like: `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX`)
   - Paste it in the field
6. Click **"Create"**
7. Copy the **Client ID** for reference (you may not need it directly if using Firebase)

## Step 3: Set Up Firebase Project

### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** (or use existing)
3. **Link to your Google Cloud project**:
   - Select **"Use an existing Google Cloud project"**
   - Choose the project you created in Step 1
   - OR create a new Firebase project (it will create a new Google Cloud project)
4. Click **"Continue"**
5. Disable Google Analytics (optional, not needed for basic setup)
6. Click **"Create project"**
7. Wait for setup to complete, then click **"Continue"**

### 3.2 Add Android App to Firebase

1. In Firebase Console, click **"Add app" → Android icon**
2. Enter **Android package name**: `com.fiestadelaplaya.backstage`
3. Enter **App nickname** (optional): Backstage
4. Enter **Debug signing certificate SHA-1**:
   - Use the same SHA-1 from Step 2.3
   - Or get it again: `./scripts/get-sha1.sh`
   - Or manually: `keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1`
5. Click **"Register app"**
6. **Download `google-services.json`**:
   - Click the download button
   - **IMPORTANT**: Save this file - you'll need it!
7. Click **"Next"** → **"Next"** → **"Continue to console"**

### 3.3 Enable Google Sign-In in Firebase

1. In Firebase Console, go to **"Authentication"**
2. Click **"Get started"** (if first time)
3. Go to **"Sign-in method"** tab
4. Click on **"Google"**
5. Toggle **"Enable"**
6. **Enter your Web Client ID** from Step 2.2:
   - Paste the Client ID (e.g., `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`)
   - The **Web client secret** is not needed for mobile apps
7. Click **"Save"**

### 3.4 Get Your google-services.json File

1. In Firebase Console, go to **"Project Settings"** (gear icon)
2. Scroll down to **"Your apps"** section
3. Find your Android app
4. Click **"google-services.json"** to download (or re-download if needed)
5. Save this file - you'll need to place it in your project root

## Step 4: Configure Supabase for Google OAuth

### 4.1 Get Supabase Auth Settings

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **"Authentication" → "Providers"**
4. Find **"Google"** and click on it
5. Toggle **"Enable Google provider"** to ON
6. Enter your **Client ID (for OAuth)**: 
   - Use your **Web Client ID** from Step 2.2
7. Enter your **Client Secret (for OAuth)**:
   - Go back to Google Cloud Console → **"APIs & Services" → "Credentials"**
   - Click on your **Web Client** OAuth 2.0 Client ID
   - Copy the **Client secret** (you may need to reveal it)
   - Paste it in Supabase
8. Click **"Save"**

### 4.2 Update Supabase Redirect URL (if needed)

1. In Supabase, go to **"Authentication" → "URL Configuration"**
2. Add authorized redirect URLs if needed:
   - Your Supabase project URL: `https://your-project.supabase.co/auth/v1/callback`
   - This should be automatic, but verify it's there

## Step 5: Update Your Project Files

### 5.1 Place google-services.json

1. Copy the downloaded `google-services.json` file
2. Place it in the **project root directory** (same level as `package.json`)
3. Make sure it's named exactly: `google-services.json`

### 5.2 Update Code with Web Client ID

You need to update the hardcoded Web Client ID in your code:

**File: `src/app/index.tsx`**

Find this line (around line 21-22):
```typescript
webClientId: "336409061120-879kuqilgumm8h397klnrkm1g3vhmq61.apps.googleusercontent.com",
```

Replace with your **Web Client ID** from Step 2.2:
```typescript
webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
```

### 5.3 Update app.json (if needed)

Check `app.json` - the `iosUrlScheme` in the Google Sign-In plugin should match your Web Client ID's reversed format:
- If your Web Client ID is: `123456789-abc123def456.apps.googleusercontent.com`
- The reversed format should be: `com.googleusercontent.apps.123456789-abc123def456`

**File: `app.json`** (line 45):
```json
"iosUrlScheme": "com.googleusercontent.apps.YOUR_CLIENT_ID_NUMBER-PREFIX"
```

Note: This is mainly for iOS, but good to update if you plan to support iOS later.

## Step 6: Test Locally

### 6.1 Install Dependencies

```bash
npm install
```

### 6.2 Set Up Environment Variables

1. Copy `env.template` to `.env.local`:
   ```bash
   cp env.template .env.local
   ```

2. Edit `.env.local` with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### 6.3 Test on Android Emulator/Device

```bash
# Start Metro bundler
npm start

# In another terminal, run on Android
npm run android
```

Or use EAS Build for development client:
```bash
eas build --profile development --platform android
```

## Step 7: Build APK for Manual Distribution

### 7.1 Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### 7.2 Login to EAS

```bash
eas login
```

### 7.3 Build Preview APK (for testing/manual distribution)

```bash
eas build --platform android --profile preview
```

This will:
- Create a build on EAS servers
- Generate an APK file (not AAB)
- Provide a download link when complete

### 7.4 Download and Install APK

1. Once the build completes, EAS will provide a download URL
2. You can also view builds at: https://expo.dev/accounts/[your-account]/projects/backstage/builds
3. Download the APK file
4. Transfer to Android device
5. Enable **"Install from unknown sources"** on the device
6. Install the APK

## Step 8: Important Notes for Testing

### 8.1 Test Users

- If your OAuth consent screen is in **Testing** mode, only users added as "Test users" can sign in
- Add test users in: Google Cloud Console → APIs & Services → OAuth consent screen → Test users

### 8.2 SHA-1 Fingerprint for Production

For production builds, you'll need the **release keystore SHA-1**:
1. Generate a release keystore (if you haven't)
2. Get SHA-1: `keytool -list -v -keystore your-release-key.keystore -alias your-key-alias | grep SHA1`
3. Add this SHA-1 to Firebase Android app settings
4. Add this SHA-1 to Google Cloud Console OAuth Android client

**Note**: If you encounter errors with `./gradlew signingReport` (like "ANDROID_HOME not found"), use the `keytool` command directly instead. The `keytool` method doesn't require Android SDK setup.

### 8.3 Debug vs Release Builds

- **Debug builds**: Use debug keystore SHA-1 (already added)
- **Release builds**: Need release keystore SHA-1
- You can add multiple SHA-1 certificates in both Firebase and Google Cloud Console

## Troubleshooting

### "Sign in cancelled" or "Developer Error"
- Check that SHA-1 is correctly added to Firebase and Google Cloud Console
- Ensure package name matches: `com.fiestadelaplaya.backstage`
- Verify `google-services.json` is in project root

### "OAuth client not found"
- Verify Web Client ID is correct in `src/app/index.tsx`
- Check that OAuth client exists in Google Cloud Console

### "Sign-in failed"
- Verify Supabase Google provider is enabled
- Check that Client ID and Secret are correct in Supabase
- Ensure test users are added (if app is in testing mode)

### Build fails with "google-services.json not found"
- Ensure `google-services.json` is in project root (not in `android/app/`)
- Verify file name is exactly `google-services.json`

## Summary Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Web Client ID created and copied
- [ ] Android Client ID created with correct SHA-1
- [ ] Firebase project created/linked
- [ ] Android app added to Firebase
- [ ] Google Sign-In enabled in Firebase
- [ ] `google-services.json` downloaded and placed in project root
- [ ] Supabase Google provider configured with Client ID and Secret
- [ ] Web Client ID updated in `src/app/index.tsx`
- [ ] Environment variables set up (`.env.local`)
- [ ] Test users added (if OAuth app is in testing)
- [ ] APK built successfully
- [ ] APK installed and tested on device

