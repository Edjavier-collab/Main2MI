# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MI Practice Coach is a React-based Motivational Interviewing training application that uses Google's Gemini AI to simulate patient conversations. It's built with Vite, TypeScript, and React 19.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Before running the app, set the Gemini API key in `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

## Architecture

### Core Application Structure

- **App.tsx**: Main application component managing routing, state, and views
  - Handles user tier (Free/Premium), session management, and view navigation
  - Stores sessions in localStorage for persistence
  - Manages onboarding flow for new users

### Key Services

- **services/geminiService.ts**: Google Gemini AI integration
  - Creates chat sessions with patients based on profiles
  - Generates feedback after practice sessions
  - Creates coaching summaries for premium users
  
- **services/patientService.ts**: Patient profile generation
  - Generates random patient profiles from predefined templates
  - Supports filtering by topic, stage of change, and difficulty

### View Components

- **Dashboard**: Home screen with practice options and stats
- **PracticeView**: Core MI practice interface with AI patient
- **FeedbackView**: Post-session feedback display
- **HistoryView**: Session history and review
- **ResourceLibrary**: Educational MI resources
- **CoachingSummaryView**: Premium AI-generated coaching reports
- **PaywallView**: Premium subscription upsell

### State Management

- Uses React hooks (useState, useEffect, useCallback) for state management
- Session data persisted to localStorage
- User tier (Free/Premium) stored in localStorage
- No external state management libraries

### TypeScript Configuration

- Path alias `@/` configured for absolute imports
- Targets ES2022 with JSX transform
- Module resolution set to "bundler" for Vite compatibility

### Styling

- Inline Tailwind CSS classes (no separate CSS files)
- Responsive design with mobile-first approach
- Font Awesome icons integrated