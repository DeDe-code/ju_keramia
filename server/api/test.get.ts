export default defineEventHandler(async () => {
  console.log('Test API endpoint called');

  return {
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  };
});
