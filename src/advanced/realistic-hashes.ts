import { createHash } from 'crypto';

/**
 * Generate realistic canvas/WebGL/audio fingerprint hashes
 * that look like real hardware-based fingerprints
 */

/**
 * Generate realistic canvas fingerprint hash
 * Based on platform, GPU, and canvas rendering characteristics
 */
export function generateRealisticCanvasHash(
  platform: string,
  gpu: { vendor: string; renderer: string },
  userAgent: string
): string {
  // Real canvas fingerprints are typically 32-64 character hex strings
  // They're generated from actual canvas rendering output

  // Create a seed from platform-specific characteristics
  const seed = `canvas_${platform}_${gpu.vendor}_${gpu.renderer}_${userAgent}`;

  // Use SHA-256 to generate a realistic hash
  const hash = createHash('sha256').update(seed).digest('hex');

  // Real canvas hashes are often partial hashes (first 32-48 chars)
  // and sometimes include dashes for readability
  const canvasHash = hash.substring(0, 48);

  // Add some variance based on time (but deterministic within session)
  const sessionSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Daily variation
  const variance = createHash('md5')
    .update(`${canvasHash}_${sessionSeed}`)
    .digest('hex')
    .substring(0, 8);

  return `${canvasHash}${variance}`;
}

/**
 * Generate realistic WebGL fingerprint hash
 * Based on GPU vendor, renderer, and WebGL parameters
 */
export function generateRealisticWebGLHash(
  platform: string,
  gpu: { vendor: string; renderer: string },
  userAgent: string
): string {
  // WebGL fingerprints include GPU info, extensions, and parameter values
  // They're typically longer and more detailed than canvas hashes

  const webglParams = [
    gpu.vendor,
    gpu.renderer,
    platform,
    'MAX_TEXTURE_SIZE:16384',
    'MAX_VERTEX_ATTRIBS:16',
    'MAX_VARYING_VECTORS:30',
    'MAX_VERTEX_UNIFORM_VECTORS:4096',
    'MAX_FRAGMENT_UNIFORM_VECTORS:4096',
    'SHADING_LANGUAGE_VERSION:WebGL GLSL ES 1.0',
  ];

  // Add platform-specific WebGL extensions
  if (gpu.vendor.includes('NVIDIA')) {
    webglParams.push('NV_shader_buffer_load', 'NV_vertex_buffer_unified_memory');
  } else if (gpu.vendor.includes('AMD') || gpu.vendor.includes('ATI')) {
    webglParams.push('AMD_performance_monitor', 'AMD_vertex_shader_layer');
  } else if (gpu.vendor.includes('Intel')) {
    webglParams.push('INTEL_performance_query');
  } else if (gpu.vendor.includes('Apple')) {
    webglParams.push('APPLE_clip_distance', 'APPLE_color_buffer_packed_float');
  }

  const seed = webglParams.join('|');
  const hash = createHash('sha256').update(seed).digest('hex');

  // WebGL hashes are often 64 characters (full SHA-256)
  return hash;
}

/**
 * Generate realistic audio fingerprint hash
 * Based on audio context and oscillator characteristics
 */
export function generateRealisticAudioHash(
  platform: string,
  userAgent: string
): string {
  // Audio fingerprints are generated from AudioContext oscillator output
  // They vary based on audio hardware and processing

  // Different platforms have different audio processing characteristics
  let audioSeed = 'audio';

  if (platform === 'Win32') {
    audioSeed += '_Windows_DirectSound_48000Hz_16bit';
  } else if (platform === 'MacIntel') {
    audioSeed += '_macOS_CoreAudio_48000Hz_24bit';
  } else if (platform.includes('Linux')) {
    audioSeed += '_Linux_PulseAudio_48000Hz_16bit';
  }

  // Add browser-specific audio processing
  if (userAgent.includes('Chrome')) {
    audioSeed += '_Chrome_WebAudio';
  } else if (userAgent.includes('Firefox')) {
    audioSeed += '_Firefox_WebAudio';
  } else if (userAgent.includes('Safari')) {
    audioSeed += '_Safari_WebAudio';
  }

  const hash = createHash('sha256').update(audioSeed).digest('hex');

  // Audio hashes are typically 40-48 characters
  const audioHash = hash.substring(0, 40);

  // Add daily variance
  const sessionSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const variance = createHash('md5')
    .update(`${audioHash}_${sessionSeed}`)
    .digest('hex')
    .substring(0, 8);

  return `${audioHash}${variance}`;
}

