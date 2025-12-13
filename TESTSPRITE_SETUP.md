# TestSprite Setup Documentation

## Introduction

**TestSprite** is an automated frontend testing tool that enables end-to-end testing of web applications. For MI Practice Coach, TestSprite will automate testing of critical user flows, ensuring reliability and consistency across authentication, practice sessions, payment processing, and navigation.

### Benefits

- **Automated Testing**: Reduces manual testing effort and ensures consistent test execution
- **Critical Flow Coverage**: Tests authentication, practice sessions, payments, and navigation
- **Regression Prevention**: Catches breaking changes before they reach production
- **CI/CD Integration**: Can be integrated into continuous integration pipelines

## Current Setup Status

### What Has Been Configured

✅ **TestSprite Bootstrap Completed**
- TestSprite has been initialized for frontend testing
- Project type: Frontend (React/TypeScript)
- Test scope: Codebase-wide testing

✅ **Code Summary Generated**
- Feature documentation created at `testsprite_tests/tmp/prd_files/code_summary.json`
- Documents all major features including:
  - Authentication System
  - Practice Session Flow
  - Subscription and Payment Flow
  - Navigation and Routing
  - Dashboard
  - Gamification System
  - Coaching Reports
  - And more...

✅ **Configuration File Created**
- Configuration saved at `testsprite_tests/tmp/config.json`
- Local endpoint configured: `http://localhost:3000`
- Test execution arguments configured with focus areas

### Current Blocker

⚠️ **API Key Required**
- TestSprite requires an API key to generate test plans and execute tests
- API key must be obtained from: https://www.testsprite.com/dashboard/settings/apikey
- Once obtained, the API key needs to be configured in the TestSprite environment

## Prerequisites

Before running TestSprite tests, ensure you have:

1. **TestSprite API Key**
   - Visit https://www.testsprite.com/dashboard/settings/apikey
   - Create a new API key
   - Save it securely for configuration

2. **Development Server Running**
   - The app must be running on port 3000
   - Start with: `npm run dev`
   - Verify at: http://localhost:3000

3. **Node.js Installed**
   - Required for running TestSprite commands
   - Verify with: `node --version`

4. **TestSprite MCP Package**
   - Available via npm/npx
   - Automatically installed when using TestSprite MCP tools

## Test Coverage Areas

TestSprite will focus on testing these four critical user flows:

### 1. Authentication Flow

Tests the complete authentication journey:

- **Sign Up**: User registration with email and password
- **Email Confirmation**: Email verification process
- **Login**: User sign-in with credentials
- **Logout**: User sign-out functionality
- **Password Reset**: Forgot password and reset password flows
- **Session Management**: Persistent sessions and authentication state

**Related Files:**
- `contexts/AuthContext.tsx`
- `components/views/LoginView.tsx`
- `components/views/ForgotPasswordView.tsx`
- `components/views/ResetPasswordView.tsx`
- `components/views/EmailConfirmationView.tsx`
- `hooks/useAuthCallback.ts`
- `lib/supabase.ts`

### 2. Practice Session Flow

Tests the AI-powered practice session experience:

- **Start Session**: Initiating a new practice session
- **AI Conversation**: Chat interface with AI patient simulation
- **Voice Input**: Speech recognition functionality
- **Timer**: Session timer tracking
- **End Session**: Completing a practice session
- **Feedback Display**: Post-session feedback and analysis
- **Session Saving**: Persisting session data

**Related Files:**
- `components/views/PracticeView.tsx`
- `components/views/FeedbackView.tsx`
- `components/ui/ChatBubble.tsx`
- `components/ui/Timer.tsx`
- `hooks/useSpeechRecognition.ts`
- `services/geminiService.ts`
- `services/patientService.ts`
- `hooks/useSessionManager.ts`

### 3. Subscription/Payment Flow

Tests the premium subscription and payment processing:

- **Paywall Display**: Showing upgrade prompts for free users
- **Stripe Checkout**: Initiating payment checkout flow
- **Tier Upgrade**: Upgrading from free to premium tier
- **Subscription Management**: Viewing subscription status
- **Subscription Cancellation**: Cancelling premium subscriptions
- **Subscription Restoration**: Restoring cancelled subscriptions
- **Webhook Processing**: Stripe webhook handling

