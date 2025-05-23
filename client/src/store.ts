import { reactive } from "vue";
import SearchQuery from "./search";

type SettingsKey = keyof Omit<Store["settings"], "save" | "write">;

function loadValue<K extends SettingsKey, V = Store["settings"][K]>(
    key: K,
    defaultValue: V,
    transform: (val: string) => V,
): V {
    const val = localStorage?.getItem(key);
    if (val === null) {
        return defaultValue;
    }
    return transform(val);
}

type Store = {
    currentPage: number;
    totalPostCount: number;
    resultsPerPage: number;

    fullscreenPost: Post | null;

    sidebarClosed: boolean;

    settings: {
        columnSizing: "fixed" | "dynamic";
        columnCount: number;
        columnWidth: number;

        closeSidebarOnSearch: boolean;

        helpClosed: boolean;

        save(): void;
        write<K extends SettingsKey, V = Store["settings"][K]>(
            key: K,
            transform: (val: V) => string,
        ): void;
    };

    query: SearchQuery;

    /** mapping of page number to posts */
    posts: Map<number, Post[]>;
    cachedTags: Map<string, Tag>;

    tagsForPost(post: Post): Promise<Tag[]>;

    hasResults(): boolean;
    loadTags(tags: string[]): Promise<void>;
    maxPage(): number;
    nextPage(): void;
    postsForCurrentPage(): Post[] | undefined;
    prevPage(): void;
    searchPosts({ reset }: { reset: boolean }): Promise<void>;
    setQueryParams(): void;
};

const store = reactive<Store>({
    currentPage: 1,
    totalPostCount: 0,
    resultsPerPage: 0,

    fullscreenPost: null,

    sidebarClosed: false,

    settings: {
        columnSizing: loadValue("columnSizing", "dynamic", (v) => v as any),
        columnCount: loadValue("columnCount", 3, parseInt),
        columnWidth: loadValue("columnWidth", 400, parseInt),

        closeSidebarOnSearch: loadValue(
            "closeSidebarOnSearch",
            true,
            JSON.parse,
        ),

        helpClosed: loadValue("helpClosed", false, JSON.parse),

        save() {
            this.write("columnSizing", (v) => v);
            this.write("columnCount", (v) => v.toString());
            this.write("columnWidth", (v) => v.toString());
            this.write("closeSidebarOnSearch", JSON.stringify);
            this.write("helpClosed", JSON.stringify);
        },

        write<K extends keyof Store["settings"], V = Store["settings"][K]>(
            key: K,
            transform: (val: V) => string,
        ) {
            localStorage?.setItem(key, transform(this[key] as V));
        },
    },

    query: new SearchQuery(),
    posts: new Map(),
    cachedTags: new Map(),

    tagsForPost(post: Post): Promise<Tag[]> {
        return new Promise<Tag[]>((resolve, reject) => {
            store
                .loadTags(post.tags)
                .then(() =>
                    resolve(
                        post.tags
                            .map((t) => store.cachedTags.get(t))
                            .filter((t) => t != null),
                    ),
                )
                .catch(reject);
        });
    },

    hasResults(): boolean {
        return this.totalPostCount > 0;
    },

    setQueryParams() {
        const url = new URL(window.location.href);
        url.searchParams.set("page", this.currentPage.toString());
        url.searchParams.set("q", this.query.asList().join(","));
        window.history.pushState(null, "", url.toString());
    },

    searchPosts({ reset }: { reset: boolean }): Promise<void> {
        type PostListResponse = {
            count_per_page: number;
            total_count: number;
            results: Post[];
        };

        return new Promise((resolve, reject) => {
            const page = reset ? 1 : this.currentPage;
            const query =
                `q=${encodeURIComponent(this.query.asList().join(" "))}` +
                `&page=${page}`;

            fetch("/api/posts?" + query)
                .then((resp) => {
                    resp.json().then((json: PostListResponse) => {
                        if (reset) {
                            this.posts.clear();
                        }

                        this.posts.set(page, json.results);
                        this.resultsPerPage = json.count_per_page;
                        this.totalPostCount = json.total_count;
                        this.currentPage = page;

                        this.setQueryParams();
                        resolve();
                    });
                })
                .catch((err) => {
                    console.error(err);
                    reject(err);
                });
        });
    },

    maxPage(): number {
        return Math.ceil(this.totalPostCount / this.resultsPerPage);
    },

    loadTags(tags: string[]): Promise<void> {
        type TagResponse = {
            results: Tag[];
        };

        const maxTagsPerRequest = 100;

        // Fetch tags in parallel if there are too many for one request
        if (tags.length > maxTagsPerRequest) {
            let requests: Promise<void>[] = [];

            for (let i = 0; i < tags.length; i += maxTagsPerRequest) {
                const start = i;
                const end = i + maxTagsPerRequest;
                requests = requests.concat(
                    this.loadTags(tags.slice(start, end)),
                );
            }

            return new Promise((resolve, reject) =>
                Promise.all(requests)
                    .then(() => resolve())
                    .catch(() => reject()),
            );
        }

        return new Promise((resolve, reject) => {
            const missing = tags.filter((t) => !this.cachedTags.has(t));

            if (missing.length === 0) {
                resolve();
                return;
            }

            fetch("/api/tags?q=" + encodeURIComponent(missing.join(" ")))
                .then((resp) => {
                    resp.json().then((json: TagResponse) => {
                        json.results.forEach((t) =>
                            this.cachedTags.set(t.name, t),
                        );
                        resolve();
                    });
                })
                .catch((err) => {
                    console.error(err);
                    reject();
                });
        });
    },

    postsForCurrentPage(): Post[] | undefined {
        return this.posts.get(this.currentPage);
    },

    nextPage() {
        if (this.currentPage < this.maxPage()) {
            this.currentPage++;
            this.searchPosts({ reset: false });
        }
    },

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.searchPosts({ reset: false });
        }
    },
});

export default store;
