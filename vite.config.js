/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver, VantResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression";
import pxtoviewport from "postcss-px-to-viewport";
import mobileForever from "postcss-mobile-forever";
import { createHtmlPlugin } from "vite-plugin-html";

// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd()); // 获取当前环境的所有变量

  return defineConfig({
    plugins: [
      vue(),
      AutoImport({
        imports: [
          "vue",
          {
            "@/utils/toVpx": ["toVpx"],
          },
        ],
        resolvers: [ElementPlusResolver(), VantResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver(), VantResolver()],
      }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // Questions 已拆分为独立应用。根 Service Worker 的 scope 仍覆盖这些路径，
          // 但不应为它们执行 SPA 导航回退或运行时静态资源缓存。
          navigateFallbackDenylist: [/^\/questions(?:-next)?(?:\/|$)/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                !/^\/questions(?:-next)?(?:\/|$)/.test(url.pathname) &&
                /\.(js|css|woff2|woff|ttf)$/.test(url.pathname), // js / css 静态资源缓存
              handler: "CacheFirst",
              options: {
                cacheName: "js-css-cache",
              },
            },
            {
              urlPattern: ({ url }) =>
                !/^\/questions(?:-next)?(?:\/|$)/.test(url.pathname) &&
                /\.(png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)$/.test(url.pathname), // 图片缓存
              handler: "CacheFirst",
              options: {
                cacheName: "image-cache",
              },
            },
          ],
        },
        manifest: {
          name: loadEnv(mode, process.cwd()).VITE_SITE_NAME,
          short_name: loadEnv(mode, process.cwd()).VITE_SITE_NAME,
          description: loadEnv(mode, process.cwd()).VITE_SITE_DES,
          display: "standalone",
          start_url: "/",
          theme_color: "#424242",
          background_color: "#424242",
          icons: [
            {
              src: "/images/icon/48.png",
              sizes: "48x48",
              type: "image/png",
            },
            {
              src: "/images/icon/72.png",
              sizes: "72x72",
              type: "image/png",
            },
            {
              src: "/images/icon/96.png",
              sizes: "96x96",
              type: "image/png",
            },
            {
              src: "/images/icon/128.png",
              sizes: "128x128",
              type: "image/png",
            },
            {
              src: "/images/icon/144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "/images/icon/192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/images/icon/512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
      viteCompression(),
      createHtmlPlugin({
        inject: {
          data: {
            // 这里映射 HTML 中的占位符
            VITE_SITE_NAME: env.VITE_SITE_NAME,
            VITE_SITE_DES: env.VITE_SITE_DES,
            VITE_SITE_KEYWORDS: env.VITE_SITE_KEYWORDS,
            VITE_SITE_ANTHOR: env.VITE_SITE_ANTHOR,
            VITE_SITE_LOGO: env.VITE_SITE_LOGO,
            VITE_SITE_APPLE_LOGO: env.VITE_SITE_APPLE_LOGO,
          },
        },
      }),
    ],
    server: {
      port: "3000",
      open: true,
      allowedHosts: ["local.sitkin.top"],
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "src"),
        },
      ],
    },
    css: {
      postcss: {
        plugins: [
          pxtoviewport({
            unitToConvert: "vpx", // 要转换的单位
            viewportWidth: 390, // 设计稿的视口宽度（按你的设计稿尺寸设置）
            unitPrecision: 5, // 转换后的保留小数位数
            propList: ["*"], // 需要转换的CSS属性，*表示全部
            viewportUnit: "vw", // 转换后的单位
            fontViewportUnit: "vw", // 字体使用的视口单位
            selectorBlackList: [], // 不需要转换的CSS选择器
            minPixelValue: 0.5, // 最小转换数值（小于等于该值不转换）
            mediaQuery: false, // 是否转换媒体查询中的px
            replace: true, // 是否直接替换值而不是添加备用
            exclude: undefined, // 排除的文件（正则表达式）
            include: undefined, // 包含的文件（正则表达式）
            landscape: false, // 是否处理横屏情况
            landscapeUnit: "vw", // 横屏使用的单位
            landscapeWidth: 812, // 横屏视口宽度
          }),
          /* pxtoviewport({
            unitToConvert: "px", // Vant 使用 px
            viewportWidth: 375, // Vant 设计稿宽度
            unitPrecision: 5,
            propList: ["*"],
            viewportUnit: "vw",
            fontViewportUnit: "vw",
            selectorBlackList: [],
            minPixelValue: 1,
            mediaQuery: false,
            replace: true,
            exclude: undefined,
            include: [/node_modules\/vant/], // 仅针对 Vant
            landscape: false,
          }), */
          mobileForever({
            appSelector: "#Questions", // 页面最外层选择器，例如“#app”，用于设置在桌面端和移动端横屏时的居中样式
            maxDisplayWidth: 680, // 限制视口单位的最大宽度
            include: [
              /src\/page\/Questions/,
              /src\/components\/AncientEnvelope/,
              /src\/components\/MagicLetter/,
              /src\/components\/LetterComponent/,
            ],
          }),
        ],
      },
      preprocessorOptions: {
        scss: {
          // 方案 1: 解决 "legacy-js-api" 警告
          api: "modern-compiler",

          /**
           * 方案 2: 动态注入逻辑
           * @param {string} source 文件内容
           * @param {string} fp 文件绝对路径
           */
          additionalData: (source, fp) => {
            // 1. 定义你需要注入全局变量的页面或文件夹路径（根据你的需求修改）
            // 例如：只给 src/page 目录下的文件注入，或者特定的组件
            const needGlobalScss = [
              resolve(__dirname, "src/page/Home.vue"),
              // 或者匹配整个目录
              // "src/page/"
            ];

            // 检查当前文件是否在白名单中
            const isTarget = needGlobalScss.some((path) => fp.includes(path));

            if (isTarget) {
              // 使用 @use 替代 @import 解决 "Sass @import rules are deprecated" 警告
              // 'as *' 表示引入后可以直接使用变量，不需要 global.$variable 这样写
              return `@use "@/style/global.scss" as *; \n ${source}`;
            }

            return source;
          },
        },
      },
    },
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          pure_funcs: ["console.log"],
        },
      },
    },
  });
};
