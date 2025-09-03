function getLastRoomMessageForNotifications() {
    var socket = io('http://localhost:3000');
    // Обробка відповіді від сервера
    socket.on('lastRoomMessages', function(messages) {
        console.log('Last messages from all rooms:', messages);
        if(messages.length > 0){
            showNotificationIndicator();
        }
        else{
            hideNotificationIndicator();
        }
        // Очищення попередніх повідомлень
        const notificationDropdown = document.getElementById('DivBell-dropdown');
        notificationDropdown.innerHTML = '';
        // Створення нових повідомлень
        messages.forEach(function(message) {
            if (message && message.message) { // Перевірка, що повідомлення існує і має властивість 'message'
                const notificationItem = document.createElement('div');
                notificationItem.className = 'notification-item';
                const avatar = document.createElement('img');
                avatar.className = 'notification-avatar';
                avatar.src = 'images/ava.png';
                avatar.alt = 'Avatar';
                const content = document.createElement('div');
                content.className = 'notification-content';
                const textArea = document.createElement('textarea');
                textArea.className = 'notification-text';
                textArea.readOnly = true;
                textArea.textContent = message.message;
                const triangle = document.createElement('div');
                triangle.className = 'notification-triangle';
                const username = document.createElement('p');
                username.className = 'notification-username';
                username.textContent = message.username;
                const time = document.createElement('p');
                time.className = 'notification-time';
                time.textContent = message.time;
                const room = document.createElement('p');
                room.className = 'notification-room';
                room.textContent = message.room;
                // Збірка елементів
                content.appendChild(textArea);
                content.appendChild(triangle);
                content.appendChild(username);
                content.appendChild(time);
                content.appendChild(room);
                notificationItem.appendChild(avatar);
                notificationItem.appendChild(content);
                // Додавання повідомлення до випадаючого меню
                notificationDropdown.appendChild(notificationItem);
            }
        });
    });
    // Запит на отримання останніх повідомлень з усіх румів
    setInterval(function(){
        socket.emit('getLastRoomMessages');
    }, 500);
}
// Виклик функції
getLastRoomMessageForNotifications();

// Приховати індикатор нових повідомлень
function hideNotificationIndicator() {
    var notification = document.querySelector('.notification');
    if (notification) {
        notification.classList.add('notification-hide');
    }
}

// Відображення індикатора нових повідомлень
function showNotificationIndicator() {
    var notification = document.querySelector('.notification');
    if (notification) {
        notification.classList.remove('notification-hide');
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    hideNotificationIndicator();
});