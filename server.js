const express = require('express');
const app = express(); //建立一個Express伺服器
const server = require('http').Server(app);
const io = require('socket.io')(server);
var getLuisIntent = require('./luis');
//var userpool=[];
var socketpool=[];
var goods = {起士漢堡:50,奶茶:30,麥香雞:55}; //菜單
var goods_count = {起士漢堡:0,奶茶:0,麥香雞:0}; //點餐的數量，預設為0
function checkusr(name){
	if(socketpool.length==0){
		return -1;
		//裡面為空
	}
	else {
		for(i=0;i<socketpool.length;i++){
			if(socketpool[i].nickname==name)
			{	
				//返回找到的那個index
				return i;
			}
		}
		//找不到
		return -1;
	}
}
io.on('connection', (socket) => {
	
    //socket是指連入的這個socket
    //io.emit對全體廣播
    //socket.broadcast.emit對自己以外的全體做廣播
	

    //登入事件
    socket.on("login",(msg)=>{
		
        
		if(checkusr(msg)!=-1){
			socket.emit("nickNameExist");
		}
        else {
            //成功
             //socket.userIndex = userpool.length;
			 socket.nickname=msg;
			 socketpool.push(socket);
             //userpool.push(msg);
             //對自己發送登入成功 解開黑窗
             socket.emit("loginSuccess",msg);
             //改變全體人數框
             io.emit('system', msg, socketpool.length, 'login');
        }
    });


    //離開事件
    socket.on('disconnect', () => {
		var i=checkusr(socket.nickname);
		socketpool.splice(i,1);
		socket.broadcast.emit('system', socket.nickname, socketpool.length, 'logout');
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
			getLuisIntent(temp[1],function(msg,price,count,check,closing,check_good){
				if(check_good == false)
				{
					socket.emit("luis",'麥噹噹',msg,'blue');
				}
				else
				{
					var good_str = '';
					for(var i in goods_count)
					{
						if(goods_count[i] != 0)
						{
							good_str = good_str + i + ': ' + goods_count[i] + '<br>';
						}
					}
					if(good_str == '')
					{
						socket.emit("luis",'麥噹噹','您沒有點任何餐點呢','blue');
					}
					else
					{
						socket.emit("luis",'麥噹噹','以下是您點的餐點','blue');
						socket.emit("luis",'麥噹噹',good_str,'blue');
						socket.emit("luis",'麥噹噹','目前總金額為'+sum_price+'元','blue');
					}
				}
				sum_price = sum_price + price;
				if(check == true)
				{
					if(typeof count !== 'string')
					{
						for(var i in count)
						{
							goods_count[i] = goods_count[i] + count[i];
							if(goods_count[i] < 0) //數量不能為負
							{
								goods_count[i] = goods_count[i] - count[i];
								socket.emit("luis",'麥噹噹','不好意思，這邊發現您點了'+i+goods_count[i]+'個，不能取消'+(-count[i])+'個','blue');
								sum_price = sum_price - price;
								break;
							}
						}
					}
				   else
				   {
					   sum_price = sum_price - goods[count]*goods_count[count];
					   goods_count[count] = 0;
				   }
					socket.emit("luis",'麥噹噹','目前總金額為'+sum_price+'元','blue');
			   }
			   else if(closing == true)
			   {
					socket.emit("luis",'麥噹噹','總共是'+sum_price+'元，謝謝惠顧','blue');
					sum_price = 0;
					for(var i in goods_count)
					{
						goods_count[i] = 0;
					}
			   }
            },function(temperature,feel,Rain_probability){
				//console.log(typeof (Rain_probability-'%'));
				var T=temperature.split("~")
				if(T[1]>30){
					socket.emit("luis",'機器人','溫度: '+temperature+'降雨機會'+Rain_probability+'不行!! 真是太熱了 快來支冰淇淋吧','blue')
				}
				else if((Rain_probability-'%')>40&&T[1]>28){
					socket.emit("luis",'機器人','溫度: '+temperature+'降雨機會'+Rain_probability+'又熱又悶清涼可口的可樂吧','blue')
				}
				else{
					socket.emit("luis",'機器人','溫度:'+temperature+'降雨機會:'+Rain_probability+'舒適度: '+feel+' 我們的餐點當然是好吃無比','blue');
				}
				
			},function(){
				var userstr='';
				for(i=0;i<socketpool.length;i++){
					userstr+=socketpool[i].nickname+',';
				}
				userstr = userstr.slice(0,-1);
				socket.emit("luis",'機器人','偷偷告訴你...裡面有'+userstr,'blue');
				//去除最後的,
				
			},function(sale,quantity,count,price,usr){
				var idx=checkusr(usr);
				if(idx==-1){
					socket.emit("luis","機器人",'找不到'+usr+'這個使用者...請確認','blue');
				}
				else
				{
				socketpool[idx].emit("luis","機器人","有人送了"+quantity+count+sale+'給你嘿嘿不告訴你是誰...');
				socket.emit("luis","機器人",quantity+count+price+'元的'+sale+'被送給了'+usr);
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