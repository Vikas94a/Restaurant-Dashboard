# Quick Setup - Facebook Secrets

## ✅ Step 1: FACEBOOK_PAGE_ID - DONE
Already set to: `103160629462957`

## ⏳ Step 2: Set FACEBOOK_SYSTEM_USER_TOKEN

Run this command and paste your token when prompted:

```bash
firebase functions:secrets:set FACEBOOK_SYSTEM_USER_TOKEN
```

**Or use this one-liner (replace YOUR_TOKEN_HERE):**
```bash
echo "YOUR_TOKEN_HERE" | firebase functions:secrets:set FACEBOOK_SYSTEM_USER_TOKEN
```

## 🚀 Step 3: Deploy Functions

After setting the token, deploy:

```bash
cd functions
npm run build
firebase deploy --only functions:postTextToFacebookFunction,functions:postImageToFacebookFunction
```

## 📋 Complete Setup Command

If you have your token ready, run:

```bash
# Set token (replace YOUR_TOKEN with actual token)
echo "YOUR_TOKEN" | firebase functions:secrets:set FACEBOOK_SYSTEM_USER_TOKEN

# Build and deploy
cd functions
npm run build
firebase deploy --only functions:postTextToFacebookFunction,functions:postImageToFacebookFunction
```

