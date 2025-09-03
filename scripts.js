class Student
{
    constructor(id, group, name, gender, birthday, status, login, password)
    {
        this.id = id;
        this.group = group;
        this.name = name;
        this.gender = gender;
        this.birthday = birthday;
        this.status = status;
        this.login = login;
        this.password = password;
    }
}

var students = [];
var studentId;
var editedRow;
var editedStudent;
var addingIsNowActive = false;
var editingIsNowActive = false;
var groupStud;
var nameStud;
var genderStud;
var birthdayStud;
var loginStud;
var passwordStud;

function ShowFormAddStudent()
{
    $("#firstnameId").val("");
    $("#secondnameId").val("");
    $("#idSelectGroup").val("");
    $("#idSelectGender").val("");
    $("[name='nameDateBirthday']").val("");
    $("#newLoginId").val("");
    $("#newPasswordId").val("");
    var FormAddStudent = $("#FormAddStudent");
    if (FormAddStudent.css("display") === "none")
    {
        FormAddStudent.css("display", "block");
        var h4 = FormAddStudent.find("h4");
        h4.text("Add student");
        var btnEdit = $("#btnCreateEdit")
        btnEdit.text("Create");
    }
    else
    {
        FormAddStudent.css("display", "none");
    }
}

function ShowFormEditStudent(id)
{
    var FormEditStudent = $("#FormAddStudent");
    if (FormEditStudent.css("display") === "none")
    {
        FormEditStudent.css("display", "block");
        var h4 = FormEditStudent.find("h4");
        h4.text("Edit student");
        var btnEdit = $("#btnCreateEdit");
        btnEdit.text("Save");
        btnEdit.attr("data-id", id);
        var student = students.find(student => student.id === id);
        $("#idSelectGroup").val(student.group);
        var names = student.name.split(" ");
        $("#firstnameId").val(names[0]);
        $("#secondnameId").val(names[1]);
        // Встановлюємо вибране значення для випадаючого списку статі
        $("#idSelectGender option").each(function() {
            if ($(this).text() == student.gender) {
                $(this).prop('selected', true);
            }
        });
        $("[name='nameDateBirthday']").val(student.birthday);
        $("#newLoginId").val(student.login);
        $("#newPasswordId").val(student.password);
    }
    else
    {
        FormEditStudent.css("display", "none");
    }
}

function addEditStudent()
{
    let FormEditStudent = $("#FormAddStudent");
    let h4 = FormEditStudent.find("h4");
    let btnCreateEdit = $("#btnCreateEdit");
    if (h4.text() == "Add student" && btnCreateEdit.text() == "Create")
    {
        addingIsNowActive = true;
        let firstName = $("#firstnameId").val();
        let secondName = $("#secondnameId").val();
        let group = $("#idSelectGroup").val();
        let gender = $("#idSelectGender").val();
        let birthday = $("[name='nameDateBirthday']").val();
        let login = $("#newLoginId").val();
        let password = $("#newPasswordId").val();
/*
        var birthYear = new Date(birthday).getFullYear();
        if (birthYear >= 2008)
        {
            alert("Student must be born before 2008!");
            return false;
        }

        if(!(isValidName(firstName)))
        {
            alert("Only letters must be in field for firstname");
            return;
        }
        if(!(isValidName(secondName)))
        {
            alert("Only digits must be in field for secondname");
            return;
}*/
        const maxNumberOfRows = 50000000; //тимчасово
        if (firstName !== "" && secondName !== "" && group !== "" && gender !== "" && birthday !== "" && login !== "" && password !== "")
        {
            let tableBody = $("#tableId tbody");
            if (tableBody.find('tr').length < maxNumberOfRows)
            {
                let newStudent = new Student(null, group, firstName + " " + secondName, gender, birthday, "inactive", login, password);
                let dataToSend = {
                    action: "add",
                    studentJSON: [newStudent] // Відсилаю одного студента масивом
                };
                sendDataToServer("add", dataToSend);
            }
            else
            {
                alert("You reached max number of table's rows (5)!");
            }
        }
        else
        {
            alert("Input all fields!!!");
            return;
        }
    }
    else if (h4.text() == "Edit student" && btnCreateEdit.text() == "Save")
    {
        editingIsNowActive = true;
        let editedId = parseInt($("#btnCreateEdit").attr("data-id"));
        editedStudent = students.find(student => student.id === editedId);
        groupStud = editedStudent.group;
        nameStud = editedStudent.name;
        genderStud = editedStudent.gender;
        birthdayStud = editedStudent.birthday;
        loginStud = editedStudent.login;
        passwordStud = editedStudent.password;
        editedStudent.group = $("#idSelectGroup").val();
        editedStudent.name = $("#firstnameId").val() + " " + $("#secondnameId").val();
        editedStudent.gender = $("#idSelectGender").val();
        editedStudent.birthday = $("[name='nameDateBirthday']").val();
        editedStudent.login = $("#newLoginId").val();
        editedStudent.password = $("#newPasswordId").val();
        let dataToSend = {
            action: "edit",
            studentJSON: [editedStudent],
            editedId: editedId
        };
        sendDataToServer("edit", dataToSend);
        /*
        if(!isValidName($("#firstnameId").val()))
        {
            alert("Name must not contain digits!");
            return;
        }
        if(!isValidName($("#secondnameId").val()))
        {
            alert("Surname must not contain digits!");
            return;
        }
        var birthYear = new Date(editedStudent.birthday).getFullYear();
        if (birthYear >= 2008)
        {
            alert("Student must be born before 2008!");
            return false;
        }*/
    }
}

