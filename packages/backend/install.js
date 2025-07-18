const Service = require('node-windows').Service
const path = require('path')

// 创建一个新的服务对象
const svc = new Service({
  name: 'iesam',
  description: 'Isle Evrima Storage And Management.',
  // 脚本的绝对路径
  script: path.join(__dirname, 'index.js'),
  // 为服务设置环境变量
  env: {
    name: 'NODE_ENV',
    value: 'prod'
  }
})

// 监听'install'事件，安装完成后启动服务
svc.on('install', function () {
  console.log('Install complete.')
  console.log('Starting service...')
  svc.start()
  console.log('Service started.')
})

// 监听'uninstall'事件，卸载完成后重新安装
svc.on('uninstall', function () {
  console.log('Uninstall complete.')
  console.log('Reinstalling service...')
  svc.install()
})

// 新增：监听错误事件
svc.on('error', function (err) {
  console.error('An error occurred: ', err)
})

// 新增：监听无效安装事件
svc.on('invalidinstallation', function () {
  console.error('Invalid installation detected. Please check the script path and permissions.')
})

// 检查服务是否已存在
if (svc.exists) {
  // 如果服务存在，先卸载它。
  // 'uninstall'事件的监听器会触发后续的安装。
  console.log('Service already exists. Uninstalling...')
  svc.uninstall()
} else {
  // 如果服务不存在，直接安装。
  console.log('Service not found. Installing...')
  svc.install()
}
