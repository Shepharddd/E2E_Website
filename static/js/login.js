var SHA256 = require("crypto-js/sha256");

window.addEventListener('load', (event) => {
    document.getElementById("login_post").onclick = function() {
        login();
	}

    document.getElementById("login_button").onclick = function() {
        window.location = "/register";
	}

    
});

function login() {

    var username = document.getElementById("username").value;
    var pass = document.getElementById("password").value;

    let hashedPass = SHA256(pass).toString();

    let data = {
        "username": username,
        "password": hashedPass,
    };

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(data)
    }).then(response => response.json())
    .then(async function(response) {
        if (response["err"]) {
            document.getElementById("error").innerText = response["err"];
        } else {
            sessionStorage.setItem('active_user', data["username"]);
            sessionStorage.setItem('key', response['success']);
            window.location = "/main";
        }
    });

}