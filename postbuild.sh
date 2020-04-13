ts=$(date +%s) 

mkdir ./dist/aktools/static/js
mkdir ./dist/aktools/static/css

mv ./dist/aktools/*.js ./dist/aktools/static/js/
mv ./dist/aktools/*.css ./dist/aktools/static/css/

echo $ts

sed -i -e 's#0-es5.worker.js#/static/aktools/'$ts'/js/0-es5.worker.js#g' ./dist/aktools/static/js/main-es5.js
sed -i -e 's#1-es5.worker.js#/static/aktools/'$ts'/js/1-es5.worker.js#g' ./dist/aktools/static/js/main-es5.js
[ -f "./dist/aktools/static/js/main-es5.js-e" ] && rm ./dist/aktools/static/js/main-es5.js-e

sed -i -e 's#0-es2015.worker.js#/static/aktools/'$ts'/js/0-es2015.worker.js#g' ./dist/aktools/static/js/main-es2015.js
sed -i -e 's#1-es2015.worker.js#/static/aktools/'$ts'/js/1-es2015.worker.js#g' ./dist/aktools/static/js/main-es2015.js
[ -f "./dist/aktools/static/js/main-es2015.js-e" ] && rm ./dist/aktools/static/js/main-es2015.js-e


sed -i -e '/src="http/! s#src="#src="/static/aktools/'$ts'/js/#g' ./dist/aktools/index.html
sed -i -e 's#href="static/#href="/static/aktools/'$ts'/#g' ./dist/aktools/index.html
sed -i -e 's#styles.css#/static/aktools/'$ts'/css/styles.css#g' ./dist/aktools/index.html

sed -i -e 's#</noscript>#</noscript><script>window.data_version='$ts';</script>#g' ./dist/aktools/index.html

[ -f "./dist/aktools/index.html-e" ] && rm ./dist/aktools/index.html-e

[ -d "./dist/aktools-old/" ] && rm -rf ./dist/aktools-old

cp -R ./aktools-old ./dist/

sed -i -e 's#"static/#"/static/aktools-old/'$ts'/#g' ./dist/aktools-old/akevolve.html
sed -i -e 's#"static/#"/static/aktools-old/'$ts'/#g' ./dist/aktools-old/akhr.html
sed -i -e 's#"static/#"/static/aktools-old/'$ts'/#g' ./dist/aktools-old/akhrchars.html
sed -i -e 's#"static/#"/static/aktools-old/'$ts'/#g' ./dist/aktools-old/aklevel.html

if ls ./dist/aktools-old/*-e 1> /dev/null 2>&1; then
  rm ./dist/aktools-old/*-e
fi

cp ./dist/aktools/index.html ./dist/aktools/404.html

echo '{"version":'$ts'}'>./dist/aktools/version.json
echo '{"version":'$ts'}'>./dist/aktools-old/version.json

echo "Postbuild done."