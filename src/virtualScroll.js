import { Subject, fromEvent, combineLatest } from 'rxjs';
import { startWith, map, distinctUntilChanged } from 'rxjs/operators';

export default class VirtualScrollList {
  constructor(container, itemHeight) {
    this.itemHeight = itemHeight;
    this.container = container;
    this.data$ = new Subject();
    this.actualRows = Math.ceil(300 / itemHeight) + 1;
    const shouldUpdate$ = fromEvent(container.parentNode, 'scroll').pipe(
      startWith({ target: { scrollTop: 0 } }),
      map(() => {
        const start = Math.floor(container.parentNode.scrollTop / itemHeight),
          end = start + this.actualRows - 1;
        return [start, end];
      })
    );

    // 滚动、数据更新触发显示数据的更新
    this.dataInView$ = combineLatest(
      shouldUpdate$.pipe(distinctUntilChanged()),
      this.data$
    ).pipe(
      map(([[start, end], data]) =>
        data.slice(start, end).map(item => ({
          origin: item,
          $pos: start * this.itemHeight,
          $index: start++
        }))
      )
    );
  }

  /**
   * 数据设置
   *
   * @param {*} data
   * @memberof VirtualScrollList
   */
  setData(data) {
    this.data = data;
    this.container.style.height = data.length * this.itemHeight + 'px';
    this.data$.next(data);
  }
}
