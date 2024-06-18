###仿钉钉日历组件 支持月与周两种模式的左右滑动切换 支持在 APP、小程序、H5 运行

## props

duration Number 300 动画时长
cellHeight Number 75 日历每一列的高度，单位为 rpx
dateActiveColor String #FE6601 日期选中颜色
sundayIndex Number 6 星期天所在位置，范围为 0~6
mode String 'open' 日历模式 'open'为月历 'close'为周历
changeSetDefault Boolean true 月历切换是否默认选中 1 号

## methods

goToDate 切换到某一天日期 格式 YYYY-MM 或者 YYYY-MM-DD

## event

change 日历选中日期改变事件回调
