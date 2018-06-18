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
	
	var goods = {起士漢堡:50,奶茶:40}; //菜單
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
                    callback('您好，我是人工智慧點餐系統，代號為002，很高興為您服務!',price,false);
                }
                else if(data.topScoringIntent.intent=='點餐'){
					if(data.entities[0].entity != null && data.entities[1].entity != null && data.entities[2].entity != null)
					{
						var int_quantity = ChineseToNumber(data.entities[1].entity); //中文數字轉成int
						callback('好的，已為您點了'+data.entities[1].entity+data.entities[2].entity+data.entities[0].entity,price,false);
						if(typeof goods[data.entities[0].entity] !== 'undefined') //計算金額
						{
							price = price + (goods[data.entities[0].entity]*int_quantity);
							callback('您點了'+goods[data.entities[0].entity]*int_quantity+'元',price,true);
						}
					}
					else
					{
						callback('抱歉!請您說清楚一點，請附上數量(一個,三杯...etc)',price,false);
					}
                }
                else if(data.topScoringIntent.intent=='結帳'){
                    callback('謝謝惠顧',price,false);
                }
                else if(data.topScoringIntent.intent=='None'){
                    callback("不好意思，請您說清楚一點",price,false);
                }
                
                
                //console.log('Intents:');
                //console.log(data.intents);
            }
        });
}
module.exports=getLuisIntent;
// Pass an utterance to the sample LUIS app
//getLuisIntent('我要一份大麥克');
