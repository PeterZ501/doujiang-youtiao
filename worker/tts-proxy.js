/**
 * Cloudflare Worker - TTS CORS 代理
 * 代理 freetts.org API，添加 CORS 头
 * 
 * 部署方法：
 * 1. 登录 https://dash.cloudflare.com → Workers & Pages → Create
 * 2. 复制此代码粘贴，部署
 * 3. 记下 Worker URL（如 https://tts-proxy.your-name.workers.dev）
 * 4. 在博客设置面板填入此 URL
 */

export default {
  async fetch(request) {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);

    // 路由：/tts → 代理 POST /api/tts
    if (url.pathname === '/tts' && request.method === 'POST') {
      try {
        const body = await request.text();
        const resp = await fetch('https://freetts.org/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
            'Referer': 'https://freetts.org/',
          },
          body: body,
        });
        const data = await resp.text();
        return new Response(data, {
          status: resp.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    // 路由：/audio/{file_id} → 代理 GET /api/audio/{file_id}
    const audioMatch = url.pathname.match(/^\/audio\/(.+)$/);
    if (audioMatch && request.method === 'GET') {
      try {
        const fileId = audioMatch[1];
        const resp = await fetch(`https://freetts.org/api/audio/${fileId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://freetts.org/',
          },
        });
        const blob = await resp.blob();
        return new Response(blob, {
          status: resp.status,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    // 路由：/voices → 返回预设的中文声音列表
    if (url.pathname === '/voices') {
      return new Response(JSON.stringify(CHINESE_VOICES), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response('TTS Proxy is running. Use POST /tts or GET /audio/{file_id}', {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
};

const CHINESE_VOICES = [
  { name: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (温柔)', gender: 'female' },
  { name: 'zh-CN-XiaoyiNeural', label: '晓伊 (甜美)', gender: 'female' },
  { name: 'zh-CN-XiaochenNeural', label: '晓辰 (知性)', gender: 'female' },
  { name: 'zh-CN-XiaohanNeural', label: '晓涵 (优雅)', gender: 'female' },
  { name: 'zh-CN-XiaomengNeural', label: '晓梦 (梦幻)', gender: 'female' },
  { name: 'zh-CN-XiaomoNeural', label: '晓墨 (文艺)', gender: 'female' },
  { name: 'zh-CN-XiaoqiuNeural', label: '晓秋 (成熟)', gender: 'female' },
  { name: 'zh-CN-XiaoruiNeural', label: '晓睿 (智慧)', gender: 'female' },
  { name: 'zh-CN-XiaoshuangNeural', label: '晓双 (活泼)', gender: 'female' },
  { name: 'zh-CN-XiaoxuanNeural', label: '晓萱 (清新)', gender: 'female' },
  { name: 'zh-CN-XiaoyanNeural', label: '晓颜 (柔美)', gender: 'female' },
  { name: 'zh-CN-XiaoyouNeural', label: '晓悠 (悠扬)', gender: 'female' },
  { name: 'zh-CN-XiaozhenNeural', label: '晓甄 (端庄)', gender: 'female' },
  { name: 'zh-CN-YunxiNeural', label: '云希 (清朗)', gender: 'male' },
  { name: 'zh-CN-YunyangNeural', label: '云扬 (阳光)', gender: 'male' },
  { name: 'zh-CN-YunjianNeural', label: '云健 (稳重)', gender: 'male' },
  { name: 'zh-CN-YunfengNeural', label: '云枫 (磁性)', gender: 'male' },
  { name: 'zh-CN-YunhaoNeural', label: '云皓 (豪迈)', gender: 'male' },
  { name: 'zh-CN-YunxiaNeural', label: '云夏 (热情)', gender: 'male' },
  { name: 'zh-CN-YunyeNeural', label: '云野 (野性)', gender: 'male' },
  { name: 'zh-CN-YunzeNeural', label: '云泽 (深沉)', gender: 'male' },
  { name: 'zh-HK-WanLungNeural', label: '云龙 (粤语男)', gender: 'male' },
  { name: 'zh-TW-HsiaoChenNeural', label: '晓臻 (台湾女)', gender: 'female' },
  { name: 'zh-TW-YunJuiNeural', label: '云睿 (台湾男)', gender: 'male' },
];
