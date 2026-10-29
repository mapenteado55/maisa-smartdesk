export default {
  fetch() {
    return Response.json({
      status: 'ok',
      service: 'maisa-smartdesk-api',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  },
};
