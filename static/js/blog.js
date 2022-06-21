window.addEventListener('load', async (event) => {

    document.getElementById("0").onclick = function() {
        select(0);
    }

    document.getElementById("1").onclick = function() {
        select(1);
	}

    document.getElementById("2").onclick = function() {
        select(2);
	}

    document.getElementById("3").onclick = function() {
        select(3);
	}

    document.getElementById("4").onclick = function() {
        select(4);
	}
    
});

function select(i) {
    let x = document.getElementsByClassName('current')[0]
    x.className = "tab";
    document.getElementById(i).className += " current";
    get_content(i);
}

function get_content(i) {

    var data = {
        content_id: i,
    }

    fetch('/get_content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => response.text())
    .then(function(response) {
        document.getElementById("main_section").innerHTML = response;
    });

}