**Related Files:**
- `components/views/PaywallView.tsx`
- `components/views/CancelSubscriptionView.tsx`
- `components/views/SettingsView.tsx`
- `services/stripeService.ts`
- `services/subscriptionService.ts`
- `hooks/useStripeCallback.ts`
- `hooks/useTierManager.ts`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/update-tier-from-session/index.ts`
- `supabase/functions/cancel-subscription/index.ts`
- `supabase/functions/restore-subscription/index.ts`

### 4. Navigation Flow

Tests view routing and navigation:

- **View Routing**: Navigation between different views
- **Bottom Navigation**: Bottom navigation bar functionality
- **Back Button**: Back button navigation
- **View Renderer**: Lazy-loaded view rendering
- **Route Guards**: Authentication-based route protection

**Related Files:**
- `components/views/ViewRenderer.tsx`
- `components/ui/BottomNavBar.tsx`
- `components/ui/BackButton.tsx`
- `hooks/useAppRouter.ts`
- `App.tsx`

## File Structure

TestSprite setup files are located in the `testsprite_tests/` directory:

```
testsprite_tests/
├── tmp/
│   ├── config.json                    # Test execution configuration
│   └── prd_files/
│       └── code_summary.json          # Feature documentation
└── testsprite-mcp-test-report.md      # Test report (generated after execution)
```

### Configuration File (`config.json`)

The configuration file contains:

```json
{
  "status": "commited",
  "type": "frontend",
  "scope": "codebase",
  "localEndpoint": "http://localhost:3000",
  "executionArgs": {
    "projectName": "mi-practice-coach",
    "projectPath": "/path/to/project",
    "testIds": [],
    "additionalInstruction": "Focus on testing critical flows...",
    "envs": {
      "API_KEY": ""
    }
  }
}
```

### Code Summary File (`code_summary.json`)

Contains comprehensive documentation of:
- Tech stack (TypeScript, React, Vite, Supabase, Stripe, etc.)
- All application features
- File mappings for each feature
- Feature descriptions

## Setup Instructions

### Step 1: Obtain API Key

1. Visit https://www.testsprite.com/dashboard/settings/apikey
2. Sign in or create a TestSprite account
3. Generate a new API key
4. Copy the API key securely

### Step 2: Configure API Key

The API key needs to be set in the TestSprite environment. This can be done through:

- **Environment Variable**: Set `TESTSPRITE_API_KEY` in your environment
- **Configuration File**: Update `testsprite_tests/tmp/config.json` with the API key in the `envs.API_KEY` field
- **TestSprite Dashboard**: Configure via the TestSprite web interface

### Step 3: Start Development Server

Ensure the application is running:

```bash
npm run dev
```

Verify the server is accessible at http://localhost:3000

### Step 4: Generate Test Plan

Once the API key is configured, generate the test plan:

```bash
cd /Users/eduardojavier/mi-practice-coach/mi-practice-coach
node /Users/eduardojavier/.npm/_npx/[version]/node_modules/@testsprite/testsprite-mcp/dist/index.js generateCodeAndExecute
```

Or use the TestSprite MCP tools if available in your environment.

### Step 5: Execute Tests

Tests will be automatically executed after the test plan is generated. The execution will:

1. Generate test code based on the test plan
2. Execute tests against the running application
3. Generate a test report

### Step 6: View Test Reports

After execution, test reports will be available at:
- `testsprite_tests/testsprite-mcp-test-report.md` - Formatted markdown report
- `testsprite_tests/tmp/raw_report.md` - Raw test output

## Running Tests

### Generate and Execute Tests

The primary command to generate and execute tests:

```bash
cd /Users/eduardojavier/mi-practice-coach/mi-practice-coach
node /Users/eduardojavier/.npm/_npx/[version]/node_modules/@testsprite/testsprite-mcp/dist/index.js generateCodeAndExecute
```

### Rerun Tests

To rerun previously generated tests:

```bash
node /Users/eduardojavier/.npm/_npx/[version]/node_modules/@testsprite/testsprite-mcp/dist/index.js reRunTests
```

### Expected Output Locations

- **Test Plan**: `testsprite_tests/testsprite_frontend_test_plan.json` (generated)
- **Test Report**: `testsprite_tests/testsprite-mcp-test-report.md`
- **Raw Report**: `testsprite_tests/tmp/raw_report.md`

### Interpreting Results

The test report will include:

- **Test Cases**: Individual test scenarios organized by requirement
- **Pass/Fail Status**: Each test case marked as passed or failed
- **Screenshots**: Visual evidence of test execution (if configured)
- **Error Messages**: Detailed error information for failed tests
- **Coverage Summary**: Overview of tested features and flows

## Next Steps

### Immediate Actions Required

1. ✅ **Obtain TestSprite API Key**
   - Visit: https://www.testsprite.com/dashboard/settings/apikey
   - Create and copy your API key

2. ⏳ **Configure API Key**
   - Set the API key in your environment or configuration file
   - Update `testsprite_tests/tmp/config.json` if needed

3. ⏳ **Generate Test Plan**
   - Run the test plan generation command
   - Review the generated test plan

4. ⏳ **Execute Tests**
   - Run the test execution command
   - Review test results and reports

5. ⏳ **Integrate into CI/CD** (Optional)
   - Add TestSprite tests to your continuous integration pipeline
   - Configure automated test runs on pull requests

### Additional Resources

- **TestSprite Documentation**: https://www.testsprite.com/docs
- **TestSprite Dashboard**: https://www.testsprite.com/dashboard
- **Support**: Contact TestSprite support for assistance

### Troubleshooting

**Issue: API Key Authentication Failed**
- Verify the API key is correctly set in the environment
- Ensure the API key hasn't expired
- Check that you're using the correct API key for your account

**Issue: Tests Fail to Connect**
- Verify the development server is running on port 3000
- Check that `http://localhost:3000` is accessible
- Ensure no firewall is blocking the connection

**Issue: Test Plan Generation Fails**
- Verify the code summary file exists at `testsprite_tests/tmp/prd_files/code_summary.json`
- Check that the configuration file is valid JSON
- Ensure all prerequisites are met

**Issue: Tests Timeout**
- Check network connectivity
- Verify the application is responding correctly
- Review test execution logs for specific timeout errors

## Related Documentation

- **TESTING_GUIDE.md**: Manual testing guide for AI patient responses
- **README.md**: General project setup and run instructions
- **CLAUDE.md**: Comprehensive project architecture and development guide

## Summary

TestSprite has been successfully set up for automated testing of MI Practice Coach. The configuration is complete, and the codebase has been analyzed and documented. Once the API key is configured, you can generate and execute comprehensive test suites covering all critical user flows.

The test suite will provide automated validation of:
- ✅ Authentication flows
- ✅ Practice session functionality
- ✅ Payment and subscription processing
- ✅ Navigation and routing

This automated testing will help ensure code quality and prevent regressions as the application evolves.

