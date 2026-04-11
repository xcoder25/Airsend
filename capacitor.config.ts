import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orbit.airsend',
  appName: 'Orbit',
  webDir: 'public',
  server: {
    url: 'https://airsend-two.vercel.app',
    cleartext: false
  }
};

export default config;
