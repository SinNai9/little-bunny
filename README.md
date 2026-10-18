# Little Bunny

一个温柔的童话森林与兔兔小屋。当前仓库是新版第一阶段的前端原型，使用静态网页，可部署到 GitHub Pages。

## 当前状态
- [x] 森林首页与 CSS 立体场景
- [x] CSS 兔兔基础跳跃、耳朵与身体动画
- [x] 房屋入口与室内外切换
- [x] 便签墙界面、文字和手绘编辑器
- [x] 杭州天气读取（Open-Meteo），缓存上次成功数据
- [x] 中国标准时间昼夜效果
- [x] Supabase 数据库/RLS SQL 草案
- [ ] Supabase 登录、密码找回和云端便签：需配置项目 URL 与公开 key 并执行 SQL 后验证
- [ ] 真正的 3D 兔兔模型和完整动作资源
- [ ] 完整四季植物与室内多房间细节
- [ ] 网易云音乐播放器嵌入与实际播放验证
- [ ] 真实设备、权限与跨日边界验收

未配置 Supabase 前，便签不会被保存到云端；界面会明确提示配置，不会伪装成保存成功。

## Supabase 配置
1. 创建 Supabase 项目并启用 Email/Password 登录。
2. 在 Supabase SQL Editor 执行 supabase/schema.sql。
3. 在 script.js 中填写项目 URL 与公开 anon/publishable key：

    const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
    const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY";

4. 在 Supabase Auth 设置中配置站点 URL、GitHub Pages URL 和密码重置跳转地址。
5. 使用不同账号测试数据隔离，并测试跨日后数据库拒绝修改和删除。
6. 不要将 service_role key 放入浏览器代码。

## GitHub Pages
仓库包含 GitHub Actions 部署工作流。检查 Settings → Pages，确认来源为 GitHub Actions。预期网址为 https://sinnai9.github.io/little-bunny/，以仓库 Pages 设置为准。

## 天气
天气读取 Open-Meteo 公开接口，坐标固定为杭州。浏览器缓存最近一次成功响应；服务不可用时保留缓存和更新时间。

## 当前限制
兔兔、森林和室内是 CSS 场景原型，不是真正的 3D 模型。网易云音乐 iframe 需要在下一步嵌入并检查第三方页面与自动播放限制。完整季节植物切换尚未完成。替换文件不会清除旧 Git 提交历史；需独立执行并验证历史重置后才能称为完成。