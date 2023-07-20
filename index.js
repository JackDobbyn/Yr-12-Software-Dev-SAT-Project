const express = require('express'); //express stuff
const app = express();

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const cron = require('node-cron'); //library for shceduling jobs
const bcrypt = require('bcrypt'); //library for hashing passwords

const { sendEmail } = require('./emailService');


let ejs = require('ejs');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const moment = require('moment/moment'); //moment; time based library

const mysql = require('mysql');  //sql

const con = mysql.createConnection({
  host: 'localhost', 
  user: 'user1',
  password: '0000',
  database: 'mydb', 
})








let sections = [ //template for html
  [
    'Wardrobe',
    '0',
    '0',
    '0',
    'Work',
    'School',
    'Other'
  ],
  [
    'Washing Basket',
    '0',
    '0',
    '0',
    'Work',
    'School',
    'Other'
  ],
  [
    'Washing Machine',
    '0',
    '0',
    '0',
    'Work',
    'School',
    'Other'
  ],
  [
    'Dryer / Line',
    '0',
    '0',
    '0',
    'Work',
    'School',
    'Other'
  ],
];

let item = []; //item array that gets filled with item details from database
let user; //user thats logged in
let washLength; //time that the wash takes
let dryLength; //time that the dry takes

let locationsInUse = { //variable for whether any location is in use
  WashingMachine: 'false',
  DryerLine: 'false'
};

let loginStatus = false; 

function sendData(msg) { //sends data to the backend js file

  let data = {
    loc1: locationsInUse['WashingMachine'],
    loc2: locationsInUse['DryerLine'],
    message : msg
  }
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}


function getFromDatabase(req, res) { //gets data from database
  
  item = [];
  let locations = ['Wardrobe', 'Washing Basket', 'Washing Machine', 'Dryer / Line'];
  for (let i = 0; i < sections.length; i++) {
    sections[i].splice(1, 1, '0');
  }

  // getting clothes details from database
  con.query(`select id from clothes where user = '${user}'`, function (err, results) {
    if (err) throw err;
    for (let i of results) {
      con.query(`select name, dependencies, location, colour from clothes where id = ${i.id}`, function (err, result) {
        if (err) throw err;
        let name = result[0].name;
        let dependencies = result[0].dependencies;
        let location = result[0].location;
        let colour = result[0].colour;
        let numClothes = parseInt(sections[locations?.indexOf(location)][1]);
        sections[locations.indexOf(location)].splice(1, 1, (numClothes + 1).toString());
        item.push([name, location, i.id, colour, dependencies]);
      });
    }
    //getting email details from database
    var sql = `select email_id, time, address, subject, message, location, washdryLength from emails where user = '${user}'`; //sql query
    con.query(sql, function (err, resul) {
      if (err) throw err;
      for (let j = 0; j < resul.length; j++) {
        send(resul[j].time, resul[j].address, resul[j].subject, resul[j].message, resul[j].email_id, resul[j].location.replace(' / ', '').replace(' ', ''));
        if(resul[j].location.replace(' / ', '').replace(' ', '') == 'WashingMachine') {
          washLength == resul[j].washdryLength;
          setTimeout(function () {sendData('wash')}, 1200);
        } else if(resul[j].location.replace(' / ', '').replace(' ', '') == 'DryerLine') {
          dryLength == resul[j].washdryLength;
          setTimeout(function () {sendData('dry')}, 1200);
        }

        locationsInUse[resul[j].location.replace(' / ', '').replace(' ', '')] = 'true';

      }
      console.log('its me')
      setTimeout(function () {sendData()}, 1200);
    });
  });


}

function displayHomepage(req, res) {
  //if logged in display homepage. if not display the login page
  if (loginStatus) {
    getFromDatabase(req, res);
    setTimeout(function () {
      res.render("index", {
        sections: sections,
        item: item,
        washLocation: locationsInUse['WashingMachine'],
        dryLocation: locationsInUse['DryerLine'],
        navbarVars: {
          loginStatus: loginStatus
        },
        washLength: washLength,
        dryLength: dryLength
        
      });
    }, 1000);
  }
  else {
    res.render("login", {
      navbarVars: {
        loginStatus: loginStatus
      },
      loginMessage: ''
    });
  }

}

function login(req, res) {
  res.render("login", {
    navbarVars: {
      loginStatus: loginStatus
    },
    loginMessage: ''
  });
}

function account(req, res) {
  res.render("account", {
    navbarVars: {
      loginStatus: loginStatus
    }, 
    user: user
  });
}

