# Interviewer Avatar Setup Guide

This guide explains how to generate and set up the friendly female interviewer avatar for the job interview app.

## Overview

The interviewer avatar is a semi-realistic illustration that appears in the interview simulation interface. It's designed to work with the dark purple/navy UI theme.

## Avatar Specifications

- **Style**: Semi-realistic illustration with clean lines and soft shading
- **Composition**: Medium shot, from chest up, facing the viewer
- **Appearance**: Female, 30-40 years old, professional, confident and kind
- **Attire**: Smart casual blazer over a simple top
- **Expression**: Subtle smile, attentive expression
- **Background**: Transparent (PNG)
- **Color Palette**: Compatible with dark purple/navy UI
- **Resolution**: High resolution (1024x1024)

## Generation Methods

### Method 1: Using the API Route (Recommended)

The easiest way to generate the avatar is using the built-in API route:

1. **Make sure your `.env.local` has your OpenAI API key:**
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Start your development server:**
   ```bash
   npm run dev
   ```

3. **Call the download API route:**
   Open your browser or use curl:
   ```bash
   curl http://localhost:3000/api/avatar/download
   ```
   
   Or simply navigate to: `http://localhost:3000/api/avatar/download`

4. **The avatar will be automatically saved to:**
   ```
   public/interviewer-avatar.png
   ```

5. **The avatar will now appear in the interview simulation interface!**

### Method 2: Using the TypeScript Script

If you prefer using a script:

1. **Install tsx (TypeScript executor) if not already installed:**
   ```bash
   npm install --save-dev tsx
   ```

2. **Add a script to package.json:**
   ```json
   "scripts": {
     "generate-avatar": "tsx scripts/generate-avatar.ts"
   }
   ```

3. **Run the script:**
   ```bash
   npm run generate-avatar
   ```

   Or directly with tsx:
   ```bash
   npx tsx scripts/generate-avatar.ts
   ```

### Method 3: Manual Generation

You can also generate the avatar manually using:

1. **OpenAI DALL-E** (via their web interface or API)
2. **Other AI image generators** like Midjourney, Stable Diffusion, etc.
3. **Professional illustration services**

Just make sure to follow the specifications above and save the result as:
```
public/interviewer-avatar.png
```

## Files Created

- `app/api/avatar/generate/route.ts` - API route for generating avatar (returns URL)
- `app/api/avatar/download/route.ts` - API route for generating and saving avatar
- `components/InterviewerAvatar.tsx` - React component that displays the avatar
- `scripts/generate-avatar.ts` - Standalone script for generating avatar
- `app/interview-coach/InterviewSimulationTab.tsx` - Updated to use the avatar component

## Usage in Code

The avatar is automatically displayed in the Interview Simulation tab. The `InterviewerAvatar` component:

- Loads the avatar from `/interviewer-avatar.png`
- Shows a loading state while loading
- Falls back to a placeholder if the image doesn't exist
- Is optimized using Next.js Image component

## Troubleshooting

### Avatar not appearing

1. **Check if the file exists:**
   ```bash
   ls public/interviewer-avatar.png
   ```

2. **Check the browser console** for any image loading errors

3. **Verify the path** - The avatar should be at `public/interviewer-avatar.png`

### API route errors

1. **Check OpenAI API key** is set in `.env.local`
2. **Check API credits** - DALL-E 3 requires credits in your OpenAI account
3. **Check server logs** for detailed error messages

### Image optimization errors

If you get Next.js Image optimization errors, you can temporarily disable optimization in `next.config.js` or ensure the image file is valid PNG format.

## Customization

To customize the avatar:

1. Modify the prompt in `app/api/avatar/download/route.ts` or `scripts/generate-avatar.ts`
2. Regenerate using one of the methods above
3. The new avatar will automatically replace the old one

## Cost Note

DALL-E 3 image generation costs approximately $0.04 per image (HD quality). Make sure you have credits in your OpenAI account.

## License

Generated images using DALL-E are subject to OpenAI's usage policies. You own the generated content and can use it commercially.

