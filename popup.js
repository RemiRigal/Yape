let statusDiv = document.getElementById('status');
let errorLabel = document.getElementById('error');
let successLabel = document.getElementById('success');
let pageDownloadDiv = document.getElementById('pageDownloadDiv');
let downloadButton = document.getElementById('download');
let downloadLabel = document.getElementById('downloadLabel');
let downloadDiv = document.getElementById('downloadDiv');
let optionsButton = document.getElementById('optionsButton');
let limitSpeedButton = document.getElementById('limitSpeedButton');
let externalLinkButton = document.getElementById('externalLinkButton');
let totalSpeedDiv = document.getElementById('totalSpeed');

let loggedIn = false;
let limitSpeedStatus = true;
let origin;


function checkURL(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/checkURLs`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const response = JSON.parse(xhr.responseText);
            callback(!response.hasOwnProperty('BasePlugin') && !response.hasOwnProperty('error'));
        }
    }
    xhr.send(`urls=["${encodeURIComponent(url)}"]`);
}

function addPackage(name, url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/addPackage`, true);
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
    xhr.send(`name="${safeName}"&links=["${encodeURIComponent(url)}"]`);
}

function getStatusDownloads(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/statusDownloads`, true);
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
    xhr.open('POST', `${origin}/api/getQueueData`, true);
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

function getLimitSpeedStatus(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/getConfigValue?category="download"&option="limit_speed"`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const limitSpeed = JSON.parse(xhr.responseText).toLowerCase() === 'true';
            callback(limitSpeed);
        }
    }
    xhr.send();
}

function setLimitSpeedStatus(limitSpeed, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/setConfigValue?category="download"&option="limit_speed"&value="${limitSpeed}"`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log(xhr.responseText);
            const success = JSON.parse(xhr.responseText);
            callback(success);
        }
    }
    xhr.send();
}

function updateLimitSpeedStatus() {
    getLimitSpeedStatus(function(status) {
        limitSpeedStatus = status;
        limitSpeedButton.style.color = limitSpeedStatus ? "black" : "#007bff";
        limitSpeedButton.disabled = false;
    });
}

function updateStatusDownloads(loop) {
    getStatusDownloads(function (status) {
        let html = '';
        let totalSpeed = 0;
        status.forEach(function(download) {
            totalSpeed += download.speed;
            html += `
                  <div style="margin-bottom: 12px; font-size: small">
                    <div class="d-flex">
                      <div class="ellipsis" style="padding-right: 24px">
                        ${download.name}
                      </div>
                      <div class="ml-auto">
                        ${download.format_eta.slice(0, 2)}h${download.format_eta.slice(3, 5)}m${download.format_eta.slice(6, 8)}
                      </div>
                    </div>
                    <div class="progress" style="margin: 2px 0 2px 0; height: 16px">
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
        if (totalSpeed > 0) {
            totalSpeedDiv.innerHTML = `- ${(totalSpeed / (1000 * 1000)).toFixed(2)} MB/s`;
        } else {
            totalSpeedDiv.innerHTML = '';
        }
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

limitSpeedButton.onclick = function(event) {
    limitSpeedStatus = !limitSpeedStatus;
    limitSpeedButton.disabled = true;
    setLimitSpeedStatus(limitSpeedStatus, function(success) {
        updateLimitSpeedStatus();
    });
}

chrome.storage.sync.get(['serverIp', 'serverPort', 'protocol', 'loggedIn'], function(data) {
    const serverIp = data.serverIp;
    const serverPort = data.serverPort;
    const protocol = data.protocol;
    origin = `${protocol}://${serverIp}:${serverPort}`

    externalLinkButton.onclick = function(event) {
        chrome.tabs.create({'url': `${origin}/home`});
    }

    loggedIn = data.loggedIn;
    if (!loggedIn) {
        setErrorMessage(`No credentials are specified, please set them in the extension's option page`);
        statusDiv.innerHTML = '';
        return;
    }

    // Status downloads
    updateStatusDownloads(true);

    // Limit speed status
    updateLimitSpeedStatus();

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






