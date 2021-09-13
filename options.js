let usernameInput = document.getElementById('username');
let passwordInput = document.getElementById('password');
let serverIpInput = document.getElementById('serverIp');
let serverPortInput = document.getElementById('serverPort');
let spinnerDiv = document.getElementById('spinnerDiv');

let saveButton = document.getElementById('saveButton');
let loginButton = document.getElementById('loginButton');
let loginButtonModal = document.getElementById('loginButtonModal');
let alertSuccess = document.getElementById('alertSuccess');
let alertDanger = document.getElementById('alertDanger');

let loggedIn = false;
let storedServerIP, storedServerPort;

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

function getServerStatus(serverIp, serverPort) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `https://${serverIp}/api/statusServer`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const status = JSON.parse(xhr.responseText);
            console.log(status);
        }
    }
    xhr.send();
}

function login(serverIp, serverPort) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `https://${serverIp}/api/login`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (JSON.parse(xhr.responseText) === true) {
                chrome.storage.sync.set({
                    serverIp: serverIpInput.value,
                    serverPort: serverPortInput.value,
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

function saveServerData(serverIp, serverPort) {
    chrome.storage.sync.set({
        serverIp: serverIp,
        serverPort: serverPort,
        loggedIn: false
    }, function () {
        storedServerIP = serverIp;
        storedServerPort = serverPort;
        setSuccessMessage('Server data saved');
        checkLoggedIn();
    });
}


saveButton.onclick = function(ev) {
    const serverIp = serverIpInput.value;
    const serverPort = serverPortInput.value;

    // Checking permissions
    chrome.permissions.contains({
        origins: [`https://${serverIp}/`]
    }, function(result) {
        if (result) {
            saveServerData(serverIp, serverPort);
        } else {
            chrome.permissions.request({
                origins: [`https://${serverIp}/`]
            }, function(granted) {
                if (granted) {
                    saveServerData(serverIp, serverPort);
                } else {
                    alert('Not granting this permission will make the extension unusable.');
                }
            });
        }
    });
};

loginButton.onclick = function(ev) {
    loginModal.modal('show');
}

loginButtonModal.onclick = function(ev) {
    login(serverIpInput.value, null);
}

chrome.storage.sync.get(['serverIp', 'serverPort', 'loggedIn'], function(data) {
    storedServerIP = data.serverIp || '172.0.0.1'
    storedServerPort = data.serverPort || 8001;
    serverIpInput.value = storedServerIP;
    serverPortInput.value = storedServerPort;
    loggedIn = data.loggedIn;

    getServerStatus(storedServerIP, storedServerPort);
});
