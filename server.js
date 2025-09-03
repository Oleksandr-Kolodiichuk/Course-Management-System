///////////////////////////////////////////////////////////////////////////////
// Chat
///////////////////////////////////////////////////////////////////////////////

const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const httpServer = require('http').createServer(app);
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeaves, getRoomUsers} = require('./utils/users');
const moment = require('moment');
const io = require('socket.io')(httpServer, {
  cors: {
    origin: "*",
    methods: ["POST"]
  }
});
app.use(cors());
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Node server is running on port ${PORT}`);
});
const botName = 'Bot';

// Підключення до MongoDB для чатів
const chatDB = mongoose.createConnection('mongodb://localhost:27017/chats-db');
chatDB.on('error', console.error.bind(console, 'connection error:'));
chatDB.once('open', function() {
  console.log('Connected to MongoDB (chats)');
});
const messageSchema = new mongoose.Schema({
    username: String,
    userpassword: String,
    room: String,
    message: String,
    time: String
});
// Підключення до MongoDB для румів
const roomDB = mongoose.createConnection('mongodb://localhost:27017/rooms-db');
roomDB.on('error', console.error.bind(console, 'connection error:'));
roomDB.once('open', function() {
    console.log('Connected to MongoDB (rooms)');
});
const roomSchema = new mongoose.Schema({
    roomName: String,
    participants: [{
        login: String
    }]
});

// Runs when client connects
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ login, roomName }) => {
        const user = userJoin(socket.id, login, roomName);
        const Room = roomDB.model('Room', roomSchema, 'rooms-collection');
        Room.findOne({ roomName: roomName })
            .then(room => {
                const userExists = room.participants.some(participant => participant.login === login);
                if (!userExists) {
                    socket.join(user.room);
                    room.participants.push({ login: login });
                    socket.emit('userNotExists', true);
                } else {
                    socket.join(user.room);
                    socket.emit('userExists', true);
                }
                return room.save();
            })
            .then(updatedRoom => {
                console.log(`Username:"${user.username}" is connected to room:"${user.room}"`);
                socket.emit('message', formatMessage(botName, 'Welcome to chat. You are connected! Below you can see whole chat history!'));
                socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat!`));
                io.to(user.room).emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                });
                const Message = chatDB.model('Message', messageSchema, roomName);
                Message.find({}).then(messages => {
                    socket.emit('roomMessages', messages);
                }).catch(err => {
                    console.error('Error retrieving messages:', err);
                });
            })
            .catch(err => {
                console.error('Error adding user to room:', err);
            });
    });
    // Listen for chatMessage
    socket.on('chatMessage', (msg, login, password, roomName) => {
        //console.log(msg); // Повідомлення на сервері
        const Message = chatDB.model('Message', messageSchema, roomName);
        const user = getCurrentUser(socket.id);
        const message = new Message({
            username: login,
            userpassword: password,
            room: roomName,
            message: msg,
            time: formatMessage(user.username, msg).time
        });
        console.log('Message, which will be saved in MongoDB:', message);
        message.save()
        .then(savedMessage => {
            console.log('Message saved successfully:', savedMessage);
        })
        .catch(err => {
            console.error('Error saving message:', err);
        });
        // Відправляємо повідомлення на клієнт
        io.to(user.room).emit('message', formatMessage(user.username, msg)); // Повідомлення на клієнті через сервер
    });
    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeaves(socket.id);
        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat!`));
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
              room : user.room,
              users : getRoomUsers(user.room)
            });
        }
    });

    socket.on('getRoomsFromDB', () => {
        const Room = roomDB.model('Room', roomSchema, 'rooms-collection');
        Room.find({})
            .then((rooms) => {
                socket.emit('roomsFromDB', rooms);
            })
            .catch((err) => {
                console.error('Error retrieving rooms:', err);
            });
    });

    socket.on('addNewRoomToDB', (newRoom) => {
        const Room = roomDB.model('Room', roomSchema, 'rooms-collection');
        const room = new Room({
            roomName: newRoom,
            participants: []  // Пустий масив учасників
        });
        room.save()
            .then((savedRoom) => {
                console.log('Room saved successfully in MongoDB:', savedRoom);
                //socket.emit('roomSaved', { success: true, message: `Room saved successfully in MongoDB: \nRoom:\n${savedRoom}` });
                io.emit('roomSaved', { success: true, message: `Room saved successfully in MongoDB: \nRoom:\n${savedRoom}`, roomName: savedRoom.roomName });
            })
            .catch((err) => {
                console.error('Error saving room:', err);
                //socket.emit('roomSaved', { success: false, message: `Error saving room: ${err}` });
                io.emit('roomSaved', { success: false, message: `Error saving room: ${err}` });
            });
        //io.emit("newRoom-created")
    });
    
    socket.on('leaveRoom', ({login, roomName}) => {
        const Room = roomDB.model('Room', roomSchema, 'rooms-collection');
        Room.findOne({ roomName: roomName })
            .then(room => {
                if (room) {
                    // Видалити користувача з масиву participants
                    room.participants = room.participants.filter(participant => participant.login !== login);
                    return room.save();
                } else {
                    throw new Error('Room not found');
                }
            })
            .then(() => {
                socket.leave(roomName);
                socket.emit('leftRoom', true);
                console.log(`User "${login}" has left the room "${roomName}"`);
            })
            .catch(err => {
                socket.emit('leftRoom', false);
                console.error('Error removing user from room:', err);
            });
    });
    
    socket.on('deleteUserFromAllRooms', (login) => {
        const Room = roomDB.model('Room', roomSchema, 'rooms-collection');
        Room.updateMany(
            {}, 
            { $pull: { participants: { login: login } } }
        )
        .then(result => {
            console.log(`User "${login}" has been removed from all rooms.`);
            socket.emit('userDeletedFromAllRooms', true);
        })
        .catch(err => {
            console.error('Error removing user from all rooms:', err);
            socket.emit('userDeletedFromAllRooms', false);
        });
    });

    socket.on('getUsersInLeftRoom', (roomName) => {
        const Room = roomDB.model('Room', roomSchema, 'rooms-collection');
        Room.findOne({ roomName: roomName })
            .then(room => {
                if (room) {
                    // Відправити розмір масиву participants назад до клієнта
                    socket.emit('usersInLeftRoomCount', room.participants.length);
                } else {
                    // Якщо кімната не знайдена, відправити 0
                    socket.emit('usersInLeftRoomCount', 0);
                }
            })
            .catch(err => {
                console.error('Error retrieving room:', err);
                socket.emit('usersInLeftRoomCount', 0);
            });
    });

    socket.on('deleteRoomFromDBs', async (roomName) => {
        try {
            // Видалення колекції з бази даних chats-db
            await chatDB.dropCollection(roomName);
            console.log(`Collection ${roomName} deleted successfully.`);
            // Видалення запису з колекції rooms-collection в базі даних rooms-db
            const Room = roomDB.model('Room', roomSchema, 'rooms-collection');
            await Room.deleteOne({ roomName: roomName });
            console.log(`Room ${roomName} deleted successfully from rooms-collection.`);
            io.emit('roomDeleted');
        } catch (err) {
            console.error('Error:', err);
        }
    });
});

///////////////////////////////////////////////////////////////////////////////
// Tasks
///////////////////////////////////////////////////////////////////////////////

// Підключення і робота з MongoDB (tasks)
const taskDB = mongoose.createConnection('mongodb://localhost:27017/tasks-db');
taskDB.on('error', console.error.bind(console, 'connection error:'));
taskDB.once('open', function() {
console.log('Connected to MongoDB (tasks)');
});
const taskSchema = new mongoose.Schema({
    login: String,
    password: String,
    board: String,
    name: String,
    date: String,
    description: String
}, { collection: 'tasks-collection' });
// Створення моделі таску на основі схеми
const Task = taskDB.model('Task', taskSchema);

// Встановлення з'єднання з БД для тасків
io.on('connection', (socket) => {
    socket.on('addData', (data) => {
        console.log('Received data from client:', data);
        // Створення нового об'єкта таску
        const newTask = new Task({
            login: data.userLogin,
            password: data.userPassword,
            board: data.board,
            name: data.name,
            date: data.date,
            description: data.description
        });
        // Збереження таску в базі даних
        newTask.save()
            .then((result) => {
                console.log('Task saved successfully in MongoDB:', result);
                socket.emit('taskSaved', { success: true, message: `Task saved successfully in MongoDB: \nTask:\n${result}` });
            })
            .catch((err) => {
                console.error('Error saving task:', err);
                socket.emit('taskSaved', { success: false, message: `Error saving task: ${err}` });
            });
    });

    socket.on('checkTaskNameInDB', (taskName) => {
        Task.findOne({ name: taskName })
            .then((foundTask) => {
                if (foundTask) {
                    // Якщо знайдено таск з таким же іменем, відправте повідомлення клієнту
                    socket.emit('taskNameExists', { message: 'Task name already exists in the database, cannot be added!' });
                } else {
                    // Якщо ім'я таска унікальне, відправте повідомлення про його унікальність
                    socket.emit('taskNameUnique', { message: 'Task name is unique, great!' });
                }
            })
            .catch((err) => {
                console.error('Error checking task name:', err);
                // В разі помилки відправте повідомлення про помилку клієнту
                socket.emit('taskNameCheckError', { message: 'Error checking task name in the database' });
            });
    });

    // Отримання запиту від клієнта для отримання тасків
    socket.on('getTasks', (login, password) => {
        // Отримати таски, де значення login і password співпадають
        Task.find({ login: login, password: password })
            .then((tasks) => {
                console.log('Tasks retrieved successfully from MongoDB:', tasks);
                // Відправка тасків назад до клієнта
                socket.emit('tasksRetrieved', tasks);
            })
            .catch((err) => {
                console.error('Error retrieving tasks:', err);
            });
    });

    // Отримання запиту від клієнта для отримання тасків
    socket.on('getTaskByName', (taskName) => {
        Task.findOne({ name: taskName })
            .then((task) => {
                if (task) {
                    console.log('Task retrieved successfully from MongoDB:', task);
                    // Відправка таска назад до клієнта
                    socket.emit('taskRetrievedByName', task);
                } else {
                    console.log('Task with name', taskName, 'not found');
                    // Відправити клієнту повідомлення про те, що таск не знайдено
                    socket.emit('taskNotFoundByName');
                }
            })
            .catch((err) => {
                console.error('Error retrieving task:', err);
                // Відправити клієнту повідомлення про помилку
                socket.emit('taskRetrievalError', err.message);
            });
    });    

    // Видалення таску з MongoDB
    socket.on('deleteTaskByName', (taskName) => {
        Task.deleteOne({ name: taskName })
            .then((result) => {
                if (result.deletedCount > 0) {
                    console.log('Task deleted successfully from MongoDB:', taskName);
                    // Відправка повідомлення назад до клієнта
                    socket.emit('taskDeletedByName', { success: true, message: `Task deleted successfully from MongoDB: \nTask Name:\n${taskName}` });
                } else {
                    console.log('Task with name', taskName, 'not found');
                    // Відправити клієнту повідомлення про те, що таск не знайдено
                    socket.emit('taskNotFoundByName');
                }
            })
            .catch((err) => {
                console.error('Error deleting task:', err);
                // Відправити клієнту повідомлення про помилку
                socket.emit('taskDeletionError', err.message);
            });
    });
    
    socket.on('saveTask', (taskData) => {  // Змінено назву події на 'saveTask'
        Task.findOne({ name: taskData.name })
            .then((foundTask) => {
                if (foundTask) {
                    if(taskData.board == 'In process'){
                        foundTask.board = 'InProcess';
                    }
                    else{
                        foundTask.board = taskData.board;
                    }
                    foundTask.date = taskData.date;
                    foundTask.description = taskData.description;
                    return foundTask.save();
                } else {
                    socket.emit('taskNotFound', { message: 'Task not found' });
                    return;
                }
            })
            .then((updatedTask) => {
                console.log('Task updated successfully in MongoDB:', updatedTask);
                socket.emit('taskUpdated', { success: true, message: `Task updated successfully in MongoDB: \nTask:\n${updatedTask}` });
            })
            .catch((err) => {
                console.error('Error updating task:', err);
                socket.emit('taskUpdateError', err.message);
            });
    });
});

///////////////////////////////////////////////////////////////////////////////
// Notifications
///////////////////////////////////////////////////////////////////////////////

io.on('connection', (socket) => {
    socket.on('getLastRoomMessages', async () => {
        try {
            // Отримання списку усіх колекцій
            const collections = await chatDB.db.listCollections().toArray();
            // Витягування назв колекцій
            const collectionNames = collections.map(col => col.name);
            // Масив промісів для отримання останнього запису з кожної колекції
            const lastRecordsPromises = collectionNames.map(async (collectionName) => {
                const collection = chatDB.collection(collectionName);
                return collection.find().sort({ _id: -1 }).limit(1).toArray();
            });
            // Очікування результатів усіх промісів
            const lastRecordsArrays = await Promise.all(lastRecordsPromises);
            // Формування масиву останніх записів
            const lastRecords = lastRecordsArrays.map(records => records[0]);
            // Відправлення масиву останніх записів на клієнт
            socket.emit('lastRoomMessages', lastRecords);
        } catch (err) {
            console.error(err);
        }
    });
});