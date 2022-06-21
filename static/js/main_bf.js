(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

// run before page is loaded
var user = sessionStorage.getItem("active_user");
var valid_key = sessionStorage.getItem("key");
console.log(user);

data = {
    user: sessionStorage.getItem("active_user"),
    key: sessionStorage.getItem("key")
}

if (data['user'] == null || data['user'] == "None") {
    window.location = "/login";
}

fetch('/check_user', {
    method: 'POST',
    headers: {

        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
})
.then((response) => { 
    response.text()
    .then(function(res) {
        if (res == "") {
            console.log("wrong key")
            window.location = "/login";
        }
        else {
            console.log("logged in")
        }
    });
})


window.addEventListener('load', async (event) => {

    var user = sessionStorage.getItem("active_user");
    
    document.getElementById("user").innerText = user;

    loadFriends(user)

    document.getElementById("mini_button").onclick = function() {
        add_friend();
	}

    document.getElementById("reply_button").onclick = function() {
        encrypt_function();
	}

});

function loadFriends(user) {
    fetch('/get_friends', {
        method: 'POST',
        headers: {

            'Content-Type': 'application/json'
        },
        body: JSON.stringify({user: user})
    })
    .then((response) => { 
        response.json()
        .then(function(res) {
            if (res['friends'] == "") {
                return
            } else {
                populateHTML(res['friends'].split(","), res['admin']);
            }
        });
    })
}

async function add_friend() {

    // retrive friends pk (trusted since over TLS)
    // generate a random sk
    // store sk in local storage
    // encrypt sk with friends public key
    // encrypt that with your sk

    // find a way to notify a particular client logged into an account.

    //make sure to log out users when they close their browsers.
    
    var data = {
        this_user: sessionStorage.getItem("active_user"),
        friend: document.getElementById("add_friend_username").value
    }

    document.getElementById("add_friend_username").value = '';

    if (data["this_user"] == data["friend"]) {
        document.getElementById("err").innerText = "Cannot add yourself as friend";
        return
    }

    fetch('/add_friend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
    .then(async function(response) {
        if (response["err"]) {
            document.getElementById("err").innerText = response["err"];
        } else {
            document.getElementById("err").innerText = "Friend added.";
            // import private key
            var localstorage = JSON.parse(sessionStorage.getItem('sk'))
            var my_private_key = await importPrivateKey(localstorage);

            // import public key
            var response_parse = parse_response(response['public_key'])
            var your_public_key = await importPublicKey(response_parse);
            
            // make shared secret
            let shared_secret = await deriveSecretKey(my_private_key, your_public_key);
            var this_key = data["friend"] + "_shared_secret";

            const exported = await window.crypto.subtle.exportKey( "jwk", shared_secret );
            sessionStorage.setItem(this_key, JSON.stringify(exported, null, " "));

            unpopulateHTML();
            var tmp = response["friends"]
            var admin = response["admin"]
            console.log(tmp)
            populateHTML(tmp.split(","), admin);
        }
    });

}

async function encrypt_function() {

    let active_user = sessionStorage.getItem("active_user")
    let friend;
    try {
        friend = document.getElementsByClassName('current')[0].innerHTML;
    } catch {
        return
    }

    let key_shared = sessionStorage.getItem(friend + "_shared_secret");
    key_shared = await importSecretKey(JSON.parse(key_shared))

    let message = document.getElementById("reply").value;
    message = active_user + ":" + message;
    let enc = new TextEncoder("utf-8").encode(message);

    iv = window.crypto.getRandomValues(new Uint8Array(16));
    
    
    let ciphertext = await encrypt(iv, key_shared, enc)
    let arr = new Uint8Array(ciphertext);
    string = toHexString(arr, iv)
    console.log(string)

    let data = {
        sender: active_user,
        sent_to: friend,
        data: string,
    };

    fetch('/send_message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(data)
    }).then(response => response.text())
    .then(function(response) {
        if (response == "err") {
            alert("error");
        } else {
            console.log("response")
            loadMessages(friend)
        }
    });
    document.getElementById("input").value = "";
}

function toHexString(byteArray, iv) {
    let string = Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');

    let iv_string = Array.from(iv, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');

    return string + "," + iv_string;
}

async function encrypt(iv, shared_secret, plaintext) {
    var text = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        shared_secret,
        plaintext
    );
    return text;
}

function getMessageEncoding() {
    const messageBox = document.querySelector(".rsa-oaep #message");
    let message = messageBox.value;
    let enc = new TextEncoder();
    return enc.encode(message);
}

async function deriveSecretKey(privateKey, publicKey) {
    return window.crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey
      },
      privateKey,
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

function parse_response(string) {
    string = string.replace(/'/g, '"');
    string = string.replace('True', 'true');
    string = JSON.parse(string)
    return string
}

function importPublicKey(jwk) {
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
          name: "ECDH",
          namedCurve: "P-384"
        },
        true,
        []
      );
}

function importPrivateKey(jwk) {
    return window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "ECDH",
        namedCurve: "P-384"
      },
      true,
      ["deriveKey", "deriveBits"]
    );
  }

