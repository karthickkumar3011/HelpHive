# Environment Variables Setup for HelpHive Client

## Overview
This document explains how to configure environment variables for the HelpHive React client application.

## Environment File
Create a `.env` file in the `client/` directory with the following variables:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Application Configuration
REACT_APP_APP_NAME=HelpHive
REACT_APP_ENVIRONMENT=development

# Optional: External Services (if used)
# REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
# REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
```

## Environment Variables Explained

### Required Variables
- `REACT_APP_API_URL`: The base URL for your backend API server
- `REACT_APP_SOCKET_URL`: The URL for your Socket.io server (usually same as API URL)

### Optional Variables
- `REACT_APP_APP_NAME`: Your application name (default: "HelpHive")
- `REACT_APP_ENVIRONMENT`: Current environment (development/production/staging)

### External Services (Optional)
- `REACT_APP_GOOGLE_MAPS_API_KEY`: For Google Maps integration
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`: For Stripe payment processing

## Usage in Code
Environment variables are accessed via `process.env.REACT_APP_VARIABLE_NAME` in your React components.

Example:
```javascript
const apiUrl = process.env.REACT_APP_API_URL;
const response = await axios.get(`${apiUrl}/api/endpoint`);
```

## Production Deployment
For production deployment, make sure to:
1. Update the environment variables to point to your production server
2. Rebuild the React application
3. Ensure the environment variables are set in your hosting platform

## Security Notes
- Never commit sensitive data (API keys, secrets) to version control
- The `.env` file is included in `.gitignore` to prevent accidental commits
- For production, use your hosting platform's environment variable configuration

## Development vs Production
- **Development**: Uses localhost URLs by default
- **Production**: Should use your actual domain/server URLs

Example production configuration:
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_SOCKET_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
