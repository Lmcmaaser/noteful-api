const expect = require('chai').expect;
const knex = require('knex')
const app = require('../src/app')
const fixtures = require('./notes.fixtures')
const { makeNotesArray } = require('./notes.fixtures')
const { makeFoldersArray } = require('./folders.fixtures')
const supertest = require('supertest');

describe('Notes Endpoints', function() {
  let db
  const token = `bearer ` + process.env.API_TOKEN;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('notes').truncate())
  afterEach('cleanup', () => db('notes').truncate())

  describe(`GET /notes`, () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/notes')
          .set('Authorization', token)
          .expect(200, [])
      })
    })
    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray()
      const testFolders = makeFoldersArray()

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          })
      })

      it('responds with 200 and all of the notes', () => {
        return supertest(app)
          .get('/api/notes')
          .set('Authorization', token)
          .expect(200, testNotes)
      })
    })
  })

  describe(`GET /api/notes/:notes_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 1
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .set('Authorization', token)
          .expect(404, { error: { message: `Note does not exist.` } })
        })
    })

    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('notes')
          .insert(testNotes)
      })

      it('responds with 200 and the specified note', () => {
        const noteid = 2
        const expectedNote = testNotes[noteid - 1]
        return supertest(app)
          .get(`/api/notes/${noteid}`)
          .set('Authorization', token)
          .expect(200, expectedNote)
      })
    })
  })
})
