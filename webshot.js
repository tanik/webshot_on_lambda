var system = require('system');
var args = system.args;
var page = require('webpage').create();
var fs = require('fs');
page.viewportSize = { width: 1280, height: 800 };
page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';
page.settings.javascriptEnabled = true;
page.settings.loadImages = true;
phantom.cookiesEnabled = true;
page.open(args[1], function(status) {
  if(status !== 'success'){
    console.log('Unable to load ' + args[1]);
    phantom.exit(1);
  }else{
    var title = page.evaluate(function() {
      return document.title;
    });
    fs.write("/tmp/title.txt", title, 'w');
    console.log("title: " + title);
    page.render('/tmp/full.png');
    console.log("render full");
    page.clipRect = {
      top: 0,
      left: 0,
      width: 1280,
      height: 800
    };
    page.render('/tmp/thumb.png');
    console.log("render thumb");
    phantom.exit();
  }
});
