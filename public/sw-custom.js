// Service Worker - 푸시 알림 처리

// 푸시 알림 수신
self.addEventListener("push", function (event) {
    if (event.data) {
        const data = event.data.json();
        // userName 추출 (제목에서 "님" 앞의 이름 추출)
        let userName = data.userName || "사용자";
        if (data.title && !data.userName) {
            const match = data.title.match(/(.+?)님/);
            if (match && match[1]) {
                userName = match[1];
            }
        }

        const notificationData = {
            id: Date.now(),
            title: data.title || "오늘은?",
            body: data.body || "새로운 알림이 도착했습니다",
            userName: userName,
            url: data.url || "/",
            timestamp: Date.now(),
        };

        const options = {
            body: notificationData.body,
            icon: "/icon.svg",
            badge: "/icon.svg",
            vibrate: [200, 100, 200],
            data: notificationData,
            actions: data.actions || [
                { action: "open", title: "열기" },
                { action: "close", title: "닫기" },
            ],
        };

        // 알림 표시
        event.waitUntil(
            self.registration.showNotification(notificationData.title, options).then(() => {
                // 모든 클라이언트에게 알림 저장 메시지 전송
                return self.clients.matchAll().then(function (clientList) {
                    clientList.forEach(function (client) {
                        client.postMessage({
                            type: "PUSH_NOTIFICATION",
                            notification: {
                                id: notificationData.id,
                                userName: notificationData.userName,
                                title: `${notificationData.userName}님의 영상 편지가 도착했어요`,
                                description: notificationData.body,
                                isRead: false,
                                timestamp: notificationData.timestamp,
                            },
                        });
                    });
                });
            })
        );
    }
});

// 알림 클릭 처리
self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    if (event.action === "close") {
        return;
    }

    // 알림 클릭 시 알림 페이지로 이동
    const url = "/admin/notifications";

    // 알림 클릭 시 앱 열기
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(function (clientList) {
                // 이미 열려있는 윈도우가 있으면 포커스
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(url) && "focus" in client) {
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