function isValidName(name)
{
    for (var i = 0; i < name.length; i++)
    {
        var charCode = name.charCodeAt(i);
        if ((charCode < 65 || charCode > 90) && (charCode < 97 || charCode > 122))
        {
            return false;
        }
    }
    return true;
}

function deleteRowInTable(button)
{
    let row = $(button).closest('tr'); //Знаходимо найближчий рядок до кнопки
    let studentId = row.find('button[id^="btnEdit"]').attr("id").replace("btnEdit", ""); //Отримуємо studentId з атрибута id кнопки
    let studentIndex = students.findIndex(student => student.id == studentId);
    row.remove();
    console.log("Deleted Student №" + studentId + "\n"); console.log(students[studentIndex]);
    let studentToDelete = Object.assign({}, students[studentIndex]);
    students.splice(studentIndex, 1);
    console.log("DB still contains data about:\n"); console.log(students);
    let dataToSend = {
        action: "delete",
        studentJSON: [studentToDelete]
    };
    sendDataToServer("delete", dataToSend);
}

//Відправлення даних про студентів на сервер за допомогою HTTP-запиту типу POST
function sendDataToServer(action, data)
{
    const dataToSendJSON = JSON.stringify(data);
    console.log("Sending to server: " + dataToSendJSON);
    $.ajax({
        type: "POST",
        url: "server.php",
        data: dataToSendJSON,
        dataType: "json",
        success: function(response){
            console.log("Data are sent to server successfully.");
            console.log("Server response:", response);
            if(!response.success){
                alert(response.error);
                if(true === addingIsNowActive){
                    const currentListOfStudents = JSON.stringify(students);
                    console.log("Current list of students: ", currentListOfStudents);
                    addingIsNowActive = false;
                }
                else if(true === editingIsNowActive){
                // Відновлюємо дані студента до попереднього стану
                editedStudent.group = groupStud;
                editedStudent.name = nameStud;
                editedStudent.gender = genderStud;
                editedStudent.birthday = birthdayStud;
                editedStudent.login = loginStud;
                editedStudent.password = passwordStud;
                console.log("Restored data:");
                console.log(editedStudent);
                // Позначаємо, що редагування не активне
                editingIsNowActive = false;
                }
            }
            else{
                console.log("Data are OK.");
                addingIsNowActive = false;
                editingIsNowActive = false;
                if (action == "add") {
                    studentId = response.id;
                    data.studentJSON[0].id = studentId;
                    students.push(data.studentJSON[0]);

                    var firstName = $("#firstnameId").val();
                    var secondName = $("#secondnameId").val();
                    var group = $("#idSelectGroup").val();
                    var gender = $("#idSelectGender").val();
                    var birthday = $("[name='nameDateBirthday']").val();
                    var login = $("#newLoginId").val();
                    var password = $("#newPasswordId").val();
                    
                    const maxNumberOfRows = 50000000; //тимчасово
            
                    if (firstName !== "" && secondName !== "" && group !== "" && gender !== "" && birthday !== "" && login !== "" && password !== "")
                    {
                        var tableBody = $("#tableId tbody");
                        if (tableBody.find('tr').length < maxNumberOfRows)
                        {
                            var newRow = $("<tr>");
                            var newCell1 = $("<td>").html('<input class="Checkboxes" type="checkbox" name="Checkbox' + studentId + '">');
                            var newCell2 = $("<td>").text(group);
                            var newCell3 = $("<td>").text(firstName + " " + secondName);
                            var newCell4 = $("<td>").text(gender);
                            var newCell5 = $("<td>").text(birthday);
                            var newCell6 = $("<td>").html('<input type="radio" name="Status" disabled style="scale: 1.5;">');
                            var newCell7 = $("<td>").html('<button id="btnEdit' + studentId + '" onclick="ShowFormEditStudent(' + studentId + ')" class="Buttons">&#128394;</button><button onclick="deleteRowInTable(this)" class="Buttons">&#10060;</button>');
                            newRow.append(newCell1, newCell2, newCell3, newCell4, newCell5, newCell6, newCell7);
                            tableBody.append(newRow);
                            console.log("Added new Student №" + studentId);
                            console.log(group);
                            console.log(firstName + " " + secondName);
                            console.log(gender);
                            console.log(birthday);
                            console.log(login);
                            console.log(password);
                            console.log("\n");
                            console.log("Current list of students: ");
                            console.log(students);
                        }
                        else
                        {
                            alert("You reached max number of table's rows (5)!");
                        }
                    }
                    else
                    {
                        alert("Input all fields!!!");
                        return;
                    }
                }
                else if(action == "edit"){
                    let FormEditStudent = $("#FormAddStudent");
                    let editedId = response.editedId;
                    console.log("Edited Student №" + editedId);
                    console.log(editedStudent.group);
                    console.log(editedStudent.name);
                    console.log(editedStudent.gender);
                    console.log(editedStudent.birthday);
                    console.log(editedStudent.login);
                    console.log(editedStudent.password);
                    console.log("\n");
                    editedRow = $("#tableId tbody tr").find(`button[id^="btnEdit${editedId}"]`).closest("tr");
                    editedRow.find("td:eq(1)").text(editedStudent.group);
                    editedRow.find("td:eq(2)").text(editedStudent.name);
                    editedRow.find("td:eq(3)").text(editedStudent.gender);
                    editedRow.find("td:eq(4)").text(editedStudent.birthday);
                    FormEditStudent.css("display", "none");
                }
                else if(action == "delete"){ }
            }
        },
        error: function(xhr, status, error){
            console.error("Failed to send data to server! Error :", error);
        },
    });
}

