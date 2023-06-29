const coll = document.querySelectorAll("#collapsible");
const content = document.querySelectorAll('#content');
const caret = document.querySelectorAll('#caret');


if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

for (let i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        coll[i].classList.toggle(".active");
        if (content[i].style.display === "block") {
          content[i].style.display = "none";
          caret[i].classList.remove("caretFlip");
        } else {
          content[i].style.display = "block";
          caret[i].classList.add("caretFlip");
        }
    });
}

function callDateTime(){
  var currentTime=(new Date()).toLocaleTimeString(); 
  document.getElementById('watch').textContent = currentTime;
}


setInterval(function(){  callDateTime() }, 1000);