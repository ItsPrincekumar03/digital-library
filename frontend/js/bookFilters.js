import { api } from "./api.js";

export const BOOK_SORT_OPTIONS = [
    { value: "created_at:DESC", label: "Recently added" },
    { value: "title:ASC", label: "Title A to Z" },
    { value: "title:DESC", label: "Title Z to A" },
    { value: "publication_date:DESC", label: "Publication date, newest" },
    { value: "publication_date:ASC", label: "Publication date, oldest" },
];

export const ALLOWED_BOOK_SORTS = new Set(BOOK_SORT_OPTIONS.map((item) => item.value));

export function normalizeSortValue(sort, order) {
    const candidate = `${sort || "created_at"}:${String(order || "DESC").toUpperCase()}`;
    return ALLOWED_BOOK_SORTS.has(candidate) ? candidate : "created_at:DESC";
}

export function populateSortOptions(select, selectedValue = "created_at:DESC") {
    if (!select) {
        return;
    }

    select.replaceChildren();
    for (const item of BOOK_SORT_OPTIONS) {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.label;
        select.append(option);
    }

    select.value = ALLOWED_BOOK_SORTS.has(selectedValue)
        ? selectedValue
        : "created_at:DESC";
}

export function populateCategoryOptions(select, categories, selectedValue = "") {
    if (!select) {
        return "";
    }

    select.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All categories";
    select.append(allOption);

    const list = Array.isArray(categories) ? categories : [];
    for (const category of list) {
        if (category?.category_id === undefined || typeof category?.name !== "string") {
            continue;
        }
        const option = document.createElement("option");
        option.value = String(category.category_id);
        option.textContent = category.name;
        select.append(option);
    }

    const exists =
        Boolean(selectedValue) &&
        list.some((category) => String(category.category_id) === String(selectedValue));

    select.value = exists ? String(selectedValue) : "";
    return select.value;
}

export async function fetchAllCategories() {
    const response = await api.get("/categories");
    const categories = response?.data?.categories;

    if (!Array.isArray(categories)) {
        throw new Error("The category response did not contain a category list.");
    }

    return categories;
}
