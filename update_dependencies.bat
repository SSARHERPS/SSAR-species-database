@echo off
echo Updating dependencies ... please wait.
call bower update
echo Minifying ...
java -jar yuicompressor.jar bower_components/purl/purl.js -o js/purl.min.js
java -jar yuicompressor.jar bower_components/jquery-cookie/jquery.cookie.js -o js/jquery.cookie.min.js
java -jar yuicompressor.jar js/loadJQuery.js -o js/loadJQuery.min.js
