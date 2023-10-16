<?php require_once "common.php";?>
<html>
<head><title>修改用户</title>
</head>
<body>
    <h3>修改用户</h3>
    <form id="add_user" name="add_user" method="post" action="update_user.php?user_id=
        <?php echo trim($_GET['user_id']);?>" >
    用户姓名：<input type="text" name="user_name"/><br/>
    用户口令：<input type="text" name="user_psw"/><br/>
    用户性别：<input type="text" name="user_sex"/><br/>
    用户年龄：<input type="text" name="user_age"/><br/>
    所属部门：<select name="user_dept">
    <option value=0>请选择部门</option>
    <?php
    $sql="select * from dept";
    $result=mysql_query($sql,$con);
    while($rows=mysql_fetch_row($result)){
        echo "<option value=".$rows[0].">".$rows[1]."</option>";
    }
    ?>
    </select><br/>
用户组名：<select name="user_group">
    <option value=0>请选择用户组</option>
    <?php
    $sql="select * from usergroup";
    $result=mysql_query($sql,$con);
    while($rows=mysql_fetch_row($result)) {
        echo "<option value=".$row[0].">".$rows[1]."</option>";
    }
    ?>
    </select><br/>
<br/>
<input type="submit" value="修改用户信息"/>
</form>
</body>
</html>
