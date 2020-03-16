const fs = require('fs')
const express = require('express')
const server = express()
const PORT = process.env.PORT || 9000
const {version} = require('./aktools/version.json')

// 静态资源
server.use(`/static/aktools/${version}/`,express.static('./aktools/static/'))
server.use(`/static/aktools-old/${version}/`,express.static('./aktools-old/static/'))


// 旧版页面
const akevolve = fs.readFileSync('./aktools-old/akevolve.html',{encoding:'utf8'})
const akhr = fs.readFileSync('./aktools-old/akhr.html',{encoding:'utf8'})
const akhrchars = fs.readFileSync('./aktools-old/akhrchars.html',{encoding:'utf8'})
const aklevel = fs.readFileSync('./aktools-old/aklevel.html',{encoding:'utf8'})
server.get('/tools/aktools-old/akevolve.html',(req,res)=>{res.send(akevolve)})
server.get('/tools/aktools-old/akhr.html',(req,res)=>{res.send(akhr)})
server.get('/tools/aktools-old/akhrchars.html',(req,res)=>{res.send(akhrchars)})
server.get('/tools/aktools-old/aklevel.html',(req,res)=>{res.send(aklevel)})


// 新版页面
let newstrhtml = fs.readFileSync('./aktools/index.html',{encoding:'utf8'})
.replace('<base href="/">','<base href="/tools/aktools">')
server.get('/tools/aktools/*',(req,res)=>{
  res.send(newstrhtml)
})

server.listen(PORT,()=>{
  console.log('test server run at ' + PORT)
})