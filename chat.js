///////////////////////////////////////////////////////////////////////////////
// Отримання логіну, паролю і назви руму
///////////////////////////////////////////////////////////////////////////////
var login = null;
var password = null;
// Отримання параметрів URL
var queryString = window.location.search;
// Видалення символу "?" з рядка параметрів
queryString = queryString.substring(1);
// Розбиття рядка параметрів на окремі параметри
var params = queryString.split("&");
// Створення об'єкта для зберігання значень параметрів
var paramMap = {};
// Цикл по всіх параметрам і їх значеннях
for (var i = 0; i < params.length; i++) {
    // Розбиття кожного параметра на ключ та значення
    var pair = params[i].split("=");
    // Зберігання ключа та значення в об'єкті paramMap
    paramMap[pair[0]] = decodeURIComponent(pair[1] || '');
}
// Отримання значення певного параметра
login = paramMap['login'];
password = paramMap['password'];
// Функція для додавання параметрів до URL та переходу на сторінку tasks.html
function redirectToTasksPage(event) {
    event.preventDefault(); // Заборонити перехід за замовчуванням
    var url = 'tasks.html';
    url += '?login=' + encodeURIComponent(login);
    url += '&password=' + encodeURIComponent(password);
    window.location.href = url;
}
// Додати обробник події на клік, який викличе функцію redirectToTasksPage()
document.getElementById('tasksLink').addEventListener('click', redirectToTasksPage);
console.log(`You entered Messages Section. Your data is: Login:"${login}", password:"${password}"`);
const userLoginElement = document.getElementById('UserLoginInChat');
if (userLoginElement) {
    userLoginElement.innerHTML = login;
}
// Отримання посилання на елемент кнопки за її ідентифікатором
const addButton = document.getElementById('AddChatRoom');
// Додавання обробника події кліку на кнопку 'додати рум'
addButton.addEventListener('click', function() {
    // Отримання посилання на елемент текстового поля за його ідентифікатором
    const inputElement = document.getElementById('RoomNameInput');
    // Отримання значення з текстового поля
    var roomName = inputElement.value;
    if(roomName === ''){
        alert('Room name should not be empty');
        return;
    }
    console.log('Button "add chat room" clicked');
    console.log(`Login: ${login}, password: ${password}, room name: ${roomName}`);
    var socket = io('http://localhost:3000');
    socket.emit('addNewRoomToDB', roomName);
});

var socket = io('http://localhost:3000');
socket.on("roomSaved", (room)=>{
    // var roomName = inputElement.value;
    if(room.success == false) {
        console.log("Error creating room pn DB");
    }
    var _roomName = room.roomName;
    const inputElement = document.getElementById('RoomNameInput');
    const newChatRoomDiv = document.createElement('div');
    newChatRoomDiv.classList.add('ChatRoom');
    newChatRoomDiv.style.marginTop = '30px';
    // Додавання заголовка з назвою кімнати
    const roomNameHeading = document.createElement('h5');
    roomNameHeading.textContent = _roomName;
    newChatRoomDiv.appendChild(roomNameHeading);
    // Додавання кнопки для приєднання до чат-кімнати
    const joinButton = document.createElement('button');
    joinButton.textContent = 'Join';
    joinButton.id = 'JoinChatRoom';
    newChatRoomDiv.appendChild(joinButton);
    // Додавання новоствореного елемента чат-кімнати до DOM
    const chatRoomsContainer = document.querySelector('.scrollable-div');
    chatRoomsContainer.appendChild(newChatRoomDiv);
    inputElement.value = '';
});

///////////////////////////////////////////////////////////////////////////////
// Дії з чатом
///////////////////////////////////////////////////////////////////////////////

const room_name = document.getElementById('room-name');
const user_list = document.getElementById('room-users');

