import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.photokvest.app',
  appName: 'Фото-Квесты',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true, // Разрешает запросы к http:// серверу (например http://100.102.28.78:4000)
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#5516EA',
    },
  },
};

export default config;
