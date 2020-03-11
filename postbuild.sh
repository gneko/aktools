ts=$(date +%s) 
echo '{\"version\":'$tmp'}'>./dist/aktools/version.json
echo '{\"version\":'$tmp'}'>./dist/aktools-old/version.json
#     "postbuild": "mv ./dist/my-project/*.js ./dist/my-project/*.js.map ./dist/my-project/resources; sed -i -e 's/src=\"/src=\"resources\\//g' dist/my-project/index.html",
mkdir ./dist/aktools/static/js
mkdir ./dist/aktools/static/css

mv ./dist/aktools/*.js ./dist/aktools/static/js/
mv ./dist/aktools/*.css ./dist/aktools/static/css/
sed -i -e '/src="http/! s#src="#src="static/aktools/'$ts'/js/#g' ./dist/aktools/index.html
sed -i -e 's#href="static/#href="static/aktools/'$ts'/#g' ./dist/aktools/index.html
sed -i -e 's#styles.css#static/aktools/'$ts'/css/styles.css#g' ./dist/aktools/index.html

sed -i -e 's#</noscript>#</noscript><script>window.data_version='$ts';</script>#g' ./dist/aktools/index.html

rm ./dist/aktools/index.html-e

cp ./dist/aktools/index.html ./dist/aktools/404.html