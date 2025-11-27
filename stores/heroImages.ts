/**
 * Hero Images Store - Centralized Hero Image Management
 *
 * Manages hero images for different pages with smart caching and optimistic updates.
 * Replaces useHeroImages.ts composable with centralized state management.
 *
 * Features:
 * - Smart caching (5-minute TTL)
 * - Map-based storage for O(1) lookups
 * - Global cache invalidation
 * - Force refresh capability
 * - SSR-compatible
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useSupabase } from '../composables/useSupabase';
import type { HeroImageRow } from '../types/admin';
import type { HeroImagePageType } from '../config/heroImagePages';

/**
 * Hero Images Store
 * Centralized management of hero images with smart caching
 */
export const useHeroImagesStore = defineStore('heroImages', () => {
  // ============================================
  // STATE
  // ============================================

  const images = ref<Map<HeroImagePageType, HeroImageRow>>(new Map());
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<Date | null>(null);
  const cacheTTL = ref(5 * 60 * 1000); // 5 minutes

  // ============================================
  // GETTERS
  // ============================================

  /**
   * Get landing page hero image
   */
  const landingImage = computed<HeroImageRow | null>(() => {
    return images.value.get('landing') || null;
  });

  /**
   * Get about page hero image
   */
  const aboutImage = computed<HeroImageRow | null>(() => {
    return images.value.get('about') || null;
  });

  /**
   * Check if any images are loaded
   */
  const hasImages = computed<boolean>(() => {
    return images.value.size > 0;
  });

  /**
   * Check if cache is stale (older than TTL)
   */
  const isStale = computed<boolean>(() => {
    if (!lastFetch.value) return true;
    return Date.now() - lastFetch.value.getTime() > cacheTTL.value;
  });

  /**
   * Get all images count
   */
  const imagesCount = computed<number>(() => {
    return images.value.size;
  });

  // ============================================
  // HELPER: Toast Notifications
  // ============================================

  function showToast(
    title: string,
    description: string,
    color: 'success' | 'error' | 'warning' = 'success'
  ) {
    if (!import.meta.client) return;
    // @ts-expect-error - useToast is auto-imported by Nuxt UI
    const toast = globalThis.useToast();
    if (toast) {
      toast.add({ title, description, color });
    }
  }

  // ============================================
  // METHODS: Image Retrieval
  // ============================================

  /**
   * Get hero image by page type
   * @param pageType - The page type ('landing' or 'about')
   * @returns Hero image data or null if not found
   */
  function getImage(pageType: HeroImagePageType): HeroImageRow | null {
    return images.value.get(pageType) || null;
  }

  // ============================================
  // METHODS: Fetch Operations
  // ============================================

  /**
   * Fetch hero images with smart caching
   * Skips fetch if cache is fresh unless force=true
   *
   * @param force - Force fetch even if cache is fresh
   */
  async function fetchHeroImages(force = false): Promise<void> {
    // Smart caching: skip fetch if cache is fresh
    if (!force && !isStale.value && hasImages.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const supabase = useSupabase();

      const { data, error: fetchError } = await supabase
        .from('hero_images')
        .select('*')
        .in('page_type', ['landing', 'about']);

      if (fetchError) throw fetchError;

      // Clear existing images and populate with fresh data
      images.value.clear();
      data?.forEach((img) => {
        images.value.set(img.page_type as HeroImagePageType, img);
      });

      lastFetch.value = new Date();

      if (import.meta.client && data && data.length > 0) {
        showToast('Success', `Loaded ${data.length} hero image(s)`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load hero images';
      error.value = errorMsg;

      if (import.meta.client) {
        showToast('Error', errorMsg, 'error');
      }

      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Force refresh from database (ignores cache)
   * Use after upload/delete operations
   */
  async function refreshImages(): Promise<void> {
    return fetchHeroImages(true);
  }

  // ============================================
  // METHODS: Cache Management
  // ============================================

  /**
   * Invalidate cache and refetch
   * Useful for external updates (e.g., after image upload)
   */
  async function invalidate(): Promise<void> {
    lastFetch.value = null;
    return fetchHeroImages(true);
  }

  /**
   * Clear all images and reset state
   * Useful for logout or testing
   */
  function clear(): void {
    images.value.clear();
    error.value = null;
    lastFetch.value = null;
    loading.value = false;
  }

  /**
   * Update cache TTL (time-to-live)
   * @param ttl - New TTL in milliseconds
   */
  function setCacheTTL(ttl: number): void {
    if (ttl > 0) {
      cacheTTL.value = ttl;
    }
  }

  /**
   * Check if specific page has image loaded
   * @param pageType - The page type to check
   */
  function hasImage(pageType: HeroImagePageType): boolean {
    return images.value.has(pageType);
  }

  // ============================================
  // METHODS: Optimistic Updates
  // ============================================

  /**
   * Optimistically update a hero image
   * Updates UI immediately, then syncs with database
   *
   * @param pageType - Page type to update
   * @param imageData - New image data
   */
  function updateImageOptimistic(
    pageType: HeroImagePageType,
    imageData: Partial<HeroImageRow>
  ): void {
    const existingImage = images.value.get(pageType);

    if (existingImage) {
      images.value.set(pageType, {
        ...existingImage,
        ...imageData,
        updated_at: new Date().toISOString(),
      } as HeroImageRow);
    }
  }

  /**
   * Rollback optimistic update
   * Used when database sync fails
   *
   * @param pageType - Page type to rollback
   * @param originalData - Original image data before update
   */
  function rollbackUpdate(pageType: HeroImagePageType, originalData: HeroImageRow): void {
    images.value.set(pageType, originalData);
  }

  // Return everything
  return {
    // State
    images,
    loading,
    error,
    lastFetch,
    cacheTTL,

    // Getters
    landingImage,
    aboutImage,
    hasImages,
    isStale,
    imagesCount,

    // Methods
    getImage,
    fetchHeroImages,
    refreshImages,
    invalidate,
    clear,
    setCacheTTL,
    hasImage,
    updateImageOptimistic,
    rollbackUpdate,
  };
});