// Додаємо обробник події кліку на контейнер з усіма чат-румами (обробник всіх кнопок join)
document.querySelector('.scrollable-div').addEventListener('click', function(event) {
    // Перевіряємо, чи клікнули саме на кнопку "Join"
    if (event.target && event.target.id === 'JoinChatRoom') {
        if(document.getElementById('LeaveRoom').style.display === 'block' &&
        document.getElementById('DisconnectRoom').style.display === 'block' &&
        document.querySelector('.chat-main').style.display == 'grid')
        { 
            alert('Leave current room first!');
            return;
        }
        // Отримуємо батьківський елемент кнопки, який є чат-кімнатою
        const chatRoomDiv = event.target.closest('.ChatRoom');
        // Отримуємо назву кімнати, яка є заголовком
        const roomName = chatRoomDiv.querySelector('h5').textContent;
        console.log(`You are going to join room: "${roomName}" with login: "${login}" and password: "${password}"`);
        const chatForm = document.getElementById('chat-form');
        const chatMessages = document.querySelector('.chat-messages');
        var socket = io('http://localhost:3000');
        // Join chat room
        socket.emit('joinRoom', { login, roomName });
        socket.on('userExists', (exists) => {
            if (exists) {
                console.log('User has already joined in the room or just joined now.');
                alert('You are reconnecting to the room!');
                document.getElementById('LeaveRoom').style.display = 'block';
                document.getElementById('DisconnectRoom').style.display = 'block';
                document.querySelector('.chat-main').style.display = 'grid';
                document.querySelector('.selected-chat').style.background = 'gray';
            }
        });
        socket.on('userNotExists', (notExists) => {
            if (notExists) {
                console.log('Welcome! You successfully joined selected room!');
                alert('Welcome! You successfully joined selected room!');
                document.getElementById('LeaveRoom').style.display = 'block';
                document.getElementById('DisconnectRoom').style.display = 'block';
                document.querySelector('.chat-main').style.display = 'grid';
                document.querySelector('.selected-chat').style.background = 'gray';
            }
        });
        socket.on('roomMessages', (messages) => {
            console.log('Saved messaged in current chat:', messages);
            messages.forEach(message => {
                const div = document.createElement('div');
                div.classList.add('message');
                div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
                <p class="text">
                    ${message.message}
                </p>`;
                document.querySelector('.chat-messages').appendChild(div);
            });
        });
        socket.on('roomUsers', ({room, users}) => {
            outputRoomName(room);
            outputUsers(users);
        });
        // Повідомлення від сервера
        socket.on('message', message => {
            //console.log(message);
            outputMessage(message); // Вивід в DOM
            // Скрол вниз
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        // Message submit
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Get message text
            const msg = e.target.elements.msg.value;
            // Send to server
            //console.log(msg); // Повідомлення на клієнті
            socket.emit('chatMessage', msg, login, password, roomName);
            // Чистка інпуту під надсилання повідомлення
            e.target.elements.msg.value = '';
            e.target.elements.msg.focus();
        });
    }
});

// Вивід повідомлення в DOM
function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room){
    room_name.innerText = room;
}

// Add users to DOM
function outputUsers(users){
    user_list.innerHTML =  `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}

function getRoomsFromDB(){
    var socket = io('http://localhost:3000');
    socket.emit('getRoomsFromDB');
    socket.on('roomsFromDB', (rooms) => {
        const chatRoomsContainer = document.querySelector('.scrollable-div');
        rooms.forEach(room => {
            // Створення нового елемента div для чат-кімнати
            const newChatRoomDiv = document.createElement('div');
            newChatRoomDiv.classList.add('ChatRoom');
            newChatRoomDiv.style.marginTop = '30px';
            // Додавання заголовка з назвою кімнати
            const roomNameHeading = document.createElement('h5');
            roomNameHeading.textContent = room.roomName;
            newChatRoomDiv.appendChild(roomNameHeading);
            // Додавання кнопки для приєднання до чат-кімнати
            const joinButton = document.createElement('button');
            joinButton.textContent = 'Join';
            joinButton.id = 'JoinChatRoom';
            newChatRoomDiv.appendChild(joinButton);
            // Додавання новоствореного елемента чат-кімнати до DOM
            chatRoomsContainer.appendChild(newChatRoomDiv);
        });
    });
}

function leaveRoomButtonClick(){
    var socket = io('http://localhost:3000');
    const roomName = document.getElementById('room-name').textContent;
    socket.emit('leaveRoom', { login, roomName });
    socket.on('leftRoom', (didLeave) => {
        if (didLeave) {
            console.log('You have left the room.');
            alert('You have left the room!');
            location.reload();
        } else {
            console.log('There was a problem leaving the room.');
        }
    });
    socket.emit('getUsersInLeftRoom', roomName);
    socket.on('usersInLeftRoomCount', (count) => {
        alert(`In the room ramain "${count}" users! If current number is 0, room will be automatically deleted!`);
        if(count == 0){
            socket.emit('deleteRoomFromDBs', roomName);
        }
    });
}

socket.on('roomDeleted', () => {
    //alert('The room has been deleted. The page will now reload.');
    location.reload();
});

function deleteUserFromAllRooms() {
    var socket = io('http://localhost:3000');
    socket.emit('deleteUserFromAllRooms', login);
}

function disconnectRoomButtonClick(){
    alert('You will be disconnected! But you are still participant of this room, so you can any time reconnect!');
    location.reload();
}