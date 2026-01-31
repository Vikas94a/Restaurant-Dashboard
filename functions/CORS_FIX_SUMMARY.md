# CORS Fix Summary for Facebook Cloud Function

## Changes Made

1. **Converted from `onCall` to `onRequest`**: The function now handles direct HTTP requests instead of Firebase callable function format.

2. **Added CORS support**: Using the `cors` package to handle CORS headers properly.

3. **CORS Configuration**:
   - **Origin**: `*` (allows all origins - change to `'http://localhost:3000'` for dev if preferred)
   - **Methods**: `GET`, `POST`, `OPTIONS`
   - **Headers**: `Content-Type`, `Authorization`
   - **OPTIONS preflight**: Returns 204 status

## Packages Installed

```bash
npm install cors
npm install --save-dev @types/cors
```

## Deployment Command

```bash
cd functions
npm run build
firebase deploy --only functions:postTextToFacebookFunction
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

## Frontend Fetch Call Example

Here's how your frontend should call the function:

```typescript
const response = await fetch(
  'https://europe-west1-ai-eat-easy.cloudfunctions.net/postTextToFacebookFunction',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourAuthToken}`, // If you need auth
    },
    body: JSON.stringify({
      message: 'Your Facebook post message here'
    })
  }
);

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Failed to post to Facebook');
}

const data = await response.json();
console.log('Post ID:', data.id);
```

## Important Notes

1. **Function URL**: The function URL will be:
   - `https://europe-west1-ai-eat-easy.cloudfunctions.net/postTextToFacebookFunction`

2. **Request Body**: The function expects a JSON body with:
   ```json
   {
     "message": "string"
   }
   ```

3. **Response Format**: 
   - Success (200): `{ "id": "facebook_post_id" }`
   - Error (400/500): `{ "error": "error message" }`

4. **Internal Firebase Error**: If you still get an internal Firebase error after fixing CORS:
   - Check Firebase Function logs: `firebase functions:log`
   - Verify secrets are set: `firebase functions:secrets:access FACEBOOK_SYSTEM_USER_TOKEN`
   - Check function permissions and IAM roles
   - Ensure the function has proper error handling (already added)

5. **Changing CORS Origin**: To restrict to localhost only for development, update line 8 in `functions/src/facebook/index.ts`:
   ```typescript
   origin: 'http://localhost:3000', // Instead of '*'
   ```

## Testing

After deployment, test with:
```bash
curl -X POST https://europe-west1-ai-eat-easy.cloudfunctions.net/postTextToFacebookFunction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"Test post"}'
```
