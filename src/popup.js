// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var protocol='';
var domain='';
var jsessionLastPrefix=''
var jsessionLastValue=''

if (!chrome.cookies) {
  chrome.cookies = chrome.experimental.cookies;
}

function setBadge(value) {
  //chrome.browserAction.setBadgeText({text: value.toString()});
  //chrome.browserAction.setBadgeText({text: ''});
  var junk='';
}

function reloadSpecificServer(e) {

  var radioGroup =document.getElementsByName('App-Server'), selectedRadio ;
  console.log(radioGroup.length);
  for (var i = 0; i < radioGroup.length; i++) {
    if (radioGroup[i].checked){
      setBadge((i+1).toString());
      selectedRadio = radioGroup[i].value;
      break;
    }
  }

  console.log('url', protocol+'://'+domain);
  console.log('selectedRadio', selectedRadio);

  chrome.cookies.set({"name":"JSESSIONID","url":protocol+'://'+domain,"value":jsessionLastPrefix+':'+selectedRadio},function (cookie){
      chrome.tabs.getSelected(null, function(tab) {
        var code = 'window.location.reload();';
        chrome.tabs.executeScript(tab.id, {code: code});
        window.close();
      });
  });
}


function GetServerJSON(){
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var url = tabs[0].url;

    protocol = url.split('://')[0];

    // -- Get and Match JSESSIONID
    domain = url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];

    // Get json server list
    let serverlist = 'https://raw.githubusercontent.com/teopost/was-selector/master/payloads/' + domain + '.json';

    console.log('serverlist:' + serverlist);

    fetch(serverlist)
    .then(res => res.json())
    .then((out) => {
      document.getElementById('non-rbServer').className = "wcs-hide";
      var cookieHelper = new CookieHelper(out);
      cookieHelper.showCookies();

    })
    .catch(err => {
      document.getElementById('right-aligned').className = "wcs-hide";
      document.getElementById('owsname').className = "wcs-hide";
      document.getElementById('prod-all-servers').className = "wcs-hide";
      throw err
    });
  })
}

function GetCookie(name, cookies, domain) {
  var myjsessionid = '';

  for (var i in cookies) {
      if (cookies[i].domain == domain) {
             if (cookies[i].name == 'JSESSIONID') {
                myjsessionid = cookies[i].value;
                break;
             }
           }
   }

   jsessionLastPrefix = myjsessionid.split(':')[0];
   jsessionLastValue = myjsessionid.split(':')[1];

   return myjsessionid;
}

function CookieHelper(serverlist) {
	// Not using this
	//this.pinnedCookies = {};

	// Not using this
	//this.reset = function() {
	//	this.pinnedCookies = {};
	//}

	// Show Cookies method
	this.showCookies = function() {

		// Get all cookies
	  chrome.cookies.getAll({}, function(cookies) {

			var tblCookies = document.getElementById('tblCookies');

			// Determine active tab
      chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        var url = tabs[0].url;

        // - Get headers
        var req = new XMLHttpRequest();
        req.open('HEAD', url, false);
        req.send();
        var myHeader = req.getResponseHeader("OWS");
        if (myHeader != null) {
          document.getElementById("owsname").innerHTML = 'Served by IHS: ' + myHeader;
        }
        else {
            document.getElementById("owsname").innerHTML = '';
        }

				// Work out domain
				//var domain = url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];

        var myjsessionid = GetCookie('JSESSIONID', cookies, domain);
        console.log("mysessionid", myjsessionid);

        var prg=0;
        for (var srv in serverlist) {
          prg=prg+1;

          var trCookie = document.createElement('tr');

          console.log("payload:" + serverlist[srv].name, serverlist[srv].jsessionid);

          if (myjsessionid.split(':')[1] == serverlist[srv].jsessionid) {
            trCookie.style.background = "rgb(195, 198, 185)";
            console.log('myjsessionid >>>>>>>>>>>>>>>>>>>>>> ' + myjsessionid);
            console.log('serverlist[srv].jsessionid >>>>>>>> ' + serverlist[srv].jsessionid);
            setBadge(prg);
          }

          var tdOption = document.createElement('td');
          tdOption.style.textAlign = "center";

          var x = document.createElement("INPUT");
          x.setAttribute("type", "radio");
          x.setAttribute("name", "App-Server");
          x.setAttribute("value", serverlist[srv].jsessionid);

            if (myjsessionid.indexOf(serverlist[srv].jsessionid) > 0) {
                x.setAttribute("checked", true);
            }

          tdOption.appendChild(x);

          var tdDomain = document.createElement('td');
          tdDomain.innerHTML = serverlist[srv].name;

          var tdName = document.createElement('td');
          tdName.innerHTML = serverlist[srv].hostname;

          var tdValue = document.createElement('td');
          tdValue.innerHTML = serverlist[srv].jsessionid;

          trCookie.appendChild(tdOption);
          trCookie.appendChild(tdDomain);
          trCookie.appendChild(tdName);
          trCookie.appendChild(tdValue);


          tblCookies.appendChild(trCookie);
        }

      // --------------
			});
		});
	}
}

// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {

  document.getElementById('right-aligned').addEventListener('click', reloadSpecificServer);

  GetServerJSON();
});
