export const banTypes = [
  { label: '加速', value: 'jiasu' },
  { label: '透视', value: 'toushi' },
  { label: '瞬移', value: 'shunyi' },
  { label: '增伤', value: 'zengshang' },
  { label: '秒杀', value: 'miaosha' },
  { label: '控制对手', value: 'kongzhiduishou' },
  { label: '无敌', value: 'wudi' },
  { label: '免伤', value: 'mianshang' },
  { label: '范围伤害', value: 'fanweishanghai' },
  { label: '网络丢包', value: 'wangluodiubao' },
  { label: '其他', value: 'qita' },
];

const banTypeMap = new Map(banTypes.map(item => [item.value, item.label]));

export const getBanTypeLabel = (value) => {
  return banTypeMap.get(value) || '未知';
};
