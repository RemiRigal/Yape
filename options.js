let usernameInput = document.getElementById('username');
let passwordInput = document.getElementById('password');
let serverIpInput = document.getElementById('serverIp');
let serverPortInput = document.getElementById('serverPort');
let useHTTPSInput = document.getElementById('useHTTPS');
let spinnerDiv = document.getElementById('spinnerDiv');
let loginStatusOKDiv = document.getElementById('loginStatusOK');
let loginStatusKODiv = document.getElementById('loginStatusKO');

let saveButton = document.getElementById('saveButton');
let loginButton = document.getElementById('loginButton');
let loginButtonModal = document.getElementById('loginButtonModal');
let alertDanger = document.getElementById('alertDanger');

let loginModal = $('#loginModal');


function enableSpinner() {
    spinnerDiv.innerHTML = `
        <div class="spinner-border text-primary m-3"></div>
        <div>Checking status...</div>
    `;
}

function disableSpinner() {
    spinnerDiv.innerHTML = ``;
}

function setDangerMessage(message, timeout=3000) {
    if (!message) {
        alertDanger.hidden = true;
        return;
    }
    alertDanger.innerText = message;
    alertDanger.hidden = false;
    if (timeout > 0) {
        setTimeout(function() {
            alertDanger.hidden = true;
            alertDanger.innerText = '';
        }, timeout);
    }
}

function getProtocol() {
    return useHTTPSInput.checked ? 'https' : 'http';
}

function updateLoggedInStatus() {
    loginStatusOKDiv.hidden = true;
    loginStatusKODiv.hidden = true;
    loginButton.hidden = true;
    enableSpinner();
    isLoggedIn(function(loggedIn) {
        disableSpinner();
        loginStatusOKDiv.hidden = !loggedIn;
        loginStatusKODiv.hidden = loggedIn;
        loginButton.hidden = loggedIn;
    });
}

function requestPermission(callback) {
    chrome.permissions.contains({
        origins: [`${origin}/`]
    }, function(result) {
        if (!result) {
            chrome.permissions.request({
                origins: [`${origin}/`]
            }, function(granted) {
                if (callback) {
                    if (!granted) {
                        alert('Not granting this permission will make the extension unusable.');
                    }
                    callback(granted);
                }
            });
        } else if (callback) {
            callback(true);
        }
    });
}

saveButton.onclick = function(ev) {
    setOrigin(serverIpInput.value, serverPortInput.value, getProtocol(), function() {
        requestPermission(function(granted) {
            updateLoggedInStatus();
        });
    });
};

loginButton.onclick = function(ev) {
    loginModal.modal('show');
}

loginButtonModal.onclick = function(ev) {
    setDangerMessage('');
    login(usernameInput.value, passwordInput.value, function(success, error_msg) {
        if (success) {
            loginModal.modal('hide');
            updateLoggedInStatus();
        } else {
            setDangerMessage(error_msg, 0);
        }
    });
}

pullStoredData(function() {
    serverIpInput.value = serverIp;
    serverPortInput.value = serverPort;
    useHTTPSInput.checked = serverProtocol === 'https';

    updateLoggedInStatus();
});
