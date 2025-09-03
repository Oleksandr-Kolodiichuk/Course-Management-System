<?php

function addStudent($conn, $studentData) {
    $group = $studentData['group'];
    $name = $studentData['name'];
    $gender = $studentData['gender'];
    $birthday = $studentData['birthday'];
    $login = $studentData['login'];
    $password = $studentData['password'];
    // Перевірка, чи всі літери логіна є малими
    if ($login !== strtolower($login)) {
        $response = array("success" => false, "error" => "Login must be all lowercase");
        echo json_encode($response);
        exit;
    }
    // Перевірка, чи існує користувач з таким самим логіном
    $checkLoginQuery = "SELECT * FROM students WHERE login = '$login'";
    $result = $conn->query($checkLoginQuery);
    if ($result->num_rows > 0) {
        $response = array("success" => false, "error" => "Login $login already exists");
        echo json_encode($response);
        exit;
    }
    $sql = "INSERT INTO students (`group`, `name`, `gender`, `birthday`, `login`, `password`) VALUES ('$group', '$name', '$gender', '$birthday', '$login', '$password')";
    if ($conn->query($sql) === TRUE) {
        $last_insert_id = $conn->insert_id;
        $response = array("success" => true, "message" => "Student added successfully.", "last_insert_id" => $last_insert_id);
        return json_encode($response);
    } else {
        $response = array("success" => false, "error" => "Error adding student: " . $conn->error);
        return json_encode($response);
    }
}

function deleteStudent($conn, $deletedId) {
    $sql = "DELETE FROM students WHERE id = $deletedId";
    if ($conn->query($sql) === TRUE) {
        $response = array("success" => true, "message" => "Student deleted successfully.", "deletedId" => $deletedId);
        return json_encode($response);
    } else {
        $response = array("success" => false, "error" => "Error deleting student: " . $conn->error);
        return json_encode($response);
    }
}

function editStudent($conn, $editedId, $newStudentData) {
    $group = $newStudentData['group'];
    $name = $newStudentData['name'];
    $gender = $newStudentData['gender'];
    $birthday = $newStudentData['birthday'];
    $login = $newStudentData['login'];
    $password = $newStudentData['password'];
    // Перевірка, чи всі літери логіна є малими
    if ($login !== strtolower($login)) {
        $response = array("success" => false, "error" => "Login must be all lowercase");
        echo json_encode($response);
        exit;
    }
    // Перевірка, чи існує користувач з таким самим логіном
    $checkLoginQuery = "SELECT * FROM students WHERE login = '$login' AND id != $editedId";
    $result = $conn->query($checkLoginQuery);
    if ($result->num_rows > 0) {
        $response = array("success" => false, "error" => "Login $login already exists");
        echo json_encode($response);
        exit;
    }
    $sql = "UPDATE students SET `group` = '$group', `name` = '$name', `gender` = '$gender', `birthday` = '$birthday', `login` = '$login', `password` = '$password' WHERE id = $editedId";
    if ($conn->query($sql) === TRUE) {
        $response = array("success" => true, "message" => "Student updated successfully.", "editedId" => $editedId);
        return json_encode($response);
    } else {
        $response = array("success" => false, "error" => "Error updating student: " . $conn->error);
        return json_encode($response);
    }
}

