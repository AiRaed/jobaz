import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Bucket name for TTS audio cache
const TTS_BUCKET_NAME = process.env.TTS_BUCKET_NAME || 'tts-cache'

/**
 * TTS API Route
 * 
 * Generates text-to-speech audio using ElevenLabs and caches results in Supabase Storage.
 * Returns a public URL to the cached audio file.
 * 
 * Request body:
 * - text: string (required) - Text to convert to speech
 * - voiceId?: string (optional) - ElevenLabs voice ID, defaults to ELEVENLABS_VOICE_ID env var
 * - locale?: string (optional) - Locale code
 * - mode?: string (optional) - Mode identifier (e.g., "interview-coach")
 * 
 * Response:
 * - { url: string } - Public URL to the cached audio file
 * - { error: string } - Error message on failure
 */

/**
 * Ensures the TTS cache bucket exists in Supabase Storage.
 * Creates it if it doesn't exist.
 */
async function ensureTtsBucketExists() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check if bucket exists
    const { data, error } = await supabase.storage.getBucket(TTS_BUCKET_NAME)
    
    // If bucket exists, return early
    if (data && !error) {
      return
    }
    
    // If error exists and it's not a 404 (not found), log and return
    if (error) {
      const errorStatus = (error as any).statusCode
      const errorMessage = error.message || String(error)
      
      // Only proceed to create if it's a 404 (bucket not found)
      if (errorStatus !== 404 && !errorMessage.includes('not found') && !errorMessage.includes('Bucket not found')) {
        console.error('[TTS] Error checking bucket', error)
        return
      }
    }
    
    // Bucket doesn't exist, create it
    const { error: createError } = await supabase.storage.createBucket(TTS_BUCKET_NAME, {
      public: true,
    })
    
    if (createError) {
      console.error('[TTS] Failed to create bucket', createError)
    } else {
      console.log('[TTS] Created bucket', TTS_BUCKET_NAME)
    }
  } catch (error) {
    // Catch any unexpected errors and log them without crashing
    console.error('[TTS] Unexpected error in ensureTtsBucketExists', error)
  }
}
export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY

    if (!elevenLabsApiKey) {
      console.error('[TTS] Missing ELEVENLABS_API_KEY')
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY is not configured' },
        { status: 500 }
      )
    }

    if (!supabaseUrl) {
      console.error('[TTS] Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' },
        { status: 500 }
      )
    }

    if (!supabaseServiceRoleKey) {
      console.error('[TTS] Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { text, voiceId, locale, mode } = body

    // Validate required fields
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Use default voice ID if not provided
    const finalVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID
    if (!finalVoiceId) {
      return NextResponse.json(
        { error: 'Voice ID is required (provide voiceId in request or set ELEVENLABS_VOICE_ID env var)' },
        { status: 400 }
      )
    }

    // Generate cache key from request parameters
    const cacheKeyString = `${text.trim()}|${finalVoiceId}|${locale || ''}|${mode || ''}`
    const hash = createHash('sha1').update(cacheKeyString).digest('hex')
    const fileName = `${hash}.mp3`
    // File path in the tts-cache bucket
    const filePath = fileName

    // Log minimal info for debugging (not the full text)
    console.log('[TTS] Cache key generated', {
      hash,
      textLength: text.length,
      voiceId: finalVoiceId,
      locale: locale || 'default',
      mode: mode || 'default',
    })

    // Create server-side Supabase client
    const supabase = createServerSupabaseClient()

    // Ensure bucket exists before checking for cached file
    await ensureTtsBucketExists()

    // Check if file already exists in Supabase Storage by trying to download it
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(TTS_BUCKET_NAME)
      .download(filePath)

    if (fileData && !downloadError) {
      // File exists, return public URL
      const { data: publicUrlData } = supabase.storage
        .from(TTS_BUCKET_NAME)
        .getPublicUrl(filePath)

      console.log('[TTS] Cache hit', { hash })
      return NextResponse.json({
        url: publicUrlData.publicUrl,
      })
    }

    // If downloadError is not a "file not found" error, log it but continue to generation
    if (downloadError && downloadError.message !== 'The resource was not found') {
      console.warn('[TTS] Storage check warning (continuing to generate)', {
        error: downloadError.message,
      })
    }

    // File doesn't exist, generate new audio using ElevenLabs
    console.log('[TTS] Cache miss, generating audio', { hash, textLength: text.length })

    // Call ElevenLabs TTS API
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`
    
    const elevenLabsResponse = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_multilingual_v2', // Good general English TTS model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('[TTS] ElevenLabs API error', {
        status: elevenLabsResponse.status,
        statusText: elevenLabsResponse.statusText,
        error: errorText.substring(0, 200), // Log first 200 chars
      })
      return NextResponse.json(
        { error: 'Failed to generate audio from ElevenLabs' },
        { status: 500 }
      )
    }

    // Get audio buffer
    const audioArrayBuffer = await elevenLabsResponse.arrayBuffer()
    const audioBuffer = Buffer.from(audioArrayBuffer)

    // Ensure bucket exists before uploading
    await ensureTtsBucketExists()

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(TTS_BUCKET_NAME)
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false, // Don't overwrite if it somehow exists
      })

    if (uploadError) {
      console.error('[TTS] Supabase upload error', uploadError)
      return NextResponse.json(
        { error: 'Failed to store TTS audio' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(TTS_BUCKET_NAME)
      .getPublicUrl(filePath)

    console.log('[TTS] Audio generated and cached', { hash, url: publicUrlData.publicUrl })

    return NextResponse.json({
      url: publicUrlData.publicUrl,
    })
  } catch (error: any) {
    console.error('[TTS] Unexpected error', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process TTS request' },
      { status: 500 }
    )
  }
}

