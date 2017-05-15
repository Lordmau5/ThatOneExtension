function inject() {
  var script = document.createElement('script');
  script.type = 'text/javascript';

  if(localStorage.ffz_ap_debug_mode === 'true') {
    var xhr = new XMLHttpRequest();
		xhr.open('GET', 'https://localhost:3000/', true);
		xhr.onload = function(e) {
      console.log('FFZ:AP: Development Server is present.');
			script.src = 'https://localhost:3000/ffz-ap.js';
			document.body.classList.add('ffz-ap-dev');
			document.head.appendChild(script);
    };
    xhr.onerror = function(e) {
      console.log('FFZ:AP: Development Server is not present. Using CDN.');
			script.src = 'https://lordmau5.com/nocache/ffz-ap/ffz-ap.min.js?_=' + Date.now();
			document.head.appendChild(script);
    };
    return xhr.send(null);
  }
  else {
    script.src = 'https://cdn.lordmau5.com/ffz-ap/ffz-ap.min.js';
    document.head.appendChild(script);
  }
}

inject();
