import { ref, computed } from "vue";
import { fetchNotifications } from "@/server/qa";
import { NotificationRecord } from "@/types/qa";

const SEEN_IDS_KEY = "notification_seen_ids";

// --- 单例状态提升至顶层 ---
const notifications = ref<NotificationRecord[]>([]);
const seenIds = ref<Set<string>>(new Set());
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const isPolling = ref(false);
const isRequesting = ref(false); // 请求并发锁
const onNewMessageCallbacks = new Set<(msg: NotificationRecord) => void>();
let isInitialized = false;

/**
 * 获取本地已看过的消息 ID 集合
 */
const getSeenIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(SEEN_IDS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
};

/**
 * 保存已看过的消息 ID 集合到本地数据
 */
const saveSeenIds = (ids: Set<string>) => {
  localStorage.setItem(SEEN_IDS_KEY, JSON.stringify([...ids]));
};

/**
 * 响应页面可见性变更
 */
const handleVisibilityChange = () => {
  if (document.hidden) {
    stopPollingInternal();
  } else if (isPolling.value) {
    // 只有之前处于轮询状态时，切回来才恢复
    timer.value = setTimeout(pollInternal, 1000);
  }
};

/**
 * 停止轮询（内部调用）
 */
const stopPollingInternal = () => {
  if (timer.value) {
    clearTimeout(timer.value);
    timer.value = null;
  }
};

/**
 * 轮询核心逻辑（内部调用）
 */
const pollInternal = async () => {
  if (!isPolling.value || isRequesting.value) return;

  isRequesting.value = true;
  try {
    const remoteList = await fetchNotifications();
    notifications.value = remoteList;

    // 检查是否有未曾弹通过的消息
    for (let i = remoteList.length - 1; i >= 0; i--) {
      const item = remoteList[i];
      if (!seenIds.value.has(item.id)) {
        onNewMessageCallbacks.forEach((cb) => cb(item));
        // 标记并保存
        seenIds.value.add(item.id);
        saveSeenIds(seenIds.value);
        break;
      }
    }
  } catch (error) {
    console.error("轮询通知失败:", error);
  } finally {
    isRequesting.value = false;
  }

  // 继续下一次轮询
  if (isPolling.value) {
    stopPollingInternal();
    timer.value = setTimeout(pollInternal, 5000);
  }
};

// 全局初始化：仅执行一次监听挂载
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

/**
 * 实时通知 Hook (单例模式)
 */
export function useNotifications() {
  if (!isInitialized) {
    seenIds.value = getSeenIds();
    isInitialized = true;
  }

  /**
   * 是否有任何通知
   */
  const hasNotifications = computed(() => notifications.value.length > 0);

  /**
   * 开始轮询
   * @param delay 初始延迟（毫秒）
   */
  const startPolling = (delay = 3000) => {
    isPolling.value = true;
    stopPollingInternal();
    timer.value = setTimeout(pollInternal, delay);
  };

  /**
   * 停止轮询
   */
  const stopPolling = () => {
    isPolling.value = false;
    stopPollingInternal();
  };

  /**
   * 标记已读并持久化
   */
  const markAsSeen = (id: string) => {
    seenIds.value.add(id);
    saveSeenIds(seenIds.value);
  };

  /**
   * 注册新消息监听
   */
  const onNewMessage = (cb: (msg: NotificationRecord) => void) => {
    onNewMessageCallbacks.add(cb);
  };

  return {
    notifications,
    hasNotifications,
    startPolling,
    stopPolling,
    markAsSeen,
    onNewMessage,
  };
}
