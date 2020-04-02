const expect = require('chai').expect;
const knex = require('knex')
const app = require('../src/app')
const fixtures = require('./folders.fixtures')
const { makeFoldersArray } = require('./folders.fixtures')
const supertest = require('supertest');

describe('Folders Endpoints', function() {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('folders').truncate())

  afterEach('cleanup', () => db('folders').truncate())

  describe(`GET /folders`, () => {
    context(`Given no folders`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/folders')
          .expect(200, [])
      })
    })
    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testfolders)
      })

      it('responds with 200 and all of the folders', () => {
        return supertest(app)
          .get('/folders')
          .expect(200, testFolders)
      })
    })
  })

  describe(`GET /folders/:folders_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 123456
        return supertest(app)
          .get(`/folders/${folderId}`)
          .expect(404, { error: { message: `folder doesn't exist` } })
        })
    })

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray()

      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })

      it('responds with 200 and the specified folder', () => {
        const folderId = 2
        const expectedFolder = testFolders[folderId - 1]
        return supertest(app)
          .get(`/folders/${folderId}`)
          .expect(200, expectedFolder)
      })
    })
  })
})
