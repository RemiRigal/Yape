let statusDiv = document.getElementById('status');
let errorLabel = document.getElementById('error');
let successLabel = document.getElementById('success');
let pageDownloadDiv = document.getElementById('pageDownloadDiv');
let downloadButton = document.getElementById('download');
let downloadLabel = document.getElementById('downloadLabel');
let downloadDiv = document.getElementById('downloadDiv');
let optionsButton = document.getElementById('optionsButton');

let loggedIn = false;

let serverIp, serverPort;
chrome.storage.sync.get(['serverIp', 'serverPort'], function(data) {
    serverIp = data.serverIp;
    serverPort = data.serverPort;
});

function login(username, password, callback) {
    if (!username || !password) {
        callback(false);
        return;
    }
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${serverIp}:${serverPort}/api/login`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            callback(JSON.parse(xhr.responseText));
        }
    }
    xhr.timeout = 5000;
    xhr.ontimeout = function() {
        callback(false);
    }
    xhr.send(`username=${username}&password=${password}`);
}

function checkURL(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${serverIp}:${serverPort}/api/checkURLs`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const response = JSON.parse(xhr.responseText);
            callback(!response.hasOwnProperty('BasePlugin') && !response.hasOwnProperty('error'));
        }
    }
    xhr.send(`urls=["${url}"]`);
}

function addPackage(name, url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${serverIp}:${serverPort}/api/addPackage`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const response = JSON.parse(xhr.responseText);
            if (response.hasOwnProperty('error')) {
                callback(false, response.error);
            } else {
                callback(true);
            }
        }
    }
    const safeName = name.replace(/[^a-z0-9._\-]/gi, '_');
    xhr.send(`name="${safeName}"&links=["${url}"]`);
}

function getStatusDownloads(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${serverIp}:${serverPort}/api/statusDownloads`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const status = JSON.parse(xhr.responseText);
            callback(status);
        }
    }
    xhr.send();
}

function getQueueData(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${serverIp}:${serverPort}/api/getQueueData`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const queueData = JSON.parse(xhr.responseText);
            const urls = [];
            queueData.forEach(pack => {
                pack.links.forEach(link => {
                    urls.push(link.url);
                });
            });
            callback(urls);
        }
    }
    xhr.send();
}

function updateStatusDownloads(loop) {
    getStatusDownloads(function (status) {
        let html = '';
        status.forEach(function(download) {
            html += `
                  <div style="margin-bottom: 12px">
                    <div class="d-flex">
                      <div class="ellipsis" style="padding-right: 24px">
                        ${download.name}
                      </div>
                      <div class="ml-auto">
                        ${download.format_eta.slice(0, 2)}h${download.format_eta.slice(3, 5)}m${download.format_eta.slice(6, 8)}
                      </div>
                    </div>
                    <div class="progress" style="margin: 2px 0 2px 0; height: 20px">
                      <div role="progressbar" class="progress-bar progress-bar-striped progress-bar-animated" 
                        aria-valuenow="${download.percent}" aria-valuemin="0" aria-valuemax="100"
                        style="width: ${download.percent}%;">
                        ${download.percent}%
                      </div>
                    </div>
                  </div>
                `;
        });
        if (!html) {
            html = `
              <div class="text-center m-4" style="margin-bottom: 12px; color: gray">
                No active downloads
              </div>
            `;
        }
        statusDiv.innerHTML = html;
        if (loop) {
            setTimeout(updateStatusDownloads, 3000, true);
        }
    });
}

function setErrorMessage(message) {
    errorLabel.innerText = message;
    errorLabel.hidden = false;
}

function setSuccessMessage(message) {
    successLabel.innerText = message;
    successLabel.hidden = false;
}


downloadButton.onclick = function(event) {
    if (!loggedIn) {
        return;
    }
    downloadButton.disabled = true;
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        const url = tabs[0].url;
        const name = tabs[0].title;
        addPackage(name, url, function(success, errorMessage) {
            if (!success) {
                setErrorMessage(`Error downloading package: ${errorMessage}`);
                return;
            }
            downloadDiv.hidden = true;
            setSuccessMessage(`Download added`);
            updateStatusDownloads(false);
        });
    });
};

optionsButton.onclick = function(event) {
    chrome.tabs.create({'url': '/options.html'});
}


chrome.storage.sync.get(['username', 'password'], function(data) {
    const username = data.username;
    const password = data.password;
    if (!username || !password) {
        setErrorMessage(`No credentials are specified, please set them in the extension's option page`);
        statusDiv.innerHTML = '';
        return;
    }
    login(username, password, function(success, errorMessage) {
        if (!success) {
            setErrorMessage(`Login failed, invalid credentials or server unreachable`);
            statusDiv.innerHTML = '';
            return;
        }
        loggedIn = true;

        // Status downloads
        updateStatusDownloads(true);

        // Download current tab's page
        chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
            const url = tabs[0].url;
            const name = tabs[0].title;
            downloadLabel.innerText = name;
            checkURL(url, function(success) {
                if (!success) {
                    // No plugin found for the current page
                    return;
                }
                getQueueData(function(urls) {
                    pageDownloadDiv.hidden = false;
                    if (urls.includes(url)) {
                        setErrorMessage(`Download already added`);
                        return;
                    }
                    downloadDiv.hidden = false;
                });
            });
        });
    });
});






