function delay(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}


// check has coin?
async function throwCoin() {
  await delay(3000);
  console.log($($('.coin')[0]).attr('title'));
  // console.log($('.coin')[0].click());
  await delay(5000);
  // console.log($('.bi-btn')[0].click());
}

function choiceOneAtHome() {
  var list = $('.bili-video-card a');
  var index = Math.floor(Math.random() * list.length);
  var item = $(list[index]);
  item.removeAttr('target');
  console.log(index, list.length)
  console.log(item)
  console.log(list[index].click())
}

throwCoin();
