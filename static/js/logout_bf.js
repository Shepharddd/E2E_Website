(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
window.addEventListener('load', (event) => {

    var logged_in = sessionStorage.getItem('key');
    if (logged_in == null || logged_in == "None"){
        document.getElementById("log_out").innerText = "Login";
    }
    else {
        document.getElementById("log_out").innerText = "Log Out";
    }
    // if (name != null && name != "None") {
    //     document.getElementById("username").innerText = name;
    //     // document.getElementById("error").innerText = response["err"];

    // }

    var mode = sessionStorage.getItem('mode');
    if (mode == 'light') {
        document.getElementById('stylesheet').href = 'css/light.css';
        document.getElementById("toggle_dark_mode").checked = true;
    } else {
        document.getElementById('stylesheet').href = 'css/dark.css';
    }

    document.getElementById("log_out").onclick = function() {
        logout(logged_in);
	}
    document.getElementById("toggle_dark_mode").onclick = function() {
        toggle_dark_mode();
	}
});

function logout(logged_in) {

    let data = {
        "username": logged_in,
    };

    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(data)
    })
    .then(function(response) {
        sessionStorage.setItem('active_user', 'None');
        sessionStorage.setItem('key', 'None');
        window.location = "/login";
    });


}

function toggle_dark_mode() {

    var mode = sessionStorage.getItem('mode');
    if (mode == 'light') {
        document.getElementById('stylesheet').href = 'css/dark.css';
        sessionStorage.setItem('mode', 'dark');
    } else {
        document.getElementById('stylesheet').href = 'css/light.css';
        sessionStorage.setItem('mode', 'light');
    }


}
},{}]},{},[1]);
