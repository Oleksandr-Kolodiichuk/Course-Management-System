<?php
$db_servername = "localhost";
$db_username = "root";
$db_password = "";
$db_name = "studentsdb";
$conn = new mysqli($db_servername, $db_username, $db_password, $db_name);
if ($conn->connect_error){
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT * FROM students";
$result = $conn->query($sql);
$students = array();
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
}

echo json_encode($students);
$conn->close();
?>