/**
 * プッシュ通知を管理するユーティリティ
 */

// サービスワーカーの登録
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('このブラウザはService Workerをサポートしていません');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker登録成功:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker登録エラー:', error);
    return null;
  }
};

// VAPID公開キーの取得
export const getVapidPublicKey = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/push/vapid-public-key');
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('VAPID公開キー取得エラー:', error);
    return null;
  }
};

// プッシュ通知の購読
export const subscribeToPushNotifications = async (userId: string): Promise<boolean> => {
  if (!('PushManager' in window)) {
    console.warn('このブラウザはプッシュ通知をサポートしていません');
    return false;
  }

  try {
    // サービスワーカーの登録
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // 既存の購読情報を確認
    let subscription = await registration.pushManager.getSubscription();
    
    // 既存の購読がない場合は新規作成
    if (!subscription) {
      // VAPID公開キーの取得
      const publicKey = await getVapidPublicKey();
      if (!publicKey) return false;

      // 公開キーをUint8Arrayに変換
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      
      // 購読の作成
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // サーバーに購読情報を送信
    const response = await fetch(`/api/push/subscribe?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error('購読情報の送信に失敗しました');
    }

    console.log('プッシュ通知の購読が完了しました');
    return true;
  } catch (error) {
    console.error('プッシュ通知購読エラー:', error);
    return false;
  }
};

// プッシュ通知の購読解除
export const unsubscribeFromPushNotifications = async (userId: string): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    // サービスワーカーの取得
    const registration = await navigator.serviceWorker.ready;
    
    // 購読情報の取得
    const subscription = await registration.pushManager.getSubscription();
    
    // 購読情報がある場合は解除
    if (subscription) {
      // サーバーに購読解除を通知
      await fetch(`/api/push/unsubscribe?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      
      // ブラウザ側の購読も解除
      await subscription.unsubscribe();
      console.log('プッシュ通知の購読を解除しました');
    }
    
    return true;
  } catch (error) {
    console.error('プッシュ通知購読解除エラー:', error);
    return false;
  }
};

// 管理者に承認待ちユーザーの通知を送信
export const notifyAdminAboutPendingUser = async (
  adminId: string,
  userName: string,
  userEmail: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/push/notify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminId,
        userName,
        userEmail
      })
    });

    if (!response.ok) {
      throw new Error('管理者への通知送信に失敗しました');
    }

    return true;
  } catch (error) {
    console.error('管理者通知エラー:', error);
    return false;
  }
};

// Base64文字列をUint8Arrayに変換するユーティリティ関数
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
} 