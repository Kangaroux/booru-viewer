<script setup lang="ts">
import store from "@/store";
import { onMounted, onUnmounted, ref } from "vue";
import ImageTab from "./ImageTab.vue";
import InfoTab from "./InfoTab.vue";
import ScreenCover from "../ScreenCover.vue";

type Tab = "image" | "info";

const currentTab = ref<Tab>("image");

function close() {
    store.fullscreenPost = null;
}

function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Esc" || e.key === "Escape") {
        e.preventDefault();
        close();
    }
}

onMounted(() => {
    document.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
    document.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
    <div class="fullscreen-viewer">
        <ScreenCover @click="close()" />
        <div class="viewer-container">
            <div class="tab">
                <KeepAlive>
                    <ImageTab v-if="currentTab == 'image'" />
                    <InfoTab v-else-if="currentTab == 'info'" />
                </KeepAlive>
            </div>
            <footer class="tab-menu">
                <button
                    class="menu-btn"
                    :class="{ active: currentTab == 'image' }"
                    @click="currentTab = 'image'"
                    title="view image"
                >
                    <i class="bi bi-image"></i>
                </button>
                <button
                    class="menu-btn"
                    :class="{ active: currentTab == 'info' }"
                    @click="currentTab = 'info'"
                    title="view tags"
                >
                    <i class="bi bi-info-circle"></i>
                </button>
                <button class="menu-btn" title="previous image">
                    <i class="bi bi-arrow-left"></i>
                </button>
                <button class="menu-btn" title="next image">
                    <i class="bi bi-arrow-right"></i>
                </button>
                <button
                    class="menu-btn close-btn"
                    @click="close()"
                    title="close"
                >
                    <i class="bi bi-x-lg"></i>
                </button>
            </footer>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "@/assets/breakpoints";

.fullscreen-viewer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.viewer-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    @media not (max-width: $mobile-width) {
        padding: 0 100px;
    }
}

.tab {
    z-index: 2;
    min-height: 0;
    flex: 1;
    overflow-y: scroll;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    @media (max-width: $mobile-width) {
        overflow: scroll;
        width: 100%;
    }
}

.tab-menu {
    display: flex;
    z-index: 2;
}

.menu-btn {
    background: none;
    border: none;
    color: white;
    font-size: 30px;
    text-shadow: 0 0 5px white;
    opacity: 0.5;
    transition: opacity 150ms;
    cursor: pointer;
    padding: 15px;

    &:hover,
    &.active {
        opacity: 1;
    }
}

.close-btn {
    color: #bb9fce;
    text-shadow: 0 0 5px #bb9fce;
}
</style>
