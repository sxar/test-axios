const users = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'active', role: 'admin' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', status: 'active', role: 'user' },
  { id: 3, firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', status: 'inactive', role: 'user' }
];
let nextId = 4;

function allocateId() {
  const id = nextId;
  nextId += 1;
  module.exports.nextId = nextId;
  return id;
}

module.exports = { users, nextId, allocateId };
