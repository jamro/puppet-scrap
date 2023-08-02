import jsonpath from 'jsonpath'

const doc = {
  books: [
    {
      name: 'Alpha'
    },
    {
      name: 'To remove'
    },
    {
      name: 'Beta'
    }
  ]
  
}

const queries = jsonpath.paths(doc, "$.books[*]").map(p => jsonpath.stringify(p))


const parent = jsonpath.parent(doc, queries[1])


parent.splice(1, 1)


console.log(doc)