const notify = function(title, message) {
    return chrome.notifications.create('', {
        type: 'basic',
        title: title || 'Yape',
        message: message || '',
        iconUrl: './images/icon.png',
    });
}

const loadToastr = function(tab, callback) {
    browser.tabs.insertCSS(tab.id, {
        file: 'css/toastr.min.css'
    }, function() {
        browser.tabs.executeScript(tab.id, {
            file: 'js/lib/jquery-3.5.1.min.js'
        }, function() {
            browser.tabs.executeScript(tab.id, {
                file: 'js/lib/toastr.min.js'
            }, function() {
                browser.tabs.executeScript(tab.id, {
                    code:
                        `toastr.options = {
                            closeButton: false,
                            newestOnTop: false,
                            progressBar: false,
                            positionClass: 'toastr-top-right',
                            containerId: 'toastr-container',
                            toastClass: 'toastr',
                            iconClasses: {
                                error: 'toastr-error',
                                info: 'toastr-info',
                                success: 'toastr-success',
                                warning: 'toastr-warning'
                            },
                            iconClass: 'toastr-info',
                            titleClass: 'toastr-title',
                            messageClass: 'toastr-message',
                            closeClass: 'toastr-close-button',
                            timeOut: 8000
                        };
                        undefined;`
                }, function() {
                    callback();
                });
            });
        });
    });
}

const sendToast = function(tab, type, message) {
    browser.tabs.executeScript(tab.id, {
        code: `toastr.remove();
               toastr['${type}']('${message}');
               undefined;`
    });
}

const downloadLink = function(info, tab) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    fetch(`${origin}/api/statusServer`, { signal: controller.signal })
        .then(response => response.json())
        .then(json => {
            clearTimeout(timeoutId);
            if (json.hasOwnProperty('error')) {
                if (json.error === 'Forbidden') sendToast(tab, 'error', `Invalid credentials, make sure you are logged in`);
                else sendToast(tab, 'error', `Server unreachable`);
                return;
            }
            fetch(`${origin}/api/checkURLs?urls=["${encodeURIComponent(info.linkUrl)}"]`)
                .then(response => response.json())
                .then(json => {
                    if (json.hasOwnProperty('error')) {
                        sendToast(tab, 'error', `Error checking url: ${json}`);
                        return;
                    }
                    const safeName = encodeURIComponent(info.linkUrl.replace(/[^a-z0-9._\-]/gi, '_'));
                    fetch(`${origin}/api/addPackage?name="${safeName}"&links=["${encodeURIComponent(info.linkUrl)}"]`)
                        .then(response => response.json())
                        .then(json => {
                            if (json.hasOwnProperty('error')) {
                                sendToast(tab, 'error', `Error requesting download: ${json}`);
                                return;
                            }
                            sendToast(tab, 'success', 'Download added successfully');
                        });
                });
        })
        .catch(e => sendToast(tab, 'error', `Server unreachable`));
}

chrome.runtime.onInstalled.addListener( () => {
    chrome.contextMenus.create({
        id: 'yape',
        title: 'Download with Yape',
        contexts:['link']
    });
});

chrome.runtime.onMessage.addListener( data => {
    if (data.type === 'notification') {
        notify(data.title, data.message);
    }
});

chrome.contextMenus.onClicked.addListener( ( info, tab ) => {
    if ('yape' === info.menuItemId) {
        loadToastr(tab, function() {
            pullStoredData(function() {
                sendToast(tab, 'info', 'Requesting download...');
                downloadLink(info, tab);
            });
        });
    }
} );
