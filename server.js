//Passwords obfuscated using only https protocol

var express = require('express'),
app = express(),
        port = process.env.PORT || 3000;

var https = require('https');
var fs = require('fs');

const sleep = (s) => {
  return new Promise(resolve => setTimeout(resolve, (s*1000)))
}

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var path = require('chromedriver').path;

var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

const screen = {
   width: 1366,
   height: 768
};

var options = {
        key: fs.readFileSync("/var/pronote/server.key"), //you must have https certificate in this directory
        cert: fs.readFileSync("/var/pronote/server.cert")
};

https.createServer(options,app).listen(port);

app.post('/login',(req, res)=>{

    (async()=>{
        var usr = req.body.username;
        var opt = req.body.opt; //student --> "std"  professor --> "doc"
        var psw = req.body.password;

        if(opt !== 'std' && opt !== 'doc'){

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ Code: 1, Student: null, Message: "You must specify a user type with the "opt" body key (std or doc)" }, null, 3));

        }else if(psw < 8 || psw > 32){ //pronote doesn't accept this kind of passwords

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ Code: 1, Student: null, Message: "Wrong password" }, null, 3));

        }
        else
        {

        var options = new chrome.Options().headless().windowSize(screen);
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--no-sandbox");
        var driver = new webdriver.Builder()
            .setChromeOptions(options)
            .withCapabilities(webdriver.Capabilities.chrome())
            .build();

        if(opt == "std")
                await driver.navigate().to(process.env.STUDENT_LOGIN_URL);
        else
                await driver.navigate().to(process.env.PROFESSOR_LOGIN_URL);

        sleep(2.5).then(async()=>{
            await driver.findElement(webdriver.By.id("id_49")).sendKeys(usr);
            await driver.findElement(webdriver.By.id("id_50")).sendKeys(psw);
            await driver.findElement(webdriver.By.id("id_39")).click();

            sleep(5).then(async()=>{

                try
                {
                    var user = (await (await driver).findElement(webdriver.By.css("div.ibe_util_texte.ibe_actif"))).getText();
                    user = (await user).split(" - ")[1].split(" ");
                    var name = user[1];
                    var surname = user[0];

                    //get student class

                    if(opt == "std"){
                        var _class = "";
                        _class = user[2].replace("(","").replace(")","");
                    }

                    res.setHeader('Content-Type', 'application/json');

                    if(opt == "std"){

                        res.end(JSON.stringify(
                        {
                            Code: 0,
                            Student: {
                                    Name: name,
                                    Surname: surname,
                                    Class: _class
                                    },
                            Message: "OK"
                        },
                        null, 3));

                    }else{
                        res.end(JSON.stringify(
                        {
                            Code: 0,
                            Professor: {
                                    Name: name,
                                    Surname: surname
                                    },
                            Message: "OK"
                        },
                        null, 3));

                    }
                }
                catch(e)
                {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ Code: 1, Student: null, Message: e }, null, 3));
                }

                (await driver).close();
            });

        });

        } //end else
    })();
});


console.log('RESTFUL Pronote Login API started on port: ' + port);
