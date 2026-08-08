# 熙宁抉择

以北宋熙宁新政为背景的历史策略游戏。玩家需要在国库、政略、行政、民心与士论之间权衡，通过拟诏、用官和处置困境推进改革。

- [在线游玩](https://nayoutang.github.io/Xining-Edict/)
- [下载 Windows 游戏本体](https://github.com/Nayoutang/Xining-Edict/releases/latest/download/Xining-Edict-Windows.exe)
- [查看发布版本](https://github.com/Nayoutang/Xining-Edict/releases)

## 本地开发

```powershell
cd xifeng-game
npm install
npm run dev
```

## 构建

```powershell
npm run build
npm run electron:pack
```

网页版输出到 `xifeng-game/dist`，Windows 便携版输出到 `xifeng-game/release/Xining-Edict-Windows.exe`。
