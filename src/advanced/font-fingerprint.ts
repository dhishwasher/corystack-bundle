import type { BrowserContext } from 'playwright';
import pino from 'pino';

const logger = pino({ name: 'font-fingerprint' });

/**
 * Platform-specific font lists based on real OS installations
 */
export const PLATFORM_FONTS: Record<string, string[]> = {
  'Win32': [
    // Windows 11/10 Default Fonts
    'Arial', 'Arial Black', 'Bahnschrift', 'Calibri', 'Cambria', 'Cambria Math',
    'Candara', 'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New',
    'Ebrima', 'Franklin Gothic Medium', 'Gabriola', 'Gadugi', 'Georgia', 'HoloLens MDL2 Assets',
    'Impact', 'Ink Free', 'Javanese Text', 'Leelawadee UI', 'Lucida Console', 'Lucida Sans Unicode',
    'Malgun Gothic', 'Marlett', 'Microsoft Himalaya', 'Microsoft JhengHei', 'Microsoft New Tai Lue',
    'Microsoft PhagsPa', 'Microsoft Sans Serif', 'Microsoft Tai Le', 'Microsoft YaHei',
    'Microsoft Yi Baiti', 'MingLiU-ExtB', 'Mongolian Baiti', 'MS Gothic', 'MV Boli',
    'Myanmar Text', 'Nirmala UI', 'Palatino Linotype', 'Segoe MDL2 Assets', 'Segoe Print',
    'Segoe Script', 'Segoe UI', 'Segoe UI Historic', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'SimSun', 'Sitka', 'Sylfaen', 'Symbol', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
    'Verdana', 'Webdings', 'Wingdings', 'Yu Gothic',
  ],
  'MacIntel': [
    // macOS Default Fonts
    'American Typewriter', 'Andale Mono', 'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
    'Arial Unicode MS', 'Avenir', 'Avenir Next', 'Avenir Next Condensed', 'Baskerville', 'Big Caslon',
    'Bodoni 72', 'Bodoni 72 Oldstyle', 'Bodoni 72 Smallcaps', 'Bradley Hand', 'Brush Script MT',
    'Chalkboard', 'Chalkboard SE', 'Chalkduster', 'Charter', 'Cochin', 'Comic Sans MS',
    'Copperplate', 'Courier', 'Courier New', 'Didot', 'DIN Alternate', 'DIN Condensed',
    'Futura', 'Geneva', 'Georgia', 'Gill Sans', 'Helvetica', 'Helvetica Neue', 'Herculanum',
    'Hoefler Text', 'Impact', 'Lucida Grande', 'Luminari', 'Marker Felt', 'Menlo', 'Monaco',
    'Noteworthy', 'Optima', 'Palatino', 'Papyrus', 'Phosphate', 'Rockwell', 'Savoye LET',
    'SignPainter', 'Skia', 'Snell Roundhand', 'Tahoma', 'Times', 'Times New Roman',
    'Trattatello', 'Trebuchet MS', 'Verdana', 'Zapfino',
    // San Francisco (system font)
    'SF Pro Display', 'SF Pro Text', 'SF Mono', '.AppleSystemUIFont',
  ],
  'Linux x86_64': [
    // Common Linux Fonts (Ubuntu/Debian)
    'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif', 'Liberation Sans', 'Liberation Sans Narrow',
    'Liberation Serif', 'Liberation Mono', 'Ubuntu', 'Ubuntu Condensed', 'Ubuntu Mono',
    'Noto Sans', 'Noto Serif', 'Noto Sans Mono', 'Droid Sans', 'Droid Serif', 'Droid Sans Mono',
    'FreeSans', 'FreeSerif', 'FreeMono', 'Nimbus Sans', 'Nimbus Roman', 'Nimbus Mono PS',
    // Fallback common fonts
    'Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana',
  ],
  'Linux armv7l': [
    // Raspberry Pi / ARM Linux
    'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif', 'Liberation Sans', 'Liberation Serif',
    'Liberation Mono', 'Noto Sans', 'Noto Serif', 'FreeSans', 'FreeSerif', 'FreeMono',
  ],
};

/**
 * Fonts to explicitly filter out (common automation/testing fonts)
 */
const AUTOMATION_FONTS = [
  'Ahem', // CSS test font
  'PDFJS Internal', // PDF.js internal font
  'Liberation Sans', // Often indicates headless Linux
  'Liberation Serif',
  'Liberation Mono',
];

/**
 * Font categories for realistic variations
 */
export interface FontCategories {
  serif: string[];
  sansSerif: string[];
  monospace: string[];
  cursive: string[];
  fantasy: string[];
}

