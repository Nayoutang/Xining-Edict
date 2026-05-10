# 熙宁抉择

《熙宁抉择》是一款以北宋熙宁变法为背景的历史交互叙事游戏。玩家扮演宋神宗赵顼，在青苗法、募役法、市易法、保甲法与新旧党争之间做出取舍，观察国用、民生、边防、士论、法度、党争六项变量如何变化，并走向不同结局。

## 版本

当前版本：`0.2.1`

本版重点：

- 接入 21 张反馈页历史场景配图。
- 修复 Electron 打包后反馈图片不显示的问题。
- 启动后直接进入全屏。
- 主界面新增退出游戏入口。
- 反馈页新增局势解读。
- 结局页新增何以至此、数据归因和系统判断。
- 优化全屏布局，减少右侧变量栏和结局页内容显示不全。

## 运行

安装依赖：

```bash
npm install
```

开发运行：

```bash
npm run dev
```

构建前端：

```bash
npm run build
```

打包 Windows 便携版：

```bash
npm run electron:pack
```

打包产物会输出到 `release/`，文件名形如：

```text
熙宁抉择-0.2.1.exe
```

## 资源目录

反馈页配图位于：

```text
public/images/feedback/
```

每个政策选项都在 `src/data/gameData.js` 中绑定对应图片：

```js
{
  text: '推行青苗法，但严禁强制摊派',
  image: 'images/feedback/qingmiao-supervised.jpg',
  summary: '理财目标得以保留，基层扭曲被明显压低。'
}
```

注意：Electron 使用 `file://` 加载打包后的页面，因此反馈图路径需要使用相对路径 `images/feedback/...`，不要写成 `/images/feedback/...`。

## 主要结构

```text
electron/                 Electron 主进程与 preload
music/                    背景音乐
public/images/feedback/   反馈页历史场景配图
src/assets/scenes/        首页、节点、结局等场景图
src/components/           页面组件
src/data/gameData.js      节点、选项、变量、结局数据
src/App.jsx               游戏主流程
src/styles.css            全局样式
```

## 游戏变量

- 国用：国家财政能力与资源调度水平。
- 民生：百姓负担、基层生活与社会稳定。
- 边防：军事组织、边境防御与强兵成效。
- 士论：士大夫舆论与官僚系统支持度。
- 法度：政策执行规范性与制度稳定。
- 党争：新旧两派政治冲突与朝局撕裂程度。

## 结局

游戏目前包含五类结局：

- 新旧决裂
- 富国失民
- 熙宁改良
- 守成之局
- 新法受挫

每个结局会展示史官评语、结局解释、何以至此、数据归因与系统判断。
