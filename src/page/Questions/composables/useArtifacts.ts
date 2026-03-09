import { showImagePreview } from "vant";
import { Ref } from "vue";
import { tracker } from "@/utils/eventTracker";

/**
 * 遗物/线索 交互 Hook
 */
export function useArtifacts(videoPlayerRef: Ref<any>, magicScrollRef: Ref<any>) {
  /**
   * 打开视频播放器
   * @param url 视频地址
   * @param tips 提示文字（可选）
   */
  const openVideo = (url: string, tips?: string) => {
    videoPlayerRef.value?.open(url, tips);
    // 上报视频播放事件
    tracker.trackMediaPlay("video", url, tips || "视频", "旅行者");
  };

  /**
   * 打开新页面
   * @param url 链接地址
   */
  const openPage = (url?: string) => {
    if (url) {
      window.open(url);
      // 上报页面跳转事件
      tracker.trackLinkClick(url, undefined, "旅行者");
    }
  };

  /**
   * 预览图片
   * @param images 图片地址数组
   */
  const previewImage = (images: string[]) => {
    showImagePreview({
      images: images,
      closeable: true,
      teleport: "body",
    });
    // 上报图片预览事件
    tracker.trackMediaPlay("image", images[0] || "", `图片预览 (${images.length}张)`, "旅行者");
  };

  /**
   * 统一处理遗物点击动作
   * @param item 线索项
   */
  const handleArtifactAction = (item: any) => {
    switch (item.type) {
      case "url":
        openPage(item.url);
        break;
      case "img":
        // 使用 Vant 的 ImagePreview，支持双指缩放、左右滑动、手势关闭
        showImagePreview({
          images: item.imgList || [item.url!],
          closeable: true,
        });
        // 上报图片预览事件
        tracker.trackMediaPlay("image", item.url || "", item.tips || "图片线索", "旅行者");
        break;
      case "video":
        openVideo(item.url!, item.tips);
        break;
      case "text":
        // 触发羊皮纸弹窗
        magicScrollRef.value?.show(item);
        break;
    }
  };

  return {
    openVideo,
    openPage,
    previewImage,
    handleArtifactAction,
  };
}
