function delay(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

async function waitForDom(searchStr, times = 20) {
  const items = $(searchStr);
  if (items.length) {
    return items[0];
  }
  if (times <= 0) {
    return null;
  }
  await delay(500);
  return waitForDom(searchStr, times - 1);
}

const UIContainer = $('<div id="auto-container" style="background-color: rgba(0,0,0,0.5);position:fixed;left:0;top:0;width:200px;height:100px;z-index:2000;border-bottom-right-radius:20px;color: white;display:flex;flex-direction: column;justify-content: center;align-items: center;"></div>');
const Label = $('<div id="auto-status">未启动</div>');
const UIBtn = $('<button id="auto-btn" style="color: aliceblue;width: 100px;height: 40px;background-color: darkseagreen;border-radius: 10px;margin-top: 10px;">点击开始</button>');

let isAutoOn = false;
let isRunning = false;
chrome.storage.sync.get("autoOn", ({ autoOn }) => {
  isAutoOn = autoOn === '1'
  if (isAutoOn) {
    Label.text('运行中');
    UIBtn.text('点击暂停');
    start();
  }
  UIBtn.click(function() {
    isAutoOn = !isAutoOn;
    chrome.storage.sync.set({ autoOn: isAutoOn ? '1' : '0' });
    if (!isAutoOn) {
      Label.text('未启动');
      UIBtn.text('点击开始');
    } else {
      Label.text('运行中');
      UIBtn.text('点击暂停');
      start();
    }
  });
  UIContainer.append(Label);
  UIContainer.append(UIBtn);
  $('body').append(UIContainer);
});

function end(msg) {
  Label.text(msg);
  UIBtn.text('点击开启');
  isAutoOn = false;
  chrome.storage.sync.set({ autoOn: '0' });
}

async function start() {
  if (isRunning || !isAutoOn) {
    return;
  }
  isRunning = true;
  if (!await checkISVideo()) {
    return;
  }
  await throwCoin();
  isRunning = false;
}

// 投币
async function throwCoin() {
  const coins = await getCoins();
  if (coins > 0) {
    const c = $('.coin')[0]
    if (!c || $(c).attr('class').indexOf('on') > -1) {
      // 已经投过了，下一个视频
      await goToRandomVideo();
      return
    }
    c.click();
    const btn = await waitForDom('.bi-btn');
    if (!btn) {
      return end('未找到投币按钮');
    }
    // 投币
    btn.click();
    await delay(1000);
    // 留个言
    await comment();
    // 去下一个视频
    await goToRandomVideo();
  } else if (coins === -1) {
    end('请先登录');
  } else if (coins === -2) {
    end ('找不到你的硬币');
  } else {
    end('你没有硬币了');
  }
}

// 获取硬币数量
async function getCoins(times = 20) {
  const isNotLogin = !!$('.header-login-entry').length;
  const header = $('.header-avatar-wrap');
  const coinDoms = $('.coin-item__num');
  if (coinDoms.length) {
    const re = parseInt($(coinDoms[0]).text(), 10);
    // 隐藏一下用户信息
    header[0].dispatchEvent(new MouseEvent('mouseleave', {
      'view': window,
      'bubbles': true,
      'cancelable': true,
    }));
    return re;
  } else if (header.length) {
    // 显示一下用户信息
    header[0].dispatchEvent(new MouseEvent('mouseenter', {
      'view': window,
      'bubbles': true,
      'cancelable': true,
    }));
  } else if (isNotLogin) {
    return -1;
  }
  if (times <= 0) {
    // 超时啦
    return -2
  }
  await delay(500);
  return getCoins(times - 1);
}

// 随机选择一个视频跳转
async function goToRandomVideo(wait = 1000) {
  await delay(wait);
  const isVideo = window.location.href.startsWith('https://www.bilibili.com/video/');
  let list = $('a[href^="/video/"],a[href^="//www.bilibili.com/video/"],a[href^="https://www.bilibili.com/video/"]');
  if (isVideo && Math.random() < 0.7) {
    list = [];
  }
  if (list.length > 0) {
    const index = Math.floor(Math.random() * list.length);
    const item = list[index];
    console.log('item', item)
    // 不跳新窗口
    $(item).removeAttr('target');
    item.click()
    // 如果跳不过去，走兜底
    await delay(wait);
    window.location.href = $(item).attr('href');
  } else {
    // 兜底跳首页
    console.log('兜底')
    window.location.href = 'https://www.bilibili.com';
  }
}

// 检查是否在视频播放页，不是则跳转
async function checkISVideo() {
  if (window.location.href.startsWith('https://www.bilibili.com/video/')) {
    return true;
  }
  this.goToRandomVideo();
  return false;
}

const COMMENT_LIST = [
  '恭喜你获得本人撒币行动的硬币',
  '虽然没有怎么看，但是投币支持一下',
  '快了，快了，我这币要投完了',
  '先投后看',
];

// 投完币，留个言
async function comment() {
  try {
    // 滚动一下屏幕
    document.documentElement.scrollTo({
      top: 600,
      behavior: 'smooth',
    });
    const input = await waitForDom('.ipt-txt');
    if (!input) {
      console.log('没发现输入框');
      return;
    }
    // 降低概率来评论
    if (Math.random() < 0.8) {
      return;
    }
    input.textContent = COMMENT_LIST[Math.floor(Math.random() * COMMENT_LIST.length)];
    $('.comment-submit')[0].click();
    // 滚回去
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    await delay(1000);
  } catch (e) {
    // 非核心任务，报错就报错了
    console.log(e);
  }
}