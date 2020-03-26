const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')
const notesRouter = express.Router()
const jsonParser = express.json()

const serializeFolders = folder => ({
  folderId: folder.folderId,
  title: xss(folder.title),
  count: folder.count
})

// get all and post new folder
foldersRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    FoldersService.getAllFolders(knexInstance)
      .then(folders => {
        res.json(notes.map(serializeFolder))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title } = req.body
    const newFolder = { title }

    for (const [key, value] of Object.entries(newFolder)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body.` }
        })
      }
    }

    newFolder.title = title;

    FoldersService.insertFolder(
      req.app.get('db'),
      newFolder
    )
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.folderId}`))
          .json(serializeFolder(folder))
      })
      .catch(next)
  })

// get folder by id, delete by id, patch updates title
foldersRouter
  .route('/:folder_id')
  .all((req, res, next) => {
    FoldersService.getById(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(folder => {
        if (!folder) {
          return res.status(404).json({
            error: { message: `Folder does not exist.` }
          })
        }
        res.folder = folders
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializeFolder(res.folder))
  })
  .delete((req, res, next) => {
    FoldersService.deleteFolder(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  // update folder
  .patch(jsonParser, (req, res, next) => {
    const { title } = req.body
    const folderToUpdate = { title}

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain the 'title'.`
        }
      })

    FoldersService.updateFolder(
      req.app.get('db'),
      req.params.folder_id,
      noteToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = foldersRouter
