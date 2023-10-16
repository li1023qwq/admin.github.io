<?php
//获取提交数据
$username=$_POST['username'];//获取提交用户名
$password=$_POST['password'];//获取提交密码

//连接数据库
$db_host="mysql.sqlpub.com";//填写自己的数据库地址
$db_user="li1023qwq";//填写自己的数据库用户名
$db_pwd="81fbc8ed084fb42f";//填写自己的数据库密码
$db_name="li1023qwq";填写自己的数据库库名
$db_port=3306;//数据库端口号，默认3306

$con=mysqli_connect($db_host,$db_user,$db_pwd,$db_name,$db_port);//连接数据库，且定位到指定数据库
if(!$con){
  die("error:".mysqli_connect_error());//返回最近调用函数的最后一个错误描述。
  } //如果连接失败就报错并且中断程序

if($username==null||$password==null){
    echo "<script>alert('不要乱填啊')</script>";//弹出消息框
    die("账号和密码不能为空!");//结束并返回文本
}//判断用户名和密码是不是空的

$sql='select * from user where username='."'{$username}'and password="."'$password';";
  $res=mysqli_query($con,$sql);
  $row=$res->num_rows; //将获取到的用户名和密码拿到数据库里面去查找匹配
  if($row!=0)
  {
      echo "<h1>登录成功，欢迎您&nbsp{$username}！</h1>";
  }
  else
  {
      echo "用户名或密码错误";
  }
  ?>