function updateDetails(req, res) {
  let name = req.body.name;
  let colour = req.body.colourOption;
  let location = 'Wardrobe';
  let dependencies = req.body.dOption?.join("-");
  let id = 0;

  //inserts  clothes into database
  let actions =
  [`INSERT INTO clothes (name, colour, dependencies, location, user) values ('${name}', '${colour}', '${dependencies}', '${location}', '${user}')`]; //array of sql queries

  console.log("Connected!");
  var sql = actions[0]; //sql query
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log('table altered');
  });

  getFromDatabase();
  setTimeout(function () {
   
    res.render("index", {
      sections: sections,
      item: item,
      washLocation: locationsInUse['WashingMachine'],
      dryLocation: locationsInUse['DryerLine'],
      navbarVars: {
        loginStatus: loginStatus
      },
      washLength: washLength,
      dryLength: dryLength
    });
  }, 1000);
}

function updateLogin(req, res) {
  let emailExists;
  if (req.body.login == 'true') {
    //login to account
    let email = req.body.email;
    var sql = `SELECT hash FROM details WHERE email = '${email}'`;
    con.query(sql, function (err, result) {
      if (err) throw err;
      let hashed_password = result[0]?.hash;

      let pass = req.body.pass;
      if (hashed_password != undefined && pass != undefined) {
        bcrypt.compare(pass, hashed_password, function (err, isMatch) {
          if (err) {
            console.error(err);
            return;
          }

          if (isMatch) {
            // Password is correct
            loginStatus = true;
            console.log('login successful');

            user = email;
          } else {
            // Password is incorrect
            sendData('false');
          }
        });
      }
      else {

        // Password is incorrect
        sendData('false');
      }


    });
  }
  else if (req.body.login == 'false') {
    // create account
    let email = req.body.email;
    let pass = req.body.pass;
    let saltRounds = 10; //amount of time used to hash passwords

    //hash password
    bcrypt.hash(pass, saltRounds, function (err, hashed_password) {
      if (err) {
        console.error(err);
        return;
      }

      var sql = 'SELECT email from details';
      con.query(sql, function (err, result) {
        if (err) throw err;
        
        console.log(result.length);
        
        for (let i = 0; i < result.length; i++) {
          console.log(result[i]?.email);
          if (result[i]?.email == email) {
            emailExists = true;
          }
        }

        if (!emailExists) {
          loginStatus = true;
          user = email;
        }
        else {  
          loginStatus = false;
        }
        console.log(emailExists);
        if (!emailExists) {
          var sql = `INSERT INTO details (email, hash) values ("${email}", "${hashed_password}")`;
          con.query(sql, function (err, result) {
            if (err) throw err;
            console.log('table altered');
          });  
        }
      });
    });
    
    

  }
  setTimeout(function (){
    if (loginStatus) {
      getFromDatabase();
      setTimeout(function () {
        res.render("index", {
          sections: sections,
          item: item,
          washLocation: locationsInUse['WashingMachine'],
          dryLocation: locationsInUse['DryerLine'],
          navbarVars: {
            loginStatus: loginStatus
          },
          washLength: washLength,
          dryLength: dryLength
        });
      }, 1000);
      setTimeout(function () { sendData(locationsInUse) }, 1200);
    }else if(emailExists){  
      res.render("login", {
        navbarVars: {
          loginStatus: loginStatus
        },
        loginMessage: 'Email already exists. Please enter a valid email'
      });
    }else {  
      res.render("login", {
        navbarVars: {
          loginStatus: loginStatus
        },
        loginMessage: 'Username or password is incorrect. Please try again.'
      });
    }
  }, 1000);
}

function updateAccount(req, res) {
  if (req.body.logout == 'true') {
    //logout
    user = '';
    loginStatus = false;
  }
  else {
    //delete account
    var sql = `DELETE FROM clothes WHERE user = '${user}';`; //removes all clothes associated with user
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('items removed!');

    });
    var sql = `DELETE FROM emails WHERE user = '${user}';`; //removes all scheduled emails associated with user
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('items removed!');

    });
    var sql = `DELETE FROM family WHERE user = '${user}';`; //removes all family emails associated with user
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('items removed!');

    });
    var sql = `DELETE FROM details WHERE email = '${user}';`; //removes users login details from details table
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('items removed!');

    });

    user = '';
    loginStatus = false;
  }   

  res.render("login", {
    navbarVars: {
      loginStatus: loginStatus
    }, 
    loginMessage: ''
  });

}

