<script setup lang="ts">
import store from "@/store";
import { computed, ref } from "vue";

const fitHeight = ref(true);
const urlLowRes = computed(() => {
    if (store.fullscreenPost === null) {
        return "";
    }

    return store.fullscreenPost.lowres_url || store.fullscreenPost.image_url;
});
const urlOriginal = computed(() => {
    if (store.fullscreenPost === null) {
        return "";
    }

    return store.fullscreenPost.image_url;
});
</script>

<template>
    <div class="content-container">
        <img
            class="content high-res"
            :class="{
                'fit-height': fitHeight,
                'fit-width': !fitHeight,
            }"
            :src="urlOriginal"
            @click="fitHeight = !fitHeight"
            loading="lazy"
        />
        <img
            class="content low-res"
            :class="{
                'fit-height': fitHeight,
                'fit-width': !fitHeight,
            }"
            :src="urlLowRes"
            @click="fitHeight = !fitHeight"
            loading="lazy"
        />
    </div>
</template>

<style lang="scss" scoped>
@import "@/assets/breakpoints";

.content-container {
    height: 100%;
    overflow-y: scroll;
    line-height: 0;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    @media (max-width: $mobile-width) {
        width: 100%;
    }
}

@media (max-width: $mobile-width) {
    .high-res {
        display: none;
    }
}

@media not (max-width: $mobile-width) {
    .low-res {
        display: none;
    }
}

.content {
    @media not (max-width: $mobile-width) {
        max-width: 100%;
    }

    @media (max-width: $mobile-width) {
        position: relative;
        transform: translateY(-50%);
        top: 50%;
    }

    &.fit-height {
        max-height: 100%;
        width: auto;
        cursor: zoom-in;

        @media (max-width: $mobile-width) {
            max-width: 100%;
        }
    }

    &.fit-width {
        height: auto;

        cursor: zoom-out;
    }
}
</style>
