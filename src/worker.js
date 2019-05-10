onmessage = function(e) {
  if (e.data.keyword) {
    postMessage({
      type: 'data',
      data: getResults(e.data.keyword, e.data.total)
    });
  }
};

function getResults(keyword, total = 1000000) {
  if (self.data) {
    return self.data.filter(
      result =>
        result.label.substr(0, keyword.length).toUpperCase() ===
        keyword.toUpperCase()
    );
  }
  const start = new Date();
  const results = [];
  for (let i = 0; i < total; i++) {
    results.push({
      label: getRandomString(),
      value: i
    });
  }
  const end = new Date();
  postMessage({ type: 'mock', duration: (end - start) / 1000 });
  self.data = results;
  return results.filter(
    result =>
      result.label.substr(0, keyword.length).toUpperCase() ===
      keyword.toUpperCase()
  );
}

function getRandomString() {
  const length = Math.random() * 10;
  const codes = [];
  for (let i = 0; i < length; i++) {
    codes.push(Math.round(Math.random() * 122));
  }
  return String.fromCharCode.apply(null, codes);
}
