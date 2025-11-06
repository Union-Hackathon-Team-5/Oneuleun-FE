// Service Worker - 푸시 알림 처리

// 푸시 알림 수신
self.addEventListener("push", function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || "새로운 알림이 도착했습니다",
            icon: "/icon.svg",
            badge: "/icon.svg",
            vibrate: [200, 100, 200],
            data: {
                url: data.url || "/",
                ...data,
            },
            actions: data.actions || [
                { action: "open", title: "열기" },
                { action: "close", title: "닫기" },
            ],
        };

        event.waitUntil(
            self.registration.showNotification(data.title || "오늘은?", options)
        );
    }
});

// 알림 클릭 처리
self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    if (event.action === "close") {
        return;
    }

    // 알림 클릭 시 앱 열기
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(function (clientList) {
                const url = event.notification.data.url || "/";

                // 이미 열려있는 윈도우가 있으면 포커스
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === url && "focus" in client) {
                        return client.focus();
                    }
                }

                // 없으면 새 윈도우 열기
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});