/**
 * Generate all realistic hashes at once
 */
export function generateRealisticHashes(
  platform: string,
  gpu: { vendor: string; renderer: string },
  userAgent: string
): {
  canvas: string;
  webgl: string;
  audio: string;
} {
  return {
    canvas: generateRealisticCanvasHash(platform, gpu, userAgent),
    webgl: generateRealisticWebGLHash(platform, gpu, userAgent),
    audio: generateRealisticAudioHash(platform, userAgent),
  };
}

/**
 * Validate that hashes look realistic
 */
export function validateHashes(hashes: { canvas: string; webgl: string; audio: string }): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Canvas hash should be 48-64 hex characters
  if (!/^[a-f0-9]{48,64}$/i.test(hashes.canvas)) {
    errors.push(`Canvas hash doesn't look realistic: ${hashes.canvas.substring(0, 20)}...`);
  }

  // WebGL hash should be 64 hex characters (SHA-256)
  if (!/^[a-f0-9]{64}$/i.test(hashes.webgl)) {
    errors.push(`WebGL hash doesn't look realistic: ${hashes.webgl.substring(0, 20)}...`);
  }

  // Audio hash should be 40-48 hex characters
  if (!/^[a-f0-9]{40,48}$/i.test(hashes.audio)) {
    errors.push(`Audio hash doesn't look realistic: ${hashes.audio.substring(0, 20)}...`);
  }

  // Hashes should all be different
  if (hashes.canvas === hashes.webgl || hashes.canvas === hashes.audio || hashes.webgl === hashes.audio) {
    errors.push('Hashes should be unique from each other');
  }

  // Hashes should be lowercase hex
  if (hashes.canvas !== hashes.canvas.toLowerCase()) {
    errors.push('Canvas hash should be lowercase');
  }

  if (hashes.webgl !== hashes.webgl.toLowerCase()) {
    errors.push('WebGL hash should be lowercase');
  }

  if (hashes.audio !== hashes.audio.toLowerCase()) {
    errors.push('Audio hash should be lowercase');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get example hashes for different platforms
 */
export function getExampleHashes(): string {
  const examples = [
    {
      platform: 'Win32',
      gpu: { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3080' },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    {
      platform: 'MacIntel',
      gpu: { vendor: 'Apple', renderer: 'Apple M1 Pro' },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    {
      platform: 'Linux x86_64',
      gpu: { vendor: 'AMD', renderer: 'AMD Radeon RX 6800' },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    },
  ];

  const output: string[] = ['Realistic Hash Examples:', ''];

  examples.forEach((example) => {
    output.push(`Platform: ${example.platform}`);
    output.push(`GPU: ${example.gpu.vendor} - ${example.gpu.renderer}`);

    const hashes = generateRealisticHashes(example.platform, example.gpu, example.userAgent);

    output.push(`Canvas:  ${hashes.canvas.substring(0, 48)}...`);
    output.push(`WebGL:   ${hashes.webgl}`);
    output.push(`Audio:   ${hashes.audio.substring(0, 48)}...`);
    output.push('');
  });

  output.push('Features:');
  output.push('  - SHA-256 based hash generation');
  output.push('  - Platform-specific seeding');
  output.push('  - GPU vendor/renderer correlation');
  output.push('  - Realistic hash lengths (40-64 chars)');
  output.push('  - Daily variance for uniqueness');
  output.push('  - Deterministic within session');
  output.push('  - WebGL extension correlation');
  output.push('  - Audio hardware correlation');

  return output.join('\n');
}
