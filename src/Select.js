import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import VirtualScrollList from './virtualScroll';

const DEFAULT_CONFIG = {
  labelKey: 'label',
  valueKey: 'value',
  itemHeight: 32,
  dropdownWidth: '100%',
  dropdownHeight: '300px'
};

export class Select {
  constructor(elementId, callback, config) {
    this.callback = callback;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.keyword = '';
    this._data = [];
    this.currentFocus = -1;

    this.inputEl = document.querySelector(`#${elementId}`);
    if (!this.inputEl) {
      throw new Error(`select初始化失败：宿主元素input[id=${elementId}]未找到`);
    }
    this.inputEl.classList.add('xg-select-input');

    this.initStructure();

    this.bindEvents();

    if (this.config.data) {
      this.enableSyncMode();
    }

    if (this.config.onSearch) {
      this.enableAsyncMode();
    }
  }

  /**
   * 同步模式，数据从传参中取得
   *
   * @memberof Select
   */
  enableSyncMode() {
    if (!(this.config.data instanceof Array))
      throw new TypeError(`数据格式有误: ${this.config.data}应为数组`);

    this.getResults = () => {
      this.virtualScrollList.setData(
        this.config.data.filter(
          result =>
            result.label.substr(0, this.keyword.length).toUpperCase() ===
            this.keyword.toUpperCase()
        )
      );
      this._data = this.virtualScrollList.data;
    };
    this.getResults();
  }

  /**
   * 异步模式，数据从异步回调中获取
   * 回调需返回Promise
   *
   * @memberof Select
   */
  enableAsyncMode() {
    // TODO: 判断onSearch是否为Promise
    this.initLoading();
    this.getResults = () => {
      this.toggleLoading(true);
      this.config.onSearch(this.keyword).then(res => {
        this.currentFocus = 0;
        this.toggleLoading(false);
        this.virtualScrollList.setData(res);
        this._data = this.virtualScrollList.data;
      });
    };
  }

