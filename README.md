# OpenAccess

An AI-powered accessible venue finder for Gauteng and beyond: tell it how you move through the world, and it finds places that actually work for you.

<!-- SCREENSHOT PLACEHOLDER: add a screenshot of the venue search or profile setup here -->

## Overview

Finding out whether a restaurant has step-free access or an accessible restroom usually means phoning ahead and hoping someone answers. OpenAccess turns that into a search problem. You set up a personal accessibility profile once (wheelchair user, low-noise preference, service animal, screen reader, and more), and every venue search is answered with that profile in mind, grounded in real map data through the Gemini API.

## Key features

- **Personal accessibility profile** covering mobility (wheelchair, walker, cane, no stairs), sensory needs (low noise, low light, scent-free), visual needs (braille, screen reader), and other requirements like accessible parking or a service animal
- **Profile-aware venue search** that uses Gemini with maps grounding to return real places and explain how well each matches your needs
- **Live voice assistant** for hands-free help using the Gemini Live API
- **Chat assistant** for general accessibility questions
- **Image tools** to generate and edit images with AI, with size and aspect ratio controls
- **Business claim flow** (early access) so venue owners in Gauteng can manage their own accessibility profile

## Tech stack

- React 19 + TypeScript
- React Router 7 (hash routing)
- Vite 6
- `@google/genai` (Gemini search grounding, Live API, image generation and editing)
- `react-markdown`
- Material Symbols icons

## How it works

The app is a client-side React app with routes for search, live assistant, chat, image tools, profile, and business claim. The user's accessibility profile is plain typed state passed into the search flow, where `services/gemini.ts` builds profile-aware queries and returns both a written answer and a list of matched places. Microphone and geolocation permissions are requested only where needed.

## Setup

Prerequisites: Node.js and a Gemini API key.

1. `npm install`
2. Create `.env.local` with:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. `npm run dev` and open http://localhost:3000

## Usage

Open the Profile tab first and toggle everything that applies to you. Then search for something like "coffee shops in Sandton" and the results will be assessed against your profile, for example flagging places with step-free entrances if you selected "no stairs".

## What I learned

The interesting design problem here was representing accessibility needs as structured data rather than free text: a typed profile of toggles keeps the UI simple and makes every search reproducible, while the AI handles the fuzzy work of matching real venues against those needs. It also taught me how to use Gemini's grounding tools to keep answers tied to real places instead of hallucinated ones.

## Contact

Portfolio: [nqobile-x.github.io/Nqobille](https://nqobile-x.github.io/Nqobille/)
