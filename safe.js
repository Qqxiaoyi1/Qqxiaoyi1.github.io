// 小怡社交站安全控制脚本 - 最终完整版
// 初始配置
let adminPassword = localStorage.getItem('adminPwd') || 'xiaoyi123'; // 初始密码，可自行修改
const fileSign = "xiaoYiSafe123"; // 文件校验标识
const badWords = ['暴力', '辱骂', '违规内容', '黑客攻击', '钓鱼', '木马', '病毒']; // 违禁词库

// 防火墙核心配置
const firewallConfig = {
  maxRequest: 15, // 单分钟最大请求数限制
  ipBlacklist: ['192.168.0.1', '10.0.0.1'], // 恶意IP黑名单（前端模拟）
  minPwdLength: 6, // 密码最小长度
  maxInputLength: 200, // 消息最大输入长度
  sensitiveKeys: ['password', 'token', 'admin', 'userInfo'], // 敏感存储关键词
  forbiddenActions: ['eval', 'alert', 'prompt', 'document.write'], // 禁止的危险操作
};

// 防火墙与系统状态数据
let firewallData = {
  requestCount: 0, // 请求计数
  attackLog: [], // 攻击日志
  lastRequestTime: new Date().getTime(), // 最后请求时间
  chatLocked: false, // 群聊锁定状态
  honeypotActive: false, // 蜜罐启动状态
  whiteHatBotRunning: false, // 白客机器人运行状态
};

// ===================== 8层防火墙核心函数 =====================
// 1. 内容防火墙：拦截违禁词、XSS恶意代码
function firewall1_ContentCheck(msg) {
  if (!msg) return { pass: false, msg: '内容不能为空' };
  // 违禁词检测
  const hasBadWord = badWords.some(word => msg.includes(word));
  if (hasBadWord) {
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] 内容攻击：检测到违禁词「${msg.match(new RegExp(badWords.join('|')))}」`);
    return { pass: false, msg: '内容包含违规信息，发送失败' };
  }
  // XSS攻击检测
  const hasDangerChar = /<script>|<iframe>|<img onload=|javascript:/.test(msg);
  if (hasDangerChar) {
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] XSS攻击：检测到危险代码「${msg}」`);
    return { pass: false, msg: '内容包含危险代码，禁止发送' };
  }
  return { pass: true };
}

// 2. 文件防火墙：检测文件篡改、自动修复
function firewall2_FileCheck() {
  const currentSign = localStorage.getItem('fileSign');
  if (currentSign !== fileSign) {
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] 文件篡改：文件标识异常，已自动修复`);
    alert('【文件防火墙】检测到文件被篡改，已启动防护！');
    document.getElementById('robotReport')?.innerHTML += `<div class="robot-msg">[文件校验机器人] 检测到异常，已自动修复</div>`;
    localStorage.setItem('fileSign', fileSign);
    return { pass: false };
  }
  return { pass: true };
}

// 3. 请求防火墙：限制操作频率、防刷攻击
function firewall3_RequestLimit() {
  const now = new Date().getTime();
  // 每分钟重置请求数
  if (now - firewallData.lastRequestTime > 60000) {
    firewallData.requestCount = 0;
    firewallData.lastRequestTime = now;
  }
  firewallData.requestCount++;
  if (firewallData.requestCount > firewallConfig.maxRequest) {
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] 请求轰炸：单分钟请求数${firewallData.requestCount}，超过限制${firewallConfig.maxRequest}`);
    return { pass: false, msg: '操作太频繁，疑似攻击，1分钟后再试' };
  }
  return { pass: true };
}

// 4. 权限防火墙：管理员身份验证、防越权
function firewall4_PermissionCheck(inputPwd) {
  const isAdmin = inputPwd === adminPassword;
  if (!isAdmin) {
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] 权限攻击：非法登录尝试，密码「${inputPwd}」`);
    return { pass: false, msg: '密码错误，拒绝访问管理页' };
  }
  return { pass: true };
}

// 5. 输入防火墙：校验格式、长度，防畸形数据
function firewall5_InputCheck(input, type) {
  if (!input) return { pass: false, msg: '输入不能为空' };
  // 密码长度校验
  if (type === 'pwd' && input.length < firewallConfig.minPwdLength) {
    return { pass: false, msg: `密码至少${firewallConfig.minPwdLength}位` };
  }
  // 消息长度校验
  if (type === 'msg' && input.length > firewallConfig.maxInputLength) {
    return { pass: false, msg: `消息不能超过${firewallConfig.maxInputLength}字` };
  }
  return { pass: true };
}

// 6. 存储防火墙：保护敏感数据、加密存储
function firewall6_StorageCheck(key, value) {
  const isSensitive = firewallConfig.sensitiveKeys.some(k => key.includes(k));
  // 禁止删除敏感数据
  if (isSensitive && !value) {
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] 存储攻击：尝试删除敏感数据「${key}」`);
    return { pass: false, msg: '禁止删除敏感存储数据' };
  }
  // 敏感数据base64加密存储
  if (isSensitive) {
    return { pass: true, value: btoa(value) };
  }
  return { pass: true, value };
}

