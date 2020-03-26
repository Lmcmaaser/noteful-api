// function that returns an array of notes
//xss test

function makeNotesArray() {
  return [
    {
      id: 1,
      title: 'Dogs',
      content: 'content',
      modified: 2019-01-03T00:00:00.000Z,
      folderId: 1
    },
    {
      id: 2,
      title: 'Cats',
      content: 'content',
      modified: 2018-08-15T23:00:00.000Z,
      folderId: 2
    },
    {
      id: 3,
      title: 'Pigs',
      content: 'content',
      modified: 2018-03-01T00:00:00.000Z,
      folderId: 3
    },
  ]
}

function makeMaliciousNote() {
  const maliciousNote = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    content: 'bad',
    rating: 2018-03-01T00:00:00.000Z,
  }
  const expectedNote = {
    ...maliciousNote,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    content: 'bad',
  }
  return {
    maliciousNote,
    expectedNote,
  }
}

module.exports = {
  makeNotesArray,
  makeMaliciousNote,
}
