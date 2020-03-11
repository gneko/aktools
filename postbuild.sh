ts=$(date +%s) 

mkdir ./dist/aktools/static/js
mkdir ./dist/aktools/static/css

mv ./dist/aktools/*.js ./dist/aktools/static/js/
mv ./dist/aktools/*.css ./dist/aktools/static/css/
sed -i -e '/src="http/! s#src="#src="static/aktools/'$ts'/js/#g' ./dist/aktools/index.html
sed -i -e 's#href="static/#href="static/aktools/'$ts'/#g' ./dist/aktools/index.html
sed -i -e 's#styles.css#static/aktools/'$ts'/css/styles.css#g' ./dist/aktools/index.html

sed -i -e 's#</noscript>#</noscript><script>window.data_version='$ts';</script>#g' ./dist/aktools/index.html


[ -d "./dist/aktools-old/" ] && rm -rf ./dist/aktools-old

cp -R ./aktools-old ./dist/

sed -i -e 's#"static/#static/aktools-old/'$ts'/#g' ./dist/aktools-old/akchars.html
sed -i -e 's#"static/#static/aktools-old/'$ts'/#g' ./dist/aktools-old/akevolve.html
sed -i -e 's#"static/#static/aktools-old/'$ts'/#g' ./dist/aktools-old/akhr.html
sed -i -e 's#"static/#static/aktools-old/'$ts'/#g' ./dist/aktools-old/akhrchars.html
sed -i -e 's#"static/#static/aktools-old/'$ts'/#g' ./dist/aktools-old/aklevel.html

[ -f "./dist/aktools/index.html-e" ] && rm ./dist/aktools/index.html-e

cp ./dist/aktools/index.html ./dist/aktools/404.html

echo '{"version":'$ts'}'>./dist/aktools/version.json
echo '{"version":'$ts'}'>./dist/aktools-old/version.json