function importSecretKey(jwk) {
    return window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
}

function unpopulateHTML() {
    document.getElementById("add_friends_here").innerHTML="";
}

function activateCell(i, admin) {
    let old_tab = document.getElementsByClassName('current')[0];
    let new_tab = document.getElementById(i)
    
    console.log(old_tab)
    console.log(new_tab)

    if (new_tab == old_tab) {
        return;
    }

    let active_friend = new_tab.innerText;
    old_tab.className = "tab";
    
    if (admin) {
        let friend = document.getElementById('selected_friend').innerText;
        old_tab.innerHTML = friend;
        new_tab.innerHTML = "<div id=\"selected_friend\">"+active_friend+"</div><div id=\"mute_user\">Mute</div>";
        document.getElementById('mute_user').addEventListener("click", function(event) {
            event.stopPropagation();
            mute_user();
        });
    }
    
    document.getElementById(i).className += " current";
    loadMessages(active_friend);
}

function mute_user() {
    let friend = document.getElementById('selected_friend').innerText;
    console.log(friend)

    data = {
        admin_user: sessionStorage.getItem("active_user"),
        key: sessionStorage.getItem("key"),
        mute_user: friend
    }

    fetch('/mute_user', {
        method: 'POST',
        headers: {

            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then((response) => { 
        response.json()
        .then(function(res) {
            console.log(res)
            if (res['friends'] == "") {
                return
            } else {
                unpopulateHTML()
                populateHTML(res['friends'].split(","), res['admin']);
            }
        });
    })
}

async function populateHTML(friends, admin){ 
    let active_friend;
    console.log(admin)
    if (friends != '') {
        for (let i = 0; i < friends.length; i++) {
            const friend = friends[i];
            if (i == 0) {
                active_friend = friend;
                if (admin == "1") {
                    newInput="<div id="+i+" class="+"tab"+"><div id=\"selected_friend\">"+friend+"</div><div id=\"mute_user\">Mute</div></div>";
                } else {
                    newInput="<div id="+i+" class="+"tab"+">"+friend+"</div>";
                }
            } else {
                newInput="<div id="+i+" class="+"tab"+">"+friend+"</div>";
            }
            document.getElementById("add_friends_here").innerHTML+=newInput;
        }
        document.getElementById(0).className += " current";
        for (let i = 0; i < friends.length; i++) {
            document.getElementById(i).onclick = function() {
                if (admin == "1") {
                    activateCell(i, true);
                } else {
                    activateCell(i, false);
                }
            }
        }
        if (admin == "1") {
            document.getElementById('mute_user').addEventListener("click", function(event) {
                event.stopPropagation();
                mute_user();
            });
        }
        loadMessages(active_friend);
    }
}

function loadMessages(friend) {
    console.log("loading messages...")
    let this_user = sessionStorage.getItem("active_user");
    console.log(this_user)
    console.log(friend)

    fetch('/get_messages', {
        method: 'POST',
        headers: {

            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: this_user,
            friend: friend
        })
    })
    .then( (response) => { 
        response.text()
        .then(function(res) {
            populateMessages(res.split("-"), friend, this_user)
        });
    })
}

function unpopulateMessages() {
    document.getElementById("previous_messages").innerHTML = "";
}

async function populateMessages(messages, friend) {

    unpopulateMessages()

    let key = sessionStorage.getItem(friend + "_shared_secret");
    key = await importSecretKey(JSON.parse(key))
    console.log(messages)
    if (messages != "No previous messages") {
        for (let i = 0; i < messages.length; i++) {
            const message = await decrypt(key, messages[i]);
            var user = message.split(":")[0]
            var mess = message.split(":")[1]
            if (user == friend) {
                newInput="<div class="+"message"+">   " + mess + "   </div>";
            } else {
                newInput="<div class="+"message_right"+">   " + mess + "   </div>";
            }
            document.getElementById("previous_messages").innerHTML += newInput;
        }
    } else {
        
        newInput="<div class="+"message_right"+">   " + messages + "   </div>";
        document.getElementById("previous_messages").innerHTML += newInput;
    }

}

async function decrypt(shared_secret, ciphertext) {
    if (ciphertext == "No previous messages") {
        return ciphertext
    }

    let { ct, iv_ } = toArrayBuffer(ciphertext)

    text = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv_
    },
    shared_secret,
    ct
  ).catch(function(err) {
    console.log(err);
  });

  let ret = new TextDecoder("utf-8").decode(text);
  console.log(ret)
  return ret

}

function toArrayBuffer(hexString) {

    let comps = hexString.split(",");

    console.log(comps)

    const main = comps[0]
    const iv = comps[1]
    
    let array = new Uint8Array(main.match(/../g).map(h=>parseInt(h,16))).buffer
    let iv_array = new Uint8Array(iv.match(/../g).map(h=>parseInt(h,16))).buffer

    return { 
        ct: array,
        iv_: iv_array
    };
}
},{}]},{},[1]);
