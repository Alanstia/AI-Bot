
window.onload = function() {
    //載入時初始化
    var hichat = new HiChat();
    hichat.init();
};

//定义我们的hichat类
var HiChat = function() {
    this.socket = null;
    this.nickNamename;
};

//添加方法
HiChat.prototype = {
   
    init: function() {
        var that = this;
        //console.log(that);
        //建立到服务器的socket連接
        this.socket = io.connect();
        //監聽'connect'事件
        this.socket.on('connect', function() 
        {
            //連到server 改變info
            document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
            //加入btn監聽事件
			document.getElementById('loginBtn').addEventListener('click', function() {
				var nickName = document.getElementById('nicknameInput').value;
				//檢查輸入框是否為空
				if (nickName.trim().length != 0) {
				//不為空發送login到server
                that.socket.emit('login', nickName);
				} 
				else {
				//空
                document.getElementById('nicknameInput').focus();
				};
            }, false);



            //圖片按下送出
            document.getElementById('sendImage').addEventListener('change', function() {
               
                if( typeof FileReader == "undefined" ){ 
                    alert( "瀏覽器不支援！" );  
                }
                else
                { 
                    
                    if(this.files.length!=0)
                    {  
                        var file = this.files[0],
                        reader = new FileReader(); 
                        //註冊事件讀取完成觸發
                        reader.onload = function(e) {
                        /*console.log(e);
                        console.log(e.target);
                        console.log(e.target.result);*/
                          this.value = '';
                          that.socket.emit('img', e.target.result);
                          that._displayImage('me', e.target.result);
                         };
                         
                         reader.readAsDataURL(file);
                    }
                } 
             }, false);
             //clear
             document.getElementById('clearBtn').addEventListener('click',function(){
                var msg = document.getElementById('historyMsg');
                while (msg.firstChild) {
                 msg.removeChild(msg.firstChild);
                }
            });
            //訊息按下送出
            document.getElementById('sendBtn').addEventListener('click',function(){
                var msg = document.getElementById('messageInput').value;
                var color = document.getElementById('colorStyle').value;
                if(msg.trim().length!=0)
                {
                    //訊息不為空
                that._displayNewMsg('me',msg,color);
                that.socket.emit('send',msg,color);
                }
            });
            //nickname輸入 ENTER
            document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
                if (e.keyCode == 13) {
                    var nickName = document.getElementById('nicknameInput').value;
                    if (nickName.trim().length != 0) {
                        that.socket.emit('login', nickName);
                    };
                };
            }, false);
            //messageInput enter
            document.getElementById('messageInput').addEventListener('keyup', function(e) {
                var messageInput = document.getElementById('messageInput'),
                    msg = messageInput.value,
                    color = document.getElementById('colorStyle').value;
                if (e.keyCode == 13 && msg.trim().length != 0) {
                    messageInput.value = '';
                    that.socket.emit('send', msg, color);
                    that._displayNewMsg('me', msg, color);
                };
            }, false);
        });
        //收到廣播圖片
        this.socket.on('postImg',function(user,img){
            that._displayImage(user,img);
        });
        //收到廣播消息
        this.socket.on('postMsg',function(user,msg,color){
            that._displayNewMsg(user,msg,color);
        });
        this.socket.on('nickNameExist', function() {
            document.getElementById('info').textContent = '用戶名已存在'; //ID已存在
        });
        this.socket.on('loginSuccess', function(msg) {
            alert(msg+'歡迎使用');
            document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';//隐藏遮罩层显聊天界面
            document.getElementById('messageInput').focus();//让消息输入框获得焦点
        });
        this.socket.on('luis',function(user,msg,color){
            that._displayNewMsg(user,msg,color);
        });
        this.socket.on('system', function(nickName, userCount, type) {
            
            //系統消息
            var msg = nickName + (type == 'login' ? ' joined' : ' left');
            that._displayNewMsg('system', msg, 'red');
            var status=document.getElementById('status');
            status.className='condition';
            status.textContent='連線人數: '+userCount+'人';
           
            //將在線人數至頂
           
        });
        
    },
    _displayNewMsg: function(user, msg, color) {
        var container = document.getElementById('historyMsg');
        //創存放的DIV
        var msgToDisplay = document.createElement('div');
        //得到時間
        var date = new Date().toTimeString().substr(0,8);
        msgToDisplay.className='mwt_border'; 
        if(user=='system')
        {
            msgToDisplay.innerHTML=user+'<span class="timespan">(' + date + '): </span>' + msg;
            msgToDisplay.style.marginLeft='100px';
        }
        else if(user=='me')
        {
            msgToDisplay.innerHTML='<span class="arrow_r_int"></span><span class="arrow_r_out"></span>' +user + '<span class="timespan">(' + date + '): </span>' + msg;
            msgToDisplay.style.marginLeft='150px';
        }
        else{
        msgToDisplay.innerHTML= '<span class="arrow_l_int"></span><span class="arrow_l_out"></span>' +user + '<span class="timespan">(' + date + '): </span>' + msg;
        }
       
        msgToDisplay.style.color = color || '#000';
        console.log(msgToDisplay);
        /*if(user=='me'){
            msgToDisplay.style.paddingLeft='200px';
        }*/
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
        msgToDisplay = document.createElement('p'),
        date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/><img src="' + imgData + '"/>';
        console.log(msgToDisplay);
        
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    }
};
