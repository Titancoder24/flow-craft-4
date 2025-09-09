# Vercel Environment Variables

For Vercel deployment, add this environment variable in your project settings:

## Environment Variable for Vercel:

**Key:** `REACT_APP_OPENROUTER_API_KEY`
**Value:** `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`

## How to add in Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add new variable:
   - Name: `REACT_APP_OPENROUTER_API_KEY`
   - Value: `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`
   - Environment: Production, Preview, Development (select all)
5. Click "Save"
6. Redeploy your project

## Alternative: Use the hardcoded key

The app will work with the hardcoded key as a fallback, but using environment variables is more secure and recommended for production.
