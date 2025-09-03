function showAddTaskForm(button){
    document.getElementById('nameAdd').value = '';
    document.getElementById('dateAdd').value = '';
    document.getElementById('descriptionAdd').value = '';
    let parentCategoryName = button.parentNode.parentNode.querySelector('.CategoryName');
    console.log(`You intend to add task with category: "${parentCategoryName.textContent}"`);
    const addForm = document.querySelector('.DivAddTask');
    if(parentCategoryName.textContent == 'In process'){
        addForm.querySelector('#boardAdd').value = 'InProcess';
    }
    else{
        addForm.querySelector('#boardAdd').value = parentCategoryName.textContent;
    }
    document.querySelector('.DivAddTask').style.display = 'flex';
}

function closeAddTaskForm(){
    document.querySelector('.DivAddTask').style.display = 'none';
    let nameAdd = document.getElementById('nameAdd');
    let dateAdd = document.getElementById('dateAdd');
    let descriptionAdd = document.getElementById('descriptionAdd');
    nameAdd.value = '';
    dateAdd.value = '';
    descriptionAdd.value = '';
}

function showTaskViewForm(){
    document.querySelector('.DivViewTask').style.display = 'flex';
    let taskElement = this;
    // Знаходимо елемент TaskName всередині головного елементу
    const taskNameElement = taskElement.querySelector('.TaskName');
    // Отримуємо текстовий контент елементу TaskName
    const taskName = taskNameElement.textContent;
    // Знаходимо елемент TaskDate всередині головного елементу
    const taskDateElement = taskElement.querySelector('.TaskDate');
    // Отримуємо текстовий контент елементу TaskDate
    const taskDate = taskDateElement.textContent;
    let boardView = document.getElementById('boardView');
    let nameView = document.getElementById('nameView');
    let dateView = document.getElementById('dateView');
    let descriptionView = document.getElementById('descriptionView');
    // Підключення до сокет-сервера
    const socket = io('http://localhost:3000');
    // Отримання таску за іменем
    socket.emit('getTaskByName', taskName);
    // Обробник події для отримання таска за іменем
    socket.on('taskRetrievedByName', (task) => {
        console.log('Task retrieved from DB, which you intend to edit:', task);
        if(task.board == 'InProcess'){
            boardView.value = 'In process';
        }
        else{
            boardView.value = task.board;
        }
        nameView.value = task.name;
        dateView.value = task.date;
        descriptionView.value = task.description;
    });
    // Обробник події для випадку, коли таск не знайдено за іменем
    socket.on('taskNotFoundByName', () => {
        console.log('Task not found with the specified name');
    });
    // Обробник події для випадку, коли виникає помилка при отриманні таска за іменем
    socket.on('taskRetrievalError', (errorMessage) => {
        console.error('Error retrieving task:', errorMessage);
    });
}

function closeViewTaskForm(){
    document.querySelector('.DivViewTask').style.display = 'none';
}

function designUserLoginElement(){
    // Отримання параметрів URL
    let queryString = window.location.search;
    // Видалення символу "?" з рядка параметрів
    queryString = queryString.substring(1);
    // Розбиття рядка параметрів на окремі параметри
    let params = queryString.split("&");
    // Створення об'єкта для зберігання значень параметрів
    let paramMap = {};
    // Цикл по всіх параметрам і їх значеннях
    for (let i = 0; i < params.length; i++) {
        // Розбиття кожного параметра на ключ та значення
        let pair = params[i].split("=");
        // Зберігання ключа та значення в об'єкті paramMap
        paramMap[pair[0]] = decodeURIComponent(pair[1] || '');
    }
    // Отримання значення параметрів
    let login = paramMap['login'];
    let password = paramMap['password'];
    const userLoginElement = document.getElementById('UserLogin');
    if (userLoginElement) {
        userLoginElement.innerHTML = login;
    }
}

