// サービスワーカーのバージョン
const SW_VERSION = '1.0.0';

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log(`Service Worker (v${SW_VERSION}) インストール中...`);
  self.skipWaiting();
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log(`Service Worker (v${SW_VERSION}) アクティベート中...`);
  return self.clients.claim();
});

// プッシュ通知受信時の処理
self.addEventListener('push', (event) => {
  console.log('プッシュ通知を受信しました', event);

  if (!event.data) {
    console.warn('プッシュイベントにデータがありません');
    return;
  }

  try {
    // 通知データの解析
    const data = event.data.json();
    const title = data.title || 'Wado Team Scheduler';
    const options = {
      body: data.body || '新しい通知があります',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data || {},
      vibrate: [100, 50, 100],
      timestamp: Date.now()
    };

    // 通知の表示
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('プッシュ通知の処理中にエラーが発生しました:', error);
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('通知がクリックされました', event);

  // 通知を閉じる
  event.notification.close();

  // カスタムデータの取得
  const data = event.notification.data || {};
  const url = data.url || '/';

  // クライアントウィンドウを開く
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 既存のウィンドウがあれば、それをフォーカス
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // 既存のウィンドウがなければ、新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
}); 