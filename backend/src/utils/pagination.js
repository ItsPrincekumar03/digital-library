const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(query) {
    let page = parseInt(query.page, 10);
    let limit = parseInt(query.limit, 10);

    if (!Number.isInteger(page) || page < 1) page = DEFAULT_PAGE;
    if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

function parseSort(query, allowedColumns, defaultColumn) {
    const column = allowedColumns.includes(query.sort) ? query.sort : defaultColumn;
    const direction = query.order && query.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return { column, direction };
}

function buildPaginationMeta({ page, limit, totalItems }) {
    return {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
    };
}

module.exports = { parsePagination, parseSort, buildPaginationMeta };
