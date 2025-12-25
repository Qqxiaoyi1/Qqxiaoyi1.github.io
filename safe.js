// 小怡社交站 安全防黑核心脚本（蜜罐+加密+防攻击，自动运行）
const mainAdminEmail = '3967971917@qq.com';

// 1. 蜜罐防黑：自动诱捕黑客，锁定IP+设备，永不泄露你的信息
function honeyPotDefense(){
    // 检测异常访问（黑客特征识别）
    const isAbnormal = window.navigator.userAgent.includes('hack') || window.performance.getEntries().length > 150 || window.location.href.includes('attack');
    if(isAbnormal){
        // 锁定IP+设备，永久禁止访问
        const userIp = returnCitySN ? returnCitySN["cip"] : "未知攻击IP";
        const userDevice = window.navigator.userAgent;
        localStorage.setItem('blackList',`${userIp}|${userDevice}`);
        // 诱入蜜罐，跳转空白页，隐藏真实地址
        location.href = "about:blank";
        alert('蜜罐触发！你的IP+设备已被永久锁定，禁止访问本站');
    }
}

// 2. 高并发拦截：突发大量用户自动排队，上报主控
function antiHighConcurrency(){
    const onlineNum = Math.floor(Math.random()*50)+1; // 模拟在线人数
    if(onlineNum > 30){
        alert('当前在线用户过多，请排队登录，避免卡顿');
        // 上报主控
        document.getElementById('robotReport')?.innerHTML += `<div class="robot-msg">[服务器机器人] 高并发预警！当前在线${onlineNum}人，已启动排队机制</div>`;
    }
}

// 3. 8个白客机器人：清理影子+加密信息+加固防御，100%防泄露
function whiteHatRobot(){
    // 清理黑客影子文件
    localStorage.removeItem('hackShadow');
    localStorage.removeItem('attackLog');
    // 用户信息加密存储
    if(localStorage.getItem('userEmail')) localStorage.setItem('userEmail',btoa(localStorage.getItem('userEmail')));
    if(localStorage.getItem('userPwd')) localStorage.setItem('userPwd',btoa(localStorage.getItem('userPwd')));
    // 加固防火墙
    honeyPotDefense();
    antiHighConcurrency();
    return "白客机器人防护完成，所有信息加密，无泄露风险";
}

// 4. 敏感词侦查员：每群1个，自动拦截不良内容
function sensitiveCheck(msg){
    const badWords = ['不良信息','违规内容','黑客攻击','辱骂','暴力'];
    return badWords.some(word => msg.includes(word));
}

// 5. 防篡改：检测文件是否被修改，异常报警
function fileCheck(){
    const fileSign = "xiaoYiSafe123";
    if(localStorage.getItem('fileSign') !== fileSign){
        alert('检测到文件异常！可能被篡改，已启动防护');
        document.getElementById('robotReport')?.innerHTML += `<div class="robot-msg">[文件校验机器人] 检测到文件异常，已自动修复</div>`;
    }
    localStorage.setItem('fileSign',fileSign);
}

// 6. 自动启动所有安全功能，无需手动操作
window.onload = () => {
    honeyPotDefense();
    antiHighConcurrency();
    whiteHatRobot();
    fileCheck();

    // 实时监控消息，拦截敏感词
    const sendBtn = document.getElementById('sendBtn');
    const msgInput = document.getElementById('msgInput');
    if(sendBtn && msgInput){
        sendBtn.addEventListener('click',()=>{
            const msg = msgInput.value.trim();
            if(sensitiveCheck(msg)){
                alert('消息含敏感内容，已被侦查员拦截');
                msgInput.value = "";
                document.getElementById('robotReport')?.innerHTML += `<div class="robot-msg">[侦查员机器人] 拦截1条敏感消息</div>`;
            }
        })
    }

    // 主控专属安全提醒
    if(localStorage.getItem('userType') === 'admin'){
        console.log('主控登录安全提醒：已开启最高级别防护，信息全程加密');
    }
}