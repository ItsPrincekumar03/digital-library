const chapterService = require('../services/chapter.service');

async function create(req, res, next) {
    try {
        const chapter = await chapterService.createChapter(req.params.bookId, req.user, req.body);
        res.status(201).json({ success: true, message: 'Chapter created.', data: { chapter } });
    } catch (err) { next(err); }
}

async function getForBook(req, res, next) {
    try {
        const chapters = await chapterService.getChaptersForBook(req.params.bookId);
        res.status(200).json({ success: true, data: { chapters } });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const chapter = await chapterService.getChapterById(req.params.id);
        res.status(200).json({ success: true, data: { chapter } });
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const chapter = await chapterService.updateChapter(req.params.id, req.user, req.body);
        res.status(200).json({ success: true, message: 'Chapter updated.', data: { chapter } });
    } catch (err) { next(err); }
}

async function publish(req, res, next) {
    try {
        const chapter = await chapterService.publishChapter(req.params.id, req.user);
        res.status(200).json({ success: true, message: 'Chapter published.', data: { chapter } });
    } catch (err) { next(err); }
}

async function archive(req, res, next) {
    try {
        const chapter = await chapterService.archiveChapter(req.params.id, req.user);
        res.status(200).json({ success: true, message: 'Chapter archived.', data: { chapter } });
    } catch (err) { next(err); }
}

async function reorder(req, res, next) {
    try {
        const chapters = await chapterService.reorderChapters(req.params.bookId, req.user, req.body.order);
        res.status(200).json({ success: true, message: 'Chapters reordered.', data: { chapters } });
    } catch (err) { next(err); }
}

module.exports = { create, getForBook, getById, update, publish, archive, reorder };