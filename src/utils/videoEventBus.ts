import { reactive } from 'vue';

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Record<string, EventCallback[]> = reactive({});

  /**
   * 订阅事件
   * @param event 事件名
   * @param callback 回调函数
   */
  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * 取消订阅
   * @param event 事件名
   * @param callback 回调函数
   */
  off(event: string, callback: EventCallback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  /**
   * 发布事件
   * @param event 事件名
   * @param args 参数
   */
  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        callback(...args);
      });
    }
  }

  /**
   * 一次性订阅
   * @param event 事件名
   * @param callback 回调函数
   */
  once(event: string, callback: EventCallback) {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }
}

export const videoEventBus = new EventBus();
