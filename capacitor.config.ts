import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orbit.airsend',
  appName: 'Orbit',
  webDir: 'public',
  server: {
    url: 'http://10.79.206.183:3000',
    cleartext: true
  }
};

export default config;
