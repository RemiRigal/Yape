# Yape - Browser extension for PyLoad

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/lbbofcfllogcmffofacfoiolglncdcgb.svg?style=flat-square)](https://chrome.google.com/webstore/detail/yape/lbbofcfllogcmffofacfoiolglncdcgb)
[![Chrome Web Store Downloads](https://img.shields.io/chrome-web-store/d/lbbofcfllogcmffofacfoiolglncdcgb.svg?style=flat-square)](https://chrome.google.com/webstore/detail/yape/lbbofcfllogcmffofacfoiolglncdcgb/reviews)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/stars/lbbofcfllogcmffofacfoiolglncdcgb.svg?style=flat-square)](https://chrome.google.com/webstore/detail/yape/lbbofcfllogcmffofacfoiolglncdcgb/reviews)

[![Firefox Web Store Version](https://img.shields.io/amo/v/remi.rigal@ensta-bretagne.org.svg?style=flat-square&label=firefox%20add-on)](https://addons.mozilla.org/fr/firefox/addon/yape/)
[![Firefox Web Store Downloads](https://img.shields.io/amo/users/remi.rigal@ensta-bretagne.org.svg?style=flat-square)](https://addons.mozilla.org/fr/firefox/addon/yape/)
[![Firefox Web Store Rating](https://img.shields.io/amo/stars/remi.rigal@ensta-bretagne.org.svg?style=flat-square&label=ratings)](https://addons.mozilla.org/fr/firefox/addon/yape/)



Yape stands for **Yet Another PyLoad Extension**. It's a dead simple browser extension for monitoring and easily adding downloads to a [PyLoad](https://github.com/pyload/pyload) server.

Features:
- One-click download
- Monitor current downloads
- Monitor global bandwidth usage & one-click speed limiter
- Context menu downloads


## Install

**[Available on the Chrome Web Store](https://chrome.google.com/webstore/detail/yape/lbbofcfllogcmffofacfoiolglncdcgb)**  
**[Available on Firefox Add-ons](https://addons.mozilla.org/fr/firefox/addon/yape/)**


## Usage

Go to the option page by clicking on the `settings` icon and fill the IP address and the port of the `PyLoad` server. Click `Save` and then `Login` to enter your credentials.

> Note: The credentials are not stored on the browser, only the session cookie.  

The current downloads are always displayed.
If the current active tab has a downloadable file, an extra panel will be displayed with a button to start the download.
A download can also be added by right-clicking on a link and selecting `Download with Yape`.


## Screenshot

![Screenshot](images/screenshot.jpg)


## License

Yape is licensed under the [MIT License](https://github.com/RemiRigal/Yape/blob/master/LICENSE).
