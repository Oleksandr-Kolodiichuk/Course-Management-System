<?php
if ($_SERVER["REQUEST_METHOD"] == "POST"){
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);
    if ($data === null && json_last_error() != 0){
        $response = array("success" => false, "error" => "Error decoding JSON data!");
        echo json_encode($response);
        exit;
    }
    if (isset($data['login']) && isset($data['password'])){
        $login = $data['login'];
        $password = $data['password'];
        if (empty($login) || empty($password)){
            $response = array("success" => false, "error" => "Login or password cannot be empty!");
            echo json_encode($response);
            exit;
        }
        $db_servername = "localhost";
        $db_username = "root";
        $db_password = "";
        $db_name = "studentsdb";
        $conn = new mysqli($db_servername, $db_username, $db_password, $db_name);
        if ($conn->connect_error){
            $response = array("success" => false, "error" => "Connection failed: " . $conn->connect_error);
            echo json_encode($response);
            exit;
        }
        if($login == 'ADMIN' && $password == '1816')
        {
            $sql = "SELECT * FROM premiumusers WHERE login = '$login' AND password = '$password'";
            $result = $conn->query($sql);
            if ($result->num_rows == 1) {
                $response = array("success" => true, "message" => "Authentication successful! You are in ADMIN mode!", "login" => $login, "password" => $password);
                echo json_encode($response);
            }
            else {
                $response = array("success" => false, "error" => "Authentication failed! Can't match login or password!");
                echo json_encode($response);
            }
        }
        else{
            $sql = "SELECT * FROM students WHERE login = '$login' AND password = '$password'";
            $result = $conn->query($sql);
            if ($result->num_rows == 1) {
                $response = array("success" => true, "message" => "Authentication successful!", "login" => $login, "password" => $password);
                echo json_encode($response);
            }
            else {
                $response = array("success" => false, "error" => "Authentication failed! Can't match login or password!");
                echo json_encode($response);
            }
        }
    }
    else{
        $response = array("success" => false, "error" => "No appropriate keys found!");
        echo json_encode($response);
    }
}
else{
    $response = array("success" => false, "error" => "Only POST requests are allowed!");
    echo json_encode($response);
}
?>