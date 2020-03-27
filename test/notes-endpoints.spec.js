const knex = require('knex')
const fixtures = require('./notes-test-data')
const app = require('../src/app')

describe('Notes Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())
  before('cleanup', () => db('notes').truncate())
  afterEach('cleanup', () => db('notes').truncate())

// unathorized requests
  describe(`Unauthorized requests`, () => {
    const testNotes = fixtures.makeNotesArray()

    beforeEach('insert notes', () => {
      return db
        .into('notes')
        .insert(testNotes)
    })

    it(`responds with 401 Unauthorized for GET /api/notes`, () => {
      return supertest(app)
        .get('/api/notes')
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for POST /api/notes`, () => {
      return supertest(app)
        .post('/api/notes')
        .send({ title: 'test-title', modified: 2019-01-03T00:00:00.000Z, content: 'content' })
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for GET /api/notes/:note_id`, () => {
      const secondNote = testNotes[1]
      return supertest(app)
        .get(`/api/notes/${secondNote.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for DELETE /api/notes/:note_id`, () => {
      const aNote = testNotes[1]
      return supertest(app)
        .delete(`/api/notes/${aNote.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })
  })

// tests GET
  describe('GET /api/notes', () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are notes in the database', () => {
      const testNotes = fixtures.makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('notes')
          .insert(testNotes)
      })

      it('gets the notes from noteful', () => {
        return supertest(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testNotes)
      })
    })

    context(`Given an XSS attack note`, () => {
      const { maliciousTest, expectedNote } = fixtures.makeMaliciousNote()

      beforeEach('insert malicious note', () => {
        return db
          .into('notes')
          .insert([maliciousTest])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedNote.title)
            expect(res.body[0].content).to.eql(expectedNote.content)
          })
      })
    })
  })

  describe('GET /api/notes/:note_id', () => {
    context(`Given no notes`, () => {
      it(`responds 404 when the note does not exist`, () => {
        return supertest(app)
          .get(`/api/notes/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Note Not Found` }
          })
      })
    })

    context('Given there are notes in the database', () => {
      const testNotes = fixtures.makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('notes')
          .insert(testNotes)
      })

      it('responds with 200 and the specified note', () => {
        const noteId = 2
        const expectedNote = testNotes[noteId - 1]
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedNote)
      })
    })

    context(`Given an XSS attack note`, () => {
      const { maliciousTest, expectedNote } = fixtures.makeMaliciousNote()

      beforeEach('insert malicious note', () => {
        return db
          .into('notes')
          .insert([maliciousTest])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes/${maliciousTest.note_id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedNote.title)
            expect(res.body.content).to.eql(expectedNote.content)
          })
      })
    })
  })

  describe('DELETE /api/notes/:note_id', () => {
    context(`Given no notes`, () => {
      it(`responds 404 when the note does not exist`, () => {
        return supertest(app)
          .delete(`/api/notes/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Note Not Found` }
          })
      })
  })

  describe.only(`PATCH /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456
        return supertest(app)
          .patch(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note with that id does not exist` } })
        })
    })
  })

    context('Given there are notes in the database', () => {
      const testNotes = fixtures.makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('notes')
          .insert(testNotes)
      })

      it('removes the note by id from noteful', () => {
        const idToRemove = 2
        const expectedNotes = testNotes.filter(n => n.id !== idToRemove)
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/notes`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedNotes)
          )
      })
    })
  })

  describe('POST /api/notes', () => {
    it(`responds with 400 missing 'title' if not supplied`, () => {
      const newNoteMissingTitle = {
        // title: 'test-title',
        modified: 2019-01-03T00:00:00.000Z,
        content: 'test content',
      }
      return supertest(app)
        .post(`/api/notes`)
        .send(newNoteMissingTitle)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, `'title' is required`)
    })
    it(`responds with 400 missing 'modified' if not supplied`, () => {
      const newNoteMissingModified = {
        title: 'test-title',
        // modified: 2019-01-03T00:00:00.000Z,
        content: 'test-content',
      }
      return supertest(app)
        .post(`/api/notes`)
        .send(newNoteMissingModified)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, `'modified' is required`)
    })
    it(`responds with 400 missing 'content' if not supplied`, () => {
      const newNoteMissingContent = {
        title: 'test-title',
        modified: 2019-01-03T00:00:00.000Z,
        // content: 'test-content',
      }
      return supertest(app)
        .post(`/api/notes`)
        .send(newNoteMissingContent)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, `'content' is required`)
    })

    it('adds a new note to noteful', () => {
      const newNote = {
        title: 'test-title',
        modified: 2018-08-15T23:00:00.000Z,
        content: 'test content',
      }
      return supertest(app)
        .post(`/api/notes`)
        .send(newNote)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id')
          expect(res.body.title).to.eql(newNote.title)
          expect(res.body.modified).to.eql(newNote.modified)
          expect(res.body.content).to.eql(newNote.content)
        })
        .then(res =>
          supertest(app)
            .get(`/api/notes/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })

    it('removes XSS attack content from response', () => {
      const { maliciousTest, expectedNote } = fixtures.makeMaliciousNote()
      return supertest(app)
        .post(`/api/notes`)
        .send(maliciousTest)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedNote.title)
          expect(res.body.content).to.eql(expectedNote.content)
        })
    })
  })
})
