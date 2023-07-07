const express = require('express'); //express stuff
const app = express();

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const cron = require('node-cron');
const bcrypt = require('bcrypt');

const { sendEmail } = require('./emailService');


let ejs = require('ejs');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const mysql = require('mysql');
const moment = require('moment/moment');
const con = mysql.createConnection({ //connection to database
  host: 'localhost',
  user: 'user1',
  password: "0000",
  database: "mydb"
})



let sections = [
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

let item = [];
let user;

let locationsInUse = {
  WashingMachine: 'false',
  DryerLine: 'false'
};

let loginStatus = false;

function generateSecretKey() {
  const length = 32;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let secretKey = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    secretKey += characters.charAt(randomIndex);
  }

  return secretKey;
}

function sendData(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
function getFromDatabase(req, res) {
  item = [];
  let locations = ['Wardrobe', 'Washing Basket', 'Washing Machine', 'Dryer / Line'];
  for (let i = 0; i < sections.length; i++) {
    sections[i].splice(1, 1, '0');
  }


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
    var sql = `select email_id, time, address, subject, message, location from emails where user = '${user}'`; //sql query
    con.query(sql, function (err, resul) {
      if (err) throw err;
      for (let j = 0; j < resul.length; j++) {
        send(resul[j].time, resul[j].address, resul[j].subject, resul[j].message, resul[j].email_id, resul[j].location.replace(' / ', '').replace(' ', ''));
        locationsInUse[resul[j].location.replace(' / ', '').replace(' ', '')] = 'true';
      }
    });
  });


}

function displayHomepage(req, res) {
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
        }
      });
    }, 1000);
    setTimeout(function () { sendData(locationsInUse) }, 1100);
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
      }
    });
  }, 1000);
  setTimeout(function () { sendData(locationsInUse) }, 1100);
}

function updateLogin(req, res) {
  //1
  if (req.body.login == 'true') {
    //2
    //login to account
    let email = req.body.email;
    var sql = `SELECT hash FROM details WHERE email = '${email}'`;
    con.query(sql, function (err, result) {
      //4
      if (err) throw err;
      let hashed_password = result[0]?.hash;

      let pass = req.body.pass;
      if (hashed_password != undefined && pass != undefined) {
        bcrypt.compare(pass, hashed_password, function (err, isMatch) {
          //5
          if (err) {
            console.error(err);
            return;
          }

          if (isMatch) {
            // Password is correct
            //6
            loginStatus = true;
            console.log('login successful');

            user = email;
          } else {
            // Password is incorrect
            sendData(false);
          }
        });
      }
      else {

        // Password is incorrect
        sendData(false);
      }


    });
  }
  else if (req.body.login == 'false') {
    // create account
    let email = req.body.email;
    let pass = req.body.pass;
    let saltRounds = 10;

    bcrypt.hash(pass, saltRounds, function (err, hashed_password) {
      if (err) {
        console.error(err);
        return;
      }

      var sql = `INSERT INTO details (email, hash) values ("${email}", "${hashed_password}")`;
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log('table altered');
      });
    });
    loginStatus = true;
    user = email;

  }
  setTimeout(function (){if (loginStatus) {
    getFromDatabase();
    setTimeout(function () {
      res.render("index", {
        sections: sections,
        item: item,
        washLocation: locationsInUse['WashingMachine'],
        dryLocation: locationsInUse['DryerLine'],
        navbarVars: {
          loginStatus: loginStatus
        }
      });
    }, 1000);
    setTimeout(function () { sendData(locationsInUse) }, 1100);
  } else {  
    //3
    res.render("login", {
      navbarVars: {
        loginStatus: loginStatus
      },
      loginMessage: 'Username or password is incorrect. Please try again.'
    });
  }}, 1000);
}

function updateAccount(req, res) {
  console.log('woman');
  if (req.body.logout == 'true') {
    //logout
    console.log('hey');
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
      let keyWord = ''
      let loc = locations[locations.indexOf(currentlocation) + 1];
      if(loc == 'Washing Machine') {
        keyWord = 'washing';
      }else {
        keyWord = 'drying';
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

      var sql = `INSERT INTO emails (time, address, subject, message, location, user) values ("${finalTime}", "${address}", "${subject}", "${message}", "${loc}", "${user}")`;
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
      }
    });
  }, 1000);
  setTimeout(function () { sendData(locationsInUse) }, 1100);

}

function tryFamily(req, res) {
  let email = req.body.member;

  if (req.body.member.length > 0) {

    console.log("Connected!");
    var sql = `INSERT INTO family (email, user) values ('${email}', '${user}')`; //sql query
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
      }
    });
  }, 1000);
  setTimeout(function () { sendData(locationsInUse) }, 1100);
}


function send(t, a, s, m, i, l) {
  cron.schedule(t + ' *', () => {
    let recipient = a;
    let subject = s;
    let message = m;
    let emailId = i;
    let location = l;


    sendEmail(recipient, subject, message); //asnychronous function in another script

    var sql = `DELETE FROM emails WHERE email_id=${emailId} AND user = '${user}'`;
    con.query(sql, function (err, result) { //deletes email details from sql table 
      if (err) throw err;
      console.log('items removed!');
    });

    locationsInUse[location] = 'false';
    setTimeout(function () { sendData(locationsInUse) }, 1100);

  });
}


app.get("/", displayHomepage);
app.post("/", updateDetails);

app.post("/items", tryItems);

app.post("/family", tryFamily);



app.get("/login", login);
app.post("/login", updateLogin);

app.get("/account", account);
app.post("/account", updateAccount);

app.listen(3000);