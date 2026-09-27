'use client';

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Кроссплатформенный помощник для тактильной отдачи (вибрации).
 * Работает как нативно в Android/iOS через Capacitor, так и в браузере через Navigator API.
 */
export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select' = 'light') => {
  try {
    // 1. Попытка вызвать нативный Capacitor Haptics
    const win = typeof window !== 'undefined' ? (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }) : null;
    if (win?.Capacitor?.isNativePlatform?.()) {
      if (type === 'select') {
        await Haptics.selectionStart();
        return;
      }
      if (type === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
        return;
      }
      if (type === 'warning') {
        await Haptics.notification({ type: NotificationType.Warning });
        return;
      }
      if (type === 'error') {
        await Haptics.notification({ type: NotificationType.Error });
        return;
      }

      const style = type === 'heavy' ? ImpactStyle.Heavy : type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
      await Haptics.impact({ style });
      return;
    }

    // 2. Фоллбэк для веб-браузера (navigator.vibrate)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'success') {
        navigator.vibrate([20, 40, 20]);
      } else if (type === 'error' || type === 'warning') {
        navigator.vibrate([40, 60, 40]);
      } else if (type === 'heavy') {
        navigator.vibrate(30);
      } else {
        navigator.vibrate(15);
      }
    }
  } catch (e) {
    // Если вибрация недоступна на устройстве, тихо игнорируем
    console.debug('Haptics not supported or permitted', e);
  }
};

/**
 * Кроссплатформенная отправка локальных пуш-уведомлений
 */
export const sendLocalPush = async (title: string, body: string, id: number = Math.floor(Math.random() * 100000)) => {
  try {
    // 1. Нативный Capacitor
    const win = typeof window !== 'undefined' ? (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }) : null;
    if (win?.Capacitor?.isNativePlatform?.()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: new Date(Date.now() + 200) },
            sound: undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
      return;
    }

    // 2. Фоллбэк для Web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        const req = await Notification.requestPermission();
        if (req === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      }
    }
  } catch (e) {
    console.debug('Local push notification error', e);
  }
};
