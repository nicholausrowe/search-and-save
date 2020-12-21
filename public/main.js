// const browserify = require('browserify');
// const fs = require('browserify-fs');

const button = document.getElementById('search-btn');

button.addEventListener('click', function(){
  console.log("oh shit");
  makeQueries2();
})


function makeQueries() {

fs.mkdir('/home', function () {
  fs.writeFile('/home/hello-world.txt', 'Hello world!\n', function () {
    fs.readFile('/home/hello-world.txt', 'utf-8', function (err, data) {
      console.log(data);
    });
  });
});
}


function makeQueries2() {

  toggleClass('waiting-puppy', 'hidden', 'visible');

  let names = document.getElementById("names-input").value.split(", ");
  let keywords = document.getElementById("keywords-input").value.split(", ");
  // let ticker = document.getElementById("ticker-input").value;
  let ticker = document.getElementById("ticker-input").value;
  let saveFolder = document.getElementById("save-folder-input").value;



  for (let name = 0; name < names.length; name++) {
    for (let keyword = 0; keyword < keywords.length; keyword++) {
      let googleQuery = `https://www.google.com/search?q=${names[name]}+${keywords[keyword]}`;
      // console.time(`convertGoogleDuration - ${names[name]} + ${keywords[keyword]}`);
      postURL(googleQuery);
      // console.timeEnd(`convertGoogleDuration - ${names[name]} + ${keywords[keyword]}`);
    };
    let secQuery = `https://secsearch.sec.gov/search?affiliate=secsearch&query=${names[name]}`;
    // console.time(`convertSECDuration – ${names[name]}`);
    postURL(secQuery);


    if (ticker) {
      let otcQuery = `https://www.otcmarkets.com/stock/${ticker}/overview`;
      postURL(otcQuery);
      // console.timeEnd(`convertSECDuration – ${names[name]}`);
    }
  };
}

function postURL(URL) {
  fetch('../', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({'url': URL})
  })
  .then(function (response) {
    let filename = response.headers.get('content-disposition')
    .split(';')
    .find(n => n.includes('filename='))
    .replace('filename=', '')
    .trim()
    .slice(1, -1)
    .replace(/\\/g, '')
    .replace(/"/g, "'");
    return response.blob().then(blob => download(blob, filename));
  })
  .then(function (response) {

  })





  .catch((error) => {
    document.getElementById('errors')
      .insertAdjacentHTML('afterbegin',
      `<span class="err-msg">
       Failed to create PDF for: ${URL}</span><br>`);
    return Promise.reject();
  })
}

function toggleClass(elementId, class1, class2) {
  const element = document.getElementById(elementId);
  element.classList.toggle(class1);
  element.classList.toggle(class2);
}
