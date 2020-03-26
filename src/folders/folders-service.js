// CRUD (create, read, update, and delete) operations. Allows for persistent storage

const FoldersService = {
  getAllFolders(knex) {
    return knex.select('*').from('folders')
  },

  insertFolder(knex, newFolder) {
    return knex
      .insert(newFolder)
      .into('folders')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  getById(knex, folderId) {
    return knex
      .from('folders')
      .select('*')
      .where('folderId', folderId)
      .first()
  },

  deleteNote(knex, folderId) {
    return knex('folders')
      .where({ folderId })
      .delete()
  },

  updateFolder(knex, folderId, newFoldersFields) {
    return knex('folders')
      .where({ folderId })
      .update(newFoldersFields)
  },
}

module.exports = FoldersService
