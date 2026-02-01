# 🤝 贡献指南

欢迎贡献 Awesome Agent！

---

## 开发环境设置

```bash
# 克隆仓库
git clone <repo-url>
cd awesome-agent

# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 开发模式（自动重新编译）
npm run dev
```

---

## 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 编写测试
- 添加文档注释

---

## 提交规范

使用 Conventional Commits:

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `refactor`: 重构
- `test`: 测试

---

## 添加新工具

1. 创建工具类（继承 `BaseTool`）
2. 实现 `execute` 方法
3. 注册到 `ToolRegistry`
4. 编写测试
5. 更新文档

---

## 添加新模型提供商

1. 在 `ModelProvider` 中添加新方法
2. 实现模型特定的调用逻辑
3. 适配工具调用格式
4. 编写测试

---

感谢你的贡献！🎉
