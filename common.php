<?php
$con=mysql_connect('mysql.sqlpub.com:3306', 'li1023qwq', '81fbc8ed084fb42f') or die("数据库服务器连接失败!<br>");
mysql_select_db('li1023qwq',$con) or die("数据库选择失败！<br>");
mysql_query("set names 'gbk'");//设置中文字符集
?>