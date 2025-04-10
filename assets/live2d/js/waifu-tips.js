/*
 * Live2D
 * https://gitee.com/JokerPan12/live2d
 */

function loadWidget(config) {
  let { waifuPath, apiPath, cdnPath } = config;
  let useCDN = false, modelList;
  if (typeof cdnPath === "string") {
    useCDN = true;
    if (!cdnPath.endsWith("/")) cdnPath += "/";
  } else if (typeof apiPath === "string") {
    if (!apiPath.endsWith("/")) apiPath += "/";
  } else {
    console.error("Invalid initWidget argument!");
    return;
  }
  localStorage.removeItem("waifu-display");
  sessionStorage.removeItem("waifu-text");
  document.body.insertAdjacentHTML("beforeend", `
    <div id="waifu">
			<div id="waifu-tips"></div>
			<canvas id="live2d" width="800" height="800"></canvas>
			<div id="waifu-tool" style="font-size: 14px;">
             <span class="fui-home" title="猫猫经验" style="line-height: 20px;"><img src="../assets/icons/comment.svg"/></span>
             <span class="fui-eye" title="被抓" style="line-height: 20px;"><img src="../assets/icons/attention_fill.svg"/></span>
             <span class="fui-photo" title="拍照" style="line-height: 20px;"><img src="../assets/icons/Camera2.svg"/></span>
             <span class="fui-cross" title="躲猫猫" style="line-height: 20px;"><img src="../assets/icons/round_close_fill.svg"/></span></div>
		</div>`);

  setTimeout(() => {
    document.getElementById("waifu").style.bottom = '-250px';
  }, 0);

  function randomSelection(obj) {
    return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
  }
  // 检测用户活动状态，并在空闲时显示消息
  let userAction = false,
    userActionTimer,
    messageTimer,
    messageArray = ["好久不见，日子过得好快呢……", "大坏蛋！你都多久没理人家了呀，嘤嘤嘤～", "嗨～快来逗我玩吧！", "这么久不想我吗(≧▽≦q)"];
  window.addEventListener("mousemove", () => userAction = true);
  window.addEventListener("keydown", () => userAction = true);
  setInterval(() => {
    if (userAction) {
      userAction = false;
      clearInterval(userActionTimer);
      userActionTimer = null;
    } else if (!userActionTimer) {
      userActionTimer = setInterval(() => {
        showMessage(randomSelection(messageArray), 6000, 9);
      }, 20000);
    }
  }, 1000);

  (function registerEventListener() {
    document.querySelector("#waifu-tool .fui-home img").addEventListener("click", showHitokoto);
    document.querySelector("#waifu-tool .fui-eye img").addEventListener("click", () => {
      loadOtherModel();
    });
    // document.querySelector("#waifu-tool .fui-user img").addEventListener("click", () => {
    //   loadRandModel();
    // });
    document.querySelector("#waifu-tool .fui-photo img").addEventListener("click", () => {
      showMessage("照好了嘛，是不是很可爱呢？", 6000, 9);
      Live2D.captureName = "photo.png";
      Live2D.captureFrame = true;
    });
    document.querySelector("#waifu-tool .fui-cross img").addEventListener("click", () => {
      localStorage.setItem("waifu-display", Date.now());
      showMessage("愿你有一天能与重要的人重逢。", 2000, 11);
      document.getElementById("waifu").style.bottom = "-500px";
      setTimeout(() => {
        document.getElementById("waifu").style.display = "none";
        document.getElementById("waifu-toggle").classList.add("waifu-toggle-active");
      }, 3000);
    });
    window.addEventListener("copy", () => {
      showMessage("你都复制了些什么呀，可以给我看看嘛", 6000, 9);
    });
    window.addEventListener("visibilitychange", () => {
      if (!document.hidden) showMessage("哇，你终于回来了～", 6000, 9);
    });
  })();

  (function welcomeMessage() {
    let text;
    if (location.pathname === "/") { // 如果是主页
      const now = new Date().getHours();
      if (now > 5 && now <= 7) text = "早上好！一日之计在于晨，美好的一天就要开始了。";
      else if (now > 7 && now <= 11) text = "上午好！工作顺利嘛，不要久坐，多起来走动走动哦！";
      else if (now > 11 && now <= 13) text = "中午了，工作了一个上午，现在是午餐时间！";
      else if (now > 13 && now <= 17) text = "午后很容易犯困呢，今天的运动目标完成了吗？";
      else if (now > 17 && now <= 19) text = "傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红～";
      else if (now > 19 && now <= 21) text = "晚上好，今天过得怎么样？";
      else if (now > 21 && now <= 23) text = ["已经这么晚了呀，早点休息吧，晚安～", "深夜时要爱护眼睛呀！", "还不快去睡觉，哼！"];
      else text = "你是夜猫子呀？这么晚还不睡觉，明天起的来嘛？";
    } else if (document.referrer !== "") {
      const referrer = new URL(document.referrer),
        domain = referrer.hostname.split(".")[1];
      if (location.hostname === referrer.hostname) text = "好久不见，你来啦～";
      else if (domain === "baidu") text = `Hello！来自 百度搜索 的朋友<br>你是搜索 <span>${referrer.search.split("&wd=")[1].split("&")[0]}</span> 找到的我吗？`;
      else if (domain === "so") text = `Hello！来自 360搜索 的朋友<br>你是搜索 <span>${referrer.search.split("&q=")[1].split("&")[0]}</span> 找到的我吗？`;
      else if (domain === "google") text = `Hello！来自 谷歌搜索 的朋友<br>欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
      else text = `Hello！来自 <span>${referrer.hostname}</span> 的朋友`;
    } else {
      //text = `欢迎来到<span>「${document.title.split(" - ")[0]}」</span>`;
      text = "好久不见，你来啦～";
    }
    showMessage(text, 7000, 8);
  })();

  function showHitokoto() {
    // 增加 hitokoto.cn 的 API
    fetch("https://v1.hitokoto.cn")
      .then(response => response.json())
      .then(result => {
        // const text = `这句一言来自 <span>「${result.from}」</span>，是 <span>${result.creator}</span> 在 hitokoto.cn 投稿的。`;
        showMessage(result.hitokoto, 6000, 9);
        // setTimeout(() => {
        // 	showMessage(text, 4000, 9);
        // }, 6000);
      });
  }

  function showMessage(text, timeout, priority) {
    if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority)) return;
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }
    text = randomSelection(text);
    sessionStorage.setItem("waifu-text", priority);
    const tips = document.getElementById("waifu-tips");
    tips.innerHTML = text;
    tips.classList.add("waifu-tips-active");
    messageTimer = setTimeout(() => {
      sessionStorage.removeItem("waifu-text");
      tips.classList.remove("waifu-tips-active");
    }, timeout);
  }

  (function initModel() {
    let modelId = localStorage.getItem("modelId"),
      modelTexturesId = localStorage.getItem("modelTexturesId");
    if (modelId === null) {
      modelId = 0; // 模型 ID
      modelTexturesId = 53; // 材质 ID
    }
    loadModel(modelId, modelTexturesId);

    fetch(waifuPath)
      .then(response => response.json())
      .then(result => {
        window.addEventListener("mouseover", event => {
          for (let { selector, text } of result.mouseover) {
            if (!event.target.matches(selector)) continue;
            text = randomSelection(text);
            text = text.replace("{text}", event.target.innerText);
            showMessage(text, 4000, 8);
            return;
          }
        });
        window.addEventListener("click", event => {
          for (let { selector, text } of result.click) {
            if (!event.target.matches(selector)) continue;
            text = randomSelection(text);
            text = text.replace("{text}", event.target.innerText);
            showMessage(text, 4000, 8);
            return;
          }
        });
        result.seasons.forEach(({ date, text }) => {
          const now = new Date(),
            after = date.split("-")[0],
            before = date.split("-")[1] || after;
          if ((after.split("/")[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split("/")[0]) && (after.split("/")[1] <= now.getDate() && now.getDate() <= before.split("/")[1])) {
            text = randomSelection(text);
            text = text.replace("{year}", now.getFullYear());
            //showMessage(text, 7000, true);
            messageArray.push(text);
          }
        });
      });
  })();

  // (function live2dMove() {
  //   var body = document.getElementById("waifu");
  //   body.onmousedown = function (downEvent) {
  //     var location = {
  //       x: downEvent.clientX - this.offsetLeft,
  //       y: downEvent.clientY - this.offsetTop
  //     };
  //
  //     function move(moveEvent) {
  //       body.classList.add("active");
  //       body.classList.remove("right");
  //       body.style.left = (moveEvent.clientX - location.x) + 'px';
  //       body.style.top  = (moveEvent.clientY - location.y) + 'px';
  //       body.style.bottom = "auto";
  //     }
  //
  //     document.addEventListener("mousemove", move);
  //     document.addEventListener("mouseup", function () {
  //       body.classList.remove("active");
  //       document.removeEventListener("mousemove", move);
  //     });
  //   };
  // })();


  async function loadModelList() {
    const response = await fetch(`${cdnPath}model_list.json`);
    modelList = await response.json();
  }

  /**
   * useapi 好看的模型[1-53;1-40]
   * @param modelId
   * @param modelTexturesId
   * @param message
   * @returns {Promise<void>}
   */
  async function loadModel(modelId, modelTexturesId, message) {
    localStorage.setItem("modelId", modelId);
    localStorage.setItem("modelTexturesId", modelTexturesId);
    showMessage(message, 4000, 10);
    if (useCDN) {
      if (!modelList) await loadModelList();
      const target = randomSelection(modelList.models[modelId]);
      loadlive2d("live2d", `${cdnPath}model/${target}`);
    } else {
      loadlive2d("live2d", `${apiPath}get/?id=${modelId}-${modelTexturesId}`);
      console.log(`Live2D 模型 ${modelId}-${modelTexturesId} 加载完成`);
    }
  }

  async function loadRandModel() {
    const modelId = localStorage.getItem("modelId"),
      modelTexturesId = localStorage.getItem("modelTexturesId");
    if (useCDN) {
      if (!modelList) await loadModelList();
      const target = randomSelection(modelList.models[modelId]);
      loadlive2d("live2d", `${cdnPath}model/${target}/index.json`);
    } else {
      // 可选 "rand"(随机), "switch"(顺序)
      fetch(`${apiPath}rand_textures/?id=${modelId}-${modelTexturesId}`)
        .then(response => response.json())
        .then(result => {
          if (result.textures.id === 1 && (modelTexturesId === 1 || modelTexturesId === 0)) showMessage("什么！", 4000, 10);
          else loadModel(modelId, result.textures.id, "喵？");
        });
    }
  }

  async function loadOtherModel() {
    let modelId = localStorage.getItem("modelId");
    if (useCDN) {
      if (!modelList) await loadModelList();
      const index = (++modelId >= modelList.models.length) ? 0 : modelId;
      loadModel(index, 0, modelList.messages[index]);
    } else {
      fetch(`${apiPath}switch/?id=${modelId}`)
        .then(response => response.json())
        .then(result => {
          loadModel(result.model.id, 0, result.model.message);
        });
    }
  }
}

function initWidget(config, apiPath) {
  if (typeof config === "string") {
    config = {
      waifuPath: config,
      apiPath
    };
  }
  document.body.insertAdjacentHTML("beforeend", `<div id="waifu-toggle">
			<span>我在这呢</span>
		</div>`);
  const toggle = document.getElementById("waifu-toggle");
  toggle.addEventListener("click", () => {
    toggle.classList.remove("waifu-toggle-active");
    if (toggle.getAttribute("first-time")) {
      loadWidget(config);
      toggle.removeAttribute("first-time");
    } else {
      localStorage.removeItem("waifu-display");
      document.getElementById("waifu").style.display = "";
      setTimeout(() => {
        document.getElementById("waifu").style.bottom = '-250px';
      }, 0);
    }
  });
  if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") <= 86400000) {
    toggle.setAttribute("first-time", true);
    setTimeout(() => {
      toggle.classList.add("waifu-toggle-active");
    }, 0);
  } else {
    loadWidget(config);
  }
}
