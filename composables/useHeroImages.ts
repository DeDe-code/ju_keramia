/**
 * Hero images data management composable with 5-minute smart caching.
 * Fetches and caches hero images from Supabase, reducing redundant API calls.
 *
 * @example
 * const { landingImage, loading, fetchHeroImages, refreshImages } = useHeroImages({
 *   onError: (err) => toast.error(err),
 *   onSuccess: (msg) => toast.success(msg),
 * });
 *
 * await fetchHeroImages(); // Uses cache if fresh
 * await refreshImages();   // Force refresh after upload
 */

import { ref, computed } from 'vue';
import { useSupabase } from './useSupabase';
import type { Database } from '~~/types/supabase';
import type { HeroImagePageType } from '~~/config/heroImagePages';

type HeroImage = Database['public']['Tables']['hero_images']['Row'];

interface UseHeroImagesOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const useHeroImages = (options: UseHeroImagesOptions = {}) => {
  // State
  const images = ref<Map<HeroImagePageType, HeroImage>>(new Map());
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<Date | null>(null);

  // Computed
  const landingImage = computed(() => images.value.get('landing') || null);
  const aboutImage = computed(() => images.value.get('about') || null);
  const hasImages = computed(() => images.value.size > 0);

  // Cache is stale if older than 5 minutes
  const isStale = computed(() => {
    if (!lastFetch.value) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastFetch.value.getTime() > fiveMinutes;
  });

  const getImage = (pageType: HeroImagePageType): HeroImage | null => {
    return images.value.get(pageType) || null;
  };

  /**
   * Fetch hero images with smart caching.
   * Skips fetch if cache is fresh unless force=true.
   */
  const fetchHeroImages = async (force = false): Promise<void> => {
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

      images.value.clear();
      data?.forEach((img) => {
        images.value.set(img.page_type as HeroImagePageType, img);
      });

      lastFetch.value = new Date();
      options.onSuccess?.('Hero images loaded successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load hero images';
      error.value = errorMsg;
      options.onError?.(errorMsg);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Force refresh from database (ignores cache).
   * Use after upload/delete operations.
   */
  const refreshImages = async (): Promise<void> => {
    await fetchHeroImages(true);
  };

  /**
   * Invalidate cache and refetch.
   * Useful for external updates (e.g., WebSocket events).
   */
  const invalidate = (): Promise<void> => {
    lastFetch.value = null;
    return fetchHeroImages(true);
  };

  const clear = () => {
    images.value.clear();
    error.value = null;
    lastFetch.value = null;
  };

  return {
    // State
    images,
    landingImage,
    aboutImage,
    loading,
    error,
    hasImages,
    isStale,

    // Methods
    getImage,
    fetchHeroImages,
    refreshImages,
    invalidate,
    clear,
  };
};