function addTask(){
    // Створення нового елементу div з класом task
    let newTask = document.createElement('div');
    newTask.classList.add('task');
    // Створення внутрішніх елементів для нового завдання
    let taskName = document.createElement('div');
    taskName.classList.add('TaskName');
    taskName.textContent = document.getElementById('nameAdd').value;
    let taskDate = document.createElement('div');
    taskDate.classList.add('TaskDate');
    taskDate.textContent = document.getElementById('dateAdd').value;
    // Запис в БД
    let Board = document.getElementById('boardAdd').value;
    let Name = document.getElementById('nameAdd').value;
    let Date = document.getElementById('dateAdd').value;
    let Description = document.getElementById('descriptionAdd').value;
    // Перевірка на пусті поля
    if (Board.trim() === '' || Name.trim() === '' || Date.trim() === '' || Description.trim() === '') {
        alert('Please, input all fields!');
        return;
    }
    let UserLogin = null;
    let UserPassword = null;
    // Отримання параметрів URL
    let queryString = window.location.search;
    // Видалення символу "?" з рядка параметрів
    queryString = queryString.substring(1);
    // Розбиття рядка параметрів на окремі параметри
    let params = queryString.split("&");
    // Створення об'єкта для зберігання значень параметрів
    let paramMap = {};
    // Цикл по всіх параметрам і їх значеннях
    for (let i = 0; i < params.length; i++) {
        // Розбиття кожного параметра на ключ та значення
        let pair = params[i].split("=");
        // Зберігання ключа та значення в об'єкті paramMap
        paramMap[pair[0]] = decodeURIComponent(pair[1] || '');
    }
    // Отримання значення параметрів
    UserLogin = paramMap['login'];
    UserPassword = paramMap['password'];
    console.log(`Trying to add new task. User Login: "${UserLogin}", User Password:"${UserPassword}", Board: "${Board}", Task Name: "${Name}", Date: "${Date}", Description: "${Description}"`);
    // Встановлення з'єднання з сервером
    const socket = io('http://localhost:3000');
    // Дані, які потрібно передати на сервер
    const taskData = {
        userLogin: UserLogin,
        userPassword: UserPassword,
        board: Board,
        name: Name,
        date: Date,
        description: Description
    };
    // Перевірка чи нема імені таска, що додається в БД. Ім'я має бути єдине і унікальне
    socket.emit('checkTaskNameInDB', taskData.name);
    socket.on('taskNameExists', (data) => {
        alert(data.message);
    });
    socket.on('taskNameUnique', (data) => {
        alert(data.message);
        // Відправка даних на сервер
        socket.emit('addData', taskData);
        // Отримання відповіді від сервера
        socket.on('taskSaved', (data) => {
            if(data.success === true){
                console.log(`Success: ${data.success}`);
                console.log('Received message from server:', data.message);
                // Додавання внутрішніх елементів до нового завдання (для відображення)
                newTask.appendChild(taskName);
                newTask.appendChild(taskDate);
                // Додавання в конкретний вибраний тип контейнера
                let boardInput = document.getElementById('boardAdd');
                if(boardInput.value == 'ToDo'){
                    let ToDoContainer = document.getElementById('ToDoContainer');
                    ToDoContainer.appendChild(newTask);
                }
                else if(boardInput.value == 'InProcess'){
                    let InProcessContainer = document.getElementById('InProcessContainer');
                    InProcessContainer.appendChild(newTask);
                }
                else if(boardInput.value == 'Done'){
                    let DoneContainer = document.getElementById('DoneContainer');
                    DoneContainer.appendChild(newTask);
                }
                // Отримуємо всі елементи з класом "task"
                let tasks = document.querySelectorAll('.task');
                // Проходимося по кожному елементу та додаємо обробник події
                tasks.forEach(task => {
                    task.addEventListener('click', showTaskViewForm);
                });
                document.getElementById('nameAdd').value = '';
                document.getElementById('dateAdd').value = '';
                document.getElementById('descriptionAdd').value = '';
                alert('Task is added successfully to MongoDB!');
            }
            else if(data.success === false){
                console.log(`Success: ${data.success}`);
                console.log('Received message from server:', data.message);
                return;
            }
        });
    });
    socket.on('taskNameCheckError', (data) => {
        alert('Error checking task name:', data.message);
    });
    document.querySelector('.DivAddTask').style.display = 'none';
}

