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

    var luisRequest =endpoint + luisAppId +'?' + querystring.stringify(queryParams);



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
                    callback('您好，我是人工智慧點餐系統，代號為002，很高興為您服務!');
                }
                else if(data.topScoringIntent.intent=='點餐'){
                    callback('好的，已為您點了'+data.entities[0].entity+data.entities[1].entity);
                }
                else if(data.topScoringIntent.intent=='結帳'){
                    callback('謝謝惠顧');
                }
                else if(data.topScoringIntent.intent=='None'){
                    callback("不好意思，我目前聽不懂這個詞呢");
                }
                
                
                //console.log('Intents:');
                //console.log(data.intents);
            }
        });
}
module.exports=getLuisIntent;
// Pass an utterance to the sample LUIS app
//getLuisIntent('我要一份大麥克');