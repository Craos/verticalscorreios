var basis = ["b", "kb", "mb", "gb"];
function getBasis(size, current, asObj) {
    current = current || 0;
    if (size < 1024) {
        return asObj ? {
            size: size,
            metric: basis[current]
        } : size + basis[current]
    }
	return this.getBasis(Math.round(size / 1024), current + 1, asObj);
}

var filesData = [
    {
        size: 100000,
        name: "index.php"
    },
    {
        size: 25555,
        name: "index.js"
    },
    {
        size: 2555412,
        name: "document.doc"
    },
    {
        size: 52555,
        name: "documentation.pdf"
    },
    {
        size: 23555,
        name: "archive.zip"
    },
    {
        size: 72555,
        name: "prototype.psd"
    }
];

var filesDataWithPreview = [
    {
        name: "moon.jpg",
        preview: "/backend/upload/previews/moon.jpg",
        size: 97200
    },
    {
        name: "logo.psd",
        size: 46100,
    }
];


var turnOnClassName = "radio mdi mdi-radiobox-marked";
var turnOffClassName = "radio mdi mdi-radiobox-blank";

function addListenersForRadioGroup(radioGroup, onchange) {
    var active = radioGroup.getElementsByClassName("checked")[0];
    
    var radioBlocks = radioGroup.getElementsByClassName("radio-block");

    for (var i=0; i<radioBlocks.length; i++) {
        radioBlocks[i].onclick = function() {
            if (this === active) {
                return;
            }
            if (active) {
                var activeRadio = active.getElementsByClassName("radio")[0];
                activeRadio.className = turnOffClassName;
                active.classList.remove("checked");
            }

            var radio = this.getElementsByClassName("radio")[0];
            radio.className = turnOnClassName;
            this.classList.add("checked");

            active = this;

            onchange(this.id);
        }
    }
}


function checkHref() {
    var href = window.location.href;
    if (href.slice(0, 4) !== "http") {
        dhx.message({
	text: "Please open this page by http:// or https://<br>You can start a local server by typing<br><br>`npm install && npm start`<br><br>from the command line.",
            css: "dhx-error"
        });
    }
}
document.addEventListener("DOMContentLoaded", checkHref);
