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

## Important Notes:

- **No hardcoded API key** - The app now requires the environment variable
- **More secure** - API key is not exposed in the codebase
- **Production ready** - Follows best practices for environment variables
- **Easy to update** - Change the key in Vercel without code changes
