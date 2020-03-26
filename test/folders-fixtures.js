// function that returns an array of notes
//xss test

function makeFoldersArray() {
  return [
    {
      folderId: 1,
      title: "Important"
    },
    {
      folderId: "2",
      title: "Super"
    },
    {
      folderId: "3",
      title: "Spangley"
    },
  ]
}

function makeMaliciousFolder() {
  const maliciousFolder = {
    folderId: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
  }
  const expectedFolder = {
    ...maliciousFolder,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
  }
  return {
    maliciousFolder,
    expectedFolder,
  }
}

module.exports = {
  makeFoldersArray,
  makeMaliciousFolder,
}
