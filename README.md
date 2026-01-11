# backstage

Aplicación para control de seguridad de la Fiesta Nacional de la Playa de Río

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI (installed globally or via npx)
- EAS CLI (for building distributable APKs)
- Supabase CLI (optional, for local development)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` or `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**For local Supabase development:**
- If using local Supabase, the default URL is `http://127.0.0.1:54321`
- You can get the anon key from your local Supabase instance or use the one from `supabase/config.toml`
- To start local Supabase: `supabase start`

**For production:**
- Get these values from your Supabase project dashboard: Settings → API
- `EXPO_PUBLIC_SUPABASE_URL` should be your project URL (e.g., `https://xxxxx.supabase.co`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` should be your project's anon/public key

**Note:** Files matching `.env*.local` are automatically ignored by git (see `.gitignore`)

### 3. Google Sign-In Configuration

The app requires Google Sign-In configuration files:
- `google-services.json` (for Android) - place in project root
- `GoogleService-Info.plist` (for iOS) - place in project root

These files are git-ignored for security. You need to obtain them from your Google Cloud Console project.

### 4. Install EAS CLI (for building APKs)

```bash
npm install -g eas-cli
```

Login to your Expo account:
```bash
eas login
```

## Running Locally

### Development Server

Start the Expo development server:

```bash
npm start
# or
npx expo start
```

This will start the Metro bundler and provide options to:
- Open in [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- Open in [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- Open in [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- Open in [Expo Go](https://expo.dev/go) (limited sandbox)

### Run on Specific Platform

**Android:**
```bash
npm run android
# or
npx expo run:android
```

**iOS:**
```bash
npm run ios
# or
npx expo run:ios
```

**Web:**
```bash
npm run web
# or
npx expo start --web
```

### Local Supabase Setup (Optional)

If you want to use a local Supabase instance for development:

1. Install Supabase CLI: `npm install -g supabase`
2. Start local Supabase: `supabase start`
3. The app will automatically connect to `http://127.0.0.1:54321` if `EXPO_PUBLIC_SUPABASE_URL` is not set

## Building a Distributable APK

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) to create distributable Android APKs.

### Initial Setup (First Time Only)

1. Make sure you're logged in to EAS:
   ```bash
   eas login
   ```

2. Configure your project (if not already done):
   ```bash
   eas build:configure
   ```

### Build Commands

**Preview Build (for testing, installable APK):**
```bash
eas build --platform android --profile preview
```

This creates an APK that can be installed directly on Android devices. The build will be uploaded to EAS servers and you'll receive a download link.

**Production Build (for Play Store submission):**
```bash
eas build --platform android --profile production
```

This creates a production-ready build with auto-incremented version numbers (as configured in `eas.json`).

**Local Build (faster, requires Android SDK):**
```bash
eas build --platform android --profile preview --local
```

### Accessing Your Built APK

After the build completes:
1. Check the EAS dashboard: https://expo.dev/accounts/[your-account]/projects/backstage/builds
2. Or use the CLI to view builds: `eas build:list`
3. Download the APK from the build page or use: `eas build:view`

### Build Configuration

The build profiles are configured in `eas.json`:
- **preview**: Internal distribution, creates APK files
- **production**: Auto-increments version, ready for Play Store
- **development**: Development client builds

## Project Structure

You can start developing by editing the files inside the `src/app` directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction/).

## Additional Scripts

```bash
# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Reset project (moves starter code to app-example)
npm run reset-project
```

## Learn More

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
- [EAS Build documentation](https://docs.expo.dev/build/introduction/): Learn how to build and submit your app.

## Join the Community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
