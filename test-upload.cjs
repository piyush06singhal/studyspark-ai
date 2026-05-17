const fs = require('fs');

async function test() {
  const form = new FormData();
  form.append('file', new Blob(['Hello world this is a test text document.']), 'test.txt');

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: form
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}

test();
