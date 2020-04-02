const expect = require('chai').expect;
const knex = require('knex')
const app = require('../src/app')
const fixtures = require('./notes.fixtures')
const { makeNotesArray } = require('./notes.fixtures')
const supertest = require('supertest');

describe('Notes Endpoints', function() {
  let db

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
          .get('/notes')
          .expect(200, [])
      })
    })
    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('notes')
          .insert(testNotes)
      })

      it('responds with 200 and all of the notes', () => {
        return supertest(app)
          .get('/notes')
          .expect(200, testNotes)
      })
    })
  })

  describe(`GET /notes/:notes_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456
        return supertest(app)
          .get(`/notes/${noteId}`)
          .expect(404, { error: { message: `Note doesn't exist` } })
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
        const noteId = 2
        const expectedNote = testNotes[noteId - 1]
        return supertest(app)
          .get(`/notes/${noteId}`)
          .expect(200, expectedNote)
      })
    })
  })
})
