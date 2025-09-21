const http = require('http');

// 测试应用是否正常运行
function testApp() {
  const options = {
    hostname: 'localhost',
    port: 5174,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`状态信息: ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ 应用运行正常！');
        console.log(`响应长度: ${data.length} 字符`);
        
        // 检查是否包含关键内容
        if (data.includes('项目管理')) {
          console.log('✅ 项目管理功能已加载');
        }
        if (data.includes('看板')) {
          console.log('✅ 看板功能已加载');
        }
      } else {
        console.log(`⚠️  应用返回状态码: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (err) => {
    console.log(`❌ 无法连接到应用: ${err.message}`);
    console.log('📋 请确保开发服务器已启动 (npm run dev)');
  });

  req.on('timeout', () => {
    console.log('⏰ 连接超时，请检查服务器状态');
    req.destroy();
  });

  req.end();
}

console.log('🧪 测试Trello风格项目管理应用...');
testApp();