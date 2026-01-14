#!/bin/bash
# Script to get SHA-1 fingerprint from Android debug keystore
# Usage: ./scripts/get-sha1.sh
# This method doesn't require Android SDK setup (unlike gradlew signingReport)

echo "Getting SHA-1 fingerprint from debug keystore..."
echo ""

keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep -A 5 "Certificate fingerprints" | grep SHA1

if [ $? -ne 0 ]; then
    echo ""
    echo "Error: Could not find SHA-1 fingerprint."
    echo "Make sure you're in the project root directory."
    echo ""
    echo "The debug keystore should be at: android/app/debug.keystore"
    exit 1
fi