function getTasksFromDB() {
    // Отримання параметрів URL
    let queryString = window.location.search;
    // Видалення символу "?" з рядка параметрів
    queryString = queryString.substring(1);
    // Розбиття рядка параметрів на окремі параметри
    let params = queryString.split("&");
    // Створення об'єкта для зберігання значень параметрів
    let paramMap = {};
    // Цикл по всіх параметрам і їх значеннях
    for (let i = 0; i < params.length; i++) {
        // Розбиття кожного параметра на ключ та значення
        let pair = params[i].split("=");
        // Зберігання ключа та значення в об'єкті paramMap
        paramMap[pair[0]] = decodeURIComponent(pair[1] || '');
    }
    // Отримання значення параметрів
    let login = paramMap['login'];
    let password = paramMap['password'];
    // Встановлення з'єднання з сервером
    const socket = io('http://localhost:3000');
    // Відправка запиту на сервер для отримання тасків
    socket.emit('getTasks', login, password);
    // Отримання тасків від сервера
    socket.on('tasksRetrieved', (tasks) => {
    tasks.forEach((task) => {
        // Створення нового елементу div з класом task
        let newTask = document.createElement('div');
        newTask.classList.add('task');
        // Створення внутрішніх елементів для нового завдання
        let taskName = document.createElement('div');
        taskName.classList.add('TaskName');
        taskName.textContent = task.name;
        let taskDate = document.createElement('div');
        taskDate.classList.add('TaskDate');
        taskDate.textContent = task.date;
        // Додавання внутрішніх елементів до нового завдання (для відображення)
        newTask.appendChild(taskName);
        newTask.appendChild(taskDate);
        // Додавання в конкретний вибраний тип контейнера
        let container;
        if(task.board == 'ToDo'){
            container = document.getElementById('ToDoContainer');
        }
        else if(task.board == 'InProcess'){
            container = document.getElementById('InProcessContainer');
        }
        else if(task.board == 'Done'){
            container = document.getElementById('DoneContainer');
        }
        container.appendChild(newTask);
        // Отримуємо всі елементи з класом "task"
        let tasks = document.querySelectorAll('.task');
        // Проходимося по кожному елементу та додаємо обробник події
        tasks.forEach(task => {
            task.addEventListener('click', showTaskViewForm);
        });
    });
    });
}

function deleteTask(){
    const nameOfTaskToDelete = document.getElementById('nameView').value;
    console.log(`You intend to delete task: "${nameOfTaskToDelete}"`);
    const socket = io('http://localhost:3000');
    socket.emit('deleteTaskByName', nameOfTaskToDelete);
    socket.on('taskDeletedByName', (data) => {
        console.log(data.message);
        if (data.success) {
            alert('Task deleted successfully from MongoDB! MongoDB is successfully updated!');
            location.reload();
        } else {
            alert('Error deleting task');
        }
    });
    socket.on('taskNotFoundByName', () => {
        console.log('Task not found');
        alert('Task not found');
    });
    socket.on('taskDeletionError', (errorMessage) => {
        console.log('Error deleting task:', errorMessage);
        alert('Error deleting task');
    });
}

function saveTask(){
    const taskName = document.getElementById('nameView').value;
    const taskBoard = document.getElementById('boardView').value;
    const taskDate = document.getElementById('dateView').value;
    const taskDescription = document.getElementById('descriptionView').value;
    console.log(`You intend to save task: "${taskName}"`);

    const socket = io('http://localhost:3000');
    socket.emit('saveTask', {  // Змінено 'saveTaskByName' на 'saveTask'
        name: taskName,
        board: taskBoard,
        date: taskDate,
        description: taskDescription
    });

    socket.on('taskUpdated', (data) => {
        console.log(data.message);
        if (data.success) {
            // Завдання успішно оновлено, можна перезавантажити сторінку
            alert('Task is updated successfully!');
            location.reload();
        } else {
            // Показати повідомлення про помилку
            alert('Error updating task');
        }
    });

    socket.on('taskNotFound', () => {
        alert('Task not found');
    });

    socket.on('taskUpdateError', (errorMessage) => {
        alert('Error updating task:', errorMessage);
    });
}