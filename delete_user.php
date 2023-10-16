<?php require_once "common.php";?>
<html>
<head><title>删除用户</title>
</head>
<body>
    <?php
    $user_id=trim($_GET['user_id']);
    $sql="DELETE FROM users WHERE user_id=";
    $sql=$sql.$user_id;
    if(mysql_query($sql,$con))
        echo "用户删除成功！<br>";
    else
        echo "用户删除失败！<br>";
    ?>
</body>
</html>