  /**
   * 初始化组件DOM结构
   *
   * @memberof Select
   */
  initStructure() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('xg-select');
    this.inputEl.parentNode.appendChild(this.wrapper);
    this.wrapper.appendChild(this.inputEl);
    this.initPanel();
  }

  /**
   * 初始化下拉面板
   *
   * @memberof Select
   */
  initPanel() {
    this.dropdownPanel = document.createElement('div');

    this.dropdownPanel.setAttribute('id', this.inputEl.id + '-panel');
    this.dropdownPanel.setAttribute('class', 'xg-select-panel');

    this.dropdownPanel.style.width = this.config.dropdownWidth;
    this.dropdownPanel.style.maxHeight = this.config.dropdownHeight;
    this.dropdownPanel.style.display = 'none';

    this.wrapper.appendChild(this.dropdownPanel);

    this.initScrollList();
    this.initEmpty();
  }

  /**
   * 初始化虚拟滚动列表
   *
   * @memberof Select
   */
  initScrollList() {
    this.scrollList = document.createElement('div');
    this.scrollList.classList.add('scroll-list');
    this.dropdownPanel.appendChild(this.scrollList);

    this.virtualScrollList = new VirtualScrollList(
      this.scrollList,
      this.config.itemHeight
    );

    this.dataSubscription = this.virtualScrollList.dataInView$.subscribe(
      data => {
        // this.togglePanel(true);
        this.updateListView(data);
      }
    );
  }

  /**
   * 初始化“空数据”结构
   *
   * @memberof Select
   */
  initEmpty() {
    this.emptyEl = document.createElement('div');
    this.emptyEl.classList.add('xg-select-empty');
    this.emptyEl.innerHTML = '无匹配选项';
    this.emptyEl.style.display = 'block';
    this.dropdownPanel.insertBefore(this.emptyEl, this.scrollList);
  }

  /**
   * loading效果
   *
   * @memberof Select
   */
  initLoading() {
    this.loadingEl = document.createElement('div');
    this.loadingEl.classList.add('xg-select-loading');
    this.loadingEl.innerHTML = '正在查找...';
    this.loadingEl.style.display = 'none';
    this.dropdownPanel.insertBefore(this.loadingEl, this.scrollList);
  }

  /**
   * 切换“空数据”显示状态
   *
   * @param {*} isVisible
   * @memberof Select
   */
  toggleEmpty(isVisible) {
    this.emptyEl.style.display = isVisible ? 'block' : 'none';
  }

  /**
   * 切换下拉面板
   *
   * @param {*} visible
   * @memberof Select
   */
  togglePanel(visible) {
    if (visible) {
      this.dropdownPanel.style.display = 'block';
      this.wrapper.classList.add('open');
    } else {
      this.dropdownPanel.style.display = 'none';
      this.wrapper.classList.remove('open');
    }
  }

  /**
   * 更新选项接线信息
   *
   * @param {*} item 选项元素
   * @param {*} data 节点数据
   * @returns
   * @memberof Select
   */
  updateItem(item, data) {
    const label = data.origin[this.config.labelKey];
    item.innerHTML =
      '<strong>' + label.substr(0, this.keyword.length) + '</strong>';
    item.innerHTML += label.substr(this.keyword.length);
    item._data_ = data;
    item.style.transform = `translateY(${data.$pos}px)`;
    return item;
  }

  /**
   * 绑定输入、键盘控制、点击等事件
   *
   * @memberof Select
   */
  bindEvents() {
    this.inputSubscription = fromEvent(this.inputEl, 'input')
      .pipe(
        // 防抖
        debounceTime(500),
        // 内容更改触发搜索
        distinctUntilChanged()
        // TODO: 发送请求时挂起
      )
      .subscribe(() => {
        this.keyword = this.inputEl.value;
        this.getResults();
      });

    this.documentSubscription = fromEvent(document, 'click').subscribe(e => {
      if (
        e.target.parentNode !== this.scrollList &&
        e.target !== this.scrollList &&
        e.target !== this.inputEl
      ) {
        this.togglePanel(false);
      }
    });

    this.keydownSubscription = this.inputEl.addEventListener('keydown', e => {
      switch (e.keyCode) {
        case 40:
          //   down
          this.onSelectDown();
          break;
        case 38:
          // up
          this.onSelectUp();
          break;
        case 27:
          this.togglePanel(false);
          break;
        case 13:
          //   enter
          if (this.currentFocus > -1) {
            this.selected = {
              origin: this._data[this.currentFocus],
              $index: this.currentFocus
            };
            this.onSelect();
          }
          break;
      }
      this.updateListStatus();
    });

    this.inputEl.addEventListener('focus', () => {
      this.togglePanel(true);
    });

    this.scrollList.addEventListener('click', e => {
      this.selected = e.target._data_;
      this.onSelect();
    });
  }

  /**
   * 向下导航
   *
   * @memberof Select
   */
  onSelectDown() {
    this.currentFocus++;
    if (this.currentFocus >= this._data.length) {
      this.currentFocus = 0;
      this.dropdownPanel.scrollTop = 0;
    }
    if (this.currentFocus > this.scrollList.lastChild._data_.$index) {
      this.dropdownPanel.scrollTop = this.config.itemHeight * this.currentFocus;
    }
  }

  /**
   * 向上导航
   *
   * @memberof Select
   */
  onSelectUp() {
    this.currentFocus--;
    if (this.currentFocus < this.scrollList.firstChild._data_.$index) {
      this.dropdownPanel.scrollTop = this.config.itemHeight * this.currentFocus;
    }
    if (this.currentFocus < 0) {
      this.currentFocus = this._data.length - 1;
      this.dropdownPanel.scrollTop = this.config.itemHeight * this._data.length;
    }
  }

  /**
   * 选择处理
   *
   * @memberof Select
   */
  onSelect() {
    this.inputEl.value = this.selected.origin[this.config.labelKey];
    this.currentFocus = this.selected.$index;
    this.updateListStatus();
    this.togglePanel(false);
    this.callback(this.selected.origin);
  }

  /**
   * 更新列表节点数据
   *
   * @param {*} data
   * @memberof Select
   */
  updateListView(data) {
    this.toggleEmpty(data.length === 0);
    for (let i = 0; i < data.length; i++) {
      let item = this.scrollList.children.item(i);
      if (item) {
        this.updateItem(item, data[i]);
      } else {
        item = document.createElement('div');
        item.classList.add('xg-select-item');
        item.style.height = item.style.lineHeight =
          this.config.itemHeight + 'px';
        this.scrollList.appendChild(this.updateItem(item, data[i]));
      }
    }
    this.updateListStatus();
  }

  /**
   * 更新列表选中、focus状态
   *
   * @returns
   * @memberof Select
   */
  updateListStatus() {
    this.items = this.scrollList.getElementsByClassName('xg-select-item');
    if (!this.items) return false;
    for (var i = 0; i < this.items.length; i++) {
      this.items[i].classList.remove('xg-select-item-focused');
      this.items[i].classList.remove('xg-select-item-selected');
      if (this.items[i]._data_) {
        if (
          this.selected &&
          this.items[i]._data_.origin[this.config.valueKey] ===
            this.selected.origin[this.config.valueKey]
        ) {
          this.items[i].classList.add('xg-select-item-selected');
        }
        if (this.items[i]._data_.$index === this.currentFocus) {
          this.items[i].classList.add('xg-select-item-focused');
        }
      }
    }
  }

  /**
   * loading效果切换
   *
   * @param {*} isShowLoading
   * @memberof Select
   */
  toggleLoading(isShowLoading) {
    this.dropdownPanel.scrollTop = '0px';
    if (isShowLoading) {
      this.toggleEmpty(false);
      this.loadingEl.style.display = 'block';
    } else {
      this.loadingEl.style.display = 'none';
    }
  }

  /**
   * 清理监时间监听
   *
   * @memberof Select
   */
  destroy() {
    if (dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.inputSubscription) {
      this.inputSubscription.unsubscribe();
    }
    if (this.documentSubscription) {
      this.documentSubscription.unsubscribe();
    }
    if (this.keydownSubscription) {
      this.keydownSubscription.unsubscribe();
    }
  }
}
