var superagent=require('superagent');
var cheerio=require('cheerio');

function getWeather(callback){
    superagent.get('https://www.cwb.gov.tw/V7/forecast/taiwan/Taoyuan_City.htm')
	 .end(function(err,sres){
		if (err) {
		console.log('err');
        return next(err);
        }
        var $ = cheerio.load(sres.text);
        var element=$('.FcstBoxTable01').find('tbody').find('td');//鎖定位置
        //var items = new Array[];
       
    
        element.each(function (idx, elm) {
            if(idx==12)
            {
                return false;
                //只要第一個table
            }
            if(idx%4==1){
                const title = $(elm).find('img').attr('src');
                callback(title);
                //console.log(idx+' '+title);
            }
            else{
                const title = $(elm).text();
                callback(title);
                //console.log(idx+' '+title);
            }        
        });
    });  
}
module.exports=getWeather;
