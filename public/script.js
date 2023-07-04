const coll = document.querySelectorAll("#collapsible");
const navButton = document.querySelectorAll('#nav-button');
const content = document.querySelectorAll('#content');
const navContent = document.querySelector('#nav-content');
const caret = document.querySelectorAll('#caret');
const rightForm = document.querySelector('#right-form');
const dot = document.querySelectorAll('.dot');

const dataElement = document.getElementById('data');
const sections = dataElement.getAttribute('data-sections').split(',').map(subArray => subArray.split('|'));
const item = dataElement.getAttribute('data-item').split(',').map(subArray => subArray.split('|'));

let arr = ['Wardrobe', 'WashingBasket', 'WashingMachine', 'DryerLine'];
let arr2 = ['wItem', 'wbItem', 'wmItem', 'dItem'];


let itemLocations = {
  wItem : document.querySelectorAll('.Wardrobe'),
  wbItem : document.querySelectorAll('.WashingBasket'),
  wmItem : document.querySelectorAll('.WashingMachine'),
  dItem : document.querySelectorAll('.DryerLine')
}


let locations = {
  Wardrobe : [[0]],
  WashingBasket : [[0]],
  WashingMachine : [[0]],
  DryerLine : [[0]]
}

let navFilter = [];

function inArray(array, values) { //checks if all of the values in an array are in another array
  for (let i = 0; i < values.length; i++) {
    if(!array.includes(values[i])) {
      return false;
    }
  }
  return true;
}

function removeRepeats(array) { // removes repeated values [1, 1, 3] => [3]
  let newArray = [];
  for(let i = 0; i < array.length; i++) {
    let origin = i;
    let value = array[i];
    array.splice(i, 1);
  	if(!array.includes(value)) {
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
  if(!form_data.has(funcName))
  {
    document.querySelectorAll(funcError)[parseInt(funcForm.split('-')[2])].style.visibility = "visible";
    return false;
  }
  else if(form_data.get(funcName) == '' || form_data.get(funcName) == ' ' || form_data.get(funcName) == undefined) {
    document.querySelectorAll(funcError)[parseInt(funcForm.split('-')[2])].style.visibility = "visible";
    return false;
  }
  else
  {
    document.querySelectorAll(funcError)[parseInt(funcForm.split('-')[2])].style.visibility = "hidden";
    return true;
  }
}

for (let i = 0; i < item.length; i++) {  // takes every item and sorts them into the locations object
  if(item[i][4].includes("-")) {
    let deps = item[i][4].split("-")
    for (let j = 0; j < deps.length; j++) {
      let dep = deps[j];
      item[i].splice(5, 0, dep);
    }
    item[i].splice(4, 1);
  }
  locations[item[i][1].replace(' / ', '').replace(' ', '')].push(item[i])

}

if (window.history.replaceState) { //prevents the confirm form resubmission from showing up (it messes with the database)
  window.history.replaceState(null, null, window.location.href);
}

for (let i = 0; i < coll.length; i++) { // code for dropdown menus
  coll[i].addEventListener("click", function () {
    coll[i].classList.toggle("active");
    if (content[i].style.display === "block") {
      content[i].style.display = "none";
      caret[i].classList.remove("caretFlip");
    } else {
      content[i].style.display = "block";
      caret[i].classList.add("caretFlip");
      for (let j = 0; j < locations[arr[i]].length-1; j++) { //code for filtering items
        if(!inArray(locations[arr[i]][j+1], navFilter)) {
          console.log(locations[arr[i]][j]);
          console.log(j);
          itemLocations[arr2[i]][j].style.display = 'none';
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
          coll[arr.indexOf(l)].style.display='block';
          content[arr.indexOf(l)].style.display = 'none';
          console.log(`in ${l}`);
          break;
        }
        else if (j == locations[l].length - 1) {
          coll[arr.indexOf(l)].style.display='none';
          content[arr.indexOf(l)].style.display = 'none';
          console.log(`not in ${l}`);
          count++;
        }

        
      }

      if (l == 'DryerLine' && count == 4) {
        navContent.style.display =' block';
        console.log('not in any locations');
      }
      else {
        navContent.style.display = 'none';
      }
    }
    
  });
}


function callDateTime() { // gets the current time
  currentTime = (new Date()).toLocaleTimeString();
  document.getElementById('watch').textContent = currentTime;
}




setInterval(function () { callDateTime() }, 1000); //gets the current time every second