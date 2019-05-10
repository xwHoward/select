onmessage = function(e) {
  if (e.data.keyword) {
    postMessage(getResults(e.data.keyword, e.data.total));
  }
};

function getResults(keyword, total = 1000000) {
  const results = [];
  for (let i = 0; i < total; i++) {
    results.push({
      label: getRandomString(),
      value: i
    });
  }
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
