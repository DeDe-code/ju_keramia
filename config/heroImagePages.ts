/**
 * Hero Image Pages Configuration
 *
 * Centralized configuration for hero image management across different pages.
 * Defines page types, upload requirements, and navigation structure.
 */

export type HeroImagePageType = 'landing' | 'about';

/**
 * Hero image page definition
 */
export interface HeroImagePage {
  /** Unique identifier for the page */
  id: HeroImagePageType;
  /** Display label for navigation */
  label: string;
  /** Heroicon name for visual identification */
  icon: string;
  /** Short description of the page's hero image */
  description: string;
  /** Route path (used for navigation menu pattern) */
  path?: string;
}

/**
 * Available hero image pages configuration
 * Add new page types here to automatically include them in the UI
 */
export const HERO_IMAGE_PAGES: HeroImagePage[] = [
  {
    id: 'landing',
    label: 'Landing Page',
    icon: 'i-heroicons-home',
    description: 'Main homepage hero image - first impression for visitors',
    path: '/admin/hero-images/landing',
  },
  {
    id: 'about',
    label: 'About Page',
    icon: 'i-heroicons-information-circle',
    description: 'About page hero image - showcasing your story',
    path: '/admin/hero-images/about',
  },
];

/**
 * Shared hero image upload configuration
 * All hero images should follow these requirements
 */
export const HERO_IMAGE_CONFIG = {
  /** Maximum file size in megabytes */
  maxSizeMB: 10,
  /** Recommended image width in pixels */
  requiredWidth: 1920,
  /** Recommended image height in pixels */
  requiredHeight: 1080,
  /** Accepted MIME types for uploads */
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'] as const,
  /** Image type identifier for storage */
  imageType: 'hero' as const,
} as const;

/**
 * Get page configuration by ID
 */
export const getHeroImagePage = (id: HeroImagePageType): HeroImagePage | undefined => {
  return HERO_IMAGE_PAGES.find((page) => page.id === id);
};

/**
 * Get page label by ID
 */
export const getHeroImagePageLabel = (id: HeroImagePageType): string => {
  return getHeroImagePage(id)?.label || '';
};
