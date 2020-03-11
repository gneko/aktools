# bigfun 明日方舟工具箱

## 项目结构

```
project
│   version.json
│   index.html
└───static
│   │   css/
│   │   js/
│   │   assets/
│   │   ...
```

## 约定cdn目录结构

我们需要约定一个静态路径结构。
其中version是每次生成的唯一版本号，更新cdn时使用（目前我们用的时间戳），参与每次打包构建 如下所示：
新版本    /static/aktools/version/
老版本    /static/aktoolsold/version/

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <title>明日方舟工具箱 by 一只灰猫</title>
  <link rel="stylesheet" href="/static/aktools/1583312341718/css/styles.e5bba7d6100189ce2924.css">
</head>
<body>
  <script type="text/javascript" src="/static/aktools/1583312341718/js/runtime-es2015.44f7a62596b3847c435b.js"></script>
  <script type="text/javascript" src="/static/aktools/1583312341718/js/main-es5.90b36b5b3d64594fc2ee.js"></script>
</body>

```
