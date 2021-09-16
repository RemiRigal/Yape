let usernameInput = document.getElementById('username');
let passwordInput = document.getElementById('password');
let serverIpInput = document.getElementById('serverIp');
let serverPortInput = document.getElementById('serverPort');
let useHTTPSInput = document.getElementById('useHTTPS');
let spinnerDiv = document.getElementById('spinnerDiv');

let saveButton = document.getElementById('saveButton');
let loginButton = document.getElementById('loginButton');
let loginButtonModal = document.getElementById('loginButtonModal');
let alertSuccess = document.getElementById('alertSuccess');
let alertDanger = document.getElementById('alertDanger');

let loggedIn = false;
let storedServerIP, storedServerPort, storedProtocol;
let origin;

let loginModal = $('#loginModal');
loginModal.on('hide.bs.modal', function() {
    checkLoggedIn();
});


function enableSpinner() {
    spinnerDiv.innerHTML = `
        <div class="spinner-border text-primary m-3"></div>
        <div>Logging in...</div>
    `;
}

function disableSpinner() {
    spinnerDiv.innerHTML = ``;
}

function setSuccessMessage(message, timeout=3000) {
    alertSuccess.innerText = message;
    alertSuccess.hidden = false;
    if (timeout > 0) {
        setTimeout(function() {
            alertSuccess.hidden = true;
            alertSuccess.innerText = '';
        }, timeout);
    }
}

function setDangerMessage(message, timeout=3000) {
    alertDanger.innerText = message;
    alertDanger.hidden = false;
    if (timeout > 0) {
        setTimeout(function() {
            alertDanger.hidden = true;
            alertDanger.innerText = '';
        }, timeout);
    }
}

function checkLoggedIn() {
    if (!loggedIn && storedServerIP && storedServerPort) {
        getServerStatus(storedServerIP, storedServerPort, function(success) {
            if (!success) {
                setDangerMessage('Login is required to use the extension', 0);
            }
        });
    }
}

function getServerStatus() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/statusServer`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const status = JSON.parse(xhr.responseText);
            console.log(status);
        }
    }
    xhr.send();
}

function getProtocol() {
    return useHTTPSInput.checked ? 'https' : 'http';
}

function login() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/login`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (JSON.parse(xhr.responseText) === true) {
                chrome.storage.sync.set({
                    serverIp: serverIpInput.value,
                    serverPort: serverPortInput.value,
                    protocol: getProtocol(),
                    loggedIn: true
                }, function () {
                    setSuccessMessage('Server data saved');
                    disableSpinner();
                    loginModal.modal('hide');
                });
            } else {
                setDangerMessage('Login failed, invalid credentials', 0);
            }
        }
    }
    xhr.timeout = 5000;
    xhr.ontimeout = function() {
        setDangerMessage('Login failed, server unreachable');
    }
    xhr.send(`username=${username.value}&password=${password.value}`);
}

function saveServerData(serverIp, serverPort, protocol) {
    chrome.storage.sync.set({
        serverIp: serverIp,
        serverPort: serverPort,
        protocol: protocol,
        loggedIn: false
    }, function () {
        storedServerIP = serverIp;
        storedServerPort = serverPort;
        storedProtocol = protocol;
        setSuccessMessage('Server data saved');
        checkLoggedIn();
    });
}

function requestPermission(serverIp, serverPort, protocol) {
    chrome.permissions.contains({
        origins: [`${origin}/`]
    }, function(result) {
        if (result) {
            saveServerData(serverIp, serverPort, protocol);
        } else {
            chrome.permissions.request({
                origins: [`${origin}/`]
            }, function(granted) {
                if (granted) {
                    saveServerData(serverIp, serverPort, protocol);
                } else {
                    alert('Not granting this permission will make the extension unusable.');
                }
            });
        }
    });
}


saveButton.onclick = function(ev) {
    const serverIp = serverIpInput.value;
    const serverPort = serverPortInput.value;
    const protocol = getProtocol();
    origin = `${protocol}://${serverIp}:${serverPort}`
    requestPermission(serverIp, serverPort, protocol);
};

loginButton.onclick = function(ev) {
    loginModal.modal('show');
}

loginButtonModal.onclick = function(ev) {
    login(serverIpInput.value, null);
}

chrome.storage.sync.get(['serverIp', 'serverPort', 'protocol', 'loggedIn'], function(data) {
    console.log(data);
    storedServerIP = data.serverIp || '172.0.0.1'
    storedServerPort = data.serverPort || 8001;
    storedProtocol = data.protocol || 'http';
    serverIpInput.value = storedServerIP;
    serverPortInput.value = storedServerPort;
    useHTTPSInput.checked = storedProtocol === 'https';
    loggedIn = data.loggedIn;

    origin = `${storedProtocol}://${storedServerIP}:${storedServerPort}`;
    getServerStatus();
});
