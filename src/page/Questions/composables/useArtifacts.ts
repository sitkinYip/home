import { showImagePreview } from "vant";
import { Ref } from "vue";

/**
 * 遗物/线索 交互 Hook
 */
export function useArtifacts(videoPlayerRef: Ref<any>, magicScrollRef: Ref<any>) {
  /**
   * 打开视频播放器
   * @param url 视频地址
   */
  const openVideo = (url: string) => {
    videoPlayerRef.value?.open(url);
  };

  /**
   * 打开新页面
   * @param url 链接地址
   */
  const openPage = (url?: string) => {
    if (url) window.open(url);
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
        break;
      case "video":
        openVideo(item.url!);
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
