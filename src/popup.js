// Copyright (c) 2019 Stefano Teodorani
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var protocol = '';
var domain = '';
var activeCookiePrefix = ''
var activeFullCookieValue = ''
var activeCookieValue = ''
var activeCookieName = ''

if (!chrome.cookies) {
  chrome.cookies = chrome.experimental.cookies;
}

// Set Badge (for now not user)
// ============================
function setBadge(value) {
  //chrome.browserAction.setBadgeText({text: value.toString()});
  //chrome.browserAction.setBadgeText({text: ''});
  var junk = '';
}

// Reload specific appserver
// ==========================
function reloadSpecificServer(e) {
  var radioGroup = document.getElementsByName('App-Server'),
    selectedRadio;
  console.log(radioGroup.length);
  for (var i = 0; i < radioGroup.length; i++) {
    if (radioGroup[i].checked) {
      setBadge((i + 1).toString());
      selectedRadio = radioGroup[i].value;
      break;
    }
  }

  console.log('url', protocol + '://' + domain);
  console.log('selectedRadio', selectedRadio);

  chrome.cookies.set({
    "name": activeCookieName,
    "url": protocol + '://' + domain,
    "value": activeCookiePrefix + selectedRadio
  }, function(cookie) {
    chrome.tabs.getSelected(null, function(tab) {
      var code = 'window.location.reload();';
      chrome.tabs.executeScript(tab.id, {
        code: code
      });
      window.close();
    });
  });
}

// 2. Get Server JSON
// ===================
function GetServerJSON() {
  chrome.tabs.query({
    'active': true,
    'lastFocusedWindow': true
  }, function(tabs) {
    var url = tabs[0].url;

    protocol = url.split('://')[0];

    // -- Get and Match JSESSIONID
    domain = url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];

    // Get json server list
    let serverlist = 'https://raw.githubusercontent.com/teopost/was-selector-chrome-extension/master/payloads-v3/' + domain + '.json';

    console.log('serverlist:' + serverlist);

    fetch(serverlist)
      .then(res => res.json())
      .then((out) => {
        document.getElementById('non-rbServer').className = "wcs-hide";
        var myCookieHelper = new CookieHelper(out);
        myCookieHelper.showCookies();

      })
      .catch(err => {
        document.getElementById('right-aligned').className = "wcs-hide";
        document.getElementById('owsname').className = "wcs-hide";
        document.getElementById('rwsname').className = "wcs-hide";
        document.getElementById('prod-all-servers').className = "wcs-hide";
        //throw err
      });
  })
}

// 3. Cookie Helper
// =================
function CookieHelper(objPayload) {
  // Show Cookies method
  this.showCookies = function() {

    // Get all cookies
    chrome.cookies.getAll({}, function(cookies) {

      var tblDetails = document.getElementById('tblDetails');

      // Determine active tab
      chrome.tabs.query({
        'active': true,
        'lastFocusedWindow': true
      }, function(tabs) {
        var url = tabs[0].url;

        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onload = function() {
          document.getElementById("domain").innerHTML = (objPayload.title == null ? "WAS Selector - " : objPayload.title) + domain;

          // Get Web server custom header
          var myHeader = req.getResponseHeader("OWS");

          if (myHeader != null) {
            document.getElementById("owsname").innerHTML = 'Web Server: ' + myHeader;
          } else {
            document.getElementById("owsname").innerHTML = '';
          }

          // Get reverse proxy custom header
          var myHeader = req.getResponseHeader("RWS");

          if (myHeader != null) {
            document.getElementById("rwsname").innerHTML = 'Rev. Proxy: ' + myHeader;
          } else {
            document.getElementById("rwsname").innerHTML = '';
          }


          // Work out domain
          //var domain = url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];
          // get JSESSIONID var
          activeCookieName = objPayload.cookie == null ? "JSESSIONID" : objPayload.cookie;

          GetCookie(activeCookieName, cookies, domain);

          // Parsing appServer list
          let appserverList = objPayload.appserver;
          for (var srv in appserverList) {
            // prg = prg + 1;

            var trAppserver = document.createElement('tr');

            console.log("objPayload: " + appserverList['appserver']);
            console.log("payload:" + appserverList[srv].name, appserverList[srv].jsessionid);

            if (activeCookieValue == appserverList[srv].jsessionid) {
              trAppserver.style.background = "rgb(195, 198, 185)";
            }

            var tdOption = document.createElement('td');
            tdOption.style.textAlign = "center";

            var x = document.createElement("INPUT");
            x.setAttribute("type", "radio");
            x.setAttribute("name", "App-Server");
            x.setAttribute("value", appserverList[srv].jsessionid);

            if (activeCookieValue == appserverList[srv].jsessionid) {
              x.setAttribute("checked", true);
            }

            tdOption.appendChild(x);

            var tdDomain = document.createElement('td');
            tdDomain.innerHTML = appserverList[srv].name;

            var tdName = document.createElement('td');
            tdName.innerHTML = appserverList[srv].hostname;

            var tdValue = document.createElement('td');
            tdValue.innerHTML = appserverList[srv].jsessionid;

            trAppserver.appendChild(tdOption);
            trAppserver.appendChild(tdDomain);
            trAppserver.appendChild(tdName);
            trAppserver.appendChild(tdValue);

            tblAppservers.appendChild(trAppserver);
          } // end appserver for

          let detailList = objPayload.details;
          for (var det in detailList) {

            // creo una riga
            var trDetail = document.createElement('tr');
            //trDetail.style.background = "rgb(195, 198, 185)";

            // creo la prima colonna
            var tdName = document.createElement('td');
            //tdName.innerHTML = detailList[det].name;

                var element = document.createElement("a");
                if (detailList[det].link) {
                  element.setAttribute("href", detailList[det].link);
                  element.target = "_blank";
                }
                element.title = detailList[det].tooltip;
                element.innerHTML = detailList[det].name;
                tdName.appendChild(element);

            // attacco la prima colonna alla riga
            trDetail.appendChild(tdName);

            // creo la seconda colonna
            //var tdLink = document.createElement('td');
            //tdLink.innerHTML = detailList[det].link;

            // attacco la seconda colonna alla riga
            //trDetail.appendChild(tdLink);

            // attacco la riga alla tabella
            tblDetails.appendChild(trDetail);

          } // end details for
        };
        req.send();
        // --------------
      });
    });
  }
}

// 4. Get Cookies
// ===============
function GetCookie(name, cookies, domain) {
  var myCookie = '';

  for (var i in cookies) {
    if (cookies[i].domain == domain) {
      if (cookies[i].name == name) {
        myCookie = cookies[i].value;
        break;
      }
    }
  }

  if (name == "JSESSIONID") {
    activeCookiePrefix = myCookie.split(':')[0] + ":";
    activeCookieValue = myCookie.split(':')[1];
    activeFullCookieValue = myCookie;
  }
  else {
    activeCookiePrefix = "";
    activeCookieValue = myCookie;
    activeFullCookieValue = myCookie;
  }

  return myCookie;
}


// 1. START
// Run our kitten generation script as soon as the document's DOM is ready.
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('right-aligned').addEventListener('click', reloadSpecificServer);
  GetServerJSON();
});
