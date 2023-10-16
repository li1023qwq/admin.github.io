<?php require_once "common.php";?>
<html>
<head><title>查看用户</title>
</head>
<body>
<h3>查看用户</h3>
<form id="show_user" name="show_user" method="post" action="select_user.php">
用户姓名：<input type="text" name="show_user_name"/><br/>
所属部门：<select name="show_user_dept">
<option value=0>所有部门</option>
<?php
$sql="select * from dept";
$result=mysql_query($sql,$con);
while($rows=mysql_fetch_row($result)){
echo "<option value=".$rows[0].">".$rows[1]."</option>";
}
?>
</select><br/>
<br/>
<input type="submit" value="查看"/>
</form>
</body>
</html>