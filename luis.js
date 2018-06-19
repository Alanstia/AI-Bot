require('dotenv').config();

var request = require('request');
var querystring = require('querystring');

function getLuisIntent(utterance,callback) {
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
	
	var goods = {起士漢堡:50,奶茶:30,麥香雞:55}; //菜單
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
                
                console.log(`Query: ${data.query}`);
                console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                if(data.topScoringIntent.intent=='打招呼'){
                    callback('您好，我是人工智慧點餐系統，代號為002，很高興為您服務!',price,false,false);
                }
                else if(data.topScoringIntent.intent=='點餐'){
					if(data.entities[0].entity != null && data.entities[1].entity != null && data.entities[2].entity != null)
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
						
						try
						{
							var int_quantity = ChineseToNumber(quantity[0].entity); //中文數字轉成int
						}
						catch(err)
						{
							callback('抱歉!請您說清楚一點，請附上中文數量(一個,三杯...etc)',price,false,false);
							return;
						}
						callback('好的，已為您點了'+quantity[0].entity+count[0].entity+sales[0].entity,price,false,false);
						if(typeof goods[sales[0].entity] !== 'undefined') //計算金額
						{
							price = price + (goods[sales[0].entity]*int_quantity);
							callback('您點了'+goods[sales[0].entity]*int_quantity+'元',price,true,false);
						}
					}
					else
					{
						callback('抱歉!請您說清楚一點，請附上中文數量(一個,三杯...etc)',price,false,false);
					}
                }
				else if(data.topScoringIntent.intent=='取消商品')
				{
					if(data.entities[0].entity != null && data.entities[1].entity != null && data.entities[2].entity != null)
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

						try
						{
							var int_quantity2 = ChineseToNumber(quantity[0].entity); //中文數字轉成int
						}
						catch(err)
						{
							callback('抱歉!請您說清楚一點，您是要取消多少呢?',price,false,false);
							return;
						}
						if(typeof goods[sales[0].entity] !== 'undefined') //計算金額
						{
							price = price + (goods[sales[0].entity]*int_quantity2);
							price = price*(-1);
							callback('好的，已為您取消了'+quantity[0].entity+count[0].entity+sales[0].entity,price,true,false);
						}
					}
					else
					{
						callback('抱歉!請您說清楚一點，您是要取消多少呢?',price,false,false);
					}
				}
                else if(data.topScoringIntent.intent=='結帳'){
                    callback('您的訂單已完成',price,false,true);
                }
                else if(data.topScoringIntent.intent=='None'){
                    callback("不好意思，請您說清楚一點",price,false,false);
                }
                
                
                //console.log('Intents:');
                //console.log(data.intents);
            }
        });
}
module.exports=getLuisIntent;
// Pass an utterance to the sample LUIS app
//getLuisIntent('我要一份大麥克');
