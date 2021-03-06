require('dotenv').config();
//var getMenu = require('./mysql');
var request = require('request');
var getWeather=require('./crawler');
var querystring = require('querystring');
var weather=new Array();
const db = require('./database');
var temp=0;

getWeather(function(data){
	weather.push(data);
});
/*getMenu(function(result){
	console.log(result);
});*/
var goods_count = new Object(); 
var goods = new Object();
db.getMenu((menu) => {
	menu.forEach((item) => {
		goods[item.item_name] = item.item_price;
		goods_count[item.item_name] = 0;
	});
});
function getLuisIntent(utterance,callback,callbackweather,callbackusr,callbackgift) {
	
    var endpoint =
        "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";

    // Set the LUIS_APP_ID environment variable 
    // to df67dcdb-c37d-46af-88e1-8b97951ca1c2, which is the ID
    // of a public sample application.    
    var luisAppId = 'cfc225d1-232e-49fc-947f-3024fa648676';

    // Set the LUIS_SUBSCRIPTION_KEY environment variable
    // to the value of your Cognitive Services subscription key
    var queryParams = {
        "subscription-key": '508cdbf5b1d2414d87c93d85776db4ee',
        "timezoneOffset": "0",
        "verbose":  true,
        "q": utterance
    }
	
	
	var price = 0; //總金額
    var luisRequest =endpoint + luisAppId +'?' + querystring.stringify(queryParams);
	//中文數字轉成int
	var chnNumChar = {
		零:0,
		一:1,
		二:2,
		三:3,
		四:4,
		五:5,
		六:6,
		七:7,
		八:8,
		九:9,
		兩:2
	};
	//中文數字轉成int
	var chnNameValue = {
		十:{value:10, secUnit:false},
		百:{value:100, secUnit:false},
		千:{value:1000, secUnit:false},
		萬:{value:10000, secUnit:true},
		億:{value:100000000, secUnit:true}
	}
	//中文數字轉成int
	function ChineseToNumber(chnStr){
		var rtn = 0;
		var section = 0;
		var number = 0;
		var secUnit = false;
		var str = chnStr.split('');
		
		if(str[0] == '十')
		{
			str = '一' + str;
			str = str.replace(/,/g, "");
		}

		for(var i = 0; i < str.length; i++){
			var num = chnNumChar[str[i]];
			if(typeof num !== 'undefined'){
				number = num;
				if(i === str.length - 1){
					section += number;
				}
			}else{
				var unit = chnNameValue[str[i]].value;
				secUnit = chnNameValue[str[i]].secUnit;
				if(secUnit){
					section = (section + number) * unit;
					rtn += section;
					section = 0;
				}else{
					section += (number * unit);
				}
				number = 0;
			}
		}
		return rtn + section;
	}

	
    request(luisRequest,
        function (err,
            response, body) {
            if (err)
                console.log(err);
            else {
                var data = JSON.parse(body);
                
                //console.log(`Query: ${data.query}`);
                //console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                if(data.topScoringIntent.intent=='打招呼'){
					
                    callback('您好，我是人工智慧點餐系統，代號為002，很高興為您服務!',price,goods_count,false,false,false);
					var good_string = '';
					for(var i in goods) //顯示菜單
					{
						good_string = good_string + i + ': ' + goods[i] + ' ';
					}
					
					
					callback('以下是菜單的部分'+good_string,price,goods_count,false,false,false);
					
                }
                else if(data.topScoringIntent.intent=='點餐'){
					var sales = data.entities.filter(function(item) {
						return item.type == "商品";
					});
					var quantity = data.entities.filter(function(item) {
						return item.type == "數量";
					});
					var count = data.entities.filter(function(item) {
						return item.type == "量詞";
					});
					
					if(sales.length > 0 && quantity.length > 0 && count.length > 0)
					{
						try
						{
							var int_quantity = ChineseToNumber(quantity[0].entity); //中文數字轉成int
						}
						catch(err)
						{
							callback('抱歉!請您說清楚一點，請附上中文數量(一個,三杯...etc)',price,goods_count,false,false,false);
							return;
						}
						if(typeof goods[sales[0].entity] !== 'undefined') //計算金額和數量
						{
							callback('好的，已為您點了'+quantity[0].entity+count[0].entity+sales[0].entity,price,goods_count,false,false,false);
							//計算數量
							goods_count[sales[0].entity] = int_quantity;
							//計算金額
							price = price + (goods[sales[0].entity]*int_quantity);
							callback('您點了'+goods[sales[0].entity]*int_quantity+'元',price,goods_count,true,false,false);
						}
						else
						{
							callback('抱歉!沒有這項商品呢',price,goods_count,false,false,false);
						}
					}
					else
					{
						callback('抱歉!請您說清楚一點，請附上中文數量(一個,三杯...etc)',price,goods_count,false,false,false);
					}
                }
				else if(data.topScoringIntent.intent=='點餐確認')
				{
					callback('',price,goods_count,false,false,true);
				}
				else if(data.topScoringIntent.intent=='取消商品') //取消點餐
				{
					var sales = data.entities.filter(function(item) {
						return item.type == "商品";
					});
					var quantity = data.entities.filter(function(item) {
						return item.type == "數量";
					});
					var count = data.entities.filter(function(item) {
						return item.type == "量詞";
					});
					if(sales.length > 0 && quantity.length > 0 && count.length > 0)//做到這---------------------------
					{
						try
						{
							var int_quantity2 = ChineseToNumber(quantity[0].entity); //中文數字轉成int
						}
						catch(err)
						{
							callback('抱歉!請您說清楚一點，您是要取消多少呢?',price,goods_count,false,false,false);
							return;
						}
						if(typeof goods[sales[0].entity] !== 'undefined') //計算金額
						{
							//計算數量
							goods_count[sales[0].entity] = -int_quantity2;
							//計算金額
							price = price + (goods[sales[0].entity]*int_quantity2);
							price = price*(-1);
							callback('好的，為您取消'+quantity[0].entity+count[0].entity+sales[0].entity,price,goods_count,true,false,false);
						}
						else
						{
							callback('抱歉!沒有這項商品呢',price,goods_count,false,false,false);
						}
					}
					else if(sales.length > 0)
					{
						var sales = data.entities.filter(function(item) {
							return item.type == "商品";
						});
						if (sales.length >0)
						{
							if(typeof goods[sales[0].entity] !== 'undefined') //計算金額和數量
							{
								callback('好的，為您取消'+sales[0].entity,price,sales[0].entity,true,false,false);
							}
							else
							{
								callback('抱歉!沒有這項商品呢',price,goods_count,false,false,false);
							}
						}
						else
						{
							callback('抱歉!請您說清楚一點，您是要取消什麼呢?',price,goods_count,false,false,false);
						}
					}
					else
					{
						callback('抱歉!請您說清楚一點，您是要取消多少呢?',price,goods_count,false,false,false);
					}
				}
                else if(data.topScoringIntent.intent=='結帳'){
                    callback('您的訂單已完成',price,goods_count,false,true,false);
				}
				else if(data.topScoringIntent.intent=='推薦'){
					callbackweather(weather[0],weather[2],weather[3]);
				}
				else if(data.topScoringIntent.intent=='詢問使用者'){
					callbackusr();
				}
				else if(data.topScoringIntent.intent=='送禮'){
					var sales = data.entities.filter(function(item) {
						return item.type == "商品";
					});
					var quantity = data.entities.filter(function(item) {
						return item.type == "數量";
					});
					var count = data.entities.filter(function(item) {
						return item.type == "量詞";
					});
					var user=data.entities.filter(function(item) {
						return item.type == "使用者";
					});
					if(sales.length > 0 && quantity.length > 0 && count.length > 0 && user.length>0)
					{
						try
						{
							var int_quantity = ChineseToNumber(quantity[0].entity); //中文數字轉成int
						}
						catch(err)
						{
							callback('抱歉!請您說清楚一點，請附上中文數量(一個,三杯...etc)',price,goods_count,false,false,false);
							return;
						}
						if(typeof goods[sales[0].entity] !== 'undefined') //計算金額和數量
						{
							goods_count[sales[0].entity] = int_quantity;
							//計算金額
							price = price + (goods[sales[0].entity]*int_quantity);
							//callback('總共是'+goods[sales[0].entity]*int_quantity+'元',price,goods_count,true,false,false);
							callbackgift(sales[0].entity,int_quantity,count[0].entity,price,user[0].entity);
						}
						else
						{
							callback('抱歉!沒有這項商品呢',price,goods_count,false,false,false);
						}
					}
					else
					{
						callback('抱歉!請您說清楚一點，請附上中文數量(一個,三杯...etc)',price,goods_count,false,false,false);
					}
					//callbackusr(sales[0].entity,quantity[0].entity,count[0].entity,user[0].entity);
					//console.log(sales[0].entity+' '+quantity.entity+' '+count.entity+' '+user.entity);
				}
                else if(data.topScoringIntent.intent=='None'){
                    callback("不好意思，請您說清楚一點",price,goods_count,false,false,false);
				}
				
                
                
                //console.log('Intents:');
                //console.log(data.intents);
            }
        });
}
module.exports=getLuisIntent;
// Pass an utterance to the sample LUIS app
//getLuisIntent('我要一份大麥克');
