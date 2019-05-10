import { Select } from './Select';
import './style.css';

const syncSelect = new Select(
  'sync-select',
  function(value) {
    console.log('on select:', value);
  },
  {
    data: [
      { label: '选项1', value: 1 },
      { label: '选项2', value: 2 },
      { label: '选项3', value: 3 },
      { label: '选项4', value: 4 },
      { label: '选项5', value: 5 }
    ]
  }
);

const asyncSelect = new Select(
  'async-select',
  function(value) {
    console.log('on select:', value);
  },
  {
    onSearch: function(keyword) {
      // 这里由于使用公共API产生的随机数据，查询到的数据无法正确高亮，实际使用可以正确高亮
      return fetch('https://api.randomuser.me/?results=10')
        .then(response => response.json())
        .then(res => res.results);
    },
    labelKey: 'email',
    valueKey: 'cell'
  }
);

const massiveSelect = new Select(
  'massive-select',
  function(value) {
    console.log('on select:', value);
  },
  {
    // 此处使用Web Worker仅用于mock大量数据，跟组件功能无相干性
    onSearch: mockMassiveDataWithWebWorker(15000000)
  }
);

/**
 * Web Worker mock 随机数据,
 * 当前设定为
 *
 * @returns
 */
function mockMassiveDataWithWebWorker(total) {
  const worker = new Worker('./worker.bundle.js');
  worker.onerror = function(e) {
    console.error(
      ['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join('')
    );
  };
  return function(keyword) {
    const start = new Date();
    worker.postMessage({ keyword, total });
    return new Promise((resolve, reject) => {
      worker.onmessage = e => {
        if (e.data.type === 'mock') {
          log(`数据生成完毕...耗时${e.data.duration}s`);
        }
        if (e.data.type === 'data') {
          const end = new Date();
          log(
            `本次查询耗时${(end - start) / 1000}s，共返回${
              e.data.data.length
            }条搜索结果`
          );
          resolve(e.data.data);
        }
      };
    });
  };
}

function log(message) {
  const logEl = document.createElement('p');
  logEl.innerHTML = message;
  massiveSelect.wrapper.parentNode.appendChild(logEl);
}
