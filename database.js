const mysql = require('mysql');
const conn = mysql.createConnection({
    host     : '140.138.77.98',
    user     : 'yzujava201609',
    password : 'm0654284vm,6java',
    database : '2017_JAVA'
});


module.exports = {
    getMenu(callback) {
        var menu = new Array();
        conn.query('SELECT item_id, item_name, item_price FROM AIBotMenu', (error, results, fields)=> {
            if(error) {
                console.log(error.message)
                return ;
            }
            results.forEach((element) => {
                menu.push(element);
            });
            
            callback(menu);
        });
        
    }
}

