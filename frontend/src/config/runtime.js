import '../../app-config.js';
export const getAppConfig = () => window.APP_CONFIG || {};
export function getApiBase() {
  const config = getAppConfig();
  const url = String(config.PAYLOAD_URL || 'http://localhost:3001').replace(/\/$/, '');
  const prefix = String(config.PAYLOAD_API_PREFIX || '/api');
  return `${url}${prefix.startsWith('/') ? prefix : `/${prefix}`}`;
}