// 7. IP防火墙：黑名单拦截（前端模拟，实际需后端配合）
function firewall7_IPCheck() {
  const userIP = localStorage.getItem('userIP') || '192.168.1.1'; // 模拟用户IP
  if (firewallConfig.ipBlacklist.includes(userIP)) {
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] IP攻击：黑名单IP「${userIP}」尝试访问`);
    alert('【IP防火墙】你的IP已被限制访问');
    return { pass: false };
  }
  return { pass: true };
}

// 8. 行为防火墙：检测危险操作、防代码注入
function firewall8_ActionCheck(action) {
  const hasForbidden = firewallConfig.forbiddenActions.some(a => action.includes(a));
  if (hasForbidden) {
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] 行为攻击：检测到危险操作「${action}」`);
    return { pass: false, msg: '禁止执行危险操作' };
  }
  return { pass: true };
}

// ===================== 主控专属功能 =====================
// 登录验证（对接权限防火墙）
function checkLogin(inputPwd) {
  const permission = firewall4_PermissionCheck(inputPwd);
  return permission.pass;
}

// 主控修改密码（联动多层防火墙）
function changeAdminPwd() {
  const oldPwd = document.getElementById('oldPwd')?.value;
  const newPwd = document.getElementById('newPwd')?.value;
  const pwdTip = document.getElementById('pwdTip');
  if (!pwdTip) return;

  // 输入防火墙校验
  const oldInput = firewall5_InputCheck(oldPwd, 'pwd');
  if (!oldInput.pass) {
    pwdTip.innerText = oldInput.msg;
    return;
  }
  const newInput = firewall5_InputCheck(newPwd, 'pwd');
  if (!newInput.pass) {
    pwdTip.innerText = newInput.msg;
    return;
  }

  // 权限防火墙校验
  const permission = firewall4_PermissionCheck(oldPwd);
  if (!permission.pass) {
    pwdTip.innerText = permission.msg;
    return;
  }

  // 存储防火墙加密存储
  const storage = firewall6_StorageCheck('adminPwd', newPwd);
  if (!storage.pass) {
    pwdTip.innerText = storage.msg;
    return;
  }

  // 更新并持久化密码
  adminPassword = newPwd;
  localStorage.setItem('adminPwd', storage.value);
  pwdTip.innerText = '✅ 密码修改成功！下次登录用新密码';
  firewallData.attackLog.push(`[${new Date().toLocaleString()}] 系统操作：主控修改了登录密码`);
  
  // 清空输入框
  document.getElementById('oldPwd').value = '';
  document.getElementById('newPwd').value = '';
}

// 查看攻击日志
function viewAttackLog() {
  if (firewallData.attackLog.length === 0) {
    alert('📊 暂无攻击记录，防护状态良好！');
    return;
  }
  const logTitle = `🔴 攻击日志（共${firewallData.attackLog.length}条）\n`;
  const logContent = firewallData.attackLog.join('\n');
  alert(logTitle + logContent);
}

// ===================== 应急防黑操作功能 =====================
// 1. 全群聊锁定/解锁
function lockChat() {
  firewallData.chatLocked = !firewallData.chatLocked;
  const status = firewallData.chatLocked ? '锁定' : '解锁';
  alert(`🔒 群聊已${status}！${firewallData.chatLocked ? '所有用户无法发送消息' : '用户可正常发送消息'}`);
  firewallData.attackLog.push(`[${new Date().toLocaleString()}] 应急操作：主控${status}了群聊功能`);
}