function getStudentsFromDB(){
    fetch('get_students.php')
    .then(response => response.json())
    .then(data => {
        students = [];
        data.forEach(studentData => {
            var id = parseInt(studentData.id);
            var student = new Student(id, studentData.group, studentData.name, studentData.gender, studentData.birthday, studentData.status, studentData.login, studentData.password);
            students.push(student);
        });
        displayStudents();
    })
    .catch(error => console.error('Error fetching data:', error));
}

function displayStudents() {
    var tableBody = $("#tableId tbody");
    students.forEach(student => {
        var newRow = $("<tr>");
        var newCell1 = $("<td>").html('<input class="Checkboxes" type="checkbox" name="Checkbox' + student.id + '">');
        var newCell2 = $("<td>").text(student.group);
        var newCell3 = $("<td>").text(student.name);
        var newCell4 = $("<td>").text(student.gender);
        var newCell5 = $("<td>").text(student.birthday);
        var newCell6 = $("<td>").html('<input type="radio" name="Status" disabled style="scale: 1.5;">');
        var newCell7 = $("<td>").html('<button id="btnEdit' + student.id + '" onclick="ShowFormEditStudent(' + student.id + ')" class="Buttons">🖊</button><button onclick="deleteRowInTable(this)" class="Buttons">❌</button>');
        newRow.append(newCell1, newCell2, newCell3, newCell4, newCell5, newCell6, newCell7);
        tableBody.append(newRow);
    });

    setStudentsFrontend();
}

function setStudentsFrontend() {
    var userLogin = window.sessionStorage.getItem('userLogin');
    const userLoginElement = document.getElementById('UserLogin');
    if (userLoginElement) {
        userLoginElement.innerHTML = userLogin;
    }
    // Приховую кнопку додавання нового студента, редагування і видалення, якщо НЕ-АДМІН
    if(userLogin !== 'ADMIN'){
        document.getElementById('buttonAddStudent').style.display = 'none';
        document.getElementById('tableId').style.marginTop = '40px';
        var rows = document.querySelectorAll('#tableId tr');
        // Перебираю кожен рядок
        for (var i = 0; i < rows.length; i++) {
            // Отримую всі комірки в рядку
            var cells = rows[i].children;
            // Перевіряю, чи є в рядку достатньо комірок
            if (cells.length >= 7) {
                // Приховую першу комірку (1-й стовпець)
                cells[0].style.display = 'none';
                // Приховую останню комірку (7-й стовпець)
                cells[6].style.display = 'none';
            }
        }
    }   
}

function SubmitUserAuthentication(){
    const loginValue = document.getElementById('login').value;
    const passwordValue = document.getElementById('password').value;
    // Перевірка, чи складаються loginValue і passwordValue з малих літер, за винятком ADMIN
    const isLowerCase = (str) => /^[a-z]+$/.test(str);
    const isLoginValid = isLowerCase(loginValue) || loginValue === "ADMIN";
    if (!isLoginValid) {
        alert('Login should only contain lowercase letters, except for ADMIN');
        return;
    }
    const formData = {
        login: loginValue,
        password: passwordValue
    };
    console.log(formData);
    SendUserAuthentication(formData);
}

function SendUserAuthentication(data){
    const dataToSendJSON = JSON.stringify(data);
    console.log("Sending to server: " + dataToSendJSON);
    $.ajax({
        type: "POST",
        url: "check_user_authentication.php",
        data: dataToSendJSON,
        dataType: "json",
        success: function(response){
            console.log("Authentication data are sent to server successfully!");
            console.log("Server response:", response);
            if(!response.success){
                alert(response.error);
            }
            else{
                alert(response.message);
                console.log(`Hello ${response.login}! You logged in successfully!`);
                var newPageUrl = "students.html";
                window.sessionStorage.setItem('userLogin', response.login); // Зберігаємо логін у sessionStorage
                window.sessionStorage.setItem('userPassword', response.password); // Зберігаємо пароль у sessionStorage
                window.location.href = newPageUrl;
            }
        },
        error: function(xhr, status, error){
            console.error("Failed to send data to server! Error :", error);
        },
    });
}