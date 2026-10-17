# 胶片放这里

网站的「胶片」页（`/film`）直接读这个文件夹，加一卷胶片不用改任何代码：
新建一个文件夹，把照片放进去，`npm run dev` 打开 `/film` 就能看到。

## 一卷 = 一个文件夹

```
src/assets/film/
  2025-10-yichang/        ← 一卷
    01.jpg
    02.jpg
    …
    roll.json             ← 可选：这卷的说明
    canister.png          ← 可选：这卷胶卷罐的照片
```

- **文件夹名**：`年-月-名字` 或 `年-月-日-名字`，比如 `2025-10-yichang`、`2025-10-03-yichang`。
  - 开头的日期决定排序：**新的在前**，没写日期的排在最后。
  - 日期会写在胶卷罐的胶带上；名字（`yichang`）在没写 `title` 时当作标题，`-` 和 `_` 会变成空格。
  - 文件夹名也会出现在网址里（`/film/2025-10-yichang/01`），所以只用英文、数字和 `-`。
- **照片**：支持 `jpg` `jpeg` `png` `webp` `avif`。按文件名的**数字**排序（`2` 排在 `10` 前面），
  所以 `01.jpg`、`02.jpg`… 这样编号最省心。文件名也是网址的一部分。
- 照片别太大：长边 2000px 左右、几百 KB 就够了。原片和「油画」都从这张图来。

## roll.json（都可以不写）

```json
{
  "title": { "zh": "宜昌", "en": "Yichang" },
  "place": { "zh": "湖北宜昌", "en": "Yichang, Hubei" },
  "stock": "Kodak Gold 200",
  "camera": "Olympus mju-II",
  "note": { "zh": "这一卷的一两句话。", "en": "A line or two about the roll." },
  "frames": {
    "01": {
      "alt": { "zh": "给看不见图的人的一句描述。", "en": "One line for people who can't see it." },
      "focus": "64% 50%"
    }
  }
}
```

| 字段 | 用在哪 |
| --- | --- |
| `title` | 胶卷罐下面和展开后的标题。不写就用文件夹名 |
| `place` `stock` `camera` | 展开后标题旁边那一行小字 |
| `stock` | **还决定胶卷罐的样子**，见下面 |
| `note` | 展开后标题下面的一段话 |
| `frames` | 按文件名（不带扩展名）给每张写 `alt` 和 `focus` |
| `alt` | 读屏用的描述；不写就是「第一卷，第 1 格」这种 |
| `focus` | 图被裁切时保住的位置，`横% 竖%`。`50% 50%` 是中间（默认），`64% 50%` 偏右 |

## 胶卷罐

每卷在页面上是一个画出来的 35mm 胶卷罐，配色看 `stock` 里的关键词（不分大小写）。
**感光度会自动去掉**：写 `Kodak Gold 200`，罐子上只印 `GOLD`。

| `stock` 里出现 | 罐子 |
| --- | --- |
| Tri-X、T-Max、Double-X | 黄底黑条（黑白） |
| Ilford、HP5、FP4、Delta、Pan、Kentmere、BW、黑白 | 黑底黄字（黑白） |
| Portra、Ektar | 橙底黑条 |
| Fuji、Superia、C200、Velvia、Provia | 绿底白条 |
| Cine、Vision | 深灰红条 |
| Gold、UltraMax、ColorPlus、Kodak | 黄底红条 |
| 都没有 / 没写 | 灰色素罐 |

从上往下匹配，先中先用（所以 `Kodak Portra 400` 是 Portra 的橙色，不是 Kodak 的黄色）。
想加新的配色，在 `src/atelier/components/Canister.tsx` 的 `labels` 里加一行。

想用真实照片代替画的罐子：在这卷文件夹里放一张 **`canister.png`**（去掉背景的透明图最好，
竖着拍、罐子立着）。它只用在胶卷罐的位置，不会被当成一格胶片。

## 首页那张画

首页和开场动画用的是 `src/assets/ground/home.jpg`（`src/atelier/film.ts` 的 `heroFrame`）。
胶片页背后那张用的是 `src/assets/ground/film.jpg`（`filmBackdrop`）。
这两张不在架子上，换图就换这两个文件。

## 加完之后

```bash
npm run dev      # 打开 http://localhost:3000/film 看一眼
npm run build    # 发布前确认能构建
```

点开一张，上方可以在「原片」和「油画」之间切换；左右方向键翻页，Esc 回到胶片集。
