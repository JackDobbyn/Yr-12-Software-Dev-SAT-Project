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

const removeWb = document.querySelector('.remove-WashingBasket');
const removeWm = document.querySelector('.remove-WashingMachine');
const removeD = document.querySelector('.remove-DryerLine');

const dataElement = document.querySelector('.data');
const item = dataElement.getAttribute('data-item')?.split(',').map(subArray => subArray.split('|'));

const washInput = document.querySelector('.wash-input');
const dryInput = document.querySelector('.dry-input');

const washTime = document.querySelector('.wash-time');
const dryTime = document.querySelector('.dry-time');


let washLocation;
let dryLocation;

let warning = document.querySelectorAll('.warning');

let arr = ['Wardrobe', 'WashingBasket', 'WashingMachine', 'DryerLine'];
let arr2 = ['wItem', 'wbItem', 'wmItem', 'dItem'];

const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = (event) => { //recieves data from the backend using sockets
  const data = JSON.parse(event.data);
  washLocation = data['loc1'];
  dryLocation = data['loc2'];
  let message = data['message'];

  if (message == 'wash') {
    let intervalId = setInterval(function () {changeWashDryTime(document.querySelector('.wash-time'), intervalId, 'wash')}, 60000);
  }else if (message == 'dry') {
    let intervalId = setInterval(function () {changeWashDryTime(document.querySelector('.dry-time'), intervalId, 'dry')}, 60000);
  }

  disableButtons();
   
};



let itemLocations = { //allows you to sub in strings to the itemlocations object to remove the need for hardcoded if statements
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

let navFilter = []; //array of filters


//disables buttons depending on which locations are in use
function disableButtons() {
  if (washLocation == 'true') {
    sendWb.setAttribute('disabled', true);
    sendWm.setAttribute('disabled', true);
    removeWb.setAttribute('disabled', true);
    removeWm.setAttribute('disabled', true);
    washInput.style.display =  'none';
    washTime.style.display =  'block';
    dryInput.style.display =  'none';
    dryTime.style.display = 'none'
  }
  else if (dryLocation == 'true') {
    sendD.setAttribute('disabled', true);
    sendWm.setAttribute('disabled', true);
    removeD.setAttribute('disabled', true);
    removeWm.setAttribute('disabled', true);
    dryInput.style.display =  'none';
    dryTime.style.display =  'block';
    washTime.style.display =  'none';
  }
  else {
    sendWb.removeAttribute('disabled');
    sendD.removeAttribute('disabled');
    sendWm.removeAttribute('disabled');
    removeWb.removeAttribute('disabled');
    removeD.removeAttribute('disabled');
    removeWm.removeAttribute('disabled');
    washInput.style.display =  'block';
    dryInput.style.display =  'block';
    washTime.style.display =  'none';
    dryTime.style.display =  'none';
  }
}

function selectAll (className,  checkBox) { //selects all checkboxes in a section
  const checkBoxes = document.querySelectorAll(className);
  

  if(checkBox.checked == true) {
    for (let i = 0; i < checkBoxes.length; i++) {
      let itemDiv = checkBoxes[i].closest('#item');
      console.log(checkBoxes[i].style.display)
      if (itemDiv.style.display == 'block') {
        checkBoxes[i].checked = true;
      }
    }
  }
  else {
    for (let i = 0; i < checkBoxes.length; i++) {
      checkBoxes[i].checked = false;
    }
  }
  return true;
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


function handleData(funcForm, funcName, funcError) //prevents forms submitting when nothing is selected (existence check)
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
          itemLocations[arr2[i]][j].querySelector('input').checked = false;
          itemLocations[arr2[i]][j].closest('form').querySelector('.select-all').checked = false;
        }
        else {
          itemLocations[arr2[i]][j].style.display = 'block';
          itemLocations[arr2[i]][j].querySelector('input').checked = false;
          itemLocations[arr2[i]][j].closest('form').querySelector('.select-all').checked = false;
        }
      }
    }
  });
}


for (let i = 0; i < navButton.length; i++) {
  navButton[i].addEventListener("click", function () { //navigation button onclick (far left column)

    if (navButton[i].classList.contains("underline")) { //underlines and bolds the text that is clicked
      navButton[i].classList.remove('underline');
    } else {  
      navButton[i].classList.add('underline');
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



function changeWashDryTime (div, id, type) { //changes the time left in wash or dry cycles
  let time = div.textContent.replace('Time left: ', '');

  if (time.split(':')[1] != '00' && time != '0:00') {
    let minute1 = parseInt(time.split(':')[1][0]);
    let minute2 = parseInt(time.split(':')[1][1]);
    if (minute2 == 0) {
      let finalMinutes = `${minute1-1}9`;
      let finalTime = `${time.split(':')[0]}:${finalMinutes}`;
      div.innerHTML = '<b>Time left: </b>' + finalTime;
    }
    else if(minute2 != 0){
      let finalMinutes = `${minute1}${minute2-1}`;
      let finalTime = `${time.split(':')[0]}:${finalMinutes}`;
      div.innerHTML = '<b>Time left: </b>' + finalTime;
    }
  }
  else if (time.split(':')[1] == '00' && time != '0:00'){
    console.log(time);
    let hour = parseInt(time.split(':')[0]);
    let finalHour = hour - 1;
    finalTime = `${finalHour}:59`;
    div.innerHTML = '<b>Time left: </b>' + finalTime;
    
  }

  if (div.textContent.replace('Time left: ', '') == '0:00') {
    // TODO: Interval isn't being cleared
    clearInterval(id);

    if (type == 'wash') {
      washLocation = 'false';
    }

    if (type == 'dry') {
      dryLocation = 'false';
    }

    disableButtons();

    fetch("/updateTimer", {
      method: "POST",
      body: JSON.stringify({
        data: `${type} done`
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
      
  }
}


function callDateTime() { // gets the current time
  currentTime = (new Date()).toLocaleTimeString();
  document.getElementById('watch').textContent = currentTime;
}

setInterval(callDateTime, 1000); //gets the current time every second

setInterval(function () {
  console.log('wash: ' + washLocation);
  console.log('dry: ' + dryLocation);
}, 1000)

