const express = require('express'); //express stuff
const app = express();

const cron = require('node-cron');

const {sendEmail} = require('./emailService');


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
]

let item =
[

]

let emails = []


function getFromDatabase() {
  let id = 0;
  item = [];
  let locations = ['Wardrobe', 'Washing Basket', 'Washing Machine', 'Dryer / Line'];
  for (let i = 0; i < sections.length; i++) {
    sections[i].splice(1, 1, '0');
  }


  con.query('select id from clothes', function (err, results) {
    if (err) throw err;
    for (let i of results) {
      con.query(`select name, dependencies, location, colour from clothes where id = ${i.id}`, function (error, result) {
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
  });


}

function displayHomepage(req, res) {
  getFromDatabase();
  setTimeout(function () {
    res.render("index", {
      sections: sections,
      item: item
    });
  }, 1000);


}

function login(req, res) {
  res.render("login");
}

function account(req, res) {
  res.render("account");
}

function updateDetails(req, res) {
  let name = req.body.name;
  let colour = req.body.colourOption;
  let location = 'Wardrobe';
  let dependencies = req.body.dOption?.join("-");
  let id = 0;

  let actions =
    [`INSERT INTO clothes (name, colour, dependencies, location) values ('${name}', '${colour}', '${dependencies}', '${location}')`,
    `DELETE FROM clothes WHERE id = ${id}`]; //array of sql queries

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
      item: item
    });
  }, 1000);
}

function updateLogin(req, res) {
  res.render("login", {
    name: "afsdgsh"
  });

}

function updateAccount(req, res) {
  res.render("login", {
    name: "afsdgsh"
  });

}

function tryItems(req, res) {
  if (req.body.remove == 'true' && req.body.send != undefined) {
    let sentItems = [];

    if (!Array.isArray(req.body.send)) { //if only one item is selected then there is no need for a for loop
      console.log(req.body.send);
      sentItems.push(req.body.send.split('-')[0]);

    }
    else {
      for (let i = 0; i < req.body.send.length; i++) { //creates list of all items sent to delete
        sentItems.push(req.body.send[i].split("-")[0]);
      }
    }
    console.log(sentItems);
    var sql = `DELETE FROM clothes WHERE id IN ('${sentItems.join("', '")}');`; // arr('2', '3') => ('23') => ('2', '3') changes from array to sql syntax
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('items removed!');

    });



  }
  else if (req.body.send?.length >= 1 && req.body.remove == 'false') {
    let locations = ['a', 'Wardrobe', 'Washing Basket', 'Washing Machine', 'Dryer / Line']
    let sentItems = [];
    let currentlocation = ''; //gets the initial location of items
    
    console.log(req.body.time);
    if(req.body.time != undefined) {
      console.log(req.body.time);
      console.log(req.body.time.split(':')[0]);
      console.log(req.body.time.split(':')[1]);
      let finalTime = moment().add(req.body.time.split(':')[0], 'hours').add(req.body.time.split(':')[1], 'minutes').format('m k D M');
      console.log(finalTime);
      emails.push([finalTime, '23dobbja@cgs.vic.edu.au', 'Your daily update', 'Your clothes are finished Washing']);
      i = emails.length-1;
      var sql = `INSERT INTO emails (time, address, subject, message) values ("${emails[i][0]}", "${emails[i][1]}", "${emails[i][2]}", "${emails[i][3]}")`; 
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log('table altered');
      });
    }

    
     

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


    console.log("Connected!");
    if (locations.indexOf(currentlocation) == 4) {
      currentlocation = 'a';
    }
    console.log(sentItems);
    var sql = `UPDATE clothes SET location = '${locations[locations.indexOf(currentlocation) + 1]}' WHERE id IN ('${sentItems.join("', '")}');`; // changes from array to sql syntax
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('table altered');
    });

  }

  getFromDatabase();
  setTimeout(function () {
    res.render("index", {
      sections: sections,
      item: item
    });
  }, 1000);
}

function tryFamily(req, res) {
  let email = req.body.member;
  let id = 0;

  if (req.body.member.length > 0) {
    let actions =
      [`INSERT INTO family (email) values ('${email}')`,
      `DELETE FROM family WHERE id = ${id}`]; //array of sql queries

    console.log("Connected!");
    var sql = actions[0]; //sql query
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log('table altered');
    });
  }

  getFromDatabase();
  setTimeout(function () {
    res.render("index", {
      sections: sections,
      item: item
    });
  }, 1000);
}

function send() {
  for (let i=0; i<emails.length; i++) {
    cron.schedule(emails[i][0] + ' *', () => {
      const recipient = emails[i][1];
      const subject = emails[i][2];
      const message = emails[i][3];
  
      sendEmail(recipient, subject, message);
      emails.splice(i, 1);
      i--;
    });
    
  }
}

setInterval(send, 1000);

app.get("/", displayHomepage);
app.post("/", updateDetails);

app.post("/items", tryItems);

app.post("/family", tryFamily);



app.get("/login", login);
app.post("/login", updateLogin);

app.get("/account", account);
app.post("/account", updateAccount);

app.listen(3000);