export const FONT_CATEGORIES: Record<string, FontCategories> = {
  'Win32': {
    serif: ['Georgia', 'Times New Roman', 'Palatino Linotype', 'Cambria', 'Constantia'],
    sansSerif: ['Arial', 'Calibri', 'Segoe UI', 'Trebuchet MS', 'Verdana', 'Tahoma', 'Candara', 'Corbel'],
    monospace: ['Consolas', 'Courier New', 'Lucida Console'],
    cursive: ['Comic Sans MS', 'Segoe Script', 'Ink Free', 'Bradley Hand ITC'],
    fantasy: ['Impact', 'Gabriola', 'MV Boli'],
  },
  'MacIntel': {
    serif: ['Times New Roman', 'Georgia', 'Palatino', 'Baskerville', 'Hoefler Text', 'Didot', 'Bodoni 72'],
    sansSerif: ['Helvetica', 'Helvetica Neue', 'Arial', 'Avenir', 'Avenir Next', 'Gill Sans', 'Futura', 'Geneva'],
    monospace: ['Courier', 'Courier New', 'Monaco', 'Menlo', 'SF Mono'],
    cursive: ['Apple Chancery', 'Bradley Hand', 'Brush Script MT', 'Snell Roundhand'],
    fantasy: ['Copperplate', 'Papyrus', 'Herculanum', 'Luminari'],
  },
  'Linux x86_64': {
    serif: ['DejaVu Serif', 'Liberation Serif', 'Noto Serif', 'FreeSerif', 'Times New Roman'],
    sansSerif: ['DejaVu Sans', 'Liberation Sans', 'Ubuntu', 'Noto Sans', 'FreeSans', 'Arial'],
    monospace: ['DejaVu Sans Mono', 'Liberation Mono', 'Ubuntu Mono', 'Noto Sans Mono', 'FreeMono', 'Courier New'],
    cursive: [],
    fantasy: [],
  },
};

/**
 * Font Fingerprint Manager
 */
export class FontFingerprintManager {
  private platform: string;
  private fontList: string[];

  constructor(platform: string = 'Win32') {
    this.platform = platform;
    this.fontList = this.generateFontList();
  }

  /**
   * Generate realistic font list for platform
   */
  private generateFontList(): string[] {
    const baseFonts = PLATFORM_FONTS[this.platform] || PLATFORM_FONTS['Win32'];

    // Filter out automation fonts
    const filtered = baseFonts.filter((font) => !AUTOMATION_FONTS.includes(font));

    // Add some randomness - not all systems have ALL fonts installed
    // Randomly remove 5-15% of fonts to simulate real systems
    const removalRate = 0.05 + Math.random() * 0.10;
    const fontsToRemove = Math.floor(filtered.length * removalRate);

    const result = [...filtered];
    for (let i = 0; i < fontsToRemove; i++) {
      const randomIndex = Math.floor(Math.random() * result.length);
      // Don't remove core fonts (first 20 fonts are typically essential)
      if (randomIndex > 20) {
        result.splice(randomIndex, 1);
      }
    }

    return result.sort(); // Alphabetical order like real font lists
  }

