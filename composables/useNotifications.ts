/**
 * Notification Composable
 *
 * Centralized toast notification system for consistent messaging across the app.
 * Wraps Nuxt UI's useToast with predefined patterns and timeouts.
 */

export const useNotifications = () => {
  const toast = useToast();

  /**
   * Display success notification
   */
  const notifySuccess = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'success',
    });
  };

  /**
   * Display error notification
   */
  const notifyError = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'error',
    });
  };

  /**
   * Display info notification
   */
  const notifyInfo = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'info',
    });
  };

  /**
   * Display warning notification
   */
  const notifyWarning = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'warning',
    });
  };

  /**
   * Specialized: Upload success notification
   */
  const notifyUploadSuccess = (pageType: string) => {
    const formattedType = pageType.charAt(0).toUpperCase() + pageType.slice(1);
    notifySuccess('Upload Successful', `${formattedType} page hero image updated successfully`);
  };

  /**
   * Specialized: Upload error notification
   */
  const notifyUploadError = (error: string) => {
    notifyError('Upload Failed', error);
  };

  /**
   * Specialized: Data fetch error notification
   */
  const notifyFetchError = (resource: string, error?: string) => {
    notifyError(`Failed to Load ${resource}`, error || 'An unexpected error occurred');
  };

  return {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    notifyUploadSuccess,
    notifyUploadError,
    notifyFetchError,
  };
};
