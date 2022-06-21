window.addEventListener('load', async (event) => {

    var user = sessionStorage.getItem("active_user");
    console.log(user);

    loadFriends(user)

    document.getElementById("add_new_forum").onclick = function() {
        add_forum_post();
	}

    document.getElementById("post_reply").onclick = function() {
        add_reply();
	}
    
});

function get_input_title() {
    return "\
        <label for=\"title\">Title:</label>\
        <input type=\"text\" id=\"title\" name=\"title\">\
    "
}

function get_input_body() {
    return "\
        <label for=\"description\">Description:</label>\
        <input type=\"text\" id=\"description\" name=\"description\">\
        <button id=\"post\" type=\"post_reply\">POST</button>\
    "
}

function get_inputs() {
    return "\
        <div class=\"content_main\">\
            <div class=\"inputs_forum\">\
                <div id=\"input_title_forum\">\
                    Title: \
                </div>\
                <div id=\"input_text_forum\">\
                    <input id=\"title\" name=\"title\" type=\"text\" />\
                </div>\
                <div id=\"input_title_forum\">\
                    Description: \
                </div>\
                <div id=\"input_text_forum_description\">\
                    <textarea id=\"description\" name=\"description\" type=\"text\" /></textarea>\
                </div>\
                <div id=\"buttons_forum\">\
                    <Button id=\"post\"> POST </Button>\
                </div>\
            </div>\
        </div>\
    "
}

function get_forum() {
    return "\
        <div class=\"content_main\">\
            <div class=\"title_container\">\
                <div id=\"content_title\">\
                    ...\
                </div>\
            </div>\
            <div class=\"desc_container\">\
                <div id=\"content_body\">\
                    ...\
                </div>\
            </div>\
            <div class=\"replies_container\">\
                <div id=\"add_replies_here\">\
                            \
                </div>\
            </div>\
            <div id=\"add_reply\">\
                <div class=\"reply_container\">\
                    <div class=\"add_reply_content\">\
                        <input type=\"text\" id=\"reply\" name=\"reply\">\
                    </div>\
                    <div id=\"post_reply\">\
                        <button id=\"reply_button\" type=\"post_reply\">REPLY</button>\
                    </div>\
                </div>\
            </div>\
        </div>\
    "
}

function add_forum_post() {
    activateCell("add_new_forum", false)
    document.getElementById("main_section").innerHTML = get_inputs();
    document.getElementById("post").onclick = function() {
        create_post();
	}
}

function create_post() {
    data = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        op: sessionStorage.getItem("active_user")
    }
    fetch('/create_post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then((response) => { 
        response.text()
        .then(function(res) {
            if (res == "done") {
                location.reload();
            } else {
                alert("POST Failed!");
                location.reload();
            }
        });
    })
}

