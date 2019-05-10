# select 组件

## 预览

克隆本项目到本地，命令行`npm install & npm run start`即可本地启动本项目进行预览
或者在[GitHub Page](https://xwhoward.github.io/select/)上直接预览

## 功能

- 基础 select 功能
- 支持直接输入，输入时下拉列表的选项自动前缀匹配，匹配到的前缀用红色文字展示
- 支持异步加载数据
- 兼容主流浏览器
- _\*支持大量数据（10w+），提高输入时的匹配效率_

## 使用方式

1. 基础使用

   html:

   ```html
   <input type="text" id="my-select" placeholder="请选择XX" />
   ```

   js:

   ```js
   const select = new Select('my-select', function(value) {
     // 选中选项触发回调函数
     console.log('已选择:', value);
   });
   ```

2. 异步数据加载

   html:

   ```html
   <input type="text" id="async-select" placeholder="请选择XX" />
   ```

   js:

   ```js
   const asyncSelect = new Select(
     'async-select',
     function(value) {
       console.log('on select:', value);
     },
     {
       onSearch: function(keyword) {
         return fetch('https://api.randomuser.me/?results=10')
           .then(response => response.json())
           .then(res => res.results);
       },
       labelKey: 'email',
       valueKey: 'cell'
     }
   );
   ```

## API

```js
new Select(elementId: string, callback: (option: DataModel) => void, configObj: Config)
```

其中：

- `elementId`: input 元素 id，用于查找对应 DOM 元素
- `callback`: select 回调，入参为用户自定义选项数据类型
- `configObj`: 组件配置对象，支持以下配置：
  - data: DataModel[] 同步模式必传，选项数据
  - onSearch: (keyword:string) => Promise<DataModel[]> 异步模式必传，关键词查询回调函数，入参为关键词，需返回 Promise
  - labelKey: string 用户自定义选项数据中用于显示文本的键名
  - valueKey: string 用户自定义选项数据中用于赋值的键名
  - itemHeight: number 选项高度
  - dropdownWidth: string 如：'100%','300px' 设置下拉框宽度
  - dropdownHeight: string 如：'300px' 设置下拉框最大高度

## 特点

1. 支持通过配置参数设定 select 组件数据获取为同步模式、异步模式
2. 针对大量数据渲染采用“虚拟滚动”技术，渲染 10W+数据不会产生性能负担，并且可以做到全量显示
3. 针对大量数据查找效率问题，将关键词匹配的计算放到 Web Worker 中，UI 线程不会被阻塞，界面不会卡顿
   > 目前设定为生成 150w 条随机数据，查找结果约 12w 条，经分析在测试约 38s 等待时间中约 5s 用于生成数据，2s 用于查找匹配
4. 对输入进行防抖和去重，减少不必要查询请求

## BUG & TODO

1. 未对部分参数进行类型校验，错误处理不够完善
2. 交互细节优化，如未添加动画效果，
3. 可配置项还可以进一步拓展
4. 配置 webpack 转化 es6 为 es5 以下，支持更多浏览器
5. 未支持多选
