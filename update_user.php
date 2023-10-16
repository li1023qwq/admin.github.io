<?php require_once "common.php";
$user_id=trim($_GET['user_id']);
$user_name=trim($_POST['user_name']);
$user_psw=trim($_POST['user_psw']);
$user_sex=trim($_POST['user_sex']);
$user_age=trim($_POST['user_age']);
$user_dept=trim($_POST['user_dept']);
$user_group=trim($_POST['user_group']);
$sql="UPDATE users SET user_name='".$user_name."',user_psw='".$user_psw."',user_sex='".$user_sex."',user_age='".$user_age."',user_dept='".$user_dept."',user_group='".$user_group."'  WHERE user_id=";
$sql=$sql.$user_id;
if(mysql_query($sql,$con))
    echo "用户修改成功!<br>";
else
    echo "用户修改失败!<br>";
?>