function tryItems(req, res) {
  if (req.body.remove == 'true' && req.body.send != undefined) {
    //remove items
    let sentItems = [];

    if (!Array.isArray(req.body.send)) { //if only one item is selected then there is no need for a for loop
      sentItems.push(req.body.send.split('-')[0]);

    }
    else {
      for (let i = 0; i < req.body.send.length; i++) { //creates list of all items sent to delete
        sentItems.push(req.body.send[i].split("-")[0]);
      }
    }
    var sql = `DELETE FROM clothes WHERE id IN ('${sentItems.join("', '")}') AND user = '${user}';`; // arr('2', '3') => ('23') => ('2', '3') changes from array to sql syntax
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('items removed!');

    });



  }
  else if (req.body.send?.length >= 1 && req.body.remove == 'false') {
    //send items to next location
    let locations = ['a', 'Wardrobe', 'Washing Basket', 'Washing Machine', 'Dryer / Line']
    let sentItems = [];
    let currentlocation = ''; //gets the initial location of items






    if (!Array.isArray(req.body.send)) { //if only one item is selected then there is no need for a for loop
      currentlocation = req.body.send.split("-")[1];
      sentItems.push(req.body.send.split('-')[0]);

    }
    else {
      currentlocation = req.body.send[0].split("-")[1];
      for (let i = 0; i < req.body.send.length; i++) { //creates list of all items sent to next location
        sentItems.push(req.body.send[i].split("-")[0]);
      }
    }

    if (req.body.time != undefined) {
      let keyWord = '';
      let loc = locations[locations.indexOf(currentlocation) + 1];
      if(loc == 'Washing Machine') {
        keyWord = 'washing';
        washLength = req.body.time;
      }else {
        keyWord = 'drying';
        dryLength = req.body.time;
      }
      
      let finalTime = moment().add(req.body.time.split(':')[0], 'hours').add(req.body.time.split(':')[1], 'minutes').format('m k D M');
      let address = user;
      let subject = 'Your laundry update'; 
      let message = `Your clothes have finished ${keyWord}`;


      if (finalTime.split(' ')[1] == '24') { // cron only supports hours 1-23
        let finalTimeSplit = finalTime.split(' ');
        finalTimeSplit.splice(1, 1, '1');
        finalTime = finalTimeSplit.join(' ');
      }

      var sql = `INSERT INTO emails (time, address, subject, message, location, user, washdryLength) values ("${finalTime}", "${address}", "${subject}", "${message}", "${loc}", "${user}", "${req.body.time}")`;
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log('table altered');
      });
    }


    console.log("Connected!");
    if (locations.indexOf(currentlocation) == 4) {
      currentlocation = 'a';
    }
    var sql = `UPDATE clothes SET location = '${locations[locations.indexOf(currentlocation) + 1]}' WHERE id IN ('${sentItems.join("', '")}') AND user = '${user}';`; // changes from array to sql syntax
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('table altered');
    });

  }

  getFromDatabase();
  setTimeout(function () {
    res.render("index", {
      sections: sections,
      item: item,
      washLocation: locationsInUse['WashingMachine'],
      dryLocation: locationsInUse['DryerLine'],
      navbarVars: {
        loginStatus: loginStatus
      },
      washLength: washLength,
      dryLength: dryLength
    });
  }, 1000);
  setTimeout(function () { sendData(locationsInUse) }, 1100);
}
//schedules emails to be sent
function send(t, a, s, m, i, l) {
  cron.schedule(t + ' *', () => {
    let recipient = a;
    let subject = s;
    let message = m;
    let location = l;


    sendEmail(recipient, subject, message); //asnychronous function in another script 

    locationsInUse[location] = 'false';
    setTimeout(function () { sendData() }, 1100);

  });
  var sql = `DELETE FROM emails WHERE email_id=${i} AND user = '${user}'`;
  con.query(sql, function (err, result) { //deletes email details from sql table 
    if (err) throw err;
    console.log('items removed!');
  });  
}

//recieves data from the frontend
function stopTimers (req, res) {
  console.log('hello');
  console.log(req.body.data);
  if (req.body.data == 'wash done') {
    
    locationsInUse['WashingMachine'] = 'false';

  } else if (req.body.data == 'dry done') {
    locationsInUse['DryerLine'] = 'false';

  }
}

app.get("/", displayHomepage);
app.post("/", updateDetails);

app.post("/items", tryItems);




app.get("/login", login);
app.post("/login", updateLogin);

app.get("/account", account);
app.post("/account", updateAccount);

app.post("/updateTimer", stopTimers);

app.listen(3000);