function loadFriends(user) {

    data = {
        user: user,
        key: sessionStorage.getItem("key")
    }

    fetch('/get_topic_names', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then((response) => { 
        response.json()
        .then(function(res) {
            if (res['friends'] == "") {
                return
            } else {
                populateHTML(res['topics'].split(","), res['admin']);
            }
        });
    })
}

function delete_post() {

    console.log("delete")

    data = {
        title: document.getElementById('selected_topic').innerText,
        user: sessionStorage.getItem("active_user"),
        key: sessionStorage.getItem("key")
    }

    fetch('/delete_topic', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then((response) => { 
        response.json()
        .then(function(res) {
            if (res['topics'] == "") {
                return
            } else {
                unpopulateHTML()
                populateHTML(res['topics'].split(","), res['admin']);
            }
        });
    })
}

function unpopulateHTML() {
    document.getElementById("add_topics_here").innerHTML="";
}

async function populateHTML(titles, admin){ 
    let active_topic;
    if (titles != null) {
        for (let i = 0; i < titles.length; i++) {
            const title = titles[i];
            // newInput="<div id="+i+" class="+"tab"+">"+title+"</div>";
            // document.getElementById("add_topics_here").innerHTML+=newInput;
            // if (i == 0) {
            //     active_topic = title;
            //     document.getElementById(i).className += " current";
            // }
            if (i == 0) {
                active_topic = title;
                if (admin == "1") {
                    newInput="<div id="+i+" class="+"tab"+"><div id=\"selected_topic\">"+title+"</div><div id=\"delete_post\">Delete</div></div>";
                } else {
                    newInput="<div id="+i+" class="+"tab"+">"+title+"</div>";
                }
            } else {
                newInput="<div id="+i+" class="+"tab"+">"+title+"</div>";
            }
            document.getElementById("add_topics_here").innerHTML+=newInput;
        }
        document.getElementById(0).className += " current";
        for (let i = 0; i < titles.length; i++) {
            document.getElementById(i).onclick = function() {
                if (admin == "1") {
                    activateCell(i, true);
                } else {
                    activateCell(i, false);
                }
            }
        }
        if (admin == "1") {
            document.getElementById('delete_post').addEventListener("click", function(event) {
                event.stopPropagation();
                delete_post();
            });
        }
        loadTopic(active_topic);
    }
}

function activateCell(i, admin) {
    // let x = document.getElementsByClassName('current')[0]
    // x.className = "tab";
    // document.getElementById(i).className += " current";
    // if (i != "add_new_forum") {
    //     let active_topic = document.getElementById(i).innerText;
    //     loadTopic(active_topic);
    // }

    let old_tab = document.getElementsByClassName('current')[0];
    let new_tab = document.getElementById(i)
    
    console.log(old_tab)
    console.log(new_tab)

    if (new_tab == old_tab) {
        return;
    }

    let active_topic = new_tab.innerText;
    old_tab.className = "tab";
    
    try {     
        let friend = document.getElementById('selected_topic').innerText;
        old_tab.innerHTML = friend;
    } catch { }

    if (admin) {
        new_tab.innerHTML = "<div id=\"selected_topic\">"+active_topic+"</div><div id=\"delete_post\">Delete</div>";
        document.getElementById('delete_post').addEventListener("click", function(event) {
            event.stopPropagation();
            delete_post();
        });
    }
    
    document.getElementById(i).className += " current";

    if (i != "add_new_forum") {
        loadTopic(active_topic);
    }

}

function loadTopic(active_topic) {

    document.getElementById("main_section").innerHTML = get_forum();

    var data = {
        content_id: active_topic,
    }

    fetch('/get_topic', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
    .then(function(response) {
        document.getElementById("content_title").innerHTML = response['title'];
        document.getElementById("content_body").innerHTML = response['body'];
        document.getElementById("add_replies_here").innerHTML = "";
        replies = response['replies'].split(",")
        if (response['replies'] != "") {
            for (let i = 0; i < replies.length; i++) {
                const reply = replies[i].split("-");
                newReply = "<div class=\"reply\">\
                                <div id=\"reply_user\"> "+ reply[0] + ": " + reply[1] + "</div>\
                            </div>";
                document.getElementById("add_replies_here").innerHTML += newReply;
            }
        }
        //document.getElementById("add_reply").innerHTML = get_add_reply();
        document.getElementById("post_reply").onclick = function() {
            add_reply();
        }
    });
}

function add_reply() {

    var user = sessionStorage.getItem("active_user")
    var current_topic = document.getElementsByClassName('current')[0].innerText;
    
    if (user == null || user == "None") {
        window.location = "/login";
        alert("Please login before submitting a message");
    }
    else{
        data = {
            name: current_topic,
            user: user,
            reply: document.getElementById("reply").value
        }
        if (data["reply"] == ""){
            alert("Blank message being sent")
        }
        else{
            console.log(data)


            fetch('/send_reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => response.text())
            .then(function(response) {
                if (response == "User muted"){
                    alert("Unable to send messages because user is muted. Please contact admin to regain privileges")
                }
                else{
                    console.log(response)
                    loadTopic(current_topic)
                }
            });
        }
    }
}