/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression";
import pxtoviewport from 'postcss-px-to-viewport'

// https://vitejs.dev/config/
export default ({ mode }) =>
  defineConfig({
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue"],
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /(.*?)\.(js|css|woff2|woff|ttf)/, // js / css 静态资源缓存
              handler: "CacheFirst",
              options: {
                cacheName: "js-css-cache",
              },
            },
            {
              urlPattern: /(.*?)\.(png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/, // 图片缓存
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
    ],
    server: {
      port: "3000",
      open: true,
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
            unitToConvert: 'vpx',    // 要转换的单位
            viewportWidth: 390,     // 设计稿的视口宽度（按你的设计稿尺寸设置）
            unitPrecision: 5,       // 转换后的保留小数位数
            propList: ['*'],        // 需要转换的CSS属性，*表示全部
            viewportUnit: 'vw',     // 转换后的单位
            fontViewportUnit: 'vw', // 字体使用的视口单位
            selectorBlackList: [],  // 不需要转换的CSS选择器
            minPixelValue: 1,       // 最小转换数值（小于等于该值不转换）
            mediaQuery: false,      // 是否转换媒体查询中的px
            replace: true,          // 是否直接替换值而不是添加备用
            exclude: undefined,     // 排除的文件（正则表达式）
            include: undefined,     // 包含的文件（正则表达式）
            landscape: false,       // 是否处理横屏情况
            landscapeUnit: 'vw',    // 横屏使用的单位
            landscapeWidth: 812     // 横屏视口宽度
          })
        ]
      },
      preprocessorOptions: {
        scss: {
          charset: false,
          additionalData: `@import "./src/style/global.scss";`,
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
