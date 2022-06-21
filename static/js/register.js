var SHA256 = require("crypto-js/sha256");

window.addEventListener('load', (event) => {
    document.getElementById("register_post").onclick = function() {
        register();
	}
});

async function register() {
    
    document.getElementById("register_post").innerText = "Loading...";
    
    const {username, pass, ver_pass} = get_values();

    if (username.length < 3) {
        alert("Username needs to be atleast 3 chars")
        return;
    }

    if (checkpass(pass, ver_pass)) {
    
        let salt = (Math.random() + 1).toString(36).substring(7);
        let hashOne = SHA256(pass).toString();
        let hashedPass = SHA256(hashOne + salt).toString();

        // create RSA key pair
        // store sk in local storage
        // send pk to sotre on db
        // possibly encrypt local strage with password

        var KeyPair = await keygen();
        var pk = await exportCryptoKeys(KeyPair);

        
        let data = {
            "username": username,
            "password": hashedPass,
            "public_key": pk,
            "salt" : salt,
        };
        
        send_data(data);
    }

    document.getElementById("register_post").innerText = "Register";

}

async function keygen(){
    let KeyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-384"
        },
        true,
        ["deriveKey", "deriveBits"]
    )
    return KeyPair;
}

async function exportCryptoKeys(key) {

    var sk = await crypto.subtle.exportKey("jwk", key.privateKey);
    var pk = await crypto.subtle.exportKey("jwk", key.publicKey);

    sessionStorage.setItem('sk', JSON.stringify(sk));
    sessionStorage.setItem('pk', JSON.stringify(pk));
    return pk;
    
}

function send_data(data){
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(data)
    }).then(response => response.text())
    .then(function(response) {
        if (response == "err") {
            document.getElementById("error").innerText = "User Already Exists.";
        } else {
            sessionStorage.setItem('active_user', data["username"]);
            sessionStorage.setItem('key', response);
            window.location = "/main";
        }
    });
}

function get_values() {
    return {
        username: document.getElementById("username").value,
        pass: document.getElementById("password").value,
        ver_pass: document.getElementById("password_retype").value
    };
}

function checkpass(pass, ver_pass) {
    
    if (pass != ver_pass) {
        alert("Passwords do not match");
        return false;
    }
    
    var regex = new RegExp("^(?=(.*[a-z]){3,})(?=(.*[A-Z]){2,})(?=(.*[0-9]){2,})(?=(.*[!@#$%^&*()\-__+.]){1,}).{8,}$")
    
    if(!regex.test(pass)) {
        alert("Please ensure password has:\n8 characters length\n2 letters in Upper Case\n1 Special Character\n2 numerals\n3 letters in Lower Case.")
        return false;
    }

    return true;
}