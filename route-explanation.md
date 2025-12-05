# Hono 路由配置说明

## 路由挂载机制

在我们的项目中，路由配置不是由文件名直接决定的，而是通过代码中的路由挂载机制实现的。

### 当前项目的路由结构

1. **主路由文件** (`server/api/index.ts`)
   - 创建了一个 Hono 实例并设置基础路径为 `/api`
   - 通过 `.route('/hello', helloRoutes)` 将 helloRoutes 挂载到 `/hello` 路径

2. **子路由文件** (`server/api/routes/hello.ts`)
   - 创建了另一个 Hono 实例
   - 定义了一个 GET 路由 `/`（相对于挂载点）

### 路由组合过程

最终的完整路由路径是通过以下方式组合的：
- `basePath`（基础路径）: `/api`
- `mount path`（挂载路径）: `/hello` （在 index.ts 中指定）
- `route path`（路由路径）: `/` （在 hello.ts 中指定）

**完整路径** = `/api` + `/hello` + `/` = `/api/hello`

## 文件名与路由的关系

文件名本身不会直接决定路由路径。例如，即使我们将 `hello.ts` 重命名为 `greeting.ts`，只要在 `index.ts` 中正确导入并挂载：

```typescript
// server/api/index.ts
import greetingRoutes from './routes/greeting'

const routes = app
  .route('/hello', greetingRoutes)  // 挂载路径仍然是 /hello
```

路由仍然会通过 `/api/hello` 访问。

## 常见问题

### 为什么之前需要访问 `/api/hello/hello`？

因为在修复前，`hello.ts` 中的路由定义是 `/hello`：

```typescript
// 修复前的 hello.ts
const app = new Hono().get('/hello', (c) => {
  return c.json({ message: 'Hello, Next.js!' })
})
```

所以路由组合变成了：
- `basePath`: `/api`
- `mount path`: `/hello`
- `route path`: `/hello`

**完整路径** = `/api` + `/hello` + `/hello` = `/api/hello/hello`

### 修复后的正确配置

现在我们将 `hello.ts` 中的路由改为 `/`：

```typescript
// 修复后的 hello.ts
const app = new Hono().get('/', (c) => {
  return c.json({ message: 'Hello, Next.js!' })
})
```

这样路由组合就是正确的：`/api/hello`