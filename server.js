const express = require('express');
const app = express(); //建立一個Express伺服器
const server = require('http').Server(app);
const io = require('socket.io')(server);
var getLuisIntent = require('./luis');
var userpool=[];


io.on('connection', (socket) => {
    //socket是指連入的這個socket
    //io.emit對全體廣播
    //socket.broadcast.emit對自己以外的全體做廣播


    //登入事件
    socket.on("login",(msg)=>{
		
        if(userpool.indexOf(msg) > -1){
            //使用者已存在-->失敗
             socket.emit("nickNameExist");
        }
        else {
            //成功
             socket.userIndex = userpool.length;
             socket.nickname=msg;
             userpool.push(msg);
             //對自己發送登入成功 解開黑窗
             socket.emit("loginSuccess",msg);
             //改變全體人數框
             io.emit('system', msg, userpool.length, 'login');
        }
    });


    //離開事件
    socket.on('disconnect', () => {
        userpool.splice(socket.userIndex, 1);
        console.log(userpool);
		socket.broadcast.emit('system', socket.nickname, userpool.length, 'logout');
        console.log(socket.nickname+'Bye~');  // 顯示 bye~
    }); 
    
    var sum_price = 0;
    //發生send事件
	socket.on("send", (msg,color) => {
        //io.emit('postMsg','io',msg);
        var temp=msg.split(" ");
        if(temp[0]=='!機器人幫我')
       {
		   if(temp[1] != null)
		   {
			getLuisIntent(temp[1],function(msg,price,check,closing){
               socket.emit("luis",'機器人',msg,'blue');
			   sum_price = sum_price + price;
			   if(check == true)
			   {
					socket.emit("luis",'機器人','目前總金額為'+sum_price+'元','blue');
			   }
			   else if(closing == true)
			   {
					socket.emit("luis",'機器人','總共是'+sum_price+'元，謝謝惠顧','blue');
			   }
            })
		   }
       }
       else{
        socket.broadcast.emit('postMsg',socket.nickname,msg,color);
       }
    });	


    //圖片的事件
    socket.on("img", (img) => {
        //io.emit('postMsg','io',msg);
        socket.broadcast.emit('postImg',socket.nickname,img);
    });

});


app.get('/', (req, res) => {
    res.sendFile( __dirname + '/views/index.html');
    
});
app.use(express.static(__dirname + '/public'));
//配置靜態資源
server.listen(3000, function () {
    console.log('Example app is running on port 3000!');}
  ); //告訴server聽取3000這個Port
