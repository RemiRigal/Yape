function getServerStatus(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/statusServer`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.hasOwnProperty('error')) {
                    if (callback) callback(false, response.error);
                } else {
                    if (callback) callback(true, null, response);
                }
            } catch {
                if (callback) callback(false, 'Server unreachable');
            }
        }
    }
    xhr.timeout = 5000;
    xhr.ontimeout = function() {
        if (callback) callback(false, 'Server unreachable');
    }
    xhr.send();
}

function login(username, password, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/login`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (JSON.parse(xhr.responseText) !== false) {
                if (callback) callback(true);
            } else {
                if (callback) callback(false, 'Login failed, invalid credentials');
            }
        }
    }
    xhr.timeout = 5000;
    xhr.ontimeout = function() {
        if (callback) callback(false, 'Login failed, server unreachable');
    }
    xhr.send(`username=${username}&password=${password}`);
}

function getStatusDownloads(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/statusDownloads`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const status = JSON.parse(xhr.responseText);
            if (callback) callback(status);
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
            if (callback) callback(urls);
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
            if (callback) callback(limitSpeed);
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
            const success = JSON.parse(xhr.responseText);
            if (callback) callback(success);
        }
    }
    xhr.send();
}

function addPackage(name, url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/addPackage`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const response = JSON.parse(xhr.responseText);
            if (response.hasOwnProperty('error')) {
                if (callback) callback(false, response.error);
            } else {
                if (callback) callback(true);
            }
        }
    }
    const safeName = name.replace(/[^a-z0-9._\-]/gi, '_');
    xhr.send(`name="${encodeURIComponent(safeName)}"&links=["${encodeURIComponent(url)}"]`);
}

function checkURL(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${origin}/api/checkURLs`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const response = JSON.parse(xhr.responseText);
            if (callback) callback(!response.hasOwnProperty('BasePlugin') && !response.hasOwnProperty('error'));
        }
    }
    xhr.send(`urls=["${encodeURIComponent(url)}"]`);
}
