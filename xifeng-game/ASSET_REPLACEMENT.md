# 主界面美术资产登记

## 已采用的干净背景

- `public/assets/backgrounds/main-scroll-clean-v1.png`
  - 以原主界面母版为构图基准，只保留桌面、地图长卷、左侧卷轴、笔墨等固定场景。
  - 已移除烘焙的年份、回合、资源、导航、困境、人物、详情奏札和行动入口。
  - 当前 `.scene-background` 使用此文件，动态内容继续由 React DOM 分层渲染。
- `public/assets/backgrounds/song-court-map.png`
  - 仅包含汴京远景、御案、地图长卷、卷轴、香炉与灯架等固定场景。
  - 不包含年份、回合、资源数值、困境文字、人物详情或行动文字。
  - 保留为备用场景；后续替换同尺寸背景不需要修改游戏状态或交互代码。

## 已归档的烘焙界面

- `public/assets/archive/main-interface-baked-ui.png`
  - 包含写死的年份、回合、资源文字与数字。
  - 包含写死的困境地点、名称、人物、严重度、导航和行动入口。
  - 仅作为正式视觉方向参考，不再被运行时代码或 CSS 引用。

## 后续可补充的独立透明素材

当前下列动态内容仍以 CSS 组件占位，待独立透明 PNG/WebP 到位后可以逐项替换，不影响 DOM 结构：

- `assets/decorations/`：卷轴轴头、绳结、墨迹、桌面小物。
- `assets/seals/`：用玺、警讯、已解决和锁定状态印章。

这些动态内容素材必须保持无文字；所有会随 `GameState` 改变的文字和数值继续由 React 渲染。导航名称与御案入口属于固定功能标识，可以存在于独立按钮素材中，但 DOM 仍须保留对应语义名称。

## 已替换的动态界面底材

- `public/assets/resources/treasury.png`
- `public/assets/resources/strategy.png`
- `public/assets/resources/administration.png`
- `public/assets/resources/public-support.png`
- `public/assets/resources/scholar-support.png`
- `public/assets/crises/map-crisis-marker.png`
- `public/assets/scrolls/crisis-detail-scroll.png`

资源组件由用户提供的绿幕素材表抠色裁切；困境纸签与详情奏札直接采用用户提供的透明 PNG。素材只负责器物、纸张、墨迹和朱圈外观，资源名称、数值、困境地点、标题、说明和严重度仍由 React DOM 从 `GameState` 动态渲染。

主界面的装饰性“承办官员”人物签已经移除；人物数据仍用于铨选、任免、秘阁和诏令系统，不再需要为主界面补人物占位素材。

## 已替换的固定功能组件

- `public/assets/navigation/nav-crisis.png`
- `public/assets/navigation/nav-edict.png`
- `public/assets/navigation/nav-appointments.png`
- `public/assets/navigation/nav-archive.png`
- `public/assets/navigation/nav-records.png`
- `public/assets/scrolls/action-edict.png`
- `public/assets/seals/settings.png`

以上固定功能组件由用户提供的绿幕素材表无损抠色、裁切而来；按钮外层仍为语义化 DOM，保留事件、键盘焦点和无障碍名称。原始素材表与整张透明中间稿保存在 `public/assets/archive/`。
