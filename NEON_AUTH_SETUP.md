# Neon Auth Setup Guide

This guide will help you replace the Replit authentication with Neon Auth in your RepoRadar application.

## What We've Done

1. **Replaced Replit Auth with Neon Auth**: 
   - Created `server/neonAuth.ts` to handle server-side authentication
   - Updated `server/routes.ts` to use the new auth system
   - Created `client/src/contexts/neon-auth-context.tsx` for client-side auth
   - Updated the frontend components (landing page, header, mobile nav) to use Neon Auth login buttons
   - Created a `LogoutButton` component for easy logout functionality
   - Added Stack Auth package dependencies

2. **Added PostgreSQL MCP Server**: 
   - Configured `.kiro/settings/mcp.json` to connect to your Neon database
   - This allows you to query your database directly through the MCP interface

3. **Updated Environment Variables**:
   - Added Neon Auth configuration to both server and client `.env` files
   - Commented out old Replit auth variables

## Next Steps - Configure Neon Auth

### 1. Enable Neon Auth in Your Neon Console

1. Go to [pg.new](https://pg.new) or your existing Neon project
2. Navigate to your project's **Auth** page
3. Click **"Enable Neon Auth"** to activate it
4. Select **"JavaScript"** or **"React"** as your framework

### 2. Get Your Neon Auth Keys

From the Configuration tab in your Neon Console, copy the environment variables:

```bash
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key_here
STACK_SECRET_SERVER_KEY=your_secret_key_here
```

### 3. Update Your Environment Variables

Replace the placeholder values in your `.env` file:

```bash
# Replace these with your actual Neon Auth keys
NEXT_PUBLIC_STACK_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_actual_publishable_key
STACK_SECRET_SERVER_KEY=your_actual_secret_key
```

Also update `client/.env`:

```bash
VITE_STACK_PROJECT_ID=your_actual_project_id
VITE_STACK_PUBLISHABLE_KEY=your_actual_publishable_key
```

### 4. Install Dependencies (Already Done)

We've already installed the required packages:
- `@stackframe/stack` (server and client)

### 5. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit your application and try the "Get Started Free" button
3. You should be redirected to Stack Auth's sign-in page
4. After signing in, you'll be redirected back to your app via `/auth/callback`

**Note**: The current implementation includes a demo mode for testing. Once you configure your actual Neon Auth keys, the real Stack Auth integration will be used.

### 6. Verify Database Integration

Your users will now be automatically synced to the `neon_auth.users_sync` table in your Neon database. You can query this table to see your users:

```sql
SELECT * FROM neon_auth.users_sync;
```

## Benefits of Neon Auth

1. **Direct Database Integration**: User data is automatically synced to your Neon database
2. **No Manual Sync Required**: No need for webhooks or polling to keep user data in sync
3. **Built-in OAuth**: Supports Google, GitHub, and other OAuth providers
4. **Serverless**: Scales automatically with your Neon database
5. **Simplified Setup**: No complex authentication flows to implement

## Current Implementation

The current implementation provides:
- Session-based authentication using your existing session store
- User data syncing to your Neon database
- Logout functionality throughout the app
- Compatibility with your existing user management system
- A demo mode for testing before full Neon Auth setup

## Troubleshooting

### If you see "Authentication service not configured":
- Make sure you've set the environment variables correctly
- Restart your development server after updating `.env` files

### If login redirects don't work:
- Check that your domain is configured correctly in Neon Auth settings
- Make sure the redirect URLs match your development/production domains

### If users aren't syncing to the database:
- Verify your `DATABASE_URL` is correct
- Check that the Neon Auth integration is properly enabled in your Neon Console

## Removing Old Replit Auth Code

Once Neon Auth is working, you can safely remove:
- `server/replitAuth.ts` (already replaced)
- Any Replit-specific environment variables
- The old login routes that pointed to `/api/login`

The new system uses Stack Auth's built-in authentication flow, so no custom login routes are needed.