import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const { VITE_BASE_URL } = env;
    return {
        plugins: [vue()],
        resolve: {
            alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
        },
        server: {
            proxy: {
                "/uploads": {
                    target: VITE_BASE_URL,
                    changeOrigin: true,
                    configure: (proxy) => {
                        proxy.on("proxyReq", (_proxyReq, req) => {
                            // console.log(`Proxying API ${req.method} ${req.url} → ${VITE_BASE_URL + req.url}`);
                        });
                    }
                },
                "/api": {
                    target: VITE_BASE_URL,
                    changeOrigin: true
                }
            }
        }
    };
});