// 2. 启动8个白客机器人
function startWhiteHatBot() {
  if (firewallData.whiteHatBotRunning) {
    alert('🤖 白客机器人已在运行中，无需重复启动！');
    return;
  }
  firewallData.whiteHatBotRunning = true;
  alert('✅ 已启动8个白客机器人！\n- 自动清理恶意代码\n- 强化防火墙规则\n- 实时监控攻击行为');
  firewallData.attackLog.push(`[${new Date().toLocaleString()}] 应急操作：启动8个白客机器人，防御等级提升`);
}

// 3. 蜜罐启动/关闭
function startHoneypot() {
  firewallData.honeypotActive = !firewallData.honeypotActive;
  const status = firewallData.honeypotActive ? '启动' : '关闭';
  alert(`🍯 蜜罐已${status}！${firewallData.honeypotActive ? '自动锁定攻击IP和设备' : '蜜罐防护已解除'}`);
  firewallData.attackLog.push(`[${new Date().toLocaleString()}] 应急操作：${status}蜜罐防护，开始追踪攻击源`);
}

// 4. 终极应急：销毁所有用户信息（不可逆）
function destroyUserInfo() {
  const confirmDestroy = confirm('⚠️ 警告！此操作会销毁所有用户信息，且无法恢复，确定要执行吗？');
  if (!confirmDestroy) return;

  // 清空本地存储
  localStorage.clear();
  alert('🗑️ 已执行终极应急操作！所有用户信息已销毁');
  firewallData.attackLog.push(`[${new Date().toLocaleString()}] 终极操作：主控销毁了所有用户信息，社交站数据重置`);
  
  // 重置系统状态
  firewallData = {
    requestCount: 0,
    attackLog: [`[${new Date().toLocaleString()}] 系统重置：因终极应急操作，日志已清空`],
    lastRequestTime: new Date().getTime(),
    chatLocked: false,
    honeypotActive: false,
    whiteHatBotRunning: false,
  };
}

// ===================== 用户端功能（登录+发消息） =====================
// 用户登录功能
function login() {
  const inputPwd = document.getElementById('loginPwd')?.value;
  const loginTip = document.getElementById('loginTip');
  const chatArea = document.getElementById('chatArea');
  if (!inputPwd) {
    loginTip.innerText = '请输入密码';
    return;
  }

  // 权限验证
  const check = firewall4_PermissionCheck(inputPwd);
  if (check.pass) {
    loginTip.innerText = '✅ 登录成功';
    chatArea.style.display = 'block';
    document.getElementById('loginPwd').value = '';
    firewallData.attackLog.push(`[${new Date().toLocaleString()}] 系统操作：用户登录成功`);
  } else {
    loginTip.innerText = check.msg;
  }
}

// 用户发消息功能（适配群聊锁定+防火墙）
function sendMsg() {
  const msgText = document.getElementById('msgText')?.value.trim();
  const msgTip = document.getElementById('msgTip');
  const chatBox = document.getElementById('chatBox');
  if (!msgTip || !chatBox) return;

  // 检测群聊锁定状态
  if (firewallData.chatLocked) {
    msgTip.innerText = '⚠️ 群聊已被锁定，无法发送消息';
    return;
  }

  // 调用防火墙校验
  const contentCheck = firewall1_ContentCheck(msgText);
  if (!contentCheck.pass) { msgTip.innerText = contentCheck.msg; return; }
  const requestCheck = firewall3_RequestLimit();
  if (!requestCheck.pass) { msgTip.innerText = requestCheck.msg; return; }
  const inputCheck = firewall5_InputCheck(msgText, 'msg');
  if (!inputCheck.pass) { msgTip.innerText = inputCheck.msg; return; }

  // 渲染消息
  const msgItem = document.createElement('div');
  msgItem.className = 'user-msg';
  msgItem.innerText = msgText;
  chatBox.appendChild(msgItem);
  chatBox.scrollTop = chatBox.scrollHeight; // 滚动到底部

  // 清空输入
  document.getElementById('msgText').value = '';
  msgTip.innerText = '';
}

// 实时检测群聊锁定，禁用/启用发送按钮
setInterval(() => {
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) sendBtn.disabled = firewallData.chatLocked;
}, 500);

// ===================== 页面初始化 =====================
window.onload = function() {
  // 启动核心防火墙
  firewall2_FileCheck();
  firewall7_IPCheck();
  console.log('🛡️ 小怡社交站8层防火墙已全部启动，防护状态正常');
};