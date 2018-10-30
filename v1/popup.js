// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

if (!chrome.cookies) {
  chrome.cookies = chrome.experimental.cookies;
}

function GetServerJSON(){


  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    var url = tabs[0].url;
    var domain = url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];

    console.log('DEBUG998: ', domain);

  // Get json server list
    let serverlist = 'https://raw.githubusercontent.com/teopost/wcs-server-finder/master/payloads/' + domain + '.json';

    fetch(serverlist)
    .then(res => res.json())
    .then((out) => {
      console.log('Checkout this JSON! ', out);

      var cookieHelper = new CookieHelper(out);
      cookieHelper.showCookies();

    })
    .catch(err => { throw err });
  })
}

function CookieHelper(serverlist) {
	// Not using this
	this.pinnedCookies = {};

	// Not using this
	this.reset = function() {
		this.pinnedCookies = {};
	}

	// Show Cookies method
	this.showCookies = function() {

		// Get all cookies
	  chrome.cookies.getAll({}, function(cookies) {

			var tblCookies = document.getElementById('tblCookies');

			// Determine active tab
      chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        var url = tabs[0].url;

				// Work out domain
				var domain = url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];

        var myjsessionid = '';

        for (var i in cookies) {
					  if (cookies[i].domain == domain) {
      	  			   if (cookies[i].name == 'JSESSIONID') {
                      myjsessionid = cookies[i].value;
                      console.log('DEBUG28: ', myjsessionid +  cookies[i].domain);
                   }
                 }
         }

        console.log('DEBUG2: ', myjsessionid);

        for (var srv in serverlist) {

          var trCookie = document.createElement('tr');

          if (myjsessionid.indexOf(serverlist[srv].jsessionid) > 0) {
            trCookie.style.background = "rgb(195, 198, 185)";
          }


          var tdDomain = document.createElement('td');
          tdDomain.innerHTML = serverlist[srv].name;

          var tdName = document.createElement('td');
          tdName.innerHTML = serverlist[srv].hostname;

          var tdValue = document.createElement('td');
          tdValue.innerHTML = serverlist[srv].jsessionid;

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

  GetServerJSON();


});