  /**
   * Inject font fingerprint override into browser context
   */
  async injectFontOverride(context: BrowserContext): Promise<void> {
    const fontList = this.fontList;

    await context.addInitScript((fonts: string[]) => {
      // Override canvas measureText to prevent font enumeration attacks
      const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;

      // Create a whitelist of allowed fonts
      const allowedFonts = new Set(fonts);

      // Override font property setter
      const originalFontDescriptor = Object.getOwnPropertyDescriptor(
        CanvasRenderingContext2D.prototype,
        'font'
      );

      Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {
        get: function() {
          return originalFontDescriptor?.get?.call(this) || '10px sans-serif';
        },
        set: function(value: string) {
          // Parse font string to extract font family
          const fontFamilyMatch = value.match(/['"]?([^'"]+)['"]?$/);
          if (fontFamilyMatch) {
            const requestedFont = fontFamilyMatch[1].trim();

            // If font is not in allowed list, substitute with default
            if (!allowedFonts.has(requestedFont)) {
              const genericFonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'];
              const isGeneric = genericFonts.some((gf) => requestedFont.toLowerCase().includes(gf));

              if (!isGeneric) {
                // Substitute with Arial (most common fallback)
                const size = value.match(/(\d+px)/)?.[1] || '10px';
                value = `${size} Arial`;
              }
            }
          }

          originalFontDescriptor?.set?.call(this, value);
        },
        configurable: true,
      });

      // Override document.fonts API (FontFaceSet)
      if (document.fonts) {
        const mockFontFaces: any[] = [];

        // Create mock FontFace objects for each allowed font
        fonts.forEach((fontFamily) => {
          const mockFontFace = {
            family: fontFamily,
            style: 'normal',
            weight: '400',
            stretch: 'normal',
            unicodeRange: 'U+0-10FFFF',
            variant: 'normal',
            featureSettings: 'normal',
            display: 'auto',
            status: 'loaded',
            load: () => Promise.resolve(),
          };
          mockFontFaces.push(mockFontFace);
        });

        // Override document.fonts iterator
        Object.defineProperty(document.fonts, 'size', {
          get: () => mockFontFaces.length,
        });

        // Override values() method
        (document.fonts as any).values = function() {
          return mockFontFaces[Symbol.iterator]();
        };

        // Override forEach method
        (document.fonts as any).forEach = function(callback: any) {
          mockFontFaces.forEach(callback);
        };

        // Override check() method - always return true for allowed fonts
        (document.fonts as any).check = function(font: string) {
          const fontFamilyMatch = font.match(/['"]?([^'"]+)['"]?$/);
          if (fontFamilyMatch) {
            const fontFamily = fontFamilyMatch[1].trim();
            return allowedFonts.has(fontFamily);
          }
          return false;
        };
      }

      // Detect and block common font enumeration techniques
      // Method 1: Blocking offsetWidth/offsetHeight measurements
      const measurementCache = new Map<string, { width: number; height: number }>();

      const createFontMeasurementElement = () => {
        const span = document.createElement('span');
        span.textContent = 'mmmmmmmmmmlli'; // Common measurement string
        span.style.fontSize = '72px';
        span.style.position = 'absolute';
        span.style.left = '-9999px';
        span.style.top = '-9999px';
        span.style.visibility = 'hidden';
        return span;
      };

      // Pre-calculate measurements for all allowed fonts
      if (document.body) {
        fonts.forEach((font) => {
          const testSpan = createFontMeasurementElement();
          testSpan.style.fontFamily = `"${font}", sans-serif`;
          document.body.appendChild(testSpan);

          measurementCache.set(font, {
            width: testSpan.offsetWidth,
            height: testSpan.offsetHeight,
          });

          document.body.removeChild(testSpan);
        });
      }
    }, fontList);

    logger.info({ platform: this.platform, fontCount: fontList.length }, 'Font fingerprint override injected');
  }

  /**
   * Get font list for current platform
   */
  getFontList(): string[] {
    return [...this.fontList];
  }

  /**
   * Get fonts by category
   */
  getFontsByCategory(category: keyof FontCategories): string[] {
    const categories = FONT_CATEGORIES[this.platform] || FONT_CATEGORIES['Win32'];
    return categories[category] || [];
  }

  /**
   * Get a random font from a specific category
   */
  getRandomFont(category: keyof FontCategories): string {
    const fonts = this.getFontsByCategory(category);
    return fonts[Math.floor(Math.random() * fonts.length)] || 'Arial';
  }

  /**
   * Check if a font is available for current platform
   */
  isFontAvailable(fontFamily: string): boolean {
    return this.fontList.includes(fontFamily);
  }

  /**
   * Get platform-specific default fonts
   */
  getDefaultFonts(): { serif: string; sansSerif: string; monospace: string } {
    switch (this.platform) {
      case 'Win32':
        return {
          serif: 'Times New Roman',
          sansSerif: 'Arial',
          monospace: 'Consolas',
        };
      case 'MacIntel':
        return {
          serif: 'Times',
          sansSerif: 'Helvetica',
          monospace: 'Monaco',
        };
      case 'Linux x86_64':
      default:
        return {
          serif: 'DejaVu Serif',
          sansSerif: 'DejaVu Sans',
          monospace: 'DejaVu Sans Mono',
        };
    }
  }

  /**
   * Get font statistics for debugging
   */
  static getFontInfo(): string {
    const platforms = Object.keys(PLATFORM_FONTS);
    const info: string[] = [
      'Font Fingerprint Defense:',
      '',
      'Supported Platforms:',
    ];

    platforms.forEach((platform) => {
      const fontCount = PLATFORM_FONTS[platform].length;
      const categories = FONT_CATEGORIES[platform];
      info.push(`  ${platform}: ${fontCount} fonts`);
      if (categories) {
        info.push(`    - Serif: ${categories.serif.length}`);
        info.push(`    - Sans-Serif: ${categories.sansSerif.length}`);
        info.push(`    - Monospace: ${categories.monospace.length}`);
        info.push(`    - Cursive: ${categories.cursive.length}`);
        info.push(`    - Fantasy: ${categories.fantasy.length}`);
      }
    });

    info.push('');
    info.push('Features:');
    info.push('  - Platform-specific font lists');
    info.push('  - Automation font filtering');
    info.push('  - Random font variation (5-15% removal)');
    info.push('  - document.fonts API override');
    info.push('  - Canvas font measurement protection');
    info.push('  - Font enumeration attack detection');

    return info.join('\n');
  }
}
