let usernameInput = document.getElementById('username');
let passwordInput = document.getElementById('password');
let serverIpInput = document.getElementById('serverIp');
let serverPortInput = document.getElementById('serverPort');

let saveButton = document.getElementById('save');
let savedLabel = document.getElementById('saved');


function setSaved() {
    savedLabel.hidden = false;
    setTimeout(function() {
        savedLabel.hidden = true;
    }, 3000);
}


saveButton.onclick = function(ev) {
    chrome.storage.sync.set({
        username: usernameInput.value,
        password: passwordInput.value,
        serverIp: serverIpInput.value,
        serverPort: serverPortInput.value
    }, function () {
        chrome.permissions.contains({
            origins: [`http://${serverIpInput.value}:${serverPortInput.value}/`]
        }, function(result) {
            console.log(result);
            if (result) {
                setSaved();
            } else {
                chrome.permissions.request({
                    origins: [`http://${serverIpInput.value}:${serverPortInput.value}/`]
                }, function(granted) {
                    console.log(result);
                    if (granted) {
                        setSaved();
                    } else {
                        alert('Not granting this permission will make the extension unusable.')
                    }
                });
            }
        });
    });
};

chrome.storage.sync.get(['username', 'password', 'serverIp', 'serverPort'], function(data) {
    usernameInput.value = data.username || '';
    passwordInput.value = data.password || '';
    serverIpInput.value = data.serverIp || '172.0.0.1';
    serverPortInput.value = data.serverPort || 8001;
});
