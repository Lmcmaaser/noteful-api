// function that returns an array of notes
//xss test

function makeFoldersArray() {
  return [
    {
      folderid: 1,
      title: "Important"
    },
    {
      folderid: "2",
      title: "Super"
    },
    {
      folderid: "3",
      title: "Spangley"
    },
  ]
}

/* function makeMaliciousFolder() {
  const maliciousFolder = {
    folderid: 911,
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
}*/

module.exports = {
  makeFoldersArray,
  //makeMaliciousFolder,
}
