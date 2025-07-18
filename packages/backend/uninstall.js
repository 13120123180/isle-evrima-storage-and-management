const Service = require('node-windows').Service
const path = require('path')

// 创建一个服务对象
const svc = new Service({
  name: 'iesam',
  script: path.join(__dirname, 'index.js')
})

// 监听'uninstall'事件
svc.on('uninstall', function () {
  console.log('Uninstall complete.')
  console.log('The service exists: ', svc.exists)
})

// 监听'notuninstalled'事件
svc.on('notuninstalled', function () {
  console.log('Uninstall failed. It may not exist.')
})

// 新增：监听错误事件
svc.on('error', function (err) {
  console.error('An error occurred during uninstall: ', err)
})

// 卸载服务
console.log('Uninstalling service...')
svc.uninstall()
