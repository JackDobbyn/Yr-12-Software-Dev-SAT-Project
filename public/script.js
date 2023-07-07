const coll = document.querySelectorAll("#collapsible");
const navButton = document.querySelectorAll('#nav-button');
const content = document.querySelectorAll('#content');
const navContent = document.querySelector('#nav-content');
const caret = document.querySelectorAll('#caret');
const rightForm = document.querySelector('#right-form');
const dot = document.querySelectorAll('.dot');
const sendWb = document.querySelector('.send-WashingBasket');
const sendWm = document.querySelector('.send-WashingMachine');
const sendD = document.querySelector('.send-DryerLine');

const dataElement = document.querySelector('.data');
const sections = dataElement.getAttribute('data-sections').split(',').map(subArray => subArray.split('|'));
const item = dataElement.getAttribute('data-item')?.split(',').map(subArray => subArray.split('|'));

let washLocation;
let dryLocation;

let warning = document.querySelectorAll('.warning');

let arr = ['Wardrobe', 'WashingBasket', 'WashingMachine', 'DryerLine'];
let arr2 = ['wItem', 'wbItem', 'wmItem', 'dItem'];

const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = (event) => {
  if (typeof JSON.parse(event.data) == 'object') {
    const locationsInUse = JSON.parse(event.data);
    washLocation = locationsInUse['WashingMachine'];
    dryLocation = locationsInUse['DryerLine'];
    disableButtons();
  } 
  else
  {
    let loginStatus = JSON.parse(event.data);
    console.log(loginStatus);
  }
};



let itemLocations = {
  wItem: document.querySelectorAll('.Wardrobe'),
  wbItem: document.querySelectorAll('.WashingBasket'),
  wmItem: document.querySelectorAll('.WashingMachine'),
  dItem: document.querySelectorAll('.DryerLine')
}


let locations = {
  Wardrobe: [[0]],
  WashingBasket: [[0]],
  WashingMachine: [[0]],
  DryerLine: [[0]]
}

let navFilter = [];


function disableButtons() {
  if (washLocation == 'true') {
    sendWb.setAttribute('disabled', true);
    sendWm.setAttribute('disabled', true);
  }
  else if (dryLocation == 'true') {
    sendD.setAttribute('disabled', true);
    sendWm.setAttribute('disabled', true);
  }
  else {
    sendWb.removeAttribute('disabled');
    sendD.removeAttribute('disabled');
    sendWm.removeAttribute('disabled');
  }
}

function inArray(array, values) { //checks if all of the values in an array are in another array
  for (let i = 0; i < values.length; i++) {
    if (!array.includes(values[i])) {
      return false;
    }
  }
  return true;
}

function removeRepeats(array) { // removes repeated values [1, 1, 3] => [3]
  let newArray = [];
  for (let i = 0; i < array.length; i++) {
    let origin = i;
    let value = array[i];
    array.splice(i, 1);
    if (!array.includes(value)) {
      newArray.push(value);
      array.splice(origin, 0, value);
    }
    else {
      array.splice(origin, 0, value);
    }
  }
  return newArray;
}

function handleData(funcForm, funcName, funcError) //prevents forms submitting when nothing is selected
{

  let form_data = new FormData(document.querySelector(funcForm));
  if (!form_data.has(funcName)) {
    document.querySelectorAll(funcError)[parseInt(funcForm.split('-')[2])].style.visibility = "visible";
    return false;
  }
  else if (form_data.get(funcName) == '' || form_data.get(funcName) == ' ' || form_data.get(funcName) == undefined) {
    document.querySelectorAll(funcError)[parseInt(funcForm.split('-')[2])].style.visibility = "visible";
    return false;
  }
  else {
    document.querySelectorAll(funcError)[parseInt(funcForm.split('-')[2])].style.visibility = "hidden";
    return true;
  }
}


if (item != undefined) {
  for (let i = 0; i < item.length; i++) {  // takes every item and sorts them into the locations object
    if (item[i][4].includes("-")) {
      let deps = item[i][4].split("-")
      for (let j = 0; j < deps.length; j++) {
        let dep = deps[j];
        item[i].splice(5, 0, dep);
      }
      item[i].splice(4, 1);
    }
    locations[item[i][1].replace(' / ', '').replace(' ', '')].push(item[i])
  }
}

if (window.history.replaceState) { //prevents the confirm form resubmission from showing up (it messes with the database)
  window.history.replaceState(null, null, window.location.href);
}

for (let i = 0; i < coll.length; i++) { // code for dropdown menus
  coll[i].addEventListener("click", function () {

    for (let div of warning) {
      div.style.visibility = 'hidden';
    }

    coll[i].classList.toggle("active");

    if (content[i].style.display === "block") {
      content[i].style.display = "none";
      caret[i].classList.remove("caretFlip");
    } else {
      content[i].style.display = "block";
      caret[i].classList.add("caretFlip");

      for (let j = 0; j < locations[arr[i]].length - 1; j++) { //code for filtering items
        itemLocations[arr2[i]][j].style.display = 'none';
        if (!inArray(locations[arr[i]][j + 1], navFilter)) {
          itemLocations[arr2[i]][j].style.display = 'none';
        }
        else {
          itemLocations[arr2[i]][j].style.display = 'block';
        }
      }
    }
  });
}


for (let i = 0; i < navButton.length; i++) {
  navButton[i].addEventListener("click", function () { //navigation button onclick (far left column)

    if (dot[i].style.display === "inline") { //dot thats displayed when the button is clicked
      dot[i].style.display = "none";
    } else {
      dot[i].style.display = "inline";
    }

    navFilter.push(navButton[i].textContent); //creates a togglable navigation system 
    navFilter = removeRepeats(navFilter);

    let count = 0;
    for (let l of arr) {  //hides and unhides locations that contain the described items
      for (let j = 0; j < locations[l].length; j++) {
        if (inArray(locations[l][j], navFilter)) {
          coll[arr.indexOf(l)].style.display = 'block';
          content[arr.indexOf(l)].style.display = 'none';
          caret[arr.indexOf(l)].classList.remove("caretFlip");
          console.log(`in ${l}`);
          break;
        }
        else if (j == locations[l].length - 1) {
          coll[arr.indexOf(l)].style.display = 'none';
          content[arr.indexOf(l)].style.display = 'none';
          caret[arr.indexOf(l)].classList.remove("caretFlip");
          console.log(`not in ${l}`);
          count++;
        }
      }
      if (l == 'DryerLine' && count == 4) {
        navContent.style.display = ' block';
        console.log('not in any locations');
      }
      else {
        navContent.style.display = 'none';
        caret[arr.indexOf(l)].classList.remove("caretFlip");
      }
    }
  });
}


function callDateTime() { // gets the current time
  currentTime = (new Date()).toLocaleTimeString();
  document.getElementById('watch').textContent = currentTime;
}




setInterval(callDateTime, 1000); //gets the current time every second