//Перевірка, чи прийшли дані через POST
if ($_SERVER["REQUEST_METHOD"] == "POST"){
    // Отримання JSON даних від клієнта
    $json_data = file_get_contents('php://input');
    // Перетворення JSON у асоціативний масив PHP
    $data = json_decode($json_data, true);
    if ($data === null && json_last_error() != 0){
        // Якщо сталася помилка при розкодуванні JSON
        $response = array("success" => false, "error" => "Error decoding JSON data");
        echo json_encode($response);
        exit;
    }
    // Отримання значення action
    $action = $data['action'];
    // Отримання JSON даних про студентів
    $students = $data['studentJSON'];

    //Валідація даних студента
    foreach ($students as $student){
        //Перевірка наявності обов'язкових полів та їх коректність
        if (!isset($student['group']) || !isset($student['name']) || !isset($student['gender']) || !isset($student['birthday']) || !isset($student['login']) || !isset($student['password']) ||
            empty($student['group']) || empty($student['name']) || empty($student['gender']) || empty($student['birthday']) || empty($student['login']) || empty($student['password'])){
                $response = array("success" => false, "error" => "One or more fields are empty");
                echo json_encode($response);
                exit;
        }
        //Розбиваємо ім'я та прізвище на слова
        $name_parts = explode(" ", $student['name']);
        //Перевірка кожного слова в імені та прізвищі
        foreach ($name_parts as $part){
            //Перевірка, чи містить слово лише літери
            if (!preg_match("/^[a-zA-Z]+$/", $part)){
                $response = array("success" => false, "error" => "Name and surname must contain only letters!");
                echo json_encode($response);
                exit;
            }
        }
        //Розбиваємо рік народження та перевіряємо, чи він менший за 2008
        $birth_year = date("Y", strtotime($student['birthday']));
        if ($birth_year >= 2008){
            $response = array("success" => false, "error" => "Birth year must be before 2008!");
            echo json_encode($response);
            exit;
        }
        if($student['login'] == 'ADMIN'){
            $response = array("success" => false, "error" => "Login of student should not be ADMIN (it's login with premium access)!");
            echo json_encode($response);
            exit;
        }
    }
    $response = array("success" => true);

    //Робота з базою даних (розширення mysqli)
    //http://localhost/phpmyadmin/index.php?route=/sql&pos=0&db=studentsdb&table=students
    //ALTER TABLE students AUTO_INCREMENT = 1;

    $db_servername = "localhost";
    $db_username = "root";
    $db_password = "";
    $db_name = "studentsdb";
    try{
        $conn = new mysqli($db_servername, $db_username, $db_password, $db_name);
        if ($conn->connect_error){
            throw new Exception("Could not connect to database! Error: " . $conn->connect_error);
        }
        else{
            $response["messageFromDB"] = "Successfully connected to database.";

        foreach ($students as $student){
        switch ($action) {
            case 'add':
                $addResponse = addStudent($conn, $student);
                $addResponseArray = json_decode($addResponse, true);
                if ($addResponseArray['success']) {
                    $response['action'] = $addResponseArray['message'];
                    $response['id'] = $addResponseArray['last_insert_id'];
                } else {
                    $response['action'] = $addResponseArray['error'];
                }
                break;
            case 'edit':
                $editResponse = editStudent($conn, $student['id'], $student);
                $editResponseArray = json_decode($editResponse, true);
                if ($editResponseArray['success']) {
                    $response['action'] = $editResponseArray['message'];
                    $response['editedId'] = $editResponseArray['editedId'];
                } else {
                    $response['action'] = $editResponseArray['error'];
                }
                break;
            case 'delete':
                $deletedId = $student['id'];
                $deleteResponse = deleteStudent($conn, $deletedId);
                $deleteResponseArray = json_decode($deleteResponse, true);
                if ($deleteResponseArray['success']) {
                    $response['action'] = $deleteResponseArray['message'];
                    $response['deletedId'] = $deleteResponseArray['deletedId'];
                } else {
                    $response['action'] = $deleteResponseArray['error'];
                }
                break;
            default:
                $response['action'] = array("success" => false, "error" => "Invalid action specified");
                echo json_encode($response);
                exit;
            }
        }
            echo json_encode($response);
        }
    }
    catch (Exception $e){
        $response = array("success" => false, "error" => $e->getMessage());
        echo json_encode($response);
        exit;
    }
    } 
    else{
        //Якщо отримано не POST-запит, відправити помилку
        $response = array("success" => false, "error" => "Invalid request method");
        echo json_encode($response);
    }
?>