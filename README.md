# AI 婚纱写真自助选片网站 MVP

这是纯本地 mock 版本：不需要 Supabase、不接真实支付、不调用真实 Gemini API，也能跑通上传、支付、自动生成、选片、下载全流程。

## 启动步骤

1. 安装 Node.js LTS：[https://nodejs.org](https://nodejs.org)
2. 解压项目 ZIP
3. 在终端进入项目目录
4. 安装依赖：

```bash
npm install
```

5. 复制环境变量：

```bash
cp .env.example .env.local
```

6. 确认 `.env.local` 里有：

```bash
GEMINI_MOCK_GENERATION=true
```

7. 启动：

```bash
npm run dev
```

8. 浏览器打开：

```text
http://localhost:3000
```

后台地址：

```text
http://localhost:3000/admin/orders?token=dev-admin-token
```

## 本地数据保存在哪里

- 订单数据：`storage/orders.json`
- 上传照片：`storage/uploads`
- 生成原图：`storage/generated`
- 水印预览图：`storage/previews`

如果这些文件夹或 `orders.json` 不存在，系统会自动创建。

## 测试流程

1. 首页点击开始上传
2. 上传一张清晰正脸照
3. 模拟支付 9.9 元
4. 选择 1-2 个写真主题
5. 系统自动生成预览图
6. 回到用户选片页
7. 勾选喜欢的图
8. 点击“确认购买 X 张，支付 ¥Y”
9. 模拟支付
10. 下载无水印原图

后台订单详情里的“重新生成预览图”会清空当前生成结果，并按当前生成规则重新生成预览图。

## Netlify 部署

项目已提供 `netlify.toml`，适合 Next.js 在 Netlify 上构建：

```toml
[build]
  command = "npm run build"
  publish = ".next"
```

Netlify 站点 Build settings：

- Build command: `npm run build`
- Publish directory: `.next`

线上环境变量请在 Netlify 后台配置，不要写入代码或提交到仓库：

```bash
NEXT_PUBLIC_APP_URL=https://aiwedding.space
GENERATION_MODE=api
GENERATION_PROVIDER=apimart
APIMART_API_KEY=只在 Netlify 环境变量里配置
APIMART_BASE_URL=https://api.apimart.ai
APIMART_MODEL=gemini-3-pro-image-preview
APIMART_RESOLUTION=1K
APIMART_TIMEOUT_MS=180000
GENERATION_TEST_LIMIT=1
ADMIN_TOKEN=请换成一段长随机复杂字符串
LOCAL_STORAGE_ROOT=/tmp/ai-wedding-photo-mvp-storage
```

注意：

- `.env.local` 只用于本地开发，已在 `.gitignore` 中忽略，不要提交。
- 不要在生产环境使用 `dev-admin-token`。
- `APIMART_API_KEY` 是密钥，只能放在 Netlify 环境变量里。
- 当前订单、上传图、生成图和水印预览图仍使用本地文件存储。Netlify 函数文件系统的 `/tmp` 适合临时文件，不适合长期保存真实订单资产；正式接单前建议迁移到 Netlify Blobs 或对象存储。
