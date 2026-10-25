const { pool } = require('../backend/src/config/database');
const authorRepo = require('../backend/src/repositories/author.repository');
const categoryRepo = require('../backend/src/repositories/category.repository');

async function testArchival() {
    console.log('--- Testing Author and Category Repositories ---');

    let authorAId, authorBId, catAId, catBId;
    try {
        const stamp = Date.now();
        // 1. Create authors with unique names preserving alphabetical order
        authorAId = await authorRepo.create({ name: `Zane Grey ${stamp}`, bio: 'Western author' });
        authorBId = await authorRepo.create({ name: `Arthur Conan Doyle ${stamp}`, bio: 'Mystery author' });

        // 2. Create categories with unique names preserving alphabetical order
        catAId = await categoryRepo.create({ name: `Science Fiction ${stamp}`, description: 'Sci-Fi books' });
        catBId = await categoryRepo.create({ name: `Adventure ${stamp}`, description: 'Adventure books' });

        // 3. Test findAll (should be sorted by name and include both active records)
        const authorsBefore = await authorRepo.findAll();
        const testAuthors = authorsBefore.filter(a => a.author_id === authorAId || a.author_id === authorBId);
        console.log('Authors before archive (should be sorted Arthur, Zane):', testAuthors.map(a => a.name));
        if (testAuthors.length !== 2 || testAuthors[0].author_id !== authorBId || testAuthors[1].author_id !== authorAId) {
            throw new Error('Authors not sorted by name correctly');
        }

        const categoriesBefore = await categoryRepo.findAll();
        const testCategories = categoriesBefore.filter(c => c.category_id === catAId || c.category_id === catBId);
        console.log('Categories before archive (should be sorted Adventure, Science Fiction):', testCategories.map(c => c.name));
        if (testCategories.length !== 2 || testCategories[0].category_id !== catBId || testCategories[1].category_id !== catAId) {
            throw new Error('Categories not sorted by name correctly');
        }

        // 4. Archive Zane Grey and Adventure
        await authorRepo.archive(authorAId);
        await categoryRepo.archive(catBId);
        console.log('Archived Zane Grey (author) and Adventure (category).');

        // 5. Test findAll default (should exclude archived records)
        const authorsActive = await authorRepo.findAll();
        console.log('Active authors after archive (should only contain Arthur Conan Doyle):', authorsActive.filter(a => a.author_id === authorAId || a.author_id === authorBId).map(a => a.name));
        if (authorsActive.some(a => a.author_id === authorAId)) {
            throw new Error('Archived author was not excluded by is_archived = 0');
        }
        if (!authorsActive.some(a => a.author_id === authorBId)) {
            throw new Error('Active author was missing');
        }

        const categoriesActive = await categoryRepo.findAll();
        console.log('Active categories after archive (should only contain Science Fiction):', categoriesActive.filter(c => c.category_id === catAId || c.category_id === catBId).map(c => c.name));
        if (categoriesActive.some(c => c.category_id === catBId)) {
            throw new Error('Archived category was not excluded by is_archived = 0');
        }
        if (!categoriesActive.some(c => c.category_id === catAId)) {
            throw new Error('Active category was missing');
        }

        // 6. Test findAll with includeArchived: true (should return both)
        const allAuthors = await authorRepo.findAll({ includeArchived: true });
        const testAllAuthors = allAuthors.filter(a => a.author_id === authorAId || a.author_id === authorBId);
        console.log('All authors with includeArchived: true:', testAllAuthors.map(a => `${a.name} (archived: ${a.is_archived})`));
        if (testAllAuthors.length < 2) {
            throw new Error('includeArchived: true did not return all authors');
        }

        console.log('--- ALL REPOSITORY VERIFICATION TESTS PASSED ---');
    } finally {
        // 7. Cleanup test records so we don't pollute user database
        if (authorAId || authorBId) {
            await pool.query('DELETE FROM authors WHERE author_id IN (?, ?)', [authorAId || 0, authorBId || 0]);
        }
        if (catAId || catBId) {
            await pool.query('DELETE FROM categories WHERE category_id IN (?, ?)', [catAId || 0, catBId || 0]);
        }
        console.log('Cleaned up test data.');
        await pool.end();
    }
}

testArchival().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
